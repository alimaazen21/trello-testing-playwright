// @ts-check
require('dotenv').config();

const { test: base, expect } = require('@playwright/test');
const { LoginPage }     = require('../pages/LoginPage');
const { DashboardPage } = require('../pages/DashboardPage');

/**
 * Extended Playwright fixture that provides:
 *  - loginPage, dashboardPage wired to the primary page
 *  - performLogin()  — logs in with TRELLO_EMAIL / TRELLO_PASSWORD
 *  - navigateToLoginPage()
 *  - dismissCookieBannerIfPresent()
 *  - waitUntil(predicate)          — polls up to 15 s
 *  - performSecondLogin()          — opens a second browser context (collaboration tests)
 *  - secondPage, secondDashboardPage
 *  - config                        — thin wrapper around env vars / .env
 */

/** Minimal config reader — env vars override, matching the Java TestConfig behaviour. */
const config = {
  getProperty(key, defaultValue) {
    const envKey = key.replace(/\./g, '_').toUpperCase();
    const v = process.env[envKey] || defaultValue || '';
    return v;
  },
  hasCredentials() {
    return !!(process.env.TRELLO_EMAIL && process.env.TRELLO_PASSWORD);
  },
  hasSecondAccountCredentials() {
    return !!(process.env.TRELLO_EMAIL_SECOND && process.env.TRELLO_PASSWORD_SECOND);
  },
};

const test = base.extend({
  // ── primary session ───────────────────────────────────────────────────────
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  config: async ({}, use) => {
    await use(config);
  },

  // ── helpers available inside every test ───────────────────────────────────
  performLogin: async ({ page, loginPage, dashboardPage }, use) => {
    await use(async (email, password) => {
      if (email === undefined && password === undefined) {
        // called as performLogin() — use configured credentials
        if (!config.hasCredentials()) {
          throw new Error(
            'Trello credentials are not configured. Set TRELLO_EMAIL and TRELLO_PASSWORD ' +
            'as environment variables or add them to a .env file (see .env.example).'
          );
        }
        email    = config.getProperty('trello.email');
        password = config.getProperty('trello.password');
        await page.goto(config.getProperty('trello.url', 'https://trello.com/login'));
        await loginPage.login(email, password);
        await dismissCookieBanner(page);
        if (!await dashboardPage.isUserLoggedIn()) {
          throw new Error(
            'Login failed: dashboard did not load after submitting credentials. ' +
            'Check TRELLO_EMAIL / TRELLO_PASSWORD and make sure the account has no 2FA.'
          );
        }
      } else {
        // performLogin(email, password) — explicit credentials, no success check
        await page.goto(config.getProperty('trello.url', 'https://trello.com/login'));
        await loginPage.login(email, password);
      }
      return dashboardPage;
    });
  },

  navigateToLoginPage: async ({ page }, use) => {
    await use(async () => {
      await page.goto(config.getProperty('trello.url', 'https://trello.com/login'));
    });
  },

  dismissCookieBannerIfPresent: async ({ page }, use) => {
    await use(async () => dismissCookieBanner(page));
  },

  waitUntil: async ({ page }, use) => {
    await use(async (predicate) => {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        try {
          if (await predicate(page)) return true;
        } catch { /* ignored */ }
        await page.waitForTimeout(500);
      }
      return false;
    });
  },

  // ── second browser session (collaboration tests) ──────────────────────────
  secondSession: async ({ browser }, use) => {
    if (!config.hasSecondAccountCredentials()) {
      // If not configured, skip any test that requests this fixture
      await use(null);
      return;
    }

    const ctx  = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();
    const loginPage     = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await page.goto(config.getProperty('trello.url', 'https://trello.com/login'));
    await loginPage.login(
      config.getProperty('trello.email.second'),
      config.getProperty('trello.password.second')
    );

    if (!await dashboardPage.isUserLoggedIn()) {
      throw new Error(
        'Second account login failed. Check TRELLO_EMAIL_SECOND / TRELLO_PASSWORD_SECOND ' +
        'and confirm the account is in the same Workspace and has no 2FA.'
      );
    }

    await use({ page, loginPage, dashboardPage });
    await ctx.close();
  },
});

/** Shared helper — not a fixture so it can also be called directly. */
async function dismissCookieBanner(page) {
  try {
    const btn = page.locator("[data-testid='accept-all-button']");
    if (await btn.count() > 0 && await btn.first().isVisible()) {
      await btn.first().click();
      await page.waitForTimeout(500);
    }
  } catch { /* ignored */ }
}

module.exports = { test, expect, config };
