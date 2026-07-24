import React, { useEffect, useRef, useState } from 'react';
import { Tooltip, useStyles2 } from '@grafana/ui';

import { applyNamespaceProjectionStrategies, getMapglFeatureServices } from '../../extension-points/featureContracts';
import type { Graph, GraphEdgeIndex } from '../../graph/main';
import type { LayerDragShift } from '../../types';
import { colTypes } from '../../types';
import type { LayerTreeInfo, VisLayers } from '../../store';
import { getStyles } from './LayerSwitcher.styles';

const CSS_PREFIX = 'layer-switcher-';

export interface LayerSwitcherPanel {
  visLayers?: VisLayers;
  graph: Graph;
  graphEdgeIndex?: GraphEdgeIndex;
  isLogic?: boolean;
  positions?: Float64Array;
  layerShift?: LayerDragShift;
  namespaceProjection?: unknown;
}

export interface LayerSwitcherInlineControlContext<TPanel extends LayerSwitcherPanel = LayerSwitcherPanel> {
  panel: TPanel;
  layer: LayerTreeInfo;
  depth: number;
  requestRefresh(): void;
  requestRender(): void;
}

export interface LayerSwitcherInlineControl<TPanel extends LayerSwitcherPanel = LayerSwitcherPanel> {
  id: string;
  shouldRender?: (context: LayerSwitcherInlineControlContext<TPanel>) => boolean;
  render: (context: LayerSwitcherInlineControlContext<TPanel>) => HTMLElement | null;
}

export interface LayerSwitcherProps<TPanel extends LayerSwitcherPanel = LayerSwitcherPanel> {
  label: string;
  className?: string;
  panel: TPanel;
  setVisRefresh: (value: number) => void;
  inlineControls?: Array<LayerSwitcherInlineControl<TPanel>>;
}

interface RenderOptions {
  groupSelectStyle: 'group' | 'children' | 'none';
  reverse: boolean;
}

interface RenderContext<TPanel extends LayerSwitcherPanel = LayerSwitcherPanel> {
  panel: TPanel;
  setVisRefresh: (value: number) => void;
  inlineControls: Array<LayerSwitcherInlineControl<TPanel>>;
}

const defaultOptions: RenderOptions = {
  groupSelectStyle: 'group',
  reverse: false,
};

