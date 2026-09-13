import type { BuildMapglFeatureServicesOptions, MapglFeatureServices, MapglPanelFeature } from './contracts';
import { createDefaultFeatureRegistry } from './defaultFeatures';

let ossDefaults: MapglFeatureServices | undefined;

export function getMapglFeatureServices(owner?: { featureServices?: MapglFeatureServices }): MapglFeatureServices {
  return owner?.featureServices ?? (ossDefaults ??= buildMapglFeatureServices({ edition: 'oss' }));
}

export function buildMapglFeatureServices({
  edition,
  features = [],
}: BuildMapglFeatureServicesOptions): MapglFeatureServices {
  validateMapglFeatureIds(features);
  const registry = createDefaultFeatureRegistry();

  for (const feature of features) {
    feature.register(registry);
  }

  for (const [name, entries] of Object.entries(registry)) {
    validateIds(entries, name);
    Object.freeze(entries);
  }
  return Object.freeze({ ...registry, edition });
}

export function validateMapglFeatureIds(features: readonly MapglPanelFeature[]): void {
  validateIds(features, 'features');
}

function validateIds(entries: readonly { id: string }[], group: string): void {
  const seen = new Set<string>();
  for (const entry of entries) {
    if (!entry.id || entry.id !== entry.id.trim() || seen.has(entry.id)) {
      throw new Error('Invalid or duplicate feature ID in ' + group + ': ' + entry.id);
    }
    seen.add(entry.id);
  }
}
