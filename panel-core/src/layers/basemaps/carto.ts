import { GrafanaTheme2 } from '@grafana/data';
import { ExtendMapLayerOptions, ExtendMapLayerRegistryItem } from '../../extension';

// https://docs.carto.com/carto-for-developers/carto-for-react/guides/basemaps

export enum LayerTheme {
  Auto = 'auto',
  Light = 'light',
  Dark = 'dark',
}

export interface CartoConfig {
  theme?: LayerTheme;
  showLabels?: boolean;
}

export const defaultCartoConfig: CartoConfig = {
  theme: LayerTheme.Auto,
  showLabels: true,
};

export const carto: ExtendMapLayerRegistryItem<CartoConfig> = {
  id: 'carto',
  hideOpacity: true,
  name: 'CARTO reference map',
  isBaseMap: true,
  defaultOptions: defaultCartoConfig,

  /**
   * Function that configures transformation and returns a transformer
   * @param options
   */
  create: (panel: any, options: ExtendMapLayerOptions<CartoConfig>, theme: GrafanaTheme2) => ({
    init: (): string => {
      const cfg = { ...defaultCartoConfig, ...options.config };
      const selectedTheme = cfg.theme === LayerTheme.Auto ? undefined : cfg.theme;
      const style = selectedTheme ?? (theme.isDark ? LayerTheme.Dark : LayerTheme.Light);
      const styleName = style === LayerTheme.Dark ? 'dark-matter' : 'positron';
      const labels = cfg.showLabels ? '' : '-nolabels';

      return `https://basemaps.cartocdn.com/gl/${styleName}${labels}-gl-style/style.json`;
    },
    registerOptionsUI: (builder) => {
      builder
        .addRadio({
          path: 'config.theme',
          name: 'Theme',
          settings: {
            options: [
              {
                value: LayerTheme.Auto,
                label: 'Auto',
                description: 'Match Grafana theme',
              },
              { value: LayerTheme.Light, label: 'Light' },
              { value: LayerTheme.Dark, label: 'Dark' },
            ],
          },
          defaultValue: defaultCartoConfig.theme!,
        })
        .addBooleanSwitch({
          path: 'config.showLabels',
          name: 'Show labels',
          description: '',
          defaultValue: defaultCartoConfig.showLabels,
        });
    },
  }),
};

export const cartoLayers = [carto];
