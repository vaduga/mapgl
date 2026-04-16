import { Layer, LayerData, PickingInfo, UpdateParameters, _ConstructorOf } from '@deck.gl/core';

import { POINT_LAYER, forwardProps } from './sub-layer-map';

import { createLayerPropsFromBinary } from './geojson-layer-props';
import { colTypes } from 'mapLib/utils';
import { createDonutChart, getDonutIconSrcSize, svgToDataURL } from './donutChart';
import { GeoJsonLayer } from '@deck.gl/layers';
import { DataFilterExtension } from '@deck.gl/extensions';
import { isVisible } from '../../utils/utils.layers';

export default class OrthoLayer<FeaturePropertiesT = any, ExtraProps extends {} = {}> extends GeoJsonLayer {
  static layerName = 'OrthoLayer composite';
  static defaultProps = {
    ...super.defaultProps,
    getText: undefined,
    pointType: 'circle+icon+text+text',
  };
  time;
  id;
  hoverCluster;
  visible;
  graph;
  theme;
  svgIcons;
  getSelectedNode;
  biCol;
  categories;
  panel;
  Circle;
  SVG;
  Label;

  constructor(props) {
    super(props);
    this.id = props.biCol.graph.id;
    this.graph = props.graph;
    this.getSelectedNode = props.getSelectedNode;
    this.svgIcons = props.svgIcons;
    this.time = props.time;
    this.theme = props.theme2;
    this.biCol = props.biCol;
    this.Circle = isVisible(props.getVisLayers, {
      index: null,
      name: colTypes.Circle,
      group: colTypes.Circle,
    });
    this.SVG = isVisible(props.getVisLayers, {
      index: null,
      name: colTypes.SVG,
      group: colTypes.SVG,
    });
    this.Label = isVisible(props.getVisLayers, {
      index: null,
      name: colTypes.Label,
      group: colTypes.Label,
    });

    const cats = props.getVisLayers.getCategories();
    this.categories = [cats, cats];

    this.getIcon = this.getIcon.bind(this);
    this.getIconSize = this.getIconSize.bind(this);
    this.getPointRadius = this.getPointRadius.bind(this);
    this.getPickingInfo = this.getPickingInfo.bind(this);
  }

  shouldUpdateState({ changeFlags }) {
    return changeFlags.somethingChanged;
  }

  updateState({ props, oldProps, changeFlags }: UpdateParameters<this>): void {
    const rebuildIndex =
      // @ts-ignore
      changeFlags.dataChanged || props.maxZoom !== oldProps.maxZoom;

    if (rebuildIndex) {
      const index = 7777;
      const biCol = this.biCol;
      props.data = biCol;
      const binary = biCol && 'points' in (biCol as {});

      this.setState({ binary, index });
      if (binary) {
        // @ts-ignore
        //if (z > props.maxZoom) props.data = emptyBiCol
        this.updateStateBinary({ props, changeFlags });
      }
    }
    const z = this.context.viewport.zoom;
    // @ts-ignore
    if (this.state.index && (rebuildIndex || z !== this.state.z)) {
      //&& z < props.maxZoom
      // @ts-ignore
      if (z !== this.state.z) {
        this.setState({ z });
        return;
      }
    }
  }

  private updateStateBinary({ props, changeFlags }): void {
    const layerProps = createLayerPropsFromBinary(props.data, this.encodePickingColor);
    this.setState({ layerProps });
  }

  getText(f) {
    return f.properties?.style?.text;
  }
  getTextSize(f) {
    const selId = this.getSelectedNode?.id;
    const { style, locName } = f.properties || {};
    const size = style?.size;
    const r = size / 2;
    const r0 = Math.round(r * 0.73);
    const mainStat = false; //777
    return mainStat ? Math.round(r0 * 0.5) : Math.round(r0 * 0.5);
  }

