// visLayer.ts

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

/**
 * Equivalent of Rust's VisLayerEntry
 * path: tree path, e.g. [0, 2, 1] => root[0].children[2].children[1]
 */
export interface VisLayerEntry {
    path: number[];
    layer: VisLayer;
}

/**
 * Equivalent of Rust's LayerInfo (no children)
 */
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
