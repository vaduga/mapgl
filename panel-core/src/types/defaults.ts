import type { Info } from './index';
import {
  BinaryFeatureCollection,
  BinaryLineFeature,
  BinaryPointFeature,
  BinaryPolygonFeature,
} from '@loaders.gl/schema';

export const defViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  yZoom: 1 + 1,
};

export const DEFAULT_COMMENT_COLOR = '#4ec2fc'; //'rgb(78, 194, 252)'

export const DEFAULT_COLOR_PICKER = '#9acd32';

export const DEFAULT_NUMS_COLOR = '#ed473b';

export const FEATURE_EDIT_HANDLE_COLOR = '#f0fc'; // 'rgb(255, 0, 255, 0.8)'
export const DEFAULT_EDIT_HANDLE_COLOR = '#e034b8cc';

export const DARK_CENTER_PLOT = '#ffdd57e6';
export const LIGHT_CENTER_PLOT = '#205299cc';

export const DARK_AUTO_HIGHLIGHT = '#ffd70033'; //'rgb(255, 215, 0, 0.2)'
export const LIGHT_AUTO_HIGHLIGHT = '#20529933'; //'rgb(32, 82, 153, 0.2)'
export const DARK_HULL_HIGHLIGHT = '#ffd70026'; //'rgb(255, 215, 0, 0.15)'
export const LIGHT_HULL_HIGHLIGHT = '#42a4f533'; //'rgb(66, 164, 245, 0.2)'

export const LINES_EDIT_HANDLE_COLOR = '#e6ca5ce6'; //'rgb(230, 202, 92, 0.9)'
export const LINES_SNAP_SOURCE_COLOR = '#dfff7bcc'; // 'rgb(223,523,123, 0.8)'
export const LINES_SNAP_TARGET_COLOR = '#2fa1deb3'; //'rgb(47, 161, 222, 0.7)'
export const DEFAULT_CLUSTER_BK_COLOR = '#f0f0f0'; //'rgb(240,240,240)'
export const ANNOT_CLUSTER_BK_COLOR = '#e0be8b'; // 'rgb(224, 190, 139)'
export const ALERTING_STATES = {
  Alerting: '#e0226e',
  Pending: '#ff9900',
  Normal: '#1b855e',
};

export const BBOX_OUTLINE_COLOR = '#cfe3d4';
export const BBOX_OUTLINE_WIDTH = 0.5;

export const ALERT_MAP = {
  '255': [ALERTING_STATES.Alerting, 'Alerting', [224, 34, 110, 254]],
  '222': [ALERTING_STATES.Pending, 'Pending', [255, 153, 0, 254]],
  '111': [ALERTING_STATES.Normal, 'Normal', [27, 133, 94, 254]],
};

export const ALERTING_NUMS = {
  Alerting: ALERT_MAP['255'],
  Pending: ALERT_MAP['222'],
  Normal: ALERT_MAP['111'],
};


export const DEFAULT_ICON_NAME = '';
export const DEFAULT_SVG_ICON_V_OFFSET = 0;
export const DEFAULT_CLUSTER_SCALE = 40;
export const DEFAULT_CLUSTER_ICON_SIZE = 45;
export const DEFAULT_CLUSTER_MAX_ZOOM = 16;
export const SEL_LINE_WIDTH_MULTIPLIER = 2;

export const blankHoverInfo: Info = {};

export const defDeckViewPort = (c: { viewState: { zoom: number; bearing: number; pitch: number } }) => ({
  transitionDuration: 1,
  //transitionInterpolator: new FlyToInterpolator(),
  //
  yZoom: c.viewState.zoom + 1,
  maxPitch: 45 * 0.95,
  camera: {
    azimuth: (-c.viewState.bearing * Math.PI) / 180,
    tilt: ((c.viewState.pitch * Math.PI) / 180) * 1.05, // sph-> ellipse correction*/
  },
});

export const emptyBiCol = {
  shape: 'binary-feature-collection',
  points: {
    type: 'Point',
    positions: { value: new Float64Array([]), size: 2 },
    featureIds: { value: new Uint32Array([]), size: 1 },
    globalFeatureIds: { value: new Uint32Array([]), size: 1 },
    numericProps: {},
    properties: [],
  } as unknown as BinaryPointFeature,
  polygons: {
    type: 'Polygon',
    positions: { value: new Float32Array(), size: 2 },
    featureIds: { value: new Uint16Array(), size: 1 },
    globalFeatureIds: { value: new Uint16Array(), size: 1 },
    polygonIndices: { value: new Uint16Array(), size: 1 },
    primitivePolygonIndices: { value: new Uint16Array(), size: 1 },
    numericProps: {},
    properties: [],
  } as unknown as BinaryPolygonFeature,
  lines: {
    type: 'LineString',
    positions: { value: new Float32Array(), size: 2 },
    featureIds: { value: new Uint16Array(), size: 1 },
    pathIndices: { value: new Uint16Array(), size: 1 },
    globalFeatureIds: { value: new Uint16Array(), size: 1 },
    numericProps: {},
    properties: [],
  } as unknown as BinaryLineFeature,
} as BinaryFeatureCollection;

export const FIXED_COLOR_LABEL = 'fixed';

export const NS_SEPARATOR = '.';
export const NS_PADDING = 25;
export const EDIT_STORAGE_NS_PREFIX = 'mapgl';
export const EDIT_STORAGE_LOGIC_NAMESPACES = 'xy-namespaces';
export const CMN_NAMESPACE_PREFIX = 'cmn';
export const CMN_NAMESPACE = 'external';

export const ANNOTS_LABEL = 'annots & alerts query (built-in)';

export const MOC_LOC_FIELD = 'source';
