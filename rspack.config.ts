import type { Configuration } from '@rspack/core';
import path from 'path';
import grafanaConfig from './.config/rspack/rspack.config';
import { merge } from 'webpack-merge';

const config = async (env: Record<string, unknown>): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  const extension: Configuration = {
    entry: {
      layoutWorker: './workers/layoutWorker.ts',
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
