import { Field, FieldType, PanelOptionsEditorBuilder, DataFrame } from '@grafana/data';
import { t } from '../../utils/i18n';
import {ExtendFrameGeometrySource, ExtendFrameGeometrySourceMode} from "../../extension";
import { GazetteerPathEditor } from '../../grafana_core/app/features/geo/editor/GazetteerPathEditor';
import { LocationModeEditor } from './locationModeEditor';

export function addLocationFields<TOptions>(
    title: string,
    prefix: string,
    builder: PanelOptionsEditorBuilder<TOptions>, // ??? Perhaps pass in the filtered data?
    isLogic,
    source?: ExtendFrameGeometrySource,
    data?: DataFrame[]
) {
    builder.addCustomEditor({
        id: 'modeEditor',
        path: `${prefix}mode`,
        name: t('geo.location-editor.name-location-mode', 'Location Mode'),
        editor: LocationModeEditor,
        settings: { data, source },
        showIf: (opts) => !isLogic,
    });

    // TODO apply data filter to field pickers
    switch (source?.mode) {
        case ExtendFrameGeometrySourceMode.Coords:
            builder
                .addFieldNamePicker({
                    path: `${prefix}longitude`,
                    name: t('geo.location-editor.name-longitude-field', 'Longitude field'),
                    settings: {
                        filter: (f: Field) => f.type === FieldType.number,
                        noFieldsMessage: t('geo.location-editor.longitude-field.no-fields-message', 'No numeric fields found'),
                    },
                })
                .addFieldNamePicker({
                    path: `${prefix}latitude`,
                    name: t('geo.location-editor.name-latitude-field', 'Latitude field'),
                    settings: {
                        filter: (f: Field) => f.type === FieldType.number,
                        noFieldsMessage: t('geo.location-editor.latitude-field.no-fields-message', 'No numeric fields found'),
                    },
                });
            break;

        case ExtendFrameGeometrySourceMode.Geojson:
            builder
                .addFieldNamePicker({
                    path: 'location.geojson',
                    name: 'GeoJson field',
                    settings: {
                        filter: (f: Field) => f.type === FieldType.other,
                        noFieldsMessage: 'No GeoJson Points geometry fields found',
                    },
                })
            break;


        case ExtendFrameGeometrySourceMode.Geohash:
            builder.addFieldNamePicker({
                path: `${prefix}geohash`,
                name: t('geo.location-editor.name-geohash-field', 'Geohash field'),
                settings: {
                    filter: (f: Field) => f.type === FieldType.string,
                    noFieldsMessage: t('geo.location-editor.geohash-field.no-fields-message', 'No strings fields found'),
                },
            });
            break;

        case ExtendFrameGeometrySourceMode.Lookup:
            builder
                .addFieldNamePicker({
                    path: `${prefix}lookup`,
                    name: t('geo.location-editor.name-lookup-field', 'Lookup field'),
                    settings: {
                        filter: (f: Field) => f.type === FieldType.string,
                        noFieldsMessage: t('geo.location-editor.lookup-field.no-fields-message', 'No strings fields found'),
                    },
                })
                .addCustomEditor({
                    id: 'gazetteer',
                    path: `${prefix}gazetteer`,
                    name: t('geo.location-editor.name-gazetteer', 'Gazetteer'),
                    editor: GazetteerPathEditor,
                });
    }
}
