import type { Color } from '@deck.gl/core';

import { toRGB4Array } from '../utils/color';

export const MAX_DONUT_SEGMENTS = 16;
export const MAX_DONUT_STRIPES = 4;
export const DONUT_INNER_RADIUS_RATIO = 0.73;
export const DONUT_RECORD_TEXELS = 1 + (MAX_DONUT_SEGMENTS + MAX_DONUT_STRIPES) * 2;

export type DonutColor = string | Color | null | undefined;

export type DonutWeightedColor = {
  color: DonutColor;
  count: number;
};

export type DonutInput = {
  segments?: readonly DonutWeightedColor[];
  stripes?: readonly DonutWeightedColor[];
  total?: number;
  innerRadius?: number;
};

export type NormalizedDonutPart = {
  color: readonly [number, number, number, number];
  endFraction: number;
};

export type NormalizedDonutInput = {
  segments: readonly NormalizedDonutPart[];
  stripes: readonly NormalizedDonutPart[];
  innerRadius: number;
};

export type DonutAtlasDiagnostics = {
  transport: 'rgba32float-texture';
  ownershipGeneration: string;
  recordCount: number;
  segmentCount: number;
  stripeCount: number;
  width: number;
  height: number;
  recordTexels: number;
  estimatedBytes: number;
  truncatedSegmentCount: number;
  truncatedStripeCount: number;
};

export type DonutAtlas = {
  data: Float32Array;
  width: number;
  height: number;
  recordTexels: number;
  recordByKey: ReadonlyMap<string, number>;
  diagnostics: DonutAtlasDiagnostics;
};

export const EMPTY_DONUT_ATLAS: DonutAtlas = Object.freeze({
  data: new Float32Array(4),
  width: 1,
  height: 1,
  recordTexels: DONUT_RECORD_TEXELS,
  recordByKey: new Map<string, number>(),
  diagnostics: Object.freeze({
    transport: 'rgba32float-texture' as const,
    ownershipGeneration: 'empty',
    recordCount: 0,
    segmentCount: 0,
    stripeCount: 0,
    width: 1,
    height: 1,
    recordTexels: DONUT_RECORD_TEXELS,
    estimatedBytes: 16,
    truncatedSegmentCount: 0,
    truncatedStripeCount: 0,
  }),
});

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const normalizeColor = (color: DonutColor): [number, number, number, number] => {
  const rgba = typeof color === 'string' ? toRGB4Array(color) : color;
  return [
    clamp01(Number(rgba?.[0] ?? 0) / 255),
    clamp01(Number(rgba?.[1] ?? 0) / 255),
    clamp01(Number(rgba?.[2] ?? 0) / 255),
    clamp01(Number(rgba?.[3] ?? 255) / 255),
  ];
};

const normalizeParts = (
  values: readonly DonutWeightedColor[] | undefined,
  maximum: number,
  explicitTotal?: number
): { parts: NormalizedDonutPart[]; truncated: number } => {
  const positive = (values ?? []).filter((value) => Number.isFinite(value.count) && value.count > 0);
  const selected = positive.slice(0, maximum);
  const selectedTotal = selected.reduce((total, value) => total + value.count, 0);
  const requestedTotal = Number(explicitTotal);
  const total = Number.isFinite(requestedTotal) && requestedTotal > 0 ? requestedTotal : selectedTotal;

  if (total <= 0) {
    return { parts: [], truncated: Math.max(0, positive.length - maximum) };
  }

  let cumulative = 0;
  const parts = selected.map((value) => {
    cumulative += value.count;
    return {
      color: normalizeColor(value.color),
      endFraction: clamp01(cumulative / total),
    };
  });

  return { parts, truncated: Math.max(0, positive.length - maximum) };
};

export const normalizeDonutInput = (
  input: DonutInput
): NormalizedDonutInput & {
  truncatedSegmentCount: number;
  truncatedStripeCount: number;
} => {
  const segments = normalizeParts(input.segments, MAX_DONUT_SEGMENTS, input.total);
  const stripes = normalizeParts(input.stripes, MAX_DONUT_STRIPES);

  return {
    segments: segments.parts,
    stripes: stripes.parts,
    innerRadius: clamp01(input.innerRadius ?? DONUT_INNER_RADIUS_RATIO),
    truncatedSegmentCount: segments.truncated,
    truncatedStripeCount: stripes.truncated,
  };
};

