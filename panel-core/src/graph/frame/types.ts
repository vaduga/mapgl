import type { Node } from '@msagl/core';

import type { Rule } from '../../style/groups/ruleTypes';
import type { GraphEdgeIndex } from '../GraphEdgeIndex';
import type { FeatSource } from '../FeatSource';
import type { Graph } from '../structs/graph';
import type { ArcOptionsConfig, StyleConfigValues } from '../../style/types';
import type { BiColProps, RGBAColor } from '../../types';
import type { PackedGraphRelations } from './packedRelations';

export type GraphPosition = readonly [number, number];

export type GraphRowRef = import('../../data/sources').SourceRow;

export interface GraphFrameRef {
  readonly revision: string;
  readonly sourceIndex: number;
  readonly sourceKey: string;
  readonly rowCount: number;
  readonly layerIndex?: number;
}

export interface GraphFrameDiagnosticContext {
  readonly layerName?: string;
  readonly layerIndex?: number;
  readonly sourceIndex?: number;
  readonly sourceKey?: string;
  readonly fieldName?: string;
  readonly rowIndex?: number;
}

export interface GraphFrameDiagnosticExample {
  readonly context: GraphFrameDiagnosticContext;
  readonly value?: unknown;
}

export type GraphFrameDiagnosticSeverity = 'fatal' | 'warning' | 'info';

export type GraphFrameDiagnosticCode =
  | 'no-matching-frames'
  | 'empty-graph'
  | 'missing-node-id-field'
  | 'missing-target-field'
  | 'missing-edge-id-field'
  | 'missing-source-namespace-field'
  | 'missing-target-namespace-field'
  | 'invalid-node-id'
  | 'invalid-coordinate'
  | 'invalid-path'
  | 'dangling-target'
  | 'conflicting-node'
  | 'conflicting-edge'
  | 'pipeline-failed';

export interface GraphFrameDiagnostic {
  readonly code: GraphFrameDiagnosticCode;
  readonly severity: GraphFrameDiagnosticSeverity;
  readonly message: string;
  readonly count: number;
  readonly examples: readonly GraphFrameDiagnosticExample[];
}

export interface GraphNodeRecord {
  readonly index: number;
  readonly key: string;
  readonly id: string;
  readonly namespaceId: string;
  readonly primaryRow: GraphRowRef;
  readonly rows: readonly GraphRowRef[];
}

export type GraphTopologySignature = string;
export type GraphGeometrySignature = string;

export interface GraphFrameSnapshot {
  readonly frames: readonly GraphFrameRef[];
  readonly nodes: readonly GraphNodeRecord[];
  readonly positions: Float64Array;
  readonly relations: PackedGraphRelations;
  readonly namespaces: readonly string[];
  readonly namespaceLabels: ReadonlyMap<string, string>;
  readonly nodeByKey: ReadonlyMap<string, GraphNodeRecord>;
  readonly diagnostics: readonly GraphFrameDiagnostic[];
  readonly topologySignature: GraphTopologySignature;
  readonly geometrySignature: GraphGeometrySignature;
}

export interface GraphFrameSnapshotSummary {
  readonly frameCount: number;
  readonly rowCount: number;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly namespaceCount: number;
  readonly topologySignature: GraphTopologySignature;
}

export type GraphFrameViewPhase = 'idle' | 'loading' | 'ready' | 'empty' | 'fatal';

export interface GraphFrameViewState {
  readonly phase: GraphFrameViewPhase;
  readonly pending: boolean;
  readonly hasCommittedState: boolean;
  readonly committedVersion?: number;
  readonly summary?: GraphFrameSnapshotSummary;
  readonly diagnostics: readonly GraphFrameDiagnostic[];
}

export interface GraphFrameRenderInputs {
  readonly version: number;
  readonly graph: Graph;
  readonly edgeIndex: GraphEdgeIndex;
  readonly positions: Float64Array;
  readonly features: readonly BiColProps[];
  readonly colors: Uint8Array;
  readonly muted: Uint8Array;
  readonly annotations: Uint8Array;
  readonly groupIndices: Uint8Array;
}

export interface GraphFrameInstanceState extends GraphFrameViewState {
  readonly snapshot?: GraphFrameSnapshot;
  readonly render?: GraphFrameRenderInputs;
}

export interface GraphFrameOptions {
  readonly layerName?: string;
  readonly namespaceSeparator?: string;
  readonly defaultNamespace?: string;
  readonly isLogic: boolean;
  readonly layoutSignature?: string;
  readonly diagnosticExampleLimit?: number;
}

export interface GraphFatalResult {
  readonly ok: false;
  readonly diagnostics: readonly GraphFrameDiagnostic[];
}

export interface GraphStageSuccess<T> {
  readonly ok: true;
  readonly value: T;
  readonly diagnostics: readonly GraphFrameDiagnostic[];
  readonly empty: boolean;
}

export type GraphStageResult<T> = GraphFatalResult | GraphStageSuccess<T>;

export interface GraphPositionRange {
  readonly namespaceId: string;
  readonly start: number;
  readonly end: number;
}

export interface GraphEntityRowMetadata {
  readonly key: string;
  readonly primaryRow: GraphRowRef;
  readonly rows: readonly GraphRowRef[];
}

export interface GraphLayerBuildOptions {
  readonly layerIndex?: number;
  readonly wrap?: number;
  readonly nest?: boolean;
}

export interface GraphBuildOptions extends GraphLayerBuildOptions {
  readonly layers?: readonly GraphLayerBuildOptions[];
}

export interface GraphBuiltState {
  readonly graph: Graph;
  readonly edgeIndex: GraphEdgeIndex;
  readonly positions: Float64Array;
  readonly positionRanges: readonly GraphPositionRange[];
  readonly nodeByKey: ReadonlyMap<string, Node>;
}

