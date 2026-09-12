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

class MapLibreWorkerAssetsWebpackPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap('MapLibreWorkerAssetsWebpackPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'MapLibreWorkerAssetsWebpackPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS,
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
            compilation.emitAsset(fileName, new webpack.sources.RawSource(fs.readFileSync(sourcePath)));
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
      conditionNames: ['visgl:webgl-only', '...'],
      alias: {
       'maplibre-gl$': require.resolve('@mapgl/panel-core/components/maplibre-gl-fallback')
      },
    },
    plugins: [new CoreIconCopyWebpackPlugin(), new MapLibreWorkerAssetsWebpackPlugin()],
  };

  return merge(baseConfig, extension);
};

export default config;
