import { css } from '@emotion/css';
import type { Field as DataField, GrafanaTheme2, StandardEditorProps } from '@grafana/data';
import {
  CollapsableSection,
  Field,
  InlineSwitch,
  MultiSelect,
  RadioButtonGroup,
  useStyles2,
} from '@grafana/ui';
import React, { useEffect, useState } from 'react';

import { setOptionImmutably } from '../../grafana_core/app/dashboard/components/PanelEditor/utils';
import { FieldNamePicker } from '../../grafana_core/ui/components/MatchersUI/FieldNamePicker';
import { MARKERS_LAYER_ID, type MarkersOptionalConfig } from '../../layers/data/markersDefaults';
import { NsSeparatorEditor } from './NsSeparatorEditor';
import type { getQueryFields } from '../getQueryFields';

type EditorSettings = {
  isLogic: boolean;
  isExtendedEdition: boolean;
  getQueryFields: typeof getQueryFields;
};

type Props = StandardEditorProps<unknown, EditorSettings, any, any>;
type IdentityKey = keyof MarkersOptionalConfig;

const identityKeys: IdentityKey[] = [
  'edgeId',
  'wrapEdges',
  'isNestEdges',
  'vertexA_NS',
  'vertexB_NS',
  'nsSeparator',
  'searchProps',
];

const legacyLayerKeyByIdentity: Partial<Record<IdentityKey, string>> = {
  edgeId: 'edgeIdField',
  isNestEdges: 'isNestEdges',
};
const legacyLayerKeys = ['edgeIdField', 'isNestEdges', 'isWrapEdges'];
const legacyConfigKeys = ['isNestEdges', 'vertexA_NS', 'vertexB_NS', 'nsSeparator'];

const getIdentityOption = (options: Record<string, any>, key: IdentityKey) => {
  const identity = options.optional;
  if (key === 'searchProps') {
    return identity?.searchProps;
  }
  if (key === 'wrapEdges') {
    return identity?.wrapEdges ?? options.isWrapEdges;
  }
  if (identity && Object.prototype.hasOwnProperty.call(identity, key)) {
    return identity[key];
  }
  const legacyLayerKey = legacyLayerKeyByIdentity[key];
  if (legacyLayerKey && options[legacyLayerKey] !== undefined) {
    return options[legacyLayerKey];
  }
  return options.config?.[key];
};

