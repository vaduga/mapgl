import { pointOnCurve } from './curve-geometry';
import type { DeckLine } from '../../types/index';
import type { CurveEdgeBinaryData } from './curve-edge-layer';
import { measureText } from '../../graph/utils/layout-geometry';

export type RouteLabel = {
  text: string;
  fontSize: number;
  featureIndex: number;
  position: [number, number];
  /** Border (end labels) or background (middle badge) colour. */
  color: number[];
  kind: 'end' | 'middle';
  feature: DeckLine;
};

// Weathermap style: what each end sends, near that end, and the edge text in the middle.
// Sizes are layout units: labels scale with the graph (text-layer sizeUnits 'common').
const SAMPLES_PER_SEGMENT = 4;
const END_GAP = 6; // between a line's end and its label
const LABEL_GAP = 6; // between labels on one line
const LABEL_PADDING = 4; // text-layer background padding, both sides
const LINE_HEIGHT = 1.4; // stacked labels, per font size
const DEFAULT_FONT_SIZE = 10;
const LABEL_HEIGHT = 1.3; // background box height, per font size
const TRIES = 4; // spots tried per label before it is dropped

/** Axis-aligned box, centre and half sizes, in layout units. */
export type LabelBox = { x: number; y: number; hw: number; hh: number };

/** A label with the spots it may take, best first. */
export type RouteLabelCandidate = Omit<RouteLabel, 'position'> & {
  spots: Array<[number, number]>;
  hw: number;
  hh: number;
};

/**
 * Labels along each routed edge: arcStyle sideA text near the source, sideB near the target, edgeStyle text in
 * the middle. A line too short for all of them side by side gets them stacked at its middle, the end labels
 * with an arrow for their direction.
 */
export function getRouteLabels(segments: CurveEdgeBinaryData<DeckLine>): RouteLabel[] {
  return declutterRouteLabels(getRouteLabelCandidates(segments), []);
}

/**
 * Keep labels from piling up where lines meet: middle badges first, then end labels, each takes its first
 * spot clear of the obstacles (node cards) and of the labels already placed; a label with no clear spot is dropped.
 */
export function declutterRouteLabels(
  candidates: readonly RouteLabelCandidate[],
  obstacles: readonly LabelBox[],
  isFocused: (candidate: RouteLabelCandidate) => boolean = () => false
): RouteLabel[] {
  const taken: LabelBox[] = [...obstacles];
  const placed: RouteLabel[] = [];
  const ordered = [...candidates].sort(
    (a, b) => Number(isFocused(b)) - Number(isFocused(a)) || Number(b.kind === 'middle') - Number(a.kind === 'middle')
  );
  for (const item of ordered) {
    const { spots, hw, hh, ...label } = item;
    let spot = spots.find(([x, y]) => !taken.some((box) => overlaps(box, { x, y, hw, hh })));
    if (!spot && isFocused(item) && spots.length) {
      const [x, y] = spots[0];
      spot = [x, y];
      // Each jump clears at least one obstacle permanently; tall cards do not
      // require a row-by-row search through their full height.
      while (true) {
        let nextY = spot[1];
        for (const box of taken) {
          if (overlaps(box, { x, y: spot[1], hw, hh })) {
            nextY = Math.max(nextY, box.y + box.hh + hh + LABEL_GAP);
          }
        }
        if (nextY === spot[1]) {
          break;
        }
        spot = [x, nextY];
      }
    }
    if (spot) {
      taken.push({ x: spot[0], y: spot[1], hw, hh });
      placed.push({ ...label, position: spot });
    }
  }
  return placed;
}

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return Math.abs(a.x - b.x) < a.hw + b.hw && Math.abs(a.y - b.y) < a.hh + b.hh;
}

