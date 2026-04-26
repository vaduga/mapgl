import { getStyles } from './LayerSwitcher.styles';
import React, { useEffect, useState, useRef } from 'react';
import { colTypes } from 'mapLib/utils';
import { MapPanel } from '../../MapPanel';
import { useStyles2 } from '@grafana/ui';
import type { LayerTreeInfo } from '../../store/visLayer';

const CSS_PREFIX = 'layer-switcher-';

const LayerSwitcher = (props) => {
  const { label, className, panel: geomap, setVisRefresh } = props;
  const { visLayers } = geomap;
  const styles = useStyles2(getStyles);

  const [panelVisible, setPanelVisible] = useState(false);
  const elementRef = useRef(null);
  const panelRef = useRef(null);

  const hiddenClassName = `ol-control yo layer-switcher${LayerSwitcher.isTouchDevice_() ? ' touch' : ''}`;

  const togglePanel = () => {
    setPanelVisible(!panelVisible);
  };

  const renderPanel = () => {
    const panel = panelRef.current;
    if (!panel) {
      return;
    }
    LayerSwitcher.renderPanel(geomap, setVisRefresh, panel, {
      groupSelectStyle: 'group', /// 'children'
      reverse: false,
    });
  };

  useEffect(() => {
    if (panelVisible) {
      renderPanel();
    }
  }, [panelVisible, visLayers]);

  return (
    <div ref={elementRef} className={`${styles.root} ${hiddenClassName} ${panelVisible ? 'shown' : ''} ${className}`}>
      <div className={styles.toggleWrapper}>
        <button title={panelVisible ? 'collapse' : label} onClick={togglePanel}>
          <span className={`layer-switcher-toggle-icon ${panelVisible ? 'open' : 'closed'}`}>››</span>
        </button>
      </div>
      {panelVisible && <div ref={panelRef} className="panel"></div>}
    </div>
  );
};

LayerSwitcher.isTouchDevice_ = () => {
  try {
    document.createEvent('TouchEvent');
    return true;
  } catch (e) {
    return false;
  }
};

LayerSwitcher.renderPanel = (geomap: MapPanel, setVisRefresh, panel, options) => {
  const render_event = new Event('render');
  panel.dispatchEvent(render_event);
  options = options || {};

  while (panel.firstChild) {
    panel.removeChild(panel.firstChild);
  }

  if (options.groupSelectStyle === 'children' || options.groupSelectStyle === 'none') {
    geomap.visLayers!.setGroupVisibility();
  } else if (options.groupSelectStyle === 'group') {
    geomap.visLayers!.setChildVisibility();
  }

  const ul = document.createElement('ul');
  panel.appendChild(ul);

  const layers = geomap.visLayers!.getLayerTree();

  LayerSwitcher.renderLayers_(layers, geomap, setVisRefresh, ul, options, function render(_changedLyr) {
    LayerSwitcher.renderPanel(geomap, setVisRefresh, panel, options);
  });

  // const rendercomplete_event = new Event('rendercomplete');
  // panel.dispatchEvent(rendercomplete_event);
};

LayerSwitcher.renderLayer_ = (geomap, setVisRefresh, lyr: LayerTreeInfo, idx, options, render, depth = 0) => {
  const li = document.createElement('li');
  const { label: lyrLabel } = lyr || {};
  const checkboxId = LayerSwitcher.uuid();
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
    colTypes.Hyperedges,
  ];

  if (lyr.group && hasChildren && !lyr.combine) {
    const hasGraph = geomap.visLayers.hasGraph();

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
          LayerSwitcher.toggleFold_(lyr, li, geomap.visLayers);
          evt.preventDefault();
        };
        li.appendChild(btn);
      }

      if (options.groupSelectStyle !== 'none') {
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = checkboxId;
        input.checked = lyr.visible; //.getVisible;
        input.indeterminate = lyr.indeterminate ?? false;
        input.onchange = function (e) {
          const target = e.target as HTMLInputElement;
          LayerSwitcher.setVisible_(geomap, lyr, idx, target?.checked, options.groupSelectStyle);
          setVisRefresh(Math.random() + 1);
          render(lyr);
        };
        li.appendChild(input);

        label.htmlFor = checkboxId;
      }

      label.textContent = lyrLabel;
      li.appendChild(label);

      const ul = document.createElement('ul');
      li.appendChild(ul);
      LayerSwitcher.renderLayers_(lyr.children, geomap, setVisRefresh, ul, options, render, depth + 1);
    }
  } else {
    li.className = 'layer';
    const input = document.createElement('input');
    input.type = 'checkbox';

    input.id = checkboxId;
    input.checked = lyr.visible; //getVisible;
    input.indeterminate = lyr.indeterminate ?? false;
    input.onchange = function (e) {
      const target = e.target as HTMLInputElement;
      LayerSwitcher.setVisible_(geomap, lyr, idx, target.checked, options.groupSelectStyle);
      setVisRefresh(Math.random() + 1);
      render(lyr);
    };
    li.appendChild(input);

    label.htmlFor = checkboxId;
    label.textContent = lyrLabel; //lyrName;
    li.appendChild(label);
  }

  return li;
};

LayerSwitcher.renderLayers_ = (layers: LayerTreeInfo[], geomap, setVisRefresh, elm, options, render, depth = 0) => {
  let children = [...layers];
  if (options.reverse) {
    children.reverse();
  }

  for (let i = 0, l: LayerTreeInfo; i < children.length; i++) {
    l = children[i];
    if (l.name) {
      elm.appendChild(LayerSwitcher.renderLayer_(geomap, setVisRefresh, l, i, options, render, depth));
    }
  }
};

LayerSwitcher.setVisible_ = (geomap, lyr, index, visible, groupSelectStyle) => {
  const { visLayers } = geomap as MapPanel;

  visLayers!.setVisible(lyr.index, lyr.name, lyr.group, visible); /// lyr.name, lyr.group,

  if (lyr.group && !lyr.combine && groupSelectStyle === 'children') {
    lyr.children.forEach((l, i) => {
      LayerSwitcher.setVisible_(geomap, l, i, visible, groupSelectStyle);
    });
  }
};

LayerSwitcher.uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

LayerSwitcher.toggleFold_ = (lyr, li, visLayers) => {
  li.classList.remove(CSS_PREFIX + (lyr.fold ? 'close' : 'open'));
  const nextFold = !lyr.fold;
  lyr.fold = nextFold;
  li.classList.add(CSS_PREFIX + (nextFold ? 'close' : 'open'));
  visLayers.setFold(lyr.index, nextFold);
};

export default LayerSwitcher;
