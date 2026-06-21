import React, { createContext, ReactNode, useContext } from 'react';

const StoreContext = createContext<unknown | undefined>(undefined);

interface RootStoreProviderProps<TRootStore> {
  children: ReactNode;
  props: any;
  createRootStore: (props: any) => TRootStore;
}

export const RootStoreProvider = <TRootStore,>({ children, props, createRootStore }: RootStoreProviderProps<TRootStore>) => {
  const root = createRootStore(props);
  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
};

export const useRootStore = <TRootStore = any,>() => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }

  return context as TRootStore;
};
