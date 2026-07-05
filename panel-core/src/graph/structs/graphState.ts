import { action, observable } from 'mobx';
import { CommentsData } from '@mapgl/panel-core/types';

export type GraphState = {
  comments: CommentsData;
  nodeGroupsWithNodes: Set<number>;
  positionRanges: Array<[number, number]>;
  version: number;
};

const graphStates = new WeakMap<object, GraphState>();

function createGraphState(): GraphState {
  return observable(
    {
      comments: {},
      nodeGroupsWithNodes: observable.set<number>(),
      positionRanges: [],
      version: 0,
    },
    {},
    { deep: false }
  ) as GraphState;
}

export function getGraphState(graph: object): GraphState {
  let state = graphStates.get(graph);
  if (!state) {
    state = createGraphState();
    graphStates.set(graph, state);
  }
  return state;
}

export function getGraphComments(graph: object): CommentsData {
  return getGraphState(graph).comments;
}

export function getNodeGroupsWithNodes(graph: object): Set<number> {
  return getGraphState(graph).nodeGroupsWithNodes;
}

export const markNodeGroupHasNodes = action('markNodeGroupHasNodes', (graph: object, idx: number): void => {
  getNodeGroupsWithNodes(graph).add(idx);
});

export function getGraphPositionRanges(graph: object): Array<[number, number]> {
  return getGraphState(graph).positionRanges;
}

export const setGraphPositionRanges = action(
  'setGraphPositionRanges',
  (graph: object, positionRanges: Array<[number, number]>): void => {
    getGraphState(graph).positionRanges = positionRanges;
  }
);

export const pushGraphPositionRange = action(
  'pushGraphPositionRange',
  (graph: object, positionRange: [number, number]): void => {
    getGraphPositionRanges(graph).push(positionRange);
  }
);

export function getGraphVersion(graph: object): number {
  return getGraphState(graph).version;
}

export const bumpGraphVersion = action('bumpGraphVersion', (graph: object): void => {
  getGraphState(graph).version += 1;
});

export const resetGraphState = action('resetGraphState', (graph: object): void => {
  const state = getGraphState(graph);
  state.nodeGroupsWithNodes.clear();
  state.positionRanges = [];
});
