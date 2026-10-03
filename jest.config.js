// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const baseConfig = require('./.config/jest.config');
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...baseConfig,
  testEnvironmentOptions: {
    ...baseConfig.testEnvironmentOptions,
    customExportConditions: ['development', 'browser'],
  },
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^preact$': '<rootDir>/node_modules/preact/dist/preact.js',
  },
  testMatch: [
    ...baseConfig.testMatch,
    '<rootDir>/grafana-adapter/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
    '<rootDir>/panel-core/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/panel-core/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    nodeModulesToTransform([
      ...grafanaESModules,
      '@msagl/core',
      '@deck.gl',
      '@luma.gl',
      '@math.gl',
      '@loaders.gl',
      '@probe.gl',
      '@turf',
      '@mapbox',
      'preact',
      'earcut',
      'internmap',
      'gl-matrix',
      'wgsl_reflect',
      '@react-hookz/web',
      '@ver0/deep-equal',
      'queue-typescript',
    ]),
  ],
};
