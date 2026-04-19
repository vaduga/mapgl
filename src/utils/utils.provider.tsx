import React, { createContext, useContext, ReactNode } from 'react';

import RootStore from '../store/RootStore';

const StoreContext = createContext<RootStore | undefined>(undefined);

interface RootStoreProviderProps {
  children: ReactNode;
  props: any;
}

export const RootStoreProvider = ({ children, props }: RootStoreProviderProps) => {
  const root = new RootStore(props);
  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
};

// hook
export const useRootStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }

  return context;
};
