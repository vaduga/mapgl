import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifacts = path.join(root, 'artifacts');
await fs.mkdir(artifacts, { recursive: true });
const npmEnvironment = {
  ...process.env,
  npm_config_cache: path.join(root, '.cache/npm'),
  npm_config_loglevel: 'error',
};
// The OSS bundle uses panel-core/src directly. Build the workspace only for
// the packed artifact consumed by other downstream repositories.
for (const args of [
  ['run', 'build', '--workspace', '@mapgl/panel-core'],
  ['pack', '--workspace', '@mapgl/panel-core', '--pack-destination', artifacts],
]) {
  const result = spawnSync('npm', args, { cwd: root, env: npmEnvironment, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const manifest = JSON.parse(await fs.readFile(path.join(root, 'panel-core/package.json'), 'utf8'));
const defaultName = `${manifest.name.replace('@', '').replace('/', '-')}-${manifest.version}.tgz`;
const defaultPath = path.join(artifacts, defaultName);
const bytes = await fs.readFile(defaultPath);
const digest = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 16);
const contentName = `${defaultName.slice(0, -4)}-${digest}.tgz`;
await fs.rename(defaultPath, path.join(artifacts, contentName));
console.log(contentName);
