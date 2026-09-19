// @ts-check

/**
 * Page Object Model for the Trello Dashboard / Home Page.
 * All selectors identical to the original Java version.
 */
class DashboardPage {
  // ── Selectors ──────────────────────────────────────────────────────────────
  static USER_AVATAR      = '#header-member-menu-avatar';
  static CREATE_BOARD_BTN = "button[data-testid='create-board-tile']";
  static HEADER           = '#header';
  static LOGOUT_BTN       = "button[data-testid='account-menu-logout']";
  static LOGOUT_SUBMIT    = '#logout-submit';
  static NOTIFICATIONS_BTN = "button[data-testid='header-notifications-button']";
  static BOARD_TILE_LINK  = "a[href^='/b/']";

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async isUserLoggedIn() {
    try {
      await this.page.locator(DashboardPage.USER_AVATAR).waitFor({ state: 'visible', timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }

  async isDashboardLoaded() {
    try {
      return await this.page.locator(DashboardPage.HEADER).isVisible();
    } catch {
      return false;
    }
  }

  getPageTitle() { return this.page.title(); }
  getCurrentUrl() { return this.page.url(); }

  async isCreateBoardButtonVisible() {
    try {
      return await this.page.locator(DashboardPage.CREATE_BOARD_BTN).isVisible();
    } catch {
      return false;
    }
  }

  /** Returns the header locator, for layout assertions. */
  async getHeaderElement() {
    await this.page.locator(DashboardPage.HEADER).waitFor({ state: 'visible' });
    return this.page.locator(DashboardPage.HEADER);
  }

  /** Returns the create-board button locator, for layout assertions. */
  async getCreateBoardButtonElement() {
    await this.page.locator(DashboardPage.CREATE_BOARD_BTN).waitFor({ state: 'visible' });
    return this.page.locator(DashboardPage.CREATE_BOARD_BTN);
  }

  async logout() {
    await this.page.locator(DashboardPage.USER_AVATAR).waitFor({ state: 'visible' });
    await this.page.locator(DashboardPage.USER_AVATAR).click();
    await this.page.locator(DashboardPage.LOGOUT_BTN).waitFor({ state: 'visible' });
    await this.page.locator(DashboardPage.LOGOUT_BTN).click();
    await this.page.locator(DashboardPage.LOGOUT_SUBMIT).waitFor({ state: 'visible' });
    await this.page.locator(DashboardPage.LOGOUT_SUBMIT).click();
  }

  async isLoggedOut() {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const url = this.page.url();
      if (url.includes('logged-out') || url.includes('login') || !(await this.isUserAvatarDisplayed())) {
        return true;
      }
      await this.page.waitForTimeout(500);
    }
    return false;
  }

  async isUserAvatarDisplayed() {
    try {
      return await this.page.locator(DashboardPage.USER_AVATAR).isVisible();
    } catch {
      return false;
    }
  }

  async waitForDashboardToLoad() {
    await this.page.locator(DashboardPage.HEADER).waitFor({ state: 'visible' });
    await this.page.locator(DashboardPage.USER_AVATAR).waitFor({ state: 'visible' });
  }

  async hasUnreadNotifications() {
    try {
      const btn = this.page.locator(DashboardPage.NOTIFICATIONS_BTN);
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      const ariaLabel = await btn.getAttribute('aria-label');
      return ariaLabel != null && !ariaLabel.trim().startsWith('0 ');
    } catch {
      return false;
    }
  }

  async isBoardPresent(boardName) {
    try {
      const tile = this.page.locator(`xpath=//a[normalize-space()='${boardName}']`);
      await tile.waitFor({ state: 'visible', timeout: 15000 });
      return await tile.isVisible();
    } catch {
      return false;
    }
  }

  async isBoardVisible(boardName) {
    try {
      await this.page.reload();
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const tiles = await this.page.locator(DashboardPage.BOARD_TILE_LINK).all();
        for (const tile of tiles) {
          if ((await tile.textContent()).trim() === boardName) return true;
        }
        await this.page.waitForTimeout(500);
      }
      return false;
    } catch {
      return false;
    }
  }

  async openBoard(boardName) {
    const boardTile = this.page.locator(`xpath=//a[normalize-space()='${boardName}']`);
    for (let attempt = 1; attempt <= 2; attempt++) {
      await boardTile.waitFor({ state: 'visible' });
      await boardTile.scrollIntoViewIfNeeded();
      await boardTile.click();
      try {
        await this.page.waitForURL('**/b/**', { timeout: 15000 });
        return;
      } catch {
        if (attempt === 2) throw new Error(`Board '${boardName}' did not load after clicking`);
      }
    }
  }

  async getLoggedInUserDisplayName() {
    try {
      const avatar = this.page.locator(DashboardPage.USER_AVATAR);
      await avatar.waitFor({ state: 'visible' });
      await avatar.click();

      const accountInfo = this.page.locator(
        "[data-testid='account-menu-account-button'], [data-testid='header-member-menu-name']"
      );
      await accountInfo.first().waitFor({ state: 'visible' });
      const fullText = await accountInfo.first().textContent();
      await avatar.click(); // close menu
      return fullText.split('\n')[0].trim();
    } catch {
      return null;
    }
  }
}

module.exports = { DashboardPage };
