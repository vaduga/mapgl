import { observable } from 'mobx';
import { CommentsData } from '../utils/interfaces';

export type GraphState = {
  comments: CommentsData;
  groupCounts: Map<number, number>;
  positionRanges: Array<[number, number]>;
  version: number;
};

const graphStates = new WeakMap<object, GraphState>();

function createGraphState(): GraphState {
  return observable(
    {
      comments: {},
      groupCounts: observable.map<number, number>(),
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

export function getNodeGroupCounts(graph: object): Map<number, number> {
  return getGraphState(graph).groupCounts;
}

export function addNodeGroup(graph: object, idx: number): void {
  const groupCounts = getNodeGroupCounts(graph);
  const count = groupCounts.get(idx);
  groupCounts.set(idx, count ? count + 1 : 1);
}

export function rmNodeGroup(graph: object, idx: number): void {
  const groupCounts = getNodeGroupCounts(graph);
  const count = groupCounts.get(idx);
  if (count) {
    groupCounts.set(idx, count - 1);
  }
}

export function getGraphPositionRanges(graph: object): Array<[number, number]> {
  return getGraphState(graph).positionRanges;
}

export function setGraphPositionRanges(graph: object, positionRanges: Array<[number, number]>): void {
  getGraphState(graph).positionRanges = positionRanges;
}

export function pushGraphPositionRange(graph: object, positionRange: [number, number]): void {
  getGraphPositionRanges(graph).push(positionRange);
}

export function getGraphVersion(graph: object): number {
  return getGraphState(graph).version;
}

export function bumpGraphVersion(graph: object): void {
  getGraphState(graph).version += 1;
}

export function resetGraphState(graph: object): void {
  const state = getGraphState(graph);
  state.groupCounts.clear();
  state.positionRanges = [];
}
