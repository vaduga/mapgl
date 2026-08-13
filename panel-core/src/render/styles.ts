import { css, keyframes } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import { getDeckWidgetSkin } from './deck-widget-skin';

const layoutLoadingSpin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    .maplibregl-ctrl-attrib-button {
      display: none;
    }
    background-color: ${theme.colors.background.secondary};
  `,
  graphDiagnostics: css`
    position: absolute;
    top: ${theme.spacing(1)};
    left: 50%;
    z-index: ${theme.zIndex.dropdown};
    width: min(560px, calc(100% - ${theme.spacing(2)}));
    transform: translateX(-50%);
    display: grid;
    gap: ${theme.spacing(1)};
  `,
  graphEmptyState: css`
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: ${theme.zIndex.dropdown};
    width: min(560px, calc(100% - ${theme.spacing(2)}));
    transform: translate(-50%, -50%);
  `,
  yamap: css`
    width: 100%;
    height: 100%;
    z-index: -1;
    position: absolute;
    isolation: isolate;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  `,
  geocoder: css`
    display: flex;
    flex-direction: row-reverse;
    position: absolute;
    right: ${theme.spacing(1.7)};
    top: ${theme.spacing(2)};
  `,
  fullscreen: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: ${theme.spacing(1)};
    right: ${theme.spacing(1)};
    ${getDeckWidgetSkin(theme)}
  `,
  compass: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: calc(${theme.spacing(1)} + var(--button-size, ${theme.spacing(3.5)}) + ${theme.spacing(1.5)});
    right: ${theme.spacing(1)};
    ${getDeckWidgetSkin(theme)}
  `,
  layoutLoading: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: ${theme.spacing(1)};
    left: ${theme.spacing(1)};
    ${getDeckWidgetSkin(theme)}

    button.deck-widget-spinner {
      cursor: default;
    }

    button.deck-widget-spinner .deck-widget-icon {
      animation: ${layoutLoadingSpin} 1s linear infinite;
      mask: url("data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2024%2024'%20xmlns%3D'http://www.w3.org/2000/svg'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpath%20d%3D'M21%2012a9%209%200%201%201-6.219-8.56'%2F%3E%3C%2Fsvg%3E")
        center / 70% 70% no-repeat;
      -webkit-mask: url("data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2024%2024'%20xmlns%3D'http://www.w3.org/2000/svg'%20fill%3D'none'%20stroke%3D'black'%20stroke-width%3D'2'%20stroke-linecap%3D'round'%20stroke-linejoin%3D'round'%3E%3Cpath%20d%3D'M21%2012a9%209%200%201%201-6.219-8.56'%2F%3E%3C%2Fsvg%3E")
        center / 70% 70% no-repeat;
    }
  `,
  layerSwitcher: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    top: ${theme.spacing(7)};
    left: 0;
    overflow: hidden;
    pointer-events: all;
  `,
  legendStack: css`
    z-index: ${theme.zIndex.dropdown};
    position: absolute;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    pointer-events: none;
  `,
  edgeLegend: css`
    pointer-events: all;
    background: ${theme.colors.background.secondary};
  `,
  nodesLegend: css`
    padding-bottom: ${theme.spacing(0.5)};
    pointer-events: all;
    background: ${theme.colors.background.secondary};
  `,
  compactLegend: css`
    & > div {
      padding: ${theme.spacing(0.25)} ${theme.spacing(0.375)};
      gap: ${theme.spacing(0.25)} ${theme.spacing(0.75)};
    }
    & ul {
      display: flex;
      align-items: center;
      gap: ${theme.spacing(0.25)};
    }
    & li > span {
      padding-right: ${theme.spacing(0.5)};
      font-size: calc(${theme.typography.bodySmall.fontSize} * 1);
      line-height: 1.1;
    }
    & button {
      font-size: inherit;
      line-height: 1.1;
    }
    & svg {
      width: ${theme.spacing(1.5)};
      height: ${theme.spacing(1.5)};
    }
  `,
  timeNcoords: css`
    position: absolute;
    z-index: ${theme.zIndex.dropdown};
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    font-size: calc(${theme.typography.bodySmall.fontSize} * 0.85);
    line-height: 1;
    top: ${theme.spacing(1)};
    right: calc(${theme.spacing(1)} + var(--button-size, ${theme.spacing(3.5)}) + ${theme.spacing(1)});
    white-space: nowrap;
    pointer-events: all;
  `,
});
