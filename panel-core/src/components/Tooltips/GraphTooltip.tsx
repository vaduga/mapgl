import React, { useEffect, useState, type ReactNode } from 'react';
import { reaction } from 'mobx';
import type { PanelController } from '../../runtime/PanelController';
import { getMapglFeatureServices } from '../../extension-points/featureServices';
import type {
  MapglFeatureServices,
  TooltipEdgeRecord,
  TooltipEdgeSection,
  TooltipEdgeSectionContributor,
} from '../../extension-points/contracts';
import type { GraphHighlighter } from '../../deckLayers/GraphHighlighter';
import { getTooltipEdgeSections, type TooltipEdgeDirection } from './tooltipEdgeSections';
import { blankHoverInfo } from '../../types/defaults';
import {
  inspectGraphTooltip,
  inspectTooltipEdge,
  rebindGraphTooltip,
  tooltipFocus,
  type GraphTooltipTarget,
  type TooltipInspection,
  type TooltipScene,
} from './graphTooltipModel';
import { TooltipView, type TooltipFrameProps, type TooltipPresentation } from './TooltipView';
import type { TooltipContent } from './TooltipContent';

function sameTarget(a: GraphTooltipTarget, b: GraphTooltipTarget) {
  return a.kind === b.kind && a.key === b.key && a.hop?.unit === b.hop?.unit && a.hop?.ordinal === b.hop?.ordinal;
}

export interface GraphTooltipProps {
  readonly controller: PanelController;
  readonly presentation?: TooltipPresentation;
  readonly scene?: TooltipScene;
  readonly info?: unknown;
  readonly dark?: boolean;
  readonly isRouted?: boolean;
  readonly featureServices?: Pick<MapglFeatureServices, 'tooltipEdgeSections'>;
  readonly getContent: (inspection: TooltipInspection) => TooltipContent | undefined;
  readonly renderActions?: (inspection: TooltipInspection) => ReactNode;
  readonly onSelect?: (inspection: TooltipInspection) => void;
  readonly onClose?: () => void;
  readonly renderFrame?: (props: TooltipFrameProps) => ReactNode;
}

