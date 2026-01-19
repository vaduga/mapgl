import {Geometry, Position, GeoJsonProperties} from 'geojson'
import {MultiLineString} from "geojson";
import {FeatSource} from "../FeatSource";
import {Edge} from "../structs/edge";
import {Node} from "../structs/node";
import {Entity} from "../structs/entity";
import { Graph } from '../structs/graph';

export type ViewState = {
  longitude: number,
  latitude: number,
  zoom: number,
  minZoom?: number,
  maxZoom?: number,
  yZoom: number,
  maxPitch?: number,      // (45 * 0.95)
  pitch?: number,
  bearing?: number,
  padding?: any
  camera?: any
  target?: number[],
  rotationOrbit?: number,
  rotationX?: number,
  rotationY?: number,
  minRotationX?: number,
  maxRotationX?: number,
}

export const defViewState = {
  longitude: 0,
  latitude: 0,
  zoom: 1,
  yZoom: 1+1
}

export type CoordRef = string | Position | [number,number,0, string, string]

export enum colTypes {
  GeoJson = "geojson",
  Polygons = "polygons",
  Path = "path",
  Markers = "markers",
  Nodes = "nodes",
  Edges = "edges",
  Hyperedges = "routed", //"hyperedges",
  Clusters = "clusters",
  SVG = "icon",
  Circle = "circle",
  Label = "label",
  Comments = "comments",
  Hull = "convex-hull",
  Text = "text",
  Bboxes = "bboxes",
}


export type LayerDragShift = {
    [p: string]: [number, number]
}

export type BiColProps = {
  id: number,
  locName: string,
  layerName: string,
  layerIdx?: number,
  entity?: Entity,
  frameRefId: string | undefined,
  rowIndex: number,
  root: Graph,
  featSource: FeatSource,
  thrColor?: string,  /// injected to get style group from props
  style: any // StyleConfig
  edgeStyle: any // StyleConfig
  arcStyle: any // StyleConfig
  segrPath?: CoordsGuided[][],
  d0?: number, // distances for offsets
  d1?: number,
  liveUpd?: string;
  ack?: boolean,
  msg?: string,
};

export type CoordsGuided = {item: CoordRef, gIdx: number, coords: Position}


export interface Feature<G extends Geometry | null = Geometry, P = BiColProps> {
  id: number; // unique node # in coords field
  type: 'Feature' | 'LineString' | 'Polygon' | 'MultiLineString' ;
  rowIndex: number; // extra index for edges info on duplicate node records
  rxPtId?: string | undefined,
  relLineIds?: number[],
  restoreCoords?: Position
  geometry?: G;
  properties: P;
}

export interface DeckLine<G extends Geometry | null = Geometry, P = BiColProps> {
  //id: number;
  edgeId: string;
  type: 'Feature';
  rowIndex: number;
  geometry: MultiLineString;
  // from: { coordinates: Position };
  // to: { coordinates: Position };
  properties: Partial<P>;
}


// used for insta-render of parentPath line onEditing lines/icons
export type CoordsAndProps = [Position[], string, number, number?]

export type ParName = string
export type ParentInfo = {
  title: string;
  lineId: number | null, edgeId: string, rxEdgeId: string, edge: Edge,parPath: CoordRef[], isEph: boolean, rPath: CoordRef[] }

export type Sources = {[key: ParName]: ParentInfo }

export type Threshold = {
  color: string,
  lineWidth?: number,
  label: string}

export type PointFeatureProperties = GeoJsonProperties & {
  frameName: string;
  rowIndex: number;
  locName: string,
  metric: number,
  thrColor?: string,
  [key: string]: unknown
};

export interface Info {
  layer?: any;
  x?: number,
  y?: number,
  object? : any;
  isLog?: boolean,
  height?: number,
  properties?: {
    cluster?: boolean,
    cluster_id: string,
    guideType?: string;
    expZoom?: number;
    isShowTooltip?: Boolean;
    colorCounts?: { [color: string]: { count: number, label: string } }
    annotStateCounts?: { [color: string]: { count: number, label: string }}
    isHull: boolean,
    [key: string]: unknown
  },
}

export interface DeckInstaFeature<G extends Geometry | null = Geometry, P = PointFeatureProperties> {
  id: number;
  coordinates: Position;
  properties: P;
}

export type RGBAColor = [number, number, number] | [number,number,number,number]

type libreLayer = {     id: string;     type: string;     source: string;     minzoom: number;     maxzoom: number; }
export type libreSource = {
  version: number,
  sources: {},
  layers: [] | [libreLayer]
}

export interface ScoreProperties {
  rxPtId: string;
  coords?: Position;
}
export type NameToScoreMap = Map<string, ScoreProperties>;

export type ComFeature = {
  type: "Feature",
  id: any,
  edgeId: string,
  comId: string,
  geometry: {
    type: 'Point',
    coordinates: Position
  },
  properties: Comment
}

export type Comment =  {
  text: string,
  layerName: string,
  root: Graph,
  isComment?: boolean,
  iconColor: string,
  style: any,
  index: number,
  coords?: Position,
  edge?: Edge,
}

export type CommentsData = {
  [src: string]: Map<number, Comment>;
};



export interface QueryHost extends Partial<Feature> {
  _data?: any;
  locName: string;
  metric: number | undefined;
  ack?: string;
  msg?: string;
  updatedAt: string;
}




