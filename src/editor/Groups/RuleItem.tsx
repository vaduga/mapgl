import React, { useEffect, useState } from 'react';
import { FieldType, GrafanaTheme2, StandardEditorsRegistryItem } from '@grafana/data';
import {
  ColorPicker,
  InlineSwitch,
  IconButton,
  InlineField,
  InlineFieldRow,
  Input,
  Select,
  Tooltip,
  useStyles2,
} from '@grafana/ui';
import { isEqual } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { css } from '@emotion/css';
import { OverrideField } from './OverrideField';
import { OverField, OverrideTracker, Rule } from './rule-types';
import { DEFAULT_COLOR_PICKER } from 'mapLib/utils';
import { ResourceDimensionEditor } from '../../grafana_core/app/features/dimensions/editors';
import { MediaType, ResourceFolderName } from '../../grafana_core/app/features/dimensions';
import { ResourceDimensionMode } from '@grafana/schema';
import { DEFAULT_LINE_WIDTH, LineWidthStates, NodeSizeStates } from '../Groups/rule-types';

interface RuleItemProps {
  rule: Rule;
  key: string;
  ID: string;
  colorSetter: any;
  widthSetter: any;
  sizeSetter: any;
  iconNameSetter: any;
  offsetSetter: any;
  overrideSetter: any;
  remover: any;
  index: number;
  disabled: boolean;
  context: any;
}

export type RuleOption = {
  label: string;
  value: number;
  color: string;
};

//@ts-ignore
export const RuleItem: React.FC<RuleItemProps> = (options: RuleItemProps, context) => {
  const styles = useStyles2(getRuleStyles);
  const [oTracker, _setoTracker] = useState<OverrideTracker[]>([]);

  useEffect(() => {
    const overrides = Object.values(options.rule.overrides ?? []) as OverField[];

    _setoTracker((current) => {
      const currentOverrides = current.map((entry) => entry.overrideField);
      if (isEqual(currentOverrides, overrides)) {
        return current;
      }

      return overrides.map((field: OverField, index: number) => ({
        overrideField: field,
        order: index,
        ID: current[index]?.ID ?? uuidv4(),
      }));
    });
  }, [options.rule.overrides]);

  const setTracker = (v: OverrideTracker[]) => {
    _setoTracker(v);
    const allOverrides: OverField[] = [];
    v.forEach((element) => {
      allOverrides.push(element.overrideField);
    });
    options.overrideSetter(options.index, allOverrides);
  };

  const updateOverrideFieldNameType = (index: number, name: string, type: FieldType) => {
    setTracker(
      oTracker.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              overrideField: { ...entry.overrideField, name, type },
            }
          : entry
      )
    );
  };

  const updateOverrideFieldValue = (index: number, value: string | string[]) => {
    setTracker(
      oTracker.map((entry, entryIndex) =>
        entryIndex === index
          ? {
              ...entry,
              overrideField: { ...entry.overrideField, value },
            }
          : entry
      )
    );
  };

  const addField = () => {
    const order = oTracker.length;
    const aOverrideField: OverField = {
      name: '',
      value: '',
      type: FieldType.string,
    };
    const aTracker: OverrideTracker = {
      overrideField: aOverrideField,
      order: order,
      ID: uuidv4(),
    };
    setTracker([...oTracker, aTracker]);
  };

  const removeRuleField = (index: number) => {
    const allRules = [...oTracker];
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

  const handleIconChange = (icon: string | undefined) => {
    if (typeof icon !== 'string') {
      return;
    }
    options.iconNameSetter(options.index, icon);
  };
  const maxFiles = 2000;
  const showColor = options.rule.color !== undefined;
  const iconName = options.rule.iconName ?? '';
  const nodeSize = options.rule.size;
  const lineWidth = options.rule.width;
  const iconVOffset = options.rule.offset;

  return (
    <InlineFieldRow className={styles.inlineRow}>
      {showColor && (
        <InlineField>
          <div className={styles.colorPicker}>
            <ColorPicker
              color={options.rule.color ?? DEFAULT_COLOR_PICKER}
              onChange={(color) => {
                options.colorSetter(options.index, color);
              }}
              enableNamedColors={false}
            />
          </div>
        </InlineField>
      )}
      <InlineField>
        <div className={styles.colorPicker}>
          <IconButton
            disabled={options.disabled}
            key="addColorPickerRuleField"
            variant="primary"
            name={showColor ? 'x' : 'circle'}
            tooltip={`${showColor ? 'Remove' : 'Set'} group color`}
            onClick={() => {
              const color = showColor ? undefined : DEFAULT_COLOR_PICKER;
              options.colorSetter(options.index, color);
            }}
          />
        </div>
      </InlineField>
      <InlineField label="size">
          <Tooltip content={'fix node size'}>
            <div>
              <InlineSwitch
                value={typeof nodeSize === 'number'}
                disabled={options.disabled}
                onChange={() => {
                  if (typeof nodeSize === 'number') {
                    options.sizeSetter(options.index, undefined);
                    return;
                  }
                  options.sizeSetter(options.index, NodeSizeStates[0]?.value);
                }}
              />
            </div>
          </Tooltip>
      </InlineField>
      {typeof nodeSize === 'number' && (
        <div>
          <Select
            isClearable
            disabled={options.disabled}
            menuShouldPortal={true}
            value={options.rule.size}
            onChange={(v) => {
              if (v === null) {
                options.sizeSetter(options.index, undefined);
                return;
              }

              const intValue = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
              if (!intValue) {
                return;
              }
              options.sizeSetter(options.index, intValue);
            }}
            options={
              typeof nodeSize === 'number'
                ? NodeSizeStates.concat([
                    {
                      value: nodeSize,
                      label: nodeSize.toString(),
                    },
                  ])
                : NodeSizeStates
            }
            allowCustomValue={true}
            width="auto"
          />
        </div>
      )}
      <InlineField label="width">
          <Tooltip content={'fix line width'}>
            <div>
              <InlineSwitch
                value={typeof lineWidth === 'number'}
                disabled={options.disabled}
                onChange={() => {
                  if (typeof lineWidth === 'number') {
                    options.widthSetter(options.index, undefined);
                    return;
                  }
                  options.widthSetter(options.index, DEFAULT_LINE_WIDTH);
                }}
              />
            </div>
          </Tooltip>
      </InlineField>
      {typeof lineWidth === 'number' && (
        <div>
          <Select
            isClearable
            disabled={options.disabled}
            menuShouldPortal={true}
            value={options.rule.width}
            onChange={(v) => {
              if (v === null) {
                options.widthSetter(options.index, undefined);
                return;
              }

              const intValue = typeof v.value === 'string' ? parseFloat(v.value) : v.value;
              if (!intValue) {
                return;
              }
              options.widthSetter(options.index, intValue);
            }}
            options={
              typeof lineWidth === 'number'
                ? LineWidthStates.concat([
                    {
                      value: lineWidth,
                      label: lineWidth.toString(),
                    },
                  ])
                : LineWidthStates
            }
            allowCustomValue={true}
            width="auto"
          />
        </div>
      )}

      {oTracker &&
        oTracker.map((tracker: OverrideTracker, index: number) => {
          return (
            <OverrideField
              disabled={options.disabled || false}
              key={`rule-field-index-${tracker.ID}`}
              ID={tracker.ID}
              overrideField={tracker.overrideField}
              nameTypeSetter={updateOverrideFieldNameType}
              valueSetter={updateOverrideFieldValue}
              remover={removeRuleField}
              index={index}
              context={options.context}
              rule={options.rule}
            />
          );
        })}
      <InlineField className={styles.addButton}>
        <IconButton
          disabled={options.disabled}
          key="addRuleField"
          variant="primary"
          name="plus"
          tooltip="add property"
          onClick={addField}
        />
      </InlineField>
      <InlineField shrink label={'icon'} className={styles.iconField}>
        <ResourceDimensionEditor
          value={{ fixed: options.rule.iconName ?? '', mode: ResourceDimensionMode.Fixed }}
          context={context}
          onChange={(v) => {
            if (!v) {
              return;
            }
            if (v.fixed === 'custom_icon') {
              options.iconNameSetter(options.index, v.fixed);
            } else {
              handleIconChange(v.fixed);
            }
          }}
          item={
            {
              settings: {
                resourceType: MediaType.Icon,
                folderName: ResourceFolderName.Networking,
                placeholderText: 'Select an icon',
                showSourceRadio: false,
                maxFiles,
              },
            } as StandardEditorsRegistryItem
          }
        />
      </InlineField>
      {iconName && (
        <>
          <InlineField shrink label="offset" className={styles.voffset}>
            <Input
              className={styles.offsetInput}
              disabled={options.disabled}
              type="number"
              step="1.0"
              key={options.index}
              value={iconVOffset ?? ''}
              onChange={(e) => {
                const { value } = e.currentTarget;
                if (value === '') {
                  options.offsetSetter(options.index, undefined);
                  return;
                }
                const intValue = typeof value === 'string' ? parseFloat(value) : value;
                if (Number.isNaN(intValue)) {
                  return;
                }
                options.offsetSetter(options.index, intValue);
              }}
            />
          </InlineField>
        </>
      )}
    </InlineFieldRow>
  );
};

