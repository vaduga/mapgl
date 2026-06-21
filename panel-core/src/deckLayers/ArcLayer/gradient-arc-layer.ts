import vs from './arc-layer-vertex.glsl';
import type { Accessor } from '@deck.gl/core';
import Float32ArcLayer from './float32-arc-layer';

type HighlightMaskProps<DataT = any> = {
  getHighlightDepth?: Accessor<DataT, number>;
  getHighlightDimOpacity?: Accessor<DataT, number>;
  getSkip?: Accessor<DataT, boolean | number>;
};

const defaultProps = {
  ...Float32ArcLayer.defaultProps,
  getHighlightDepth: { type: 'accessor', value: 0 },
  getHighlightDimOpacity: { type: 'accessor', value: 1 },
  getSkip: { type: 'accessor', value: (d: any) => Number(Boolean(d?.skip)) },
};

export default class GradientArcLayer<DataT = any, ExtraPropsT extends {} = {}> extends Float32ArcLayer<
  DataT,
  ExtraPropsT & HighlightMaskProps<DataT>
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

    this.getAttributeManager()?.addInstanced({
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
