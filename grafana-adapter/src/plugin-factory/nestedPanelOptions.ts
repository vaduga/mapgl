import type { PanelOptionsEditorBuilder, StandardEditorContext } from '@grafana/data';

/**
 * Grafana 11.6 exposes nested panel option items at runtime, but does not
 * export `isNestedPanelOptions` from `@grafana/data`. Keep the compatibility
 * check local so panel-core can compile against every supported Grafana
 * release.
 */
export function isNestedPanelOptionsCompat(item: unknown): item is {
  id: 'nested-panel-options';
  getBuilder: () => (builder: PanelOptionsEditorBuilder<any>, context: StandardEditorContext<any>) => void;
} {
  if (typeof item !== 'object' || item === null) {
    return false;
  }

  const candidate = item as { id?: unknown; getBuilder?: unknown };
  return candidate.id === 'nested-panel-options' && typeof candidate.getBuilder === 'function';
}
