import { getAppEvents } from '@grafana/runtime';
import { MapViewConfig } from '@mapgl/panel-core/types';
import { centerPointRegistry, MapCenterID } from '@mapgl/panel-core/view';
import { Position } from 'geojson';
import { WebMercatorViewport } from '@deck.gl/core';
import { denormalizeZoom, getLayerFitBounds, getLogicFitBounds } from '@mapgl/panel-core/utils';
import type { ViewState } from '@mapgl/panel-core/types';
import { AppEvents } from '@grafana/data';

function initViewExtent(view: ViewState, config: MapViewConfig, width, height, layers, visLayers, panel) {
  const v: any = centerPointRegistry.getIfExists(config.id);
  if (v) {
    let { lon, lat, zoom } = v;
    let coord: Position | undefined = undefined;
    if (v.lat == null) {
      // maplibre can''t handle nuls
      if (v.id === MapCenterID.Coordinates) {
        coord = [config.lon ?? 0, config.lat ?? 0];
      } else if (v.id === MapCenterID.Fit) {
        const viewport = new WebMercatorViewport({ width, height });

        let minLng, minLat, maxLng, maxLat;
        const configZoom = config.zoom ?? config.maxZoom;
        const maxZoom = configZoom && configZoom > 0 ? configZoom : 18;

        const visNamespaces = visLayers.getVisibleNamespaces();
        [minLng, minLat, maxLng, maxLat] =
          (panel.isLogic
            ? getLogicFitBounds(panel, visNamespaces, width, height)
            : getLayerFitBounds(panel, layers, config, visNamespaces, width, height)) || [];

        if ([minLng, minLat, maxLng, maxLat].every((el) => el !== undefined)) {
          const bounds = [
            [minLng, minLat],
            [maxLng, maxLat],
          ] as [[number, number], [number, number]];
          const padding = config.padding ?? 5;

          try {
            const denormalizedZoom = denormalizeZoom(!panel.isLogic, maxZoom);
            ({
              longitude: lon,
              latitude: lat,
              zoom,
            } = viewport.fitBounds(bounds, {
              maxZoom: denormalizedZoom,
              padding,
            }));
          } catch (e) {
            // console.log(`fit bounds for maxZoom ${maxZoom} and padding ${padding} error: `, e)
            const appEvents = getAppEvents();
            appEvents.publish({
              type: AppEvents.alertWarning.name,
              payload: [`fit bounds for maxZoom ${maxZoom} and padding ${padding} error: out of bounds?`],
            });
          }
        }

        // if no query points in auto mode
        if (!lon) {
          ({ lon, lat, zoom } = v);
        }
        coord = [lon ?? 0, lat ?? 0];
      } else {
        // TODO: view requires special handling
      }
    } else {
      coord = [v?.lon ?? 0, v?.lat ?? 0];
    }

    if (coord) {
      view.longitude = coord[0];
      view.latitude = coord[1];
    }
    if (zoom !== undefined) {
      view.zoom = zoom;
      view.yZoom = zoom + 1;
    }
  }

  if (config.maxZoom) {
    view.maxZoom = config.maxZoom;
  }
  if (config.minZoom !== undefined) {
    view.minZoom = config.minZoom;
  }
  if (config.zoom && v?.id !== MapCenterID.Fit) {
    view.zoom = config.zoom;
    view.yZoom = config.zoom + 1;
  }

  if ([view.longitude, view.latitude, view.zoom].every((el) => el !== undefined)) {
    view.target = [view.longitude, view.latitude, view.zoom!]; // for ortho logic view
  }
}

export { initViewExtent };
