import type { FeatSource } from '../../../graph/FeatSource';
import type { Rule } from '../ruleTypes';
import { FieldType } from '@grafana/data';
import { FIXED_COLOR_LABEL } from '../../../types/defaults';

import { resolveFeatureGroup } from './group-resolve';

describe('resolveFeatureGroup', () => {
  it('creates a fixed-color fallback group when raw layer config did not initialize one', () => {
    const sourceGroups: Rule[] = [];
    const featSource = {
      getGroups: sourceGroups,
      addGroup: (group: Rule) => sourceGroups.push(group),
    } as unknown as FeatSource;
    const allGroups: Rule[] = [];

    const { group } = resolveFeatureGroup({
      feature: {},
      featSource,
      allGroups,
      theme: {},
      isFixed: true,
      locField: 'name',
      locName: 'node-1',
      hexColor: '#008000',
      rgba: [0, 128, 0, 255],
    });

    expect(group).toEqual(
      expect.objectContaining({
        color: [0, 128, 0, 255],
        groupIdx: 0,
        isEph: true,
      })
    );
    expect(sourceGroups).toEqual(allGroups);
  });

  it('keeps fixed-color fallback groups isolated between layers', () => {
    const sourceGroups: Rule[] = [];
    const featSource = {
      getGroups: sourceGroups,
      addGroup: (group: Rule) => sourceGroups.push(group),
    } as unknown as FeatSource;
    const legendGroup: Rule = {
      label: 'fix-#008000',
      color: '#008000',
      isEph: true,
      groupIdx: 0,
      overrides: [{ name: 'thrColor', type: FieldType.enum, value: [FIXED_COLOR_LABEL] }],
    };
    const allGroups = [legendGroup];

    const { group } = resolveFeatureGroup({
      feature: {},
      featSource,
      allGroups,
      theme: {},
      isFixed: true,
      locField: 'name',
      locName: 'node-1',
      hexColor: '#008000',
      rgba: [0, 128, 0, 255],
    });

    expect(group.groupIdx).toBe(1);
    expect(sourceGroups).toHaveLength(1);
    expect(sourceGroups[0]).not.toBe(legendGroup);
    expect(allGroups).toEqual([legendGroup, sourceGroups[0]]);
  });
});
