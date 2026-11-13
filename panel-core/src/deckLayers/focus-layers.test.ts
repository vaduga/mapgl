import { EdgeLabelLayer } from './TextLayer/edge-label-layer';
import { PolygonLayer } from '@deck.gl/layers';
import { getDimmedGraphLayers } from './focus-layers';
import { makeScopedKey } from './GraphHighlighter';
import {
  createRouteLabelData,
  createRouteLabelDataByGraph,
  type ScopedRouteLabelCandidate,
} from './GeoJsonEdgesLayer/route-labels';

it('promotes every focused label by edge index, including labels dropped by idle declutter', () => {
  const candidates = [7, 7, 2].map((featureIndex, i) => ({
    text: `label-${i}`,
    fontSize: 10,
    featureIndex,
    srcGraphId: 'ns',
    kind: i ? 'end' : 'middle',
    spots: [[0, 0]],
    hw: 20,
    hh: 7,
    color: [1, 2, 3, 255],
    feature: { properties: {} },
  })) as ScopedRouteLabelCandidate[];
  const data = createRouteLabelData(candidates, [{ x: 0, y: 0, hw: 100, hh: 50 }], 'ns');
  expect(data).toHaveLength(3);
  expect(data.every((d) => d.idleVisible === false)).toBe(true);
  const base = new EdgeLabelLayer({
    id: 'text-routeLabelsns',
    data,
    edgeLabelsAlwaysOn: false,
    getColor: [255, 255, 255, 255],
  });
  const [focused] = getDimmedGraphLayers([base], {
    connectedNodeIds: new Set(),
    connectedEdgeIndexes: [{ graphId: 'ns', lineId: 7 }],
    isRouted: true,
  });
  expect(focused.props.data).toBe(base.props.data);
  const props = focused.props as any;
  expect(props.getHighlightDepth(data[0])).toBe(0);
  expect(props.getHighlightDepth(data[1])).toBe(0);
  expect(props.getHighlightDepth(data[2])).toBe(Number.MAX_SAFE_INTEGER);
  expect(props.highlightMaxDepth).toBe(0);
  expect(props.highlightDimOpacity).toBe(0.18);
  expect(props.getPosition(data[0])[1]).toBeGreaterThan(50);
  expect(props.getIdleVisible(data[2])).toBe(false);
  expect(data[0].position).toEqual([0, 0]);
  expect(base.props.data).toBe(data);
});

it('reveals focused circles and covers unfocused circles while dimming card borders', () => {
  const base = new PolygonLayer({
    id: 'ns-view-node-card',
    data: [],
    getFillColor: [255, 255, 255, 255],
    getLineColor: [1, 2, 3, 255],
  });
  const [focused] = getDimmedGraphLayers([base], { connectedNodeIds: new Set([makeScopedKey('ns', 'a')]) });
  const color = (focused.props as any).getFillColor;
  expect(color({ properties: { graph: { id: 'ns' }, locName: 'a' } })).toEqual([255, 255, 255, 46]);
  expect(color({ properties: { graph: { id: 'ns' }, locName: 'b' } })[3]).toBe(255);
  const border = (focused.props as any).getLineColor;
  expect(border({ properties: { graph: { id: 'ns' }, locName: 'a' } })).toEqual([1, 2, 3, 255]);
  expect(border({ properties: { graph: { id: 'ns' }, locName: 'b' } })[3]).toBe(46);
  expect(base.props.getFillColor).toEqual([255, 255, 255, 255]);
});

it('reuses text data and coordinates global placement across namespace layers on focus', () => {
  const candidates = ['a', 'b'].map((srcGraphId, i) => ({
    text: srcGraphId,
    fontSize: 10,
    featureIndex: 0,
    srcGraphId,
    kind: 'middle',
    spots: [[i * 100, 0]],
    hw: 10,
    hh: 7,
    color: [1, 2, 3, 255],
    feature: { properties: {} },
  })) as ScopedRouteLabelCandidate[];
  const baseline = createRouteLabelDataByGraph(candidates, []);
  const layers = [...baseline].map(([id, data]) => new EdgeLabelLayer({ id: `text-routeLabels${id}`, data }));
  const traversal = jest.fn(() => Array.prototype.values.call(candidates));
  Object.defineProperty(candidates, Symbol.iterator, { value: traversal });
  const focused = getDimmedGraphLayers(layers, {
    connectedNodeIds: new Set(),
    isRouted: true,
    connectedEdgeIndexes: [{ graphId: 'a', lineId: 0 }],
  });
  expect(traversal).not.toHaveBeenCalled();
  expect(focused[0].props.data).toBe(layers[0].props.data);
  expect(focused[1].props.data).toBe(layers[1].props.data);
  expect(focused.map((layer) => (layer.props.data as any[]).map((label) => label.srcGraphId))).toEqual([['a'], ['b']]);
});

it('retains skipped arc text for GPU focus promotion and marks it idle-hidden', () => {
  const arc: any = {
    skip: true,
    sourcePosition: [0, 0, 0],
    targetPosition: [20, 0, 0],
    properties: { edgeStyle: { text: 'arc' }, arcStyle: {} },
  };
  const base = new EdgeLabelLayer({ id: 'text-arcLabelsns', data: [arc], edgeLabelsAlwaysOn: true });
  const [focused] = getDimmedGraphLayers([base], {
    connectedNodeIds: new Set(),
    connectedEdgeIndexes: [{ graphId: 'ns', arcId: 0 }],
    isRouted: false,
  });
  expect(focused.props.data).toBe(base.props.data);
  const props = (focused as EdgeLabelLayer).getSubLayerProps({ id: 'characters' });
  expect(props.getLabelHighlight(arc, { index: 0 })).toEqual([0, 0]);
});
