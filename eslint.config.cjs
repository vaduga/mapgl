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
        'no-restricted-syntax': [
          'error',
          {
            selector:
              'TSPropertySignature[optional=true] > TSTypeAnnotation > TSImportType[source.value=/^@vaduga\\/mapgl-core\\//]',
            message:
              'Use a named type import here; Grafana Semgrep 1.84.1 fails to parse inline imports on optional core feature fields.',
          },
          {
            selector: 'CallExpression > TSTypeParameterInstantiation TSImportType',
            message:
              'Use a named type import here; Grafana Semgrep 1.84.1 fails to parse inline imports in generic call types.',
          },
          {
            selector: 'Property > ArrowFunctionExpression > TSTypeAnnotation TSImportType',
            message:
              'Use a named type import here; Grafana Semgrep 1.84.1 fails to parse inline imports in object callback return types.',
          },
          {
            selector: 'TSIndexedAccessType > TSTypeQuery[exprName.left.type="ThisExpression"]',
            message:
              'Use an explicit named type instead of indexing a `typeof this.member` query; Grafana Semgrep 1.84.1 fails to parse this form.',
          },
        ],
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
