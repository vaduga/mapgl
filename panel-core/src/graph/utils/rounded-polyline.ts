import { pushCurveSegments, type CurveSegment } from './layout-result';

type Point = { x: number; y: number };
const LINE = 0;
const BEZIER = 1;
const EPSILON = 1e-6;

export function roundedPolyline(points: readonly Point[], radius: number): CurveSegment[] {
  const vertices: Point[] = [];
  for (const point of points) {
    const previous = vertices.at(-1);
    if (!previous || distance(previous, point) > EPSILON) {
      vertices.push(point);
    }
  }

  const segments: CurveSegment[] = [];
  const addLine = (start: Point, end: Point) => {
    if (distance(start, end) > EPSILON) {
      pushCurveSegments(segments, LINE, [start.x, start.y, end.x, end.y, 0, 0, 0, 0], 1);
    }
  };

  let cursor = vertices[0];
  for (let i = 1; i + 1 < vertices.length; i++) {
    const previous = vertices[i - 1];
    const corner = vertices[i];
    const next = vertices[i + 1];
    const incoming = distance(previous, corner);
    const outgoing = distance(corner, next);
    const turn =
      ((corner.x - previous.x) * (next.y - corner.y) - (corner.y - previous.y) * (next.x - corner.x)) /
      (incoming * outgoing);
    const trim = Math.min(radius, incoming / 3, outgoing / 3);
    if (Math.abs(turn) < EPSILON || trim < EPSILON) {
      addLine(cursor, corner);
      cursor = corner;
      continue;
    }
    const before = interpolate(corner, previous, trim / incoming);
    const after = interpolate(corner, next, trim / outgoing);
    const c1 = interpolate(before, corner, 2 / 3);
    const c2 = interpolate(after, corner, 2 / 3);
    addLine(cursor, before);
    pushCurveSegments(segments, BEZIER, [before.x, before.y, c1.x, c1.y, c2.x, c2.y, after.x, after.y], 8);
    cursor = after;
  }
  if (vertices.length > 1) {
    addLine(cursor, vertices[vertices.length - 1]);
  }
  return segments;
}

function interpolate(a: Point, b: Point, fraction: number): Point {
  return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}
