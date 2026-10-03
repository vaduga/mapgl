import { annotationTimeRuntimeSubscriptionProvider } from './annotationTime';
import type { GrafanaRuntimeSubscriptionContext as RuntimeSubscriptionContext } from './contracts';
function context(id: string): RuntimeSubscriptionContext {
  return { graph: { id } as any, publish: jest.fn() };
}
describe('Grafana annotation integration', () => {
  it('enables annotation-time updates only when annotation frames are present', () => {
    const withoutAnnotations = {
      ...context('none'),
      data: { annotations: [] } as unknown as RuntimeSubscriptionContext['data'],
    };
    const withAnnotations = {
      ...context('annotations'),
      data: { annotations: [{}] } as unknown as RuntimeSubscriptionContext['data'],
    };

    expect(annotationTimeRuntimeSubscriptionProvider.isEnabled?.(withoutAnnotations)).toBe(false);
    expect(annotationTimeRuntimeSubscriptionProvider.isEnabled?.(withAnnotations)).toBe(true);
  });
});
