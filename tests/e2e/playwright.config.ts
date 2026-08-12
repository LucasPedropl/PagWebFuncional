import { defineConfig, devices } from '@playwright/test';
import { MANAGE_WEB_SERVER, WEB_BASE_URL, WEB_PORT } from './src/config';

/**
 * Dois projects:
 * - `api` — fala HTTP direto com a API (sem browser). É a maior parte da suíte.
 * - `ui`  — dirige o build do frontend em Chromium contra a mesma API.
 *
 * Os dois compartilham o mesmo mundo semeado pelo `globalSetup`.
 */
export default defineConfig({
  testDir: '.',
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',

  // A API é compartilhada e tem workers de background; um pouco de folga evita
  // falsos negativos por latência.
  timeout: 60_000,
  expect: { timeout: 10_000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 4,

  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  projects: [
    {
      name: 'api',
      testDir: './api',
      use: {},
    },
    {
      name: 'ui',
      testDir: './ui',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: WEB_BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'off',
      },
    },
  ],

  webServer: MANAGE_WEB_SERVER
    ? {
        command: 'node scripts/static-server.mjs',
        url: `http://127.0.0.1:${WEB_PORT}/index.html`,
        reuseExistingServer: true,
        timeout: 30_000,
        env: { E2E_WEB_PORT: String(WEB_PORT) },
      }
    : undefined,
});
