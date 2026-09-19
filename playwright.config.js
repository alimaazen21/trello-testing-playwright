// @ts-check
require('dotenv').config();

const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration.
 * Browser defaults to firefox; override via BROWSER env var or .env file.
 * Set HEADLESS=true for CI runs.
 */

const browser  = (process.env.BROWSER  || 'firefox').toLowerCase();
const headless = (process.env.HEADLESS || 'false').toLowerCase() === 'true';

/** Map browser name to Playwright device descriptor. */
function browserProject(name, channel) {
  const base = {
    name,
    use: {
      headless,
      viewport: { width: 1920, height: 1080 },
      ...(channel ? { channel } : {}),
    },
  };
  if (name === 'chrome' || name === 'chromium') {
    return { ...base, ...devices['Desktop Chrome'] };
  }
  if (name === 'edge') {
    return { ...base, ...devices['Desktop Edge'], use: { ...base.use, channel: 'msedge' } };
  }
  return { ...base, ...devices['Desktop Firefox'] };
}

module.exports = defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,       // Trello rate-limits; keep tests serial by default
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.TRELLO_URL || 'https://trello.com/login',
    headless,
    viewport: { width: 1920, height: 1080 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    browserProject(browser),

    // Named projects so you can run: npx playwright test --project=chrome
    { name: 'chrome',   use: { ...devices['Desktop Chrome'],  headless, viewport: { width: 1920, height: 1080 } } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'], headless, viewport: { width: 1920, height: 1080 } } },
    { name: 'edge',     use: { ...devices['Desktop Edge'],    headless, viewport: { width: 1920, height: 1080 }, channel: 'msedge' } },
  ],
});
