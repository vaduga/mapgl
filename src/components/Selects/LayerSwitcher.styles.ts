import { css } from '@emotion/css';

export const layerSwitcherRoot = css`
  /* ===== Root ===== */
  &.layer-switcher {
    z-index: 3;
    position: absolute;
    top: 100px;
    left: 10px;
    overflow: hidden;
    pointer-events: all;
  }

  /* ===== Panel ===== */
  & .panel {
    margin: 0;
    border: 4px solid #eee;
    border-radius: 4px;
    background-color: white;
    display: none;
    pointer-events: all;
    max-height: inherit;
    height: 100%;
    box-sizing: border-box;
    overflow-y: auto;
  }

  /* ===== Main toggle button ===== */
  & button {
    float: right;
    z-index: 1;
    width: 38px;
    height: 38px;
    background-repeat: no-repeat;
    background-position: 2px;
    background-color: white;
    color: black;
    border: none;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAACE1BMVEX///8A//8AgICA//8AVVVAQID///8rVVVJtttgv98nTmJ2xNgkW1ttyNsmWWZmzNZYxM4gWGgeU2JmzNNr0N1Rwc0eU2VXxdEhV2JqytQeVmMhVmNoydUfVGUgVGQfVGQfVmVqy9hqy9dWw9AfVWRpydVry9YhVmMgVGNUw9BrytchVWRexdGw294gVWQgVmUhVWPd4N6HoaZsy9cfVmQgVGRrytZsy9cgVWQgVWMgVWRsy9YfVWNsy9YgVWVty9YgVWVry9UgVWRsy9Zsy9UfVWRsy9YgVWVty9YgVWRty9Vsy9aM09sgVWRTws/AzM0gVWRtzNYgVWRuy9Zsy9cgVWRGcHxty9bb5ORbxdEgVWRty9bn6OZTws9mydRfxtLX3Nva5eRix9NFcXxOd4JPeINQeIMiVmVUws9Vws9Vw9BXw9BYxNBaxNBbxNBcxdJexdElWWgmWmhjyNRlx9IqXGtoipNpytVqytVryNNrytZsjZUuX210k5t1y9R2zNR3y9V4lp57zth9zdaAnKOGoaeK0NiNpquV09mesrag1tuitbmj1tuj19uktrqr2d2svcCu2d2xwMO63N+7x8nA3uDC3uDFz9DK4eHL4eLN4eIyYnDX5OM5Z3Tb397e4uDf4uHf5uXi5ePi5+Xj5+Xk5+Xm5+Xm6OY6aHXQ19fT4+NfhI1Ww89gx9Nhx9Nsy9ZWw9Dpj2abAAAAWnRSTlMAAQICAwQEBgcIDQ0ODhQZGiAiIyYpKywvNTs+QklPUlNUWWJjaGt0dnd+hIWFh4mNjZCSm6CpsbW2t7nDzNDT1dje5efr7PHy9PT29/j4+Pn5+vr8/f39/f6DPtKwAAABTklEQVR4Xr3QVWPbMBSAUTVFZmZmhhSXMjNvkhwqMzMzMzPDeD+xASvObKePPa+ffHVl8PlsnE0+qPpBuQjVJjno6pZpSKXYl7/bZyFaQxhf98hHDKEppwdWIW1frFnrxSOWHFfWesSEWC6R/P4zOFrix3TzDFLlXRTR8c0fEEJ1/itpo7SVO9Jdr1DVxZ0USyjZsEY5vZfiiAC0UoTGOrm9PZLuRl8X+Dq1HQtoFbJZbv61i+Poblh/97TC7n0neCcK0ETNUrz1/xPHf+DNAW9Ac6t8O8WH3Vp98f5lCaYKAOFZMLyHL4Y0fe319idMNgMMp+zWVSybUed/+/h7I4wRAG1W6XDy4XmjR9HnzvDRZXUAYDFOhC1S/Hh+fIXxen+eO+AKqbs+wAo30zDTDvDxKoJN88sjUzDFAvBzEUGFsnADoIvAJzoh2BZ8sner+Ke/vwECuQAAAABJRU5ErkJggg==')
    /*logo.png*/;
  }

  & button:hover,
  & button:focus {
    background-color: white;
  }

  /* ===== Shown state ===== */
  &.shown.ol-control {
    display: flex;
    background-color: transparent;
  }

  &.shown.ol-control:hover {
    background-color: transparent;
  }

  &.shown .panel {
    display: block;
  }

  &.shown button {
    display: none;
  }

  &.shown > div > button {
    display: block;
    background-image: unset;
    background-color: #eee;
  }

  &.shown button:hover,
  &.shown button:focus {
    background-color: #fafafa;
  }

  /* ===== Lists ===== */
  & ul {
    list-style: none;
    margin: 1.6em 0.4em;
    padding-left: 0;
  }

  & ul ul {
    padding-left: 1.2em;
    margin: 0.1em 0 0 0;
  }

  /* ===== List items ===== */
  & li {
    position: relative;
    margin-top: 0.3em;
  }

  & li.group + li.group {
    margin-top: 0.4em;
  }

  & li.group > label {
    font-weight: bold;
  }

  & li input {
    position: absolute;
    left: 1.2em;
    height: 1em;
    width: 1em;
    font-size: 1em;
  }

  & li label {
    padding-left: 2.7em;
    padding-right: 1.2em;
    display: inline-block;
    margin-top: 1px;
  }

  & li label > select {
    display: inline-block;
    height: 1.4em;
    line-height: 1.4em;
    vertical-align: bottom;
  }

  /* ===== Inline select ===== */
  & .layer-switcher-inline-select {
    transform: translate(5px, -3px);
    width: fit-content;
    max-width: 4em;
    outline: none;
    -webkit-tap-highlight-color: transparent;
  }

  & .layer-switcher-inline-select:focus,
  & .layer-switcher-inline-select:focus-visible {
    outline: none;
    box-shadow: none;
  }

  /* ===== Disabled ===== */
  & label.disabled {
    opacity: 0.4;
  }

  & input {
    margin: 0;
  }

  /* ===== Touch scrollbars ===== */
  &.touch ::-webkit-scrollbar {
    width: 4px;
  }

  &.touch ::-webkit-scrollbar-track {
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
    border-radius: 10px;
  }

  &.touch ::-webkit-scrollbar-thumb {
    border-radius: 10px;
    box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
  }

  /* ===== Group fold button ===== */
  & .group button {
    position: absolute;
    left: 0;
    display: inline-block;
    width: 1em;
    height: 1em;
    margin: 0;
    background-position: center 2px;
    background-repeat: no-repeat;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAW0lEQVR4nGNgGAWMyBwXFxcGBgaGeii3EU0tXHzPnj1wQRYsihqQ+I0ExDEMQAYNONgoAN0AmMkNaDSyQSheY8JiaCMOGzE04zIAmyFYNTMw4A+DRhzsUUBtAADw4BCeIZkGdwAAAABJRU5ErkJggg==');
    transition: transform 0.2s ease-in-out;
  }

  & .group.layer-switcher-close button {
    transform: rotate(-90deg);
  }

  & .group.layer-switcher-fold.layer-switcher-close > ul {
    overflow: hidden;
    height: 0;
  }
`;
