import rspack, { type Compiler, type Configuration } from '@rspack/core';
import fs from 'fs';
import path from 'path';
import grafanaConfig from './.config/rspack/rspack.config';
import { merge } from 'webpack-merge';

const rootCopyFiles = new Map([
  ['../LICENSE', 'LICENSE'],
  ['../CHANGELOG.md', 'CHANGELOG.md'],
]);

class RootFileCopyPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('RootFileCopyPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'RootFileCopyPlugin',
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          for (const filename of rootCopyFiles.values()) {
            compilation.emitAsset(
              filename,
              new rspack.sources.RawSource(fs.readFileSync(path.resolve(process.cwd(), filename)))
            );
          }
        }
      );
    });
  }
}

const patchRootCopyFiles = (baseConfig: Configuration): void => {
  baseConfig.plugins = baseConfig.plugins?.map((plugin) => {
    if (plugin?.constructor?.name !== 'CopyRspackPlugin') {
      return plugin;
    }

    const copyPlugin = plugin as typeof plugin & {
      _args?: Array<{ patterns?: Array<Record<string, unknown>> }>;
    };
    const options = copyPlugin._args?.[0];
    const patterns = options?.patterns;

    if (!patterns) {
      return plugin;
    }

    return new (plugin.constructor as new (options: unknown) => typeof plugin)({
      ...options,
      patterns: patterns.filter((pattern) => !rootCopyFiles.has(String(pattern.from))),
    });
  });
  baseConfig.plugins?.push(new RootFileCopyPlugin());
};

const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  patchRootCopyFiles(baseConfig);

  const extension: Configuration = {
    entry: {
      layoutWorker: './workers/layout-worker.ts',
    },
    module: {
      rules: [
        {
          test: /node_modules\/@msagl\/core\/dist\/.*\.js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    resolve: {
      alias: {
        mapLib: path.resolve(process.cwd(), 'mapLib/src/main.ts'),
        'mapLib/utils': path.resolve(process.cwd(), 'mapLib/src/utils/index.ts'),
        'mapLib/types': path.resolve(process.cwd(), 'mapLib/src/types/index.ts'),
        'mapLib/defaults': path.resolve(process.cwd(), 'mapLib/src/types/defaults.ts'),
      },
    },
  };
  return merge(baseConfig, extension);
};

export default config;
