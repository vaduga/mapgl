import vs from './arc-layer-vertex.glsl';
import { ArcLayer } from '@deck.gl/layers';
import type { Accessor } from '@deck.gl/core';

type HighlightMaskProps<DataT = any> = {
  getHighlightDepth?: Accessor<DataT, number>;
  getHighlightDimOpacity?: Accessor<DataT, number>;
};

const defaultProps = {
  ...ArcLayer.defaultProps,
  getHighlightDepth: { type: 'accessor', value: 0 },
  getHighlightDimOpacity: { type: 'accessor', value: 1 },
};

export default class GradientArcLayer<DataT = any, ExtraPropsT extends {} = {}> extends ArcLayer<
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
out float vHighlightDepth;
out float vHighlightDimOpacity;
`,
        'vs:#main-end': `
vHighlightDepth = instanceHighlightDepth;
vHighlightDimOpacity = instanceHighlightDimOpacity;
`,
        'fs:#decl': `
in float vHighlightDepth;
in float vHighlightDimOpacity;
`,
        'fs:DECKGL_FILTER_COLOR': `
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
    });
  }
}
