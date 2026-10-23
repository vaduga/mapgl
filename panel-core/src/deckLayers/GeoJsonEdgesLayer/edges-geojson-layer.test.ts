import { getLayoutCurveSegments } from './edges-geojson-layer';
import { CurveEdgeLayer, CurveType } from './curve-edge-layer';
import { getDimmedGraphLayers } from '../focus-layers';
import { _compareProps } from '@deck.gl/core';

it('dims unrelated curves consistently when focus moves between namespaces with matching line indexes', () => {
  const data = [0, 1].map((featureIndex) => ({
    featureIndex,
    feature: {},
    pickingIndex: featureIndex,
    type: CurveType.Line,
    controlPoints: [],
    segment: [],
  }));
  const namespaces = ['Core.Render', 'Pro.Geometry'];
  const layers = namespaces.map((id) => new CurveEdgeLayer({ id: `edges-view${id}`, data }));
  for (const graphId of namespaces) {
    const dimmed = getDimmedGraphLayers(layers, {
      connectedNodeIds: new Set(),
      connectedEdgeIndexes: [{ graphId, lineId: 1 }],
      isRouted: true,
    });
    dimmed.forEach((layer, index) => {
      const props = (layer as CurveEdgeLayer).props;
      const depth = props.getHighlightDepth;
      expect(props.opacity).toBe(1);
      expect(props.highlightDimOpacity).toBe(0.18);
      // First hover must replace the default depth attribute, including in unrelated namespaces.
      expect(_compareProps({ oldProps: {}, newProps: props.updateTriggers!.getHighlightDepth })).not.toBe(false);
      const highlighted = data.map(
        (segment, index) =>
          (typeof depth === 'function' ? depth(segment, { index, data, target: [] }) : depth) <= props.highlightMaxDepth
      );
      expect(highlighted).toEqual(namespaces[index] === graphId ? [false, true] : [false, false]);
    });
  }
});

it('keeps curves without a visible edge separate from the first visible feature', () => {
  const visibleFeature = { edgeRef: 0, properties: {} } as any;
  const data = getLayoutCurveSegments(
    'Core.Input',
    [visibleFeature],
    {
      edgeCount: 1,
      getEdge: () => ({ id: 'visible', source: { parent: { id: 'Core.Input' } } }),
    } as any,
    {
      edgeOffsetStrategies: [],
      edgeKeys: ['Core.Input:hidden', 'Core.Input:visible'],
      edgeIndexes: new Map([['Core.Input:visible', 1]]),
      curveGroups: new Map([
        [
          'Core.Input',
          {
            edgeIndexes: Int32Array.from([0, 1]),
            edgeSegmentOffsets: Int32Array.from([0, 1, 2]),
            types: new Uint8Array(2),
            controlPoints: new Float32Array(16),
            segments: new Float32Array(4),
          },
        ],
      ]),
    }
  );
  expect(data?.features[data.segmentFeatureIndexes[0]].skip).toBe(true);
  expect(data?.features[data.segmentFeatureIndexes[1]]).toBe(visibleFeature);
});
