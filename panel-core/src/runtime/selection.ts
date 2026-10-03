import { Graph, findEdge, getNodeData, type Edge, type Node } from '../graph/main';
import type { ViewState } from '../types';

export interface SelectionRequest {
  readonly nodeId?: string;
  readonly edgeId?: string;
  readonly namespaceId?: string;
  readonly select?: boolean;
  readonly fly?: boolean;
  readonly zoomIn?: boolean;
  readonly coordinates?: readonly number[];
}

export function resolveSelection(
  graph: Graph,
  request: SelectionRequest,
  resolveEdge: (graph: Graph, id: string) => Edge | undefined = findEdge
): { node?: Node; edge?: Edge } {
  const namespace = request.namespaceId
    ? [graph, ...graph.subgraphsBreadthFirst()].find((item) => item.id === request.namespaceId)
    : undefined;
  const node = namespace
    ? ((request.nodeId ? namespace.findNode(request.nodeId) : undefined) ?? namespace)
    : request.nodeId
      ? graph.findNodeRecursive(request.nodeId)
      : undefined;
  let edge: Edge | undefined;
  if (request.edgeId) {
    if (namespace) {
      edge = resolveEdge(namespace, request.edgeId);
    } else {
      for (const candidate of graph.deepEdges) {
        if (candidate.id === request.edgeId) {
          edge = candidate;
          break;
        }
      }
    }
  }
  return { node: node || undefined, edge };
}

export function selectionViewport(
  request: SelectionRequest,
  node: Node | undefined,
  positions: ArrayLike<number>,
  isLogic: boolean,
  currentZoom?: number
): (ViewState & { transitionDuration: number }) | undefined {
  const index = node && !(node instanceof Graph) ? getNodeData(node)?.wasmId : undefined;
  const longitude = request.coordinates?.[0] ?? (index !== undefined ? positions[index * 2] : undefined);
  const latitude = request.coordinates?.[1] ?? (index !== undefined ? positions[index * 2 + 1] : undefined);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    return undefined;
  }
  const mapZoom = request.zoomIn ? (isLogic ? 1.5 : 18) : currentZoom;
  const zoom = mapZoom === undefined ? 18 : Number.isNaN(mapZoom) ? 2 : mapZoom;
  return {
    longitude: longitude!,
    latitude: latitude!,
    transitionDuration: 250,
    rotationX: -90,
    zoom,
    yZoom: zoom + 1,
    target: [longitude!, latitude!, isLogic ? 0 : zoom],
  };
}
