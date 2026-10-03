import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../panel-core');
const failures = [];
const forbidden = /^(?:@grafana(?:\/|$)|@vaduga\/(?:mapgl-grafana-adapter|mapgl-extensions)(?:\/|$)|app\/)/;
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
for (const filename of [...walk(path.join(root, 'src')), ...walk(path.join(root, 'dist'))]) {
  if (!/\.[cm]?[jt]sx?$/.test(filename) || /\.(test|spec)\./.test(filename)) {
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
      (node.expression.kind === ts.SyntaxKind.ImportKeyword || node.expression.getText(source) === 'require')
    ) {
      specifier = node.arguments[0];
    }
    if (specifier && ts.isStringLiteral(specifier) && forbidden.test(specifier.text)) {
      failures.push(`${path.relative(root, filename)}: ${specifier.text}`);
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
for (const [key, entry] of Object.entries(manifest.exports)) {
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
  `Core isolation passed: ${Object.keys(manifest.exports).length} exports, source/declaration/runtime imports and package configuration`
);
