import React from "react";
import { StandardEditorProps, FieldType } from "@grafana/data";
import { ComboboxCompat } from "../../components/Compat/ComboboxCompat";

interface Settings {
    filterByType: FieldType[];
    multi: boolean;
}

interface Props
    extends StandardEditorProps<string | string[] | null, Settings> {
    options: any,
    allowCustomValue: boolean
}

/**
 * FieldSelectEditor populates a Select with the names of the fields returned by
 * the query.
 *
 * Requires Grafana >=7.0.3. For more information, refer to the following
 * pull request:
 *
 * https://github.com/grafana/grafana/pull/24829
 */
export const FieldSelectEditor: React.FC<Props> = ({
                                                       value,
                                                       onChange,
                                                       options,
                                                       allowCustomValue
                                                   }) => {
    const selectedOption = options.find((option: { value: string }) => option.value === value);

    return (
        <ComboboxCompat
            width={20}
            createCustomValue={allowCustomValue}
            value={selectedOption ?? (value as string | null)}
            onChange={(e) => {
                onChange(e?.value);
            }}
            options={options}
        />
    );


};
