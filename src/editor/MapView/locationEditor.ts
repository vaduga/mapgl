import { Field, FieldType, PanelOptionsEditorBuilder, DataFrame } from '@grafana/data';
import { GazetteerPathEditor } from '../Other/GazetteerPathEditor';

import { LocationModeEditor } from './locationModeEditor';
import {ExtendFrameGeometrySource, ExtendFrameGeometrySourceMode} from "../../extension";


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
    name: 'Location Mode',
    editor: LocationModeEditor,
    settings: { data, source },
    showIf: (opts) => !isLogic,
  });

  // TODO apply data filter to field pickers
  switch (source?.mode) {
    case ExtendFrameGeometrySourceMode.Coords:
      builder
        .addFieldNamePicker({
          path: `${prefix}latitude`,
          name: 'Latitude field',
          settings: {
            filter: (f: Field) => f.type === FieldType.number,
            noFieldsMessage: 'No numeric fields found',
          },
        })
        .addFieldNamePicker({
          path: `${prefix}longitude`,
          name: 'Longitude field',
          settings: {
            filter: (f: Field) => f.type === FieldType.number,
            noFieldsMessage: 'No numeric fields found',
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
        name: 'Geohash field',
        settings: {
          filter: (f: Field) => f.type === FieldType.string,
          noFieldsMessage: 'No strings fields found',
        },
      });
      break;

    case ExtendFrameGeometrySourceMode.Lookup:
      builder
        .addFieldNamePicker({
          path: `${prefix}lookup`,
          name: 'Lookup field',
          settings: {
            filter: (f: Field) => f.type === FieldType.string,
            noFieldsMessage: 'No strings fields found',
          },
        })
        .addCustomEditor({
          id: 'gazetteer',
          path: `${prefix}gazetteer`,
          name: 'Gazetteer',
          editor: GazetteerPathEditor,
        });
  }
}
