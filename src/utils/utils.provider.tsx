import React, { createContext, useContext, ReactNode } from 'react';

import RootStore from '../store/RootStore';
import {usePanelContext} from "@grafana/ui";

// holds a reference to the store (singleton)
let store: RootStore | undefined = undefined;

const StoreContext = createContext <RootStore | undefined>(undefined);

interface RootStoreProviderProps {
  children: ReactNode;
  props: any;
}

export const RootStoreProvider = ({ children, props }: RootStoreProviderProps) => {
  //only create the store once ( store is a singleton)

  // @ts-ignore
  const {graph} = usePanelContext()

  const root = store ?? new RootStore({...props, graph});
  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
}

// hook
export const useRootStore = ()=> {

  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }

  return context;
}








