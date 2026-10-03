import type { GraphEdgeIndex } from '../graph/GraphEdgeIndex';
import type { EdgeRenderIndex } from '../graph/utils/utils.graph-geom';
import { makeAutoObservable } from 'mobx';
import { findEdge, getGraphData, getNodeData, Graph, type Edge, type Node } from '../graph/main';
import { colTypes, type QueryHost, type Info, type ViewState } from '../types';
import { blankHoverInfo } from '../types/defaults';
import type { GraphBuiltState } from '../graph/frame/types';
import { GraphHighlighter } from '../deckLayers/GraphHighlighter';

export interface ElementKey {
  readonly id: string;
  readonly namespaceId: string;
}
export type SelectedIndexes = Map<string, Record<string, number[]> | number[]>;
export type FocusRef = ElementKey & { readonly kind: 'node' | 'edge' };

const keyOfNode = (node: Node): ElementKey => ({
  id: node.id,
  namespaceId: String((node.parent as Graph | undefined)?.id ?? ''),
});
const keyOfEdge = (edge: Edge): ElementKey => ({
  id: edge.id,
  namespaceId: String((edge.source.parent as Graph | undefined)?.id ?? ''),
});

/** Selection and focus survive object replacement by retaining semantic keys. */
export class PointStore {
  mode: 'modify' | 'view' = 'view';
  editable = false;
  isDrawerOpen = false;
  isShowCenter: ViewState | undefined = undefined;
  commentOpenIdx = -1;
  selCoord:
    | {
        coordinates: [number, number];
        type: 'Point';
      }
    | undefined = undefined;
  log: QueryHost[] = [];

  tooltipObject: Info = blankHoverInfo;
  logTooltipObject: Info = blankHoverInfo;

  private selectedKey: ElementKey | undefined = undefined;
  private selectedEdgeKeys: ElementKey[] = [];
  private focusedEdgeKeys: ElementKey[] = [];
  focusedNodeId: string | null = null;
  focusedNodeGraphId: string | null = null;
  focusedEdgeId: string | null = null;
  focusedEdgeGraphId: string | null = null;
  isEdgeListed = false;
  isReversed = false;
  focusRevision = 0;
  graphRevision = 0;
  readonly graphHighlighter = new GraphHighlighter();
  private renderer?: {
    edgeIndex: GraphEdgeIndex;
    revision: number;
    mappings: ReadonlyArray<EdgeRenderIndex | undefined>;
    bounds: readonly string[];
  };

  setRenderIndexes(
    edgeIndex: GraphEdgeIndex,
    mappings: ReadonlyArray<EdgeRenderIndex | undefined>,
    bounds: readonly string[] = []
  ): void {
    this.renderer = { edgeIndex, revision: edgeIndex.revision, mappings, bounds };
    this.refreshGraphHighlighter();
  }

  renderIndex(edge: Edge): EdgeRenderIndex | undefined {
    const index = this.readGraph()?.edgeIndex;
    const ref = index?.getEdgeRef(edge);
    return index === this.renderer?.edgeIndex && index?.revision === this.renderer?.revision && ref !== undefined
      ? this.renderer?.mappings[ref]
      : undefined;
  }

  private get renderMappings() {
    return this.readGraph()?.edgeIndex === this.renderer?.edgeIndex &&
      this.renderer?.edgeIndex.revision === this.renderer?.revision
      ? this.renderer?.mappings
      : undefined;
  }

  constructor(private readonly readGraph: () => GraphBuiltState | undefined) {
    makeAutoObservable(this, { readGraph: false, graphHighlighter: false, renderer: false } as any, { autoBind: true });
  }
  get getIsShowCenter() {
    return this.isShowCenter;
  }

  setIsShowCenter = (viewState: ViewState | undefined) => {
    this.isShowCenter = viewState;
  };

  get getMode(): string {
    return this.mode;
  }

  get getEditable() {
    return this.editable;
  }

  setEditable = (editable: boolean) => {
    this.editable = editable;
  };

