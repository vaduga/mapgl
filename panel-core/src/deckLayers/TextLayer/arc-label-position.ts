import type { PositionTransform } from '../positionTransform';
import { _GlobeViewport, project, type ProjectUniforms, type Viewport } from '@deck.gl/core';

export interface ArcLabelGeometry {
  namespaceSource?: string;
  namespaceTarget?: string;
  sourcePosition: number[];
  targetPosition: number[];
  properties: { arcStyle?: { arcConfig?: { height?: number } }; tilt?: number };
}
const positions = new WeakMap<
  Viewport,
  WeakMap<ArcLabelGeometry, { modelMatrix: ArrayLike<number> | null; position: [number, number, number] }>
>();
const transformed = new WeakMap<PositionTransform, WeakMap<ArcLabelGeometry, ArcLabelGeometry>>();
const radians = Math.PI / 180;
const EARTH_RADIUS = 6370972;

/** CPU counterpart of the arc stroke's paraboloid at parameter 0.5, not half its 3D length. */
export function arcMiddleHeight(distance: number, sourceZ: number, targetZ: number, height: number): number {
  const dh = distance * height,
    delta = targetZ - sourceZ;
  if (dh === 0) {
    return (sourceZ + targetZ) / 2;
  }
  return Math.sqrt(0.5 * ((delta / dh) ** 2 + 0.5)) * dh + Math.min(sourceZ, targetZ);
}

/** Common-space point consumed by ordinary Cartesian TextLayer position attributes. */
export function getArcLabelPosition(
  feature: ArcLabelGeometry,
  viewport: Viewport,
  modelMatrix: ArrayLike<number> | null = null,
  positionTransform?: PositionTransform
): [number, number, number] {
  if (positionTransform) {
    let byFeature = transformed.get(positionTransform);
    if (!byFeature) transformed.set(positionTransform, byFeature = new WeakMap());
    let shifted = byFeature.get(feature);
    if (!shifted) {
      shifted = { ...feature,
        sourcePosition: positionTransform.point(feature.sourcePosition, feature.namespaceSource),
        targetPosition: positionTransform.point(feature.targetPosition, feature.namespaceTarget),
      };
      byFeature.set(feature, shifted);
    }
    feature = shifted;
  }
  let cache = positions.get(viewport);
  if (!cache) {
    cache = new WeakMap();
    positions.set(viewport, cache);
  }
  const cached = cache.get(feature);
  if (cached?.modelMatrix === modelMatrix) {
    return cached.position;
  }
  const transform = (p: number[]): number[] =>
    modelMatrix
      ? [
          modelMatrix[0] * p[0] + modelMatrix[4] * p[1] + modelMatrix[8] * (p[2] ?? 0) + modelMatrix[12],
          modelMatrix[1] * p[0] + modelMatrix[5] * p[1] + modelMatrix[9] * (p[2] ?? 0) + modelMatrix[13],
          modelMatrix[2] * p[0] + modelMatrix[6] * p[1] + modelMatrix[10] * (p[2] ?? 0) + modelMatrix[14],
        ]
      : p;
  const a = transform(feature.sourcePosition),
    b = transform(feature.targetPosition);
  const height = feature.properties.arcStyle?.arcConfig?.height ?? 0.5;
  let position: [number, number, number];
  if (viewport instanceof _GlobeViewport) {
    const vector = (p: number[]) => {
      const lon = p[0] * radians,
        lat = p[1] * radians;
      return [Math.sin(lon) * Math.cos(lat), -Math.cos(lon) * Math.cos(lat), Math.sin(lat)];
    };
    const va = vector(a),
      vb = vector(b),
      v = va.map((x, i) => x + vb[i]);
    const angle = Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          va.reduce((sum, x, i) => sum + x * vb[i], 0)
        )
      )
    );
    const lon =
      angle < 1e-6 || Math.abs(angle - Math.PI) < 0.001 ? (a[0] + b[0]) / 2 : Math.atan2(v[0], -v[1]) / radians;
    const lat =
      angle < 1e-6 || Math.abs(angle - Math.PI) < 0.001
        ? (a[1] + b[1]) / 2
        : Math.atan2(v[2], Math.hypot(v[0], v[1])) / radians;
    position = viewport.projectPosition([
      lon,
      lat,
      arcMiddleHeight(angle * EARTH_RADIUS, a[2] ?? 0, b[2] ?? 0, height),
    ]);
  } else {
    // Match the installed project shader's lnglat/auto-offset conversion. Using
    // common-space positions also avoids a second inverse geographic projection.
    const uniforms = project.getUniforms({ viewport, coordinateSystem: 'default' }) as ProjectUniforms;
    const common = (p: number[]) => {
      if (!viewport.isGeospatial) {
        return viewport.projectPosition(p);
      }
      const point = viewport.projectPosition([p[0], p[1], 0]);
      const z = p[2] ?? 0;
      if (viewport.zoom < 12) {
        point[2] = (z * uniforms.commonUnitsPerMeter![2]) / Math.cos(Math.max(-89.9, Math.min(89.9, p[1])) * radians);
      } else {
        const origin = uniforms.coordinateOrigin!,
          units = uniforms.commonUnitsPerWorldUnit!,
          units2 = uniforms.commonUnitsPerWorldUnit2!;
        const dy = p[1] - origin[1];
        if (Math.abs(dy) <= 0.25) {
          point[0] = uniforms.commonOrigin![0] + (p[0] - origin[0]) * (units[0] + units2[0] * dy);
          point[1] = uniforms.commonOrigin![1] + dy * (units[1] + units2[1] * dy);
          point[2] = uniforms.commonOrigin![2] + (z - origin[2]) * (units[2] + units2[2] * dy);
        } else {
          point[2] = z * uniforms.commonUnitsPerMeter![2];
        }
      }
      return point;
    };
    const source = common(a),
      target = common(b),
      dx = target[0] - source[0],
      dy = target[1] - source[1],
      distance = Math.hypot(dx, dy);
    const z = arcMiddleHeight(distance, source[2] ?? 0, target[2] ?? 0, height),
      tilt = (feature.properties.tilt ?? 0) * radians;
    const shift = distance ? (z * Math.sin(tilt)) / distance : 0;
    position = [(source[0] + target[0]) / 2 - dy * shift, (source[1] + target[1]) / 2 + dx * shift, z * Math.cos(tilt)];
  }
  cache.set(feature, { modelMatrix, position });
  return position;
}
