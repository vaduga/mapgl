// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const baseConfig = require('./.config/jest.config');
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...baseConfig,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@mapgl/panel-core$': '<rootDir>/panel-core/src',
    '^@mapgl/panel-core/graph$': '<rootDir>/panel-core/src/graph/main.ts',
    '^@mapgl/panel-core/(.*)$': '<rootDir>/panel-core/src/$1',
  },
  testMatch: [
    ...baseConfig.testMatch,
    '<rootDir>/panel-core/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/panel-core/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
  ],
  transformIgnorePatterns: [
    nodeModulesToTransform([
      ...grafanaESModules,
      '@msagl/core',
      '@react-hookz/web',
      '@ver0/deep-equal',
      'queue-typescript',
    ]),
  ],
};
