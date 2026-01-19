
import {Info} from './interfaces'

export const DEFAULT_COMMENT_COLOR = '#4ec2fc' //'rgb(78, 194, 252)'

export const DEFAULT_LINE_WIDTH = 1.5

export const DEFAULT_COLOR_LABEL = 'default'


/**
 * Color to use when rendering without any thresholds/overrides
 */

export const GLOBAL_FILL_COLOR = '#0a55a1';
export const GLOBAL_BORDER_COLOR = "#000000"
/**
 * Color for threshold OK state
 */
export const DEFAULT_OK_COLOR = '#299c46'; // #299c46
export const DEFAULT_COLOR_PICKER = '#9acd32'

export const DEFAULT_OK_COLOR_SELECTED = '#299C46';

/**
 * Color for threshold Warning state
 */
export const DEFAULT_WARNING_COLOR = '#ed8128'; // alternates // #FFC837 // '#e5ac0e'

/**
 * Color for threshold Critical state
 */

export const DEFAULT_CRITICAL_COLOR = '#f53636';

export const DEFAULT_NUMS_COLOR = '#ed473b'

export const DEFAULT_NO_THRESHOLD_COLOR = GLOBAL_FILL_COLOR;

export const DEFAULT_NO_DATA_COLOR_RGBA = 'rgba(154, 205, 50)';
export const DEFAULT_NO_DATA_COLOR = '#9acd32';

export const defaultThreshold = {
    color: DEFAULT_NO_DATA_COLOR,
    lineWidth: DEFAULT_LINE_WIDTH,
    label: DEFAULT_COLOR_LABEL,
};

export const FEATURE_EDIT_HANDLE_COLOR = '#f0fc' // 'rgb(255, 0, 255, 0.8)'
export const DEFAULT_EDIT_HANDLE_COLOR = '#e034b8cc'

export const DARK_CENTER_PLOT = '#ffdd57e6'
export const LIGHT_CENTER_PLOT = '#205299cc'

export const DARK_AUTO_HIGHLIGHT = '#ffd70033' //'rgb(255, 215, 0, 0.2)'
export const LIGHT_AUTO_HIGHLIGHT = '#20529933' //'rgb(32, 82, 153, 0.2)'
export const DARK_HULL_HIGHLIGHT = '#ffd70026' //'rgb(255, 215, 0, 0.15)'
export const LIGHT_HULL_HIGHLIGHT = '#42a4f533' //'rgb(66, 164, 245, 0.2)'



export const LINES_EDIT_HANDLE_COLOR = '#e6ca5ce6' //'rgb(230, 202, 92, 0.9)'
export const LINES_SNAP_SOURCE_COLOR = '#dfff7bcc' // 'rgb(223,523,123, 0.8)'
export const LINES_SNAP_TARGET_COLOR = '#2fa1deb3' //'rgb(47, 161, 222, 0.7)'
export const DEFAULT_CLUSTER_BK_COLOR = '#f0f0f0' //'rgb(240,240,240)'
export const ANNOT_CLUSTER_BK_COLOR = '#e0be8b' // 'rgb(224, 190, 139)'
export const ALERTING_STATES = {Alerting: '#e0226e', Pending: '#ff9900', Normal: '#1b855e'}
//export const ALERTING_STATES = {Alerting: 'rgb(224, 34, 110)', Pending: 'rgba(255, 153, 0)', Normal: 'rgb(27, 133, 94)'}

export const BBOX_OUTLINE_COLOR = '#cfe3d4'
export const BBOX_OUTLINE_WIDTH = 0.5

export const ALERT_MAP =
    {
        '255': [ALERTING_STATES.Alerting, 'Alerting', [224, 34, 110, 254]],
        '222': [ALERTING_STATES.Pending, 'Pending', [255, 153, 0, 254]],
        '111': [ALERTING_STATES.Normal, 'Normal', [27, 133, 94, 254]],
    }

export const ALERTING_NUMS = {Alerting: ALERT_MAP['255'], Pending: ALERT_MAP['222'], Normal: ALERT_MAP['111']}

export const DEFAULT_ICON_SIZE = 20

export const DEFAULT_ICON_RULE_LABEL = 'new rule'
export const DEFAULT_ICON_RULE_IS_COLLAPSED = true
export const DEFAULT_ICON_NAME = ''
export const DEFAULT_ICON_NAME2 = 'cisco/atm-switch'
export const DEFAULT_SVG_ICON_V_OFFSET = -5
export const DEFAULT_CLUSTER_SCALE = 40
export const DEFAULT_CLUSTER_ICON_SIZE = 45
export const DEFAULT_CLUSTER_MAX_ZOOM = 16
export const SEL_LINE_WIDTH_MULTIPLIER = 2


export const blankHoverInfo: Info = {}

export const emptyBiCol =  {
    shape: 'binary-feature-collection',
    points: {
        type: 'Point',
        positions: {value: new Float64Array([]), size:2},
        featureIds: {value: new Uint32Array([]), size:1},
        globalFeatureIds: {value: new Uint32Array([]), size:1},
        properties: [],
    },
    polygons: {
        type: 'Polygon',
        positions: {value: new Float32Array(), size: 2},
        featureIds: {value: new Uint16Array, size: 1},
        globalFeatureIds: {value: new Uint16Array(), size: 1},
        polygonIndices: {value: new Uint16Array(), size: 1},
        primitivePolygonIndices: {value: new Uint16Array(), size: 1},
        properties: [],
    },
    lines: {
        type: 'LineString',
        positions: {value:  new Float32Array(), size: 2},
        featureIds: {value: new Uint16Array(), size: 1},
        pathIndices: {value: new Uint16Array(), size: 1},
        globalFeatureIds: {value: new Uint16Array(), size: 1},
        properties: [],
    },
}

export const GLOBAL_OVERRIDE_COLORS = [
    DEFAULT_WARNING_COLOR,
    DEFAULT_CRITICAL_COLOR,
    DEFAULT_NO_THRESHOLD_COLOR,
];

export const FIXED_COLOR_LABEL = 'fixed'

export const NS_SEPARATOR = '.'
export const NS_PADDING = 25
export const RXDB_NS_PREFIX = 'mapgl'
export const RXDB_LOGIC_NAMESPACES = 'xy-namespaces'
export const CMN_NAMESPACE_PREFIX = 'cmn'
export const CMN_NAMESPACE = 'external'

export const ANNOTS_LABEL = 'annots & alerts query (built-in)'

export const MOC_LOC_FIELD = 'source'


