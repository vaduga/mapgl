import { set, get as lodashGet } from 'lodash';

import { StandardEditorContext, TransformerUIProps, PanelOptionsEditorBuilder } from '@grafana/data';
import {PanelOptionsSupplier} from "../../../../../grafana_data/panel/PanelPlugin";



export function getDefaultOptions<T = any>(supplier: PanelOptionsSupplier<T>): T {
  const context: StandardEditorContext<T, unknown> = {
    data: [],
    options: {} as T,
  };

  const results = {};
  const builder = new PanelOptionsEditorBuilder<T>();
  supplier(builder, context);
  for (const item of builder.getItems()) {
    if (item.defaultValue != null) {
      set(results, item.path, item.defaultValue);
    }
  }
  return results as T;
}
