import { TextLayer, PolygonLayer } from '@deck.gl/layers';
import { getDimmedGraphLayers } from './focus-layers';
import { makeScopedKey } from './GraphHighlighter';
import { createRouteLabelData, type ScopedRouteLabelCandidate } from './GeoJsonEdgesLayer/route-labels';

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
  expect(data).toHaveLength(0);
  const base = new TextLayer({ id: 'text-routeLabelsns', data, opacity: 0, getColor: [255, 255, 255, 255] });
  const [focused] = getDimmedGraphLayers([base], {
    connectedNodeIds: new Set(),
    connectedEdgeIndexes: [{ graphId: 'ns', lineId: 7 }],
    isRouted: true,
  });
  expect((focused.props.data as any[]).map((d) => d.text)).toEqual(['label-0', 'label-1']);
  expect(focused.props.opacity).toBe(1);
  expect(base.props.opacity).toBe(0);
  expect(base.props.data).toHaveLength(0);
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
