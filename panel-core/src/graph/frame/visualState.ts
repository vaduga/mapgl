import { AttributeRegistry, clearNodeGroupsWithNodes, markNodeGroupHasNodes, setNodeData } from '../main';
import type {
  GraphBuiltState,
  GraphFrameDiagnostic,
  GraphFrameSnapshot,
  GraphFrameSnapshotSummary,
  GraphFrameViewPhase,
  GraphFrameViewState,
  GraphVisualState,
} from './types';

const EMPTY_DIAGNOSTICS: readonly GraphFrameDiagnostic[] = Object.freeze([]);

export function applyGraphVisualState(graph: GraphBuiltState, visual: GraphVisualState): void {
  clearNodeGroupsWithNodes(graph.graph);

  for (const record of visual.nodes) {
    const node = graph.nodeByKey.get(record.key);
    const data = node?.getAttr(AttributeRegistry.NodeDataIndex);
    if (!node || !data) {
      continue;
    }
    if (data.feature !== record.feature) {
      setNodeData(node, { ...data, feature: record.feature });
    }
    if (typeof record.style.group?.groupIdx === 'number') {
      markNodeGroupHasNodes(graph.graph, record.style.group.groupIdx);
    }
  }

  for (let recordRef = 0; recordRef < graph.edgeIndex.recordCount; recordRef++) {
    graph.edgeIndex.forEachRecordEdge(recordRef, (edge, edgeRef) => {
      const unitVisual = visual.edgeUnits[graph.edgeIndex.getEdgeUnitRef(edgeRef)];
      if (unitVisual && edge.data.dataRecord !== unitVisual.feature) {
        edge.setAttr(AttributeRegistry.EdgeDataIndex, { ...edge.data, dataRecord: unitVisual.feature });
      }
    });
  }
}

function summarizeGraphFrame(snapshot: GraphFrameSnapshot): GraphFrameSnapshotSummary {
  return Object.freeze({
    frameCount: snapshot.frames.length,
    rowCount: snapshot.frames.reduce((count, frame) => count + frame.rowCount, 0),
    nodeCount: snapshot.nodes.length,
    edgeCount: snapshot.relations.recordCount,
    namespaceCount: snapshot.namespaces.length,
    topologySignature: snapshot.topologySignature,
  });
}

export function createGraphFrameViewState(input: {
  readonly phase: GraphFrameViewPhase;
  readonly pending: boolean;
  readonly diagnostics?: readonly GraphFrameDiagnostic[];
  readonly runtime?: {
    readonly version: number;
    readonly snapshot: GraphFrameSnapshot;
  };
}): GraphFrameViewState {
  return Object.freeze({
    phase: input.phase,
    pending: input.pending,
    hasCommittedState: Boolean(input.runtime),
    committedVersion: input.runtime?.version,
    summary: input.runtime ? summarizeGraphFrame(input.runtime.snapshot) : undefined,
    diagnostics: input.diagnostics ?? EMPTY_DIAGNOSTICS,
  });
}
