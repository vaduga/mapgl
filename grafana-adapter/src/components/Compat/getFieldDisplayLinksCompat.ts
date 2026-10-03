import {
  getLinksSupplier,
  type DataFrame,
  type Field,
  type InterpolateFunction,
  type LinkModel,
  type ScopedVars,
} from '@grafana/data';
import * as GrafanaUI from '@grafana/ui';

type GetFieldDisplayLinks = (field: Field, rowIdx: number) => Array<LinkModel<Field>>;

export interface FieldDisplayLinkContext {
  frame: DataFrame;
  scopedVars: ScopedVars;
  replaceVariables: InterpolateFunction;
}

function uniqueLinks(links: Array<LinkModel<Field>>): Array<LinkModel<Field>> {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.title}/${link.href}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const fallbackGetFieldDisplayLinks: GetFieldDisplayLinks = (field, rowIdx) => {
  if ((field.config.links?.length ?? 0) > 0 && field.getLinks != null) {
    const v = field.values[rowIdx];
    const disp = field.display ? field.display(v) : { text: `${v}`, numeric: +v };
    return uniqueLinks(field.getLinks({ calculatedValue: disp, valueRowIndex: rowIdx }));
  }

  return [];
};

export const getFieldDisplayLinksCompat = (
  field: Field,
  rowIdx: number,
  context?: FieldDisplayLinkContext
): Array<LinkModel<Field>> => {
  if (context && (field.config.links?.length ?? 0) > 0) {
    const value = field.values[rowIdx];
    const calculatedValue = field.display ? field.display(value) : { text: `${value}`, numeric: +value };
    const getLinks = getLinksSupplier(
      context.frame,
      field,
      { ...field.state?.scopedVars, ...context.scopedVars },
      context.replaceVariables
    );
    return uniqueLinks(getLinks({ calculatedValue, valueRowIndex: rowIdx }));
  }

  const getFieldDisplayLinks = (GrafanaUI as any).getFieldDisplayLinks as GetFieldDisplayLinks | undefined;

  return (getFieldDisplayLinks ?? fallbackGetFieldDisplayLinks)(field, rowIdx);
};
