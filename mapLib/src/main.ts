// main.ts
export { Graph, Node, Edge } from '@msagl/core';
export { GraphEdgeIndex, type EdgeTuple } from './GraphEdgeIndex';
export {
  addNodeGroup,
  bumpGraphVersion,
  getGraphComments,
  getGraphPositionRanges,
  getGraphVersion,
  getNodeGroupCounts,
  pushGraphPositionRange,
  resetGraphState,
  rmNodeGroup,
  setGraphPositionRanges,
} from './structs/graphState';
export {
  findEdge,
  getEdgeArcId,
  getEdgeData,
  getGraphData,
  getGraphEdges,
  getEdgeId,
  getEdgeLineId,
  getEdgeTilt,
  getGraphNodeCollection,
  getGraphNodeMap,
  getGraphNodes,
  getNodeData,
  resetGraph,
  resetGraphNodes,
  setEntityAttrProp,
  setEdgeArcId,
  setEdgeLineId,
  setEdgeTilt,
  setGraphData,
  setNodeData,
  setEdge,
} from './structs/graphOps';

export {
  CurveFactory,
  GeomNode,
  Point,
  TileMap,
  GeomGraph,
  layoutGeomGraph,
  LayerDirectionEnum,
  EdgeRoutingMode,
  SugiyamaLayoutSettings,
} from '@msagl/core';
export { FeatSource } from './FeatSource';
export { AttributeRegistry } from './structs/attributeRegistry';
