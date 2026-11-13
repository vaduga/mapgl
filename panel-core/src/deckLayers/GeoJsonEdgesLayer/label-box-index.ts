import type { LabelBox } from './route-labels';

/** Bounded uniform grid. Oversized cards avoid pathological cell allocation. */
export class LabelBoxIndex {
  private cells = new Map<string, LabelBox[]>();
  private large: LabelBox[] = [];
  private all: LabelBox[] = [];
  private keys(box: LabelBox): string[] | undefined {
    const x0 = Math.floor((box.x - box.hw) / 128),
      x1 = Math.floor((box.x + box.hw) / 128);
    const y0 = Math.floor((box.y - box.hh) / 128),
      y1 = Math.floor((box.y + box.hh) / 128);
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 256) {
      return undefined;
    }
    const keys: string[] = [];
    for (let x = x0; x <= x1; x++) {
      for (let y = y0; y <= y1; y++) {
        keys.push(`${x}:${y}`);
      }
    }
    return keys;
  }
  insert(box: LabelBox) {
    this.all.push(box);
    const keys = this.keys(box);
    if (!keys) {
      this.large.push(box);
      return;
    }
    for (const key of keys) {
      let cell = this.cells.get(key);
      if (!cell) {
        cell = [];
        this.cells.set(key, cell);
      }
      cell.push(box);
    }
  }
  overlaps(box: LabelBox): LabelBox[] {
    const keys = this.keys(box);
    const candidates = keys ? new Set([...this.large, ...keys.flatMap((key) => this.cells.get(key) ?? [])]) : this.all;
    const hits: LabelBox[] = [];
    for (const other of candidates) {
      if (Math.abs(other.x - box.x) < other.hw + box.hw && Math.abs(other.y - box.y) < other.hh + box.hh) {
        hits.push(other);
      }
    }
    return hits;
  }
}
