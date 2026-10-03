import type { GraphBuiltState } from '../graph/frame/types';
import { PointStore } from './PointStore';
import { ViewStore } from './ViewStore';
import { defViewState } from '../types';
export class RootStore {
  readonly pointStore: PointStore;
  readonly viewStore = new ViewStore({ ...defViewState });
  constructor(readGraph: () => GraphBuiltState | undefined) {
    this.pointStore = new PointStore(readGraph);
  }
  onCommit(): void {
    this.pointStore.onCommit();
  }
  dispose(): void {
    this.pointStore.clear();
  }
}
