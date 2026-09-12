import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configFile = ts.readConfigFile(path.join(root, 'tsconfig.build.json'), ts.sys.readFile);
if (configFile.error) throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
const program = ts.createProgram(config.fileNames, config.options);
const diagnostics = [...config.errors, ...ts.getPreEmitDiagnostics(program)];
if (diagnostics.length) {
  console.error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (name) => name,
    getCurrentDirectory: () => root,
    getNewLine: () => '\n',
  }));
}
if (diagnostics.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) process.exit(1);
await fs.rm(path.join(root, 'dist'), { recursive: true, force: true });
const result = program.emit();
if (result.emitSkipped || result.diagnostics.some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)) {
  throw new Error('Core package emit failed');
}
await copyAssets(path.join(root, 'src'));
await fs.copyFile(path.join(root, '../LICENSE'), path.join(root, 'LICENSE'));
await resolveRelativeImports(path.join(root, 'dist'));
console.log('Built @mapgl/panel-core ESM, declarations, and assets');

async function copyAssets(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const source = path.join(dir, entry.name);
    if (entry.isDirectory()) await copyAssets(source);
    else if (!/\.[cm]?[jt]sx?$/.test(entry.name)) {
      const destination = path.join(root, 'dist', path.relative(path.join(root, 'src'), source));
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.copyFile(source, destination);
    }
  }
}

async function resolveRelativeImports(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await resolveRelativeImports(file);
    else if (entry.name.endsWith('.js')) {
      const source = await fs.readFile(file, 'utf8');
      const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
      const edits = [];
      function visit(node) {
        const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
          ? node.moduleSpecifier
          : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
            ? node.arguments[0] : undefined;
        if (specifier && ts.isStringLiteral(specifier) && specifier.text.startsWith('.')) {
          const absolute = path.resolve(path.dirname(file), specifier.text);
          const suffix = ts.sys.fileExists(`${absolute}.js`) ? '.js'
            : ts.sys.fileExists(path.join(absolute, 'index.js')) ? '/index.js' : '';
          if (suffix) edits.push([specifier.getStart(parsed), specifier.end, JSON.stringify(specifier.text + suffix)]);
        }
        ts.forEachChild(node, visit);
      }
      visit(parsed);
      let output = source;
      for (const [start, end, value] of edits.sort((a, b) => b[0] - a[0])) {
        output = output.slice(0, start) + value + output.slice(end);
      }
      await fs.writeFile(file, output);
    }
  }
}
