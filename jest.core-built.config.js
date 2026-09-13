const baseConfig = require('./jest.config');

// Exercise the package compiler output, including its class-field semantics.
module.exports = {
  ...baseConfig,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@mapgl/panel-core$': '<rootDir>/panel-core/dist/index.js',
    '^@mapgl/panel-core/graph$': '<rootDir>/panel-core/dist/graph/main.js',
    '^@mapgl/panel-core/(.*)$': '<rootDir>/panel-core/dist/$1',
  },
  testMatch: ['<rootDir>/panel-core/tests/*.built.test.tsx'],
};