  getIcon(d) {
    const { style } = d.properties || {};
    const { group, arcs } = style || {};
    const iconName = group?.iconName;
    const svgIcon = iconName && this.svgIcons[iconName];
    const iconSize = this.getIconSize(d);
    const { width, height } = this.getIconDimensions(d, iconSize);

    if (arcs?.length) {
      const colorCounts = {};
      arcs.forEach((color) => {
        colorCounts[color] = {
          count: 1
        };
      });
      const icon = {
        url: svgToDataURL(
          createDonutChart({
            colorCounts,
            stripeCounts: undefined,
            allTotal: arcs.length,
            bkColor: undefined,
            radius: iconSize / 2,
            isDark: this.theme.isDark,
            userSvgUrl: svgIcon ? svgIcon.svgDataUrl : null, // embed user SVG
          })
        ),
        width,
        height,
      };
      return icon;
    } else if (svgIcon) {
      return {
        url: svgIcon.svgDataUrl,
        width,
        height,
        id: iconName,
      };
    }
    // empty svg icon
    return {
      url: svgToDataURL(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">  
</svg>`),
      width: 1,
      height: 1,
      id: 'blank',
    };
  }
  getIconPixelOffset(d, z) {
    const { group, arcs } = d.properties?.style || {};
    const iconVOffset = group?.iconVOffset;
    if (arcs?.length) {
      return [0, 0];
    }

    const iconSize = this.getIconSize(d);
    const { height } = this.getIconDimensions(d, iconSize);
    const renderedIconHeight = iconSize * Math.pow(2, z);
    const scaledOffset = (iconVOffset ?? -5) * (renderedIconHeight / height);

    return [0, scaledOffset];
  }
  getIconSize(d) {
    const selId = this.getSelectedNode?.id;
    const { style, locName } = d.properties || {};
    const isHead = selId === locName;
    const group = style?.group;
    const size = group?.iconSize ?? style?.size;
    return isHead ? size * 1.3 : size;
  }
  getPointRadius(d) {
    const { style, locName } = d.properties;
    const selId = this.getSelectedNode?.id;
    const { size, group } = style || { size: 0 };
    const diam = group?.nodeSize ?? size;
    const isHead = selId === locName;
    const multiPly = isHead ? 1.3 : 1;
    return (diam / 2) * multiPly;
  }

  getIconDimensions(d, iconSize = this.getIconSize(d)) {
    const { style } = d.properties || {};
    const { group, arcs } = style || {};

    if (arcs?.length) {
      const packedSize = getDonutIconSrcSize(iconSize);
      return { width: packedSize, height: packedSize };
    }

    const iconName = group?.iconName;
    const svgIcon = iconName && this.svgIcons[iconName];
    if (svgIcon) {
      return { width: svgIcon.width, height: svgIcon.height };
    }

    return { width: 1, height: 1 };
  }

  getTextPixelOffset(d, z) {
    const iconSize = this.getIconSize(d);
    const icon = this.getIconDimensions(d, iconSize);
    const renderedIconHeight = iconSize * Math.pow(2, z);
    const aspectRatio = icon?.width && icon?.height ? icon.height / icon.width : 1;
    const gap = 2;

    return [0, renderedIconHeight * aspectRatio * 0.5 + gap];
  }

  private renderPointLayers(): Layer[] | null {
    let { pointType } = this.props;
    const { layerProps, binary } = this.state;
    let { highlightedObjectIndex } = this.props;

    // Avoid duplicate sub layer ids
    const types = pointType.split('+'); //new Set(pointType.split('+'));
    const pointLayers: Layer[] = [];
    let textCount = -1;
    for (const type of types) {
      let id = `points-${type}-${this.id}}`;
      if (type === 'text') {
        id += textCount;
        textCount++;
      }
      const PointLayerMapping = POINT_LAYER[type];
      const PointsLayer: _ConstructorOf<Layer> =
        PointLayerMapping &&
        this.shouldRenderSubLayer(id, layerProps.points?.data) &&
        this.getSubLayerClass(id, PointLayerMapping.type);
      if (PointsLayer) {
        const forwardedProps = forwardProps(this, PointLayerMapping.props);
        let pointsLayerProps = layerProps.points;
        // @ts-ignore
        if (type === 'text' && binary && pointsLayerProps?.data?.attributes) {
          // @ts-ignore
          pointsLayerProps.data.attributes.instancePickingColors = undefined;

          // Picking colors are per-point but for text per-character are required
          // getPickingInfo() maps back to the correct index
           
          // TODO - type binary data
          // @ts-ignore
          //const {instancePickingColors, ...rest} = pointsLayerProps?.data?.attributes
          // pointsLayerProps = {
          //     ...pointsLayerProps,
          //     // @ts-expect-error TODO - type binary data
          //     data: {...(pointsLayerProps.data as LayerData), attributes: rest},
          // };
        }

        // @ts-ignore
        const z = this.state.z;
        const ICON_SCALE_BASE = 1;
        const iconScaleFactor = Math.pow(2, z);
        const sizeScale = ICON_SCALE_BASE * iconScaleFactor;

        const textProps: any = {};
        const iconProps: any = {};
        if (type === 'icon') {
          iconProps.getPixelOffset = this.getSubLayerAccessor((f) => this.getIconPixelOffset(f, z));
          iconProps.updateTriggers = {
            getPixelOffset: z,
          };
        }
        if (type === 'text') {
          if (textCount) {
            textProps.getPixelOffset = this.getSubLayerAccessor((f) => this.getTextPixelOffset(f, z));
            textProps.getSize = this.getSubLayerAccessor((f: any) => {
              return f.properties.style?.textConfig?.fontSize ?? 12;
            });
            textProps.getText = this.getSubLayerAccessor(this.getText);
            textProps.getTextAnchor = 'middle';
            textProps.getAlignmentBaseline = 'top';
            textProps.updateTriggers = {
              getPixelOffset: z, // Forces re-evaluation on zoom change
              collisionTestProps: z,
            };
          }
        }

        let visible = true;
        let opacity = 1;
        switch (type) {
          case 'icon':
            visible = this.SVG;
            break;
          case 'text':
            visible = this.Label;
            break;
          case 'circle':
            visible = this.Circle;
            opacity = this.biCol.opacity;
            break;
        }

        //if (type==='text' && !textCount) {visible=true}

        pointLayers.push(
          new PointsLayer(
            forwardedProps,
            this.getSubLayerProps({
              id,
              visible,
              opacity,
              updateTriggers: { ...forwardedProps.updateTriggers, getIcon: this.time, getSize: [this.getSelectedNode] },
              highlightedObjectIndex,
              getIcon: this.getSubLayerAccessor(this.getIcon),
              getPixelOffset: this.getSubLayerAccessor(this.getIconPixelOffset),
              getText: this.getSubLayerAccessor((f: any) => {
                const { group, arcs } = f.properties.style || {};
                const iconName = group?.iconName;
                return !iconName ? '-\n-' : null;
              }),
              //getAlignmentBaseline: textCount ? 'bottom' : 'center',
              getSize: this.getSubLayerAccessor((f) => (type === 'text' ? this.getTextSize(f) : this.getIconSize(f))),
              getRadius: this.getSubLayerAccessor(this.getPointRadius),
              sizeScale,
              radiusScale: 1,
              ...iconProps,
              ...textProps,
              stroked: false,
              lineHeight: 0.8,
              fontFamily: 'Arial, sans-serif',
              parameters: {
                depthTest: false,
              },
              autoHighlight: false,
              getFilterCategory: this.getSubLayerAccessor((d: any) => {
                const { style, layerName, root } = d.properties;
                return [layerName, root.id];
              }),
              filterCategories: this.categories,
              extensions: [new DataFilterExtension({ categorySize: 2 })],
              // extensions: type === 'text' && textCount ? [new CollisionFilterExtension()] : [],
              // collisionGroup: type === 'text' ? 'text'+textCount : undefined,
              // collisionTestProps:
              //     {
              //         sizeScale: sizeScale*3,  // Still include sizeScale for scaling effects
              //     },
              //alphaCutoff: -1,
            }),
            pointsLayerProps
          )
        );
      }
    }
    return pointLayers;
  }

  renderLayers() {
    const pointLayers = this.renderPointLayers();
    return [pointLayers];
  }
}

const FEATURE_TYPES = ['points', 'linestrings', 'polygons'];

type GeoJsonPickingInfo = PickingInfo & {
  featureType?: string | null;
  info?: any;
};