export const createEqualDonutInput = (colors: readonly DonutColor[] | undefined): DonutInput => ({
  segments: (colors ?? []).map((color) => ({ color, count: 1 })),
  total: colors?.length ?? 0,
});

export const getDonutInputKey = (input: DonutInput): string => {
  const normalized = normalizeDonutInput(input);
  const serialize = (part: NormalizedDonutPart) => `${part.color.join(',')}@${part.endFraction}`;
  return `${normalized.innerRadius}|${normalized.segments.map(serialize).join(';')}|${normalized.stripes
    .map(serialize)
    .join(';')}`;
};

const nextPowerOfTwo = (value: number) => 2 ** Math.ceil(Math.log2(Math.max(1, value)));

const writePart = (target: Float32Array, texelOffset: number, part: NormalizedDonutPart) => {
  const colorOffset = texelOffset * 4;
  target.set(part.color, colorOffset);
  target[(texelOffset + 1) * 4] = part.endFraction;
};

export const createDonutAtlas = (variants: Iterable<readonly [string, DonutInput]>): DonutAtlas => {
  const recordByKey = new Map<string, number>();
  const normalizedRecords: NormalizedDonutInput[] = [];
  let segmentCount = 0;
  let stripeCount = 0;
  let truncatedSegmentCount = 0;
  let truncatedStripeCount = 0;
  const recordKeys: string[] = [];

  for (const [key, input] of variants) {
    if (recordByKey.has(key)) {
      continue;
    }
    const normalized = normalizeDonutInput(input);
    if (!normalized.segments.length && !normalized.stripes.length) {
      continue;
    }
    recordByKey.set(key, normalizedRecords.length);
    recordKeys.push(key);
    normalizedRecords.push(normalized);
    segmentCount += normalized.segments.length;
    stripeCount += normalized.stripes.length;
    truncatedSegmentCount += normalized.truncatedSegmentCount;
    truncatedStripeCount += normalized.truncatedStripeCount;
  }

  if (!normalizedRecords.length) {
    return EMPTY_DONUT_ATLAS;
  }

  const requiredTexels = normalizedRecords.length * DONUT_RECORD_TEXELS;
  const width = Math.min(1024, nextPowerOfTwo(Math.max(DONUT_RECORD_TEXELS, Math.ceil(Math.sqrt(requiredTexels)))));
  const height = Math.ceil(requiredTexels / width);
  const data = new Float32Array(width * height * 4);

  normalizedRecords.forEach((record, recordIndex) => {
    const recordOffset = recordIndex * DONUT_RECORD_TEXELS;
    const headerOffset = recordOffset * 4;
    data[headerOffset] = record.segments.length;
    data[headerOffset + 1] = record.stripes.length;
    data[headerOffset + 2] = record.innerRadius;

    record.segments.forEach((part, index) => {
      writePart(data, recordOffset + 1 + index * 2, part);
    });
    record.stripes.forEach((part, index) => {
      writePart(data, recordOffset + 1 + (MAX_DONUT_SEGMENTS + index) * 2, part);
    });
  });

  return {
    data,
    width,
    height,
    recordTexels: DONUT_RECORD_TEXELS,
    recordByKey,
    diagnostics: {
      transport: 'rgba32float-texture',
      ownershipGeneration: recordKeys.join('||'),
      recordCount: normalizedRecords.length,
      segmentCount,
      stripeCount,
      width,
      height,
      recordTexels: DONUT_RECORD_TEXELS,
      estimatedBytes: data.byteLength,
      truncatedSegmentCount,
      truncatedStripeCount,
    },
  };
};

export const getDonutRecord = (atlas: DonutAtlas, key: string | undefined): number => {
  return key === undefined ? -1 : (atlas.recordByKey.get(key) ?? -1);
};
