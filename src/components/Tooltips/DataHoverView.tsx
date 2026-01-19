import {css} from '@emotion/css';
import React from 'react';

import {
  arrayUtils,
  DataFrame,
  dateTime,
  Field,
  FieldType,
  formattedValueToString,
  getFieldDisplayName,
  GrafanaTheme2,
  LinkModel,
} from '@grafana/data';
import {SortOrder, TooltipDisplayMode} from '@grafana/schema';
import {TextLink, useStyles2} from '@grafana/ui';


import {ExemplarHoverView} from '../../grafana_core/app/features/visualization/data-hover/ExemplarHoverView';
import {renderValue} from "../../grafana_core/app/features/geo/utils/uiUtils";
import {sortAnnotations} from "mapLib/utils";

export interface Props {
  data?: DataFrame; // source data
  displayProps: string[];
  baseProps: string[];
  extraFields: Field[];
  all_annots: [],
  time: number;
  rowIndex?: number | null; // the hover row
  columnIndex?: number | null; // the hover column
  sortOrder?: SortOrder;
  mode?: TooltipDisplayMode | null;
  header?: string;
  padding?: number;
}

export interface DisplayValue {
  name: string;
  value: unknown;
  valueString: string;
  highlight: boolean;
}

export function getDisplayValuesAndLinks(
  data: DataFrame,
  displayProps,
  baseProps,
  extraFields,
  all_annots,
  time,
  rowIndex: number,
  columnIndex?: number | null,
  sortOrder?: SortOrder,
  mode?: TooltipDisplayMode | null,
) {
  const fields = data.fields.concat(extraFields);
  const hoveredField = columnIndex != null ? fields[columnIndex] : null;

  const visibleFields = fields.filter((f) => !Boolean(f.config.custom?.hideFrom?.tooltip));
  const traceIDField = visibleFields.find((field) => field.name === 'traceID') || fields[0];
  const orderedVisibleFields: Field[] = [];

  // Only include traceID if it's visible and put it in front.
  if (visibleFields.filter((field) => traceIDField === field).length > 0) {
    // @ts-ignore
    orderedVisibleFields.push(traceIDField);
  }
  // @ts-ignore
  orderedVisibleFields.push(...visibleFields.filter((field) => traceIDField !== field));

  if (orderedVisibleFields.length === 0) {
    return null;
  }

  const displayValues: DisplayValue[] = [];
  const links: Array<LinkModel<Field>> = [];
  const linkLookup = new Set<string>();


  let annotations: Field = {name: 'all_annots', values: [], type: FieldType.string, config: {} }
  if (all_annots) {
    const sortedAnnots: any = all_annots.length > 1 ? sortAnnotations(all_annots) : all_annots
    if (sortedAnnots?.length) {
      sortedAnnots?.forEach(annot => {
        if (!annot) {return}
        const {data, alertName, instance, newState, timeEnd} = annot
        //const {grafana_folder, ...extractedFields} = labels


        let timeF
        if (timeEnd) {
          timeF = dateTime(timeEnd).format('MM-DD HH:mm:ss')
        }


        const printObj = (obj) => Object.entries(obj)
            .map(([key, value]) => `${key}=${value}`)
            .join(' ');

        const formattedAnnot = `alertname: ${alertName}, newState: ${newState}, timeEnd: ${timeF}, instance: ${instance}, ${JSON.stringify(data.values)}` //timeEnd

        annotations.values.push(formattedAnnot)
      })


    }
    orderedVisibleFields.push(annotations)

  }

  for (const field of orderedVisibleFields) {
    //if (mode === TooltipDisplayMode.Single && field !== hoveredField) {
      //continue;
    //}

    const isGeoJsonField = field.config.description === 'GeoJson'
    const value = field.values[ baseProps.includes(field.name) || isGeoJsonField ? 0 : rowIndex];

    const fieldDisplay = field.display ? field.display(value) : { text: `${value}`, numeric: +value };

    if (field.getLinks) {
      field.getLinks({ calculatedValue: fieldDisplay, valueRowIndex: rowIndex }).forEach((link) => {
        const key = `${link.title}/${link.href}`;
        if (!linkLookup.has(key) && mode === TooltipDisplayMode.Single && field === hoveredField) { /// me ->> && mode === TooltipDisplayMode.Single && field === hoveredField
          links.push(link);
          linkLookup.add(key);
        }
      });
    }

    const allButAnnots = displayProps.includes(field.name) && field.name !== 'all_annots'
    if (displayProps.length === 4 || allButAnnots) {  //// 4 - is hardcoded included field names,
    displayValues.push({
      name: getFieldDisplayName(field, data),
      value,
      valueString: formattedValueToString(fieldDisplay),
      highlight: field === hoveredField,
    });
    }

    if (field.name === 'all_annots') {
      field.values.forEach((annot, i) => {
        const value = annot
        const fieldDisplay = field.display ? field.display(value) : { text: `${value}`, numeric: +value };
        displayValues.push({
          name: `annot ${i> 0 ? i+1 : ''}`,
          value,
          valueString: formattedValueToString(fieldDisplay),
          highlight: field === hoveredField,
        });
      })
    }

  }

  if (sortOrder && sortOrder !== SortOrder.None) {
    displayValues.sort((a, b) => arrayUtils.sortValues(sortOrder)(a.value, b.value));
  }

  return { displayValues, links };
}

