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
import { PACKED_INVALID_REF } from './packedRelations';

const EMPTY_DIAGNOSTICS: readonly GraphFrameDiagnostic[] = Object.freeze([]);

function numericMetric(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function applyGraphVisualState(graph: GraphBuiltState, visual: GraphVisualState): void {
  clearNodeGroupsWithNodes(graph.graph);

  for (const record of visual.nodes) {
    const node = graph.nodeByKey.get(record.key);
    const data = node?.getAttr(AttributeRegistry.NodeDataIndex);
    if (!node || !data) {
      continue;
    }
    setNodeData(node, { ...data, feature: record.feature });
    if (typeof record.style.group?.groupIdx === 'number') {
      markNodeGroupHasNodes(graph.graph, record.style.group.groupIdx);
    }
  }

  for (let recordRef = 0; recordRef < graph.edgeIndex.recordCount; recordRef++) {
    graph.edgeIndex.forEachRecordEdge(recordRef, (edge, edgeRef) => {
      const unitVisual = visual.edgeUnits[graph.edgeIndex.getEdgeUnitRef(edgeRef)];
      edge.setAttr(AttributeRegistry.EdgeDataIndex, {
        ...edge.data,
        ...(unitVisual && { dataRecord: unitVisual.feature }),
      });
    });
    const primaryUnitRef = visual.edgePrimaryUnitRefs[recordRef];
    if (primaryUnitRef !== PACKED_INVALID_REF) {
      const primary = visual.edgeUnits[primaryUnitRef];
      if (primary) {
        graph.edgeIndex.setRecordMetrics(
          recordRef,
          numericMetric(primary.metrics.sideA),
          numericMetric(primary.metrics.sideB),
          numericMetric(primary.metrics.color)
        );
      }
    }
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
