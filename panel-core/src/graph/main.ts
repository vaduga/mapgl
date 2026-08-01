// main.ts
export { Graph } from './structs/graph';
export { Node } from '@msagl/core/dist/structs/node';
export { Edge } from './structs/edge';
export {
  GraphEdgeIndex,
  INVALID_VERTEX_REF,
  type GraphEdgeIndexRecordInput,
  type GraphEdgeIndexUnitInput,
} from './GraphEdgeIndex';
export {
  bumpGraphVersion,
  clearNodeGroupsWithNodes,
  getGraphComments,
  getNodeGroupsWithNodes,
  getGraphPositionRanges,
  getGraphVersion,
  markNodeGroupHasNodes,
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
  setEntityAttrProp,
  setGraphData,
  setNodeData,
  setEdge,
} from './structs/graphOps';

export { FeatSource } from './FeatSource';
export { AttributeRegistry } from './structs/attributeRegistry';
