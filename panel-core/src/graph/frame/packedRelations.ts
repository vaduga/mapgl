import type { CoordRef } from '../../types';
import type { GraphFrameDiagnosticContext, GraphRowRef } from './types';
import type { GraphDiagnosticCollector } from './diagnostics';

export const PACKED_INVALID_REF = 0xffffffff;
export const PACKED_ROUTE_COORDINATE_TAG = 0x80000000;
export const PACKED_ROUTE_REF_MASK = 0x7fffffff;
export const PACKED_MAX_REF = PACKED_ROUTE_REF_MASK - 1;

export const packedRelationLayout = Object.freeze({
  record: Object.freeze({
    keySymbol: 0,
    idSymbol: 1,
    sourceNode: 2,
    targetNode: 3,
    routeStart: 4,
    routeLength: 5,
    unitStart: 6,
    unitCount: 7,
    primaryRow: 8,
    flags: 9,
    stride: 10,
  }),
  unit: Object.freeze({
    routeStart: 0,
    routeLength: 1,
    row: 2,
    sourceNode: 3,
    stride: 4,
  }),
  annotation: Object.freeze({
    textSymbol: 0,
    colorSymbol: 1,
    stride: 2,
  }),
});

export const PackedRelationFlags = Object.freeze({
  explicitId: 1 << 0,
});

const TEMP_UNIT = Object.freeze({
  keySymbol: 0,
  idSymbol: 1,
  sourceKeySymbol: 2,
  targetKeySymbol: 3,
  targetIdSymbol: 4,
  routeStart: 5,
  routeLength: 6,
  row: 7,
  flags: 8,
  stride: 9,
});

export interface PackedRelationUnitHeader {
  readonly key: string;
  readonly id: string;
  readonly sourceKey: string;
  readonly targetKey: string;
  readonly targetId: string;
  readonly row: GraphRowRef;
  readonly explicitId: boolean;
  readonly diagnosticContext?: GraphFrameDiagnosticContext;
}

export interface PackedCoordinateMetadata {
  readonly elevation?: number;
  readonly commentText?: string;
  readonly iconColor?: string;
}

export interface PackedFinalizeOptions {
  readonly nodeRefByKey: ReadonlyMap<string, number>;
  readonly diagnostics?: GraphDiagnosticCollector;
}

export interface PackedRelationsBuilderOptions {
  readonly maxRef?: number;
}

export class PackedRelationCapacityError extends Error {
  constructor(
    readonly pool: string,
    readonly value: number,
    readonly maximum: number
  ) {
    super(`Packed ${pool} cardinality ${value} exceeds ${maximum}`);
    this.name = 'PackedRelationCapacityError';
  }
}

export function isPackedRelationCapacityError(value: unknown): value is PackedRelationCapacityError {
  return value instanceof PackedRelationCapacityError;
}

class StringInterner {
  private readonly refs = new Map<string, number>();
  private readonly values: string[] = [];

  constructor(private readonly maximum: number) {}

  intern(value: string): number {
    const existing = this.refs.get(value);
    if (existing !== undefined) {
      return existing;
    }
    const ref = this.values.length;
    assertCapacity('symbol', ref, this.maximum);
    this.refs.set(value, ref);
    this.values.push(value);
    return ref;
  }

  snapshot(): readonly string[] {
    return Object.freeze([...this.values]);
  }

  clear(): void {
    this.refs.clear();
    this.values.length = 0;
  }
}

class RowInterner {
  private readonly refs = new Map<string, number>();
  private readonly values: GraphRowRef[] = [];

  constructor(private readonly maximum: number) {}

  intern(row: GraphRowRef): number {
    const key = `${row.frameIndex}\u0000${row.frameRefId ?? ''}\u0000${row.rowIndex}\u0000${row.layerIndex ?? ''}`;
    const existing = this.refs.get(key);
    if (existing !== undefined) {
      return existing;
    }
    const ref = this.values.length;
    assertCapacity('row', ref, this.maximum);
    this.refs.set(key, ref);
    this.values.push(Object.isFrozen(row) ? row : Object.freeze({ ...row }));
    return ref;
  }

  snapshot(): readonly GraphRowRef[] {
    return Object.freeze([...this.values]);
  }

  clear(): void {
    this.refs.clear();
    this.values.length = 0;
  }
}

export class PackedGraphRelationsBuilder {
  private readonly maximum: number;
  private readonly symbols: StringInterner;
  private readonly rows: RowInterner;
  private readonly unitWords: number[] = [];
  private readonly unitContexts: Array<GraphFrameDiagnosticContext | undefined> = [];
  private readonly routeTokens: number[] = [];
  private readonly nodeIdSymbolByKeySymbol = new Map<number, number>();
  private readonly coordinateValues: number[] = [];
  private readonly coordinateElevations: number[] = [];
  private readonly coordinateTextSymbols: number[] = [];
  private readonly coordinateColorSymbols: number[] = [];
  private activeUnit = -1;
  private finalized = false;

  constructor(options: PackedRelationsBuilderOptions = {}) {
    this.maximum = options.maxRef ?? PACKED_MAX_REF;
    if (!Number.isInteger(this.maximum) || this.maximum < 1 || this.maximum > PACKED_MAX_REF) {
      throw new Error(`maxRef must be an integer between 1 and ${PACKED_MAX_REF}`);
    }
    this.symbols = new StringInterner(this.maximum);
    this.rows = new RowInterner(this.maximum);
  }

