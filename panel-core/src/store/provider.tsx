import React, { createContext, type ReactNode, useContext } from 'react';
import type { RootStore } from './RootStore';

const StoreContext = createContext<RootStore | undefined>(undefined);

export function RootStoreProvider({ store, children }: { store: RootStore; children: ReactNode }) {
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useRootStore(): RootStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }
  return store;
}
