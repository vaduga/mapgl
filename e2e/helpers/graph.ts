import type { Locator, Page } from '@playwright/test';
import type { Panel } from '@grafana/plugin-e2e';
import { expect } from '@grafana/plugin-e2e';

export const UNIFIED_GRAPH_DASHBOARD = 'mapgl_unified_graph_e2e.json';

export function graphE2EQuery(): URLSearchParams {
  return new URLSearchParams({ mapglE2E: '1' });
}

export async function enableGraphE2E(page: Page): Promise<void> {
  const url = new URL(page.url());
  url.searchParams.set('mapglE2E', '1');
  await page.goto(url.toString());
}

export interface GraphSummary {
  phase: string;
  nodeCount: number;
  edgeCount: number;
  namespaceCount: number;
  topologySignature: string;
  nodeColors: string[];
  edgeWidths: number[];
  layoutDirection: string;
  visibleNamespaces: string[];
  routedVisible: boolean;
}

export function graphRoot(panel: Panel): Locator {
  return panel.locator.getByTestId('mapgl-graph');
}

export async function waitForGraph(panel: Panel, phase: 'ready' | 'empty' | 'fatal' = 'ready'): Promise<Locator> {
  const root = graphRoot(panel);
  await expect(root).toHaveAttribute('data-graph-phase', phase);
  return root;
}

export async function readGraphSummary(panel: Panel): Promise<GraphSummary> {
  const root = graphRoot(panel);
  const value = (name: string) => root.getAttribute(name);
  const list = (raw: string | null) => (raw ? raw.split(',').filter(Boolean) : []);

  return {
    phase: (await value('data-graph-phase')) ?? '',
    nodeCount: Number(await value('data-graph-node-count')),
    edgeCount: Number(await value('data-graph-edge-count')),
    namespaceCount: Number(await value('data-graph-namespace-count')),
    topologySignature: (await value('data-graph-topology-signature')) ?? '',
    nodeColors: ((await value('data-graph-node-colors')) ?? '').split(';').filter(Boolean),
    edgeWidths: list(await value('data-graph-edge-widths')).map(Number),
    layoutDirection: (await value('data-graph-layout-direction')) ?? '',
    visibleNamespaces: list(await value('data-graph-visible-namespaces')),
    routedVisible: (await value('data-graph-routed-visible')) === 'true',
  };
}

export async function inspectGraphNode(panel: Panel, namespace: string, nodeId: string): Promise<Locator> {
  const node = panel.locator.getByRole('button', {
    name: `Inspect graph node ${namespace}/${nodeId}`,
    exact: true,
  });
  await node.focus();
  await node.press('Enter');
  const tooltip = panel.ctx.page.getByTestId('graph-tooltip');
  await expect(tooltip).toBeVisible();
  return tooltip;
}
