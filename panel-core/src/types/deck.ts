import type { DeckGLRef } from '@deck.gl/react';

export type DeckGLRefWithViewManager = DeckGLRef & {
  deck?: DeckGLRef['deck'] & {
    viewManager?: {
      viewState?: Record<string, any>;
    };
  };
};
