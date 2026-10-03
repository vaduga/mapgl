import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../panel-core');
const repository = path.dirname(root);
const testBoundaryOnly = process.argv.includes('--test-boundary');
const failures = [];
const forbidden =
  /^(?:@(?:grafana|perses-dev)(?:\/|$)|@vaduga\/(?:mapgl-grafana-adapter|mapgl-perses-adapter|mapgl-extensions|mapgl-pro)(?:\/|$)|app\/)/;
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const group of ['dependencies', 'peerDependencies', 'devDependencies', 'optionalDependencies']) {
  for (const dependency of Object.keys(manifest[group] ?? {})) {
    if (forbidden.test(dependency)) {
      failures.push(`${group}: ${dependency}`);
    }
  }
}
function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]));
}
const publicRoots = [
  'src',
  'grafana-adapter/src',
  'grafana-adapter/test',
  'e2e',
  'panel-core/src',
  'panel-core/test',
  'panel-core/type-tests',
  'panel-core/examples',
  'provisioning',
];
const compilerConfig = ts.readConfigFile(path.join(repository, 'tsconfig.json'), ts.sys.readFile);
const compilerOptions = ts.parseJsonConfigFileContent(compilerConfig.config, ts.sys, repository).options;
const publicFiles = new Set([
  ...new Set([...publicRoots.flatMap((dir) => walk(path.join(repository, dir))), ...walk(path.join(root, 'dist'))]),
]);
for (const filename of publicFiles) {
  if (!/\.[cm]?[jt]sx?$/.test(filename)) {
    continue;
  }
  const source = ts.createSourceFile(filename, fs.readFileSync(filename, 'utf8'), ts.ScriptTarget.Latest, true);
  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      specifier = node.moduleSpecifier;
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      specifier = node.argument.literal;
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        ['require', 'jest.mock', 'jest.doMock', 'jest.requireActual'].includes(node.expression.getText(source)))
    ) {
      specifier = node.arguments[0];
    }
    if (specifier && ts.isStringLiteralLike(specifier)) {
      const inCore = filename.startsWith(root + path.sep);
      const privatePath = /(?:^|\/)(?:mapgl-pro|mapgl-extensions|mapgl-perses-pro)(?:\/|$)/;
      const resolved = ts.resolveModuleName(specifier.text, filename, compilerOptions, ts.sys).resolvedModule;
      const target = resolved && fs.realpathSync(resolved.resolvedFileName);
      if (target?.startsWith(repository + path.sep) && !target.includes(`${path.sep}node_modules${path.sep}`)) {
        publicFiles.add(target);
      }
      if (
        (inCore && forbidden.test(specifier.text)) ||
        privatePath.test(specifier.text) ||
        (target && privatePath.test(target))
      ) {
        failures.push(`${path.relative(repository, filename)}: ${specifier.text}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
for (const config of ['tsconfig.json', 'tsconfig.build.json']) {
  if (/@grafana|grafana-adapter/.test(fs.readFileSync(path.join(root, config), 'utf8'))) {
    failures.push(`${config}: native configuration`);
  }
}
for (const [key, entry] of Object.entries(testBoundaryOnly ? {} : manifest.exports)) {
  if (key.includes('*') || key === './package.json') {
    continue;
  }
  for (const target of Object.values(entry)) {
    if (!fs.existsSync(path.join(root, target))) {
      failures.push(`${key}: missing ${target}`);
    }
  }
}
if (failures.length) {
  throw new Error('Core isolation check failed:\n' + failures.join('\n'));
}
console.log(
  testBoundaryOnly
    ? 'Public test, helper, example and source dependency boundary passed'
    : `Core isolation passed: ${Object.keys(manifest.exports).length} exports, public source/test/helper/example dependencies and package configuration`
);
