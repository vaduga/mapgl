import { render, screen } from '@testing-library/react';
import React from 'react';

import { RootStoreProvider, useRootStore } from './provider';

interface TestStore {
  value: string;
}

function StoreValue() {
  const store = useRootStore<TestStore>();
  return <div data-testid="store-value">{store.value}</div>;
}

describe('RootStoreProvider', () => {
  it('retains the root store and updates its inputs across parent renders', () => {
    const createRootStore = jest.fn((props: TestStore) => ({ ...props }));
    const updateRootStore = jest.fn((root: TestStore, props: TestStore) => {
      root.value = props.value;
    });
    const { rerender } = render(
      <RootStoreProvider props={{ value: 'first' }} createRootStore={createRootStore} updateRootStore={updateRootStore}>
        <StoreValue />
      </RootStoreProvider>
    );

    expect(screen.getByTestId('store-value')).toHaveTextContent('first');

    rerender(
      <RootStoreProvider
        props={{ value: 'second' }}
        createRootStore={createRootStore}
        updateRootStore={updateRootStore}
      >
        <StoreValue />
      </RootStoreProvider>
    );

    expect(createRootStore).toHaveBeenCalledTimes(1);
    expect(updateRootStore).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('store-value')).toHaveTextContent('second');
  });

  it('preserves recreate-on-render behavior when no updater is supplied', () => {
    const createRootStore = jest.fn((props: TestStore) => ({ ...props }));
    const { rerender } = render(
      <RootStoreProvider props={{ value: 'first' }} createRootStore={createRootStore}>
        <StoreValue />
      </RootStoreProvider>
    );

    rerender(
      <RootStoreProvider props={{ value: 'second' }} createRootStore={createRootStore}>
        <StoreValue />
      </RootStoreProvider>
    );

    expect(createRootStore).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId('store-value')).toHaveTextContent('second');
  });
});
