import { GrafanaTheme2 } from '@grafana/data';

const fullscreenEnter =
    "url(\"data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2028%2028'%20xmlns%3D'http://www.w3.org/2000/svg'%3E%3Cpath%20fill%3D'black'%20d%3D'M8%2020h3v2H7a1%201%200%200%201-1-1v-4h2v3zm0-12v3H6V7a1%201%200%200%201%201-1h4v2H8zm12%2012v-3h2v4a1%201%200%200%201-1%201h-4v-2h3zM20%208h-3V6h4a1%201%200%200%201%201%201v4h-2V8z'/%3E%3C/svg%3E\")";

const fullscreenExit =
    "url(\"data:image/svg+xml,%3Csvg%20viewBox%3D'0%200%2028%2028'%20xmlns%3D'http://www.w3.org/2000/svg'%3E%3Cpath%20fill%3D'black'%20d%3D'M10%2018H6v-2h4a1%201%200%200%201%201%201v4h-2v-3zm8%200v3h-2v-4a1%201%200%200%201%201-1h4v2h-3zM10%2010V7h2v4a1%201%200%200%201-1%201H6v-2h4zm8%200h3v2h-4a1%201%200%200%201-1-1V7h2v3z'/%3E%3C/svg%3E\")";

export const getDeckWidgetSkin = (theme: GrafanaTheme2) => {
  const widgetMargin = theme.spacing(1.5);
  const buttonSize = theme.spacing(3.5);
  const buttonRadius = theme.shape.radius.default;
  const innerBorderWidth = theme.spacing(0.125);
  const innerButtonSize = `calc(var(--button-size, ${buttonSize}) - ${theme.spacing(0.25)})`;
  const innerButtonRadius = `calc(var(--button-corner-radius, ${buttonRadius}) - ${innerBorderWidth})`;

  return `
  margin: var(--widget-margin, ${widgetMargin});

  /* Button containers */
  .deck-widget-button,
  .deck-widget-button-group {
    background: var(--button-stroke, ${theme.colors.background.secondary});
    border-radius: var(--button-corner-radius, ${buttonRadius});
    box-shadow: var(--button-shadow, ${theme.shadows.z2});
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .deck-widget-button {
    width: var(--button-size, ${buttonSize});
    height: var(--button-size, ${buttonSize});
  }

  .deck-widget-button button {
    width: ${innerButtonSize};
    height: ${innerButtonSize};
    box-sizing: border-box;
    background: var(--button-background, ${theme.colors.background.primary});
    backdrop-filter: var(--button-backdrop-filter, unset);
    border: var(--button-inner-stroke, ${innerBorderWidth} solid ${theme.colors.border.weak});
    border-radius: ${innerButtonRadius};
    
    pointer-events: auto;
    cursor: pointer;
    outline: none;
    padding: 0;
  }

  button .deck-widget-icon {
    background-color: var(--button-icon-idle, ${theme.colors.text.secondary});
    background-position: 50%;
    background-repeat: no-repeat;
    display: block;
    height: 100%;
    width: 100%;
  }

  button .deck-widget-icon:hover {
    background-color: var(--button-icon-hover, ${theme.colors.text.primary});
  }

  /* -------- FIXED FULLSCREEN ICON -------- */

  &.deck-widget-fullscreen
  .deck-widget-button
  button.deck-widget-fullscreen-enter
  .deck-widget-icon {
  mask: ${fullscreenEnter} center / contain no-repeat;
  -webkit-mask: ${fullscreenEnter} center / contain no-repeat;
}

&.deck-widget-fullscreen
  .deck-widget-button
  button.deck-widget-fullscreen-exit
  .deck-widget-icon {
  mask: ${fullscreenExit} center / contain no-repeat;
  -webkit-mask: ${fullscreenExit} center / contain no-repeat;
}

  /* pseudo fullscreen container */
  .deck-pseudo-fullscreen {
    height: 100% !important;
    left: 0 !important;
    position: fixed !important;
    top: 0 !important;
    width: 100% !important;
    z-index: ${theme.zIndex.portal};
  }
`;
};
