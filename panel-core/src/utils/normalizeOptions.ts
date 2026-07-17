import { defaultMapViewConfig, TooltipMode, type Options } from '@mapgl/panel-core/types';
import { CMN_NAMESPACE_PREFIX } from '@mapgl/panel-core/types/defaults';

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

const DEFAULT_DATA_LAYER: Options['dataLayers'][number] = {
  type: 'markers',
  name: 'new markers layer',
  config: {},
  location: {
    mode: 'auto' as any,
  },
};

export function normalizeOptions(options: PartialMapglOptions | undefined | null): Options {
  const source = options ?? {};
  const common = source.common ?? {};

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
    dataLayers: source.dataLayers?.length ? source.dataLayers.map(cloneLayerOptions) : [cloneLayerOptions(DEFAULT_DATA_LAYER)],
  } as Options;
}

function cloneLayerOptions<T extends object>(layer: T): T {
  const layerOptions = layer as any;

  return {
    ...layerOptions,
    ...(layerOptions.config ? { config: { ...layerOptions.config } } : {}),
    ...(layerOptions.location ? { location: { ...layerOptions.location } } : {}),
  };
}