const getRuleStyles = (theme: GrafanaTheme2) => {
  return {
    ruleContainer: css`
      display: flex;
      align-items: center;
      //flex: 1; // Use flex: 1 to distribute space equally among child elements
      justify-content: space-between;
    `,
    colorPicker: css`
      padding-top: ${theme.spacing(1)};
      //padding: 0 ${theme.spacing(1)};
    `,
    inlineField: css`
      flex: 1 0 auto;
    `,
    inlineRow: css`
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: ${theme.spacing(1)};
      margin-top: ${theme.spacing(1.25)};
      width: 100%;
      max-width: 100%;

      & > * {
        min-width: 0;
      }
    `,
    voffset: css`
      width: 8rem;
      flex-shrink: 1;
    `,
    addButton: css`
      align-items: center;
    `,
    iconField: css`
      flex: 1 1 100%;
      min-width: 0;
      width: 100%;
      max-width: 100%;
      overflow: hidden;

      & > div {
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }

      & [class*='inline-field-row'] {
        width: 100%;
        min-width: 0;
      }

      & [role='button'] {
        width: 100%;
        min-width: 0;
      }

      & input {
        width: 100%;
        min-width: 0;
        max-width: 100%;
      }
    `,
    offsetInput: css`
      width: 4.5rem;
      min-width: 4.5rem;

      & input {
        padding-left: ${theme.spacing(0.5)};
        padding-right: ${theme.spacing(0.5)};
        text-align: right;
      }
    `,
  };
};
