import { describe, expect, it } from '@jest/globals';
import { FieldColorModeId, FieldType } from '@grafana/data';

import { buildArcOptionsUpdate, getArcOptionsVisibility, usesThresholdColorScheme } from './ArcOptionsEditor';

describe('ArcOptionsEditor visibility', () => {
  it('shows Bar width factor and gauge controls for one metric arc', () => {
    expect(getArcOptionsVisibility([{ field: 'load', fixed: '' }], 48)).toEqual({
      showBarWidth: true,
      showGaugeControls: true,
      showSegmentSpacing: true,
    });
  });

  it.each([[[]], [[{ fixed: '#00ff00' }]], [[{ field: 'load', fixed: '' }, { fixed: '#00ff00' }]]])(
    'hides gauge-only controls for non-gauge arc configurations',
    (arcs) => {
      expect(getArcOptionsVisibility(arcs, 48)).toEqual({
        showBarWidth: arcs.length > 0,
        showGaugeControls: false,
        showSegmentSpacing: false,
      });
    }
  );

  it('hides Segment spacing when a metric gauge has one segment', () => {
    expect(getArcOptionsVisibility([{ field: 'load', fixed: '' }], 1)).toEqual({
      showBarWidth: true,
      showGaugeControls: true,
      showSegmentSpacing: false,
    });
  });

  it('hides Bar width factor when no arc sections are configured', () => {
    expect(getArcOptionsVisibility([], 48)).toEqual({
      showBarWidth: false,
      showGaugeControls: false,
      showSegmentSpacing: false,
    });
  });
});

describe('ArcOptionsEditor updates', () => {
  it('updates the layer style without dropping data-field configuration', () => {
    const layerOptions = {
      name: 'Nodes',
      type: 'markers',
      locField: 'VertexA',
      parField: 'VertexB',
      edgeIdField: 'edgeId',
      query: { refId: 'A' },
      config: {
        style: {
          arcs: [{ field: 'load', fixed: '' }],
          arcOptions: { barWidthFactor: 0.5 },
        },
        groups: [{ label: 'prod' }],
      },
    };

    const next = buildArcOptionsUpdate(layerOptions, layerOptions.config.style.arcs, 'segments', 24);

    expect(next).toMatchObject({
      name: 'Nodes',
      type: 'markers',
      locField: 'VertexA',
      parField: 'VertexB',
      edgeIdField: 'edgeId',
      query: { refId: 'A' },
    });
    expect(next.config.style).toEqual({
      arcs: [{ field: 'load', fixed: '' }],
      arcOptions: { barWidthFactor: 0.5, segments: 24 },
    });
    expect(next.config.groups).toEqual([{ label: 'prod' }]);
  });

  it('persists the Gradient switch in the layer style', () => {
    const layerOptions = {
      config: { style: { arcs: [{ field: 'load', fixed: '' }] } },
    };

    const next = buildArcOptionsUpdate(layerOptions, layerOptions.config.style.arcs, 'gradient', false);

    expect((next.config.style as any).arcOptions).toEqual({ gradient: false });
  });
});

describe('ArcOptionsEditor field-aware visibility', () => {
  it('recognizes a selected field using Grafana From thresholds color mode', () => {
    expect(
      usesThresholdColorScheme(
        {
          data: [
            {
              fields: [
                { name: 'load', type: FieldType.number, config: { color: { mode: FieldColorModeId.Thresholds } } },
              ],
            },
          ],
        },
        'load'
      )
    ).toBe(true);
  });

  it('does not recognize continuous or missing selected fields', () => {
    const context = {
      data: [{ fields: [{ name: 'load', type: FieldType.number, config: { color: { mode: 'continuous-GrYlRd' } } }] }],
    };
    expect(usesThresholdColorScheme(context, 'load')).toBe(false);
    expect(usesThresholdColorScheme(context, 'missing')).toBe(false);
  });
});
