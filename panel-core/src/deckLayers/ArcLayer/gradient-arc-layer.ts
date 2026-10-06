import vs from './arc-layer-vertex.glsl';
import type { Accessor, DefaultProps } from '@deck.gl/core';
import Float32ArcLayer from './float32-arc-layer';

type GradientArcLayerProps<DataT = any> = {
  getWidths?: Accessor<DataT, [number, number]>;
  getHighlightDepth?: Accessor<DataT, number>;
  getHighlightDimOpacity?: Accessor<DataT, number>;
  getSkip?: Accessor<DataT, boolean | number>;
};

const defaultProps: DefaultProps = {
  ...Float32ArcLayer.defaultProps,
  getWidths: { type: 'accessor', value: [1, 1] },
  getHighlightDepth: { type: 'accessor', value: 0 },
  getHighlightDimOpacity: { type: 'accessor', value: 1 },
  getSkip: { type: 'accessor', value: (d: any) => Number(Boolean(d?.skip)) },
};

export default class GradientArcLayer<DataT = any, ExtraPropsT extends {} = {}> extends Float32ArcLayer<
  DataT,
  ExtraPropsT & GradientArcLayerProps<DataT>
> {
  static layerName = 'GradientArcLayer';
  static defaultProps = defaultProps;

  getShaders() {
    const shaders = super.getShaders();
    return Object.assign({}, shaders, {
      vs,
      inject: {
        ...shaders.inject,
        'vs:#decl': `
in float instanceHighlightDepth;
in float instanceHighlightDimOpacity;
in float instanceSkip;
out float vHighlightDepth;
out float vHighlightDimOpacity;
out float vSkip;
`,
        'vs:#main-end': `
vHighlightDepth = instanceHighlightDepth;
vHighlightDimOpacity = instanceHighlightDimOpacity;
vSkip = instanceSkip;
`,
        'fs:#decl': `
in float vHighlightDepth;
in float vHighlightDimOpacity;
in float vSkip;
`,
        'fs:DECKGL_FILTER_COLOR': `
if (vSkip > 0.5 && vHighlightDepth > 0.5) {
  discard;
}
if (vHighlightDepth > 0.5) {
  if (vHighlightDimOpacity < 0.0) {
    discard;
  }
  color.a *= vHighlightDimOpacity;
}
`,
      },
    });
  }

  initializeState() {
    super.initializeState();

    const attributeManager = this.getAttributeManager()!;
    attributeManager.remove(['instanceWidths']);
    attributeManager.addInstanced({
      // Pack both side widths into one attribute to preserve the WebGL attribute budget.
      instanceWidths: {
        size: 2,
        transition: true,
        accessor: 'getWidths',
        defaultValue: [1, 1],
      },
      instanceHighlightDepth: {
        size: 1,
        accessor: 'getHighlightDepth',
        defaultValue: 0,
      },
      instanceHighlightDimOpacity: {
        size: 1,
        accessor: 'getHighlightDimOpacity',
        defaultValue: 1,
      },
      instanceSkip: {
        size: 1,
        type: 'uint8',
        accessor: 'getSkip',
        defaultValue: 0,
      },
    });
  }
}
