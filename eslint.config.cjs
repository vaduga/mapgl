/** @type {import('eslint').Linter.Config[]} */
module.exports = (async () => {
  const { default: grafanaConfig } = await import('@grafana/eslint-config');

  return [
    {
      ignores: [
        'dist/**',
        'panel-core/dist/**',
        'grafana-adapter/dist/**',
        'e2e-results/**',
        'playwright-report/**',
        'node_modules/**',
        'docker_data/**',
        'mapLib/dist/**',
        '.config/**',
        'hidden-docs/**',
      ],
    },
    ...grafanaConfig,
    {
      name: 'mapgl/defaults',
      files: [
        'src/**/*.{ts,tsx,js,jsx}',
        'panel-core/src/**/*.{ts,tsx,js,jsx}',
        'grafana-adapter/src/**/*.{ts,tsx,js,jsx}',
      ],
      rules: {
        'react/prop-types': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'react-hooks/set-state-in-effect': 'off',
      },
    },
    {
      name: 'mapgl/typescript',
      files: ['src/**/*.{ts,tsx}', 'panel-core/src/**/*.{ts,tsx}', 'grafana-adapter/src/**/*.{ts,tsx}'],
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
})();
