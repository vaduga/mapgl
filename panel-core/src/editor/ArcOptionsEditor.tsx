import { css } from '@emotion/css';

import {
  Field as DataField,
  FieldConfigPropertyItem,
  FieldColorModeId,
  FieldType,
  GrafanaTheme2,
  StandardEditorProps,
  getFieldColorModeForField,
} from '@grafana/data';
import {
  Button,
  ColorPicker,
  CollapsableSection,
  Field,
  InlineField,
  InlineFieldRow,
  InlineSwitch,
  Tooltip,
  useStyles2,
  useTheme2,
} from '@grafana/ui';

import React from 'react';
import { FieldNamePicker } from '../grafana_core/ui/components/MatchersUI/FieldNamePicker';
import { SliderValueEditor } from '../grafana_core/app/core/components/OptionsUI/slider';
import { setOptionImmutably } from '../grafana_core/app/dashboard/components/PanelEditor/utils';
import { ArcOption, ArcOptionsConfig, isMetricDrivenArc, resolveArcOptions, StyleConfig } from '../style/types';

type Settings = { filter: (field: DataField) => boolean };
type ArcOptionsEditorProps = StandardEditorProps<ArcOption[], Settings, any, any>;

const BAR_WIDTH_SETTINGS = { min: 0.1, max: 1, step: 0.01 };
const SEGMENTS_SETTINGS = { min: 1, max: 100, step: 1, integer: true };
const SEGMENT_SPACING_SETTINGS = { min: 0, max: 1, step: 0.01 };

export const getArcOptionsVisibility = (arcs: readonly ArcOption[] | undefined, segments: number) => {
  const showBarWidth = (arcs?.length ?? 0) > 0;
  const showGaugeControls = isMetricDrivenArc(arcs);
  return {
    showBarWidth,
    showGaugeControls,
    showSegmentSpacing: showGaugeControls && segments > 1,
  };
};

export const usesThresholdColorScheme = (context: any, fieldName: string | undefined): boolean => {
  if (!fieldName) {
    return false;
  }
  return (context?.data ?? []).some((frame: { fields?: DataField[] }) =>
    (frame.fields ?? []).some(
      (field) => field.name === fieldName && getFieldColorModeForField(field).id === FieldColorModeId.Thresholds
    )
  );
};

/**
 * Builds a complete layer-options update for an arc option change.
 *
 * ArcOptionsEditor is rendered inside a nested `config.style` editor. Its
 * `context.options` therefore contains only the style object, while the
 * layer's location fields live on `context.instanceState.options`. Updating
 * the nested object directly would replace the layer with `{ config: ... }`
 * and make the panel fall back to mock data.
 */
export const buildArcOptionsUpdate = <TOptions extends object, K extends keyof ArcOptionsConfig>(
  layerOptions: TOptions,
  arcs: readonly ArcOption[],
  field: K,
  newValue: ArcOptionsConfig[K]
): TOptions => {
  const currentStyle =
    ((layerOptions as any).config?.style as StyleConfig | undefined) ?? ({ arcs: [...arcs] } as StyleConfig);
  const nextStyle: StyleConfig = {
    ...currentStyle,
    arcOptions: {
      ...(currentStyle.arcOptions ?? {}),
      [field]: newValue,
    },
  };

  return setOptionImmutably(layerOptions, 'config.style', nextStyle);
};

