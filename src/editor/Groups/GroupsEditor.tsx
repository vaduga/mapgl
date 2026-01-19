import React, {FunctionComponent, useCallback, useMemo, useState} from 'react';
import {orderBy} from 'lodash';
import {Button, CollapsableSection, IconButton, useStyles2, useTheme, useTheme2} from '@grafana/ui';
import {v4 as uuidv4} from 'uuid';
import {defaultGroup, OverrideTracker, Rule, RuleTracker} from './rule-types';
import {RuleItem} from './RuleItem';
import {GrafanaTheme2, StandardEditorProps} from "@grafana/data";
import {css} from "@emotion/css";
import {StyleConfig} from "../../style/types";
import {getNextGroupName} from "../../utils/geomap_utils";

type Props = StandardEditorProps<Rule[]>;

export const GroupsEditor = ({ onChange, item, ...props }: Props) => {
    const {disabled} = item.settings || {}
    const s = useStyles2(svgIconsFieldStyles);
    const [tracker, _setTracker] = useState<RuleTracker[]>([])

    const context = useMemo(() => {
        if (!item.settings?.frameMatcher) {
           // return props.context;
        }

        const groups = props.context.options?.config?.groups ?? [defaultGroup(getNextGroupName([]))]

        const items: RuleTracker[] = [];
        groups.forEach((value: Rule, index: number) => {
            items[index] = {
                rule: value,
                order: index,
                ID: uuidv4(),
            };
        });

        _setTracker(items) //structuredClone(items));

        return props.context;
        //return { ...props.context, data: props.context.data.filter(item.settings.frameMatcher) };
    }, [props.context.options.name])//, item.settings]); //props.context

    // v9 compatible
    const theme2 = useTheme2();

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

    const updateRuleOverrides = (index: number, overrides: OverrideTracker) => {
        if (!overrides) {
            return
        }

        tracker[index].rule = {...tracker[index].rule, overrides}
        setTracker(tracker);
    };


    const updateRuleColor = (index: number, color: string) => {
        tracker[index].rule = {...tracker[index].rule, color}
        setTracker(tracker);
    };

    const updateRuleLabel = (index: number, label: string) => {
        tracker[index].rule = {...tracker[index].rule, label}
        tracker[index].rule.label = label;
        setTracker(tracker);
    };

    const updateLineWidth = (index: number, width: number) => {
        tracker[index].rule = {...tracker[index].rule, lineWidth : width}
        setTracker(tracker);
    };

    const updateNodeSize = (index: number, size: number) => {
        tracker[index].rule = {...tracker[index].rule, nodeSize : size}
        setTracker(tracker);
    };

    const updateIconSize = (index: number, size: number) => {
        tracker[index].rule = {...tracker[index].rule, iconSize: size}
        setTracker(tracker);
    };

    const updateIconCollapsed = (index: number) => {
        tracker[index].rule = {...tracker[index].rule, collapse: !tracker[index].rule.collapse}
        setTracker(tracker);
    };

    const updateIconVOffset = (index: number, size: number) => {
        tracker[index].rule = {...tracker[index].rule, iconVOffset: size}
        setTracker(tracker);
    };


    const updateIconName = (index: number, name: string) => {
        tracker[index].rule = {...tracker[index].rule, iconName: name}
        setTracker(tracker);
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
        const label = getNextGroupName(tracker)
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
                <Button className={s.addBtn} size='sm' fullWidth disabled={disabled} fill="solid"
                        variant="secondary" icon="plus" onClick={addItem}>
                    Add group
                </Button>
            </div>

            {tracker && tracker.map((tracker: RuleTracker, index: number) => {

                return (
                    <CollapsableSection key={index} isOpen={!!tracker.rule.collapse} label={
                        (<span>
                                {/*{index + 1}*/}
                                {tracker.rule.label ?? 'rule'}<>&nbsp;</>
                        <IconButton
                            disabled={disabled}
                            key="deleteRule"
                            variant="secondary"
                            name="trash-alt"
                            tooltip="delete icon rule"
                            onClick={(e) => {
                                removeRule(index)
                                e.stopPropagation()
                            }}
                        />
                            </span>
                        )


                    } onToggle={() => updateIconCollapsed(index)}>
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
            flexDirection: column
        `,
        addBtn: css`
            margin-bottom: ${theme.spacing(1)};
        `,
    };
};