  get getCommentOpenIdx() {
    return this.commentOpenIdx;
  }

  get getisDrawerOpen() {
    return this.isDrawerOpen;
  }

  get getLog() {
    return this.log;
  }

  setLog = (payload: QueryHost[]) => {
    this.log = payload;
    if (this.log.length > 10) {
      this.log.splice(10);
    }
  };

  addLog = (point: QueryHost) => {
    this.log.unshift(point);
    if (this.log.length > 100) {
      this.log.pop();
    }
  };

  setMode = (mode: 'modify' | 'view') => {
    this.mode = mode;
  };

  setCommentOpenIdx = (i: number) => {
    this.commentOpenIdx = i;
  };

  setDrawerOpen = (flag: boolean) => {
    this.isDrawerOpen = flag;
  };

  setLogTooltipObject = (info: any) => {
    this.logTooltipObject = {
      ...info.object,
      cluster: false,
      object: info.object ?? {},
    };
  };

  get getSelCoord() {
    return this.selCoord;
  }

  setSelCoord = (newSelCoord: { coordinates: [number, number]; type: 'Point' } | undefined) => {
    this.selCoord = newSelCoord;
  };

  get getTooltipObject() {
    return this.tooltipObject;
  }

  setTooltipObject = (info: any) => {
    this.tooltipObject = info;
  };

  private graph(namespaceId: string): Graph | undefined {
    const root = this.readGraph()?.graph;
    return (
      root && ([root, ...root.subgraphsBreadthFirst()].find((graph) => graph.id === namespaceId) as Graph | undefined)
    );
  }
  select(key?: ElementKey, pickedEdges: Edge[] = []): void {
    const node = key ? this.graph(key.namespaceId)?.findNode(key.id) : undefined;
    if (node || !key) {
      this.setSelectedNode(node, pickedEdges);
    } else {
      this.selectedKey = key;
    }
  }
  get getSelectedNode(): Node | null {
    void this.graphRevision;
    const key = this.selectedKey;
    return key ? (this.graph(key.namespaceId)?.findNode(key.id) ?? null) : null;
  }
  private edges(keys: readonly ElementKey[]): Edge[] {
    void this.graphRevision;
    return keys.flatMap((key) => {
      const graph = this.graph(key.namespaceId);
      const edge = graph && findEdge(graph, key.id);
      return edge ? [edge] : [];
    });
  }
  get getSelEdges(): Edge[] {
    return this.edges(this.selectedEdgeKeys);
  }
  get focusedEdges(): Edge[] {
    return this.edges(this.focusedEdgeKeys);
  }
  set focusedEdges(edges: Edge[]) {
    this.focusedEdgeKeys = edges.map(keyOfEdge);
  }
  get isDefDir() {
    return !this.isReversed;
  }
  setIsDefDir = (isDefDir: boolean) => {
    if (this.isDefDir === isDefDir) {
      return;
    }

    this.isReversed = !isDefDir;
    if (this.focusedNodeId || this.focusedEdgeId) {
      this.refreshGraphHighlighter();
    }
  };

  get getHasFocusHighlight() {
    return Boolean(this.focusedNodeId || this.focusedEdgeId || this.focusedEdges.length);
  }

  get getFocusRevision() {
    return this.focusRevision;
  }

  get getFocusedConnectedNodeIds() {
    void this.focusRevision;
    return this.graphHighlighter.getConnectedNodeIds();
  }

  get getFocusedConnectedEdgeIndexes() {
    void this.focusRevision;
    return this.graphHighlighter.getConnectedEdgeIndexes();
  }

  setSelEdges = (edges: Edge[]) => {
    this.selectedEdgeKeys = edges.map(keyOfEdge);
  };