/** Labels of each routed edge with the spots they may take (see getRouteLabels). */
export function getRouteLabelCandidates(segments: CurveEdgeBinaryData<DeckLine>): RouteLabelCandidate[] {
  const paths = new Map<number, number[][]>();
  const { getControlPoints, getSegment, getCurveType } = segments.attributes;
  const hasText = (text: unknown) => typeof text === 'string' && Boolean(text.trim());
  const labeled = segments.features.map((feature) => {
    const { edgeStyle, arcStyle } = feature?.properties ?? {};
    return (
      hasText(edgeStyle?.text) ||
      (arcStyle?.showStat2 === true && (hasText(arcStyle.sideA?.text) || hasText(arcStyle.sideB?.text)))
    );
  });
  for (let i = 0; i < segments.length; i++) {
    const featureIndex = segments.segmentFeatureIndexes[i];
    if (!labeled[featureIndex]) {
      continue;
    }
    const cp = getControlPoints.value.subarray(i * 8, i * 8 + 8);
    const [t0, dt] = getSegment.value.subarray(i * 2, i * 2 + 2);
    const path = paths.get(featureIndex) ?? [];
    for (let step = path.length ? 1 : 0; step <= SAMPLES_PER_SEGMENT; step++) {
      path.push(pointOnCurve(getCurveType.value[i], cp, t0 + (dt * step) / SAMPLES_PER_SEGMENT));
    }
    paths.set(featureIndex, path);
  }

  const labels: RouteLabelCandidate[] = [];
  for (const [featureIndex, path] of paths) {
    labels.push(...placeLabels(segments.features[featureIndex], path, featureIndex));
  }
  return labels;
}

type Pending = { text: string; kind: RouteLabel['kind']; color: number[]; width: number; fontSize: number };

function placeLabels(feature: DeckLine, path: number[][], featureIndex: number): RouteLabelCandidate[] {
  const { edgeStyle, arcStyle } = (feature.properties ?? {}) as any;
  const fontSize = edgeStyle?.textConfig?.fontSize ?? DEFAULT_FONT_SIZE;
  const lineColor = edgeStyle?.group?.color ?? edgeStyle?.color ?? [128, 128, 128, 255];
  const pending = (text: unknown, kind: RouteLabel['kind'], color: number[], size = fontSize): Pending | undefined =>
    typeof text === 'string' && text.trim()
      ? { text, kind, color, fontSize: size, width: measureText(text) * size + 2 * LABEL_PADDING }
      : undefined;
  const sides = arcStyle?.showStat2 === true;
  const a = sides
    ? pending(
        arcStyle?.sideA?.text,
        'end',
        arcStyle?.sideA?.color ?? lineColor,
        arcStyle?.sideA?.textConfig?.fontSize ?? fontSize
      )
    : undefined;
  const b = sides
    ? pending(
        arcStyle?.sideB?.text,
        'end',
        arcStyle?.sideB?.color ?? lineColor,
        arcStyle?.sideB?.textConfig?.fontSize ?? fontSize
      )
    : undefined;
  const m = pending(edgeStyle?.text, 'middle', lineColor);
  const candidate = (p: Pending, spots: Array<[number, number]>, text = p.text): RouteLabelCandidate => ({
    text,
    fontSize: p.fontSize,
    featureIndex,
    spots,
    hw: (measureText(text) * p.fontSize) / 2 + LABEL_PADDING,
    hh: (p.fontSize * LABEL_HEIGHT) / 2,
    color: p.color,
    kind: p.kind,
    feature,
  });
  // Distances along the line from <first>, stepping by <step>, kept inside [min, max].
  const along = (first: number, step: number, min: number, max: number) =>
    Array.from({ length: TRIES }, (_, i) => first + step * i)
      .filter((d, i) => i === 0 || (d >= min && d <= max))
      .map((d) => pointAt(path, d).point);

  const length = pathLength(path);
  const [wa, wb, wm] = [a?.width ?? 0, b?.width ?? 0, m?.width ?? 0];
  if (length >= 2 * END_GAP + wa + wb + wm + 2 * LABEL_GAP) {
    const out: RouteLabelCandidate[] = [];
    if (a) {
      out.push(candidate(a, along(END_GAP + wa / 2, wa / 2, wa / 2, length / 2 - wa / 2)));
    }
    if (b) {
      out.push(candidate(b, along(length - END_GAP - wb / 2, -wb / 2, length / 2 + wb / 2, length - wb / 2)));
    }
    if (m) {
      // Middle of the free stretch between the end labels, then either side of it.
      const from = a ? END_GAP + wa + LABEL_GAP : 0;
      const to = b ? length - END_GAP - wb - LABEL_GAP : length;
      const c = (from + to) / 2;
      const spots = [c, c - wm, c + wm, c - 2 * wm].filter((d, i) => i === 0 || (d >= wm / 2 && d <= length - wm / 2));
      out.push(
        candidate(
          m,
          spots.map((d) => pointAt(path, d).point)
        )
      );
    }
    return out;
  }
  // Too short: stack them at the middle (or a third along), source side's number first.
  const centres = [0.5, 0.35, 0.65].map((at) => pointAt(path, length * at));
  const direction = centres[0].direction;
  const stack = [
    a && { p: a, text: `${arrow(direction)} ${a.text}` },
    m && { p: m, text: m.text },
    b && { p: b, text: `${arrow([-direction[0], -direction[1]])} ${b.text}` },
  ].filter(Boolean) as Array<{
    p: Pending;
    text: string;
  }>;
  const step = Math.max(...stack.map(({ p }) => p.fontSize)) * LINE_HEIGHT;
  return stack.map(({ p, text }, i) =>
    candidate(
      p,
      centres.map(({ point }) => [point[0], point[1] + (i - (stack.length - 1) / 2) * step] as [number, number]),
      text
    )
  );
}

