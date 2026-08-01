import { findEdge, getGraphNodeMap, Graph } from '@mapgl/panel-core/graph';
import { resolvePanelGraphInteraction } from '@mapgl/panel-core/graph/frame';
import type { ViewState, BiColProps } from '@mapgl/panel-core/types';

import { getMapglFeatureServices } from '../extension-points/featureContracts';

export function clearTooltipInteraction({
  setTooltipObject,
  setHoverInfo,
}: {
  setTooltipObject(info: any): void;
  setHoverInfo?(info: any): void;
}): void {
  setTooltipObject({});
  setHoverInfo?.({});
}

export const expandTooltip = (info: any, panel: any, eventBus: any, dataClickProps: any, selectGotoHandler: any) => {
  const { setSelCoord, setTooltipObject, setLocalViewState, pId } = dataClickProps;
  const isExtended = getMapglFeatureServices().edition === 'extended';
  const position = info.coordinate;
  if (position) {
    const [longitude, latitude] = position.map((e: number) => parseFloat(e.toFixed(6)));

    setSelCoord({
      coordinates: [longitude, latitude],
      type: 'Point',
    });
  }

  if (info.picked) {
    let { object, featureType, index, layer: deckLayer } = info;
    const { comId, edgeId } = object || {};
    let props = object?.properties ?? object;
    let rowIndex;

    const points = !props?.cluster && deckLayer?.props.data.points;
    if (points && (featureType === 'points' || info.viewport?.id === '3d-scene') && index !== -1) {
      const featureIds = points.featureIds;
      const features = panel.features;
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
    const { locName } = props || {};

    const subGraph: Graph | undefined = props.graph ?? info.object?.properties?.graph;
    const edge = subGraph ? findEdge(subGraph, edgeId) : undefined;
    const graphInteraction = resolvePanelGraphInteraction(panel, { ...info, object });

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
      if (exp_x === undefined || !expZoom) {
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
