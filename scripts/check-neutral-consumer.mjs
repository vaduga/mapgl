import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';
import rspack from '@rspack/core';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const core = path.join(root, 'panel-core');
const manifest = JSON.parse(fs.readFileSync(path.join(core, 'package.json'), 'utf8'));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'mapgl-neutral-consumer-'));
const modules = path.join(work, 'node_modules');
const copied = new Set();
function installedPackage(name, from = root) {
  for (let dir = from; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return fs.realpathSync(candidate);
    }
    if (dir === path.dirname(dir)) {
      throw new Error(`Installed dependency missing: ${name}`);
    }
  }
}
function copyPackage(name, from, consumer = work) {
  if (name.startsWith('@grafana/') || name.startsWith('@vaduga/mapgl-grafana-adapter')) {
    throw new Error(`Neutral dependency closure contains ${name}`);
  }
  // This consumer selects the same WebGL-only exports as the browser bundle.
  if (name === '@luma.gl/webgpu') {
    return;
  }
  const source = installedPackage(name, from);
  const dependency = JSON.parse(fs.readFileSync(path.join(source, 'package.json'), 'utf8'));
  let target = path.join(modules, name);
  for (let dir = consumer; ; dir = path.dirname(dir)) {
    const candidate = path.join(dir, 'node_modules', name);
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      const existing = JSON.parse(fs.readFileSync(path.join(candidate, 'package.json'), 'utf8'));
      if (existing.version === dependency.version) {
        return;
      }
      target = path.join(consumer, 'node_modules', name);
      break;
    }
    if (dir === work) {
      break;
    }
  }
  if (copied.has(target)) {
    return;
  }
  copied.add(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(source, target, {
    recursive: true,
    dereference: true,
    filter: (sourcePath) => !sourcePath.split(path.sep).slice(source.split(path.sep).length).includes('node_modules'),
  });
  for (const entry of Object.keys(dependency.dependencies ?? {})) {
    copyPackage(entry, source, target);
  }
  for (const entry of Object.keys(dependency.peerDependencies ?? {})) {
    if (!dependency.peerDependenciesMeta?.[entry]?.optional) {
      copyPackage(entry, source, target);
    }
  }
}
try {
  const target = path.join(modules, '@vaduga/mapgl-core');
  fs.mkdirSync(target, { recursive: true });
  fs.copyFileSync(path.join(core, 'package.json'), path.join(target, 'package.json'));
  fs.cpSync(path.join(core, 'dist'), path.join(target, 'dist'), { recursive: true });
  for (const name of [
    ...Object.keys(manifest.dependencies),
    ...Object.keys(manifest.peerDependencies),
    '@types/react',
    '@types/node',
  ]) {
    copyPackage(name, root);
  }
  if (fs.existsSync(path.join(modules, '@grafana'))) {
    throw new Error('Grafana is installed in the neutral consumer');
  }
  fs.writeFileSync(path.join(work, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
  const allExports = Object.entries(manifest.exports)
    .filter(([key, value]) => key !== './package.json' && !key.includes('*') && typeof value === 'object')
    .map(
      ([key], index) =>
        `import * as entry${index} from '@vaduga/mapgl-core${key === '.' ? '' : key.slice(1)}';\nvoid entry${index};`
    )
    .join('\n');
  const example = fs
    .readFileSync(path.join(core, 'examples/neutral.ts'), 'utf8')
    .replaceAll("from '../src/", "from '@vaduga/mapgl-core/");
  fs.writeFileSync(path.join(work, 'example.ts'), example);
  fs.writeFileSync(
    path.join(work, 'consumer.ts'),
    allExports +
      '\n' +
      `import { PanelController } from '@vaduga/mapgl-core/runtime';\nimport { metricGraphSource, metricGraphInput } from './example';\nconst runtime = new PanelController();\nvoid runtime.update(metricGraphInput(metricGraphSource('source', [0, 100])));\n`
  );
  const program = ts.createProgram([path.join(work, 'consumer.ts')], {
    strict: true,
    skipLibCheck: false,
    customConditions: ['visgl:webgl-only'],
    noEmit: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    jsx: ts.JsxEmit.React,
    esModuleInterop: true,
    types: [],
  });
  // MSAGL 1.1.24 predates TS 6's disposable SetIterator; keep all MapGL declarations checked.
  const errors = ts
    .getPreEmitDiagnostics(program)
    .filter(
      (d) =>
        d.category === ts.DiagnosticCategory.Error &&
        !(d.code === 2416 && d.file?.fileName.endsWith('/@msagl/core/dist/utils/PointSet.d.ts'))
    );
  if (errors.length) {
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(errors, {
        getCanonicalFileName: (n) => n,
        getCurrentDirectory: () => work,
        getNewLine: () => '\n',
      })
    );
  }
  const runtimeExample = ts.transpileModule(example, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  fs.writeFileSync(path.join(work, 'example.mjs'), runtimeExample);
  fs.writeFileSync(
    path.join(work, 'run.mjs'),
    `import assert from 'node:assert/strict';
import { PanelController } from '@vaduga/mapgl-core/runtime';
import { composeRenderLayers } from '@vaduga/mapgl-core/render';
import { MapglRenderGeneration } from '@vaduga/mapgl-core/render/runtime';
import { buildGraphBinaryCollections } from '@vaduga/mapgl-core/render';
import { NodesGeojsonLayer } from '@vaduga/mapgl-core/deckLayers';
import { autorun } from 'mobx';
import { createVisibility, createGroupLegend } from '@vaduga/mapgl-core/store';
import { fitCartesianBounds } from '@vaduga/mapgl-core/utils';
import { metricGraphSource, metricGraphInput } from './example.mjs';
const runtime = new PanelController();
const metrics = [0, 100, 50];
await runtime.update(metricGraphInput(metricGraphSource('baseline', metrics)));
assert.equal(runtime.view.phase, 'ready');
assert.equal(runtime.state.snapshot.relations.recordCount, 2);
const selectedNodes = [];
const stopSelection = autorun(() => selectedNodes.push(runtime.stores.pointStore.getSelectedNode));
const firstNode = runtime.state.graph.state.nodeByKey.values().next().value;
runtime.select({ id: firstNode.id, namespaceId: firstNode.parent.id }, 'host');
assert.equal(selectedNodes.length, 2, 'Packaged selection must notify observers');
assert.equal(selectedNodes[1], firstNode);
runtime.select(undefined, 'host');
assert.equal(selectedNodes.length, 3, 'Packaged clearing must notify observers');
assert.equal(selectedNodes[2], null);
runtime.stores.pointStore.setSelectedNode(firstNode);
assert.equal(runtime.stores.pointStore.getHasFocusHighlight, true);
assert.equal(runtime.stores.pointStore.getSelEdges.length, 1);
runtime.stores.pointStore.focus();
assert.equal(runtime.stores.pointStore.getHasFocusHighlight, false);
const visibility = createVisibility({graph: runtime.state.graph.state.graph, groupCount: 1, isLogic: true, isRouted: true, dataLayers: []});
assert.deepEqual([...visibility.getActiveGroups()], [1]);
assert.equal(createGroupLegend(runtime.state.graph.state.graph, [{color: 'red'}], new Uint8Array([0]))[0].disabled, true);
assert.equal(fitCartesianBounds([0, 0, 10, 10], 100, 100, {maxZoom: 10}).zoom, Math.log2(10));
stopSelection();
const row = runtime.state.snapshot.nodes[1].primaryRow;
await runtime.patchMetrics([{ row, propertyKey: 'metric', value: 200 }]);
assert.deepEqual(runtime.state.visual.state.nodes.map(node => node.style.size), [5, 10, 7.5]);
assert.deepEqual(metrics, [0, 100, 50]);
const beforePatch = runtime.state;
await runtime.patchMetrics([{ row: beforePatch.snapshot.nodes[0].primaryRow, propertyKey: 'metric', value: 75 }]);
assert.equal(runtime.state.graph, beforePatch.graph);
assert.equal(runtime.state.layout.state, beforePatch.layout.state);
assert.equal(runtime.state.visual.state.nodes[2], beforePatch.visual.state.nodes[2]);
const scene = runtime.scene;
const binary = buildGraphBinaryCollections({ graphs: [scene.render.graph], visibleNamespaces: [scene.render.graph.id], ...scene.render, showAnnotations: false, hide: false });
assert.equal(binary.length, 1);
assert.equal(binary[0].points.featureIds.value.length, 3);
assert.deepEqual([...binary[0].points.positions.value], [...scene.render.positions]);
const nodes = NodesGeojsonLayer({ biCol: binary[0], options: {common: {}}, isLogic: true, isRouted: false, getVisLayers: visibility, visible: true });
assert.equal(nodes.props.data, binary[0]);
assert.equal(nodes.props.getPointRadius({properties: scene.render.features[2]}), 3.75);
assert.deepEqual(composeRenderLayers({ nodes: [nodes] }).map(layer => layer.id), [nodes.id]);
const generation = new MapglRenderGeneration();
const stale = generation.begin();
const accepted = generation.begin();
assert.equal(stale(), false); assert.equal(accepted(), true);
generation.dispose(); assert.equal(accepted(), false);
runtime.dispose();
console.log('Neutral source normalization, visual composition, overlays, lifecycle and layer composition passed');
`
  );
  await new Promise((resolve, reject) => {
    const compiler = rspack({
      mode: 'development',
      target: 'node',
      context: work,
      entry: './run.mjs',
      output: { path: work, filename: 'run.cjs' },
      devtool: false,
      resolve: {
        conditionNames: ['visgl:webgl-only', 'import', 'module', 'default'],
        extensions: ['.js', '.mjs', '.json'],
        fullySpecified: false,
      },
      module: { rules: [{ test: /\.m?js$/, resolve: { fullySpecified: false } }] },
    });
    compiler.run((error, stats) =>
      compiler.close((closeError) =>
        error || closeError || stats?.hasErrors()
          ? reject(error ?? closeError ?? new Error(stats.toString({ all: false, errors: true })))
          : resolve()
      )
    );
  });
  const executed = spawnSync(process.execPath, [path.join(work, 'run.cjs')], { cwd: work, encoding: 'utf8' });
  if (executed.status !== 0) {
    throw new Error(executed.stderr || executed.stdout);
  }
  process.stdout.write(executed.stdout);
  console.log(
    `Isolated consumer passed all ${allExports.split('import *').length - 1} core exports with ${copied.size} neutral dependencies and no Grafana packages`
  );
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
