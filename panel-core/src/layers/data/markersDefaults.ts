import type { Graph } from '../../graph/main';
import type { Rule } from '../../editor/Groups/ruleTypes';
import type { ExtendFrameGeometrySourceMode, ExtendMapLayerOptions } from '../../extension';
import { defaultStyleConfig, type StyleConfig } from '../../style/types';

export interface MarkersOptionalConfig {
  edgeId?: string;
  wrapEdges?: 0 | 1 | 2 | 3;
  isNestEdges?: boolean;
  vertexA_NS?: string;
  vertexB_NS?: string;
  nsSeparator?: string;
  searchProps?: string[];
}

export interface MarkersConfig {
  graph?: Graph;
  style: StyleConfig;
  edgeStyle: StyleConfig;
  arcStyle: {
    sideA: StyleConfig;
    sideB: StyleConfig;
  };
  arcConfig: {
    height: number;
    tiltIncrement: number;
    capacity: { field?: string; fixed: number };
  };
  groups?: Rule[];
  showStat2?: boolean;
}

export type MarkersLayerOptions<TConfig = MarkersConfig> = ExtendMapLayerOptions<TConfig, MarkersOptionalConfig>;

export const MARKERS_LAYER_ID = 'markers';

export function createDefaultMarkersConfig(): MarkersLayerOptions<MarkersConfig> {
  const createStyle = (): StyleConfig => ({
    ...defaultStyleConfig,
    size: { ...defaultStyleConfig.size },
    color: { ...defaultStyleConfig.color },
    textConfig: { ...defaultStyleConfig.textConfig },
  });

  const markerStyle: StyleConfig = {
    ...createStyle(),
    size: { ...defaultStyleConfig.size, fixed: 25 },
    useGroups: true,
  };

  return {
    type: MARKERS_LAYER_ID,
    name: 'new markers layer',
    optional: {
      nsSeparator: '.',
    },
    config: {
      style: markerStyle,
      edgeStyle: createStyle(),
      arcStyle: {
        sideA: { ...createStyle(), arrow: 0 },
        sideB: { ...createStyle(), arrow: 0 },
      },
      arcConfig: {
        height: 0.5,
        tiltIncrement: 7,
        capacity: { fixed: 1 },
      },
      showStat2: false,
    },
    location: {
      mode: 'auto' as ExtendFrameGeometrySourceMode,
    },
  };
}

// Used by default when nothing is configured.
export const defaultMarkersConfig = createDefaultMarkersConfig();
export const defaultMarkersOptions = defaultMarkersConfig.config!;
export const defaultMarkersOptional = defaultMarkersConfig.optional!;
