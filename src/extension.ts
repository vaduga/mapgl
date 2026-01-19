import {
  GrafanaTheme2,
  RegistryItemWithOptions,
  FrameGeometrySourceMode,
  PanelOptionsEditorBuilder, PanelData, MapLayerOptions, EventBus, StandardEditorContext, PanelProps, Field
} from '@grafana/data';
import {libreSource} from "mapLib/utils";
import {ReactNode} from "react";
import {GeomapPanel} from "./GeomapPanel";
import {FeatSource} from "mapLib";

export interface MatcherConfig<TOptions = any> {
  id: string;
  options?: TOptions;
}

export enum GeojsonFrameGeometrySourceMode {
  Geojson = 'geojson',
  Auto = 'auto',
  Geohash = 'geohash',
  Coords = 'coords',
  Lookup = 'lookup',
}

export interface ExtendFrameGeometrySource {
  mode: ExtendFrameGeometrySourceMode;
  geohash?: string;
  latitude?: string;
  longitude?: string;
  h3?: string;
  wkt?: string;
  lookup?: string;
  gazetteer?: string;
  geojson?: string;
}

// eslint-disable-next-line
export const ExtendFrameGeometrySourceMode = {
  ...GeojsonFrameGeometrySourceMode,
  ...FrameGeometrySourceMode
};
// eslint-disable-next-line
export type ExtendFrameGeometrySourceMode = FrameGeometrySourceMode | GeojsonFrameGeometrySourceMode;
export interface ExtendMapLayerHandler<TConfig = any> {
  init: () => FeatSource | libreSource | string;
  geom?: (panelData: PanelData) => void;  // for Graph layers only
  /**
   * The update function should only be implemented if the layer type makes use of query data
   */
  update?: (data: PanelData) => void;
  /** Optional callback for cleanup before getting removed */
  dispose?: () => void;
  /** return react node for the legend */
  legend?: ReactNode;
  /**
   * Show custom elements in the panel edit UI
   */
  registerOptionsUI?: (builder: PanelOptionsEditorBuilder<ExtendMapLayerOptions<TConfig>>, context: StandardEditorContext<any>) => void;
}

export interface ExtendMapLayerOptions<TConfig = any> {
  isShowTooltip?: boolean;
  geojsonColor?: string;
  geojsonLocName?: string;
  geojsonMetricName?: string;
  geojsonurl?: string;
  name: string;
  type: string | any; // for BaseMapChangeEvent
  value?: string; // for BaseMapChangeEvent
  locField?: string;
  parField?: string;
  edgeIdField?: string;
  isWrapEdges?: 0 | 1 | 2 | 3;
  config?: TConfig;
  query?: MatcherConfig //filterData
  location?: ExtendFrameGeometrySource;
  opacity?: number;
  displayProperties?: string[];
  searchProperties?: string[];
  titleField?: string;
  yMapsKey?: string;
}

export interface ExtendMapLayerRegistryItem<TConfig = ExtendMapLayerOptions> extends RegistryItemWithOptions {
  /**
   * This layer can be used as a background
   */
  isBaseMap?: boolean;
  /**
   * Show location controls
   */
  showLocation?: boolean;
  /**
   * Hide transparency controls in UI
   */
  hideOpacity?: boolean;

  create: (panel: GeomapPanel, options: ExtendMapLayerOptions<TConfig>, theme: GrafanaTheme2, idx?: number) =>
      Promise<ExtendMapLayerHandler> | ExtendMapLayerHandler   // datalayer or basemap layer
  /**
   * Show custom elements in the panel edit UI
   */
  registerOptionsUI?: (builder: PanelOptionsEditorBuilder<ExtendMapLayerOptions<TConfig>>, options?: ExtendMapLayerOptions<TConfig>) => void;
}
