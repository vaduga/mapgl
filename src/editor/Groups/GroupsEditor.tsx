import React, { useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import { DropResult, DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { GrafanaTheme2, StandardEditorProps } from '@grafana/data';
import { Button, Icon, IconButton, useStyles2 } from '@grafana/ui';
import { isEqual } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { defaultGroup, OverrideTracker, Rule, RuleTracker } from './rule-types';
import { RuleItem } from './RuleItem';
import { LayerName } from '../../grafana_core/app/core/components/Layers/LayerName';
import { getNextGroupName } from '../../utils/geomap_utils';

type Props = StandardEditorProps<Rule[]>;

export const GroupsEditor = ({ onChange, item, ...props }: Props) => {
  const { disabled } = item.settings || {};
  const s = useStyles2(svgIconsFieldStyles);
  const [tracker, _setTracker] = useState<RuleTracker[]>([]);
  const [selectedRuleId, setSelectedRuleId] = useState<string>();
  const context = props.context;

  useEffect(() => {
    const groups = sanitizeRules(props.value ?? props.context.options?.config?.groups ?? []);

    _setTracker((current) => {
      const currentRules = current.map((entry) => sanitizeRule(entry.rule));
      if (isEqual(currentRules, groups)) {
        return current;
      }

      return groups.map((rule: Rule, index: number) => ({
        rule,
        order: index,
        ID: current[index]?.ID ?? uuidv4(),
      }));
    });
  }, [props.context.options?.config?.groups, props.value]);

  useEffect(() => {
    if (!tracker.length) {
      setSelectedRuleId(undefined);
      return;
    }

    setSelectedRuleId((current) => {
      if (current && tracker.some((entry) => entry.ID === current)) {
        return current;
      }
      return undefined;
    });
  }, [tracker]);

  const setRules = (val: Rule[]) => {
    onChange(val as any);
  };

  const setTracker = (v: RuleTracker[]) => {
    _setTracker(v);
    setRules(v.map((element) => sanitizeRule(element.rule)));
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

  const canRenameGroup = (nameToCheck: string, currentId?: string) => {
    return !tracker.some(
      (entry) => entry.ID !== currentId && (entry.rule.label ?? 'rule').trim().toLowerCase() === nameToCheck.trim().toLowerCase()
    );
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

  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }

    const nextTracker = [...tracker];
    const [moved] = nextTracker.splice(result.source.index, 1);
    nextTracker.splice(result.destination.index, 0, moved);

    setTracker(
      nextTracker.map((entry, index) => ({
        ...entry,
        order: index,
      }))
    );
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
    const removedRuleId = allRules[removeIndex]?.ID;
    allRules.splice(removeIndex, 1);
    // reorder
    for (let i = 0; i < allRules.length; i++) {
      allRules[i].order = i;
    }
    setSelectedRuleId((current) => {
      if (!allRules.length) {
        return undefined;
      }

      if (current && current !== removedRuleId && allRules.some((entry) => entry.ID === current)) {
        return current;
      }

      const fallbackIndex = Math.min(removeIndex, allRules.length - 1);
      return allRules[fallbackIndex]?.ID;
    });
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
    setSelectedRuleId(aTracker.ID);
    setTracker([...tracker, aTracker]);
  };

  const toggleRule = (ruleId: string) => {
    setSelectedRuleId((current) => (current === ruleId ? undefined : ruleId));
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

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="groups-editor-rules">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              {tracker.map((entry: RuleTracker, index: number) => {
                const isSelected = entry.ID === selectedRuleId;

                return (
                  <Draggable key={entry.ID} draggableId={entry.ID} index={index}>
                    {(dragProvided) => (
                      <div ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={s.itemWrapper}>
                        <div
                          className={cx(s.row, isSelected && s.sel)}
                          {...dragProvided.dragHandleProps}
                          onMouseDown={() => setSelectedRuleId(entry.ID)}
                          role="button"
                          tabIndex={0}
                        >
                          <button
                            type="button"
                            className={s.chevronButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRule(entry.ID);
                            }}
                          >
                            <Icon name={isSelected ? 'angle-down' : 'angle-right'} />
                          </button>
                          <div className={s.label}>
                            <LayerName
                              name={entry.rule.label ?? 'rule'}
                              onChange={(label) => updateRuleLabel(index, label)}
                              verifyLayerNameUniqueness={(nameToCheck) => canRenameGroup(nameToCheck, entry.ID)}
                              overrideStyles
                              editTitle="Edit group name"
                              emptyNameMessage="An empty group name is not allowed"
                              duplicateNameMessage="Group name already exists"
                            />
                          </div>
                          <IconButton
                            disabled={disabled}
                            key="deleteRule"
                            variant="secondary"
                            name="trash-alt"
                            tooltip="Remove group"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                            }}
                            onClick={(e) => {
                              removeRule(index);
                              e.stopPropagation();
                            }}
                          />
                          {tracker.length > 1 && <Icon name="draggabledots" size="lg" className={s.dragIcon} />}
                        </div>

                        {isSelected && (
                          <div className={s.content}>
                            <RuleItem
                              disabled={disabled || false}
                              key={`rule-item-index-${entry.ID}`}
                              ID={entry.ID}
                              rule={entry.rule}
                              colorSetter={updateRuleColor}
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
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                );
              })}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </>
  );
};

const sanitizeRule = (rule: Rule): Rule => {
  const { collapse, ...nextRule } = rule;
  return nextRule;
};

const sanitizeRules = (rules: Rule[]): Rule[] => rules.map((rule) => sanitizeRule(rule));

const svgIconsFieldStyles = (theme: GrafanaTheme2) => {
  return {
    wrapper: css`
      display: flex;
      flexdirection: column;
    `,
    addBtn: css`
      margin-bottom: ${theme.spacing(1)};
    `,
    itemWrapper: css`
      margin-bottom: ${theme.spacing(1)};
    `,
    row: css`
      display: flex;
      align-items: center;
      gap: ${theme.spacing(1)};
      padding: ${theme.spacing(0.5, 1)};
      border-radius: ${theme.shape.radius.default};
      background: ${theme.colors.background.secondary};
      border: 1px solid ${theme.components.input.borderColor};
      cursor: pointer;

      &:hover {
        border-color: ${theme.components.input.borderHover};
      }
    `,
    sel: css`
      border-color: ${theme.colors.primary.border};

      &:hover {
        border-color: ${theme.colors.primary.border};
      }
    `,
    label: css`
      flex: 1;
      min-width: 0;
    `,
    content: css`
      padding: ${theme.spacing(0.5, 1)} ${theme.spacing(1)} ${theme.spacing(1)};
      border: 1px solid ${theme.components.input.borderColor};
      border-top: 0;
      border-radius: 0 0 ${theme.shape.radius.default}px ${theme.shape.radius.default}px;
    `,
    dragIcon: css`
      cursor: grab;
    `,
    chevronButton: css`
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
    `,
  };
};
