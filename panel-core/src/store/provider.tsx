import React, { createContext, ReactNode, useContext } from 'react';

const StoreContext = createContext<unknown | undefined>(undefined);

interface RootStoreProviderProps<TRootStore> {
  children: ReactNode;
  props: any;
  createRootStore: (props: any) => TRootStore;
  connectRootStore?: (root: TRootStore) => void;
  disposeRootStore?: (root: TRootStore) => void;
  updateRootStore?: (root: TRootStore, props: any) => void;
}

export const RootStoreProvider = <TRootStore,>({
  children,
  props,
  createRootStore,
  updateRootStore,
  disposeRootStore,
  connectRootStore,
}: RootStoreProviderProps<TRootStore>) => {
  const [stableRoot] = React.useState(() => (updateRootStore ? createRootStore(props) : undefined));
  const root = updateRootStore && stableRoot !== undefined ? stableRoot : createRootStore(props);
  if (updateRootStore) {
    updateRootStore(root, props);
  }
  const dispose = React.useRef(disposeRootStore);
  dispose.current = disposeRootStore;
  const connect = React.useRef(connectRootStore);
  connect.current = connectRootStore;
  // Render can be discarded by React, so subscriptions belong to the
  // committed root and are refreshed only when its event bus changes.
  React.useEffect(() => {
    connect.current?.(root);
  }, [root, props.eventBus]);
  React.useEffect(() => () => dispose.current?.(root), [root]);
  return <StoreContext.Provider value={root}>{children}</StoreContext.Provider>;
};

export const useRootStore = <TRootStore = any,>() => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }

  return context as TRootStore;
};