  beginUnit(header: PackedRelationUnitHeader): number {
    this.assertWritable();
    if (this.activeUnit !== -1) {
      throw new Error('Finish the active packed relation unit before beginning another');
    }

    const unitRef = this.unitWords.length / TEMP_UNIT.stride;
    assertCapacity('unit', unitRef, this.maximum);
    this.unitWords.push(
      this.symbols.intern(header.key),
      this.symbols.intern(header.id),
      this.symbols.intern(header.sourceKey),
      this.symbols.intern(header.targetKey),
      this.symbols.intern(header.targetId),
      this.routeTokens.length,
      0,
      this.rows.intern(header.row),
      header.explicitId ? PackedRelationFlags.explicitId : 0
    );
    this.unitContexts.push(header.diagnosticContext ? Object.freeze({ ...header.diagnosticContext }) : undefined);
    this.activeUnit = unitRef;
    return unitRef;
  }

  pushNodeKey(nodeKey: string, nodeId = nodeKey): void {
    this.assertActiveUnit();
    const symbolRef = this.symbols.intern(nodeKey);
    if (!this.nodeIdSymbolByKeySymbol.has(symbolRef)) {
      this.nodeIdSymbolByKeySymbol.set(symbolRef, this.symbols.intern(nodeId));
    }
    assertCapacity('route token', this.routeTokens.length, this.maximum);
    this.routeTokens.push(symbolRef);
  }

  pushCoordinate(longitude: number, latitude: number, metadata: PackedCoordinateMetadata = {}): number {
    this.assertActiveUnit();
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
      throw new Error('Packed route coordinates must contain finite x/y values');
    }
    if (metadata.elevation !== undefined && !Number.isFinite(metadata.elevation)) {
      throw new Error('Packed route elevation must be finite when present');
    }

