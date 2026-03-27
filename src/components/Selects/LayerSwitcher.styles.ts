import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export const getStyles = (theme: GrafanaTheme2) => {
  const buttonSize = theme.spacing(3.5);
  const buttonRadius = theme.shape.radius.default;
  const buttonBorderWidth = theme.spacing(0.125);
  const panelBorderWidth = theme.spacing(0.5);
  const panelRadius = theme.shape.radius.default;
  const compactSpacing = theme.spacing(0.75);
  const microSpacing = theme.spacing(0.125);
  const nestedIndent = theme.spacing(1.5);
  const checkboxLabelGap = theme.spacing(0.75);
  const labelLeftPadding = theme.spacing(3.375);
  const inlineSelectOffsetX = theme.spacing(0.625);
  const inlineSelectOffsetY = theme.spacing(0.375);
  const scrollbarSize = theme.spacing(0.5);
  const scrollbarRadius = theme.shape.radius.default;
  const toggleButtonFontSize = theme.typography.h4.fontSize;
  const toggleIconFontSize = theme.typography.h5.fontSize;
  const groupButtonFontSize = theme.typography.bodySmall.fontSize;
  const groupButtonSize = theme.typography.body.fontSize;

  return {
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
        borderRadius: `var(--button-corner-radius, ${buttonRadius})`,
      },
      '&.ol-control:hover': {
        backgroundColor: 'transparent',
      },
      '& .panel': {
        margin: `0 0 0 ${theme.spacing(1)}`,
        border: `${panelBorderWidth} solid ${theme.colors.background.secondary}`,
        borderRadius: panelRadius,
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
        width: `var(--button-size, ${buttonSize})`,
        height: `var(--button-size, ${buttonSize})`,
        boxSizing: 'border-box',
        borderRadius: `var(--button-corner-radius, ${buttonRadius})`,
        boxShadow: `var(--button-shadow, ${theme.shadows.z2})`,
        overflow: 'hidden',
        appearance: 'none',
        backgroundSize: `var(--button-size, ${buttonSize}) var(--button-size, ${buttonSize})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundColor: theme.colors.background.primary,
        color: theme.colors.getContrastText(theme.colors.background.primary),
        border: `${buttonBorderWidth} solid ${theme.colors.border.weak}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: toggleButtonFontSize,
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
        fontSize: toggleIconFontSize,
        fontWeight: 100,
        letterSpacing: '-0.125em',
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
        margin: `${theme.spacing(2)} ${compactSpacing}`,
        paddingLeft: 0,
      },
      '& ul ul': {
        paddingLeft: nestedIndent,
        margin: `${microSpacing} 0 0 0`,
      },
      '& li': {
        position: 'relative',
        marginTop: theme.spacing(0.375),
      },
      '& li.group + li.group': {
        marginTop: compactSpacing,
      },
      '& li.group > label': {
        fontWeight: 'bold',
      },
      '& li input': {
        position: 'absolute',
        left: nestedIndent,
        height: theme.typography.body.fontSize,
        width: theme.typography.body.fontSize,
        fontSize: theme.typography.body.fontSize,
        accentColor: theme.colors.primary.main,
      },
      '& li label': {
        paddingLeft: `calc(${labelLeftPadding} + ${checkboxLabelGap})`,
        paddingRight: nestedIndent,
        display: 'inline-block',
        marginTop: microSpacing,
      },
      '& li label > select': {
        display: 'inline-block',
        height: theme.spacing(1.75),
        lineHeight: theme.spacing(1.75),
        verticalAlign: 'bottom',
      },
      '& .layer-switcher-inline-select': {
        transform: `translate(${inlineSelectOffsetX}, -${inlineSelectOffsetY})`,
        width: 'fit-content',
        maxWidth: theme.spacing(5),
        outline: 'none',
        WebkitTapHighlightColor: 'transparent',
      },
      '& .layer-switcher-cluster-select': {
        height: theme.spacing(2.5),
        lineHeight: theme.spacing(2.5),
        minWidth: theme.spacing(4),
        fontSize: theme.typography.bodySmall.fontSize,
        padding: `0 ${theme.spacing(0.5)}`,
        verticalAlign: 'middle',
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
        width: scrollbarSize,
      },
      '&.touch ::-webkit-scrollbar-track': {
        backgroundColor: theme.colors.background.secondary,
        borderRadius: scrollbarRadius,
      },
      '&.touch ::-webkit-scrollbar-thumb': {
        borderRadius: scrollbarRadius,
        backgroundColor: theme.colors.border.weak,
      },
      '& .group button': {
        position: 'absolute',
        left: 0,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: groupButtonSize,
        height: groupButtonSize,
        margin: 0,
        padding: 0,
        borderRadius: 0,
        border: 'none',
        boxShadow: 'none',
        background: theme.colors.background.primary,
        color: theme.colors.getContrastText(theme.colors.background.primary),
        fontSize: groupButtonFontSize,
        lineHeight: 1,
      },
      '& .group button:hover, & .group button:focus': {
        background: theme.colors.background.primary,
      },
      '& .layer-switcher-group-icon': {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.colors.getContrastText(theme.colors.background.primary),
        fontSize: theme.typography.body.fontSize,
        lineHeight: 1,
        fontWeight: 400,
        transformOrigin: 'center',
        transition: 'transform 0.2s ease-in-out',
      },
      '& .layer-switcher-close > button .layer-switcher-group-icon': {
        transform: 'rotate(0deg)',
      },
      '& .layer-switcher-open > button .layer-switcher-group-icon': {
        transform: 'rotate(90deg)',
      },
      '& .group.layer-switcher-fold.layer-switcher-close > ul': {
        overflow: 'hidden',
        height: 0,
      },
    }),
    toggleWrapper: css({
      width: `var(--button-size, ${buttonSize})`,
      height: `var(--button-size, ${buttonSize})`,
      display: 'flex',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    }),
  };
};
