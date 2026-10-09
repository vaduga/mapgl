import { useCallback, useEffect, useRef } from 'react';

export function getReadyViewport<T>(
  deck?: { readonly isInitialized: boolean; getViewports(): T[] } | null
): T | undefined {
  return deck?.isInitialized ? deck.getViewports()[0] : undefined;
}

export function useSvgIconRefresh(refresh: () => void): () => void {
  const frameRef = useRef<number | null>(null);
  const refreshRef = useRef(refresh);

  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    []
  );

  return useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      refreshRef.current();
    });
  }, []);
}

export function useDelayedHover(action: (info: any) => void, delayMs = 100) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef(action);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  return useCallback(
    (info: any) => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (!info?.picked) {
        actionRef.current(info);
        return;
      }
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        actionRef.current(info);
      }, delayMs);
    },
    [delayMs]
  );
}
