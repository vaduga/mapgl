// main.ts
export { Graph } from './structs/graph';
export { Node } from './structs/node';
export { Edge } from './structs/edge';
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
  getGraphData,
  getGraphEdges,
  getGraphNodeCollection,
  getGraphNodeMap,
  getGraphNodes,
  resetGraph,
  resetGraphNodes,
  setGraphData,
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
