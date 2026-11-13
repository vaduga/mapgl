import { LayerExtension, type Layer, type DefaultProps, type UpdateParameters } from '@deck.gl/core';
import { TextLayer } from '@deck.gl/layers';
import type { ShaderModule } from '@luma.gl/shadertools';
import { getArcLabelPosition } from './arc-label-position';

const highlightModule = {
  name: 'edgeLabelHighlight',
  vs: `in vec2 instanceLabelHighlight;
out vec2 vLabelVisibility;`,
  fs: `in vec2 vLabelVisibility;
layout(std140) uniform edgeLabelHighlightUniforms {
  float maxDepth;
  float dimOpacity;
  float alwaysOn;
} edgeLabelHighlight;`,
  uniformTypes: { maxDepth: 'f32', dimOpacity: 'f32', alwaysOn: 'f32' },
  inject: {
    'vs:#main-end': 'vLabelVisibility = instanceLabelHighlight;',
    'fs:DECKGL_FILTER_COLOR': `
      bool focused = vLabelVisibility.x <= edgeLabelHighlight.maxDepth;
      if (!focused && (vLabelVisibility.y < 0.5 || edgeLabelHighlight.alwaysOn < 0.5)) { discard; }
      if (!focused) { color.a *= edgeLabelHighlight.dimOpacity; }
    `,
  },
} as const satisfies ShaderModule;
class LabelHighlightExtension extends LayerExtension {
  static extensionName = 'LabelHighlightExtension';
  static defaultProps: DefaultProps = {
    getLabelHighlight: { type: 'accessor', value: [Number.MAX_SAFE_INTEGER, 1] },
    highlightMaxDepth: -1,
    highlightDimOpacity: 1,
    edgeLabelsAlwaysOn: true,
  };
  getShaders() {
    return { modules: [highlightModule] };
  }
  initializeState(this: Layer) {
    this.getAttributeManager()?.addInstanced({ instanceLabelHighlight: { size: 2, accessor: 'getLabelHighlight' } });
  }
  draw(this: Layer<any>) {
    const { highlightMaxDepth, highlightDimOpacity, edgeLabelsAlwaysOn } = this.props;
    for (const model of this.getModels()) {
      model.shaderInputs.setProps({
        edgeLabelHighlight: {
          maxDepth: highlightMaxDepth,
          dimOpacity: highlightDimOpacity,
          alwaysOn: Number(edgeLabelsAlwaysOn),
        },
      });
    }
  }
}
const highlightExtension = new LabelHighlightExtension();
type HighlightProps = {
  arcLabels?: boolean;
  getIdleVisible?: (d: any) => boolean;
  getHighlightDepth?: number | ((d: any, info: any) => number);
  highlightMaxDepth?: number;
  highlightDimOpacity?: number;
  edgeLabelsAlwaysOn?: boolean;
};
/** Ordinary TextLayer positions and sublayers; focus updates only the GPU highlight attribute. */
export class EdgeLabelLayer extends TextLayer<any, HighlightProps> {
  static layerName = 'EdgeLabelLayer';
  static defaultProps: DefaultProps = {
    ...TextLayer.defaultProps,
    getHighlightDepth: { type: 'accessor', value: Number.MAX_SAFE_INTEGER },
    arcLabels: false,
    getIdleVisible: { type: 'accessor', value: (d: any) => d.idleVisible ?? !d.skip },
    highlightMaxDepth: -1,
    highlightDimOpacity: 1,
    edgeLabelsAlwaysOn: true,
  };
  shouldUpdateState(params: UpdateParameters<this>) {
    return super.shouldUpdateState(params) || Boolean(this.props.arcLabels && params.changeFlags.viewportChanged);
  }
  getSubLayerProps(props: any) {
    const { getHighlightDepth, getIdleVisible, highlightMaxDepth, highlightDimOpacity, edgeLabelsAlwaysOn } =
      this.props;
    const base = super.getSubLayerProps(props);
    const viewport = this.props.arcLabels ? this.context.viewport : undefined;
    return {
      ...base,
      highlightMaxDepth,
      highlightDimOpacity,
      edgeLabelsAlwaysOn,
      ...(viewport ? { coordinateSystem: 'cartesian', modelMatrix: null } : {}),
      extensions: [...(base.extensions ?? []), highlightExtension],
      getPosition: viewport
        ? (d: any) => getArcLabelPosition(d, viewport, this.props.modelMatrix)
        : this.props.getPosition,
      getLabelHighlight: (d: any, info: any) => [
        typeof getHighlightDepth === 'function' ? getHighlightDepth(d, info) : getHighlightDepth,
        Number(getIdleVisible!(d)),
      ],
      updateTriggers: {
        ...base.updateTriggers,
        getLabelHighlight: [this.props.updateTriggers.getHighlightDepth, this.props.updateTriggers.getIdleVisible],
        getPosition: viewport
          ? [base.updateTriggers?.getPosition, viewport, this.props.modelMatrix]
          : base.updateTriggers?.getPosition,
      },
    };
  }
}
