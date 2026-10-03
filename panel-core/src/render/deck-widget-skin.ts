const fullscreenEnter =
  'url("data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%2028%2028%27%20xmlns%3D%27http://www.w3.org/2000/svg%27%3E%3Cpath%20fill%3D%27black%27%20d%3D%27M8%2020h3v2H7a1%201%200%200%201-1-1v-4h2v3zm0-12v3H6V7a1%201%200%200%201%201-1h4v2H8zm12%2012v-3h2v4a1%201%200%200%201-1%201h-4v-2h3zM20%208h-3V6h4a1%201%200%200%201%201%201v4h-2V8z%27/%3E%3C/svg%3E")';

const fullscreenExit =
  'url("data:image/svg+xml,%3Csvg%20viewBox%3D%270%200%2028%2028%27%20xmlns%3D%27http://www.w3.org/2000/svg%27%3E%3Cpath%20fill%3D%27black%27%20d%3D%27M10%2018H6v-2h4a1%201%200%200%201%201%201v4h-2v-3zm8%200v3h-2v-4a1%201%200%200%201%201-1h4v2h-3zM10%2010V7h2v4a1%201%200%200%201-1%201H6v-2h4zm8%200h3v2h-4a1%201%200%200%201-1-1V7h2v3z%27/%3E%3C/svg%3E")';

/** Shared DeckGL widget skin; host themes override the neutral DeckGL fallbacks. */
export const getDeckWidgetSkin = (): CSSObject => ({
  margin: 0,
  '& .deck-widget-button, & .deck-widget-button-group': {
    background: 'var(--button-stroke, rgba(255, 255, 255, 0.3))',
    borderRadius: 'var(--button-corner-radius, 8px)',
    boxShadow: 'var(--button-shadow, 0 0 8px 0 rgba(0, 0, 0, 0.25))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .deck-widget-button': {
    width: 'var(--button-size, 28px)',
    height: 'var(--button-size, 28px)',
  },
  '& .deck-widget-button button': {
    width: 'calc(var(--button-size, 28px) - 2px)',
    height: 'calc(var(--button-size, 28px) - 2px)',
    boxSizing: 'border-box',
    background: 'var(--button-background, #fff)',
    backdropFilter: 'var(--button-backdrop-filter, unset)',
    border: 'var(--button-inner-stroke, 1px solid transparent)',
    borderRadius: 'calc(var(--button-corner-radius, 8px) - 1px)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    outline: 'none',
    padding: 0,
  },
  '& button .deck-widget-icon': {
    backgroundColor: 'var(--button-icon-idle, rgba(97, 97, 102, 1))',
    backgroundPosition: '50%',
    backgroundRepeat: 'no-repeat',
    display: 'block',
    height: '100%',
    width: '100%',
  },
  '& button .deck-widget-icon:hover': {
    backgroundColor: 'var(--button-icon-hover, rgba(24, 24, 26, 1))',
  },
  '&.deck-widget-fullscreen .deck-widget-button button.deck-widget-fullscreen-enter .deck-widget-icon': {
    mask: fullscreenEnter + ' center / contain no-repeat',
    WebkitMask: fullscreenEnter + ' center / contain no-repeat',
  },
  '&.deck-widget-fullscreen .deck-widget-button button.deck-widget-fullscreen-exit .deck-widget-icon': {
    mask: fullscreenExit + ' center / contain no-repeat',
    WebkitMask: fullscreenExit + ' center / contain no-repeat',
  },
  '& .deck-widget-tooltip': {
    zIndex: 'var(--tooltip-z-index, 1000)',
    pointerEvents: 'none',
    width: 'max-content',
    maxWidth: 'var(--tooltip-max-width, 240px)',
    padding: '4px 8px',
    borderRadius: 'calc(var(--button-corner-radius, 8px) - 2px)',
    boxShadow: 'var(--menu-shadow, 0 0 8px 0 rgba(0, 0, 0, 0.25))',
    background: 'var(--menu-background, #fff)',
    backdropFilter: 'var(--menu-backdrop-filter, unset)',
    color: 'var(--menu-text, rgb(24, 24, 26))',
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontSize: '12px',
    lineHeight: 1.4,
    overflowWrap: 'anywhere',
    whiteSpace: 'normal',
  },
  '& .deck-widget-tooltip-trigger': {
    display: 'contents',
  },
  '& .deck-pseudo-fullscreen': {
    height: '100%',
    left: 0,
    position: 'fixed',
    top: 0,
    width: '100%',
    zIndex: 'var(--theme-z-index-portal, 1400)',
  },
});
import type { CSSObject } from '@emotion/serialize';
