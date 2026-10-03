import type { BiColProps, RGBAColor } from '@vaduga/mapgl-core/types';
export const ALERTING_STATES = {
  Alerting: '#e0226e',
  Pending: '#ff9900',
  Normal: '#1b855e',
};

export const ALERT_MAP = {
  '255': [ALERTING_STATES.Alerting, 'Alerting', [224, 34, 110, 254]],
  '222': [ALERTING_STATES.Pending, 'Pending', [255, 153, 0, 254]],
  '111': [ALERTING_STATES.Normal, 'Normal', [27, 133, 94, 254]],
};

export const ALERTING_NUMS = {
  Alerting: ALERT_MAP['255'],
  Pending: ALERT_MAP['222'],
  Normal: ALERT_MAP['111'],
};

export const ANNOTS_LABEL = 'annots & alerts query (built-in)';
export interface GrafanaAnnotation {
  alertName: string;
  newState: string;
  instance: string;
  timeEnd: number;
  data: unknown;
}
export function getGrafanaAnnotations(
  feature: Pick<BiColProps, 'metadata'> | undefined
): GrafanaAnnotation[] | undefined {
  return feature?.metadata?.grafanaAnnotations as GrafanaAnnotation[] | undefined;
}
export function setGrafanaAnnotations(feature: BiColProps, annotations: GrafanaAnnotation[]): void {
  feature.metadata = { ...feature.metadata, grafanaAnnotations: annotations };
  const state = annotations[0]?.newState;
  const value = state?.startsWith('Normal')
    ? ALERTING_NUMS.Normal
    : state === 'Alerting'
      ? ALERTING_NUMS.Alerting
      : ALERTING_NUMS.Pending;
  feature.overlayColor = annotations.length ? ([...value[2].slice(0, 3), 255] as RGBAColor) : undefined;
}
