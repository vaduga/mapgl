import React from "react";
import { StandardEditorProps, FieldType } from "@grafana/data";
import { MultiSelect, Select } from "@grafana/ui";

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

    return (
        <Select
            width={20}
            // isClearable
            isLoading={false}
            allowCustomValue={true}
            value={value as string | null}
            onChange={(e) => {
                onChange(e?.value);
            }}
            options={options}
        />
    );


};
