import { defineConfig, devices } from '@playwright/test';

// Walks the built site: run `npm run build` first. WebKit too, because that is what an iPhone reads with.
export default defineConfig({
  testDir: 'tests',
  webServer: { command: 'npx astro preview --port 4332 --ignore-lock', port: 4332, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4332' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