export const OptIdentityEditor = ({ context, item }: Props) => {
  const styles = useStyles2(getStyles);
  const [sectionOpen, setSectionOpen] = useState(true);
  const [searchOptions, setSearchOptions] = useState<Array<{ label: string; value: string }>>([]);
  const layerOptions = (context.instanceState as any)?.options as Record<string, any> | undefined;
  const options = layerOptions ?? context.options ?? {};
  const settings = item.settings!;

  useEffect(() => {
    let cancelled = false;
    settings.getQueryFields(context).then((nextOptions) => {
      if (!cancelled) {
        setSearchOptions(nextOptions as Array<{ label: string; value: string }>);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [context, settings]);

  const updateOption = (key: IdentityKey, value: unknown) => {
    const update = context.instanceState?.onChange;
    if (!layerOptions || !update) {
      return;
    }

    const identity = Object.fromEntries(
      identityKeys.map((identityKey) => [identityKey, getIdentityOption(layerOptions, identityKey)])
    );
    const migratedOptions = {
      ...layerOptions,
      optional: identity,
    } as any;
    for (const legacyKey of legacyLayerKeys) {
      delete migratedOptions[legacyKey];
    }
    for (const legacyKey of legacyConfigKeys) {
      delete migratedOptions.config[legacyKey];
    }

    const nextOptions = setOptionImmutably(migratedOptions, `optional.${key}`, value) as any;
    update({
      ...nextOptions,
      config: {
        ...nextOptions.config,
        groups: [...(nextOptions.config?.groups ?? [])],
      },
    });
  };

  return (
    <div className={styles.subsection}>
      <CollapsableSection
        label="Optional identity"
        isOpen={sectionOpen}
        onToggle={() => setSectionOpen((open) => !open)}
        className={styles.sectionHeader}
        contentClassName={styles.content}
      >
        <div className={styles.body}>
          {!!options.parField && (
            <Field label="Edge ID" description="Used for parallel edges or as trace ID">
              <FieldNamePicker
                context={context}
                value={getIdentityOption(options, 'edgeId') ?? ''}
                onChange={(value) => updateOption('edgeId', value)}
                item={{
                  settings: {
                    filter: (field: DataField) => field.type === 'string',
                    isClearable: true,
                    noFieldsMessage: 'No string fields found',
                  },
                  id: 'edge-id-field',
                  name: 'Edge ID',
                }}
              />
            </Field>
          )}

          {settings.isExtendedEdition && (
            <>
              <Field label="Reduce parallel edges to:">
                <RadioButtonGroup
                  value={getIdentityOption(options, 'wrapEdges') ?? 0}
                  options={[
                    { label: 'Min', value: 1 },
                    { label: 'Max', value: 2 },
                    { label: 'Both', value: 3 },
                    { label: 'No wrap', value: 0 },
                  ]}
                  onChange={(value) => updateOption('wrapEdges', value)}
                />
              </Field>
              <Field
                label="Nest edges"
                description="Hide a multihop fragment when a dedicated edge connects its A–B vertices"
              >
                <InlineSwitch
                  value={getIdentityOption(options, 'isNestEdges') ?? false}
                  onChange={() => updateOption('isNestEdges', !getIdentityOption(options, 'isNestEdges'))}
                />
              </Field>
            </>
          )}

          {settings.isLogic && !!options.locField && (
            <Field label="Vertex A namespace">
              <FieldNamePicker
                context={context}
                value={getIdentityOption(options, 'vertexA_NS') ?? ''}
                onChange={(value) => updateOption('vertexA_NS', value)}
                item={{
                  settings: {
                    filter: (field: DataField) => field.type === 'string',
                    isClearable: true,
                    noFieldsMessage: 'No string fields found',
                  },
                  id: 'vertex-a-namespace',
                  name: 'Vertex A namespace',
                }}
              />
            </Field>
          )}
          {settings.isLogic && !!options.locField && !!options.parField && (
            <Field label="Vertex B namespace">
              <FieldNamePicker
                context={context}
                value={getIdentityOption(options, 'vertexB_NS') ?? ''}
                onChange={(value) => updateOption('vertexB_NS', value)}
                item={{
                  settings: {
                    filter: (field: DataField) => field.type === 'string',
                    isClearable: true,
                    noFieldsMessage: 'No string fields found',
                  },
                  id: 'vertex-b-namespace',
                  name: 'Vertex B namespace',
                }}
              />
            </Field>
          )}
          {settings.isLogic &&
            !!(getIdentityOption(options, 'vertexA_NS') || getIdentityOption(options, 'vertexB_NS')) && (
              <Field label="Layers separator">
                <NsSeparatorEditor
                  value={getIdentityOption(options, 'nsSeparator')}
                  onChange={(value) => updateOption('nsSeparator', value)}
                  context={context}
                  item={item as any}
                />
              </Field>
            )}

          {options.type === MARKERS_LAYER_ID && (
            <Field label="Search by" description="Extra fields">
              <MultiSelect
                options={searchOptions}
                value={
                  Array.isArray(getIdentityOption(options, 'searchProps'))
                    ? getIdentityOption(options, 'searchProps')
                    : []
                }
                onChange={(selected) => updateOption('searchProps', selected.map((option) => option.value!))}
                placeholder="Search by location name"
                isClearable
              />
            </Field>
          )}
        </div>
      </CollapsableSection>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  subsection: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderLeft: `3px solid ${theme.colors.secondary.main}`,
    borderRadius: theme.shape.radius.default,
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1),
  }),
  sectionHeader: css({
    fontSize: theme.typography.bodySmall.fontSize,
    lineHeight: theme.typography.bodySmall.lineHeight,
    '& > button': {
      marginLeft: 'auto',
      marginRight: 0,
      order: 2,
    },
    '& > div': {
      fontSize: 'inherit',
      fontWeight: theme.typography.fontWeightMedium,
      order: 1,
    },
  }),
  content: css({
    minWidth: 0,
    padding: theme.spacing(1, 0, 0),
  }),
  body: css({ minWidth: 0 }),
});
