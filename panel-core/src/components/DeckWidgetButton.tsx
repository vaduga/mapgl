import { _Tooltip } from '@deck.gl/widgets';
import { css } from '@emotion/css';
import { h, render as renderPreact } from 'preact';
import React, { useEffect, useRef } from 'react';
import { getDeckWidgetSkin } from '../render/deck-widget-skin';

const iconPaths = {
  copy: 'M6 6V2h8v8h-4M2 6h8v8H2z',
  'arrow-up': 'M8 13V3M3 8l5-5 5 5',
  'arrow-down': 'M8 3v10M3 8l5 5 5-5',
  'angle-left': 'M10 3L5 8l5 5',
  'angle-right': 'M6 3l5 5-5 5',
};

export type DeckWidgetIcon = keyof typeof iconPaths;

interface DeckWidgetButtonProps {
  icon: DeckWidgetIcon;
  iconSize?: number;
  label: string;
  tooltip?: string;
  className?: string;
  pressed?: boolean;
  onClick(): void;
}

const rootClass = css(getDeckWidgetSkin(), {
  display: 'inline-flex',
  verticalAlign: 'middle',
});
const buttonClass = css({
  position: 'relative',
  zIndex: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--theme-spacing-0-125, 1px)',
  border: '1px solid transparent',
  borderRadius: '50%',
  background: 'transparent',
  color: 'var(--button-icon-idle, rgb(97, 97, 102))',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    zIndex: -1,
    inset: '-4px',
    borderRadius: 'var(--theme-radius-default, 4px)',
    background: 'var(--theme-action-hover, rgba(128, 128, 128, 0.16))',
    opacity: 0,
    '@media (prefers-reduced-motion: no-preference)': {
      transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  '&:hover::before': {
    opacity: 1,
  },
  '&:hover, &:focus-visible': {
    color: 'var(--button-icon-hover, rgb(24, 24, 26))',
  },
  '&:focus-visible': {
    outline: '2px solid var(--theme-accent, #5794f2)',
    outlineOffset: '2px',
  },
  '&[aria-pressed="true"]': {
    borderColor: 'var(--theme-accent-border, #5794f2)',
    background: 'var(--theme-accent, #5794f2)',
    color: 'var(--theme-accent-contrast, #fff)',
  },
  '&[aria-pressed="true"]:hover': {
    background: 'var(--theme-accent-hover, #3274d9)',
  },
});

/** Mount a DeckGL hover hint and accessible SVG button in the React host. */
export function DeckWidgetButton({
  icon,
  iconSize = icon === 'copy' ? 16 : 14,
  label,
  tooltip,
  className = '',
  pressed,
  onClick,
}: DeckWidgetButtonProps) {
  const mountRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) {
      return;
    }
    const button = h(
      'button',
      {
        type: 'button',
        className: `${buttonClass} ${className}`,
        'aria-label': label,
        'aria-pressed': pressed,
        onClick,
      },
      h(
        'svg',
        {
          viewBox: '0 0 16 16',
          width: iconSize,
          height: iconSize,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.5,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: false,
        },
        h('path', { d: iconPaths[icon] })
      )
    );
    renderPreact(h(_Tooltip, { content: tooltip ?? label, children: button }), mount);
  }, [icon, iconSize, label, tooltip, className, pressed, onClick]);

  useEffect(() => {
    const mount = mountRef.current;
    return () => {
      if (mount) {
        renderPreact(null, mount);
      }
    };
  }, []);

  return <span className={rootClass} ref={mountRef} />;
}
