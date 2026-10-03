import { getReadyViewport } from './runtime';

describe('viewport readiness', () => {
  it('waits for initialization before accessing viewports', () => {
    const viewport = { width: 800, height: 600 };
    const getViewports = jest.fn(() => [viewport]);
    const deck = { isInitialized: false, getViewports };
    expect(getReadyViewport(deck)).toBeUndefined();
    expect(getViewports).not.toHaveBeenCalled();
    deck.isInitialized = true;
    expect(getReadyViewport(deck)).toBe(viewport);
  });
});
