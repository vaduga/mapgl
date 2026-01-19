import {
    AutoSizeInput,
    Field,
    IconButton,
    InlineField,
    InlineFieldRow,
    MultiSelect,
    Select,
    useStyles2, useTheme2
} from "@grafana/ui";
import {OverField, Rule} from "./rule-types";
import React, {ReactNode, useEffect, useState} from "react";
import {FieldType, GrafanaTheme2, SelectableValue, Threshold} from "@grafana/data";
import {css} from "@emotion/css";
import {FieldSelectEditor} from "./FieldSelectEditor";
import {RuleOption} from "./RuleItem";
import {findField} from "../../grafana_core/app/features/dimensions";
import {config, } from "@grafana/runtime";
import {getFieldConfigWithMinMax} from "@grafana/data";

interface OverrideFieldProps {
    overrideField: OverField;
    key: string;
    ID: string;

    nameTypeSetter: any;
    rule: Rule;
    valueSetter: any;
    remover: any;
    index: number;
    disabled: boolean;
    context: any;
}

export const OverrideField: React.FC<OverrideFieldProps> = (options: OverrideFieldProps) => {
    const styles = useStyles2(getThresholdFieldStyles);


    if (options.context.data && options.context.data.length > 0) {
        const dataFields = options.context.data
            .flatMap((frame) => frame.fields)
            .map((field) => ({
                label: field.name,
                value: field.name,
                type: field.type,
            }))

        const thresField = {
            label: 'threshold',
            value: 'thrColor',
            type: 'enum'
        }

        const {name, type} = options.overrideField
        const customField = {
            label: name,
            value: name,
            type: type
        }
        const fields = [thresField, ...dataFields, customField]
        const isThresField = options.overrideField.name === 'thrColor' && options.overrideField.type === 'enum'

        const instanceState = options.context.instanceState
        let {colorThresholds} = instanceState?.layer || {}

        // useEffect(() => {
            const tOptions: RuleOption[] = colorThresholds?.steps?.map((t,idx)=> {
                if (t=== undefined) return null;
                return(
                    {
                        color: useTheme2().visualization.getColorByName(t.color),
                        label: t.color,
                        value: t.value
                    })
            }).filter(t=> t !== null);

            const thrColors = options.overrideField.value //options.rule.thrIds
            const storedOptions = thrColors?.length ? tOptions?.filter(t=> thrColors.includes(t.label)) : []
            // setSelThresOpts(storedOptions)
            // setThresOpts(tOptions)
        // }, [combinedThresholds]);
        // const [selThresOpts, setSelThresOpts] = useState<ThresholdOption[]>()
        // const [thresOpts, setThresOpts] = useState<ThresholdOption[]>()


        const renderOption = (option) => (<div style={{display: 'flex', alignItems: 'center'}}>
                <div
                    style={{
                        width: 16,
                        height: 16,
                        backgroundColor: option.color,
                        borderRadius: '50%',
                        marginRight: 8,
                    }}
                ></div>
                {option.value}
            </div>
        ) as ReactNode;

        return (
            <>
            <InlineField shrink label={"prop " + (options.index + 1)}>

                <FieldSelectEditor
                    context={options.context}
                    options={fields}
                    allowCustomValue={true}
                    item={options.context.item}
                    //context={options.context}
                    value={options.overrideField.name}
                    onChange={(v) => {
                        if (typeof v === 'string') {
                            options.nameTypeSetter(options.index, v, fields.find(el=> el.value===v)?.type ?? FieldType.string)
                        }
                    }}
                />
                    </InlineField>
                { isThresField ?
                    // shrink label="thr"
                    <InlineField>
                        <MultiSelect
                            options={tOptions}
                            value={storedOptions}
                            //@ts-ignore
                            getOptionLabel={renderOption}
                            //@ts-ignore
                            onChange={(t: RuleOption[]) => {
                                options.valueSetter(options.index, t.map(t=> t.label));
                                //setSelThresOpts(t)
                            }}
                        />
                    </InlineField>
                    :
                <InlineField label="values">
                <AutoSizeInput
                    minWidth={10}
                    // disabled={!options.overrideField.name}
                    onCommitChange={(v) => {
                        options.valueSetter(options.index, v.currentTarget.value);
                    }}
                    defaultValue={options.overrideField.value}
                    placeholder={'val1,val2...'}
                />
                </InlineField>
                }
                    <InlineField className={styles.rmButton} >
                <IconButton
                    disabled={options.disabled}
                    key="deleteThresholdField"
                    variant="destructive"
                    name="x"
                    tooltip="remove property"
                    onClick={() => options.remover(options.index)}
                />
                    </InlineField>

            </>
        )
    }

    return <Select onChange={() => {}} disabled={true} />


}

const getThresholdFieldStyles = (theme: GrafanaTheme2) => {
    return {
        colorPicker: css`
      padding: 0 ${theme.spacing(1)};
    `,
        rmButton: css`
          align-items: center;
        `
    };
};
