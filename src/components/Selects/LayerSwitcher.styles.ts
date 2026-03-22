import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export const getStyles = (theme: GrafanaTheme2) => ({
  root: css({
    '&.layer-switcher': {
      zIndex: theme.zIndex.dropdown,
      position: 'absolute',
      top: theme.spacing(9),
      left: theme.spacing(1),
      overflow: 'visible',
      pointerEvents: 'all',
    },
    '&.ol-control': {
      padding: 0,
      backgroundColor: 'transparent',
      borderRadius: 'var(--button-corner-radius, 8px)',
    },
    '&.ol-control:hover': {
      backgroundColor: 'transparent',
    },
    '& .panel': {
      margin: `0 0 0 ${theme.spacing(1)}`,
      border: `4px solid ${theme.colors.background.secondary}`,
      borderRadius: '4px',
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.text.primary,
      display: 'none',
      pointerEvents: 'all',
      maxHeight: 'inherit',
      height: '100%',
      boxSizing: 'border-box',
      overflowY: 'auto',
    },
    '& button': {
      width: 'var(--button-size, 28px)',
      height: 'var(--button-size, 28px)',
      boxSizing: 'border-box',
      borderRadius: 'var(--button-corner-radius, 8px)',
      boxShadow: 'var(--button-shadow, 0px 0px 8px 0px rgba(0, 0, 0, 0.25))',
      overflow: 'hidden',
      appearance: 'none',
      backgroundSize: 'var(--button-size, 28px) var(--button-size, 28px)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundColor: theme.colors.background.primary,
      color: theme.colors.getContrastText(theme.colors.background.primary),
      border: `1px solid ${theme.colors.border.weak}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      lineHeight: 1,
      padding: 0,
    },
    '& button:hover, & button:focus': {
      backgroundColor: theme.colors.background.primary,
    },
    '& .layer-switcher-toggle-icon': {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1,
      fontSize: '16px',
      fontWeight: 100,
      letterSpacing: '-2px',
      transformOrigin: 'center',
      color: theme.colors.getContrastText(theme.colors.background.primary),
    },
    '& .layer-switcher-toggle-icon.closed': {
      transform: 'rotate(90deg)',
    },
    '&.shown.ol-control': {
      display: 'flex',
      backgroundColor: 'transparent',
    },
    '&.shown.ol-control:hover': {
      backgroundColor: 'transparent',
    },
    '&.shown .panel': {
      display: 'block',
    },
    '&.shown button': {
      display: 'none',
    },
    '&.shown > div > button': {
      display: 'flex',
      backgroundColor: theme.colors.background.secondary,
      color: theme.colors.getContrastText(theme.colors.background.secondary),
    },
    '&.shown > div > button .layer-switcher-toggle-icon': {
      color: theme.colors.getContrastText(theme.colors.background.secondary),
    },
    '&.shown button:hover, &.shown button:focus': {
      backgroundColor: theme.colors.background.secondary,
    },
    '& ul': {
      listStyle: 'none',
      margin: '1.6em 0.4em',
      paddingLeft: 0,
    },
    '& ul ul': {
      paddingLeft: '1.2em',
      margin: '0.1em 0 0 0',
    },
    '& li': {
      position: 'relative',
      marginTop: '0.3em',
    },
    '& li.group + li.group': {
      marginTop: '0.4em',
    },
    '& li.group > label': {
      fontWeight: 'bold',
    },
    '& li input': {
      position: 'absolute',
      left: '1.2em',
      height: '1em',
      width: '1em',
      fontSize: '1em',
    },
    '& li label': {
      paddingLeft: '2.7em',
      paddingRight: '1.2em',
      display: 'inline-block',
      marginTop: '1px',
    },
    '& li label > select': {
      display: 'inline-block',
      height: '1.4em',
      lineHeight: '1.4em',
      verticalAlign: 'bottom',
    },
    '& .layer-switcher-inline-select': {
      transform: 'translate(5px, -3px)',
      width: 'fit-content',
      maxWidth: '4em',
      outline: 'none',
      WebkitTapHighlightColor: 'transparent',
    },
    '& .layer-switcher-inline-select:focus, & .layer-switcher-inline-select:focus-visible': {
      outline: 'none',
      boxShadow: 'none',
    },
    '& label.disabled': {
      opacity: 0.4,
    },
    '& input': {
      margin: 0,
    },
    '&.touch ::-webkit-scrollbar': {
      width: '4px',
    },
    '&.touch ::-webkit-scrollbar-track': {
      boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
      borderRadius: '10px',
    },
    '&.touch ::-webkit-scrollbar-thumb': {
      borderRadius: '10px',
      boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.5)',
    },
    '& .group button': {
      position: 'absolute',
      left: 0,
      display: 'inline-block',
      width: '1em',
      height: '1em',
      margin: 0,
      backgroundPosition: 'center 2px',
      backgroundRepeat: 'no-repeat',
      backgroundImage:
        "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAW0lEQVR4nGNgGAWMyBwXFxcGBgaGeii3EU0tXHzPnj1wQRYsihqQ+I0ExDEMQAYNONgoAN0AmMkNaDSyQSheY8JiaCMOGzE04zIAmyFYNTMw4A+DRhzsUUBtAADw4BCeIZkGdwAAAABJRU5ErkJggg==')",
      transition: 'transform 0.2s ease-in-out',
    },
    '& .group.layer-switcher-close button': {
      transform: 'rotate(-90deg)',
    },
    '& .group.layer-switcher-fold.layer-switcher-close > ul': {
      overflow: 'hidden',
      height: 0,
    },
  }),
  toggleWrapper: css({
    width: 'var(--button-size, 28px)',
    height: 'var(--button-size, 28px)',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  }),
});
