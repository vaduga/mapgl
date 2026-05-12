import { FeatSource } from 'mapLib';
import { Rule } from 'editor/Groups/rule-types';
import { FIXED_COLOR_LABEL, RGBAColor } from '~/utils';
import { getGroupRules } from 'editor/Groups/data/rules_processor';
import { FieldType } from '@grafana/data';
import { toRGB4Array } from 'utils';

type ResolvedFeatureGroup = Omit<Rule, 'color'> & {
  color?: RGBAColor;
};

type ResolvedFeatureGroupInput = Omit<Partial<Rule>, 'color'> & {
  color?: Rule['color'] | RGBAColor;
};

export function resolveFeatureGroup(args: {
  feature: any;
  featSource: FeatSource;
  allGroups: Rule[];
  theme: any;
  isFixed: boolean;
  locField: string;
  locName: string;
  hexColor: string;
  rgba: RGBAColor;
}): { group?: ResolvedFeatureGroup; createdGroup?: Rule } {
  const { feature, featSource, allGroups, theme, isFixed, locField, locName, hexColor, rgba } = args;
  const normalizeRule = (rule: ResolvedFeatureGroupInput | undefined): ResolvedFeatureGroup | undefined => {
    if (!rule) {
      return undefined;
    }

    return {
      ...rule,
      color: typeof rule.color === 'string' ? toRGB4Array(rule.color) : rule.color,
      label: rule.label ?? hexColor,
    };
  };
  const matchedRules = getGroupRules(feature, featSource.getGroups, theme, isFixed, locField, locName);
  const fixedFallbackGroup =
    isFixed &&
    featSource.getGroups.find(
      (rule) =>
        rule.isEph &&
        rule.color === hexColor &&
        rule.overrides?.some(
          (override) =>
            override.name === 'thrColor' && Array.isArray(override.value) && override.value.includes(FIXED_COLOR_LABEL)
        )
    );
  const tintModeRule =
    matchedRules.find((rule) => !rule.isEph && rule.svgTintMode !== undefined) ??
    matchedRules.find((rule) => rule.svgTintMode !== undefined);
  const baseGroup =
    matchedRules.find(
      (rule) =>
        !rule.isEph &&
        (rule.color !== undefined ||
          rule.width !== undefined ||
          rule.size !== undefined ||
          rule.iconName !== undefined ||
          rule.svgTintMode !== undefined ||
          rule.offset !== undefined)
    ) ??
    matchedRules.find((rule) => !rule.isEph) ??
    matchedRules[0];

  let group = normalizeRule(baseGroup);
  const nextThr =
    matchedRules.find((rule) => !rule.isEph && rule.color !== undefined) ??
    matchedRules.find((rule) => rule.color !== undefined);

  if (nextThr?.color) {
    if (group) {
      group.color = toRGB4Array(nextThr.color);
      group.groupIdx = nextThr.groupIdx;
    } else {
      group = normalizeRule({
        ...nextThr,
        color: toRGB4Array(nextThr.color),
      });
    }
  } else if (isFixed) {
    const fallbackGroup = normalizeRule(fixedFallbackGroup ? { ...fixedFallbackGroup, color: rgba } : undefined);
    if (group) {
      group.color = rgba;
      group.groupIdx = fallbackGroup?.groupIdx ?? group.groupIdx;
    } else {
      group = fallbackGroup;
    }
  } else {
    const thrColor = feature.thrColor ?? hexColor;
    const existingEphGroup = allGroups.find(
      (rule) =>
        rule.isEph &&
        rule.color === hexColor &&
        Array.isArray(rule.overrides) &&
        rule.overrides.some(
          (override) =>
            override.name === 'thrColor' && Array.isArray(override.value) && override.value.includes(thrColor)
        )
    );
    const newGroup: Rule = existingEphGroup ?? {
      label: hexColor,
      color: hexColor,
      isEph: true,
      groupIdx: allGroups.length,
      overrides: [
        {
          name: 'thrColor',
          type: FieldType.enum,
          value: [thrColor],
        },
      ],
    };

    if (!featSource.getGroups.includes(newGroup)) {
      featSource.addGroup(newGroup);
    }
    if (!existingEphGroup) {
      allGroups.push(newGroup);
    }

    if (group) {
      group.color = rgba;
    } else {
      group = normalizeRule({ ...newGroup, color: toRGB4Array(newGroup.color!) });
    }
    if (!group) {
      return { createdGroup: newGroup };
    }
    group.groupIdx = newGroup.groupIdx;

    group.svgTintMode = tintModeRule?.svgTintMode ?? group.svgTintMode ?? baseGroup?.svgTintMode ?? 'none';

    return { group, createdGroup: newGroup };
  }

  if (group) {
    group.svgTintMode = tintModeRule?.svgTintMode ?? group.svgTintMode ?? baseGroup?.svgTintMode ?? 'none';
  }

  return { group };
}
