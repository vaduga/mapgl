import rspack, { type Compiler, type Configuration } from '@rspack/core';
import fs from 'fs';
import path from 'path';
import grafanaConfig from './.config/rspack/rspack.config';
import { merge } from 'webpack-merge';

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
  const useSourceCore = Boolean(env.development);
  const coreSourcePath = path.resolve(process.cwd(), 'panel-core/src');
  const coreIconsPath = useSourceCore
    ? path.join(coreSourcePath, 'img/icons')
    : path.resolve(path.dirname(require.resolve('@mapgl/panel-core/package.json')), 'dist/img/icons');
  patchRootCopyFiles(baseConfig, coreIconsPath);

  baseConfig.plugins?.push(new MapLibreWorkerAssetsPlugin());

  const extension: Configuration = {
    ignoreWarnings: [
      {
        module: /maplibre-gl[\\/]dist[\\/]maplibre-gl\.mjs$/,
        message: /Critical dependency: the request of a dependency is an expression/,
      },
    ],
    entry: {
      'layout-worker': useSourceCore
        ? path.join(coreSourcePath, 'workers/layout-worker.ts')
        : require.resolve('@mapgl/panel-core/workers/layout-worker'),
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
        ...(useSourceCore
          ? {
              '@mapgl/panel-core$': path.join(coreSourcePath, 'index.ts'),
              '@mapgl/panel-core/featureContracts$': path.join(
                coreSourcePath,
                'extension-points/featureContracts.ts'
              ),
              '@mapgl/panel-core/graph$': path.join(coreSourcePath, 'graph/main.ts'),
              '@mapgl/panel-core/graph/frame$': path.join(coreSourcePath, 'graph/frame/index.ts'),
              '@mapgl/panel-core/graph/utils$': path.join(coreSourcePath, 'graph/utils/index.ts'),
              '@mapgl/panel-core/components$': path.join(coreSourcePath, 'components/index.ts'),
              '@mapgl/panel-core/components/GeoBasemap$': path.join(coreSourcePath, 'components/GeoBasemap.tsx'),
              '@mapgl/panel-core/render$': path.join(coreSourcePath, 'render/index.ts'),
              '@mapgl/panel-core/render/MapglViewport$': path.join(coreSourcePath, 'render/MapglViewport.tsx'),
              '@mapgl/panel-core/runtime$': path.join(coreSourcePath, 'runtime/index.ts'),
              '@mapgl/panel-core/store$': path.join(coreSourcePath, 'store/index.ts'),
              '@mapgl/panel-core/deckLayers$': path.join(coreSourcePath, 'deckLayers/index.ts'),
              '@mapgl/panel-core/deckLayers/utils$': path.join(coreSourcePath, 'deckLayers/utils/index.ts'),
              '@mapgl/panel-core/editor$': path.join(coreSourcePath, 'editor/index.ts'),
              '@mapgl/panel-core/extension$': path.join(coreSourcePath, 'extension.ts'),
              '@mapgl/panel-core/layers$': path.join(coreSourcePath, 'layers/index.ts'),
              '@mapgl/panel-core/layers/data$': path.join(coreSourcePath, 'layers/data/index.ts'),
              '@mapgl/panel-core/types$': path.join(coreSourcePath, 'types/index.ts'),
              '@mapgl/panel-core/types/defaults$': path.join(coreSourcePath, 'types/defaults.ts'),
              '@mapgl/panel-core/style/utils$': path.join(coreSourcePath, 'style/utils.ts'),
              '@mapgl/panel-core/utils$': path.join(coreSourcePath, 'utils/index.ts'),
              '@mapgl/panel-core/utils/geomap_utils$': path.join(coreSourcePath, 'utils/geomap_utils.ts'),
              '@mapgl/panel-core/utils/i18n$': path.join(coreSourcePath, 'utils/i18n.tsx'),
              '@mapgl/panel-core/utils/location$': path.join(coreSourcePath, 'utils/location.ts'),
              '@mapgl/panel-core/grafana_core/app/features/dimensions$': path.join(
                coreSourcePath,
                'grafana_core/app/features/dimensions/index.ts'
              ),
              '@mapgl/panel-core/grafana_core/data/utils/valueMappings$': path.join(
                coreSourcePath,
                'grafana_core/data/utils/valueMappings.ts'
              ),
            }
          : {}),
        'maplibre-gl$': useSourceCore
          ? path.join(coreSourcePath, 'components/maplibre-gl-fallback.ts')
          : require.resolve('@mapgl/panel-core/components/maplibre-gl-fallback'),
      },
    },
  };
  return merge(baseConfig, extension);
};

export default config;
