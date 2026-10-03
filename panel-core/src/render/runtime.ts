import { useCallback, useEffect, useRef } from 'react';

export function getReadyViewport<T>(
  deck?: { readonly isInitialized: boolean; getViewports(): T[] } | null
): T | undefined {
  return deck?.isInitialized ? deck.getViewports()[0] : undefined;
}

export class MapglRenderGeneration {
  private generation = 0;
  private disposed = false;

  begin(): () => boolean {
    const generation = ++this.generation;
    return () => !this.disposed && generation === this.generation;
  }

  invalidate(): void {
    this.generation += 1;
  }

  dispose(): void {
    this.disposed = true;
    this.invalidate();
  }
}

export function useLatestRenderCommit<T>(commit: (value: T) => void, onError?: (error: unknown) => void) {
  const generationRef = useRef(new MapglRenderGeneration());
  const commitRef = useRef(commit);
  const errorRef = useRef(onError);

  useEffect(() => {
    commitRef.current = commit;
    errorRef.current = onError;
  }, [commit, onError]);

  useEffect(() => {
    const generation = new MapglRenderGeneration();
    generationRef.current = generation;
    return () => generation.dispose();
  }, []);

  return useCallback(async (build: () => Promise<T> | T): Promise<boolean> => {
    const isCurrent = generationRef.current.begin();
    try {
      const value = await build();
      if (!isCurrent()) {
        return false;
      }
      commitRef.current(value);
      return true;
    } catch (error) {
      if (isCurrent()) {
        errorRef.current?.(error);
      }
      return false;
    }
  }, []);
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