    const coordinateRef = this.coordinateValues.length / 2;
    assertCapacity('coordinate', coordinateRef, this.maximum);
    this.coordinateValues.push(longitude, latitude);
    this.coordinateElevations.push(metadata.elevation ?? Number.NaN);
    this.coordinateTextSymbols.push(
      metadata.commentText === undefined ? PACKED_INVALID_REF : this.symbols.intern(metadata.commentText)
    );
    this.coordinateColorSymbols.push(
      metadata.iconColor === undefined ? PACKED_INVALID_REF : this.symbols.intern(metadata.iconColor)
    );
    assertCapacity('route token', this.routeTokens.length, this.maximum);
    this.routeTokens.push(encodeCoordinateToken(coordinateRef));
    return coordinateRef;
  }

  finishUnit(): void {
    this.assertActiveUnit();
    const offset = this.activeUnit * TEMP_UNIT.stride;
    this.unitWords[offset + TEMP_UNIT.routeLength] =
      this.routeTokens.length - this.unitWords[offset + TEMP_UNIT.routeStart];
    this.activeUnit = -1;
  }

  finalize({ nodeRefByKey, diagnostics }: PackedFinalizeOptions): PackedGraphRelations {
    this.assertWritable();
    if (this.activeUnit !== -1) {
      throw new Error('Cannot finalize packed relations with an unfinished unit');
    }
    this.finalized = true;

    const symbols = this.symbols.snapshot();
    const rows = this.rows.snapshot();
    const inputUnitCount = this.unitWords.length / TEMP_UNIT.stride;
    const resolvedTokens: number[] = [];
    const unitRouteStarts = new Int32Array(inputUnitCount).fill(-1);
    const unitRouteLengths = new Uint32Array(inputUnitCount);
    const unitSourceRefs = new Uint32Array(inputUnitCount);
    const unitNext = new Uint32Array(inputUnitCount).fill(PACKED_INVALID_REF);

    const recordWords: number[] = [];
    const recordRouteTokens: number[] = [];
    const recordFirstUnit: number[] = [];
    const recordLastUnit: number[] = [];
    const recordByKeySymbol = new Map<number, number>();

    for (let unitRef = 0; unitRef < inputUnitCount; unitRef++) {
      const offset = unitRef * TEMP_UNIT.stride;
      const sourceKey = symbols[this.unitWords[offset + TEMP_UNIT.sourceKeySymbol]];
      const targetKey = symbols[this.unitWords[offset + TEMP_UNIT.targetKeySymbol]];
      const sourceNodeRef = nodeRefByKey.get(sourceKey);
      const targetNodeRef = nodeRefByKey.get(targetKey);
      const context = this.unitContexts[unitRef];

      if (sourceNodeRef === undefined || targetNodeRef === undefined) {
        diagnostics?.add(
          'dangling-target',
          'warning',
          'Edge target does not resolve to a normalized node',
          context,
          symbols[this.unitWords[offset + TEMP_UNIT.targetIdSymbol]]
        );
        continue;
      }
      assertCapacity('node', sourceNodeRef, this.maximum);
      assertCapacity('node', targetNodeRef, this.maximum);

      const inputStart = this.unitWords[offset + TEMP_UNIT.routeStart];
      const inputLength = this.unitWords[offset + TEMP_UNIT.routeLength];
      const resolvedStart = resolvedTokens.length;
      let unresolvedEndpoint = false;

      for (let index = 0; index < inputLength; index++) {
        const token = this.routeTokens[inputStart + index];
        if (isCoordinateToken(token)) {
          resolvedTokens.push(token);
          continue;
        }

        const nodeKey = symbols[token];
        const nodeRef = nodeRefByKey.get(nodeKey);
        if (nodeRef !== undefined) {
          assertCapacity('node', nodeRef, this.maximum);
          resolvedTokens.push(nodeRef);
          continue;
        }

        if (index === 0 || index === inputLength - 1) {
          unresolvedEndpoint = true;
          break;
        }
        diagnostics?.add(
          'invalid-path',
          'warning',
          'Routed path contains an unresolved intermediate node; the node was skipped',
          context,
          symbols[this.nodeIdSymbolByKeySymbol.get(token) ?? token]
        );
      }

      const resolvedLength = resolvedTokens.length - resolvedStart;
      const firstToken = resolvedTokens[resolvedStart];
      const lastToken = resolvedTokens[resolvedStart + resolvedLength - 1];
      if (
        unresolvedEndpoint ||
        resolvedLength < 2 ||
        firstToken !== sourceNodeRef ||
        lastToken !== targetNodeRef ||
        isCoordinateToken(firstToken) ||
        isCoordinateToken(lastToken)
      ) {
        resolvedTokens.length = resolvedStart;
        continue;
      }

      unitRouteStarts[unitRef] = resolvedStart;
      unitRouteLengths[unitRef] = resolvedLength;
      unitSourceRefs[unitRef] = sourceNodeRef;

      const keySymbol = this.unitWords[offset + TEMP_UNIT.keySymbol];
      let recordRef = recordByKeySymbol.get(keySymbol);
      if (recordRef === undefined) {
        recordRef = recordWords.length / packedRelationLayout.record.stride;
        assertCapacity('record', recordRef, this.maximum);
        recordByKeySymbol.set(keySymbol, recordRef);
        const recordRouteStart = recordRouteTokens.length;
        copySpan(resolvedTokens, resolvedStart, resolvedLength, recordRouteTokens);
        recordWords.push(
          keySymbol,
          this.unitWords[offset + TEMP_UNIT.idSymbol],
          sourceNodeRef,
          targetNodeRef,
          recordRouteStart,
          resolvedLength,
          0,
          1,
          this.unitWords[offset + TEMP_UNIT.row],
          this.unitWords[offset + TEMP_UNIT.flags]
        );
        recordFirstUnit.push(unitRef);
        recordLastUnit.push(unitRef);
      } else {
        const recordOffset = recordRef * packedRelationLayout.record.stride;
        const previousLastUnit = recordLastUnit[recordRef];
        unitNext[previousLastUnit] = unitRef;
        recordLastUnit[recordRef] = unitRef;
        recordWords[recordOffset + packedRelationLayout.record.unitCount]++;

        const recordRouteStart = recordWords[recordOffset + packedRelationLayout.record.routeStart];
        const recordRouteLength = recordWords[recordOffset + packedRelationLayout.record.routeLength];
        const pathsEqual = spansEqual(
          recordRouteTokens,
          recordRouteStart,
          recordRouteLength,
          resolvedTokens,
          resolvedStart,
          resolvedLength
        );
        const explicit = (this.unitWords[offset + TEMP_UNIT.flags] & PackedRelationFlags.explicitId) !== 0;

        if (!explicit) {
          if (!pathsEqual) {
            diagnostics?.add(
              'conflicting-edge',
              'warning',
              'Repeated implicit edge has a conflicting route; the primary route is retained',
              context,
              symbols[this.unitWords[offset + TEMP_UNIT.idSymbol]]
            );
          }
        } else if (!pathsEqual) {
          const recordTail = recordRouteTokens[recordRouteStart + recordRouteLength - 1];
          const unitHead = resolvedTokens[resolvedStart];
          if (recordTail === unitHead && !isCoordinateToken(recordTail)) {
            const continuedStart = recordRouteTokens.length;
            copySpan(recordRouteTokens, recordRouteStart, recordRouteLength, recordRouteTokens);
            copySpan(resolvedTokens, resolvedStart + 1, resolvedLength - 1, recordRouteTokens);
            recordWords[recordOffset + packedRelationLayout.record.routeStart] = continuedStart;
            recordWords[recordOffset + packedRelationLayout.record.routeLength] =
              recordRouteLength + resolvedLength - 1;
            recordWords[recordOffset + packedRelationLayout.record.targetNode] = targetNodeRef;
          } else {
            diagnostics?.add(
              'conflicting-edge',
              'warning',
              'Repeated explicit edge ID is not a tail-contiguous fragment; the fragment is retained separately',
              context,
              symbols[this.unitWords[offset + TEMP_UNIT.idSymbol]]
            );
          }
        }
      }
    }

    const finalTokens: number[] = [];
    const finalUnits: number[] = [];
    const finalCoordinates: number[] = [];
    const finalElevations: number[] = [];
    const finalCoordinateAnnotationRefs: number[] = [];
    const finalAnnotations: number[] = [];
    const coordinateRemap = new Int32Array(this.coordinateValues.length / 2).fill(-1);
    const finalRecords = [...recordWords];

    const emitTokenSpan = (source: number[], start: number, length: number): number => {
      const finalStart = finalTokens.length;
      for (let index = 0; index < length; index++) {
        const token = source[start + index];
        if (!isCoordinateToken(token)) {
          finalTokens.push(token);
          continue;
        }

        const inputCoordinateRef = decodeRouteRef(token);
        let coordinateRef = coordinateRemap[inputCoordinateRef];
        if (coordinateRef === -1) {
          coordinateRef = finalCoordinates.length / 2;
          assertCapacity('coordinate', coordinateRef, this.maximum);
          coordinateRemap[inputCoordinateRef] = coordinateRef;
          finalCoordinates.push(
            this.coordinateValues[inputCoordinateRef * 2],
            this.coordinateValues[inputCoordinateRef * 2 + 1]
          );
          finalElevations.push(this.coordinateElevations[inputCoordinateRef]);

          const textSymbol = this.coordinateTextSymbols[inputCoordinateRef];
          if (textSymbol === PACKED_INVALID_REF) {
            finalCoordinateAnnotationRefs.push(PACKED_INVALID_REF);
          } else {
            const annotationRef = finalAnnotations.length / packedRelationLayout.annotation.stride;
            assertCapacity('annotation', annotationRef, this.maximum);
            finalCoordinateAnnotationRefs.push(annotationRef);
            finalAnnotations.push(textSymbol, this.coordinateColorSymbols[inputCoordinateRef]);
          }
        }
        finalTokens.push(encodeCoordinateToken(coordinateRef));
      }
      return finalStart;
    };

    const recordCount = finalRecords.length / packedRelationLayout.record.stride;
    for (let recordRef = 0; recordRef < recordCount; recordRef++) {
      const recordOffset = recordRef * packedRelationLayout.record.stride;
      const unitStart = finalUnits.length / packedRelationLayout.unit.stride;
      const firstInputUnit = recordFirstUnit[recordRef];
      let inputUnit = firstInputUnit;
      let firstUnitFinalStart = 0;
      let firstUnitLength = 0;

      while (inputUnit !== PACKED_INVALID_REF) {
        const inputOffset = inputUnit * TEMP_UNIT.stride;
        const routeStart = emitTokenSpan(resolvedTokens, unitRouteStarts[inputUnit], unitRouteLengths[inputUnit]);
        if (inputUnit === firstInputUnit) {
          firstUnitFinalStart = routeStart;
          firstUnitLength = unitRouteLengths[inputUnit];
        }
        finalUnits.push(
          routeStart,
          unitRouteLengths[inputUnit],
          this.unitWords[inputOffset + TEMP_UNIT.row],
          unitSourceRefs[inputUnit]
        );
        inputUnit = unitNext[inputUnit];
      }

      const temporaryRecordRouteStart = finalRecords[recordOffset + packedRelationLayout.record.routeStart];
      const temporaryRecordRouteLength = finalRecords[recordOffset + packedRelationLayout.record.routeLength];
      if (
        spansEqual(
          recordRouteTokens,
          temporaryRecordRouteStart,
          temporaryRecordRouteLength,
          resolvedTokens,
          unitRouteStarts[firstInputUnit],
          unitRouteLengths[firstInputUnit]
        )
      ) {
        finalRecords[recordOffset + packedRelationLayout.record.routeStart] = firstUnitFinalStart;
        finalRecords[recordOffset + packedRelationLayout.record.routeLength] = firstUnitLength;
      } else {
        finalRecords[recordOffset + packedRelationLayout.record.routeStart] = emitTokenSpan(
          recordRouteTokens,
          temporaryRecordRouteStart,
          temporaryRecordRouteLength
        );
      }
      finalRecords[recordOffset + packedRelationLayout.record.unitStart] = unitStart;
    }

    const usedSymbols = new Uint8Array(symbols.length);
    const usedRows = new Uint8Array(rows.length);
    for (let recordRef = 0; recordRef < recordCount; recordRef++) {
      const offset = recordRef * packedRelationLayout.record.stride;
      usedSymbols[finalRecords[offset + packedRelationLayout.record.keySymbol]] = 1;
      usedSymbols[finalRecords[offset + packedRelationLayout.record.idSymbol]] = 1;
      usedRows[finalRecords[offset + packedRelationLayout.record.primaryRow]] = 1;
    }
    for (let unitRef = 0; unitRef < finalUnits.length / packedRelationLayout.unit.stride; unitRef++) {
      usedRows[finalUnits[unitRef * packedRelationLayout.unit.stride + packedRelationLayout.unit.row]] = 1;
    }
    for (
      let annotationRef = 0;
      annotationRef < finalAnnotations.length / packedRelationLayout.annotation.stride;
      annotationRef++
    ) {
      const offset = annotationRef * packedRelationLayout.annotation.stride;
      usedSymbols[finalAnnotations[offset + packedRelationLayout.annotation.textSymbol]] = 1;
      const colorSymbol = finalAnnotations[offset + packedRelationLayout.annotation.colorSymbol];
      if (colorSymbol !== PACKED_INVALID_REF) {
        usedSymbols[colorSymbol] = 1;
      }
    }

    const symbolRemap = new Uint32Array(symbols.length).fill(PACKED_INVALID_REF);
    const finalSymbols: string[] = [];
    symbols.forEach((symbol, symbolRef) => {
      if (usedSymbols[symbolRef]) {
        symbolRemap[symbolRef] = finalSymbols.length;
        finalSymbols.push(symbol);
      }
    });
    const rowRemap = new Uint32Array(rows.length).fill(PACKED_INVALID_REF);
    const finalRows: GraphRowRef[] = [];
    rows.forEach((row, rowRef) => {
      if (usedRows[rowRef]) {
        rowRemap[rowRef] = finalRows.length;
        finalRows.push(row);
      }
    });
    for (let recordRef = 0; recordRef < recordCount; recordRef++) {
      const offset = recordRef * packedRelationLayout.record.stride;
      finalRecords[offset + packedRelationLayout.record.keySymbol] =
        symbolRemap[finalRecords[offset + packedRelationLayout.record.keySymbol]];
      finalRecords[offset + packedRelationLayout.record.idSymbol] =
        symbolRemap[finalRecords[offset + packedRelationLayout.record.idSymbol]];
      finalRecords[offset + packedRelationLayout.record.primaryRow] =
        rowRemap[finalRecords[offset + packedRelationLayout.record.primaryRow]];
    }
    for (let unitRef = 0; unitRef < finalUnits.length / packedRelationLayout.unit.stride; unitRef++) {
      const offset = unitRef * packedRelationLayout.unit.stride;
      finalUnits[offset + packedRelationLayout.unit.row] = rowRemap[finalUnits[offset + packedRelationLayout.unit.row]];
    }
    for (
      let annotationRef = 0;
      annotationRef < finalAnnotations.length / packedRelationLayout.annotation.stride;
      annotationRef++
    ) {
      const offset = annotationRef * packedRelationLayout.annotation.stride;
      finalAnnotations[offset + packedRelationLayout.annotation.textSymbol] =
        symbolRemap[finalAnnotations[offset + packedRelationLayout.annotation.textSymbol]];
      const colorSymbol = finalAnnotations[offset + packedRelationLayout.annotation.colorSymbol];
      if (colorSymbol !== PACKED_INVALID_REF) {
        finalAnnotations[offset + packedRelationLayout.annotation.colorSymbol] = symbolRemap[colorSymbol];
      }
    }

    const recordRefsById = new Map<string, number[]>();
    const recordRefByKey = new Map<string, number>();
    for (let recordRef = 0; recordRef < recordCount; recordRef++) {
      const offset = recordRef * packedRelationLayout.record.stride;
      const key = finalSymbols[finalRecords[offset + packedRelationLayout.record.keySymbol]];
      const id = finalSymbols[finalRecords[offset + packedRelationLayout.record.idSymbol]];
      recordRefByKey.set(key, recordRef);
      const refs = recordRefsById.get(id);
      if (refs) {
        refs.push(recordRef);
      } else {
        recordRefsById.set(id, [recordRef]);
      }
    }

    const result = new PackedGraphRelations({
      recordWords: Uint32Array.from(finalRecords),
      unitWords: Uint32Array.from(finalUnits),
      routeTokens: Uint32Array.from(finalTokens),
      coordinateValues: Float64Array.from(finalCoordinates),
      coordinateElevations: Float64Array.from(finalElevations),
      coordinateAnnotationRefs: Uint32Array.from(finalCoordinateAnnotationRefs),
      annotationWords: Uint32Array.from(finalAnnotations),
      rows: Object.freeze(finalRows),
      symbols: Object.freeze(finalSymbols),
      recordRefByKey,
      recordRefsById: new Map(Array.from(recordRefsById, ([id, refs]) => [id, Uint32Array.from(refs)] as const)),
    });
    if (process.env.NODE_ENV !== 'production') {
      assertPackedGraphRelations(result, nodeRefByKey.size);
    }
    this.releaseTemporaryState();
    return result;
  }

  private assertWritable(): void {
    if (this.finalized) {
      throw new Error('Packed relation builder has already been finalized');
    }
  }

  private assertActiveUnit(): void {
    this.assertWritable();
    if (this.activeUnit === -1) {
      throw new Error('Begin a packed relation unit before writing route items');
    }
  }

  private releaseTemporaryState(): void {
    this.symbols.clear();
    this.rows.clear();
    this.unitWords.length = 0;
    this.unitContexts.length = 0;
    this.routeTokens.length = 0;
    this.nodeIdSymbolByKeySymbol.clear();
    this.coordinateValues.length = 0;
    this.coordinateElevations.length = 0;
    this.coordinateTextSymbols.length = 0;
    this.coordinateColorSymbols.length = 0;
  }
}

