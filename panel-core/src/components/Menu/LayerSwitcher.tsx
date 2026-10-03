import { _Tooltip } from '@deck.gl/widgets';
import { h, render as renderPreact } from 'preact';
import React, { useEffect, useRef, useState } from 'react';

import type { LayerTreeInfo, VisLayers } from '../../store';
import { type ComFeature, colTypes } from '../../types';

import { getStyles } from './LayerSwitcher.styles';

const CSS_PREFIX = 'layer-switcher-';

export interface LayerSwitcherBindings {
  readonly visibility: VisLayers;
  readonly readComments: () => readonly ComFeature[];
  setVisibility(layer: LayerTreeInfo, visible: boolean, style: RenderOptions['groupSelectStyle']): void;
}

export interface LayerSwitcherInlineControlContext {
  bindings: LayerSwitcherBindings;
  layer: LayerTreeInfo;
  depth: number;
  requestRefresh(): void;
  requestRender(): void;
}

export interface LayerSwitcherInlineControl {
  id: string;
  shouldRender?: (context: LayerSwitcherInlineControlContext) => boolean;
  render: (context: LayerSwitcherInlineControlContext) => HTMLElement | null;
}

export interface LayerSwitcherProps {
  label: string;
  className?: string;
  bindings: LayerSwitcherBindings;
  commentFeatures?: readonly ComFeature[];
  onRefresh?: () => void;
  inlineControls?: LayerSwitcherInlineControl[];
}

interface RenderOptions {
  groupSelectStyle: 'group' | 'children' | 'none';
  reverse: boolean;
}

interface RenderContext {
  bindings: LayerSwitcherBindings;
  commentFeatures?: readonly ComFeature[];
  onRefresh?: () => void;
  inlineControls: LayerSwitcherInlineControl[];
}

const defaultOptions: RenderOptions = {
  groupSelectStyle: 'group',
  reverse: false,
};

const LayerSwitcher = ({
  label,
  className = '',
  bindings,
  commentFeatures,
  onRefresh,
  inlineControls = [],
}: LayerSwitcherProps) => {
  const visLayers = bindings.visibility;
  const styles = getStyles();

  const [panelVisible, setPanelVisible] = useState(false);
  const toggleContentRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const hiddenClassName = `ol-control yo layer-switcher${isTouchDevice() ? ' touch' : ''}`;

  useEffect(() => {
    const mount = toggleContentRef.current;
    if (!mount) {
      return;
    }

    const button = h(
      'button',
      {
        className: `${styles.toggleButton} ${panelVisible ? styles.toggleButtonOpen : ''}`,
        type: 'button',
        'aria-label': label,
        'aria-expanded': panelVisible,
        onClick: () => setPanelVisible((visible) => !visible),
      },
      h('span', { className: `${styles.toggleIcon} ${panelVisible ? '' : styles.toggleIconClosed}` }, '››')
    );
    renderPreact(h(_Tooltip, { content: label, children: button }), mount);

    return () => renderPreact(null, mount);
  }, [label, panelVisible, styles.toggleButton, styles.toggleButtonOpen, styles.toggleIcon, styles.toggleIconClosed]);

  const renderPanel = () => {
    const panelElement = panelRef.current;
    if (!panelElement) {
      return;
    }
    renderLayerSwitcherBindings(
      {
        bindings,
        commentFeatures,
        onRefresh,
        inlineControls,
      },
      panelElement,
      defaultOptions
    );
  };

  useEffect(() => {
    if (panelVisible) {
      renderPanel();
    }
  }, [panelVisible, visLayers, inlineControls]);

  return (
    <div className={[styles.root, hiddenClassName, panelVisible ? 'shown' : '', className].filter(Boolean).join(' ')}>
      <div className="deck-widget-button">
        <div className={styles.toggleContent} ref={toggleContentRef} />
      </div>
      {panelVisible && (
        <div ref={panelRef} className="bindings" onPointerDown={(event) => event.stopPropagation()}></div>
      )}
    </div>
  );
};

