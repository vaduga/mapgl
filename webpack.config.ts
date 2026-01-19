import {Configuration } from 'webpack';
const webpack = require('webpack');
import { merge } from 'webpack-merge';
import grafanaConfig from './.config/webpack/webpack.config';

/// is that form rxdb examples?
///import RemoveEmptyScriptsPlugin from 'webpack-remove-empty-scripts';
import TerserPlugin from "terser-webpack-plugin";
import path from "path";

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;



const config = async (env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

    let mode: "development" | "production" | "none"= 'development';
    if (process.env.NODE_ENV === 'disc') {
        mode = 'production';
    }

    const plugins = [
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
    ];
    if (process.env.NODE_ENV === 'disc') {
        mode = 'production';
        plugins.push(new BundleAnalyzerPlugin());
    }
    if (process.argv.join(',').includes('production')) {
        mode = 'production';
    }

    plugins.push(new webpack.DefinePlugin({ mode: JSON.stringify(mode) }));

    console.log('mode:', mode)
  return merge(baseConfig, {
    // Add custom config here...
    entry: {
      module: './module.tsx',
      //'mapglplus/module': './mapglplus/module.tsx',
    },
mode,

    ...(env.production ? {devtool: false} : { devtool: 'eval-source-map' }),
      resolve: {
          extensions: ['.ts', '.tsx', '.js', '.mjs']},
      // Enable verbose logging
      stats: {
          errorDetails: true,
      },
    module: {

      rules: [

                {
                    test: /\.m?js/,
                    resolve: {
                        fullySpecified: false,
                    },
                },

          // { test: /\.(js|jsx)$/, use: 'babel-loader', include: [ path.resolve(__dirname, 'node_modules/rxdb/dist/esm/plugins/storage-dexie')], },

          {
              test: require.resolve('systemjs'),
              use: 'expose-loader?System',
          },

      ],

    },
      optimization: {

      },

    plugins: [
      // new RemoveEmptyScriptsPlugin({})
        ,...plugins
    ],
      experiments: {
          asyncWebAssembly: true,
         // topLevelAwait: true,
      }

  });
};


export default config;
