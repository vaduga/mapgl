import { arrayColumn, type GraphSource, type SourceView } from '../src/data';
import { createScaleChannel } from '../src/style';
import { type GraphVisualConfig, type GraphPipelineInput } from '../src/graph/frame';

/** Host-free fixture builders are also useful for standalone integration examples. */
export function metricGraphSource(revision: string, metrics: readonly number[]): GraphSource {
  const ids = metrics.map((_, index) => `node-${index}`);
  return Object.freeze({
    revision,
    key: 'metrics',
    index: 0,
    rowCount: ids.length,
    nodeId: arrayColumn('id', ids),
    target: arrayColumn(
      'target',
      ids.map((_, index) => ids[index + 1])
    ),
    position: () => [0, 0] as const,
    value: (key: string, row: number) => (key === 'id' ? ids[row] : key === 'metric' ? metrics[row] : undefined),
  });
}
export function metricGraphInput(source: GraphSource, sizes = true): GraphPipelineInput {
  const options = { isLogic: true };
  const evaluateVisuals = (sources: readonly SourceView[]) => {
    const view = sources[0];
    const column = { key: 'metric', length: view.rowCount, get: (row: number) => Number(view.value('metric', row)) };
    const values = Array.from({ length: view.rowCount }, (_, row) => column.get(row));
    const size = createScaleChannel({
      metric: column,
      range: { min: Math.min(...values), max: Math.max(...values) },
      output: { min: 5, max: 10 },
    });
    const channels = {
      scope: { revision: view.revision, sourceIndex: view.index, sourceKey: view.key },
      base: { color: '#008000', size: 5 },
      colorKey: 'metric',
      isFixed: false,
      color: { get: (row: number) => (column.get(row) > 50 ? '#ff0000' : '#008000') },
      ...(sizes && { size }),
    };
    const config: GraphVisualConfig = {
      layerName: 'metrics',
      locationField: 'id',
      isLogic: true,
      node: () => channels,
      edge: () => channels,
      sideA: () => channels,
      sideB: () => channels,
      arcConfig: { height: 1, tiltIncrement: 1, capacity: { fixed: 100 } },
    };
    return [config];
  };
  return {
    layers: [{ options, sources: [source], visualConfig: evaluateVisuals([source])[0] }],
    evaluateVisuals,
  };
}
