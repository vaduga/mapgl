import type { GrafanaTheme2 } from '@grafana/data';
import type { RenderPresentation } from '@vaduga/mapgl-core/render/graph';
import { toRGB4Array } from '@vaduga/mapgl-core/deckLayers/utils';
import { DARK_AUTO_HIGHLIGHT, LIGHT_AUTO_HIGHLIGHT } from '@vaduga/mapgl-core/types/defaults';

/** Translate the shared Grafana graph/Geomap presentation at the host boundary. */
export function grafanaRenderPresentation(
  theme: GrafanaTheme2,
  isLogic: boolean,
  isMeters: boolean | undefined,
  annotationsEnabled: boolean
): RenderPresentation {
  return {
    isLogic,
    isMeters,
    isDark: theme.isDark,
    textColor: theme.colors.text.primary,
    pointType: isLogic ? 'circle+icon' : undefined,
    nodeIdSuffix: isLogic ? '-main' : '',
    placeholders: true,
    labels: isLogic,
    labelsInNodes: true,
    bounds: isLogic,
    boundLabels: true,
    showAnnotations: annotationsEnabled,
    overlayEnabled: annotationsEnabled,
    pickable: true,
    autoHighlight: !isLogic,
    highlightColor: toRGB4Array(theme.isDark ? DARK_AUTO_HIGHLIGHT : LIGHT_AUTO_HIGHLIGHT, 1),
  };
}
