import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';

export const getStyles = (theme: GrafanaTheme2, isHorizontal: boolean, hasMarks = false) => {
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

        // main slider container
        slider: css`
      width: 100%;

      .rc-slider {
        display: flex;
        flex-grow: 1;
        margin-left: 7px; /* half handle size to align 0 value */
      }

      .rc-slider-mark {
        top: ${theme.spacing(1.75)};
      }

      .rc-slider-mark-text {
        color: ${theme.colors.text.disabled};
        font-size: ${theme.typography.bodySmall.fontSize};
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
      }

      .rc-slider-handle:hover,
      .rc-slider-handle:active,
      .rc-slider-handle-click-focused:focus {
        ${hoverStyle};
      }

      .rc-slider-handle-dragging.rc-slider-handle-dragging.rc-slider-handle-dragging,
      .rc-slider-handle:focus-visible {
        box-shadow: 0 0 0 5px ${theme.colors.text.primary};
      }

      .rc-slider-dot,
      .rc-slider-dot-active {
        background-color: ${theme.colors.text.primary};
        border-color: ${theme.colors.text.primary};
      }

      .rc-slider-track {
        background-color: ${trackColor};
      }

      .rc-slider-rail {
        background-color: ${railColor};
        cursor: pointer;
      }

      /* tooltip scoped to container instead of global body */
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
            width: '60px',
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
