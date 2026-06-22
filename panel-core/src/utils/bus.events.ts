import { BusEventWithPayload } from '@grafana/data';
import type { Edge } from '@mapgl/panel-core/graph';
import type { RuntimeUpdateEvent } from '../extension-points/featureContracts';

export class SelectNodeEvent extends BusEventWithPayload<{
  pId: number;
  nodeId?: string;
  edge?: Edge;
  edgeId?: string;
  graphId?: string;
  fly?: boolean;
  select?: boolean;
  zoomIn?: boolean;
  coord?: number[];
}> {
  static type = 'selectNode';
}

export class BasemapChangeEvent extends BusEventWithPayload<number> {
  static type = 'mapType';
}
export class MapViewChangeEvent extends BusEventWithPayload<number> {
  static type = 'mapView';
}

export class PanelEditEnteredEvent extends BusEventWithPayload<number> {
  static type = 'panel-edit-started';
}

export class PanelEditExitedEvent extends BusEventWithPayload<number> {
  static type = 'panel-edit-finished';
}

export class ThresholdNodeChangeEvent extends BusEventWithPayload<number> {
  static type = 'nodeThresholdType';
}

export class ThresholdEdgeChangeEvent extends BusEventWithPayload<number> {
  static type = 'edgeThresholdType';
}

export class MapglRuntimeUpdateEvent extends BusEventWithPayload<RuntimeUpdateEvent> {
  static type = 'mapgl-runtime-update';
}
