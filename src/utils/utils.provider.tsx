import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react';

import RootStore from '../store/RootStore';

const StoreContext = createContext<RootStore | undefined>(undefined);

interface RootStoreProviderProps {
  children: ReactNode;
  props: any;
}

export const RootStoreProvider = ({ children, props }: RootStoreProviderProps) => {
  const storeRef = useRef<RootStore | null>(null);

  if (!storeRef.current) {
    storeRef.current = new RootStore(props);
  } else {
    storeRef.current.syncFromProps(props);
  }

  useEffect(() => {
    return () => {
      storeRef.current?.dispose();
      storeRef.current = null;
    };
  }, []);

  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
};

// hook
export const useRootStore = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }

  return context;
};
