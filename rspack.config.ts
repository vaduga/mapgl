import rspack, { type Compiler, type Configuration } from '@rspack/core';
import fs from 'fs';
import path from 'path';
import grafanaConfig from './.config/rspack/rspack.config';
import { merge } from 'webpack-merge';

const { modulePattern: deckAsyncResourceModulePattern } = require('./scripts/deck-core-async-resource-loader.cjs');

const rootCopyFiles = new Map([
  ['../LICENSE', 'LICENSE'],
  ['../CHANGELOG.md', 'CHANGELOG.md'],
]);

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
  constructor(private readonly iconsPath: string) {}

  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('CoreIconCopyRspackPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'CoreIconCopyRspackPlugin',
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          for (const sourcePath of getCoreIconFiles(this.iconsPath)) {
            const relativePath = path.relative(this.iconsPath, sourcePath).split(path.sep).join('/');
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

class MapLibreAssetsPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('MapLibreAssetsPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'MapLibreAssetsPlugin',
          // Preserve the already minified ESM distribution and its inline licenses.
          stage: rspack.Compilation.PROCESS_ASSETS_STAGE_REPORT,
        },
        () => {
          // MapLibre 6.13 makes the worker self-contained and leaves the shared file empty.
          for (const filename of ['maplibre-gl.mjs', 'maplibre-gl-worker.mjs']) {
            const sourcePath = path.resolve(process.cwd(), 'node_modules/maplibre-gl/dist', filename);
            compilation.emitAsset(filename, new rspack.sources.RawSource(fs.readFileSync(sourcePath)));
          }
          const licensePath = path.resolve(process.cwd(), 'node_modules/maplibre-gl/LICENSE.txt');
          compilation.emitAsset('maplibre-gl.LICENSE.txt', new rspack.sources.RawSource(fs.readFileSync(licensePath)));
        }
      );
    });
  }
}

const patchRootCopyFiles = (baseConfig: Configuration, coreIconsPath: string): void => {
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
  baseConfig.plugins?.push(new RootFileCopyPlugin(), new CoreIconCopyRspackPlugin(coreIconsPath));
};

const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);
  const coreSourcePath = path.resolve(process.cwd(), 'panel-core/src');
  const coreIconsPath = path.join(coreSourcePath, 'img/icons');
  patchRootCopyFiles(baseConfig, coreIconsPath);
  baseConfig.plugins?.push(new MapLibreAssetsPlugin());

  const extension: Configuration = {
    entry: {
      'layout-worker': {
        import: path.join(coreSourcePath, 'workers/layout-worker.ts'),
        filename: 'layout-worker.mjs',
        library: { type: 'module' },
      },
    },
    module: {
      rules: [
        {
          test: deckAsyncResourceModulePattern,
          use: path.resolve(process.cwd(), 'scripts/deck-core-async-resource-loader.cjs'),
        },
        {
          test: /node_modules\/@msagl\/core\/dist\/.*\.js$/,
          resolve: {
            fullySpecified: false,
          },
        },
      ],
    },
    resolve: {
      conditionNames: ['development', 'visgl:webgl-only', '...'],
      alias: {
        'maplibre-gl$': path.join(coreSourcePath, 'components/maplibre-gl-fallback.ts'),
      },
    },
  };
  const config = merge(baseConfig, extension);
  if (config.output) {
    config.output.chunkFormat = 'array-push';
    config.output.chunkLoading = 'jsonp';
    config.output.scriptType = false;
    config.output.devtoolModuleFilenameTemplate = ({ namespace, resourcePath, loaders }) => {
      // Grafana's validator recognizes dependencies only under ../node_modules/.
      const sourcePath = resourcePath.replace(/^(?:.*?\/)?node_modules\//, '../node_modules/');
      return `webpack://${namespace}/${sourcePath}${loaders ? `?${loaders}` : ''}`;
    };
  }

  return config;
};

export default config;
