import { defineConfig } from '@playwright/test'

// Permet de recetter un serveur local déjà ouvert, sans lancer un second serveur.
const externalServer = process.env.CONSOLE_TEST_URL
if (externalServer && !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(externalServer)) throw new Error('La recette externe demande une adresse locale.')

export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, maxFailures: 1,
  timeout: 30_000, expect: { timeout: 8_000 },
  use: {
    baseURL: externalServer || 'http://127.0.0.1:3102', browserName: 'chromium', channel: 'chrome',
    viewport: { width: 1440, height: 1000 }, trace: 'retain-on-failure',
    launchOptions: { args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] },
  },
  webServer: externalServer ? undefined : {
    command: 'node node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3102',
    url: 'http://127.0.0.1:3102/login', reuseExistingServer: false, timeout: 30_000,
    env: {
      HSENTINEL_OPERATOR_TOKEN: 'synthetic-browser-test-access-token',
      // Une fausse base PostgREST, ouverte par la recette elle-même (tests/browser/console.spec.ts) : données, base vide ou panne.
      SUPABASE_URL: 'http://127.0.0.1:3199', SUPABASE_SECRET_KEY: 'synthetic-disabled-database',
      HF_TOKEN: 'synthetic-disabled-provider', HAI_API_KEY: 'synthetic-disabled-provider',
    },
  },
})
