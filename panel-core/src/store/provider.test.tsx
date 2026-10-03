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
        {store.viewStore.getViewState.zoom}:{store.pointStore.getTooltipObject.object?.locName ?? 'none'}
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
    first.stores.viewStore.setViewState({ ...first.stores.viewStore.getViewState, zoom: 4 });
    first.stores.pointStore.setTooltipObject({ object: { locName: 'A' } });
  });
  expect(screen.getByRole('status')).toHaveTextContent('4:A');
  rerender(
    <RootStoreProvider store={second.stores}>
      <Reader />
    </RootStoreProvider>
  );
  expect(seen).toHaveBeenLastCalledWith(second.stores);
  expect(screen.getByRole('status')).toHaveTextContent(':none');
  act(() => first.stores.pointStore.setTooltipObject({ object: { locName: 'old-store' } }));
  expect(seen).toHaveBeenLastCalledWith(second.stores);
  expect(screen.getByRole('status')).toHaveTextContent(':none');
  const dispose = jest.spyOn(second, 'dispose');
  unmount();
  expect(dispose).not.toHaveBeenCalled();
  first.dispose();
  second.dispose();
});
