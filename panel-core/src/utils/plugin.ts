import { FeatSource } from '@mapgl/panel-core/graph';
import { FIXED_COLOR_LABEL } from '../types/defaults';
import { colTypes } from '@mapgl/panel-core/types';
import { FieldType, getFrameMatchers } from '@grafana/data';
import {
  addSVGattributes,
  type SvgIconRecord,
} from '../deckLayers/utils/svg';
import { MarkersConfig } from '../layers/data';
import { Rule } from '../editor';
import { getMapglPluginId } from '../pluginFactory/pluginRuntime';
import { MapLayerState } from '../types';


type InitGroupsResult = {
  requiredIconNames: Set<string>;
  svgSignature: string;
};

function initGroups(groups: Rule[], layers, theme, reload = false): InitGroupsResult {
  const nsLayers = layers?.slice(1); //reload ? 1 : 0)

  const iconNames = new Set<string>();

  collectGroups(groups, iconNames, nsLayers, theme);
  const svgSignature = getSvgGroupsSignature(groups);

  return {
    requiredIconNames: iconNames,
    svgSignature,
  };
}

function getSvgGroupsSignature(groups: Rule[]): string {
  return JSON.stringify(
    groups.map((group) => ({
      groupIdx: group.groupIdx,
      iconName: group.iconName,
      svgTintMode: group.svgTintMode,
      overrides: group.overrides,
    }))
  );
}

