import { useEffect, useState } from 'react';
import type { PanelController } from '../runtime/PanelController';
import { PanelRenderSession, type PanelRenderOptions } from './session';

/** Bind a stable, memoized configuration to the controller-owned render lifetime. */
export function usePanelRenderSession(controller: PanelController, options: PanelRenderOptions) {
  const [session, setSession] = useState<PanelRenderSession>();
  const [, redraw] = useState(0);
  useEffect(() => {
    const current = new PanelRenderSession(controller, options);
    const unsubscribe = current.subscribe(() => redraw((value) => value + 1));
    setSession(current);
    return () => {
      unsubscribe();
      current.dispose();
    };
    // Options are updated by the following effect; controller owns the lifetime.
  }, [controller]);
  useEffect(() => {
    session?.configure(options);
  }, [session, options]);
  return { session, frame: session?.frame, layers: session ? [...session.layers] : [], error: session?.error };
}

/** Subscribe to a render lifetime owned by an integration session. */
export function useRenderFrame(session?: PanelRenderSession) {
  const [, redraw] = useState(0);
  useEffect(() => session?.subscribe(() => redraw((value) => value + 1)), [session]);
  return { frame: session?.frame, layers: session ? [...session.layers] : [], error: session?.error };
}
