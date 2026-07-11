/// <reference types="jest" />

jest.mock('@mapgl/panel-core/types', () => ({}), { virtual: true });
jest.mock('@mapgl/panel-core/types/defaults', () => ({ NS_SEPARATOR: '.' }), { virtual: true });
jest.mock('../panel-core/src/graph/structs/graphOps', () => ({
  getNodeData: (node: { getAttr(attr: number): unknown }) => node.getAttr(4),
}));
jest.mock('../panel-core/src/graph/utils/utils.graph', () => ({
  inheritedShift: (id: string, layerShift: Record<string, [number, number]> = {}) => {
    return id.split('.').reduce<[number, number]>(
      ([x, y], _, i, parts) => {
        const shift = layerShift[parts.slice(0, i + 1).join('.')];
        return shift ? [x + shift[0], y + shift[1]] : [x, y];
      },
      [0, 0]
    );
  },
}));

import { getProjectedTerminalsGeometry } from '../panel-core/src/graph/utils/utils.projected-terminals';

const node = (wasmId: number) => ({
  getAttr: (attr: number) => (attr === 4 ? { wasmId } : undefined),
});

describe('getProjectedTerminalsGeometry', () => {
  it('only shifts the foreign target terminal for multi-hop coordinates', () => {
    const result = getProjectedTerminalsGeometry({
      edge: {
        source: node(0),
        target: node(3),
      },
      panel: {
        positions: new Float64Array([0, 0, 10, 0, 20, 0, 30, 0]),
      },
      layerShift: {
        namespaceB: [100, 25],
      },
      srcGraph: { id: 'namespaceA' } as any,
      tarGraph: { id: 'namespaceB' } as any,
      subPath: ['source', 'hop-1', 'hop-2', 'target'],
      pathsCoords: [
        [0, 0],
        [10, 0],
        [20, 0],
        [30, 0],
      ],
      layoutArrowTips: {
        start: [-5, -5],
      },
    });

    expect(result).toMatchObject({
      subPath: ['source', 'hop-1', 'hop-2', 'target'],
      targetTerminalShift: [100, 25],
    });
    expect(result?.pathsCoords).toEqual([
      [0, 0],
      [10, 0],
      [20, 0],
      [130, 25],
    ]);
  });
});