export interface GraphArcConfig {
  readonly height: number;
  readonly tiltIncrement: number;
  readonly capacity: {
    readonly field?: string;
    readonly fixed: number;
  };
}

/** Compiled channels are bound to one source revision and contain no host configuration. */
export interface GraphStyleChannels {
  readonly scope: { readonly revision: string; readonly sourceIndex: number; readonly sourceKey: string };

  readonly base: StyleConfigValues;
  readonly colorKey?: string;
  readonly capacityKey?: string;
  readonly isFixed: boolean;
  readonly color?: { get(rowIndex: number): string };
  readonly size?: { get(rowIndex: number): number };
  readonly text?: { get(rowIndex: number): string };
  readonly symbol?: { get(rowIndex: number): string | undefined };
  readonly arcs?: ReadonlyArray<{ get(rowIndex: number): string | undefined }>;
  readonly arcOptions?: ArcOptionsConfig;
  readonly gauge?: { get(rowIndex: number): GraphResolvedNodeGauge };
  readonly colorLegend?: ReadonlyArray<{ color: string; value: number | null }>;
}

export interface GraphVisualConfig {
  readonly layerName: string;
  readonly layerIndex?: number;
  readonly locationField: string;
  readonly isLogic: boolean;
  readonly node: (sourceIndex: number) => GraphStyleChannels;
  readonly edge: (sourceIndex: number) => GraphStyleChannels;
  readonly sideA: (sourceIndex: number) => GraphStyleChannels;
  readonly sideB: (sourceIndex: number) => GraphStyleChannels;
  readonly arcConfig: GraphArcConfig;
  readonly groups?: readonly Rule[];
  readonly groupIndexOffset?: number;
  readonly showStat2?: boolean;
}

export interface GraphMetricVisualPatch {
  readonly previous: GraphVisualState;
  readonly updates: ReadonlyArray<import('../../data/metricOverlays').MetricUpdate>;
}

export interface GraphVisualInput {
  readonly metricPatch?: GraphMetricVisualPatch;
  readonly sources: ReadonlyArray<import('../../data/sources').SourceView>;
  readonly snapshot: GraphFrameSnapshot;
  readonly graph: GraphBuiltState;
  readonly configs: readonly GraphVisualConfig[];
}

export type GraphResolvedVisualGroup = Omit<Rule, 'color'> & {
  readonly color: RGBAColor;
};

export type GraphResolvedGaugeStop = {
  readonly color: RGBAColor;
  readonly endFraction: number;
};

export type GraphResolvedNodeGauge = {
  readonly colorMode: string;
  readonly displayText: string;
  readonly fillFraction: number;
  readonly stops: readonly GraphResolvedGaugeStop[];
};

export type GraphResolvedVisualStyle = Omit<StyleConfigValues, 'color'> & {
  readonly color: RGBAColor;
  readonly group?: GraphResolvedVisualGroup;
  readonly arcs?: ReadonlyArray<string | undefined>;
  readonly arcOptions?: ArcOptionsConfig;
  readonly gauge?: GraphResolvedNodeGauge;
  readonly isDashed?: boolean;
};

export interface GraphResolvedArcStyle {
  readonly arcConfig: GraphArcConfig;
  readonly sideA: GraphResolvedVisualStyle & {
    readonly colorField?: string;
  };
  readonly sideB: GraphResolvedVisualStyle & {
    readonly colorField?: string;
  };
}

export interface GraphNodeVisualRecord {
  readonly key: string;
  readonly index: number;
  readonly row: GraphRowRef;
  readonly style: GraphResolvedVisualStyle;
  readonly feature: BiColProps;
}

export interface GraphEdgeVisualMetrics {
  readonly sideA?: unknown;
  readonly sideB?: unknown;
  readonly color?: unknown;
  readonly capacity?: unknown;
}

export interface GraphEdgeUnitVisualRecord {
  readonly unitRef: number;
  readonly row: GraphRowRef;
  readonly group: GraphResolvedVisualGroup;
  readonly style: GraphResolvedVisualStyle;
  readonly arcStyle: GraphResolvedArcStyle;
  readonly metrics: GraphEdgeVisualMetrics;
  readonly feature: BiColProps;
}

export interface GraphVisualState {
  readonly featureSources: readonly FeatSource[];
  readonly nodes: readonly GraphNodeVisualRecord[];
  readonly edgeUnits: ReadonlyArray<GraphEdgeUnitVisualRecord | undefined>;
  readonly edgePrimaryUnitRefs: Uint32Array;
  readonly features: readonly BiColProps[];
  readonly colors: Uint8Array;
  readonly muted: Uint8Array;
  readonly annotations: Uint8Array;
  readonly groupIndices: Uint8Array;
  readonly groups: readonly Rule[];
}

export interface GraphLayoutStage<TLayoutState> {
  readonly signature: string;
  readonly state: TLayoutState;
  readonly reused: boolean;
}

export interface GraphCommittedRuntimeState<TGraphState, TVisualState, TLayoutState, TRenderState> {
  readonly version: number;
  readonly snapshot: GraphFrameSnapshot;
  readonly graph: {
    readonly snapshot: GraphFrameSnapshot;
    readonly state: TGraphState;
  };
  readonly visual: {
    readonly snapshot: GraphFrameSnapshot;
    readonly state: TVisualState;
  };
  readonly layout: GraphLayoutStage<TLayoutState>;
  readonly render: {
    readonly snapshot: GraphFrameSnapshot;
    readonly state: TRenderState;
  };
  readonly diagnostics: readonly GraphFrameDiagnostic[];
}
