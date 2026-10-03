import type { DataFrame, Field, GrafanaTheme2 } from '@grafana/data';
import type { Rule } from '@vaduga/mapgl-core/style';
import type { StyleConfig } from '../../style/types';
import type {
  GraphPosition,
  GraphFrameOptions as CoreGraphFrameOptions,
  GraphArcConfig,
  GraphFrameSnapshot,
  GraphBuiltState,
} from '@vaduga/mapgl-core/graph/frame';
export * from '@vaduga/mapgl-core/graph/frame';
export interface GraphFrameSelection {
  readonly frame: DataFrame;
  readonly frameIndex: number;
}

export interface GraphResolvedFrame {
  readonly selection: GraphFrameSelection;
  readonly nodeId: Field;
  readonly target?: Field;
  readonly edgeId?: Field;
  readonly sourceNamespace?: Field;
  readonly targetNamespace?: Field;
  readonly location: GraphResolvedLocation;
}

export interface GraphResolvedLocation {
  readonly geojson?: Field;
  readonly geo?: Field;
  readonly geohash?: Field;
  readonly longitude?: Field;
  readonly latitude?: Field;
  readonly lookup?: Field;
  readonly findLookup?: (value: string) => GraphPosition | undefined;
}

export interface GraphNormalizationInput {
  readonly revision?: string;
  readonly data: {
    readonly series: readonly DataFrame[];
  };
  readonly options: GraphFrameOptions;
  readonly normalizationLayers?: readonly GraphNormalizationLayer[];
}

export interface GraphNormalizationLayer {
  readonly layerIndex: number;
  readonly options: GraphFrameOptions;
}

export interface GrafanaGraphVisualConfig {
  readonly layerName: string;
  readonly layerIndex?: number;
  readonly locationField: string;
  readonly isLogic: boolean;
  readonly style: StyleConfig;
  readonly edgeStyle: StyleConfig;
  readonly arcStyle: {
    readonly sideA: StyleConfig;
    readonly sideB: StyleConfig;
  };
  readonly arcConfig: GraphArcConfig;
  readonly groups?: readonly Rule[];
  readonly groupIndexOffset?: number;
  readonly showStat2?: boolean;
}

export interface GrafanaGraphVisualInput {
  readonly data: {
    readonly series: readonly DataFrame[];
  };
  readonly snapshot: GraphFrameSnapshot;
  readonly graph: GraphBuiltState;
  readonly config: GrafanaGraphVisualConfig;
  readonly configs?: readonly GrafanaGraphVisualConfig[];
  readonly theme: GrafanaTheme2;
}

export interface GraphFrameMatcherConfig {
  readonly id: string;
  readonly options?: unknown;
}

export interface GraphFrameLocationOptions {
  readonly mode?: string;
  readonly geohash?: string;
  readonly latitude?: string;
  readonly longitude?: string;
  readonly lookup?: string;
  readonly gazetteer?: string;
  readonly geojson?: string;
  readonly h3?: string;
  readonly wkt?: string;
}

export interface GraphFrameOptions extends CoreGraphFrameOptions {
  readonly layerName?: string;
  readonly query?: GraphFrameMatcherConfig;
  readonly nodeIdField: string;
  readonly targetField?: string;
  readonly edgeIdField?: string;
  readonly sourceNamespaceField?: string;
  readonly targetNamespaceField?: string;
  readonly namespaceSeparator?: string;
  readonly location?: GraphFrameLocationOptions;
  readonly defaultNamespace?: string;
  readonly isLogic: boolean;
  readonly layoutSignature?: string;
  readonly diagnosticExampleLimit?: number;
}
