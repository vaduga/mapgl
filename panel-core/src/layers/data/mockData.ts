import { DataFrame, FieldType } from '@grafana/data';
import { TextDimensionMode } from '@grafana/schema';

import { MOC_LOC_FIELD } from '../../types/defaults';

export const mockTextConfig = {
  field: MOC_LOC_FIELD,
  fixed: '',
  mode: TextDimensionMode.Field,
};

export const mockEdgeGraphData: DataFrame = {
  name: 'mock-edge-graph',
  length: 8,
  fields: [
    {
      name: 'edgeId',
      type: FieldType.string,
      config: {},
      values: ['e-1', 'e-2', 'e-3', 'e-4', null, null, null, null],
    },
    {
      name: MOC_LOC_FIELD,
      type: FieldType.string,
      config: {},
      values: ['root', 'root', 'root', 'root', 'child-2', 'child-2', 'child-2', 'child-1'],
    },
    {
      name: 'target',
      type: FieldType.string,
      config: {},
      values: ['child-2', 'child-2', 'child-2', 'child-1', null, null, null, null],
    },
  ],
};
