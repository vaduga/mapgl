import React, { createContext, ReactNode, useContext } from 'react';

const StoreContext = createContext<unknown | undefined>(undefined);

interface RootStoreProviderProps<TRootStore> {
  children: ReactNode;
  props: any;
  createRootStore: (props: any) => TRootStore;
  updateRootStore?: (root: TRootStore, props: any) => void;
}

export const RootStoreProvider = <TRootStore,>({
  children,
  props,
  createRootStore,
  updateRootStore,
}: RootStoreProviderProps<TRootStore>) => {
  const [stableRoot] = React.useState(() => (updateRootStore ? createRootStore(props) : undefined));
  if (!updateRootStore || stableRoot === undefined) {
    const root = createRootStore(props);
    return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
  }

  updateRootStore(stableRoot, props);
  const root = stableRoot;
  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
};

export const useRootStore = <TRootStore = any,>() => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }

  return context as TRootStore;
};
