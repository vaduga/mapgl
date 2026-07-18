// force timezone to UTC to allow tests to work regardless of local timezone
// generally used by snapshots, but can affect specific tests
process.env.TZ = 'UTC';

const baseConfig = require('./.config/jest.config');

module.exports = {
  // Jest configuration provided by Grafana scaffolding
  ...baseConfig,
  testMatch: [
    ...baseConfig.testMatch,
    '<rootDir>/panel-core/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/panel-core/src/**/*.{spec,test,jest}.{js,jsx,ts,tsx}',
  ],
};
