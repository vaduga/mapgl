import { getFrameMatchers } from '@grafana/data';
import type { DataFrame } from '@grafana/data';

import { findField } from '../../grafana_core/app/features/dimensions/utils';
import { getLocationFields, getLocationMatchers } from '../../utils/locationMatchers';
import type { ExtendFrameGeometrySource } from '../../extension';
import { GraphDiagnosticCollector } from './diagnostics';
import type {
  GraphFrameOptions,
  GraphFrameSelection,
  GraphResolvedFrame,
  GraphResolvedLocation,
  GraphStageResult,
} from './types';

export function selectGraphFrames(
  frames: readonly DataFrame[],
  query?: GraphFrameOptions['query']
): readonly GraphFrameSelection[] {
  const matcher = query ? getFrameMatchers(query as Parameters<typeof getFrameMatchers>[0]) : undefined;
  const selections: GraphFrameSelection[] = [];

  frames.forEach((frame, frameIndex) => {
    if (!matcher || matcher(frame)) {
      selections.push(Object.freeze({ frame, frameIndex }));
    }
  });

  return Object.freeze(selections);
}

function optionalField(
  selection: GraphFrameSelection,
  fieldName: string | undefined,
  code:
    | 'missing-target-field'
    | 'missing-edge-id-field'
    | 'missing-source-namespace-field'
    | 'missing-target-namespace-field',
  label: string,
  diagnostics: GraphDiagnosticCollector,
  layerName?: string
) {
  if (!fieldName) {
    return undefined;
  }

  const field = findField(selection.frame, fieldName);
  if (!field) {
    diagnostics.add(
      code,
      'warning',
      `Configured ${label} field was not found in a selected frame`,
      {
        layerName,
        frameIndex: selection.frameIndex,
        frameRefId: selection.frame.refId,
        fieldName,
      },
      fieldName
    );
  }
  return field;
}

export async function resolveGraphFrames(
  selections: readonly GraphFrameSelection[],
  options: GraphFrameOptions
): Promise<GraphStageResult<readonly GraphResolvedFrame[]>> {
  const diagnostics = new GraphDiagnosticCollector(options.diagnosticExampleLimit);
  const locationMatchers = await getLocationMatchers(options.location as ExtendFrameGeometrySource | undefined);
  const resolved: GraphResolvedFrame[] = [];

  for (const selection of selections) {
    const nodeId = findField(selection.frame, options.nodeIdField);
    if (!nodeId) {
      diagnostics.add(
        'missing-node-id-field',
        'fatal',
        'Configured node ID field was not found in a selected frame',
        {
          layerName: options.layerName,
          frameIndex: selection.frameIndex,
          frameRefId: selection.frame.refId,
          fieldName: options.nodeIdField,
        },
        options.nodeIdField
      );
      continue;
    }

    const locationFields = getLocationFields(selection.frame, locationMatchers);
    const location: GraphResolvedLocation = {
      geojson: locationFields.geojson,
      geo: locationFields.geo,
      geohash: locationFields.geohash,
      longitude: locationFields.longitude,
      latitude: locationFields.latitude,
      lookup: locationFields.lookup,
      ...(locationMatchers.gazetteer
        ? {
            findLookup: (value: string) => locationMatchers.gazetteer?.find(value)?.coords,
          }
        : {}),
    };

    resolved.push(
      Object.freeze({
        selection,
        nodeId,
        target: optionalField(
          selection,
          options.targetField,
          'missing-target-field',
          'target/path',
          diagnostics,
          options.layerName
        ),
        edgeId: optionalField(
          selection,
          options.edgeIdField,
          'missing-edge-id-field',
          'edge ID',
          diagnostics,
          options.layerName
        ),
        sourceNamespace: options.isLogic
          ? optionalField(
              selection,
              options.sourceNamespaceField,
              'missing-source-namespace-field',
              'source namespace',
              diagnostics,
              options.layerName
            )
          : undefined,
        targetNamespace: options.isLogic
          ? optionalField(
              selection,
              options.targetNamespaceField,
              'missing-target-namespace-field',
              'target namespace',
              diagnostics,
              options.layerName
            )
          : undefined,
        location: Object.freeze(location),
      })
    );
  }

  const resultDiagnostics = diagnostics.result();
  if (diagnostics.hasFatal()) {
    return Object.freeze({
      ok: false,
      diagnostics: resultDiagnostics,
    });
  }

  return Object.freeze({
    ok: true,
    value: Object.freeze(resolved),
    diagnostics: resultDiagnostics,
    empty: resolved.length === 0,
  });
}

export function createGraphRowRef(selection: GraphFrameSelection, rowIndex: number, layerIndex?: number) {
  return Object.freeze({
    frameIndex: selection.frameIndex,
    frameRefId: selection.frame.refId,
    rowIndex,
    ...(layerIndex !== undefined && { layerIndex }),
  });
}
