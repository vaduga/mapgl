import { ArcLayer } from '@deck.gl/layers';

const DEFAULT_COLOR = [0, 0, 0, 255] as const;

export default class Float32ArcLayer<DataT = any, ExtraPropsT extends {} = {}> extends ArcLayer<DataT, ExtraPropsT> {
  static layerName = 'Float32ArcLayer';

  initializeState() {
    const attributeManager = this.getAttributeManager()!;

    // A deck.gl float64 position attribute still reserves a 64Low shader attribute even
    // when fp64 is disabled. Use real float32 positions to keep arc layers under 16 attrs.
    attributeManager.addInstanced({
      instanceSourcePositions: {
        size: 3,
        type: 'float32',
        transition: true,
        accessor: 'getSourcePosition',
      },
      instanceTargetPositions: {
        size: 3,
        type: 'float32',
        transition: true,
        accessor: 'getTargetPosition',
      },
      instanceSourceColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        transition: true,
        accessor: 'getSourceColor',
        defaultValue: DEFAULT_COLOR,
      },
      instanceTargetColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        transition: true,
        accessor: 'getTargetColor',
        defaultValue: DEFAULT_COLOR,
      },
      instanceWidths: {
        size: 1,
        transition: true,
        accessor: 'getWidth',
        defaultValue: 1,
      },
      instanceHeights: {
        size: 1,
        transition: true,
        accessor: 'getHeight',
        defaultValue: 1,
      },
      instanceTilts: {
        size: 1,
        transition: true,
        accessor: 'getTilt',
        defaultValue: 0,
      },
    });
  }
}
