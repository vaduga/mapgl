import { Graph } from '../graph/main';
import { colTypes } from '../types';
import { joinNsParts, splitNsId } from '../graph/utils/utils.graph';
import { VisLayers } from './VisLayers';
import type { DerivedVisLayerSpec } from '../extension-points/contracts';

export interface VisibilityInput {
  graph: Graph;
  groupCount: number;
  isLogic: boolean;
  isRouted: boolean;
  dataLayers: ReadonlyArray<{ name: string; type: string }>;
  derivedLayers?: readonly DerivedVisLayerSpec[];
}

export function createVisibility({
  graph,
  groupCount,
  isLogic,
  isRouted,
  dataLayers,
  derivedLayers,
}: VisibilityInput): VisLayers {
  const visLayers = new VisLayers();
  const userLayers: Record<string, number> = {};
  const nodeLayers = dataLayers.filter((layer) => layer.type === colTypes.Markers);
  const userColTypes = [...new Set((isLogic ? nodeLayers : dataLayers).map((layer) => layer.type))];
  userColTypes.forEach((type) => {
    userLayers[type] = visLayers.addLayer(type, type, type, false, true, false, null, false);
  });
  dataLayers.forEach((layer) => {
    const parentIdx = userLayers[layer.type];
    if (parentIdx !== undefined) {
      visLayers.addLayer(layer.name, layer.name, layer.type, false, true, false, parentIdx, false);
    }
  });
  if (nodeLayers.length) {
    createDerivedLayers(visLayers, graph, isLogic, isRouted, derivedLayers);
  }
  visLayers.setActiveGroups(new Uint8Array(groupCount).fill(1));
  return visLayers;
}

export function createDerivedLayers(
  visLayers: VisLayers,
  graph: Graph,
  isLogic: boolean,
  isRouted: boolean,
  derivedLayers: readonly DerivedVisLayerSpec[] = []
): void {
  const graphs: Graph[] = [graph].concat(Array.from(graph.subgraphsBreadthFirst()) as Graph[]);

  const idToLayerIdx = new Map<string, number>();
  const graphIdx = visLayers.addLayer('graph', 'graph', 'graph', false, true, false, null, false);

  for (const g of graphs) {
    const id = g.id;
    const segments = splitNsId(id);
    const label = segments[segments.length - 1];
    const parentId = segments.length > 1 ? joinNsParts(segments.slice(0, -1)) : 'graph';
    const parentIdx = parentId !== 'graph' ? idToLayerIdx.get(parentId) : graphIdx;

    const layerIdx = visLayers.addLayer(label, id, parentId, false, true, false, parentIdx ?? null, false);

    idToLayerIdx.set(id, layerIdx);
  }

  const parentIdx = null;
  derivedLayers.forEach((layer) => {
    visLayers.addLayer(
      layer.label,
      layer.name,
      layer.group,
      layer.fold ?? false,
      layer.visible,
      layer.indeterminate ?? false,
      layer.parentIndex ?? parentIdx,
      layer.combine ?? false
    );
  });
  visLayers.addLayer(colTypes.Circle, colTypes.Circle, colTypes.Circle, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.SVG, colTypes.SVG, colTypes.SVG, false, true, false, parentIdx, false);
  visLayers.addLayer(colTypes.Label, colTypes.Label, colTypes.Label, false, true, false, parentIdx, false);
  if (!isLogic) {
    visLayers.addLayer(colTypes.Comments, colTypes.Comments, colTypes.Comments, false, true, false, parentIdx, false);
  }
  visLayers.addLayer(colTypes.Edges, colTypes.Edges, colTypes.Edges, false, true, false, parentIdx, false);

  visLayers.addLayer(colTypes.Routed, colTypes.Routed, colTypes.Routed, false, isRouted, false, parentIdx, false);
}
