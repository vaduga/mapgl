const jsdoc = require('eslint-plugin-jsdoc');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const reactPlugin = require('eslint-plugin-react');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const prettierConfig = require('eslint-config-prettier');
const stylistic = require('@stylistic/eslint-plugin');

const grafanaBaseConfig = require('@grafana/eslint-config/base');

const grafanaConfig = [
  reactHooksPlugin.configs.flat['recommended-latest'],
  reactPlugin.configs.flat.recommended,
  prettierConfig,
  {
    name: '@grafana/eslint-config/flat',
    settings: grafanaBaseConfig.settings,
    plugins: {
      jsdoc,
      '@typescript-eslint': tsPlugin,
      '@stylistic/ts': stylistic,
    },
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: grafanaBaseConfig.ecmaVersion,
      sourceType: grafanaBaseConfig.sourceType,
      parserOptions: grafanaBaseConfig.parserOptions,
    },
    rules: {
      ...grafanaBaseConfig.rules,
      '@stylistic/ts/type-annotation-spacing': ['error', { after: true, before: false }],
      '@stylistic/ts/arrow-spacing': ['error', { after: true, before: true }],
    },
  },
];

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ['dist/**', 'node_modules/**', 'docker_data/**', 'mapLib/dist/**', '.config/**'],
  },
  ...grafanaConfig,
  {
    name: 'mapgl/defaults',
    files: ['src/**/*.{ts,tsx,js,jsx}', 'mapLib/src/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    name: 'mapgl/typescript',
    files: ['src/**/*.{ts,tsx}', 'mapLib/src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-deprecated': 'warn',
      'no-duplicate-imports': ['error', { allowSeparateTypeImports: true }],
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
