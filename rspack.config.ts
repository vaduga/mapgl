import rspack, { type Compiler, type Configuration } from '@rspack/core';
import fs from 'fs';
import path from 'path';
import grafanaConfig from './.config/rspack/rspack.config';
import { merge } from 'webpack-merge';

const rootCopyFiles = new Map([
  ['../LICENSE', 'LICENSE'],
  ['../CHANGELOG.md', 'CHANGELOG.md'],
]);

const coreIconsPath = path.resolve(path.dirname(require.resolve('@mapgl/panel-core/package.json')), 'dist/img/icons');

const getCoreIconFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? getCoreIconFiles(fullPath) : [fullPath];
  });
};

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

class CoreIconCopyRspackPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('CoreIconCopyRspackPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'CoreIconCopyRspackPlugin',
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          for (const sourcePath of getCoreIconFiles(coreIconsPath)) {
            const relativePath = path.relative(coreIconsPath, sourcePath).split(path.sep).join('/');
            compilation.emitAsset(
              `img/icons/${relativePath}`,
              new rspack.sources.RawSource(fs.readFileSync(sourcePath))
            );
          }
        }
      );
    });
  }
}

class MapLibreWorkerAssetsPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('MapLibreWorkerAssetsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'MapLibreWorkerAssetsPlugin',
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          for (const [fileName, sourcePath] of [
            ['maplibre-gl.mjs', path.resolve(process.cwd(), 'node_modules/maplibre-gl/dist/maplibre-gl.mjs')],
            [
              'maplibre-gl-worker.mjs',
              path.resolve(process.cwd(), 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs'),
            ],
            [
              'maplibre-gl-shared.mjs',
              path.resolve(process.cwd(), 'node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs'),
            ],
          ]) {
            compilation.emitAsset(fileName, new rspack.sources.RawSource(fs.readFileSync(sourcePath)));
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
  baseConfig.plugins?.push(new RootFileCopyPlugin(), new CoreIconCopyRspackPlugin());
};

const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  patchRootCopyFiles(baseConfig);

  baseConfig.plugins?.push(new MapLibreWorkerAssetsPlugin());

  const extension: Configuration = {
    ignoreWarnings: [
      {
        module: /maplibre-gl[\\/]dist[\\/]maplibre-gl\.mjs$/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ],
    entry: {
      'layout-worker': require.resolve('@mapgl/panel-core/workers/layout-worker'),
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
      conditionNames: ['visgl:webgl-only', '...'],
      alias: {
        'maplibre-gl$': require.resolve('@mapgl/panel-core/components/maplibre-gl-fallback'),
      },
    },
  };
  return merge(baseConfig, extension);
};

export default config;