interface PackedGraphRelationsState {
  readonly recordWords: Uint32Array;
  readonly unitWords: Uint32Array;
  readonly routeTokens: Uint32Array;
  readonly coordinateValues: Float64Array;
  readonly coordinateElevations: Float64Array;
  readonly coordinateAnnotationRefs: Uint32Array;
  readonly annotationWords: Uint32Array;
  readonly rows: readonly GraphRowRef[];
  readonly symbols: readonly string[];
  readonly recordRefByKey: ReadonlyMap<string, number>;
  readonly recordRefsById: ReadonlyMap<string, Uint32Array>;
}

export class PackedGraphRelations {
  private readonly state: PackedGraphRelationsState;

  constructor(state: PackedGraphRelationsState) {
    this.state = Object.freeze(state);
  }

  get recordCount(): number {
    return this.state.recordWords.length / packedRelationLayout.record.stride;
  }

  get unitCount(): number {
    return this.state.unitWords.length / packedRelationLayout.unit.stride;
  }

  get routeTokenCount(): number {
    return this.state.routeTokens.length;
  }

  get coordinateCount(): number {
    return this.state.coordinateValues.length / 2;
  }

  get annotationCount(): number {
    return this.state.annotationWords.length / packedRelationLayout.annotation.stride;
  }