function isTouchDevice() {
  try {
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
}

function renderLayerSwitcherBindings(context: RenderContext, panelElement: HTMLElement, options: RenderOptions) {
  const renderEvent = new Event('render');
  panelElement.dispatchEvent(renderEvent);

  while (panelElement.firstChild) {
    panelElement.removeChild(panelElement.firstChild);
  }

  const visLayers = context.bindings.visibility;
  if (!visLayers) {
    return;
  }

  if (options.groupSelectStyle === 'children' || options.groupSelectStyle === 'none') {
    visLayers.setGroupVisibility();
  } else if (options.groupSelectStyle === 'group') {
    visLayers.setChildVisibility();
  }

  const ul = document.createElement('ul');
  panelElement.appendChild(ul);

  const layers = visLayers.getLayerTree();
  renderLayers(layers, context, ul, options, function render() {
    renderLayerSwitcherBindings(context, panelElement, options);
  });
}

function renderLayer(
  context: RenderContext,
  lyr: LayerTreeInfo,
  idx: number,
  options: RenderOptions,
  render: (changedLayer: LayerTreeInfo) => void,
  depth = 0
) {
  const li = document.createElement('li');
  const { label: lyrLabel } = lyr || {};
  const checkboxId = uuid();
  const label = document.createElement('label');
  const hasChildren = lyr.children.length > 0;

  const serviceGroups = [
    'graph',
    colTypes.Clusters,
    colTypes.Circle,
    colTypes.SVG,
    colTypes.Label,
    colTypes.Comments,
    colTypes.Edges,
    colTypes.Routed,
  ];

  if (lyr.group && (hasChildren || lyr.group === colTypes.Clusters) && !lyr.combine) {
    const hasGraph = context.bindings.visibility?.hasGraph() ?? false;

    if (!serviceGroups.includes(lyr.group) || hasGraph) {
      if (!serviceGroups.includes(lyr.group) || lyr.group === 'graph') {
        li.classList.add('group');
      }

      if (depth > 0 && typeof lyr.fold === 'boolean') {
        li.classList.add(CSS_PREFIX + 'fold');
        li.classList.add(CSS_PREFIX + (lyr.fold ? 'close' : 'open'));
        const btn = document.createElement('button');
        const icon = document.createElement('span');
        icon.className = 'layer-switcher-group-icon';
        icon.textContent = '>';
        btn.appendChild(icon);
        btn.onclick = function (e) {
          const evt = e || window.event;
          toggleFold(lyr, li, context.bindings.visibility);
          evt.preventDefault();
        };
        li.appendChild(btn);
      }

      if (options.groupSelectStyle !== 'none') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = checkboxId;
        input.checked = lyr.visible;
        input.indeterminate = lyr.indeterminate ?? false;
        input.onchange = function (e) {
          const target = e.target as HTMLInputElement;
          setVisible(context.bindings, lyr, target?.checked, options.groupSelectStyle);
          context.onRefresh?.();
          render(lyr);
        };
        li.appendChild(input);

        label.htmlFor = checkboxId;
      }

      label.textContent = lyrLabel;
      appendInlineControls(context, label, lyr, depth, render);
      li.appendChild(label);

      const ul = document.createElement('ul');
      li.appendChild(ul);
      renderLayers(lyr.children, context, ul, options, render, depth + 1);
    }
  } else {
    li.className = 'layer';
    const input = document.createElement('input');
    input.type = 'checkbox';

    input.id = checkboxId;
    input.checked = lyr.visible;
    input.indeterminate = lyr.indeterminate ?? false;
    input.onchange = function (e) {
      const target = e.target as HTMLInputElement;
      setVisible(context.bindings, lyr, target.checked, options.groupSelectStyle);
      context.onRefresh?.();
      render(lyr);
    };
    li.appendChild(input);

    label.htmlFor = checkboxId;
    label.textContent = lyrLabel;
    appendInlineControls(context, label, lyr, depth, render);
    li.appendChild(label);
  }

  return li;
}

function appendInlineControls(
  context: RenderContext,
  label: HTMLLabelElement,
  layer: LayerTreeInfo,
  depth: number,
  render: (changedLayer: LayerTreeInfo) => void
) {
  const controlContext: LayerSwitcherInlineControlContext = {
    bindings: context.bindings,
    layer,
    depth,
    requestRefresh: () => context.onRefresh?.(),
    requestRender: () => render(layer),
  };

  for (const control of context.inlineControls) {
    if (control.shouldRender && !control.shouldRender(controlContext)) {
      continue;
    }

    const element = control.render(controlContext);
    if (element) {
      label.appendChild(element);
    }
  }
}

function renderLayers(
  layers: LayerTreeInfo[],
  context: RenderContext,
  elm: HTMLElement,
  options: RenderOptions,
  render: (changedLayer: LayerTreeInfo) => void,
  depth = 0
) {
  let children = [...layers];
  if (options.reverse) {
    children.reverse();
  }

  const hasComments = Boolean((context.commentFeatures ?? context.bindings.readComments())?.length);
  for (let i = 0, l: LayerTreeInfo; i < children.length; i++) {
    l = children[i];
    if (l.name && (l.group !== colTypes.Comments || hasComments)) {
      elm.appendChild(renderLayer(context, l, i, options, render, depth));
    }
  }
}

function setVisible(
  bindings: LayerSwitcherBindings,
  layer: LayerTreeInfo,
  visible: boolean,
  style: RenderOptions['groupSelectStyle']
) {
  bindings.setVisibility(layer, visible, style);
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function toggleFold(lyr: LayerTreeInfo, li: HTMLLIElement, visLayers?: VisLayers) {
  li.classList.remove(CSS_PREFIX + (lyr.fold ? 'close' : 'open'));
  const nextFold = !lyr.fold;
  lyr.fold = nextFold;
  li.classList.add(CSS_PREFIX + (nextFold ? 'close' : 'open'));
  visLayers?.setFold(lyr.index, nextFold);
}

export default LayerSwitcher;
