import React, { FC, useMemo, useCallback } from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import {Button, InlineField, InlineFieldRow, Select, VerticalGroup} from '@grafana/ui';
import {Options, MapViewConfig, GeomapInstanceState} from '../../types';
import { centerPointRegistry, MapCenterID } from '../../view';

import {NumberInput} from "../../grafana_core/app/core/components/OptionsUI/NumberInput";

import { CoordinatesMapViewEditor } from './CoordinatesMapViewEditor';
import { FitMapViewEditor } from './FitMapViewEditor';
import {Deck} from "@deck.gl/core";

export const MapViewEditor: FC<StandardEditorProps<MapViewConfig, unknown, Options, GeomapInstanceState>> = ({
  value,
  onChange,
  context,
}: StandardEditorProps<MapViewConfig, unknown, Options, GeomapInstanceState>) => {
//   const onChangeUpd = useCallback((c) => {
// context.eventBus?.publish({type: 'mapView', payload: 'update', theme: ''})
//     onChange(c)
//   }, [onChange, context.eventBus]);

  const {isLogic} = context.instanceState || {}

  const labelWidth = 10;

  const views = useMemo(() => {
    const ids: string[] = [];
    if (value?.id) {
      ids.push(value.id);
    } else {
      ids.push(centerPointRegistry.list()[0].id);
    }
    return centerPointRegistry.selectOptions(ids);
  }, [value?.id]);

  const onSetCurrentView = useCallback(() => {

    const {map, isLogic} = context.instanceState || {}
      //@ts-ignore
    const scene = (map as Deck)?.deck?.viewManager?.viewState?.[isLogic ? '3d-scene' : 'geo-view']

    if (scene) {
        const {target, longitude, latitude} = scene
        const [lon,lat] = target || [longitude, latitude];
        const zoom = scene.zoom

    if ([lon,lat,zoom].every(el=>el !==undefined)) {
          onChange({
              ...value,
              id: MapCenterID.Coordinates,
              lon: +lon.toFixed(6),
              lat: +lat.toFixed(6),
              zoom: +zoom.toFixed(2),
          });
      }
    }

      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, onChange, context.instanceState]);



    const onSelectView = useCallback(
        (selection: SelectableValue<string>) => {
            const v = centerPointRegistry.getIfExists(selection.value);
            if (v) {
                onChange({
                    ...value,
                    id: v.id,
                    lat: v.lat ?? value?.lat,
                    lon: v.lon ?? value?.lon,
                    zoom: v.zoom ?? value?.zoom,
                });
            }
        },
        [value, onChange]
    );



  return (
      <>
          <InlineFieldRow>
              <InlineField label="View" labelWidth={labelWidth} grow={true}>
                  {/*menuShouldPortal*/}
                  <Select options={views.options} value={views.current} onChange={onSelectView} />
              </InlineField>
          </InlineFieldRow>
          {value.id === MapCenterID.Coordinates && (
              <CoordinatesMapViewEditor labelWidth={labelWidth} value={value} onChange={onChange} />
          )}
          {value.id === MapCenterID.Fit && (
              <FitMapViewEditor labelWidth={labelWidth} value={value} onChange={onChange} context={context} />
          )}

          <InlineFieldRow>
              <InlineField label={value?.id === MapCenterID.Fit ? 'Max Zoom' : 'Zoom'} labelWidth={labelWidth} grow={true}>
                  <NumberInput
                      value={value?.zoom ?? 1}
                      min={isLogic ? -5 : 1}
                      max={isLogic ? 5 : 18}
                      step={0.1}
                      onChange={(v) => {
                          onChange({ ...value, zoom: v });
                      }}
                  />
              </InlineField>
          </InlineFieldRow>

          <VerticalGroup>
              <Button variant="secondary" size="sm" fullWidth onClick={onSetCurrentView}>
                  <span>Use current map settings</span>
              </Button>
          </VerticalGroup>
    </>
  );
};