  findRecordByKey(key: string): number | undefined {
    return this.state.recordRefByKey.get(key);
  }

  getRecordRefsById(id: string): Uint32Array {
    return this.state.recordRefsById.get(id)?.slice() ?? new Uint32Array();
  }

  private getRecordWord(recordRef: number, field: number): number {
    this.assertRecordRef(recordRef);
    return this.state.recordWords[recordRef * packedRelationLayout.record.stride + field];
  }

  private getUnitWord(unitRef: number, field: number): number {
    this.assertUnitRef(unitRef);
    return this.state.unitWords[unitRef * packedRelationLayout.unit.stride + field];
  }

  getRecordKey(recordRef: number): string {
    return this.getSymbol(this.getRecordWord(recordRef, packedRelationLayout.record.keySymbol));
  }

  getRecordId(recordRef: number): string {
    return this.getSymbol(this.getRecordWord(recordRef, packedRelationLayout.record.idSymbol));
  }

  getRecordSourceNodeRef(recordRef: number): number {
    return this.getRecordWord(recordRef, packedRelationLayout.record.sourceNode);
  }

  getRecordTargetNodeRef(recordRef: number): number {
    return this.getRecordWord(recordRef, packedRelationLayout.record.targetNode);
  }

  getRecordRouteStart(recordRef: number): number {
    return this.getRecordWord(recordRef, packedRelationLayout.record.routeStart);
  }

