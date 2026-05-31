import type { Configuration } from 'webpack';
import path from 'path';
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';
import { merge } from 'webpack-merge';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

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
        'mapLib$': path.resolve(process.cwd(), 'mapLib/src/main.ts'),
        'mapLib/utils$': path.resolve(process.cwd(), 'mapLib/src/utils/index.ts'),
        'mapLib/types$': path.resolve(process.cwd(), 'mapLib/src/types/index.ts'),
        'mapLib/defaults$': path.resolve(process.cwd(), 'mapLib/src/types/defaults.ts'),
      },
    },
  };

  return merge(baseConfig, extension);
};

export default config;
