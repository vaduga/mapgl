import { buildGraphBinaryCollections } from './renderData';
import { Graph } from '../graph/main';

it('borrows canonical arrays with interleaved namespace membership and 32-bit identities', () => {
  const root = new Graph('root');
  const a = new Graph('a'),
    b = new Graph('b');
  const features = Array.from({ length: 65538 }, (_, id) => ({ id, graph: id % 2 ? a : b }));
  const positions = new Float64Array(features.length * 2);
  const colors = new Uint8Array(features.length * 4);
  const annotations = new Uint8Array(colors.length),
    muted = new Uint8Array(colors.length);
  const groupIndices = new Uint8Array(features.length);
  const input = {
    graphs: [root, a, b],
    visibleNamespaces: ['a'],
    features,
    positions,
    colors,
    muted,
    annotations,
    groupIndices,
    showAnnotations: false,
    hide: false,
  };
  const [batch] = buildGraphBinaryCollections(input);
  expect(batch.points.positions.value).toBe(positions);
  expect(batch.points.properties).toBe(features);
  expect((batch.points as any).attributes.getFillColor.value).toBe(muted);
  expect(batch.points.featureIds.value[65537]).toBe(65537);
  expect(batch.points.globalFeatureIds.value).toEqual(batch.points.featureIds.value);
  const [restored] = buildGraphBinaryCollections(input);
  expect(restored.points.positions.value).toBe(positions);
  expect(restored.points.featureIds.value).toEqual(batch.points.featureIds.value);
  expect(
    (buildGraphBinaryCollections({ ...input, showAnnotations: true })[0].points as any).attributes.getFillColor.value
  ).toBe(annotations);
  expect(buildGraphBinaryCollections({ ...input, hide: true })).toEqual([]);
});

it('packs independent data-layer buffers and keeps local feature IDs separate from canonical node references', () => {
  const graph = new Graph('external');
  const features = Array.from({ length: 65538 }, (_, id) => ({ id, layerName: id % 2 ? 'B' : 'A', graph }));
  const positions = Float64Array.from({ length: features.length * 2 }, (_, i) => i);
  const colors = new Uint8Array(features.length * 4);
  colors[65537 * 4] = 200;
  const batches = buildGraphBinaryCollections({
    graphs: [graph],
    features,
    positions,
    colors,
    muted: colors,
    annotations: colors,
    groupIndices: new Uint8Array(features.length),
    showAnnotations: false,
    hide: false,
  });
  expect(batches.map((batch) => batch.dataLayerId)).toEqual(['A', 'B']);
  expect(batches[0].points.positions.value).not.toBe(batches[1].points.positions.value);
  expect(batches[1].nodeRefs![32768]).toBe(65537);
  expect(batches[1].points.featureIds.value[32768]).toBe(32768);
  expect(batches[1].points.positions.value[32768 * 2]).toBe(65537 * 2);
  expect((batches[1].points.properties[32768] as any).id).toBe(65537);
  expect((batches[1].points as any).attributes.getColor.value[32768 * 4]).toBe(200);
});
