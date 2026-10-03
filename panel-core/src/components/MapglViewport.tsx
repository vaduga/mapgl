import React, { useMemo } from 'react';
import { FullscreenWidget, CompassWidget, LoadingWidget } from '@deck.gl/widgets';
import { MapView, OrbitView, type Layer } from '@deck.gl/core';
import DeckGL, { type DeckGLRef } from '@deck.gl/react';
import type { ViewState } from '../types';
import GeoBasemap, { type GeoBasemapProps } from './GeoBasemap';

class AutolayoutLoadingWidget extends LoadingWidget {
  onRedraw(): void {}
}

export interface MapglViewportProps {
  isLogic: boolean;
  layoutInProgress: boolean;
  localViewState: ViewState;
  fullscreenContainer?: HTMLElement | null;
  deckRef: React.RefObject<DeckGLRef | null>;
  renderedLayers: Layer[];
  source: any;
  mapLibreAssets: GeoBasemapProps['assets'];
  onMapLoad: () => void;
  onClick: (info: any) => void;
  classes: Record<string, string>;
  host?: { controlled: boolean; onViewStateChange?: (change: any) => void };
  inertia?: boolean;
}

export function MapglViewport({
  isLogic,
  layoutInProgress,
  localViewState,
  fullscreenContainer,
  deckRef,
  renderedLayers,
  source,
  mapLibreAssets,
  onMapLoad,
  onClick,
  classes: s,
  host,
  inertia = true,
}: MapglViewportProps) {
  const viewId = isLogic ? '3d-scene' : 'geo-view';
  const views = useMemo(
    () => [isLogic ? new OrbitView({ id: viewId, controller: true }) : new MapView({ id: viewId, controller: true })],
    [isLogic, viewId]
  );
  const deckViewState = useMemo(() => ({ [viewId]: localViewState }), [viewId, localViewState]);

  const widgets: any = [
    new FullscreenWidget({
      id: 'myfull',
      container: fullscreenContainer ?? undefined,
      placement: 'top-right',
      className: s.fullscreen,
    }),
  ];
  if (!isLogic) {
    widgets.push(
      new CompassWidget({
        id: 'compass',
        placement: 'top-right',
        className: s.compass,
      })
    );
  }
  if (layoutInProgress) {
    widgets.push(
      new AutolayoutLoadingWidget({
        id: 'autolayout-loading',
        placement: 'top-left',
        className: s.layoutLoading,
        label: 'Computing layout',
      })
    );
  }

  return (
    <DeckGL
      onLoad={onMapLoad}
      widgets={widgets}
      views={views}
      ref={deckRef}
      layers={renderedLayers}
      initialViewState={host?.controlled ? null : deckViewState}
      viewState={host?.controlled ? deckViewState : null}
      onViewStateChange={host?.controlled ? host.onViewStateChange : undefined}
      eventRecognizerOptions={{
        click: { interval: 0 },
      }}
      controller={{
        dragMode: 'pan',
        dragRotate: !isLogic,
        doubleClickZoom: false,
        scrollZoom: { smooth: false, speed: 0.005 },
        inertia,
      }}
      onClick={onClick}
      getCursor={(state) => (state.isHovering ? 'pointer' : 'grab')}
    >
      {!isLogic && !host?.controlled && source !== 'yamaps' && (
        <GeoBasemap assets={mapLibreAssets} onLoad={onMapLoad} mapStyle={source} />
      )}
    </DeckGL>
  );
}