const LayerSwitcher = <TPanel extends LayerSwitcherPanel = LayerSwitcherPanel>({
  label,
  className = '',
  panel,
  setVisRefresh,
  inlineControls = [],
}: LayerSwitcherProps<TPanel>) => {
  const { visLayers } = panel;
  const styles = useStyles2(getStyles);

  const [panelVisible, setPanelVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const hiddenClassName = `ol-control yo layer-switcher${isTouchDevice() ? ' touch' : ''}`;

  const renderPanel = () => {
    const panelElement = panelRef.current;
    if (!panelElement) {
      return;
    }
    renderLayerSwitcherPanel(
      {
        panel,
        setVisRefresh,
        inlineControls,
      },
      panelElement,
      defaultOptions
    );
  };

  useEffect(() => {
    if (panelVisible) {
      renderPanel();
    }
  }, [panelVisible, visLayers, inlineControls]);

  return (
    <div ref={elementRef} className={`${styles.root} ${hiddenClassName} ${panelVisible ? 'shown' : ''} ${className}`}>
      <div className={styles.toggleWrapper}>
        <Tooltip content={label}>
          <button
            className={`${styles.toggleButton} ${panelVisible ? styles.toggleButtonOpen : ''}`}
            type="button"
            aria-label={label}
            aria-expanded={panelVisible}
            onClick={() => setPanelVisible((visible) => !visible)}
          >
            <span className={`${styles.toggleIcon} ${panelVisible ? '' : styles.toggleIconClosed}`}>››</span>
          </button>
        </Tooltip>
      </div>
      {panelVisible && <div ref={panelRef} className="panel" onPointerDown={(event) => event.stopPropagation()}></div>}
    </div>
  );
};

function isTouchDevice() {
  try {
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
}

function renderLayerSwitcherPanel<TPanel extends LayerSwitcherPanel>(
  context: RenderContext<TPanel>,
  panelElement: HTMLElement,
  options: RenderOptions
) {
  const renderEvent = new Event('render');
  panelElement.dispatchEvent(renderEvent);

  while (panelElement.firstChild) {
    panelElement.removeChild(panelElement.firstChild);
  }

  const visLayers = context.panel.visLayers;
  if (!visLayers) {
    return;
  }

  if (options.groupSelectStyle === 'children' || options.groupSelectStyle === 'none') {
    visLayers.setGroupVisibility();
  } else if (options.groupSelectStyle === 'group') {
    visLayers.setChildVisibility();
  }

  const ul = document.createElement('ul');
  panelElement.appendChild(ul);

  const layers = visLayers.getLayerTree();
  renderLayers(layers, context, ul, options, function render() {
    renderLayerSwitcherPanel(context, panelElement, options);
  });
}

function renderLayer<TPanel extends LayerSwitcherPanel>(
  context: RenderContext<TPanel>,
  lyr: LayerTreeInfo,
  idx: number,
  options: RenderOptions,
  render: (changedLayer: LayerTreeInfo) => void,
  depth = 0
) {
  const li = document.createElement('li');
  const { label: lyrLabel } = lyr || {};
  const checkboxId = uuid();
  const label = document.createElement('label');
  const hasChildren = lyr.children.length > 0;

  const serviceGroups = [
    'graph',
    colTypes.Clusters,
    colTypes.Circle,
    colTypes.SVG,
    colTypes.Label,
    colTypes.Comments,
    colTypes.Edges,
    colTypes.Routed,
  ];

  if (lyr.group && (hasChildren || lyr.group === colTypes.Clusters) && !lyr.combine) {
    const hasGraph = context.panel.visLayers?.hasGraph() ?? false;

    if (!serviceGroups.includes(lyr.group) || hasGraph) {
      if (!serviceGroups.includes(lyr.group) || lyr.group === 'graph') {
        li.classList.add('group');
      }

      if (depth > 0 && typeof lyr.fold === 'boolean') {
        li.classList.add(CSS_PREFIX + 'fold');
        li.classList.add(CSS_PREFIX + (lyr.fold ? 'close' : 'open'));
        const btn = document.createElement('button');
        const icon = document.createElement('span');
        icon.className = 'layer-switcher-group-icon';
        icon.textContent = '>';
        btn.appendChild(icon);
        btn.onclick = function (e) {
          const evt = e || window.event;
          toggleFold(lyr, li, context.panel.visLayers);
          evt.preventDefault();
        };
        li.appendChild(btn);
      }

      if (options.groupSelectStyle !== 'none') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = checkboxId;
        input.checked = lyr.visible;
        input.indeterminate = lyr.indeterminate ?? false;
        input.onchange = function (e) {
          const target = e.target as HTMLInputElement;
          setVisible(context.panel, lyr, target?.checked, options.groupSelectStyle);
          context.setVisRefresh(Math.random() + 1);
          render(lyr);
        };
        li.appendChild(input);

        label.htmlFor = checkboxId;
      }

      label.textContent = lyrLabel;
      appendInlineControls(context, label, lyr, depth, render);
      li.appendChild(label);

      const ul = document.createElement('ul');
      li.appendChild(ul);
      renderLayers(lyr.children, context, ul, options, render, depth + 1);
    }
  } else {
    li.className = 'layer';
    const input = document.createElement('input');
    input.type = 'checkbox';

    input.id = checkboxId;
    input.checked = lyr.visible;
    input.indeterminate = lyr.indeterminate ?? false;
    input.onchange = function (e) {
      const target = e.target as HTMLInputElement;
      setVisible(context.panel, lyr, target.checked, options.groupSelectStyle);
      context.setVisRefresh(Math.random() + 1);
      render(lyr);
    };
    li.appendChild(input);

    label.htmlFor = checkboxId;
    label.textContent = lyrLabel;
    appendInlineControls(context, label, lyr, depth, render);
    li.appendChild(label);
  }

  return li;
}

function appendInlineControls<TPanel extends LayerSwitcherPanel>(
  context: RenderContext<TPanel>,
  label: HTMLLabelElement,
  layer: LayerTreeInfo,
  depth: number,
  render: (changedLayer: LayerTreeInfo) => void
) {
  const controlContext: LayerSwitcherInlineControlContext<TPanel> = {
    panel: context.panel,
    layer,
    depth,
    requestRefresh: () => context.setVisRefresh(Math.random() + 1),
    requestRender: () => render(layer),
  };

  for (const control of context.inlineControls) {
    if (control.shouldRender && !control.shouldRender(controlContext)) {
      continue;
    }

    const element = control.render(controlContext);
    if (element) {
      label.appendChild(element);
    }
  }
}

function renderLayers<TPanel extends LayerSwitcherPanel>(
  layers: LayerTreeInfo[],
  context: RenderContext<TPanel>,
  elm: HTMLElement,
  options: RenderOptions,
  render: (changedLayer: LayerTreeInfo) => void,
  depth = 0
) {
  let children = [...layers];
  if (options.reverse) {
    children.reverse();
  }

  for (let i = 0, l: LayerTreeInfo; i < children.length; i++) {
    l = children[i];
    if (l.name) {
      elm.appendChild(renderLayer(context, l, i, options, render, depth));
    }
  }
}

function setVisible<TPanel extends LayerSwitcherPanel>(
  panel: TPanel,
  lyr: LayerTreeInfo,
  visible: boolean,
  groupSelectStyle: RenderOptions['groupSelectStyle']
) {
  const { visLayers, graph } = panel;
  if (!visLayers) {
    return;
  }

  const clusters = Array.from(graph.subgraphsBreadthFirst()) as Graph[];
  const graphs: Graph[] = clusters.concat([graph as Graph]);

  visLayers.setVisible(lyr.index, lyr.name, lyr.group, visible);

  if (lyr.group && !lyr.combine && groupSelectStyle === 'children') {
    lyr.children.forEach((l) => {
      setVisible(panel, l, visible, groupSelectStyle);
    });
  }

  const allNameSpaces = Array.from(graphs).map((el) => el.id);
  const visibleNamespaces = visLayers.getCategories()[1];

  if ((panel.isLogic && lyr.group === 'graph') || allNameSpaces.includes(lyr.name)) {
    panel.namespaceProjection = applyNamespaceProjectionStrategies(
      getMapglFeatureServices().namespaceProjectionStrategies,
      {
        graph,
        edgeIndex: panel.graphEdgeIndex,
        visibleNamespaces: new Set(visibleNamespaces),
        allNamespaces: new Set(allNameSpaces),
        positions: panel.positions ?? new Float64Array(),
        layerShift: panel.layerShift,
        panel: panel,
      }
    );
  }
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toggleFold(lyr: LayerTreeInfo, li: HTMLLIElement, visLayers?: VisLayers) {
  li.classList.remove(CSS_PREFIX + (lyr.fold ? 'close' : 'open'));
  const nextFold = !lyr.fold;
  lyr.fold = nextFold;
  li.classList.add(CSS_PREFIX + (nextFold ? 'close' : 'open'));
  visLayers?.setFold(lyr.index, nextFold);
}

export default LayerSwitcher;
