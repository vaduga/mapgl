import type { Graph } from '../../graph/main';
import type { Rule } from '../../editor/Groups/ruleTypes';
import type { ExtendFrameGeometrySourceMode, ExtendMapLayerOptions } from '../../extension';
import { defaultStyleConfig, type StyleConfig } from '../../style/types';

export interface MarkersConfig {
  graph?: Graph;
  searchProperties?: string[];
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
  isWrapEdges?: 0 | 1 | 2 | 3;
  vertexA_NS?: string;
  vertexB_NS?: string;
}

export const MARKERS_LAYER_ID = 'markers';

export function createDefaultMarkersConfig(): ExtendMapLayerOptions<MarkersConfig> {
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
      isWrapEdges: 0,
    },
    location: {
      mode: 'auto' as ExtendFrameGeometrySourceMode,
    },
  };
}

// Used by default when nothing is configured.
export const defaultMarkersConfig = createDefaultMarkersConfig();
export const defaultMarkersOptions = defaultMarkersConfig.config!;
