export class VisLayer {
  index: number;
  parentIndex: number | null;
  label: string;
  name: string;
  group: string;
  fold: boolean;
  visible: boolean;
  indeterminate: boolean;
  children: VisLayer[];
  combine: boolean | null;

  constructor(
    index: number,
    parentIndex: number | null,
    label: string,
    name: string,
    group: string,
    fold: boolean,
    visible: boolean,
    indeterminate: boolean,
    children: VisLayer[] = [],
    combine: boolean | null = null
  ) {
    this.index = index;
    this.parentIndex = parentIndex;
    this.label = label;
    this.name = name;
    this.group = group;
    this.fold = fold;
    this.visible = visible;
    this.indeterminate = indeterminate;
    this.children = children;
    this.combine = combine;
  }

  setVisible(flag: boolean): void {
    this.visible = flag;
  }

  setIndeterminate(flag: boolean): void {
    this.indeterminate = flag;
  }

  setFold(fold: boolean): void {
    this.fold = fold;
  }

  getVisible(): boolean {
    return this.visible;
  }

  getIndeterminate(): boolean {
    return this.indeterminate;
  }
}

export interface VisLayerEntry {
  path: number[];
  layer: VisLayer;
}

export interface LayerInfo {
  index: number;
  parentIndex: number | null;
  label: string;
  name: string;
  group: string;
  fold: boolean;
  visible: boolean;
  indeterminate: boolean;
  combine: boolean | null;
}

export interface LayerTreeInfo extends LayerInfo {
  children: LayerTreeInfo[];
}
