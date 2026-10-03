import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { observer } from 'mobx-react-lite';
import { PanelController } from '../runtime/PanelController';
import { RootStoreProvider, useRootStore } from './provider';

it('provides the controller stores to observers and switches identity when the controller changes', () => {
  const first = new PanelController();
  const second = new PanelController();
  const seen = jest.fn();
  const Reader = observer(() => {
    const store = useRootStore();
    seen(store);
    return (
      <output>
        {store.pointStore.getMode}:{store.pointStore.getisDrawerOpen ? 'open' : 'closed'}:
        {store.viewStore.getViewState.zoom}:{store.pointStore.getIsShowCenter?.zoom ?? 'none'}:
        {store.pointStore.getTooltipObject.object?.locName ?? 'none'}:{store.pointStore.getLog.length}
      </output>
    );
  });
  const { rerender, unmount } = render(
    <RootStoreProvider store={first.stores}>
      <Reader />
    </RootStoreProvider>
  );
  expect(seen).toHaveBeenLastCalledWith(first.stores);
  act(() => {
    first.stores.pointStore.setMode('modify');
    first.stores.pointStore.setDrawerOpen(true);
    first.stores.viewStore.setViewState({ ...first.stores.viewStore.getViewState, zoom: 4 });
    first.stores.pointStore.setIsShowCenter({ ...first.stores.viewStore.getViewState, zoom: 5 });
    first.stores.pointStore.setTooltipObject({ object: { locName: 'A' } });
    first.stores.pointStore.addLog({ locName: 'A', metric: 10, updatedAt: '2026-09-30T00:00:00Z' });
  });
  expect(screen.getByRole('status')).toHaveTextContent('modify:open:4:5:A:1');
  rerender(
    <RootStoreProvider store={second.stores}>
      <Reader />
    </RootStoreProvider>
  );
  expect(seen).toHaveBeenLastCalledWith(second.stores);
  expect(screen.getByRole('status')).toHaveTextContent('view:closed');
  act(() => first.stores.pointStore.setMode('view'));
  expect(seen).toHaveBeenLastCalledWith(second.stores);
  const dispose = jest.spyOn(second, 'dispose');
  unmount();
  expect(dispose).not.toHaveBeenCalled();
  first.dispose();
  second.dispose();
});
