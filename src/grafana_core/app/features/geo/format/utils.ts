

import { Field, FieldConfig, FieldType } from '@grafana/data';
//import { getCenterPoint } from 'app/features/transformers/spatial/utils';

import { Gazetteer } from '../gazetteer/gazetteer';

import { decodeGeohash } from './geohash';
import {getCenterPoint} from "../../transformers/spatial/utils";



const hiddenTooltipField: FieldConfig = Object.freeze({
  custom: {
    hideFrom: { tooltip: true },
  },
});
