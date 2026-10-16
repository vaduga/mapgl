import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Graph } from '@vaduga/mapgl-core/graph/main';

import ReactSelectSearch from './ReactSelectSearch';

jest.mock('@grafana/ui', () => ({
  useStyles2: () => ({}),
  Combobox: ({ options, onChange }) => (
    <div>
      {options.map((option) => (
        <button key={option.nodeId} onClick={() => onChange(option)}>
          {option.label}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@vaduga/mapgl-core/graph/main', () => ({
  getGraphNodes: () => [{ id: 'node-1' }],
  getNodeData: () => ({ feature: { rowIndex: 1, layerName: 'nodes', frameRefId: 'B' } }),
}));

describe('saved node search fields', () => {
  it.each([
    ['legacy fields', { searchProperties: ['alias'] }, 'node-1 Core router'],
    [
      'legacy fields with other optional settings',
      { searchProperties: ['alias'], optional: { nsSeparator: '.' } },
      'node-1 Core router',
    ],
    [
      'new fields take precedence',
      { searchProperties: ['alias'], optional: { searchProps: ['site'] } },
      'node-1 Irkutsk',
    ],
    ['explicitly cleared fields', { searchProperties: ['alias'], optional: { searchProps: [] } }, 'node-1'],
    ['no extra fields', {}, 'node-1'],
  ])('%s', (_name, savedOptions, label) => {
    const selectGotoHandler = jest.fn();
    render(
      <ReactSelectSearch
        options={{ dataLayers: [{ type: 'markers', name: 'nodes', ...savedOptions }] }}
        data={{
          series: [
            { refId: 'A', fields: [{ name: 'alias', values: ['Wrong frame', 'Wrong frame'] }] },
            {
              refId: 'B',
              fields: [
                { name: 'alias', values: ['Wrong row', 'Core router'] },
                { name: 'site', values: ['Wrong row', 'Irkutsk'] },
              ],
            },
          ],
        }}
        graph={{ id: 'root', subgraphsBreadthFirst: () => [] } as unknown as Graph}
        panelId={7}
        rootStore={{ pointStore: {} }}
        selectGotoHandler={selectGotoHandler}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: label }));
    expect(selectGotoHandler).toHaveBeenCalledWith(
      expect.objectContaining({ pId: 7, value: 'node-1', graphId: 'root' })
    );
  });
});
