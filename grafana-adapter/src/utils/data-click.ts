import { clearTooltipInteraction } from '@vaduga/mapgl-core/utils';
export { clearTooltipInteraction } from '@vaduga/mapgl-core/utils';
import { findEdge, getGraphNodeMap, Graph } from '@vaduga/mapgl-core/graph/main';
import { resolveGraphInteraction } from '@vaduga/mapgl-core/graph/frame';
import type { ViewState, BiColProps } from '@vaduga/mapgl-core/types';

import { getMapglFeatureServices } from '@vaduga/mapgl-core/featureContracts';

export const expandTooltip = (info: any, panel: any, eventBus: any, dataClickProps: any, selectGotoHandler: any) => {
  const { setSelCoord, setTooltipObject, setLocalViewState, pId } = dataClickProps;
  const isExtended = getMapglFeatureServices(panel).edition === 'extended';
  const position = info.coordinate;
  if (position) {
    const [longitude, latitude] = position.map((e: number) => parseFloat(e.toFixed(6)));

    setSelCoord({
      coordinates: [longitude, latitude],
      type: 'Point',
    });
  }

  if (info.picked) {
    const frame = dataClickProps.readRenderFrame?.();
    if (!frame) {
      return;
    }
    const render = frame.input.render;
    let { object, featureType, index, layer: deckLayer } = info;
    const wrappedFeature = object?.feature;
    const { comId } = object || {};
    let props = object?.properties ?? wrappedFeature?.properties ?? object;
    let rowIndex;

    const points = !props?.cluster && (info.sourceLayer?.props.data.points ?? deckLayer?.props.data.points);
    if (points && (featureType === 'points' || info.viewport?.id === '3d-scene') && index !== -1) {
      const featureIds = points.featureIds;
      const features = render.features;
      const idx = featureIds?.value[index];

      props = (features as BiColProps[])[idx];
      rowIndex = props?.rowIndex;

      // for pinned tooltip
      object = {
        index,
        rowIndex,
        properties: features[idx],
      };
    }

    /// skip in favor of onClick in editable layers
    if (!props || info.object?.properties?.guideType) {
      return;
    }
    const graphInteraction = props.cluster
      ? undefined
      : resolveGraphInteraction(
          { snapshot: frame.input.snapshot, graph: { edgeIndex: render.edgeIndex }, features: render.features },
          { ...info, object }
        );
    const edgeRef = graphInteraction?.kind === 'edge' ? graphInteraction.edgeRef : undefined;
    const indexedEdge =
      edgeRef !== undefined && edgeRef < (render.edgeIndex?.edgeCount ?? 0)
        ? render.edgeIndex.getEdge(edgeRef)
        : undefined;
    const edgeId =
      object?.edgeId ??
      wrappedFeature?.edgeId ??
      (graphInteraction?.kind === 'edge' ? graphInteraction.runtimeId : undefined);
    const pickedGraph: Graph | undefined =
      props.graph ?? wrappedFeature?.properties?.graph ?? (indexedEdge?.source.parent as Graph | undefined);
    const currentGraph: Graph = panel.scene.render.graph;
    const subGraph = ([currentGraph, ...currentGraph.subgraphsBreadthFirst()] as Graph[]).find(
      (graph) => graph.id === pickedGraph?.id
    );
    const edge = subGraph && edgeId !== undefined ? findEdge(subGraph, edgeId) : undefined;
    if (
      graphInteraction &&
      (!subGraph || (graphInteraction.kind === 'edge' ? !edge : !subGraph.findNode(graphInteraction.record.id)))
    ) {
      return;
    }
    const locName = props?.locName ?? edge?.source.id;

    if (comId !== undefined && edge) {
      const { index } = props;
      selectGotoHandler({
        pId,
        value: locName,
        graphId: (edge.source.parent as Graph).id,
        eventBus,
        select: true,
        fly: false,
        edge,
      });
      if (isExtended) {
        dataClickProps.setCommentOpenIdx(index);
        dataClickProps.setDrawerOpen(true);
      }
      return;
    }

    if (locName) {
      if (isExtended) {
        dataClickProps.setCommentOpenIdx(-1);
      }
      const nodeMap = subGraph ? getGraphNodeMap(subGraph) : undefined;
      const node = nodeMap?.get(locName) ?? subGraph;
      setTooltipObject({
        ...info,
        ...(graphInteraction && { graphInteraction }),
        object:
          object && typeof object === 'object'
            ? {
                ...object,
                ...(graphInteraction && { graphInteraction }),
              }
            : object,
      }); // this pins tooltip

      if (node) {
        selectGotoHandler({
          pId,
          value: node.id,
          graphId: subGraph?.id,
          eventBus,
          select: true,
          fly: false,
          edge,
          edgeId,
        });
      }
    } else if (!props?.isHull) {
      // zoom on cluster click
      const { expZoom, exp_x, exp_y } = props || {};
      if (exp_x === undefined || !Number.isFinite(expZoom)) {
        return;
      }

      const newState = {
        longitude: exp_x,
        latitude: exp_y,
        target: [exp_x, exp_y],
        zoom: expZoom,
        yZoom: expZoom + 1,
        transitionDuration: 250,
        maxPitch: 45 * 0.95,
        rotationX: -90,
        rnd: Math.random(), /// to trigger zoom in/out on repeat click the same cluster
      };
      setLocalViewState(newState as ViewState);
    }
  } else {
    // reset tooltip by clicking blank space
    if (isExtended) {
      dataClickProps.setHoverCluster(null);
      dataClickProps.setHoverInfo({});
      dataClickProps.setIsShowCenter(null);
    }
    selectGotoHandler({ pId, eventBus, select: true });
    clearTooltipInteraction({
      setTooltipObject,
      setHoverInfo: dataClickProps.setHoverInfo,
    });
    if (isExtended) {
      dataClickProps.setLogTooltipObject({});
    }
  }
};
