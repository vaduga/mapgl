import { css } from '@emotion/css';
import { locationService } from '@grafana/runtime';
import type { GraphFrameSnapshotSummary, GraphNodeRecord } from '@mapgl/panel-core/graph/frame';
import { getGraphEdges, type Graph } from '@mapgl/panel-core/graph';
import React, { useMemo } from 'react';

const GRAPH_DOM_SAMPLE_LIMIT = 32;
const GRAPH_E2E_QUERY_FLAG = 'mapglE2E';

export interface GraphDomObservabilityProps {
  children: React.ReactNode;
  className: string;
  colors: Uint8Array;
  edgeRevision: number;
  features: readonly any[];
  graphs: readonly Graph[];
  isRouted: boolean;
  layoutDirection?: unknown;
  nodes?: readonly GraphNodeRecord[];
  onInspectNode(index: number, feature: any): void;
  phase: string;
  summary?: GraphFrameSnapshotSummary;
  visibleNamespaces: readonly string[];
}

function isEnabled(): boolean {
  return locationService.getSearch().get(GRAPH_E2E_QUERY_FLAG) === '1';
}

export const GraphDomObservability = React.forwardRef<HTMLDivElement, GraphDomObservabilityProps>(
  function GraphDomObservability(props, ref) {
    if (!isEnabled()) {
      return (
        <div className={props.className} ref={ref}>
          {props.children}
        </div>
      );
    }

    return <EnabledGraphDomObservability {...props} ref={ref} />;
  }
);

const EnabledGraphDomObservability = React.forwardRef<HTMLDivElement, GraphDomObservabilityProps>(
  function EnabledGraphDomObservability(
    {
      children,
      className,
      colors,
      edgeRevision,
      features,
      graphs,
      isRouted,
      layoutDirection,
      nodes,
      onInspectNode,
      phase,
      summary,
      visibleNamespaces,
    },
    ref
  ) {
    const resolvedNodeColors = useMemo(() => {
      const values = new Set<string>();
      const sampledLength = Math.min(colors.length, GRAPH_DOM_SAMPLE_LIMIT * 4);
      for (let index = 0; index + 3 < sampledLength; index += 4) {
        values.add(`${colors[index]},${colors[index + 1]},${colors[index + 2]},${colors[index + 3]}`);
      }
      return Array.from(values).join(';');
    }, [colors]);

    const resolvedEdgeWidths = useMemo(() => {
      const widths = new Set<number>();
      let sampledCount = 0;
      for (const currentGraph of graphs) {
        for (const edge of getGraphEdges(currentGraph)) {
          const width = edge.data?.dataRecord?.edgeStyle?.size;
          if (typeof width === 'number' && Number.isFinite(width)) {
            widths.add(width);
          }
          sampledCount++;
          if (sampledCount === GRAPH_DOM_SAMPLE_LIMIT) {
            return Array.from(widths).join(',');
          }
        }
      }
      return Array.from(widths).join(',');
    }, [graphs, edgeRevision]);

    return (
      <div
        className={className}
        ref={ref}
        data-testid="mapgl-graph"
        data-graph-phase={phase}
        data-graph-node-count={summary?.nodeCount ?? 0}
        data-graph-edge-count={summary?.edgeCount ?? 0}
        data-graph-namespace-count={summary?.namespaceCount ?? 0}
        data-graph-topology-signature={summary?.topologySignature ?? ''}
        data-graph-node-colors={resolvedNodeColors}
        data-graph-edge-widths={resolvedEdgeWidths}
        data-graph-layout-direction={String(layoutDirection ?? '')}
        data-graph-visible-namespaces={[...visibleNamespaces].sort().join(',')}
        data-graph-routed-visible={isRouted}
      >
        <div className={accessibleGraphNodes} aria-label="Graph nodes">
          {nodes?.slice(0, GRAPH_DOM_SAMPLE_LIMIT).map((node) => (
            <button
              key={node.key}
              type="button"
              aria-label={`Inspect graph node ${node.namespaceId ? `${node.namespaceId}/` : ''}${node.id}`}
              onClick={() => onInspectNode(node.index, features[node.index])}
            >
              {node.id}
            </button>
          ))}
        </div>
        {children}
      </div>
    );
  }
);

const accessibleGraphNodes = css`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;
