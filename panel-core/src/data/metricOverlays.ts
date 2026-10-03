import type { SourceRow, SourceView } from './sources';
export interface MetricUpdate {
  readonly row: SourceRow;
  readonly propertyKey: string;
  readonly value: unknown;
}
export function sameMetricRow(left: SourceRow, right: SourceRow): boolean {
  return (
    left.revision === right.revision &&
    left.sourceKey === right.sourceKey &&
    left.sourceIndex === right.sourceIndex &&
    left.rowIndex === right.rowIndex &&
    (left.layerIndex ?? 0) === (right.layerIndex ?? 0)
  );
}

/** Sparse overlays retain the immutable query baseline and its row provenance. */
export class MetricOverlays {
  private readonly values: ReadonlyMap<string, unknown>;
  constructor(values: ReadonlyMap<string, unknown> = new Map()) {
    this.values = values;
  }
  private key(row: Pick<SourceRow, 'sourceIndex' | 'rowIndex'>, propertyKey: string) {
    return JSON.stringify([row.sourceIndex, row.rowIndex, propertyKey]);
  }
  withUpdates(updates: readonly MetricUpdate[]): MetricOverlays {
    const values = new Map(this.values);
    for (const update of updates) {
      values.set(this.key(update.row, update.propertyKey), update.value);
    }
    return new MetricOverlays(values);
  }
  source<T extends SourceView>(source: T): T {
    const properties = new Set<string>();
    for (const key of this.values.keys()) {
      const [sourceIndex, , property] = JSON.parse(key);
      if (sourceIndex === source.index) {
        properties.add(property);
      }
    }
    return Object.freeze({
      ...source,
      overlaidProperties: properties,
      value: (propertyKey: string, rowIndex: number) => {
        const key = this.key({ sourceIndex: source.index, rowIndex }, propertyKey);
        return this.values.has(key) ? this.values.get(key) : source.value(propertyKey, rowIndex);
      },
    });
  }
}
