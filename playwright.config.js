import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

/**
 * Smoke tests run against a production build made with `--mode test`, which additionally exposes
 * `window.__game` (see src/debug/test-hooks.js). Normal production builds never include it.
 */
export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    launchOptions: process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
  },
  webServer: {
    command: `npm run build:test && npx vite preview --outDir dist-test --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 720 } } },
    {
      name: 'phone-landscape',
      use: { ...devices['Desktop Chrome'], viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true },
    },
  ],
});
