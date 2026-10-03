import { colTypes, Feature, BiColProps } from '../types/index';

export class FeatSource {
  colType: colTypes;
  layerName: string;
  frameRefId?: string;
  features: BiColProps[] | Feature[] = [];
  positionRanges: number[][] = [];
  colorLegend?: ReadonlyArray<{ color: string; value: number | null }>;
  useMockData = false;

  groups: any[] = [];

  constructor(colType: any, layerName: string) {
    this.colType = colType;
    this.layerName = layerName;
    this.setColorLegend = this.setColorLegend.bind(this);
    this.setFeatures = this.setFeatures.bind(this);
    this.setPositionRanges = this.setPositionRanges.bind(this);
  }

  setGroups = (groups: any): void => {
    this.groups = groups;
  };

  addGroup = (group: any) => {
    this.groups.push(group);
  };

  get getGroups() {
    return this.groups;
  }

  setColorLegend = (colorLegend: ReadonlyArray<{ color: string; value: number | null }> | undefined): void => {
    this.colorLegend = colorLegend;
  };

  setFeatures(features: BiColProps[] | Feature[], frameRefId: string | undefined) {
    this.frameRefId = frameRefId;
    this.features = features;
  }

  setPositionRanges(positionRanges: number[][]) {
    this.positionRanges = positionRanges;
  }
}
