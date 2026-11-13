import { curveAnchorAt, getCurveMetrics, type CurveMetric } from './curve-metrics';
import { LabelBoxIndex } from './label-box-index';
import type { DeckLine } from '../../types/index';
import type { CurveEdgeBinaryData } from './curve-edge-layer';
import { measureText } from '../../graph/utils/layout-geometry';

export type RouteLabel = {
  idleVisible?: boolean;
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
type Spot = [number, number];
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
const obstacleIndexes = new WeakMap<readonly LabelBox[], LabelBoxIndex>();

export type RouteLabelCandidate = Omit<RouteLabel, 'position'> & {
  spots: Spot[];
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
  const taken = new LabelBoxIndex();
  let obstacleIndex = obstacleIndexes.get(obstacles);
  if (!obstacleIndex) {
    obstacleIndex = new LabelBoxIndex();
    obstacles.forEach((box) => obstacleIndex!.insert(box));
    obstacleIndexes.set(obstacles, obstacleIndex);
  }
  const findOverlaps = (box: LabelBox) => [...obstacleIndex!.overlaps(box), ...taken.overlaps(box)];
  const placed: RouteLabel[] = [];
  const ordered = [...candidates].sort(
    (a, b) => Number(isFocused(b)) - Number(isFocused(a)) || Number(b.kind === 'middle') - Number(a.kind === 'middle')
  );
  for (const item of ordered) {
    const { spots, hw, hh, ...label } = item;
    let spot = spots.find(([x, y]) => !findOverlaps({ x, y, hw, hh }).length);
    if (!spot && isFocused(item) && spots.length) {
      const [x, y] = spots[0];
      spot = [x, y];
      // Each jump clears at least one obstacle permanently; tall cards do not
      // require a row-by-row search through their full height.
      while (true) {
        let nextY = spot[1];
        for (const box of findOverlaps({ x, y: spot[1], hw, hh })) {
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
      taken.insert({ x: spot[0], y: spot[1], hw, hh });
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
  const labels: RouteLabelCandidate[] = [];
  const widths = new Map<string, number>();
  const width = (text: string) => {
    let value = widths.get(text);
    if (value === undefined) {
      value = measureText(text);
      widths.set(text, value);
    }
    return value;
  };
  const hasText = (text: unknown) => typeof text === 'string' && Boolean(text.trim());
  for (let featureIndex = 0; featureIndex < segments.features.length; featureIndex++) {
    const feature = segments.features[featureIndex];
    const { edgeStyle, arcStyle } = feature?.properties ?? {};
    if (
      !hasText(edgeStyle?.text) &&
      !(arcStyle?.showStat2 === true && (hasText(arcStyle.sideA?.text) || hasText(arcStyle.sideB?.text)))
    ) {
      continue;
    }
    const metric = getCurveMetrics(segments, featureIndex);
    if (metric.intervals.length) {
      labels.push(...placeLabels(feature, metric, featureIndex, width));
    }
  }
  return labels;
}

type Pending = { text: string; kind: RouteLabel['kind']; color: number[]; width: number; fontSize: number };

function placeLabels(
  feature: DeckLine,
  metric: CurveMetric,
  featureIndex: number,
  width: (text: string) => number
): RouteLabelCandidate[] {
  const { edgeStyle, arcStyle } = (feature.properties ?? {}) as any;
  const fontSize = edgeStyle?.textConfig?.fontSize ?? DEFAULT_FONT_SIZE;
  const lineColor = edgeStyle?.group?.color ?? edgeStyle?.color ?? [128, 128, 128, 255];
  const pending = (text: unknown, kind: RouteLabel['kind'], color: number[], size = fontSize): Pending | undefined =>
    typeof text === 'string' && text.trim()
      ? { text, kind, color, fontSize: size, width: width(text) * size + 2 * LABEL_PADDING }
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
  const candidate = (p: Pending, spots: Spot[], text = p.text): RouteLabelCandidate => ({
    text,
    fontSize: p.fontSize,
    featureIndex,
    spots,
    hw: (width(text) * p.fontSize) / 2 + LABEL_PADDING,
    hh: (p.fontSize * LABEL_HEIGHT) / 2,
    color: p.color,
    kind: p.kind,
    feature,
  });
  // Distances along the line from <first>, stepping by <step>, kept inside [min, max].
  const along = (first: number, step: number, min: number, max: number) =>
    Array.from({ length: TRIES }, (_, i) => first + step * i)
      .filter((d, i) => i === 0 || (d >= min && d <= max))
      .map((d) => spotAt(d));

  const spotAt = (d: number, dy = 0): Spot => {
    const { point } = curveAnchorAt(metric, d);
    return [point[0], point[1] + dy];
  };
  const length = metric.length;
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
          spots.map((d) => spotAt(d))
        )
      );
    }
    return out;
  }
  // Too short: stack them at the middle (or a third along), source side's number first.
  const centres = [0.5, 0.35, 0.65].map((at) => curveAnchorAt(metric, length * at));
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
      [0.5, 0.35, 0.65].map((at) => spotAt(length * at, (i - (stack.length - 1) / 2) * step)),
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

export type ScopedRouteLabelCandidate = RouteLabelCandidate & {
  srcGraphId: string;
  shift?: readonly [number, number];
  eligible?: boolean;
};
export type FocusedRouteEdges = Readonly<Record<string, ReadonlyMap<number, number>>>;
type LabelPositions = ReadonlyMap<RouteLabel, [number, number]>;
export type RouteLabelData = RouteLabel[] & { placement?: { resolve(focused: FocusedRouteEdges): LabelPositions } };

export function createRouteLabelData(
  candidates: readonly ScopedRouteLabelCandidate[],
  obstacles: readonly LabelBox[],
  graphId: string
): RouteLabelData {
  return createRouteLabelDataByGraph(candidates, obstacles).get(graphId) ?? [];
}

const placements = new WeakMap<
  readonly ScopedRouteLabelCandidate[],
  {
    obstacles: readonly LabelBox[];
    alwaysOn: boolean;
    result: Map<string, RouteLabelData>;
  }
>();

/** Cache candidate anchors once; resolve collisions only against currently visible labels. */
export function createRouteLabelDataByGraph(
  candidates: readonly ScopedRouteLabelCandidate[],
  obstacles: readonly LabelBox[],
  alwaysOn = true
): Map<string, RouteLabelData> {
  const cached = placements.get(candidates);
  if (cached?.obstacles === obstacles && cached.alwaysOn === alwaysOn) {return cached.result;}
  const result = new Map<string, RouteLabelData>();
  const byEdge = new Map<string, Map<number, SceneCandidate[]>>();
  type SceneCandidate = ScopedRouteLabelCandidate & { label: RouteLabel };
  const global: SceneCandidate[] = candidates.map((candidate) => {
    const { spots, hw, hh, ...rest } = candidate;
    const label: RouteLabel = { ...rest, position: spots[0], idleVisible: false };
    let data = result.get(candidate.srcGraphId);
    if (!data) {
      data = [];
      result.set(candidate.srcGraphId, data);
    }
    data.push(label);
    const [dx, dy] = candidate.shift ?? [0, 0];
    const item = { ...candidate, label, spots: spots.map(([x, y]) => [x + dx, y + dy] as [number, number]) };
    if (candidate.eligible !== false) {
      let edges = byEdge.get(candidate.srcGraphId);
      if (!edges) {
        edges = new Map();
        byEdge.set(candidate.srcGraphId, edges);
      }
      let labels = edges.get(candidate.featureIndex);
      if (!labels) {
        labels = [];
        edges.set(candidate.featureIndex, labels);
      }
      labels.push(item);
    }
    return item;
  });
  const toPositions = (placed: RouteLabel[]): Map<RouteLabel, [number, number]> =>
    new Map(
      placed.map((value) => {
        const item = value as RouteLabel & SceneCandidate;
        const [dx, dy] = item.shift ?? [0, 0];
        return [item.label, [value.position[0] - dx, value.position[1] - dy]];
      })
    );
  const idle = alwaysOn
    ? toPositions(
        declutterRouteLabels(
          global.filter((c) => c.eligible !== false && !c.feature.skip),
          obstacles
        )
      )
    : new Map<RouteLabel, [number, number]>();
  const baseline = global.filter((c) => idle.has(c.label));
  for (const [label, position] of idle) {
    label.position = position;
    label.idleVisible = true;
  }
  let lastKey = '';
  let lastPositions: LabelPositions = idle;
  const placement = {
    resolve(focused: FocusedRouteEdges): LabelPositions {
      const key = JSON.stringify(
        Object.keys(focused)
          .sort()
          .map((graph) => [graph, [...focused[graph].keys()].sort((a, b) => a - b)])
      );
      if (lastKey === key) {return lastPositions;}
      const selected = new Set<SceneCandidate>();
      for (const graph of Object.keys(focused).sort())
        {for (const index of [...focused[graph].keys()].sort((a, b) => a - b))
          {for (const candidate of byEdge.get(graph)?.get(index) ?? []) {selected.add(candidate);}}}
      lastKey = key;
      if (!selected.size) {
        lastPositions = idle;
        return lastPositions;
      }
      const visible = [...selected, ...baseline.filter((candidate) => !selected.has(candidate))];
      lastPositions = toPositions(
        declutterRouteLabels(visible, obstacles, (candidate) => selected.has(candidate as SceneCandidate))
      );
      return lastPositions;
    },
  };
  for (const data of result.values()) {Object.defineProperty(data, 'placement', { value: placement });}
  placements.set(candidates, { obstacles, alwaysOn, result });
  return result;
}