async function parseSvgFileToString(
  svgIconName: string,
  uController: AbortController
): Promise<[string, SvgIconRecord] | null> {
  const signal = uController.signal;
  if (!svgIconName) {
    return null;
  }

  const isPublic = svgIconName.startsWith('public/');
  const localName = isPublic ? svgIconName : `public/plugins/${getMapglPluginId()}/img/icons/${svgIconName}.svg`;
  const svgFilePath = svgIconName.startsWith('http') ? svgIconName : localName;

  try {
    const response = await fetch(svgFilePath, { signal });
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch SVG file. Status: ${response.status}`);
    }

    const svgString = await response.text();
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const { svgText, svgDataUrl, width, height } = addSVGattributes(svgString);
    if (signal.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    return [
      svgIconName,
      {
        svgText,
        svgDataUrl,
        ...(width ? { width: parseInt(width, 10) } : {}),
        ...(height ? { height: parseInt(height, 10) } : {}),
      },
    ];
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    return null;
  }
}

async function loadSvgIcons(
  names: string[],
  svgIcons: Record<string, any>,
  loadController: AbortController
): Promise<Record<string, any>> {
  if (!names?.length) {
    return svgIcons;
  }

  try {
    const promises: Array<Promise<[string, SvgIconRecord] | null>> = names.map((name) =>
      parseSvgFileToString(name, loadController)
    );

    const res = await Promise.all(promises);

    res
      .filter((v): v is [string, SvgIconRecord] => v !== null)
      .forEach(([name, obj]) => {
        svgIcons[name] = obj;
      });

    return svgIcons;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    throw err;
  }
}

function collectGroups(allGroups: Rule[], iconNames: Set<string>, nsLayers: MapLayerState[] | undefined, theme) {
  nsLayers?.forEach((layer) => {
    const groups: Rule[] = [];
    const featSource = layer.layer as FeatSource;

    const { style, groups: rules } = layer.options.config as MarkersConfig; //|| {}

    const { useGroups, color } = style || {};
    const { field, fixed } = color || {};
    if (useGroups) {
      rules?.forEach((rule: Rule) => {
        const gCopy = { ...rule, groupIdx: allGroups.length };
        groups.push(gCopy);
        allGroups.push(gCopy);
        if (rule.iconName) {
          iconNames.add(rule.iconName);
        }
      });
    }
    if (!field && fixed) {
      const hexColor = theme.visualization.getColorByName(fixed);
      const fixedGroup = {
        label: 'fix-' + hexColor,
        color: hexColor,
        groupIdx: allGroups.length,
        isEph: true,
        overrides: [
          {
            name: 'thrColor',
            type: FieldType.enum,
            value: [FIXED_COLOR_LABEL], //hexColor
          },
        ],
      };
      groups.push(fixedGroup);
      allGroups.push(fixedGroup);
    }
    featSource.setGroups(groups);
  });
}

function parseObjFromString(str) {
  const regex = /(\w+)\s*=\s*(\w+)/g;
  const matches = str.match(regex);
  const obj: any = {};
  if (!matches) {
    return obj;
  }
  matches.forEach((match) => {
    const [_, key, value] = match.match(/(\w+)\s*=\s*(\w+)/);
    obj[key] = value;
  });
  return obj;
}

async function fillAnnots(locLabelName, annotations) {
  const { desc, escape, op, table } = await import('arquero');

  const newAnnots: any = [];
  try {
    annotations?.forEach((frame) => {
      const fields = frame.fields;
      if (fields) {
        const tableData = fields.reduce((acc, field) => {
          if (['time', 'timeEnd', 'text', 'color', 'newState', 'alertId', 'data'].includes(field.name)) {
            acc[field.name] = field.values;
          }
          return acc;
        }, {});

        const dataTable = table(tableData);
        const annotTable = dataTable
          .derive({
            alertName: escape((row, data) => parseObjFromString(row.text).alertname),
            instance: escape((row, data) => parseObjFromString(row.text).instance),
            //labels: escape((row, data) => parseObjFromString(row.text)),
          })
          .select('alertName', 'alertId', 'instance', 'time', 'timeEnd', 'color', 'newState', 'data') //'labels'
          ?.orderby(desc('timeEnd'));

        const maxAlertId = annotTable.rollup({ maxAlertId: op.max('alertId') }).get('maxAlertId', 0);

        for (let alertId = 0; alertId <= maxAlertId; alertId++) {
          const filteredAnnotTable = annotTable.filter(escape((row, data) => row.alertId === alertId));
          if (filteredAnnotTable.size) {
            const annotByInstance = filteredAnnotTable.groupby(locLabelName);

            newAnnots.push([filteredAnnotTable, annotByInstance]);
          }
        }
      }
    });
  } catch (e) {
    //console.log(err=> err)
  }

  return newAnnots;
}

function initBinaryProps(panel) {
  const ptLayers = getGraphLayers(panel);

  let newLen =
    ptLayers?.reduce((sum, el) => {
      const query = el.options?.query ?? el.query;

      if (query) {
        const matcherFunc = getFrameMatchers(query);
        return sum + panel.props.data.series.reduce((seriesSum, frame) => {
          return seriesSum + (matcherFunc(frame) ? frame.length || 0 : 0);
        }, 0);
      }

      return sum + panel.props.data.series.reduce((seriesSum, frame) => seriesSum + (frame.length || 0), 0);
    }, 0) ?? 0;

  const customQuery = panel.props.data?.request?.targets[0];

  const isSnapshot = customQuery?.queryType === 'snapshot';
  if (!newLen && isSnapshot) {
    newLen = customQuery?.snapshot?.[0]?.data.values[0]?.length;
  }
  if (!newLen && ptLayers?.length) {
    const s = panel.props.data?.series[0];
    if (s?.length && !panel.useMockData) {
      newLen = s.length; //dashboard DS
    } else if (panel.useMockData) {
      newLen = 8; /// mockEdgeGraphData len
    }
  }

  panel.graphEngine?.preallocPos?.(newLen * 2);
  panel.positions = new Float64Array(newLen * 2);
  panel.colors = new Uint8Array(newLen * 4);
  panel.muted = new Uint8Array(newLen * 4);
  panel.annots = new Uint8Array(newLen * 4);
  panel.groupIndices = new Uint8Array(newLen);
}

function cutBinaryProps(panel) {
  const end = panel.vCount;
  panel.positions = panel.positions.slice(0, end * 2);
  panel.colors = panel.colors.slice(0, end * 4);
  panel.muted = panel.colors.slice(0, end * 4);
  panel.annots = panel.annots.slice(0, end * 4);
  panel.groupIndices = panel.groupIndices.slice(0, end);
}

function getGraphLayers(panel) {
  const dataLayers = panel.layers.length ? panel.layers.slice(1) : panel.props.options.dataLayers; /// init vs update layers config
  return dataLayers?.filter((el) => el.options?.type === colTypes.Markers || el.type === colTypes.Markers) ?? [];
}

export {
  loadSvgIcons,
  addSVGattributes,
  fillAnnots,
  initGroups,
  collectGroups,
  initBinaryProps,
  cutBinaryProps,
  getGraphLayers,
};
