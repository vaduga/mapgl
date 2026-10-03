/** A source revision identifies immutable values, not a host query or panel ID. */
export type SourceRevision = string;

export interface SourceRow {
  readonly revision: SourceRevision;
  readonly sourceKey: string;
  readonly sourceIndex: number;
  readonly rowIndex: number;
  readonly layerIndex?: number;
}

export interface ValueColumn<T = unknown> {
  readonly key: string;
  readonly length: number;
  get(rowIndex: number): T;
}

/** Indexed views avoid materializing an object for every datasource row. */
export interface SourceView {
  readonly overlaidProperties?: ReadonlySet<string>;
  readonly revision: SourceRevision;
  readonly key: string;
  readonly index: number;
  readonly rowCount: number;
  value(propertyKey: string, rowIndex: number): unknown;
}

export interface GraphSource extends SourceView {
  readonly nodeId: ValueColumn;
  readonly target?: ValueColumn;
  readonly edgeId?: ValueColumn;
  readonly sourceNamespace?: ValueColumn;
  readonly targetNamespace?: ValueColumn;
  position(rowIndex: number): readonly [number, number] | undefined;
}

export function sourceRow(source: SourceView, rowIndex: number, layerIndex?: number): SourceRow {
  return Object.freeze({
    revision: source.revision,
    sourceKey: source.key,
    sourceIndex: source.index,
    rowIndex,
    ...(layerIndex !== undefined && { layerIndex }),
  });
}

export function arrayColumn<T>(key: string, values: readonly T[]): ValueColumn<T> {
  return Object.freeze({ key, length: values.length, get: (rowIndex: number) => values[rowIndex] });
}
