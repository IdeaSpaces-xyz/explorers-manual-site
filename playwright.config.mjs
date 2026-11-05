import { defineConfig, devices } from '@playwright/test';

// Walks the built site through the real Worker and the real _headers: run
// `npm run build` first. WebKit too, because that is what an iPhone reads with.
export default defineConfig({
  testDir: 'tests',
  webServer: { command: 'npx wrangler dev --local --port 4332', port: 4332, reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4332' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
