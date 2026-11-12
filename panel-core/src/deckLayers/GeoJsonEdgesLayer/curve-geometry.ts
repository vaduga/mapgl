export function pointOnCurve(type: number, p: ArrayLike<number>, t: number): number[] {
  if (type === 1) {
    const u = 1 - t;
    const a = u * u * u,
      b = 3 * u * u * t,
      c = 3 * u * t * t,
      d = t * t * t;
    return [a * p[0] + b * p[2] + c * p[4] + d * p[6], a * p[1] + b * p[3] + c * p[5] + d * p[7]];
  }
  if (type === 2) {
    return [p[0] + Math.cos(t) * p[2] + Math.sin(t) * p[4], p[1] + Math.cos(t) * p[3] + Math.sin(t) * p[5]];
  }
  return [p[0] + (p[2] - p[0]) * t, p[1] + (p[3] - p[1]) * t];
}