export const ArcOptionsEditor = ({ value, onChange, context }: ArcOptionsEditorProps) => {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();
  const [arcSectionsOpen, setArcSectionsOpen] = React.useState(true);
  const layerOptions = (context.instanceState as any)?.options as Record<string, any> | undefined;
  const configuredStyle = layerOptions?.config?.style as StyleConfig | undefined;
  const arcs = value ?? configuredStyle?.arcs ?? [];
  const arcOptions = resolveArcOptions(configuredStyle?.arcOptions);
  const { showBarWidth, showGaugeControls, showSegmentSpacing } = getArcOptionsVisibility(arcs, arcOptions.segments);
  const showGradient = showGaugeControls && usesThresholdColorScheme(context, arcs[0]?.field);

  const addArc = () => {
    const newArc = { field: '', fixed: '' };
    onChange([...arcs, newArc]);
  };

  const removeArc = (idx: number) => {
    const copy = arcs.slice();
    copy.splice(idx, 1);
    onChange(copy);
  };

  const updateField = <K extends keyof ArcOption>(idx: number, field: K, newValue: ArcOption[K]) => {
    const nextArcs = arcs.slice();
    nextArcs[idx] = { ...nextArcs[idx], [field]: newValue };
    onChange(nextArcs);
  };

  const updateArcOptions = <K extends keyof ArcOptionsConfig>(field: K, newValue: ArcOptionsConfig[K]) => {
    const update = context.instanceState?.onChange;
    if (!layerOptions || !update) {
      return;
    }

    const nextOptions = buildArcOptionsUpdate(layerOptions, arcs, field, newValue) as any;
    update({
      ...nextOptions,
      config: {
        ...nextOptions.config,
        groups: [...(nextOptions.config?.groups ?? [])],
      },
    });
  };

  return (
    <>
      <div className={styles.subsection}>
        <CollapsableSection
          label="Arc sections"
          isOpen={arcSectionsOpen}
          onToggle={setArcSectionsOpen}
          className={styles.sectionHeader}
          contentClassName={styles.arcSectionsContent}
        >
          <div className={styles.arcSectionsBody}>
            {arcs.map((arc, i) => {
              return (
                <div className={styles.arcRow} key={i}>
                  <div className={styles.fieldPicker}>
                    <FieldNamePicker
                      context={context}
                      value={arc.field ?? ''}
                      onChange={(val) => {
                        updateField(i, 'field', val);
                      }}
                      item={{
                        settings: {
                          filter: (field: DataField) => field.type === FieldType.number,
                        },
                        id: `arc-field-${i}`,
                        name: `arc-field-${i}`,
                      }}
                    />
                  </div>
                  {!arc.field && (
                    <Tooltip content={'fixed color'}>
                      <div className={styles.fixedColor}>
                        <ColorPicker
                          color={arc.fixed || theme.colors.text.secondary}
                          onChange={(val) => {
                            updateField(i, 'fixed', val);
                          }}
                        />
                      </div>
                    </Tooltip>
                  )}
                  <Button
                    className={styles.removeArc}
                    aria-label=""
                    size="sm"
                    icon="minus"
                    variant="secondary"
                    onClick={() => removeArc(i)}
                    title="Remove arc"
                  />
                </div>
              );
            })}
            <Button size={'sm'} icon="plus" onClick={addArc} variant="secondary">
              Add arc
            </Button>
            <div className={styles.controls}>
              {showBarWidth && (
                <Field label="Bar width factor">
                  <SliderValueEditor
                    value={arcOptions.barWidthFactor}
                    context={context}
                    onChange={(nextValue) => updateArcOptions('barWidthFactor', nextValue)}
                    item={{ settings: BAR_WIDTH_SETTINGS } as FieldConfigPropertyItem}
                  />
                </Field>
              )}
              {showGaugeControls && (
                <>
                  <Field label="Segments">
                    <SliderValueEditor
                      value={arcOptions.segments}
                      context={context}
                      onChange={(nextValue) =>
                        updateArcOptions('segments', Math.round(nextValue ?? arcOptions.segments))
                      }
                      item={{ settings: SEGMENTS_SETTINGS } as FieldConfigPropertyItem}
                    />
                  </Field>
                  {showSegmentSpacing && (
                    <Field label="Segment spacing">
                      <SliderValueEditor
                        value={arcOptions.segmentSpacing}
                        context={context}
                        onChange={(nextValue) => updateArcOptions('segmentSpacing', nextValue)}
                        item={{ settings: SEGMENT_SPACING_SETTINGS } as FieldConfigPropertyItem}
                      />
                    </Field>
                  )}
                  <InlineFieldRow className={styles.thresholdControls}>
                    <InlineField label="Show thresholds" className={styles.thresholdField}>
                      <InlineSwitch
                        value={arcOptions.showThresholds}
                        onChange={() => updateArcOptions('showThresholds', !arcOptions.showThresholds)}
                      />
                    </InlineField>
                    {showGradient && (
                      <InlineField label="Gradient" className={styles.thresholdField}>
                        <InlineSwitch
                          value={arcOptions.gradient}
                          onChange={() => updateArcOptions('gradient', !arcOptions.gradient)}
                        />
                      </InlineField>
                    )}
                  </InlineFieldRow>
                </>
              )}
            </div>
          </div>
        </CollapsableSection>
      </div>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
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
    arcSectionsContent: css({
      minWidth: 0,
      padding: theme.spacing(1, 0, 0),
    }),
    arcSectionsBody: css({
      minWidth: 0,
    }),
    controls: css({
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
    }),
    thresholdControls: css({
      alignItems: 'flex-end',
      flexWrap: 'wrap',
      gap: theme.spacing(1),
    }),
    thresholdField: css({
      marginBottom: 0,
    }),
    arcRow: css({
      display: 'flex',
      alignItems: 'center',
      gap: `0 ${theme.spacing(1)}`,
      minWidth: 0,
      marginBottom: theme.spacing(1),
    }),
    fieldPicker: css({
      flex: '1 1 0',
      minWidth: 0,
      overflow: 'hidden',
    }),
    fixedColor: css({
      flex: '0 0 auto',
    }),
    removeArc: css({
      flex: '0 0 auto',
    }),
  };
};
