import { layerSwitcherRoot } from './LayerSwitcher.styles';
import React, { useEffect, useState, useRef } from 'react';
import {VisLayer} from "./VisLayer";
import { Graph } from 'mapLib';
import {colTypes} from "mapLib/utils";
import {GeomapPanel} from "../../GeomapPanel";

const CSS_PREFIX = 'layer-switcher-';

const LayerSwitcher = (props) => {
    const { theme, label, className, panel: geomap, setVisRefresh, setMobxLegendRefresh, setClusterMaxZoom} = props;
    const {visLayers} = geomap

    const [panelVisible, setPanelVisible] = useState(false);
    const elementRef = useRef(null);
    const panelRef = useRef(null);

    const hiddenClassName =
        `ol-control yo layer-switcher${LayerSwitcher.isTouchDevice_() ? ' touch' : ''}`;

    const shownClassName = 'shown';

    useEffect(() => {
        if (panelVisible) {
            renderPanel();
        }
    }, [panelVisible, visLayers]);

    const togglePanel = () => {
        setPanelVisible(!panelVisible);
    };

    const renderPanel = () => {
        const panel = panelRef.current;
        if (!panel) return;
        LayerSwitcher.renderPanel(geomap, setVisRefresh, setMobxLegendRefresh, panel, {
            groupSelectStyle: 'group', /// 'children'
            reverse: false
        });
    };

    return (
        <div
            ref={elementRef}
            className={`${layerSwitcherRoot} ${hiddenClassName} ${panelVisible ? 'shown' : ''} ${className}`}
        >
                <div style={{width: '38px', height: '38px'}} >
                <button
                    title={panelVisible ? 'collapse' : label}
                    onClick={togglePanel}
                    style={{
                        backgroundColor: theme.colors.background.primary,
                        color: theme.colors.getContrastText(theme.colors.background.primary)
                    }}
                >
                    {panelVisible && '»'}
                    </button>
            </div>
            {panelVisible && (
                <div
                    ref={panelRef}
                    className="panel"
                    style={{
                        background: theme.colors.background.primary,
                        color: theme.colors.getContrastText(theme.colors.background.primary),
                        border: `4px solid ${theme.colors.background.secondary}`
                    }}
                ></div>
            )}
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

LayerSwitcher.renderPanel = (geomap: GeomapPanel, setVisRefresh, setMobxLegendRefresh, panel, options) => {
    const render_event = new Event('render');
    panel.dispatchEvent(render_event);
    options = options || {};

    while (panel.firstChild) {
        panel.removeChild(panel.firstChild);
    }

    if (options.groupSelectStyle === 'children' || options.groupSelectStyle === 'none') {
        geomap.visLayers!.setGroupVisibility()
    } else if (options.groupSelectStyle === 'group') {
        geomap.visLayers!.setChildVisibility()
    }

    const ul = document.createElement('ul');
    panel.appendChild(ul);

    const {topLevel, children: ch} = geomap.visLayers!.getLayersWithChildren()


    const vl: VisLayer[] = []

    topLevel?.forEach((layerInfo, i) => {
        const childInfos = ch?.[i] ?? [];

        // Build a map: name => VisLayer instance
        const nameToLayer = new Map<string, VisLayer>();
        for (const info of childInfos) {
            // @ts-ignore
            info.fold = info.fold ? 'close' : 'open';
            // @ts-ignore
            nameToLayer.set(info.name, new VisLayer(info));
        }

        // Assign children recursively based on dot-separated name hierarchy
        for (const [name, layer] of nameToLayer) {
            const parentName = name.split('.').slice(0, -1).join('.');
            if (parentName && nameToLayer.has(parentName)) {
                const parent = nameToLayer.get(parentName)!;
                if (!parent.children) parent.children = [];
                parent.children.push(layer);
            }
        }

        // Collect only root-level children (those without a parent in the list)
        const rootChildren: VisLayer[] = [];
        for (const [name, layer] of nameToLayer) {
            const parentName = name.split('.').slice(0, -1).join('.');
            if (!parentName || !nameToLayer.has(parentName)) {
                rootChildren.push(layer);
            }
        }

        // Attach the structured children to the current top-level VisLayer
        // @ts-ignore
        layerInfo.children = rootChildren;

        // Create the VisLayer and push to result
        // @ts-ignore
        vl.push(new VisLayer(layerInfo));
    });


    LayerSwitcher.renderLayers_(vl, geomap, setVisRefresh, setMobxLegendRefresh, ul, options, function render(
        _changedLyr
    ) {
        LayerSwitcher.renderPanel(geomap, setVisRefresh, setMobxLegendRefresh, panel, options);
    });

    // const rendercomplete_event = new Event('rendercomplete');
    // panel.dispatchEvent(rendercomplete_event);

};

LayerSwitcher.renderLayer_ = (geomap, setVisRefresh, setMobxLegendRefresh, lyr, idx, options, render) => {
    const li = document.createElement('li');
    const {label: lyrLabel, name: lyrName} = lyr || {};
    const checkboxId = LayerSwitcher.uuid();
    const label = document.createElement('label');

    const serviceGroups = ['graph', colTypes.Clusters, colTypes.Circle, colTypes.SVG, colTypes.Label, colTypes.Comments, colTypes.Edges, colTypes.Hyperedges ]

    const max = 18
    const min = 1
    const selOptions: any = []
    for (let i = max; i >= min; i--) {
        selOptions.push({ label: i.toString(), value: i });
    }

    //@ts-ignore
    if (lyr.group && lyr.children && !lyr['combine']) {
        const hasGraph = geomap.visLayers.hasGraph()

        if (!serviceGroups.includes(lyr.group) || hasGraph)
        {

        if (!serviceGroups.includes(lyr.group) || lyr.group === 'graph') {
            li.classList.add('group');
        }


        if (['close', 'open'].includes(lyr.fold)) {
            li.classList.add(CSS_PREFIX + 'fold');
            li.classList.add(CSS_PREFIX + lyr.fold);
            const btn = document.createElement('button');
            btn.onclick = function (e) {
                const evt = e || window.event;
                LayerSwitcher.toggleFold_(lyr, li, geomap.visLayers);
                evt.preventDefault();
            };
            li.appendChild(btn);
        }

        if (options.groupSelectStyle != 'none') {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = checkboxId;
            input.checked = lyr.visible; //.getVisible;
            input.indeterminate = lyr.indeterminate ?? false;
            input.onchange = function (e) {
                const target = e.target as HTMLInputElement;
                LayerSwitcher.setVisible_(
                    geomap,
                    lyr,
                    idx,
                    target?.checked,
                    options.groupSelectStyle
                );
                setVisRefresh(Math.random()+1);
                setMobxLegendRefresh(Math.random()+1);
                render(lyr);
            };
            li.appendChild(input);


            label.htmlFor = checkboxId;
        }

        label.textContent = lyrLabel;
        li.appendChild(label);

        const ul = document.createElement('ul');
        li.appendChild(ul);
        //@ts-ignore
        const layers = lyr.children;
        LayerSwitcher.renderLayers_(layers, geomap, setVisRefresh, setMobxLegendRefresh, ul, options, render);
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
            LayerSwitcher.setVisible_(
                geomap,
                lyr,
                idx,
                target.checked ,
                options.groupSelectStyle
            );
            setVisRefresh(Math.random()+1);
            setMobxLegendRefresh(Math.random()+1);
            render(lyr);
        };

        li.appendChild(input)

        label.htmlFor = checkboxId;
        label.textContent = lyrLabel; //lyrName;
        li.appendChild(label);
    }

    return li;
};

LayerSwitcher.renderLayers_ = (layers: VisLayer[], geomap, setVisRefresh, setMobxLegendRefresh, elm, options, render) => {

    let children = [...layers];
    if (options.reverse) {
        children.reverse();
    }

    for (let i = 0, l: VisLayer; i < children.length; i++) {
        l = children[i];
        if (l.name) {
            elm.appendChild(LayerSwitcher.renderLayer_(geomap, setVisRefresh, setMobxLegendRefresh,
                l, i, options, render));
        }
    }
};

LayerSwitcher.setVisible_ = (geomap, lyr, index, visible, groupSelectStyle) => {
    const {visLayers, graph} = geomap as GeomapPanel

    visLayers!.setVisible(lyr.index, lyr.name, lyr.group, visible) /// lyr.name, lyr.group,

    if (lyr.group && !lyr.combine && groupSelectStyle === 'children') {
        lyr.children?.forEach((l, i) => {
            LayerSwitcher.setVisible_(visLayers, l, i, visible, groupSelectStyle);
        });
    }

};

LayerSwitcher.uuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

LayerSwitcher.toggleFold_ = (lyr, li, visLayers) => {
    li.classList.remove(CSS_PREFIX + lyr.fold);
    lyr.setFold(lyr.fold === 'open' ? 'close' : 'open');
    li.classList.add(CSS_PREFIX + lyr.fold);
    visLayers.setFold(lyr.index, lyr.fold === 'close' ? 1 : 0) /// lyr.name, lyr.group,

};

export default LayerSwitcher;
