import { createTheme, FieldType, toDataFrame, type GrafanaTheme2 } from '@grafana/data';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { PanelController } from '@vaduga/mapgl-core/runtime';
import { FeatSource } from '@vaduga/mapgl-core/graph/main';
import { colTypes } from '@vaduga/mapgl-core/types';
import { SortOrder, TooltipDisplayMode } from '@grafana/schema';
import { getDisplayValuesAndLinks } from './DataHoverView';
import { getThemeVariables } from '../../render/grafanaThemeVars';
import { Tooltip } from './Tooltip';

jest.mock('@grafana/ui', () => ({
  ...jest.requireActual('@grafana/ui'),
  useTheme2: () => createTheme(),
  useStyles2: () => ({}),
  VizTooltipContainer: ({ children }) => <div>{children}</div>,
}));

it.each([colTypes.Path, colTypes.Polygons])('inspects and pins %s source rows without graph identity', (type) => {
  const controller = new PanelController();
  const frame = toDataFrame({
    refId: 'geometry',
    fields: [
      { name: 'metric', type: FieldType.number, values: [10, 25] },
      { name: 'extra', type: FieldType.string, values: ['first', 'second'] },
    ],
  });
  frame.fields[0].display = (value) => ({ numeric: Number(value), text: String(value), suffix: ' ms' });
  const source = new FeatSource(type, 'Geometry');
  source.setFeatures([], frame.refId);
  const pick = {
    picked: true,
    index: 1,
    x: 20,
    y: 30,
    object: { rowIndex: 1, properties: { locName: 'Region B', featSource: source } },
    layer: { props: { displayProperties: ['metric'], isShowTooltip: true } },
  };
  const props = {
    controller,
    time: 0,
    setHoverInfo: jest.fn(),
    data: { series: [toDataFrame({ fields: [{ name: 'wrong', values: ['wrong frame'] }] }), frame] },
    dataLayers: [{ name: source.layerName, displayProperties: ['metric'], isShowTooltip: true }],
  };
  const { rerender, unmount } = render(<Tooltip {...props} info={pick} />);
  expect(screen.getByRole('tooltip', { name: 'Region B' })).toHaveTextContent('25 ms');
  expect(screen.queryByText('extra')).not.toBeInTheDocument();
  expect(screen.queryByText('wrong frame')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('outgoing')).not.toBeInTheDocument();
  rerender(<Tooltip {...props} info={{ picked: false, index: -1 }} />);
  expect(screen.queryByTestId('graph-tooltip')).not.toBeInTheDocument();
  act(() => controller.stores.pointStore.setTooltipObject({ ...pick, mapglPinned: true }));
  rerender(<Tooltip {...props} info={{}} />);
  expect(screen.getByRole('dialog', { name: 'Region B' })).toHaveTextContent('25 ms');
  rerender(<Tooltip {...props} info={{}} dataLayers={[]} />);
  expect(screen.getByRole('dialog')).toHaveTextContent('25 ms');
  rerender(<Tooltip {...props} info={{}} dataLayers={[{ ...props.dataLayers[0], isShowTooltip: false }]} />);
  expect(screen.queryByTestId('graph-tooltip')).not.toBeInTheDocument();
  rerender(<Tooltip {...props} info={{}} />);
  fireEvent.click(screen.getByRole('button', { name: 'close' }));
  expect(screen.queryByTestId('graph-tooltip')).not.toBeInTheDocument();
  unmount();
  controller.dispose();
});

it.each(['light', 'dark'] as const)('maps tooltip tokens on the %s host without newer theme fields', (mode) => {
  const theme = createTheme({ colors: { mode } });
  const hostTheme = { ...theme, colors: { ...theme.colors, accent: undefined }, flags: undefined };
  const variables = getThemeVariables(hostTheme as unknown as GrafanaTheme2);
  expect(variables['--tooltip-focus-accent']).toBe(theme.colors.primary.main);
});

it('preserves native names, row formatting, hidden fields and extra values', () => {
  const frame = toDataFrame({
    fields: [
      { name: 'id', type: FieldType.string, values: ['A', 'B'] },
      { name: 'duration', type: FieldType.number, values: [1000, 2000], config: { displayName: 'Elapsed' } },
      {
        name: 'secret',
        type: FieldType.string,
        values: ['hidden A', 'hidden B'],
        config: { custom: { hideFrom: { tooltip: true } } },
      },
    ],
  });
  frame.fields[1].display = (value) => ({
    numeric: Number(value),
    text: (Number(value) / 1000).toFixed(1),
    suffix: ' s',
  });
  const result = getDisplayValuesAndLinks(
    frame,
    ['ack'],
    ['ack'],
    [{ name: 'ack', type: FieldType.boolean, values: [false], config: {} }],
    undefined,
    0,
    1,
    1,
    SortOrder.None,
    TooltipDisplayMode.Single
  )!;
  expect(result.displayValues.map((value) => [value.name, value.valueString])).toEqual([
    ['id', 'B'],
    ['Elapsed', '2.0 s'],
    ['ack', 'false'],
  ]);
  expect(result.displayValues[1].highlight).toBe(true);
});

it('prepares row-specific native data links with preserved callbacks and targets', () => {
  const activate = jest.fn();
  const frame = toDataFrame({
    fields: [
      {
        name: 'id',
        type: FieldType.string,
        values: ['A', 'B'],
        config: { links: [{ title: 'Details', url: '/details' }] },
      },
    ],
  });
  frame.fields[0].getLinks = ({ valueRowIndex }) => [
    {
      title: 'Details',
      href: `/details/${valueRowIndex}`,
      target: '_blank',
      onClick: activate,
      origin: frame.fields[0],
    },
    {
      title: 'Details',
      href: `/details/${valueRowIndex}`,
      target: '_blank',
      onClick: activate,
      origin: frame.fields[0],
    },
  ];
  const result = getDisplayValuesAndLinks(
    frame,
    [],
    [],
    [],
    undefined,
    0,
    1,
    0,
    SortOrder.None,
    TooltipDisplayMode.Single
  )!;
  expect(result.links).toHaveLength(1);
  expect(result.links[0]).toMatchObject({ href: '/details/1', target: '_blank', onClick: activate });
});

it('sorts native alert presentation without mutating the supplied annotation order', () => {
  const frame = toDataFrame({ fields: [{ name: 'id', type: FieldType.string, values: ['A'] }] });
  const annotations = [
    { alertName: 'healthy', newState: 'Normal', data: { values: [] } },
    { alertName: 'critical', newState: 'Alerting', data: { values: [] } },
  ];
  const result = getDisplayValuesAndLinks(frame, [], [], [], annotations, 0, 0)!;
  expect(
    result.displayValues.filter((value) => value.name.startsWith('annot')).map((value) => value.valueString)
  ).toEqual([expect.stringContaining('critical'), expect.stringContaining('healthy')]);
  expect(annotations[0].alertName).toBe('healthy');
});
