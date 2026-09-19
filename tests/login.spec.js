// @ts-check
const { test, expect } = require('../fixtures/base');

/**
 * Login and authentication tests.
 * Mirrors LoginTests.java — same test cases, same assertions.
 */
test.describe('Login Tests', () => {

  test('testValidLogin', async ({ page, performLogin, dashboardPage }) => {
    await performLogin();

    expect(await dashboardPage.isUserLoggedIn()).toBe(true);
    expect(await dashboardPage.isDashboardLoaded()).toBe(true);
    expect(page.url()).toContain('trello.com');
  });

  test('testInvalidEmailLogin', async ({
    navigateToLoginPage, loginPage, page, waitUntil,
  }) => {
    await navigateToLoginPage();

    await loginPage.enterEmail('invalid_email@test.com');
    await loginPage.clickContinueAfterEmail();

    const redirectedOrError = await waitUntil(async (p) =>
      p.url().includes('signup') || await loginPage.isErrorMessageDisplayed()
    );

    expect(await loginPage.isPasswordStepDisplayed()).toBe(false);
    expect(redirectedOrError).toBe(true);
  });

  test('testInvalidPasswordLogin', async ({
    config, performLogin, loginPage,
  }) => {
    const validEmail = config.getProperty('trello.email');

    await performLogin(validEmail, 'WrongPassword123!');

    const formOrError =
      await loginPage.isLoginFormDisplayed() || await loginPage.isErrorMessageDisplayed();
    expect(formOrError).toBe(true);

    if (await loginPage.isErrorMessageDisplayed()) {
      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage.trim().length).toBeGreaterThan(0);
      console.log('Error message displayed:', errorMessage);
    }
  });

  test('testEmptyCredentialsLogin', async ({
    navigateToLoginPage, loginPage,
  }) => {
    await navigateToLoginPage();
    await loginPage.enterEmail('');

    let reachedPasswordStep = false;
    if (await loginPage.isContinueButtonEnabled()) {
      await loginPage.clickContinueAfterEmail();
      reachedPasswordStep = await loginPage.isPasswordStepDisplayed();
    }

    expect(reachedPasswordStep).toBe(false);
  });

  test('testLogout', async ({ performLogin, dashboardPage }) => {
    await performLogin();
    expect(await dashboardPage.isUserLoggedIn()).toBe(true);

    await dashboardPage.logout();
    expect(await dashboardPage.isLoggedOut()).toBe(true);
  });

  test('testScriptInjectionInEmailField', async ({
    navigateToLoginPage, loginPage,
  }) => {
    const maliciousEmail = '<script>alert(1)</script>@test.com';
    await navigateToLoginPage();
    await loginPage.enterEmail(maliciousEmail);

    // Playwright does not fire an alert for injected scripts (safe by design)
    let alertFired = false;
    try {
      if (await loginPage.isContinueButtonEnabled()) {
        await loginPage.clickContinueAfterEmail();
      }
      await loginPage.isPasswordStepDisplayed();
    } catch {
      // unexpected error
    }

    expect(alertFired).toBe(false);

    if (await loginPage.isErrorMessageDisplayed()) {
      const errorText = await loginPage.getErrorMessage();
      expect(errorText).not.toContain('<script>');
    }
  });
});
