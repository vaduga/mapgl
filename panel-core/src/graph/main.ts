// main.ts
export { Graph } from './structs/graph';
export { Node } from '@msagl/core/dist/structs/node';
export { Edge } from './structs/edge';
export { GraphEdgeIndex, type EdgeTuple } from './GraphEdgeIndex';
export {
  bumpGraphVersion,
  getGraphComments,
  getNodeGroupsWithNodes,
  getGraphPositionRanges,
  getGraphVersion,
  markNodeGroupHasNodes,
  pushGraphPositionRange,
  resetGraphState,
  setGraphPositionRanges,
} from './structs/graphState';
export {
  findEdge,
  getGraphData,
  getGraphEdges,
  getGraphNodeCollection,
  getGraphNodeMap,
  getGraphNodes,
  getNodeData,
  resetGraph,
  resetGraphNodes,
  setEntityAttrProp,
  setGraphData,
  setNodeData,
  setEdge,
} from './structs/graphOps';

export { FeatSource } from './FeatSource';
export { AttributeRegistry } from './structs/attributeRegistry';
