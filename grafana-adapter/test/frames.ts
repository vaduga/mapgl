import { toDataFrame } from '@grafana/data';
import type { GrafanaGraphVisualConfig } from '../src/graph/frame/types';

/** Small native fixtures keep field binding visible without repeating DataFrame scaffolding. */
export function testFrame(refId: string | undefined, columns: Record<string, unknown[]>) {
  return toDataFrame({ refId, fields: Object.entries(columns).map(([name, values]) => ({ name, values })) });
}

export function testVisualConfig(overrides: Partial<GrafanaGraphVisualConfig> = {}): GrafanaGraphVisualConfig {
  const edge = () => ({ color: { fixed: 'blue' }, size: { fixed: 2, min: 1, max: 10 } });
  return {
    layerName: 'visual test',
    locationField: 'source',
    isLogic: true,
    style: { color: { fixed: 'green' }, size: { fixed: 20, min: 5, max: 30 }, opacity: 0.5 },
    edgeStyle: edge(),
    arcStyle: { sideA: edge(), sideB: edge() },
    arcConfig: { height: 0.5, tiltIncrement: 7, capacity: { fixed: 1 } },
    ...overrides,
  };
}
