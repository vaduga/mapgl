import {OverField, Rule} from '../rule-types';
import {FieldType} from "@grafana/data";
import {FIXED_COLOR_LABEL} from "mapLib";

function countMatchingKeysAndValues(props, o, theme, locField, isFixed) {

    let hasAllValuesMatch = 0;
    let hasThrMatch = 0
    let hasLocMatch = 0
    let oCount =  0

    if (!o?.length) {
        return [oCount, hasAllValuesMatch, hasLocMatch, hasThrMatch];
    }
    const overrides: OverField[] = o.slice()

    if (isFixed) {
        const thrColorIdx = overrides?.findIndex(o => o.name === 'thrColor');
        if (thrColorIdx !== -1) {
            overrides[thrColorIdx] =  {...overrides[thrColorIdx], value : [FIXED_COLOR_LABEL]};

        } else {
            overrides.push({
                name: 'thrColor',
                type: FieldType.enum,
                value: [FIXED_COLOR_LABEL]
            });
        }
    }

    const allKeysMatched = overrides?.every((override) => {
        const key = override.name;
        return props.hasOwnProperty(key);
    });


    if (allKeysMatched) {
        const allValuesMatched = overrides?.every((override: OverField) => {
            const key = override.name;
            let valuesArr: any = override.value ?? [];
            const pointValue = props[key];
            if (override.type === FieldType.enum) {

            if (override.name === 'thrColor' && !isFixed && Array.isArray(valuesArr)) {
                    valuesArr = valuesArr.map(c => theme.visualization.getColorByName(c));
            }

            if (valuesArr?.includes(pointValue)) {
                    hasThrMatch = override.name === 'thrColor' ? 1 : 0
                    oCount++
                    return true
                }

            }

            if (override.type === FieldType.string && typeof override.value === 'string' ) {
                valuesArr = valuesArr.split(',').map(el=>el.trim());
                if (override.name === locField) {
                    if (valuesArr.includes(pointValue)) {
                        hasLocMatch = 1
                        oCount++
                        return true
                    }
                }
            }

            if (override.type === FieldType.number && typeof override.value === 'string' ) {
                valuesArr = valuesArr.split(',').map(el => parseInt(el, 10));
            }


            if (valuesArr.includes(pointValue)) {
                oCount++
                return true
            }
            return false
        });

        if (allValuesMatched) {
            hasAllValuesMatch = 1;
        }
    }

    return [oCount, hasAllValuesMatch, hasLocMatch, hasThrMatch];
}

type extRule = {
    oCount: number, hasLocMatch: number, hasThrMatch:number, groupIdx: number
}

const getRulesWithOverridesCounts = (properties, groups, theme, locField, locName, isFixed) => {
    const matches: (Rule & extRule)[] = [];
    (groups as Rule[]).forEach((g, idx) => {

        const [oCount, hasAllValuesMatch, hasLocMatch, hasThrMatch] = countMatchingKeysAndValues(properties, g.overrides, theme, locField, isFixed)
        if (hasAllValuesMatch || g.isEph && hasThrMatch) {  // && (oCount > 0 || (hasThrMatch && g.isEph)) /// second condition for no set groups
            const group = {
                ...g, oCount, hasLocMatch, hasThrMatch, groupIdx: g.groupIdx!
            }
            matches.push(group)
        }
    })


    // State machine to calculate priority
    const calculatePriority = (item) => {
        let state = 'START';
        let priority = 0;

        while (state !== 'END') {
            switch (state) {
                case 'START':
                    if (item.oCount >= 2 && item.hasLocMatch && item.hasThrMatch) {
                        priority = 7;
                        state = 'END';
                    } else {
                        state = 'LOC_AND_THR_ONLY';
                    }
                    break;

                case 'LOC_AND_THR_ONLY':
                    if (item.oCount === 2 && item.hasLocMatch && item.hasThrMatch) {
                        priority = 6;
                        state = 'END';
                    } else {
                        state = 'LOC_AND_MATCHES';
                    }
                    break;

                case 'LOC_AND_MATCHES':
                    if (item.oCount > 1 && item.hasLocMatch) {
                        priority = 5;
                        state = 'END';
                    } else {
                        state = 'LOC_ONLY';
                    }
                    break;

                case 'LOC_ONLY':
                    if (item.oCount === 1 && item.hasLocMatch) {
                        priority = 4;
                        state = 'END';
                    } else {
                        state = 'NOT_EPH';
                    }
                    break;


                case 'MORE_MATCHES':
                    if (item.oCount > 1 && item.hasThrMatch) {
                        priority = 3;
                        state = 'END';
                    } else {
                        state = 'THR_ONLY';
                    }
                    break;

                case 'NOT_EPH':
                    if (item.oCount === 1 && item.hasThrMatch && !item.isEph) {
                        priority = 2;
                        state = 'END';
                    } else {
                        state = 'MORE_MATCHES';
                    }
                    break;


                case 'THR_ONLY':
                    if (item.oCount === 1 && item.hasThrMatch ) {
                        priority = 1;
                        state = 'END';
                    } else {
                        priority = 0;
                        state = 'END';
                    }
                    break;

                default:
                    state = 'END';
                    break;
            }
        }

        return priority;
    };

    // Assign priorities to matches and sort
    const sortedMatches = matches
        .map((item) => ({
            ...item,
            priority: calculatePriority(item),
        }))
        .sort((a, b) => b.priority - a.priority) // || b.oCount - a.oCount);

    return sortedMatches;
}

function getGroupRules(
    properties: any,
    groups: Rule[] = [],
    theme,
    isFixed,
    locField?,
    locName?,
): {
    isEph?: boolean;
    groupIdx: number;
    color?: string, label?: string, lineWidth? : number, iconName?: string, iconSize?: number, iconVOffset?: number}[] | [] {

    if (!groups.length) {return []}

    const thresholds = getRulesWithOverridesCounts(properties, groups, theme, locField, locName, isFixed)

    if (!thresholds.length) {
        return []// No Data
    }

    return thresholds.map(t=> ({
        color: t.color,
        label: t.label,
        ...(t.lineWidth && {lineWidth: t.lineWidth}),
        ...(t.nodeSize && {nodeSize: t.nodeSize}),
        iconName: t.iconName,
        iconSize: t.iconSize,
        iconVOffset: t.iconVOffset,
        groupIdx: t.groupIdx,
    }))

}

export { getGroupRules };
