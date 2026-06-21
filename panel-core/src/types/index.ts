import type { Geometry, Position, GeoJsonProperties, LineString } from 'geojson';
import type { Edge } from '../graph/structs/edge';
import type { Entity } from '@msagl/core';
import type { Graph } from '../graph/structs/graph';
import type { FeatSource } from '../graph/FeatSource';
import type { BinaryFeatureCollection } from '@loaders.gl/schema';

export * from './panel';
export * from './deck';

export type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  yZoom: number;
  maxPitch?: number; // (45 * 0.95)
  pitch?: number;
  bearing?: number;
  padding?: any;
  camera?: any;
  target?: number[];
  rotationOrbit?: number;
  rotationX?: number;
  rotationY?: number;
  minRotationX?: number;
  maxRotationX?: number;
};

export const defViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  yZoom: 1 + 1,
};

export type CoordRef = string | Position | [number, number, 0, string, string];

export enum colTypes {
  GeoJson = 'geojson',
  Polygons = 'polygons',
  Path = 'path',
  Markers = 'markers',
  Nodes = 'nodes',
  Edges = 'edges',
  Routed = 'routed',
  Clusters = 'clusters',
  SVG = 'icon',
  Circle = 'circle',
  Label = 'label',
  Comments = 'comments',
  Hull = 'convex-hull',
  Text = 'text',
  Bboxes = 'bboxes',
}

export type LayerDragShift = {
  [p: string]: [number, number];
};

export type GraphBiFeatCol = BinaryFeatureCollection & {
  graph: Graph;
};

export type BiColProps = {
  id: number;
  locName: string;
  layerName: string;
  layerIdx?: number;
  entity?: Entity;
  frameRefId: string | undefined;
  rowIndex: number;
  featSource: FeatSource;
  graph?: Graph;
  rxPtId?: string;
  restoreCoords?: Position;
  all_annots?: Array<{
    alertName: string;
    newState: string;
    instance: string;
    timeEnd: number;
    data: unknown;
  }>;
  thrColor?: string; /// injected to get style group from props
  style: any; // StyleConfig
  edgeStyle: any; // StyleConfig
  arcStyle: any; // StyleConfig
  segrPath?: CoordsGuided[][];
  tilt?: number;
  liveUpd?: string;
  ack?: boolean;
  msg?: string;
  arrowAngles?: {
    start: number | undefined;
    end: number | undefined;
  };
  arrowTips?: {
    start?: Position;
    end?: Position;
  };
};

export type NodeData = {
  wasmId: number;
  idx?: number;
  feature?: BiColProps;
  rxPtId?: string;
  relLineIds?: Array<[lineIdx: number, isOutgoing: number]> | null;
};

export type CoordsGuided = { item: CoordRef; gIdx: number; coords: Position };

export interface Feature<G extends Geometry | null = Geometry, P = BiColProps> {
  id: number; // unique node # in coords field
  type: 'Feature' | 'LineString' | 'Polygon' | 'MultiLineString';
  rowIndex: number; // extra index for edges info on duplicate node records
  rxPtId?: string | undefined;
  relLineIds?: number[];
  restoreCoords?: Position;
  geometry?: G;
  properties: P;
}

export interface DeckLine<G extends Geometry | null = Geometry, P = BiColProps> {
  //id: number;
  heIdx: number;
  fragIdx: number;
  edgeId: string;
  skip?: boolean;
  renderGeometryOnly?: boolean;
  hideArrowheads?: boolean;
  type: 'Feature';
  rowIndex: number;
  geometry: LineString;
  properties: Partial<P>;
}

// used for insta-render of parentPath line onEditing lines/icons
export type PathCoordsAndStyle = [Position[], RGBAColor, number, number?, boolean?]; //pos[], color, lineWidth, lineId, skip?

export type ParentInfo = {
  title: string;
  lineId: number | null;
  edgeId: string;
  rxEdgeId: string;
  edge: Edge;
  parPath: CoordRef[];
  rPath: CoordRef[];
};

export type PointFeatureProperties = GeoJsonProperties & {
  frameName: string;
  rowIndex: number;
  locName: string;
  metric: number;
  thrColor?: string;
  [key: string]: unknown;
};

export interface Info {
  layer?: any;
  x?: number;
  y?: number;
  object?: any;
  isLog?: boolean;
  height?: number;
  properties?: {
    cluster?: boolean;
    cluster_id: string;
    guideType?: string;
    expZoom?: number;
    isShowTooltip?: Boolean;
    colorCounts?: { [color: string]: { count: number; label: string } };
    annotStateCounts?: { [color: string]: { count: number; label: string } };
    isHull: boolean;
    [key: string]: unknown;
  };
}

export type RGBAColor = [number, number, number] | [number, number, number, number];

type libreLayer = {
  id: string;
  type: string;
  source: string;
  minzoom: number;
  maxzoom: number;
};
export type libreSource = {
  version: number;
  sources: {};
  layers: [] | [libreLayer];
};

export interface ScoreProperties {
  rxPtId: string;
  coords?: Position;
}
export type NameToScoreMap = Map<string, ScoreProperties>;

export type ComFeature = {
  type: 'Feature';
  id: any;
  edgeId: string;
  comId: string;
  geometry: {
    type: 'Point';
    coordinates: Position;
  };
  properties: Comment;
};

export type Comment = {
  text: string;
  layerName: string;
  graph: Graph;
  isComment?: boolean;
  iconColor: string;
  locName: string;
  style: any;
  index: number;
  coords?: Position;
  edge?: Edge;
};

export type CommentsData = {
  [src: string]: Map<number, Comment>;
};

export interface PushPathProps {
  graphA: Graph;
  graphB: Graph;
  panel: any;
  parPath: CoordRef[];
  layerIdx?: number;
  wrap?: number;
  aMetric?: number;
  bMetric?: number;
  cMetric?: number;
  edgeId?: string;
  dataRecord: BiColProps;
  commentsData: CommentsData;
  theme: any;
  rxEdgeId?: string;
  isEdit?: boolean;
}

export type PushDummyEdgesProps = {
  graphA: any;
  graphB: any;
  edgeId: string;
  data: any;
  multiEdges: Edge[];
  parPath: CoordRef[];
  positions: any;
  findNodeA: (id: string) => any;
  findNodeB: (id: string) => any;
  duplicateIdx?: number;
};

export interface QueryHost extends Partial<Feature> {
  _data?: any;
  locName: string;
  metric: number | undefined;
  ack?: string;
  msg?: string;
  updatedAt: string;
}

export type { LayoutArrowTips, LayoutCache } from '../graph/utils/layout-worker-client';
export type { LayoutCurveGroup, LayoutGraphResult } from '../graph/utils/layout-worker-types';