  getRecordRouteLength(recordRef: number): number {
    return this.getRecordWord(recordRef, packedRelationLayout.record.routeLength);
  }

  getRecordUnitStart(recordRef: number): number {
    return this.getRecordWord(recordRef, packedRelationLayout.record.unitStart);
  }

  getRecordUnitCount(recordRef: number): number {
    return this.getRecordWord(recordRef, packedRelationLayout.record.unitCount);
  }

  getRecordPrimaryRow(recordRef: number): GraphRowRef {
    return this.getRow(this.getRecordWord(recordRef, packedRelationLayout.record.primaryRow));
  }

  getRecordFlags(recordRef: number): number {
    return this.getRecordWord(recordRef, packedRelationLayout.record.flags);
  }

  getUnitRouteStart(unitRef: number): number {
    return this.getUnitWord(unitRef, packedRelationLayout.unit.routeStart);
  }

  getUnitRouteLength(unitRef: number): number {
    return this.getUnitWord(unitRef, packedRelationLayout.unit.routeLength);
  }

  getUnitRow(unitRef: number): GraphRowRef {
    return this.getRow(this.getUnitWord(unitRef, packedRelationLayout.unit.row));
  }

  getUnitSourceNodeRef(unitRef: number): number {
    return this.getUnitWord(unitRef, packedRelationLayout.unit.sourceNode);
  }

  getRouteToken(tokenIndex: number): number {
    if (!Number.isInteger(tokenIndex) || tokenIndex < 0 || tokenIndex >= this.state.routeTokens.length) {
      throw new RangeError(`Route token index ${tokenIndex} is out of range`);
    }
    return this.state.routeTokens[tokenIndex];
  }

  getCoordinateLongitude(coordinateRef: number): number {
    this.assertCoordinateRef(coordinateRef);
    return this.state.coordinateValues[coordinateRef * 2];
  }

  getCoordinateLatitude(coordinateRef: number): number {
    this.assertCoordinateRef(coordinateRef);
    return this.state.coordinateValues[coordinateRef * 2 + 1];
  }

  getCoordinateElevation(coordinateRef: number): number | undefined {
    this.assertCoordinateRef(coordinateRef);
    const elevation = this.state.coordinateElevations[coordinateRef];
    return Number.isNaN(elevation) ? undefined : elevation;
  }

  getCoordinateAnnotationRef(coordinateRef: number): number | undefined {
    this.assertCoordinateRef(coordinateRef);
    const annotationRef = this.state.coordinateAnnotationRefs[coordinateRef];
    return annotationRef === PACKED_INVALID_REF ? undefined : annotationRef;
  }

  getAnnotationText(annotationRef: number): string {
    return this.getSymbol(this.getAnnotationWord(annotationRef, packedRelationLayout.annotation.textSymbol));
  }

  getAnnotationColor(annotationRef: number): string | undefined {
    const symbolRef = this.getAnnotationWord(annotationRef, packedRelationLayout.annotation.colorSymbol);
    return symbolRef === PACKED_INVALID_REF ? undefined : this.getSymbol(symbolRef);
  }

  createRouteCursor(): PackedRouteCursor {
    return new PackedRouteCursor(this);
  }

  materializeRecordRoute(recordRef: number, nodeIdAt: (nodeRef: number) => string | undefined): CoordRef[] {
    return this.materializeRoute(this.getRecordRouteStart(recordRef), this.getRecordRouteLength(recordRef), nodeIdAt);
  }

  materializeUnitRoute(unitRef: number, nodeIdAt: (nodeRef: number) => string | undefined): CoordRef[] {
    return this.materializeRoute(this.getUnitRouteStart(unitRef), this.getUnitRouteLength(unitRef), nodeIdAt);
  }

