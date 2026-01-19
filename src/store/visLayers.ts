import { VisLayer } from "./visLayer";
import type { LayerInfo, VisLayerEntry } from "./visLayer";
import {colTypes} from "mapLib/utils";

export interface VisLayerInfo {
    topLevel: LayerInfo[];
    children: LayerInfo[][];
}

export class VisLayers {
    visLayers: VisLayer[] = [];

    constructor() {
    }

    /* ---------------- ADD LAYER ---------------- */

    addLayer(
        label: string,
        name: string,
        group: string,
        fold: boolean,
        visible: boolean,
        indeterminate: boolean,
        parentIndex: number | null,
        combine: boolean | null
    ): number {
        const flat: VisLayerEntry[] = [];
        flattenLayers(this.visLayers, [], flat);

        const index = flat.length;

        const newLayer = new VisLayer(
            index,
            parentIndex,
            label,
            name,
            group,
            fold,
            visible,
            indeterminate,
            [],
            combine
        );

        if (parentIndex !== null && parentIndex !== undefined) {
            const parent = findLayerMutByIndex(this.visLayers, parentIndex);
            parent ? parent.children.push(newLayer) : this.visLayers.push(newLayer);
        } else {
            this.visLayers.push(newLayer);
        }

        const flatAfter: VisLayerEntry[] = [];
        flattenLayers(this.visLayers, [], flatAfter);
        return flatAfter.length - 1;
    }

    /* ---------------- VISIBILITY SYNC ---------------- */

    setGroupVisibility(): void {
        for (const grp of this.visLayers) {
            const childVis = grp.children.map(c => c.visible);

            if (childVis.every(Boolean)) {
                grp.visible = true;
                grp.indeterminate = false;
            } else if (childVis.every(v => !v)) {
                grp.visible = false;
                grp.indeterminate = false;
            } else {
                grp.visible = true;
                grp.indeterminate = true;
            }
        }
    }

    setChildVisibility(): void {
        for (const grp of this.visLayers) {
            const gv = grp.visible;
            const gi = grp.indeterminate;

            for (const child of grp.children) {
                child.indeterminate = false;

                if ((!gv || gi) && child.visible) {
                    child.indeterminate = true;
                }
            }
        }
    }

    /* ---------------- QUERIES ---------------- */

    hasGraph(): boolean {
        const markers = this.visLayers.find(l => l.group === colTypes.Markers);
        return !!markers?.children.some(c => c.visible && !c.indeterminate);
    }

    /* ---------------- SETTERS ---------------- */

    setFold(targetIndex: number | null, flag: boolean): void {
        if (targetIndex === null) return;
        const layer = findLayerMutByIndex(this.visLayers, targetIndex);
        if (layer) layer.fold = flag;
    }

    setVisible(
        targetIndex: number | null,
        name: string | null,
        group: string | null,
        flag: boolean
    ): void {
        const flat: VisLayerEntry[] = [];
        flattenLayers(this.visLayers, [], flat);

        const parentVisibility = new Map<number, boolean>();
        for (const entry of flat) {
            const allVisible = entry.path
                .filter(i => i !== entry.layer.index)
                .every(i => flat.find(e => e.layer.index === i)?.layer.visible ?? true);
            parentVisibility.set(entry.layer.index, allVisible);
        }

        recurseAndSet(
            this.visLayers,
            targetIndex,
            name,
            group,
            flag,
            parentVisibility
        );
    }

    /* ---------------- GETTERS ---------------- */

    getVisState(
        targetIndex: number | null,
        name: string | null,
        group: string | null
    ): [boolean, boolean] {
        for (const layer of this.visLayers) {
            const state = tryGetVisState(layer, targetIndex, name, group);
            if (state) return state;
        }
        return [false, false];
    }

