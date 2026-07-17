/// <reference types="jest" />

import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import type { VisLayers } from '../../panel-core/src/store';
import LayerSwitcher, { type LayerSwitcherPanel } from '../../panel-core/src/components/Selects/LayerSwitcher';

jest.mock('@grafana/ui', () => ({
  Tooltip: ({ children }: React.PropsWithChildren) => children,
  useStyles2: () => ({ root: 'root', toggleWrapper: 'toggle-wrapper' }),
}));

jest.mock('../../panel-core/src/extension-points/featureContracts', () => ({
  applyNamespaceProjectionStrategies: jest.fn(),
  getMapglFeatureServices: () => ({ namespaceProjectionStrategies: [] }),
}));

describe('LayerSwitcher', () => {
  it('does not let pointer events from the opened menu select the Grafana panel', () => {
    const onPointerDown = jest.fn();
    const visLayers = {
      getLayerTree: () => [],
      setChildVisibility: jest.fn(),
    } as unknown as VisLayers;
    const panel = { graph: {}, visLayers } as unknown as LayerSwitcherPanel;

    const { container, getByRole } = render(
      <div onPointerDown={onPointerDown}>
        <LayerSwitcher label="layers" panel={panel} setVisRefresh={jest.fn()} />
      </div>
    );

    fireEvent.click(getByRole('button', { name: 'layers' }));
    fireEvent.pointerDown(container.querySelector('.panel')!);

    expect(onPointerDown).not.toHaveBeenCalled();
  });
});
