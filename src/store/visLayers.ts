import { type LayerInfo, type LayerTreeInfo, type VisLayerEntry, VisLayer } from './visLayer';
import { colTypes } from 'mapLib/utils';

export class VisLayers {
  visLayers: VisLayer[] = [];
  activeGroups: Uint8Array = new Uint8Array();

  constructor() {}

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

    const newLayer = new VisLayer(index, parentIndex, label, name, group, fold, visible, indeterminate, [], combine);

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
    for (const layer of this.visLayers) {
      syncGroupVisibility(layer);
    }
  }

  setChildVisibility(): void {
    for (const layer of this.visLayers) {
      syncChildVisibility(layer, false);
    }
  }

  /* ---------------- QUERIES ---------------- */

  hasGraph(): boolean {
    const markers = this.visLayers.find((l) => l.group === colTypes.Markers);
    return !!markers?.children.some((c) => c.visible && !c.indeterminate);
  }

  /* ---------------- SETTERS ---------------- */

  setFold(targetIndex: number | null, flag: boolean): void {
    if (targetIndex === null) {
      return;
    }
    const layer = findLayerMutByIndex(this.visLayers, targetIndex);
    if (layer) {
      layer.fold = flag;
    }
  }

  setVisible(targetIndex: number | null, name: string | null, group: string | null, flag: boolean): void {
    recurseAndSet(this.visLayers, targetIndex, name, group, flag, true);
  }

  /* ---------------- GETTERS ---------------- */

  getVisState(targetIndex: number | null, name: string | null, group: string | null): [boolean, boolean] {
    for (const layer of this.visLayers) {
      const state = tryGetVisState(layer, targetIndex, name, group);
      if (state) {
        return state;
      }
    }
    return [false, false];
  }

  getLayerTree(): LayerTreeInfo[] {
    return this.visLayers.map(toLayerTreeInfo);
  }

  /* ---------------- ACTIVE GROUPS ---------------- */

  setActiveGroups(groups: Uint8Array): void {
    this.activeGroups = new Uint8Array(groups); //new Uint8Array(groups.length).fill(1)
  }

  getActiveGroups(): Uint8Array {
    return this.activeGroups;
  }

  getCategories(): [Uint8Array, string[]] {
    return [this.getActiveGroupIndexes(), this.getVisibleNamespaces()];
  }

  /* ---------------- PRIVATE ---------------- */

  private getActiveGroupIndexes(): Uint8Array {
    const result: number[] = [];
    const groups = this.activeGroups; // Uint8Array
    for (let i = 0; i < groups.length; i++) {
      if (groups[i] === 1) {
        result.push(i);
      }
    }
    return new Uint8Array(result);
  }

  private getVisibleNamespaces(): string[] {
    const out: Set<string> = new Set();
    for (const layer of this.visLayers) {
      if (layer.group === 'graph' || layer.group === colTypes.Markers) {
        collectVisibleNames(layer, out);
      }
    }
    return Array.from(out);
  }
}

function flattenLayers(layers: VisLayer[], prefix: number[], out: VisLayerEntry[]) {
  for (const layer of layers) {
    const path = [...prefix, layer.index];
    out.push({ layer, path });
    flattenLayers(layer.children, path, out);
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

function toLayerTreeInfo(layer: VisLayer): LayerTreeInfo {
  return {
    ...toLayerInfo(layer),
    children: layer.children.map(toLayerTreeInfo),
  };
}

function findLayerMutByIndex(layers: VisLayer[], idx: number): VisLayer | undefined {
  for (const layer of layers) {
    if (layer.index === idx) {
      return layer;
    }
    const found = findLayerMutByIndex(layer.children, idx);
    if (found) {
      return found;
    }
  }
  return;
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

  for (const child of layer.children) {
    const state = tryGetVisState(child, idx, name, child.group);
    if (state) {
      return state;
    }
  }

  if (idx === null && name) {
    if (layer.name === name && (group ? layer.group === group : true)) {
      return [layer.visible, layer.indeterminate];
    }
  }

  return null;
}

function collectVisibleNames(layer: VisLayer, out: Set<string>) {
  if (layer.visible && !layer.indeterminate) {
    out.add(layer.name);
  }
  for (const c of layer.children) {
    collectVisibleNames(c, out);
  }
}

function syncGroupVisibility(layer: VisLayer): void {
  for (const child of layer.children) {
    syncGroupVisibility(child);
  }

  if (!layer.children.length) {
    return;
  }

  const allVisible = layer.children.every((child) => child.visible && !child.indeterminate);
  const allHidden = layer.children.every((child) => !child.visible && !child.indeterminate);
  if (allVisible) {
    layer.visible = true;
    layer.indeterminate = false;
  } else if (allHidden) {
    layer.visible = false;
    layer.indeterminate = false;
  } else {
    layer.visible = true;
    layer.indeterminate = true;
  }
}

function syncChildVisibility(layer: VisLayer, maskedByAncestor: boolean): void {
  const currentMasked = maskedByAncestor || !layer.visible || layer.indeterminate;
  for (const child of layer.children) {
    child.indeterminate = false;
    if (currentMasked && child.visible) {
      child.indeterminate = true;
    }

    const childMasked = currentMasked || !child.visible || child.indeterminate;
    syncChildVisibility(child, childMasked);
  }
}

function updateDescendants(layer: VisLayer, flag: boolean, parentVisible: boolean) {
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

    updateDescendants(child, flag, child.visible && !child.indeterminate);
  }
}

function recurseAndSet(
  layers: VisLayer[],
  idx: number | null,
  name: string | null,
  group: string | null,
  flag: boolean,
  ancestorsVisible: boolean
): boolean {
  for (const layer of layers) {
    const matched =
      idx !== null ? layer.index === idx : name && group ? layer.name === name && layer.group === group : false;

    if (matched) {
      layer.indeterminate = ancestorsVisible ? false : flag;
      layer.visible = flag;

      updateDescendants(layer, flag, ancestorsVisible && layer.visible && !layer.indeterminate);
      return true;
    }

    const nextAncestorsVisible = ancestorsVisible && layer.visible && !layer.indeterminate;
    if (recurseAndSet(layer.children, idx, name, group, flag, nextAncestorsVisible)) {
      return true;
    }
  }
  return false;
}
