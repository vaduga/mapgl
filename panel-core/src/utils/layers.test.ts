import type { DataFrame, PanelData } from '@grafana/data';

import { Graph } from '@mapgl/panel-core/graph';

import { VisLayers } from '../store';
import { colTypes } from '../types';
import { applyLayerFilter, createDerivedLayers } from './layers';

const frame = (refId: string): DataFrame =>
  ({
    refId,
    fields: [],
    length: 0,
  }) as DataFrame;

describe('generic data layer update adapter', () => {
  it('filters selected frames and invokes a non-graph update handler once', () => {
    const update = jest.fn();
    const data = {
      series: [frame('A'), frame('B')],
    } as PanelData;

    applyLayerFilter(
      {
        init: jest.fn(),
        update,
      },
      {
        name: 'paths',
        type: 'path',
        query: { id: 'byRefId', options: 'B' },
      },
      data
    );

    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0]).not.toBe(data);
    expect(update.mock.calls[0][0].series).toEqual([data.series[1]]);
  });

  it('does nothing for a dedicated-pipeline handler without update lifecycle', () => {
    const handler = {
      init: jest.fn(),
    };

    expect(() =>
      applyLayerFilter(
        handler,
        {
          name: 'markers',
          type: 'markers',
        },
        { series: [frame('A')] } as PanelData
      )
    ).not.toThrow();
  });
});

describe('derived visibility layers', () => {
  it('keeps geographic comments visible before comment features exist', () => {
    const visLayers = new VisLayers();

    createDerivedLayers(visLayers, new Graph('root'), false, (value) => value);

    expect(visLayers.getVisState(null, colTypes.Comments, colTypes.Comments)).toEqual([true, false]);
  });
});
