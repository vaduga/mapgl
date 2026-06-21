import type { Compiler, Configuration } from 'webpack';
import fs from 'fs';
import path from 'path';
import webpack from 'webpack';
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';
import { merge } from 'webpack-merge';

const coreIconsPath = path.resolve(process.cwd(), 'panel-core/src/img/icons');

const getCoreIconFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? getCoreIconFiles(fullPath) : [fullPath];
  });
};

class CoreIconCopyWebpackPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('CoreIconCopyWebpackPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'CoreIconCopyWebpackPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
        },
        () => {
          for (const sourcePath of getCoreIconFiles(coreIconsPath)) {
            const relativePath = path.relative(coreIconsPath, sourcePath).split(path.sep).join('/');
            compilation.emitAsset(
              `img/icons/${relativePath}`,
              new webpack.sources.RawSource(fs.readFileSync(sourcePath))
            );
          }
        }
      );
    });
  }
}

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  const extension: Configuration = {
    entry: {
      'layout-worker': '../panel-core/src/workers/layout-worker.ts',
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
        '@mapgl/panel-core$': path.resolve(process.cwd(), 'panel-core/src/index.ts'),
        '@mapgl/panel-core/featureContracts$': path.resolve(
          process.cwd(),
          'panel-core/src/extension-points/featureContracts.ts'
        ),
        '@mapgl/panel-core/graph$': path.resolve(process.cwd(), 'panel-core/src/graph/main.ts'),
        '@mapgl/panel-core/graph/utils$': path.resolve(process.cwd(), 'panel-core/src/graph/utils/index.ts'),
        '@mapgl/panel-core/components$': path.resolve(process.cwd(), 'panel-core/src/components/index.ts'),
        '@mapgl/panel-core/editor$': path.resolve(process.cwd(), 'panel-core/src/editor/index.ts'),
        '@mapgl/panel-core/store$': path.resolve(process.cwd(), 'panel-core/src/store/index.ts'),
        '@mapgl/panel-core/deckLayers$': path.resolve(process.cwd(), 'panel-core/src/deckLayers/index.ts'),
        '@mapgl/panel-core/extension$': path.resolve(process.cwd(), 'panel-core/src/extension.ts'),
        '@mapgl/panel-core/layers$': path.resolve(process.cwd(), 'panel-core/src/layers/index.ts'),
        '@mapgl/panel-core/layers/basemaps$': path.resolve(process.cwd(), 'panel-core/src/layers/basemaps/index.ts'),
        '@mapgl/panel-core/layers/data$': path.resolve(process.cwd(), 'panel-core/src/layers/data/index.ts'),
        '@mapgl/panel-core/types$': path.resolve(process.cwd(), 'panel-core/src/types/index.ts'),
        '@mapgl/panel-core/types/defaults$': path.resolve(process.cwd(), 'panel-core/src/types/defaults.ts'),
        '@mapgl/panel-core/types/deck$': path.resolve(process.cwd(), 'panel-core/src/types/deck.ts'),
        '@mapgl/panel-core/types/panel$': path.resolve(process.cwd(), 'panel-core/src/types/panel.ts'),
        '@mapgl/panel-core/view$': path.resolve(process.cwd(), 'panel-core/src/view.ts'),
        '@mapgl/panel-core/style/types$': path.resolve(process.cwd(), 'panel-core/src/style/types.ts'),
        '@mapgl/panel-core/style/utils$': path.resolve(process.cwd(), 'panel-core/src/style/utils.ts'),
        '@mapgl/panel-core/utils/location$': path.resolve(process.cwd(), 'panel-core/src/utils/location.ts'),
        '@mapgl/panel-core/utils$': path.resolve(process.cwd(), 'panel-core/src/utils/index.ts'),
        '@mapgl/panel-core/utils/geomap_utils$': path.resolve(process.cwd(), 'panel-core/src/utils/geomap_utils.ts'),
        '@mapgl/panel-core/utils/i18n$': path.resolve(process.cwd(), 'panel-core/src/utils/i18n.tsx'),
        '@mapgl/panel-core/grafana_core': path.resolve(process.cwd(), 'panel-core/src/grafana_core'),
        '@mapgl/panel-core/grafana_data': path.resolve(process.cwd(), 'panel-core/src/grafana_data'),
        '@mapgl/panel-core/workers/layout-worker$': path.resolve(
          process.cwd(),
          'panel-core/src/workers/layout-worker.ts'
        ),
      },
    },
    plugins: [new CoreIconCopyWebpackPlugin()],
  };

  return merge(baseConfig, extension);
};

export default config;
