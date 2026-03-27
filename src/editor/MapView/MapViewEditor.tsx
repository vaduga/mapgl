import React, { useMemo, useCallback, useId } from 'react';
import { StandardEditorProps, SelectableValue } from '@grafana/data';
import { Button, InlineField, InlineFieldRow, Select, Stack } from '@grafana/ui';
import { NumberInput } from '../../grafana_core/app/core/components/OptionsUI/NumberInput';
import { Trans, t } from '../../utils/i18n';

import { type Options, type MapViewConfig, GeomapInstanceState } from '../../types';
import { centerPointRegistry, MapCenterID } from '../../view';

import { CoordinatesMapViewEditor } from './CoordinatesMapViewEditor';
import { FitMapViewEditor } from './FitMapViewEditor';

export const MapViewEditor = ({
  value,
  onChange,
  context,
}: StandardEditorProps<MapViewConfig, unknown, Options, GeomapInstanceState>) => {
  const { isLogic } = context.instanceState || {};
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
    const { map, isLogic } = context.instanceState || {};
    //@ts-ignore
    const scene = (map as Deck)?.deck?.viewManager?.viewState?.[isLogic ? '3d-scene' : 'geo-view'];

    if (scene) {
      const { target, longitude, latitude } = scene;
      const [lon, lat] = target || [longitude, latitude];
      const zoom = scene.zoom;

      if ([lon, lat, zoom].every((el) => el !== undefined)) {
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

  const viewInputId = useId();
  const zoomInputId = useId();

  return (
    <>
      <InlineFieldRow>
        <InlineField label={t('geomap.map-view-editor.label-view', 'View')} labelWidth={labelWidth} grow={true}>
          <Select inputId={viewInputId} options={views.options} value={views.current} onChange={onSelectView} />
        </InlineField>
      </InlineFieldRow>
      {value.id === MapCenterID.Coordinates && (
        <CoordinatesMapViewEditor labelWidth={labelWidth} value={value} onChange={onChange} />
      )}
      {value.id === MapCenterID.Fit && (
        <FitMapViewEditor labelWidth={labelWidth} value={value} onChange={onChange} context={context} />
      )}

      <InlineFieldRow>
        <InlineField
          label={
            value?.id === MapCenterID.Fit
              ? t('geomap.map-view-editor.label-max-zoom', 'Max Zoom')
              : t('geomap.map-view-editor.label-zoom', 'Zoom')
          }
          labelWidth={labelWidth}
          grow={true}
        >
          <NumberInput
            id={zoomInputId}
            value={value?.zoom ?? 1}
            min={isLogic ? -5 : 1}
            max={isLogic ? 5 : 18}
            step={0.01}
            onChange={(v) => {
              onChange({ ...value, zoom: v });
            }}
          />
        </InlineField>
      </InlineFieldRow>

      {/*<Stack direction="column">*/}
      <Button variant="secondary" size="sm" fullWidth onClick={onSetCurrentView}>
        <span>
          <Trans i18nKey="geomap.map-view-editor.use-current-map-settings">Use current map settings</Trans>
        </span>
      </Button>
      {/*</Stack>*/}
    </>
  );
};