export const DataHoverView = ({ data, rowIndex, displayProps, baseProps, extraFields, all_annots, time, columnIndex, sortOrder, mode, header, padding = 0 }: Props) => {
  const styles = useStyles2(getStyles, padding);

  if (!data || rowIndex == null) {
    return null;
  }

  const dispValuesAndLinks = getDisplayValuesAndLinks(data, displayProps, baseProps, extraFields, all_annots, time, rowIndex, columnIndex, sortOrder, mode);

  if (dispValuesAndLinks == null) {
    return null;
  }

  const { displayValues, links } = dispValuesAndLinks;

  if (header === 'Exemplar') {
    return <ExemplarHoverView displayValues={displayValues} links={links} header={header} />;
  }

  return (
    <div className={styles.wrapper}>
      {header && (
        <div className={styles.header}>
          <span className={styles.title}>{header}</span>
        </div>
      )}
      <table className={styles.infoWrap}>
        <tbody>
          {displayValues.map((displayValue, i) => (
            <tr key={`${i}/${rowIndex}`}>
              <th>{displayValue.name}</th>
              <td>{renderValue(displayValue.valueString)}</td>
            </tr>
          ))}
          {links.map((link, i) => (
            <tr key={i}>
              <th>Link</th>
              <td colSpan={2}>
                <TextLink href={link.href} external={link.target === '_blank'} weight={'medium'} inline={false}>
                  {link.title}
                </TextLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
const getStyles = (theme: GrafanaTheme2, padding = 0) => {
  return {
    wrapper: css({
      padding: `${padding}px`,
      background: theme.components.tooltip.background,
      borderRadius: theme.shape.borderRadius(2),
    }),
    header: css({
      background: theme.colors.background.secondary,
      alignItems: 'center',
      alignContent: 'center',
      display: 'flex',
      paddingBottom: theme.spacing(1),
    }),
    title: css({
      fontWeight: theme.typography.fontWeightMedium,
      overflow: 'hidden',
      display: 'inline-block',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      flexGrow: 1,
    }),
    infoWrap: css({
      padding: theme.spacing(1),
      background: 'transparent',
      border: 'none',
      th: {
        fontWeight: theme.typography.fontWeightMedium,
        padding: theme.spacing(0.25, 2, 0.25, 0),
      },

      tr: {
        borderBottom: `1px solid ${theme.colors.border.weak}`,
        '&:last-child': {
          borderBottom: 'none',
        },
      },
    }),
    link: css({
      color: theme.colors.text.link,
    }),
  };
};
