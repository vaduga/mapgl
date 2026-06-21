import { css } from '@emotion/css';
import { css as cssCore } from '@emotion/react';

import { GrafanaTheme2 } from '@grafana/data';

export { getStyles as getSliderStyles };
const getStyles = (theme: GrafanaTheme2, isHorizontal: boolean, hasMarks = false) => {
  const { spacing } = theme;
  const railColor = theme.colors.border.strong;
  const trackColor = theme.colors.primary.main;
  const handleColor = theme.colors.primary.main;
  const blueOpacity = theme.colors.primary.transparent;
  const hoverStyle = `box-shadow: 0px 0px 0px 6px ${blueOpacity}`;

  return {
    container: css({
      width: '100%',
      margin: isHorizontal ? 'inherit' : spacing(1, 3, 1, 1),
      paddingBottom: isHorizontal && hasMarks ? theme.spacing(1) : 'inherit',
      height: isHorizontal ? 'auto' : '100%',
    }),
    // can't write this as an object since it needs to overwrite rc-slider styles
    // object syntax doesn't support kebab case keys
    // eslint-disable-next-line @emotion/syntax-preference
    slider: css`
      .rc-slider {
        position: relative;
        width: 100%;
        height: 14px;
        padding: 5px 0;
        border-radius: 6px;
        touch-action: none;
        box-sizing: border-box;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        display: flex;
        flex-grow: 1;
        /* Half the handle width keeps 0 aligned with the rail start. */
        margin-left: 7px;
      }
      .rc-slider * {
        box-sizing: border-box;
        -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      }
      .rc-slider-rail {
        position: absolute;
        width: 100%;
        height: 4px;
        border-radius: 6px;
        background-color: ${railColor};
        cursor: pointer;
      }
      .rc-slider-track,
      .rc-slider-tracks {
        position: absolute;
        height: 4px;
        border-radius: 6px;
        background-color: ${trackColor};
      }
      .rc-slider-track-draggable {
        z-index: 1;
        box-sizing: content-box;
        background-clip: content-box;
        border-top: 5px solid rgba(0, 0, 0, 0);
        border-bottom: 5px solid rgba(0, 0, 0, 0);
        transform: translateY(-5px);
      }
      .rc-slider-mark {
        top: ${theme.spacing(1.75)};
        position: absolute;
        left: 0;
        width: 100%;
        font-size: 12px;
      }
      .rc-slider-mark-text {
        position: absolute;
        display: inline-block;
        color: ${theme.colors.text.disabled};
        font-size: ${theme.typography.bodySmall.fontSize};
        text-align: center;
        vertical-align: middle;
        cursor: pointer;
      }
      .rc-slider-mark-text-active {
        color: ${theme.colors.text.primary};
      }
      .rc-slider-handle {
        border: none;
        background-color: ${handleColor};
        box-shadow: ${theme.shadows.z1};
        cursor: pointer;
        opacity: 1;
        position: absolute;
        z-index: 1;
        width: 14px;
        height: 14px;
        margin-top: -5px;
        border-radius: 50%;
        user-select: none;
        touch-action: pan-x;
      }

      .rc-slider-handle:hover,
      .rc-slider-handle:active,
      .rc-slider-handle-click-focused:focus {
        ${hoverStyle};
      }

      // The triple class names is needed because that's the specificity used in the source css :(
      .rc-slider-handle-dragging.rc-slider-handle-dragging.rc-slider-handle-dragging,
      .rc-slider-handle:focus-visible {
        box-shadow: 0 0 0 5px ${theme.colors.text.primary};
      }

      .rc-slider-dot,
      .rc-slider-dot-active {
        background-color: ${theme.colors.text.primary};
        border-color: ${theme.colors.text.primary};
      }
      .rc-slider-dot {
        position: absolute;
        bottom: -2px;
        width: 8px;
        height: 8px;
        vertical-align: middle;
        border: 2px solid;
        border-radius: 50%;
        cursor: pointer;
      }
      .rc-slider-step {
        position: absolute;
        width: 100%;
        height: 4px;
        background: transparent;
      }
      .rc-slider-disabled {
        background-color: ${theme.colors.background.secondary};
      }
      .rc-slider-disabled .rc-slider-track {
        background-color: ${theme.colors.border.weak};
      }
      .rc-slider-disabled .rc-slider-handle,
      .rc-slider-disabled .rc-slider-dot {
        background-color: ${theme.colors.background.primary};
        border-color: ${theme.colors.border.weak};
        box-shadow: none;
        cursor: not-allowed;
      }
      .rc-slider-disabled .rc-slider-mark-text,
      .rc-slider-disabled .rc-slider-dot {
        cursor: not-allowed !important;
      }
      .rc-slider-vertical {
        width: 14px;
        height: 100%;
        padding: 0 5px;
      }
      .rc-slider-vertical .rc-slider-rail {
        width: 4px;
        height: 100%;
      }
      .rc-slider-vertical .rc-slider-track {
        bottom: 0;
        left: 5px;
        width: 4px;
      }
      .rc-slider-vertical .rc-slider-track-draggable {
        border-top: 0;
        border-right: 5px solid rgba(0, 0, 0, 0);
        border-bottom: 0;
        border-left: 5px solid rgba(0, 0, 0, 0);
        transform: translateX(-5px);
      }
      .rc-slider-vertical .rc-slider-handle {
        margin-top: 0;
        margin-left: -5px;
        touch-action: pan-y;
      }
      .rc-slider-vertical .rc-slider-mark {
        top: 0;
        left: 18px;
        height: 100%;
      }
      .rc-slider-vertical .rc-slider-step {
        width: 4px;
        height: 100%;
      }
      .rc-slider-vertical .rc-slider-dot {
        margin-left: -2px;
      }
    `,
    /** Global component from @emotion/core doesn't accept computed classname string returned from css from emotion.
     * It accepts object containing the computed name and flattened styles returned from css from @emotion/core
     * */
    tooltip: cssCore`
      body {
        .rc-slider-tooltip {
          cursor: grab;
          user-select: none;
          z-index: ${theme.zIndex.tooltip};
        }

        .rc-slider-tooltip-inner {
          color: ${theme.colors.text.primary};
          background-color: transparent !important;
          border-radius: 0;
          box-shadow: none;
        }

        .rc-slider-tooltip-placement-top .rc-slider-tooltip-arrow {
          display: none;
        }

        .rc-slider-tooltip-placement-top {
          padding: 0;
        }
      }
    `,
    sliderInput: css({
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
    }),
    sliderInputVertical: css({
      flexDirection: 'column',
      height: '100%',

      '.rc-slider': {
        margin: 0,
        order: 2,
      },
    }),
    sliderInputField: css({
      marginLeft: theme.spacing(3),
      input: {
        textAlign: 'center',
      },
    }),
    sliderInputFieldVertical: css({
      margin: `0 0 ${theme.spacing(3)} 0`,
      order: 1,
    }),
  };
};
