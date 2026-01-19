import {colTypes, Feature, BiColProps} from "./utils/interfaces";

export class FeatSource {

    colType: colTypes
    layerName: string
    __state: any = {}
    frameRefId?: string
    features: BiColProps[] | Feature[] = []
    positionRanges: Array<number[]> = [];
    colorThresholds?: any
    useMockData: boolean = false

    groups: any[] = [];


    constructor(colType: any, layerName: string) {
        this.colType = colType;
        this.layerName = layerName
        this.getState = this.getState.bind(this);
        this.setThresholds = this.setThresholds.bind(this);
        this.setFeatures = this.setFeatures.bind(this);
        this.setPositionRanges = this.setPositionRanges.bind(this);
        this.clear = this.clear.bind(this);

    }

    setGroups = (groups: any): void => {
        this.groups = groups
    }

    addGroup = (group: any) => {
        this.groups.push(group)
    }


    get getGroups() {
        return this.groups
    }



    setThresholds = (colorThresholds: any | undefined): void => {  // ThresholdsConfig
        this.colorThresholds = colorThresholds ?? {};
    }

    setFeatures(features: BiColProps[] | Feature[], frameRefId: string | undefined) {
        this.frameRefId = frameRefId;
        this.features = features;
    }

    setPositionRanges(positionRanges: Array<number[]>) {
        this.positionRanges = positionRanges;
    }

    getState() {
        return this.__state
    }

    clear() {
    this.features = []
        }

}
