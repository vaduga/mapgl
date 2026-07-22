import { defaultMapViewConfig, TooltipMode, type Options } from '../types/panel';
import { CMN_NAMESPACE_PREFIX } from '../types/defaults';
import { createDefaultMarkersConfig } from '../layers/data/markersDefaults';
import { MapCenterID } from '../view';

export type PartialMapglOptions = Omit<Partial<Options>, 'common' | 'view' | 'tooltip'> & {
  common?: Partial<Options['common']> & Record<string, unknown>;
  view?: Partial<Options['view']>;
  tooltip?: Partial<Options['tooltip']>;
};

const DEFAULT_BASEMAP: Options['basemap'] = {
  type: 'blank',
  name: '',
  config: {},
};

const FRESH_PANEL_VIEW: Partial<Options['view']> = {
  id: MapCenterID.Fit,
  zoom: 15,
};

export function normalizeOptions(options: PartialMapglOptions | undefined | null): Options {
  const source = options ?? {};
  const common = source.common ?? {};
  const isFreshPanel = !source.dataLayers?.length;

  return {
    ...source,
    isEditable: source.isEditable ?? true,
    basemap: cloneLayerOptions(source.basemap ?? DEFAULT_BASEMAP),
    controls: (source.controls ?? {}) as Options['controls'],
    tooltip: {
      mode: TooltipMode.Details,
      ...source.tooltip,
    },
    view: {
      ...defaultMapViewConfig,
      ...source.view,
      ...(isFreshPanel ? FRESH_PANEL_VIEW : {}),
    } as Options['view'],
    common: {
      ...common,
      nsPrefix: common.nsPrefix ?? CMN_NAMESPACE_PREFIX,
      jitterPoints: common.jitterPoints ?? false,
      locLabelName: common.locLabelName ?? '',
      isShowLegend: common.isShowLegend ?? true,
      isShowEdgeLegend: common.isShowEdgeLegend ?? true,
      isShowSwitcher: common.isShowSwitcher ?? true,
      isAppAuth: common.isAppAuth ?? false,
      isMeters: common.isMeters ?? false,
    },
    dataLayers: isFreshPanel ? [createDefaultMarkersConfig()] : source.dataLayers!.map(cloneLayerOptions),
  } as Options;
}

/** Persist defaults that must exist in Grafana's panel model for a fresh panel. */
export function persistFreshPanelOptions(
  options: PartialMapglOptions | undefined | null,
  onOptionsChange: (options: Options) => void
): boolean {
  if (options?.dataLayers?.length) {
    return false;
  }

  onOptionsChange(normalizeOptions(options));
  return true;
}

function cloneLayerOptions<T extends object>(layer: T): T {
  const layerOptions = layer as any;

  return {
    ...layerOptions,
    ...(layerOptions.config ? { config: { ...layerOptions.config } } : {}),
    ...(layerOptions.location ? { location: { ...layerOptions.location } } : {}),
  };
}
