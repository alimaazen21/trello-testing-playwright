// @ts-check

/**
 * Page Object Model for the Trello Login Page.
 * All selectors identical to the original Java version.
 */
class LoginPage {
  // ── Selectors ──────────────────────────────────────────────────────────────
  static EMAIL_INPUT   = "xpath=//input[@id='username' or @name='username']";
  static CONTINUE_BTN  = '#login-submit';
  static PASSWORD_INPUT = '#password';
  static LOGIN_BTN     = '#login-submit';
  static ERROR_MSG     = '#login-error';
  static LOGIN_FORM    = '#form-login';
  static SKIP_2FA_BTN  = "xpath=//button[normalize-space(text())='Continue without two-step verification']";

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  /** Full two-step Trello login flow. */
  async login(email, password) {
    await this.enterEmail(email);
    await this.clickContinueAfterEmail();
    await this.enterPassword(password);
    await this.clickLogin();
  }

  async enterEmail(email) {
    await this.page.locator(LoginPage.EMAIL_INPUT).waitFor({ state: 'visible' });
    await this.page.locator(LoginPage.EMAIL_INPUT).fill(email);
  }

  async clickContinueAfterEmail() {
    await this.page.locator(LoginPage.CONTINUE_BTN).waitFor({ state: 'visible' });
    await this.page.locator(LoginPage.CONTINUE_BTN).click();
  }

  /** Returns the email input locator, for layout assertions. */
  async getEmailInputElement() {
    await this.page.locator(LoginPage.EMAIL_INPUT).waitFor({ state: 'visible' });
    return this.page.locator(LoginPage.EMAIL_INPUT);
  }

  /** Returns the continue button locator, for layout assertions. */
  async getContinueButtonElement() {
    await this.page.locator(LoginPage.CONTINUE_BTN).waitFor({ state: 'visible' });
    return this.page.locator(LoginPage.CONTINUE_BTN);
  }

  async enterPassword(password) {
    await this.page.locator(LoginPage.PASSWORD_INPUT).waitFor({ state: 'visible' });
    await this.page.locator(LoginPage.PASSWORD_INPUT).fill(password);
  }

  async clickLogin() {
    await this.page.locator(LoginPage.LOGIN_BTN).waitFor({ state: 'visible' });
    await this.page.locator(LoginPage.LOGIN_BTN).click();
    await this._dismissSecurityReviewIfPresent();
  }

  /** Dismiss Trello's "Security review" interstitial if it appears. */
  async _dismissSecurityReviewIfPresent() {
    try {
      const btn = this.page.locator(LoginPage.SKIP_2FA_BTN);
      await btn.waitFor({ state: 'visible', timeout: 5000 });
      await btn.click();
    } catch {
      // Not shown — nothing to do.
    }
  }

  async isContinueButtonEnabled() {
    try {
      return await this.page.locator(LoginPage.CONTINUE_BTN).isEnabled();
    } catch {
      return false;
    }
  }

  async isPasswordStepDisplayed() {
    try {
      await this.page.locator(LoginPage.PASSWORD_INPUT).waitFor({ state: 'visible', timeout: 15000 });
      return await this.page.locator(LoginPage.PASSWORD_INPUT).isVisible();
    } catch {
      return false;
    }
  }

  async getErrorMessage() {
    try {
      await this.page.locator(LoginPage.ERROR_MSG).waitFor({ state: 'visible', timeout: 15000 });
      return await this.page.locator(LoginPage.ERROR_MSG).textContent();
    } catch {
      return '';
    }
  }

  async isLoginFormDisplayed() {
    try {
      return await this.page.locator(LoginPage.LOGIN_FORM).isVisible();
    } catch {
      return false;
    }
  }

  async isErrorMessageDisplayed() {
    try {
      return await this.page.locator(LoginPage.ERROR_MSG).isVisible();
    } catch {
      return false;
    }
  }
}

module.exports = { LoginPage };