  setFocusedNodeId = (nodeId: string | null, graphId?: string | null) => {
    const graph = this.readGraph();
    if (!graph) {
      return;
    }
    this.graphHighlighter.setGraph(graph.graph, { edgeIndex: graph.edgeIndex, mappings: this.renderMappings });

    const nextGraphId = graphId ?? null;
    if (this.focusedNodeId === nodeId && this.focusedNodeGraphId === nextGraphId && !this.focusedEdgeId) {
      return;
    }

    this.focusedNodeId = nodeId;
    this.focusedNodeGraphId = nextGraphId;
    this.focusedEdgeId = null;
    this.focusedEdgeGraphId = null;
    this.focusedEdges = [];
    this.graphHighlighter.update({ sourceId: nodeId, graphId: nextGraphId, maxDepth: 1, isDefDir: this.focusIsDefDir });
    this.focusRevision += 1;
  };

  setFocusedEdgeId = (edgeId: string | null, graphId?: string | null) => {
    const graph = this.readGraph();
    if (!graph) {
      return;
    }
    this.graphHighlighter.setGraph(graph.graph, { edgeIndex: graph.edgeIndex, mappings: this.renderMappings });

    const nextGraphId = graphId ?? null;
    if (this.focusedEdgeId === edgeId && this.focusedEdgeGraphId === nextGraphId && !this.focusedNodeId) {
      return;
    }

    this.focusedNodeId = null;
    this.focusedNodeGraphId = null;
    this.focusedEdgeId = edgeId;
    this.focusedEdgeGraphId = nextGraphId;
    this.focusedEdges = [];
    this.graphHighlighter.updateEdge({ edgeId, graphId: nextGraphId });
    this.focusRevision += 1;
  };

  setFocusedEdges = (edges: Edge[]) => {
    const graph = this.readGraph();
    if (!graph) {
      return;
    }
    this.graphHighlighter.setGraph(graph.graph, { edgeIndex: graph.edgeIndex, mappings: this.renderMappings });

    this.focusedNodeId = null;
    this.focusedNodeGraphId = null;
    this.focusedEdgeId = null;
    this.focusedEdgeGraphId = null;
    this.focusedEdges = edges;
    this.graphHighlighter.updateEdges(edges);
    this.focusRevision += 1;
  };

  refreshGraphHighlighter = () => {
    const graph = this.readGraph();
    if (!graph) {
      return;
    }
    this.graphHighlighter.setGraph(graph.graph, {
      force: true,
      edgeIndex: graph.edgeIndex,
      mappings: this.renderMappings,
    });
    if (this.focusedEdges.length) {
      this.graphHighlighter.updateEdges(this.focusedEdges);
    } else if (this.focusedEdgeId) {
      this.graphHighlighter.updateEdge({ edgeId: this.focusedEdgeId, graphId: this.focusedEdgeGraphId });
    } else {
      this.graphHighlighter.update({
        sourceId: this.focusedNodeId,
        graphId: this.focusedNodeGraphId,
        maxDepth: 1,
        isDefDir: this.focusIsDefDir,
      });
    }
    this.focusRevision += 1;
  };

  setFocusedElement = (nodeId: string | null, edgeId: string | null) => {
    if (nodeId) {
      this.setFocusedNodeId(nodeId);
    } else {
      this.setFocusedEdgeId(edgeId);
    }
  };

  setEdgeListed = (flag) => {
    if (this.isEdgeListed === flag) {
      return;
    }

    this.isEdgeListed = flag;
    if (this.focusedNodeId) {
      this.refreshGraphHighlighter();
    }
  };

  get getisEdgeListed() {
    return this.isEdgeListed;
  }

  private get focusIsDefDir(): boolean | null {
    return this.isEdgeListed ? this.isDefDir : null;
  }

  get getSelectedIdxs(): SelectedIndexes {
    return this.selectedIndexes();
  }

