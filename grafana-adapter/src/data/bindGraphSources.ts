import type { DataFrame, Field } from '@grafana/data';
import type { GraphSource, SourceRevision, ValueColumn } from '@vaduga/mapgl-core/data';

export interface GraphSourceFields {
  readonly nodeId: Field;
  readonly target?: Field;
  readonly edgeId?: Field;
  readonly sourceNamespace?: Field;
  readonly targetNamespace?: Field;
}

/** Capture mutable JSON-like datasource cells without duplicating row objects. */
export function captureGrafanaValue<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (!value || typeof value !== 'object') {
    return value;
  }
  if (seen.has(value)) {
    return seen.get(value) as T;
  }
  if (value instanceof Date) {
    return new Date(value.getTime()) as T;
  }
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype) {
    return value;
  }
  const copy: any = Array.isArray(value) ? [] : {};
  seen.set(value, copy);
  for (const [key, child] of Object.entries(value)) {
    copy[key] = captureGrafanaValue(child, seen);
  }
  return copy;
}

/** Field selection/location discovery are performed by the Grafana integration. */
export function bindGraphSource({
  frame,
  sourceIndex,
  revision,
  fields,
  position,
  snapshot = false,
}: {
  snapshot?: boolean;
  frame: DataFrame;
  sourceIndex: number;
  revision: SourceRevision;
  fields: GraphSourceFields;
  position: (rowIndex: number) => readonly [number, number] | undefined;
}): GraphSource {
  // Snapshot columns once, never build a per-row object graph. Mutable host
  // streams cannot change an in-flight revision through captured frame values.
  const columns = new Map<Field, ValueColumn>();
  const byName = new Map<string, ValueColumn>();
  for (const field of frame.fields) {
    const values = snapshot ? field.values : field.values.map((value) => captureGrafanaValue(value));
    const column = Object.freeze({ key: field.name, length: values.length, get: (index: number) => values[index] });
    columns.set(field, column);
    byName.set(field.name, column);
  }
  const positions = Array.from({ length: frame.length }, (_, rowIndex) => {
    const value = position(rowIndex);
    return value ? Object.freeze([value[0], value[1]] as const) : undefined;
  });
  return Object.freeze({
    revision,
    key: frame.refId ?? frame.name ?? `source-${sourceIndex}`,
    index: sourceIndex,
    rowCount: frame.length,
    nodeId: columns.get(fields.nodeId)!,
    target: fields.target && columns.get(fields.target),
    edgeId: fields.edgeId && columns.get(fields.edgeId),
    sourceNamespace: fields.sourceNamespace && columns.get(fields.sourceNamespace),
    targetNamespace: fields.targetNamespace && columns.get(fields.targetNamespace),
    value: (key: string, rowIndex: number) => byName.get(key)?.get(rowIndex),
    position: (rowIndex: number) => positions[rowIndex],
  });
}

/** Native row resolution rejects source references from another revision. */
export class GrafanaSourceResolver {
  constructor(
    readonly revision: SourceRevision,
    private readonly frames: readonly DataFrame[]
  ) {}

  resolve(row: { revision: SourceRevision; sourceIndex: number; sourceKey: string; rowIndex: number }) {
    if (row.revision !== this.revision) {
      return undefined;
    }
    const frame = this.frames[row.sourceIndex];
    if (
      !frame ||
      (frame.refId ?? frame.name ?? `source-${row.sourceIndex}`) !== row.sourceKey ||
      row.rowIndex < 0 ||
      row.rowIndex >= frame.length
    ) {
      return undefined;
    }
    return { frame, frameIndex: row.sourceIndex, rowIndex: row.rowIndex };
  }
}
