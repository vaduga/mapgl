import { findEdge, getGraphData, getGraphNodeMap, getNodeData, Graph } from 'mapLib';
import { ViewState, BiColProps } from 'mapLib/utils';

export const expandTooltip = (
  info: any,
  panel: any,
  eventBus: any,
  map: any,
  dataClickProps: any,
  selectGotoHandler: any
) => {
  const {
    setSelCoord,
    setTooltipObject,
    setLocalViewState,
    pId
  } = dataClickProps;
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

    const subGraph: Graph | undefined =
      props.graph ?? info.object?.properties?.graph;
    const edge = subGraph ? findEdge(subGraph, edgeId) : undefined;

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
      return;
    }

    if (locName) {
      const nodeMap = subGraph ? getGraphNodeMap(subGraph) : undefined;
      const node = nodeMap?.get(locName) ?? subGraph;
      setTooltipObject({ ...info, object }); // this pins tooltip

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
        rnd: Math.random(), /// to trigger zoom in/out on repeat click the same cluster
      };
      setLocalViewState(newState as ViewState);
    }
  } else {
    // reset tooltip by clicking blank space
    selectGotoHandler({ pId, eventBus, select: true });
    setTooltipObject({});
  }
};
