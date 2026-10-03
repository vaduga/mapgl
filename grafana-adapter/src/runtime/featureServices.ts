import {
  buildMapglFeatureServices as buildCoreServices,
  type BuildMapglFeatureServicesOptions,
} from '@vaduga/mapgl-core/featureContracts';

import { annotationTimeRuntimeSubscriptionProvider } from './annotationTime';
export function buildGrafanaFeatureServices(options: BuildMapglFeatureServicesOptions) {
  const core = buildCoreServices(options);
  return Object.freeze({
    ...core,
    runtimeSubscriptionProviders: [annotationTimeRuntimeSubscriptionProvider, ...core.runtimeSubscriptionProviders],
  });
}
