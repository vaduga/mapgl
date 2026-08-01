import { dirname } from 'path';
import { defineConfig, devices } from '@playwright/test';
import type { PluginOptions } from '@grafana/plugin-e2e';

const pluginE2eAuth = `${dirname(require.resolve('@grafana/plugin-e2e'))}/auth`;

export default defineConfig<PluginOptions>({
  testDir: './e2e',
  reporter: process.env.CI ? 'github' : 'list',
  expect: {
    timeout: 15_000,
  },
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://127.0.0.1:3000',
    provisioningRootDir: 'provisioning',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'auth',
      testDir: pluginE2eAuth,
      testMatch: [/.*\.js/],
    },
    {
      name: 'run-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['auth'],
    },
  ],
});