  selectedIndexes(allowUnindexedEdges = true): SelectedIndexes {
    const selectedIds: SelectedIndexes = new Map();
    const selectedNode = this.getSelectedNode;
    const dataRecord =
      selectedNode instanceof Graph ? getGraphData(selectedNode) : selectedNode ? getNodeData(selectedNode) : undefined;
    if (!dataRecord) {
      return selectedIds;
    }
    const selFeatLayerName = (selectedNode?.parent as Graph).id;
    const index = dataRecord.idx;
    const selEdges = this.getSelEdges;

    if (selectedNode instanceof Graph) {
      const boundIndex = this.renderer?.bounds.indexOf(selectedNode.id) ?? -1;
      if (boundIndex >= 0) {
        selectedIds.set(colTypes.Bboxes, [boundIndex]);
      }
    }
    if (index !== undefined) {
      const prevNodes = selectedIds.get(colTypes.Nodes) as Record<string, number[]> | undefined;

      if (!(selectedNode instanceof Graph)) {
        selectedIds.set(colTypes.Nodes, {
          ...prevNodes,
          [selFeatLayerName]: [index],
        });
      }

      if (selEdges?.length) {
        const edgesByLayer = selEdges.reduce<Record<string, number[]>>((acc, e) => {
          if (e.id == null) {
            return acc;
          }
          const layerId = String((e.source.parent as Graph).id);
          const edgeRef = this.readGraph()!.edgeIndex.getEdgeRef(e);
          if (edgeRef === undefined && !allowUnindexedEdges) {
            return acc;
          }
          const recordRef =
            edgeRef === undefined ? e.data.recordRef : this.readGraph()!.edgeIndex.getEdgeRecordRef(edgeRef);
          const lineIds = [...this.readGraph()!.edgeIndex.recordEdges(recordRef)]
            .map((edge) => this.renderIndex(edge)?.lineId)
            .filter((id: any): id is number => typeof id === 'number');

          if (lineIds.length) {
            (acc[layerId] ??= []).push(...lineIds);
          }
          return acc;
        }, {});
        selectedIds.set(colTypes.Edges, edgesByLayer);
      }
    }
    return selectedIds;
  }

  setSelectedNode = (node: Node | undefined | null, pickedEdges: Edge[] = []) => {
    this.selectedKey = node ? keyOfNode(node) : undefined;
    if (pickedEdges.length > 1) {
      this.setFocusedEdges(pickedEdges);
    } else if (pickedEdges[0]) {
      this.setFocusedEdgeId(pickedEdges[0].id, String((pickedEdges[0].source.parent as Graph)?.id ?? ''));
    } else if (node) {
      this.setFocusedNodeId(node.id, String((node.parent as Graph)?.id ?? ''));
    } else {
      this.setFocusedElement(null, null);
    }

    const selNode = this.getSelectedNode;

    const graph = this.readGraph();
    if (!graph) {
      return;
    }
    this.graphHighlighter.setGraph(graph.graph, { edgeIndex: graph.edgeIndex, mappings: this.renderMappings });
    const edgeGroups = this.isDefDir
      ? this.graphHighlighter.getOutEdgeGroups(selNode)
      : this.graphHighlighter.getInEdgeGroups(selNode);
    if (!edgeGroups.length && !pickedEdges?.length) {
      this.setSelEdges([]);
      return;
    }

    const edges = selNode && edgeGroups.map((edges) => edges[0]).filter((edge) => edge !== undefined);

    const selEdges = pickedEdges?.length ? pickedEdges : node && Array.isArray(edges) && edges.length ? edges : [];
    this.setSelEdges(selEdges);
  };

  focus(ref?: FocusRef): void {
    if (ref?.kind === 'node') {
      this.setFocusedNodeId(ref.id, ref.namespaceId);
    } else {
      this.setFocusedEdgeId(ref?.id ?? null, ref?.namespaceId);
    }
  }

  onCommit(): void {
    this.graphRevision++;
    if (!this.readGraph()) {
      this.clear();
      this.graphHighlighter.updateEdges([]);
      return;
    }
    this.refreshGraphHighlighter();
  }
  clear(): void {
    this.selectedKey = undefined;
    this.selectedEdgeKeys = [];
    this.focusedEdgeKeys = [];
    this.focusedNodeId = this.focusedEdgeId = null;
    this.focusedNodeGraphId = this.focusedEdgeGraphId = null;
    this.focusRevision++;
  }
}