  assertIntegrity(nodeCount: number): void {
    const { recordWords, unitWords, routeTokens, coordinateValues, coordinateElevations, coordinateAnnotationRefs } =
      this.state;
    if (recordWords.length % packedRelationLayout.record.stride !== 0) {
      throw new Error('Packed record buffer does not terminate on its stride');
    }
    if (unitWords.length % packedRelationLayout.unit.stride !== 0) {
      throw new Error('Packed unit buffer does not terminate on its stride');
    }
    if (coordinateValues.length % 2 !== 0) {
      throw new Error('Packed coordinate buffer does not terminate on an x/y pair');
    }
    if (
      coordinateElevations.length !== this.coordinateCount ||
      coordinateAnnotationRefs.length !== this.coordinateCount
    ) {
      throw new Error('Packed coordinate metadata buffers do not align with coordinate count');
    }
    if (this.state.annotationWords.length % packedRelationLayout.annotation.stride !== 0) {
      throw new Error('Packed annotation buffer does not terminate on its stride');
    }

    const reachableSymbols = new Uint8Array(this.state.symbols.length);
    const reachableRows = new Uint8Array(this.state.rows.length);
    let expectedUnitStart = 0;
    for (let recordRef = 0; recordRef < this.recordCount; recordRef++) {
      const routeStart = this.getRecordRouteStart(recordRef);
      const routeLength = this.getRecordRouteLength(recordRef);
      assertSpan('record route', routeStart, routeLength, routeTokens.length);
      const unitStart = this.getRecordUnitStart(recordRef);
      const unitCount = this.getRecordUnitCount(recordRef);
      if (unitStart !== expectedUnitStart) {
        throw new Error(`Packed record ${recordRef} unit range is not contiguous`);
      }
      assertSpan('record units', unitStart, unitCount, this.unitCount);
      expectedUnitStart += unitCount;
      this.assertNodeRef(this.getRecordSourceNodeRef(recordRef), nodeCount);
      this.assertNodeRef(this.getRecordTargetNodeRef(recordRef), nodeCount);
      reachableSymbols[this.getRecordWord(recordRef, packedRelationLayout.record.keySymbol)] = 1;
      reachableSymbols[this.getRecordWord(recordRef, packedRelationLayout.record.idSymbol)] = 1;
      reachableRows[this.getRecordWord(recordRef, packedRelationLayout.record.primaryRow)] = 1;
    }
    if (expectedUnitStart !== this.unitCount) {
      throw new Error('Packed record unit ranges do not terminate at unit count');
    }

    for (let unitRef = 0; unitRef < this.unitCount; unitRef++) {
      assertSpan('unit route', this.getUnitRouteStart(unitRef), this.getUnitRouteLength(unitRef), routeTokens.length);
      this.assertNodeRef(this.getUnitSourceNodeRef(unitRef), nodeCount);
      reachableRows[this.getUnitWord(unitRef, packedRelationLayout.unit.row)] = 1;
    }

    for (let tokenIndex = 0; tokenIndex < routeTokens.length; tokenIndex++) {
      const token = routeTokens[tokenIndex];
      const ref = decodeRouteRef(token);
      if (isCoordinateToken(token)) {
        this.assertCoordinateRef(ref);
      } else {
        this.assertNodeRef(ref, nodeCount);
      }
    }

    for (let coordinateRef = 0; coordinateRef < this.coordinateCount; coordinateRef++) {
      const annotationRef = this.getCoordinateAnnotationRef(coordinateRef);
      if (annotationRef !== undefined) {
        const textSymbol = this.getAnnotationWord(annotationRef, packedRelationLayout.annotation.textSymbol);
        const colorSymbol = this.getAnnotationWord(annotationRef, packedRelationLayout.annotation.colorSymbol);
        reachableSymbols[textSymbol] = 1;
        if (colorSymbol !== PACKED_INVALID_REF) {
          reachableSymbols[colorSymbol] = 1;
        }
      }
    }
    if (reachableSymbols.some((reachable) => !reachable)) {
      throw new Error('Packed symbol table contains an unreachable entry');
    }
    if (reachableRows.some((reachable) => !reachable)) {
      throw new Error('Packed row table contains an unreachable entry');
    }
  }

  private materializeRoute(
    start: number,
    length: number,
    nodeIdAt: (nodeRef: number) => string | undefined
  ): CoordRef[] {
    assertSpan('materialized route', start, length, this.routeTokenCount);
    const result: CoordRef[] = [];
    for (let index = 0; index < length; index++) {
      const token = this.getRouteToken(start + index);
      if (!isCoordinateToken(token)) {
        const nodeRef = decodeRouteRef(token);
        const nodeId = nodeIdAt(nodeRef);
        if (nodeId === undefined) {
          throw new Error(`No node ID is available for packed node reference ${nodeRef}`);
        }
        result.push(nodeId);
        continue;
      }

      const coordinateRef = decodeRouteRef(token);
      const coordinate: unknown[] = [
        this.getCoordinateLongitude(coordinateRef),
        this.getCoordinateLatitude(coordinateRef),
      ];
      const elevation = this.getCoordinateElevation(coordinateRef);
      const annotationRef = this.getCoordinateAnnotationRef(coordinateRef);
      if (elevation !== undefined || annotationRef !== undefined) {
        coordinate.push(elevation ?? 0);
      }
      if (annotationRef !== undefined) {
        coordinate.push(this.getAnnotationText(annotationRef));
        const color = this.getAnnotationColor(annotationRef);
        if (color !== undefined) {
          coordinate.push(color);
        }
      }
      result.push(coordinate as CoordRef);
    }
    return result;
  }

  private getAnnotationWord(annotationRef: number, field: number): number {
    if (!Number.isInteger(annotationRef) || annotationRef < 0 || annotationRef >= this.annotationCount) {
      throw new RangeError(`Annotation reference ${annotationRef} is out of range`);
    }
    return this.state.annotationWords[annotationRef * packedRelationLayout.annotation.stride + field];
  }

  private getSymbol(symbolRef: number): string {
    if (!Number.isInteger(symbolRef) || symbolRef < 0 || symbolRef >= this.state.symbols.length) {
      throw new RangeError(`Symbol reference ${symbolRef} is out of range`);
    }
    return this.state.symbols[symbolRef];
  }

