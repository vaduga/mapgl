import React, { useEffect, useState } from 'react';
import { Button, CollapsableSection, IconButton, useStyles2 } from '@grafana/ui';
import { v4 as uuidv4 } from 'uuid';
import { defaultGroup, OverrideTracker, Rule, RuleTracker } from './rule-types';
import { RuleItem } from './RuleItem';
import { GrafanaTheme2, StandardEditorProps } from '@grafana/data';
import { css } from '@emotion/css';
import { getNextGroupName } from '../../utils/geomap_utils';

type Props = StandardEditorProps<Rule[]>;

export const GroupsEditor = ({ onChange, item, ...props }: Props) => {
  const { disabled } = item.settings || {};
  const s = useStyles2(svgIconsFieldStyles);
  const [tracker, _setTracker] = useState<RuleTracker[]>([]);
  const context = props.context;

  useEffect(() => {
    const groups = props.value ?? props.context.options?.config?.groups ?? [];
    const items: RuleTracker[] = [];

    groups.forEach((value: Rule, index: number) => {
      items[index] = {
        rule: value,
        order: index,
        ID: uuidv4(),
      };
    });

    _setTracker(items);
  }, [props.context.options?.config?.groups, props.value]);

  const setRules = (val: Rule[]) => {
    onChange(val as any);
  };

  const setTracker = (v: RuleTracker[]) => {
    _setTracker(v);
    const allRules: Rule[] = [];
    v.forEach((element) => {
      allRules.push(element.rule);
    });
    setRules(allRules);
  };

  const updateTrackerRule = (index: number, update: (rule: Rule) => Rule) => {
    setTracker(
      tracker.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              rule: update(entry.rule),
            }
          : entry
      )
    );
  };

  const updateRuleOverrides = (index: number, overrides: OverrideTracker) => {
    if (!overrides) {
      return;
    }

    updateTrackerRule(index, (rule) => ({ ...rule, overrides }));
  };

  const updateRuleColor = (index: number, color: string) => {
    updateTrackerRule(index, (rule) => ({ ...rule, color }));
  };

  const updateRuleLabel = (index: number, label: string) => {
    updateTrackerRule(index, (rule) => ({ ...rule, label }));
  };

  const updateLineWidth = (index: number, width: number) => {
    updateTrackerRule(index, (rule) => ({ ...rule, lineWidth: width }));
  };

  const updateNodeSize = (index: number, size: number) => {
    updateTrackerRule(index, (rule) => ({ ...rule, nodeSize: size }));
  };

  const updateIconSize = (index: number, size: number) => {
    updateTrackerRule(index, (rule) => ({ ...rule, iconSize: size }));
  };

  const updateIconCollapsed = (index: number) => {
    updateTrackerRule(index, (rule) => ({ ...rule, collapse: !rule.collapse }));
  };

  const updateIconVOffset = (index: number, size: number) => {
    updateTrackerRule(index, (rule) => ({ ...rule, iconVOffset: size }));
  };

  const updateIconName = (index: number, name: string) => {
    updateTrackerRule(index, (rule) => ({ ...rule, iconName: name }));
  };

  const removeRule = (index: number) => {
    const allRules = [...tracker];
    let removeIndex = 0;
    for (let i = 0; i < allRules.length; i++) {
      if (allRules[i].order === index) {
        removeIndex = i;
        break;
      }
    }
    allRules.splice(removeIndex, 1);
    // reorder
    for (let i = 0; i < allRules.length; i++) {
      allRules[i].order = i;
    }
    setTracker([...allRules]);
  };

  const addItem = () => {
    const order = tracker.length;
    const label = getNextGroupName(tracker);
    const aRule: Rule = defaultGroup(label);
    const aTracker: RuleTracker = {
      rule: aRule,
      order: order,
      ID: uuidv4(),
    };
    setTracker([...tracker, aTracker]);
  };

  return (
    <>
      <div className={s.wrapper}>
        <Button
          className={s.addBtn}
          size="sm"
          fullWidth
          disabled={disabled}
          fill="solid"
          variant="secondary"
          icon="plus"
          onClick={addItem}
        >
          Add group
        </Button>
      </div>

      {tracker &&
        tracker.map((tracker: RuleTracker, index: number) => {
          return (
            <CollapsableSection
              key={index}
              isOpen={!!tracker.rule.collapse}
              label={
                <span>
                  {/*{index + 1}*/}
                  {tracker.rule.label ?? 'rule'}
                  <>&nbsp;</>
                  <IconButton
                    disabled={disabled}
                    key="deleteRule"
                    variant="secondary"
                    name="trash-alt"
                    tooltip="delete icon rule"
                    onClick={(e) => {
                      removeRule(index);
                      e.stopPropagation();
                    }}
                  />
                </span>
              }
              onToggle={() => updateIconCollapsed(index)}
            >
              <RuleItem
                disabled={disabled || false}
                key={`rule-item-index-${tracker.ID}`}
                ID={tracker.ID}
                rule={tracker.rule}
                colorSetter={updateRuleColor}
                iconLabelSetter={updateRuleLabel}
                lineWidthSetter={updateLineWidth}
                nodeSizeSetter={updateNodeSize}
                iconSizeSetter={updateIconSize}
                iconVOffsetSetter={updateIconVOffset}
                iconNameSetter={updateIconName}
                overrideSetter={updateRuleOverrides}
                remover={removeRule}
                index={index}
                context={context}
              />
            </CollapsableSection>
          );
        })}
    </>
  );
};

const svgIconsFieldStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      display: flex;
      flexdirection: column;
    `,
    addBtn: css`
      margin-bottom: ${theme.spacing(1)};
    `,
  };
};
