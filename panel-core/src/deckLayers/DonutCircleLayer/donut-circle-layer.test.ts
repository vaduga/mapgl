jest.mock('@deck.gl/layers', () => {
  class MockScatterplotLayer {
    static defaultProps = {};
    props: any;
    state: any = {};
    context: any;
    attributeManager = { addInstanced: jest.fn(), invalidate: jest.fn() };

    constructor(props: any) {
      this.props = props;
    }

    getShaders() {
      return { modules: [], inject: {} };
    }

    initializeState() {}
    updateState() {}
    finalizeState() {}
    draw() {}
    getAttributeManager() {
      return this.attributeManager;
    }
    setState(next: any) {
      this.state = { ...this.state, ...next };
    }
  }

  return { ScatterplotLayer: MockScatterplotLayer };
});

jest.mock('@luma.gl/core', () => ({
  Texture: { SAMPLE: 1, COPY_DST: 2 },
}));

import { DonutCircleLayer } from './donut-circle-layer';
import { createDonutAtlas, createEqualDonutInput } from './donutData';
import { donutShaderInjection } from './donutShaders';

const atlas = (color: string) => createDonutAtlas([['variant', createEqualDonutInput([color])]]);

describe('DonutCircleLayer resource lifecycle', () => {
  it('keeps donut decoration opacity separate from circle alpha', () => {
    const fragment = donutShaderInjection['fs:DECKGL_FILTER_COLOR'];

    expect(donutShaderInjection['vs:#decl']).toContain('instanceDonutOpacity');
    expect(fragment).toContain('ringColor.a *= vDonutOpacity * layer.opacity;');
    expect(fragment).toContain('innerColor.a *= vDonutOpacity * layer.opacity;');
    expect(fragment).not.toContain('ringColor.a *= color.a;');
    expect(fragment).not.toContain('innerColor.a *= color.a;');
  });

  it('destroys replaced and finalized lookup textures', () => {
    const textures: Array<{ destroy: jest.Mock }> = [];
    const layer = new DonutCircleLayer({ id: 'nodes-circle', donutAtlas: atlas('#ff0000') } as any) as any;
    layer.context = {
      device: {
        createTexture: jest.fn(() => {
          const texture = { destroy: jest.fn() };
          textures.push(texture);
          return texture;
        }),
      },
    };

    layer.initializeState();
    expect(textures).toHaveLength(1);
    expect(layer.attributeManager.addInstanced).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceDonutGaugeValues: expect.objectContaining({ accessor: 'getDonutGaugeValue', defaultValue: -1 }),
        instanceDonutGaugeOptions: expect.objectContaining({
          size: 4,
          accessor: 'getDonutGaugeOptions',
          defaultValue: [-1, -1, -1, -1],
        }),
      })
    );

    layer.updateState({
      props: { donutAtlas: atlas('#00ff00') },
      oldProps: { donutAtlas: layer.props.donutAtlas },
    });
    expect(textures[0].destroy).toHaveBeenCalledTimes(1);
    expect(textures).toHaveLength(2);

    layer.finalizeState({} as any);
    expect(textures[1].destroy).toHaveBeenCalledTimes(1);
  });
});
