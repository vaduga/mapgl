import { createMarkersLayer } from '../layers/data/markersLayer';
import { notifyPanelEditor } from './geomap_utils';
import type { DataFrame, PanelData } from '@grafana/data';

import { Graph } from '@vaduga/mapgl-core/graph/main';

import { VisLayers } from '@vaduga/mapgl-core/store';
import { colTypes } from '../types/index';
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

describe('markers layer registry adapter', () => {
  it('delegates graph data processing exclusively to the graph frame pipeline', async () => {
    const registry = createMarkersLayer({
      ArcOptionsEditor: jest.fn(),
      CapacityDimensionEditor: jest.fn(),
      GroupsEditor: jest.fn(),
      StyleEditor: jest.fn(),
      getQueryFields: jest.fn(),
    });

    const handler = await registry.create(
      { isLogic: false, useMockData: false },
      { name: 'graph', type: 'markers' },
      {} as never
    );

    expect(registry.usesQueryData).toBe(true);
    expect(handler.update).toBeUndefined();
  });
});

function layer(name: string) {
  return {
    getName: () => name,
  } as any;
}

function panel() {
  return {
    panelContext: {
      onInstanceStateChange: jest.fn(),
    },
  } as any;
}

describe('notifyPanelEditor', () => {
  const layers = [layer('basemap'), layer('first'), layer('second')];

  it('preserves the selected data layer across refresh notifications', () => {
    const mapPanel = panel();

    notifyPanelEditor(mapPanel, layers, 2);
    notifyPanelEditor(mapPanel, layers);

    expect(mapPanel.panelContext.onInstanceStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ selected: 2 })
    );
  });

  it('selects the first displayed data layer for the initial notification', () => {
    const mapPanel = panel();

    notifyPanelEditor(mapPanel, layers);

    expect(mapPanel.panelContext.onInstanceStateChange).toHaveBeenCalledWith(expect.objectContaining({ selected: 2 }));
  });
});
