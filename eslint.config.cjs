const grafanaConfig = require('@grafana/eslint-config/flat');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'docker_data/**', 'mapLib/dist/**', '.config/**'],
  },
  ...grafanaConfig,
  {
    name: 'mapgl/defaults',
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    name: 'mapgl/typescript',
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
    },
  },
  {
    name: 'mapgl/tests',
    files: ['tests/**/*'],
    rules: {
      'react-hooks/rules-of-hooks': 'off',
    },
  },
];
