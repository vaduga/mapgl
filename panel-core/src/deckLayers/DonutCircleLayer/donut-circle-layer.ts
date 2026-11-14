import type { Accessor, DefaultProps, LayerContext, UpdateParameters } from '@deck.gl/core';
import { ScatterplotLayer, type ScatterplotLayerProps } from '@deck.gl/layers';
import { Texture } from '@luma.gl/core';

import { DONUT_RECORD_TEXELS, EMPTY_DONUT_ATLAS, type DonutAtlas } from './donutData';
import { donutShaderInjection, donutShaders } from './donutShaders';
import { DEFAULT_ARC_OPTIONS, resolveArcOptions, type ArcOptionsConfig } from '../../style/types';

type DonutCircleLayerAddedProps<DataT> = {
  donutAtlas?: DonutAtlas;
  /** Atlas record, focus opacity, gauge fill fraction; packed into one GPU attribute. */
  getDonutState?: Accessor<DataT, Readonly<[number, number, number]>>;
  /** Per-instance bar width, segment count, spacing, and packed threshold presentation flags. */
  getDonutGaugeOptions?: Accessor<DataT, Readonly<[number, number, number, number]>>;
  /** The local Y axis sign required to keep gauge zero at screen 12 o'clock. */
  gaugeCoordinateYSign?: 1 | -1;
  /** Layer-level fallback used when getDonutGaugeOptions is not supplied. */
  donutGaugeOptions?: ArcOptionsConfig;
};

export type DonutCircleLayerProps<DataT = unknown> = ScatterplotLayerProps<DataT> & DonutCircleLayerAddedProps<DataT>;

const defaultProps: DefaultProps<DonutCircleLayerProps<any>> = {
  ...ScatterplotLayer.defaultProps,
  donutAtlas: { type: 'object', value: EMPTY_DONUT_ATLAS },
  getDonutState: { type: 'accessor', value: [-1, 1, -1] },
  getDonutGaugeOptions: { type: 'accessor', value: [-1, -1, -1, -1] },
  gaugeCoordinateYSign: { type: 'number', value: 1 },
  donutGaugeOptions: { type: 'object', value: DEFAULT_ARC_OPTIONS },
};

export class DonutCircleLayer<DataT = any> extends ScatterplotLayer<DataT, DonutCircleLayerAddedProps<DataT>> {
  static layerName = 'DonutCircleLayer';
  static defaultProps = defaultProps;

  declare state: ScatterplotLayer<DataT>['state'] & {
    donutTexture?: Texture;
  };

  getShaders() {
    const shaders = super.getShaders();
    return {
      ...shaders,
      modules: [...shaders.modules, donutShaders],
      inject: {
        ...shaders.inject,
        ...donutShaderInjection,
      },
    };
  }

  initializeState() {
    super.initializeState();
    this.getAttributeManager()?.addInstanced({
      instanceDonutState: {
        size: 3,
        accessor: 'getDonutState',
        defaultValue: [-1, 1, -1],
      },
      instanceDonutGaugeOptions: {
        size: 4,
        accessor: 'getDonutGaugeOptions',
        defaultValue: [-1, -1, -1, -1],
      },
    });
    this.replaceDonutTexture(this.props.donutAtlas);
  }

  updateState(params: UpdateParameters<this>) {
    super.updateState(params);
    if (params.props.donutAtlas !== params.oldProps.donutAtlas) {
      this.replaceDonutTexture(params.props.donutAtlas);
      this.getAttributeManager()?.invalidate('instanceDonutState');
    }
    if (params.props.donutGaugeOptions !== params.oldProps.donutGaugeOptions) {
      this.setNeedsRedraw();
    }
  }

  finalizeState(context: LayerContext) {
    this.state.donutTexture?.destroy();
    super.finalizeState(context);
  }

  draw(params: Parameters<ScatterplotLayer<DataT>['draw']>[0]) {
    const atlas = this.props.donutAtlas ?? EMPTY_DONUT_ATLAS;
    const texture = this.state.donutTexture;
    if (texture) {
      const gaugeOptions = resolveArcOptions(this.props.donutGaugeOptions);
      this.setShaderModuleProps({
        donut: {
          texture,
          textureWidth: atlas.width,
          recordTexels: atlas.recordTexels ?? DONUT_RECORD_TEXELS,
          gaugeYSign: this.props.gaugeCoordinateYSign ?? 1,
          gaugeBarWidthFactor: gaugeOptions.barWidthFactor,
          gaugeSegmentCount: gaugeOptions.segments,
          gaugeSegmentSpacing: gaugeOptions.segmentSpacing,
          gaugeShowThresholds: gaugeOptions.showThresholds ? 1 : 0,
        },
      });
    }
    super.draw(params);
  }

  private replaceDonutTexture(atlas: DonutAtlas | undefined) {
    this.state.donutTexture?.destroy();
    const resolved = atlas ?? EMPTY_DONUT_ATLAS;
    const donutTexture = this.context.device.createTexture({
      id: `${this.props.id}-donut-data`,
      data: resolved.data,
      width: resolved.width,
      height: resolved.height,
      format: 'rgba32float',
      usage: Texture.SAMPLE | Texture.COPY_DST,
      sampler: {
        minFilter: 'nearest',
        magFilter: 'nearest',
        addressModeU: 'clamp-to-edge',
        addressModeV: 'clamp-to-edge',
      },
    });
    this.setState({ donutTexture });
  }
}
