export type EdgeRoutingConfig = 'Splines' | 'Rectilinear';
export type LayoutDirectionConfig = 'TB' | 'LR' | 'BT' | 'RL';

export type LayoutNodeSnapshot = {
  id: string;
  graphId: string;
  wasmId: number;
  radius?: number;
};

export type LayoutGraphSnapshot = {
  id: string;
  parentId?: string;
};

export type LayoutEdgeSnapshot = {
  id: string;
  sourceId: string;
  sourceGraphId: string;
  targetId: string;
  targetGraphId: string;
  sourceArrowLength?: number;
  targetArrowLength?: number;
};

export type LayoutRequest = {
  requestId: number;
  routing: EdgeRoutingConfig;
  direction: LayoutDirectionConfig;
  layerSeparation: number;
  nodeSeparation: number;
  rootGraphId: string;
  positionsLength: number;
  graphs: LayoutGraphSnapshot[];
  nodes: LayoutNodeSnapshot[];
  edges: LayoutEdgeSnapshot[];
};

export type LayoutGraphResult = {
  id: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type LayoutCurveGroup = {
  graphId: string;
  edgeIndexes: Int32Array;
  edgeSegmentOffsets: Int32Array;
  types: Uint8Array;
  controlPoints: Float32Array;
  segments: Float32Array;
};

export type LayoutArrowResult = {
  edgeIndexes: Int32Array;
  flags: Uint8Array;
  sourceTips: Float64Array;
  targetTips: Float64Array;
};

export type LayoutResult = {
  requestId: number;
  graphs: LayoutGraphResult[];
  positions: Float64Array;
  arrows: LayoutArrowResult;
  curveGroups?: LayoutCurveGroup[];
};

export const SOURCE_ARROW_FLAG = 1;
export const TARGET_ARROW_FLAG = 2;

export function nodeKey(graphId: string | undefined, nodeId: string): string {
  return `${graphId ?? ''}:${nodeId}`;
}

export function edgeKey(graphId: string | undefined, edgeId: string): string {
  return `${graphId ?? ''}:${edgeId}`;
}