  private getRow(rowRef: number): GraphRowRef {
    if (!Number.isInteger(rowRef) || rowRef < 0 || rowRef >= this.state.rows.length) {
      throw new RangeError(`Row reference ${rowRef} is out of range`);
    }
    return this.state.rows[rowRef];
  }

  private assertRecordRef(recordRef: number): void {
    if (!Number.isInteger(recordRef) || recordRef < 0 || recordRef >= this.recordCount) {
      throw new RangeError(`Record reference ${recordRef} is out of range`);
    }
  }

  private assertUnitRef(unitRef: number): void {
    if (!Number.isInteger(unitRef) || unitRef < 0 || unitRef >= this.unitCount) {
      throw new RangeError(`Unit reference ${unitRef} is out of range`);
    }
  }

  private assertCoordinateRef(coordinateRef: number): void {
    if (!Number.isInteger(coordinateRef) || coordinateRef < 0 || coordinateRef >= this.coordinateCount) {
      throw new RangeError(`Coordinate reference ${coordinateRef} is out of range`);
    }
  }

  private assertNodeRef(nodeRef: number, nodeCount: number): void {
    if (!Number.isInteger(nodeRef) || nodeRef < 0 || nodeRef >= nodeCount) {
      throw new RangeError(`Node reference ${nodeRef} is out of range`);
    }
  }
}

export class PackedRouteCursor {
  private start = 0;
  private length = 0;
  private offset = -1;
  private token = 0;

  constructor(private readonly store: PackedGraphRelations) {}

  resetToRecord(recordRef: number): this {
    return this.reset(this.store.getRecordRouteStart(recordRef), this.store.getRecordRouteLength(recordRef));
  }

  resetToUnit(unitRef: number): this {
    return this.reset(this.store.getUnitRouteStart(unitRef), this.store.getUnitRouteLength(unitRef));
  }

  reset(start: number, length: number): this {
    assertSpan('route cursor', start, length, this.store.routeTokenCount);
    this.start = start;
    this.length = length;
    this.offset = -1;
    this.token = 0;
    return this;
  }

  moveNext(): boolean {
    if (this.offset + 1 >= this.length) {
      this.offset = this.length;
      return false;
    }
    this.offset++;
    this.token = this.store.getRouteToken(this.start + this.offset);
    return true;
  }

  get itemIndex(): number {
    this.assertCurrent();
    return this.offset;
  }

  get coordinate(): boolean {
    this.assertCurrent();
    return isCoordinateToken(this.token);
  }

  get nodeRef(): number | undefined {
    this.assertCurrent();
    return isCoordinateToken(this.token) ? undefined : decodeRouteRef(this.token);
  }

  get coordinateRef(): number | undefined {
    this.assertCurrent();
    return isCoordinateToken(this.token) ? decodeRouteRef(this.token) : undefined;
  }

  get longitude(): number | undefined {
    const ref = this.coordinateRef;
    return ref === undefined ? undefined : this.store.getCoordinateLongitude(ref);
  }

  get latitude(): number | undefined {
    const ref = this.coordinateRef;
    return ref === undefined ? undefined : this.store.getCoordinateLatitude(ref);
  }

  get elevation(): number | undefined {
    const ref = this.coordinateRef;
    return ref === undefined ? undefined : this.store.getCoordinateElevation(ref);
  }

  get annotationRef(): number | undefined {
    const ref = this.coordinateRef;
    return ref === undefined ? undefined : this.store.getCoordinateAnnotationRef(ref);
  }

  private assertCurrent(): void {
    if (this.offset < 0 || this.offset >= this.length) {
      throw new Error('Packed route cursor is not positioned on an item');
    }
  }
}

export function assertPackedGraphRelations(store: PackedGraphRelations, nodeCount: number): void {
  store.assertIntegrity(nodeCount);
}

export function encodeCoordinateToken(coordinateRef: number): number {
  if (!Number.isInteger(coordinateRef) || coordinateRef < 0 || coordinateRef > PACKED_MAX_REF) {
    throw new RangeError(`Coordinate reference ${coordinateRef} cannot be encoded`);
  }
  return (PACKED_ROUTE_COORDINATE_TAG | coordinateRef) >>> 0;
}

export function isCoordinateToken(token: number): boolean {
  return (token & PACKED_ROUTE_COORDINATE_TAG) !== 0;
}

export function decodeRouteRef(token: number): number {
  return token & PACKED_ROUTE_REF_MASK;
}

function assertCapacity(pool: string, value: number, maximum: number): void {
  if (!Number.isInteger(value) || value < 0 || value > maximum) {
    throw new PackedRelationCapacityError(pool, value, maximum);
  }
}

function assertSpan(label: string, start: number, length: number, poolLength: number): void {
  if (!Number.isInteger(start) || !Number.isInteger(length) || start < 0 || length < 0 || start + length > poolLength) {
    throw new RangeError(`${label} span ${start}:${length} exceeds pool length ${poolLength}`);
  }
}

function copySpan(source: number[], start: number, length: number, target: number[]): void {
  for (let index = 0; index < length; index++) {
    target.push(source[start + index]);
  }
}

function spansEqual(
  left: number[],
  leftStart: number,
  leftLength: number,
  right: number[],
  rightStart: number,
  rightLength: number
): boolean {
  if (leftLength !== rightLength) {
    return false;
  }
  for (let index = 0; index < leftLength; index++) {
    if (left[leftStart + index] !== right[rightStart + index]) {
      return false;
    }
  }
  return true;
}
