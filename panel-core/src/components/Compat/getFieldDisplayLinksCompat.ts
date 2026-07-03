import type { Field, LinkModel } from '@grafana/data';
import * as GrafanaUI from '@grafana/ui';

type GetFieldDisplayLinks = (field: Field, rowIdx: number) => Array<LinkModel<Field>>;

const fallbackGetFieldDisplayLinks: GetFieldDisplayLinks = (field, rowIdx) => {
  const links: Array<LinkModel<Field>> = [];

  if ((field.config.links?.length ?? 0) > 0 && field.getLinks != null) {
    const v = field.values[rowIdx];
    const disp = field.display ? field.display(v) : { text: `${v}`, numeric: +v };
    const linkLookup = new Set<string>();

    field.getLinks({ calculatedValue: disp, valueRowIndex: rowIdx }).forEach((link) => {
      const key = `${link.title}/${link.href}`;
      if (!linkLookup.has(key)) {
        links.push(link);
        linkLookup.add(key);
      }
    });
  }

  return links;
};

export const getFieldDisplayLinksCompat: GetFieldDisplayLinks = (field, rowIdx) => {
  const getFieldDisplayLinks = (GrafanaUI as any).getFieldDisplayLinks as GetFieldDisplayLinks | undefined;

  return (getFieldDisplayLinks ?? fallbackGetFieldDisplayLinks)(field, rowIdx);
};