/** Arrow for a direction in the graph view (y points down). */
function arrow([dx, dy]: number[]): string {
  return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? '→' : '←') : dy >= 0 ? '↓' : '↑';
}

function pathLength(path: number[][]): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    length += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  }
  return length;
}

/** Point at <distance> along the polyline, and the direction of the piece it is on. */
export function pointAt(path: number[][], distance: number): { point: [number, number]; direction: number[] } {
  let left = Math.max(0, distance);
  for (let i = 1; i < path.length; i++) {
    const [dx, dy] = [path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]];
    const l = Math.hypot(dx, dy);
    if (l > 0 && left <= l) {
      const t = left / l;
      return { point: [path[i - 1][0] + dx * t, path[i - 1][1] + dy * t], direction: [dx, dy] };
    }
    left -= l;
  }
  const last = path[path.length - 1];
  const prev = path[Math.max(0, path.length - 2)];
  return { point: [last[0], last[1]], direction: [last[0] - prev[0], last[1] - prev[1]] };
}

/** Point at fraction <at> of the polyline's length. */
export function pointAlong(path: number[][], at: number): [number, number] {
  return pointAt(path, pathLength(path) * at).point;
}

export type ScopedRouteLabelCandidate = RouteLabelCandidate & { srcGraphId: string };
export type RouteLabelData = RouteLabel[] & {
  routeLabels: {
    candidates: readonly ScopedRouteLabelCandidate[];
    obstacles: readonly LabelBox[];
    graphId: string;
  };
};

/** Keep unplaced candidates in captured metadata so focus can reveal them without layout. */
export function createRouteLabelData(
  candidates: readonly ScopedRouteLabelCandidate[],
  obstacles: readonly LabelBox[],
  graphId: string,
  isFocused: (label: ScopedRouteLabelCandidate) => boolean = () => false
): RouteLabelData {
  return (
    createRouteLabelDataByGraph(candidates, obstacles, isFocused).get(graphId) ??
    Object.assign([], { routeLabels: { candidates, obstacles, graphId } })
  );
}

/** Run global collision placement once, then partition without repeating it per namespace. */
export function createRouteLabelDataByGraph(
  candidates: readonly ScopedRouteLabelCandidate[],
  obstacles: readonly LabelBox[],
  isFocused: (label: ScopedRouteLabelCandidate) => boolean = () => false
): Map<string, RouteLabelData> {
  const byGraph = new Map<string, RouteLabelData>();
  for (const { srcGraphId } of candidates) {
    if (!byGraph.has(srcGraphId)) {
      byGraph.set(srcGraphId, Object.assign([], { routeLabels: { candidates, obstacles, graphId: srcGraphId } }));
    }
  }
  const eligible = candidates.filter((c) => !c.feature.skip || isFocused(c));
  for (const label of declutterRouteLabels(eligible, obstacles, (c) => isFocused(c as ScopedRouteLabelCandidate))) {
    byGraph.get((label as RouteLabel & { srcGraphId: string }).srcGraphId)!.push(label);
  }
  return byGraph;
}
