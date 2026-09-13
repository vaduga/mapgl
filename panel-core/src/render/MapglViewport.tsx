import React, { useMemo } from 'react';
import { FullscreenWidget, CompassWidget, LoadingWidget } from '@deck.gl/widgets';
import { MapView, OrbitView, type Layer } from '@deck.gl/core';
import DeckGL, { type DeckGLRef } from '@deck.gl/react';
import type { GrafanaTheme2 } from '@grafana/data';
import type { ViewState } from '../types';
import GeoBasemap from '../components/GeoBasemap';

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
  onMapLoad: () => void;
  onClick: (info: any) => void;
  theme: GrafanaTheme2;
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
  onMapLoad,
  onClick,
  theme: theme2,
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
        label: 'Calculating graph layout',
      })
    );
  }

  return (
    <DeckGL
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
        <GeoBasemap
          onLoad={onMapLoad}
          mapStyle={source}
          attributionStyle={{
            zIndex: theme2.zIndex.dropdown,
            position: 'absolute',
            right: theme2.spacing(0.5),
            bottom: theme2.spacing(0.5),
          }}
        />
      )}
    </DeckGL>
  );
}
