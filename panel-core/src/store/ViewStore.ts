import { makeAutoObservable } from 'mobx';
import type { ViewState } from '../types';
export class ViewStore {
  viewState: ViewState;
  forceRefresh = 0;
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
  setVisRefresh = (revision: number) => {
    this.forceRefresh = revision;
  };
  setClusterMaxZoom = (value: number) => {
    this.clusterMaxZoom = value;
  };
}
