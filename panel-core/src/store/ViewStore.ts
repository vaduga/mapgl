import { makeAutoObservable } from 'mobx';
import type { ViewState } from '../types';
export class ViewStore {
  viewState: ViewState;
  clusterMaxZoom = 18;
  constructor(viewState: ViewState) {
    this.viewState = viewState;
    makeAutoObservable(this);
  }
  get getViewState() {
    return this.viewState;
  }
  get getClusterMaxZoom() {
    return this.clusterMaxZoom;
  }
  setViewState = (viewState: ViewState) => {
    this.viewState = viewState;
  };
  setClusterMaxZoom = (value: number) => {
    this.clusterMaxZoom = value;
  };
}
