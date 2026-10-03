import { css, keyframes } from '@emotion/css';
import { getDeckWidgetSkin } from './deck-widget-skin';

const layoutLoadingSpin = keyframes({
  to: {
    transform: 'rotate(360deg)',
  },
});

const dropdown = 'var(--theme-z-index-dropdown, 1000)';
const backgroundSecondary = 'var(--theme-background-secondary, #f4f5f5)';
const spacing = 'var(--theme-spacing-1, 8px)';
const spacingHalf = 'var(--theme-spacing-0-5, 4px)';
const spacingQuarter = 'var(--theme-spacing-0-25, 2px)';
const spacingThreeEighths = 'var(--theme-spacing-0-375, 3px)';
const spacingThreeQuarters = 'var(--theme-spacing-0-75, 6px)';
const spacingTwo = 'var(--theme-spacing-2, 16px)';
const buttonSize = 'var(--button-size, 28px)';

export const getStyles = () => ({
  container: css({
    '.maplibregl-ctrl-attrib-button': {
      display: 'none',
    },
    backgroundColor: backgroundSecondary,
  }),
  geoContainer: css({
    backgroundColor: 'transparent',
    '> #deckgl-wrapper > .deck-events-root > .maplibregl-map': {
      zIndex: '0 !important',
    },
    '> #deckgl-wrapper > .deck-events-root > #deckgl-overlay': {
      zIndex: 1,
    },
  }),
  graphDiagnostics: css({
    position: 'absolute',
    top: spacing,
    left: '50%',
    zIndex: dropdown,
    width: 'min(560px, calc(100% - ' + spacingTwo + '))',
    transform: 'translateX(-50%)',
    display: 'grid',
    gap: spacing,
  }),
  graphEmptyState: css({
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: dropdown,
    width: 'min(560px, calc(100% - ' + spacingTwo + '))',
    transform: 'translate(-50%, -50%)',
  }),
  yamap: css({
    width: '100%',
    height: '100%',
    zIndex: -1,
    position: 'absolute',
    isolation: 'isolate',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  }),
  geocoder: css({
    display: 'flex',
    flexDirection: 'row-reverse',
    position: 'absolute',
    right: 'var(--theme-spacing-1-7, 14px)',
    top: spacingTwo,
  }),
  fullscreen: css({
    ...getDeckWidgetSkin(),
    zIndex: dropdown,
    position: 'absolute',
    top: spacing,
    right: spacing,
  }),
  compass: css({
    ...getDeckWidgetSkin(),
    zIndex: dropdown,
    position: 'absolute',
    top: 'calc(' + spacing + ' + ' + buttonSize + ' + var(--theme-spacing-1-5, 12px))',
    right: spacing,
  }),
  layoutLoading: css({
    ...getDeckWidgetSkin(),
    zIndex: dropdown,
    position: 'absolute',
    top: spacing,
    left: spacing,
    'button.deck-widget-spinner': {
      cursor: 'default',
    },
    'button.deck-widget-spinner .deck-widget-icon': {
      animation: layoutLoadingSpin + ' 1s linear infinite',
      mask: "url(\"data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2024%2024'%20xmlns%3D'http://www.w3.org/2000/svg'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpath%20d%3D'M21%2012a9%209%200%201%201-6.219-8.56'%2F%3E%3C%2Fsvg%3E\") center / 70% 70% no-repeat",
      WebkitMask:
        "url(\"data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2024%2024'%20xmlns%3D'http://www.w3.org/2000/svg'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpath%20d%3D'M21%2012a9%209%200%201%201-6.219-8.56'%2F%3E%3C%2Fsvg%3E\") center / 70% 70% no-repeat",
    },
  }),
  layerSwitcher: css({
    zIndex: dropdown,
    position: 'absolute',
    top: 'var(--theme-spacing-7, 56px)',
    left: 0,
    overflow: 'hidden',
    pointerEvents: 'all',
  }),
  legendStack: css({
    zIndex: dropdown,
    position: 'absolute',
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    pointerEvents: 'none',
  }),
  edgeLegend: css({
    pointerEvents: 'all',
    background: backgroundSecondary,
  }),
  nodesLegend: css({
    paddingBottom: spacingHalf,
    pointerEvents: 'all',
    background: backgroundSecondary,
  }),
  compactLegend: css({
    '& > div': {
      padding: spacingQuarter + ' ' + spacingThreeEighths,
      gap: spacingQuarter + ' ' + spacingThreeQuarters,
    },
    '& ul': {
      display: 'flex',
      alignItems: 'center',
      gap: spacingQuarter,
    },
    '& li > span': {
      paddingRight: spacingHalf,
      fontSize: 'calc(var(--theme-font-size-small, 12px) * 1)',
      lineHeight: 1.1,
    },
    '& button': {
      fontSize: 'inherit',
      lineHeight: 1.1,
    },
    '& svg': {
      width: 'var(--theme-spacing-1-5, 12px)',
      height: 'var(--theme-spacing-1-5, 12px)',
    },
  }),
  timeNcoords: css({
    position: 'absolute',
    zIndex: dropdown,
    display: 'flex',
    alignItems: 'center',
    gap: spacing,
    fontSize: 'calc(var(--theme-font-size-small, 12px) * 0.85)',
    lineHeight: 1,
    top: spacing,
    right: 'calc(' + spacing + ' + ' + buttonSize + ' + ' + spacing + ')',
    whiteSpace: 'nowrap',
    pointerEvents: 'all',
  }),
});
