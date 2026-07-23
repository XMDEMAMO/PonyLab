import { defineConfig, devices } from '@playwright/test';

const previewOrigin = 'http://127.0.0.1:4321';
const projectBaseUrl = `${previewOrigin}/PonyLab/`;
const usesExternalPreview = process.env.PONYLAB_E2E_EXTERNAL_PREVIEW === '1';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: 'test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: projectBaseUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: usesExternalPreview
    ? undefined
    : {
        command:
          'node ./node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4321',
        url: projectBaseUrl,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