    getLayersWithChildren(): VisLayerInfo {
        const topLevel: LayerInfo[] = [];
        const children: LayerInfo[][] = [];

        for (const layer of this.visLayers) {
            topLevel.push(toLayerInfo(layer));

            const list: LayerInfo[] = [];
            flattenChildren(layer.children, list);
            children.push(list);
        }

        return { topLevel, children };
    }

    /* ---------------- ACTIVE LAYERS ---------------- */

    getCategories(): string[] {
        return this.getVisibleNamespaces();
    }

    /* ---------------- PRIVATE ---------------- */

    private getVisibleNamespaces(): string[] {
        const out: string[] = [];
        for (const layer of this.visLayers) {
            if (layer.group === "graph" || layer.group === "markers") {
                collectVisibleNames(layer, out);
            }
        }
        return out;
    }
}

function flattenLayers(
    layers: VisLayer[],
    prefix: number[],
    out: VisLayerEntry[]
) {
    for (const layer of layers) {
        const path = [...prefix, layer.index];
        out.push({ layer, path });
        flattenLayers(layer.children, path, out);
    }
}

function flattenChildren(layers: VisLayer[], out: LayerInfo[]) {
    for (const layer of layers) {
        out.push(toLayerInfo(layer));
        flattenChildren(layer.children, out);
    }
}

function toLayerInfo(layer: VisLayer): LayerInfo {
    return {
        index: layer.index,
        parentIndex: layer.parentIndex,
        label: layer.label,
        name: layer.name,
        group: layer.group,
        fold: layer.fold,
        visible: layer.visible,
        indeterminate: layer.indeterminate,
        combine: layer.combine,
    };
}

function findLayerMutByIndex(
    layers: VisLayer[],
    idx: number
): VisLayer | undefined {
    for (const layer of layers) {
        if (layer.index === idx) return layer;
        const found = findLayerMutByIndex(layer.children, idx);
        if (found) return found;
    }
    return
}

function tryGetVisState(
    layer: VisLayer,
    idx: number | null,
    name: string | null,
    group: string | null
): [boolean, boolean] | null {
    if (idx !== null && layer.index === idx) {
        return [layer.visible, layer.indeterminate];
    }

    if (idx === null && name) {
        if (
            layer.name === name &&
            (group ? layer.group === group : true)
        ) {
            return [layer.visible, layer.indeterminate];
        }
    }

    for (const child of layer.children) {
        const state = tryGetVisState(child, idx, name, group);
        if (state) return state;
    }

    return null;
}

function collectVisibleNames(layer: VisLayer, out: string[]) {
    if (layer.visible && !layer.indeterminate) {
        out.push(layer.name);
    }
    for (const c of layer.children) {
        collectVisibleNames(c, out);
    }
}

function updateDescendants(
    layer: VisLayer,
    flag: boolean,
    parentVisible: boolean
) {
    for (const child of layer.children) {
        if (flag) {
            if (parentVisible) {
                if (child.indeterminate && child.visible) {
                    child.indeterminate = false;
                }
            } else if (child.visible) {
                child.indeterminate = true;
            }
        } else {
            if (child.visible) {
                child.indeterminate = true;
            }
        }

        updateDescendants(
            child,
            flag,
            child.visible && !child.indeterminate
        );
    }
}

function recurseAndSet(
    layers: VisLayer[],
    idx: number | null,
    name: string | null,
    group: string | null,
    flag: boolean,
    parentVis: Map<number, boolean>
): boolean {
    for (const layer of layers) {
        const matched =
            idx !== null
                ? layer.index === idx
                : name && group
                    ? layer.name === name && layer.group === group
                    : false;

        if (matched) {
            const parentsOn = parentVis.get(layer.index) ?? true;
            layer.indeterminate = parentsOn ? false : flag;
            layer.visible = flag;

            updateDescendants(
                layer,
                flag,
                layer.visible && !layer.indeterminate
            );
            return true;
        }

        if (
            recurseAndSet(
                layer.children,
                idx,
                name,
                group,
                flag,
                parentVis
            )
        ) {
            return true;
        }
    }
    return false;
}
