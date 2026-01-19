import {css} from '@emotion/css';

import {Field, FieldType, GrafanaTheme2, StandardEditorProps} from '@grafana/data';
import {Button, ColorPicker, Tooltip, useStyles2} from '@grafana/ui';

import {ArcOption, NodeGraphOptions} from './types';
import React from 'react';
import {FieldNamePicker} from '../grafana_core/components/MatchersUI/FieldNamePicker';

type Settings = { filter: (field: Field) => boolean };
type ArcOptionsEditorProps = StandardEditorProps<ArcOption[], Settings, NodeGraphOptions, undefined>;

export const ArcOptionsEditor = ({ value, onChange, context }: ArcOptionsEditorProps) => {
  const styles = useStyles2(getStyles);

  const addArc = () => {
    const newArc = { field: '', fixed: '' };
    onChange(value ? [...value, newArc] : [newArc]);
  };

  const removeArc = (idx: number) => {
    const copy = value?.slice();
    copy.splice(idx, 1);
    onChange(copy);
  };

  const updateField = <K extends keyof ArcOption>(idx: number, field: K, newValue: ArcOption[K]) => {
    let arcs = value?.slice() ?? [];
    arcs[idx] = {...arcs[idx], [field] : newValue}
    onChange(arcs);
  };

  return (
    <>
      {value?.map((arc, i) => {
        return (
          <div className={styles.section} key={i}>
            <FieldNamePicker
              context={context}
              value={arc.field ?? ''}
              onChange={(val) => {
                updateField(i, 'field', val);
              }}
              item={{
                settings: {
                  filter: (field: Field) => field.type === FieldType.number,
                },
                id: `arc-field-${i}`,
                name: `arc-field-${i}`,
              }}
            />
            {!arc.field &&
              <Tooltip content={'fixed color'}>
                <div>
                  <ColorPicker
                      color={arc.fixed || '#808080'}
                      onChange={(val) => {
                        updateField(i, 'fixed', val);
                      }}
                  />
                </div>
              </Tooltip>}
            <Button aria-label="" size="sm" icon="minus" variant="secondary" onClick={() => removeArc(i)} title="Remove arc" />
          </div>
        );
      })}
      <Button size={'sm'} icon="plus" onClick={addArc} variant="secondary">
        Add arc
      </Button>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    section: css({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: `0 ${theme.spacing(1)}`,
      marginBottom: theme.spacing(1),
    }),
  };
};