/** Shared graph binding. Native source formatting and services stay in the caller. */
export function GraphTooltip({
  controller,
  scene: suppliedScene,
  info,
  dark,
  isRouted,
  featureServices,
  getContent,
  renderActions,
  onSelect,
  onClose,
  renderFrame,
  presentation,
}: GraphTooltipProps) {
  const [, redraw] = useState(0);
  const store = controller.stores.pointStore;
  const [dismissed] = useState(() => new WeakSet<object>());
  useEffect(() => {
    const notify = () => redraw((value) => value + 1);
    const unsubscribe = controller.scene.subscribe(notify);
    const stop = reaction(
      () => [store.graphTooltip, store.getTooltipObject, store.getisEdgeListed, store.isDefDir],
      notify
    );
    return () => {
      unsubscribe();
      stop();
    };
  }, [controller, store]);
  const scene: TooltipScene = suppliedScene ?? {
    snapshot: controller.state?.snapshot,
    render: controller.scene.render,
    isRouted,
  };
  const pinnedPick: any = (info as any)?.mapglPinned ? info : store.getTooltipObject;
  const seed =
    pinnedPick && typeof pinnedPick === 'object' && dismissed.has(pinnedPick)
      ? undefined
      : inspectGraphTooltip(scene, pinnedPick);
  const retained = store.graphTooltip;
  const pinnedInspection = retained ? rebindGraphTooltip(scene, retained.target) : seed;
  const hoverPick = info as any;
  const hovered =
    hoverPick &&
    !hoverPick.mapglPinned &&
    hoverPick.picked !== false &&
    hoverPick.index !== -1 &&
    !(typeof hoverPick === 'object' && dismissed.has(hoverPick))
      ? inspectGraphTooltip(scene, hoverPick)
      : undefined;
  const hoverOverride = hovered && (!pinnedInspection || !sameTarget(hovered.target, pinnedInspection.target));
  const inspection = hoverOverride ? hovered : pinnedInspection;
  const pinned = !hoverOverride && Boolean(retained || seed);
  const dismissCurrentHover = () => {
    if (info && typeof info === 'object') {
      dismissed.add(info);
    }
  };
  const point: any = pinned ? (retained?.anchor ?? pinnedPick) : info;
  const anchor = { x: Number(point?.x ?? 0), y: Number(point?.y ?? 0) };
  useEffect(() => {
    if (!store.graphTooltip && seed) {
      store.setGraphTooltip({ target: seed.target, anchor });
    }
    // A native pin event is a seed; subsequent frames rebind its stable target.
  }, [store, pinnedPick]);
  useEffect(() => {
    if (retained && !pinnedInspection) {
      store.setGraphTooltip(undefined);
      store.setTooltipObject(blankHoverInfo);
    }
  }, [store, retained, pinnedInspection]);
  useEffect(() => {
    if (retained?.target.hop && scene.isRouted === false && pinnedInspection) {
      store.setGraphTooltip({ ...retained, target: pinnedInspection.target });
    }
  }, [store, retained, scene.isRouted, pinnedInspection]);
  if (!inspection) {
    return null;
  }
  const content = getContent(inspection);
  if (!content) {
    return null;
  }
  const context = !hoverOverride && retained?.context ? rebindGraphTooltip(scene, retained.context) : inspection;
  const sections = graphTooltipSections(
    scene,
    context ?? inspection,
    store.graphHighlighter,
    (featureServices ?? getMapglFeatureServices()).tooltipEdgeSections
  );
  const listDirection = context?.edge ? retained?.section?.direction : store.isDefDir ? 'outgoing' : 'incoming';
  const isListed = (section: TooltipEdgeSection, direction: TooltipEdgeDirection) =>
    store.getisEdgeListed &&
    (!retained?.section || retained.section.id === section.id) &&
    listDirection === direction;
  const restoreFocus = () => {
    const retainedTarget = store.graphTooltip?.target;
    const retainedInspection = retainedTarget ? rebindGraphTooltip(scene, retainedTarget) : pinnedInspection;
    store.focus(tooltipFocus(retainedInspection ?? inspection));
  };
  const selectRecord = (record: TooltipEdgeRecord) => {
    const picked = inspectTooltipEdge(scene, record.edge);
    const next =
      picked &&
      rebindGraphTooltip(
        { snapshot: controller.state?.snapshot, render: controller.scene.render, isRouted: scene.isRouted },
        picked.target
      );
    if (!next?.edge) {
      return;
    }
    dismissCurrentHover();
    store.setSelEdges([next.edge]);
    store.setGraphTooltip({
      target: next.target,
      anchor,
      context: retained?.context ?? context?.target,
      section: retained?.section,
    });
    store.focus(tooltipFocus(next));
    onSelect?.(next);
  };
  return (
    <TooltipView
      title={context?.title ?? inspection.title}
      presentation={presentation}
      selectedEdgeId={!hoverOverride && retained?.context ? inspection.edge?.id : undefined}
      anchor={anchor}
      pinned={pinned}
      dark={dark}
      {...content}
      actions={renderActions?.(inspection)}
      renderFrame={renderFrame}
      originalEdge={
        context?.edge
          ? {
              id: context.target.key,
              edge: context.edge,
              source: context.edge.source,
              target: context.edge.target,
              edgeRef: context.edgeRef,
              properties: context.feature,
            }
          : undefined
      }
      sections={sections}
      getIconName={(_section, direction) =>
        context?.edge
          ? direction === 'outgoing'
            ? 'angle-left'
            : 'angle-right'
          : direction === 'outgoing'
            ? 'arrow-up'
            : 'arrow-down'
      }
      isListed={isListed}
      onToggle={(section, direction) => {
        dismissCurrentHover();
        const listed = isListed(section, direction);
        if (!context?.edge) {
          store.setIsDefDir(direction === 'outgoing');
        }
        store.setEdgeListed(!listed);
        store.setGraphTooltip({
          target: inspection.target,
          anchor,
          context: retained?.context,
          section: { id: section.id, direction },
        });
        restoreFocus();
      }}
      onFocus={(records) => store.setFocusedEdges(records.map((record) => record.edge))}
      onFocusEnd={restoreFocus}
      onSelect={selectRecord}
      onClose={() => {
        dismissCurrentHover();
        if (pinnedPick && typeof pinnedPick === 'object') {
          dismissed.add(pinnedPick);
        }
        store.setGraphTooltip(undefined);
        store.setTooltipObject(blankHoverInfo);
        restoreFocus();
        onClose?.();
      }}
    />
  );
}

export function graphTooltipSections(
  scene: TooltipScene,
  inspection: TooltipInspection,
  highlighter: GraphHighlighter,
  contributors: TooltipEdgeSectionContributor[]
) {
  highlighter.setGraph(scene.render.graph, { edgeIndex: scene.render.edgeIndex });
  return getTooltipEdgeSections(contributors, {
    graph: inspection.graph,
    edgeIndex: scene.render.edgeIndex,
    node: inspection.node,
    edge: inspection.edge,
    feature: inspection.feature,
    adjacentEdges: inspection.edge
      ? undefined
      : {
          incoming: highlighter.getInEdges(inspection.node),
          outgoing: highlighter.getOutEdges(inspection.node),
        },
  });
}

export * from './TooltipContent';
export * from './TooltipView';
export { TooltipIconButton } from './TooltipIcon';
export {
  inspectGraphTooltip,
  inspectTooltipEdge,
  rebindGraphTooltip,
  type GraphTooltipTarget,
  type GraphTooltipState,
  type TooltipInspection,
  type TooltipScene,
} from './graphTooltipModel';
