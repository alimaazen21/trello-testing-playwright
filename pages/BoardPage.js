// @ts-check

/**
 * Page Object Model for an open Trello board.
 * All selectors identical to the original Java version.
 */
class BoardPage {
  // ── Selectors ──────────────────────────────────────────────────────────────

  // Board Menu / Archive Panel
  static BOARD_MENU_BUTTON    = "button[aria-label='Show menu']";
  static CLOSE_PANEL_BUTTON   = "button[aria-label='Close popover']";
  static ARCHIVED_ITEMS_OPTION = "xpath=//button[.//div[normalize-space(text())='Archived items']]";
  static ARCHIVED_ITEMS_PANEL  = "div[data-testid='board-menu-container']";

  // List / Card primitives
  static LIST_COMPOSER_OPEN_BTN = "[data-testid='list-composer-button']";
  static ADD_LIST_TEXTAREA      = "[data-testid='list-name-textarea'][placeholder]";
  static LIST_COMPOSER_ADD_BTN  = "button[data-testid='list-composer-add-list-button']";
  static LIST_HEADER            = "[data-testid='list-name']";
  static LIST_LOCATOR           = "[data-testid='list']";
  static ADD_CARD_BTN           = "[data-testid='list-add-card-button']";
  static ADD_CARD_TEXTAREA      = "[data-testid='list-card-composer-textarea']";
  static ADD_CARD_CONFIRM_BTN   = "button[data-testid='list-card-composer-add-card-button']";
  static CARD_TILE              = "[data-testid='trello-card']";

  // Share / Invite
  static SHARE_BTN           = "button[data-testid='board-share-button']";
  static SHARE_SEARCH_INPUT  = "input[data-testid='add-members-input']";
  static TYPEAHEAD_SUGGESTION = "[data-testid='team-invitee-option']";
  static SEND_INVITE_BTN     = "button[data-testid='team-invite-submit-button']";
  static MEMBER_ITEM         = "[data-testid='member-item']";
  static MEMBER_ROLE_SELECT  = "[data-testid='board-permission-selector-dropdown--trigger']";
  static CLOSE_DIALOG_BTN    = "button[data-testid='board-invite-modal-close-button']";

  // Board creation / header
  static HEADER_CREATE_MENU_BTN = "button[data-testid='header-create-menu-button']";
  static HEADER_CREATE_BOARD_BTN = "button[data-testid='create-board-button']";
  static BOARD_TITLE_INPUT =
    "[data-testid='create-board-title-input'], [placeholder='Add board title'], [placeholder*='board title'], [placeholder*='title'], [placeholder*='Title']";
  static FINAL_CREATE_BTN    = "button[data-testid='create-board-submit-button']";
  static BOARD_TITLE_DISPLAY = "h1[data-testid='board-name-display']";
  static BOARD_TITLE_INPUT_FIELD = "input[data-testid='board-name-input']";
  static BOARD_STAR_BTN      = "button[aria-label='Star or unstar board']";

  // Board operations
  static SHOW_MENU_BTN         = "button[aria-label='Show menu'], button[data-testid='show-menu-button']";
  static CHANGE_BACKGROUND_BTN = "xpath=//button[.//span[normalize-space(text())='Change background']]";
  static BACKGROUND_COLORS_OPTION = "xpath=//button[.//span[normalize-space(text())='Colors']]";
  static COLOR_TILE            = "[data-testid='color-tile']";
  static CLOSE_BOARD_MENU_LINK =
    "xpath=//a[normalize-space()='Close board'] | //button[normalize-space()='Close board'] | //*[@data-testid='close-board-link']";
  static CLOSE_CONFIRM_BTN     =
    "xpath=//input[@value='Close'] | //button[normalize-space()='Close'] | //*[@data-testid='close-board-confirm-button']";
  static CLOSED_BOARD_MESSAGE  =
    "xpath=//*[contains(text(),'This board is closed')] | //*[@data-testid='closed-board-message']";
  static REOPEN_BOARD_BTN      =
    "xpath=//button[normalize-space()='Reopen board'] | //*[@data-testid='reopen-board-button']";
  static PERMANENT_DELETE_LINK =
    "xpath=//a[normalize-space()='Permanently delete board'] | //*[@data-testid='permanent-delete-board-button']";
  static DELETE_CONFIRM_BTN    =
    "xpath=//input[@value='Delete'] | //button[normalize-space()='Delete'] | //*[@data-testid='delete-board-confirm-button']";
  static BOARD_VISIBILITY_BTN  =
    "button[data-testid='board-visibility-chip-button'], button[data-testid='board-visibility-button']";
  static PRIVATE_VISIBILITY_OPTION =
    "xpath=//*[@data-testid='board-visibility-option-private'] | //button[normalize-space()='Private']";

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  // ── Dynamic selectors ──────────────────────────────────────────────────────
  _archivedCardItemLocator(cardTitle) {
    return `xpath=//div[@data-testid='archived-card'][.//a[@data-testid='card-name' and normalize-space(text())='${cardTitle}']]`;
  }
  _deleteButtonInsideArchivedCard(cardTitle) {
    return `button[aria-label='Delete ${cardTitle}']`;
  }

  // ── List Operations ────────────────────────────────────────────────────────

  async addList(listName) {
    const countBefore = await this.page.locator(BoardPage.LIST_LOCATOR).count();
    await this.page.locator(BoardPage.LIST_COMPOSER_OPEN_BTN).click();
    await this.page.locator(BoardPage.ADD_LIST_TEXTAREA).waitFor({ state: 'visible' });
    await this.page.locator(BoardPage.ADD_LIST_TEXTAREA).fill(listName);
    await this.page.locator(BoardPage.LIST_COMPOSER_ADD_BTN).click();

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await this.page.locator(BoardPage.LIST_LOCATOR).count() > countBefore) break;
      await this.page.waitForTimeout(200);
    }
    await this.page.waitForTimeout(500);
  }

  async addCard(listName, cardTitle) {
    const targetList = await this._findListByName(listName);
    await targetList.locator(BoardPage.ADD_CARD_BTN).click();

    await this.page.locator(BoardPage.ADD_CARD_TEXTAREA).waitFor({ state: 'visible' });
    await this.page.locator(BoardPage.ADD_CARD_TEXTAREA).fill(cardTitle);
    await this.page.locator(BoardPage.ADD_CARD_CONFIRM_BTN).click();

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await this._cardTileExists(cardTitle)) break;
      await this.page.waitForTimeout(300);
    }
    await this.page.keyboard().press('Escape');
  }

  async openCard(cardTitle) {
    let everFound = false;
    for (let attempt = 0; attempt < 15; attempt++) {
      if (attempt > 0 && attempt % 4 === 0) await this.page.reload();

      const cards = this.page.locator(BoardPage.CARD_TILE);
      const count = await cards.count();
      let match = null;
      for (let i = 0; i < count; i++) {
        try {
          const text = (await cards.nth(i).locator("[data-testid='card-name']").textContent()).trim();
          if (text === cardTitle) { match = cards.nth(i); break; }
        } catch { /* ignored */ }
      }
      if (!match) { await this.page.waitForTimeout(1500); continue; }
      everFound = true;
      await match.locator("[data-testid='card-name']").click();
      try {
        await this.page.locator("[data-testid='card-back-panel']").waitFor({ state: 'visible', timeout: 5000 });
        return;
      } catch { /* retry */ }
    }
    if (!everFound) throw new Error(`No card found with title: ${cardTitle}`);
    await this.page.locator("[data-testid='card-back-panel']").waitFor({ state: 'visible' });
  }

  async ensureCardExists(listName, cardTitle) {
    await this.page.waitForTimeout(500);
    const lists = this.page.locator(BoardPage.LIST_LOCATOR);
    let listFound = false;
    const count = await lists.count();
    for (let i = 0; i < count; i++) {
      try {
        if ((await lists.nth(i).locator(BoardPage.LIST_HEADER).textContent()).trim() === listName) {
          listFound = true; break;
        }
      } catch { /* ignored */ }
    }
    if (!listFound) await this.addList(listName);
    await this.page.waitForTimeout(1000);
    if (!await this._cardTileExists(cardTitle)) await this.addCard(listName, cardTitle);
  }

  async _cardTileExists(cardTitle) {
    const cards = this.page.locator(BoardPage.CARD_TILE);
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      try {
        if ((await cards.nth(i).locator("[data-testid='card-name']").textContent()).trim() === cardTitle) return true;
      } catch { /* ignored */ }
    }
    return false;
  }

  async _findListByName(listName) {
    const lists = this.page.locator(BoardPage.LIST_LOCATOR);
    const count = await lists.count();
    for (let i = 0; i < count; i++) {
      try {
        if ((await lists.nth(i).locator(BoardPage.LIST_HEADER).textContent()).trim() === listName) {
          return lists.nth(i);
        }
      } catch { /* ignored */ }
    }
    throw new Error(`No list found with name: ${listName}`);
  }

  // ── Share / Invite / Members ───────────────────────────────────────────────

  async openShareDialog() {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await this.page.locator(BoardPage.SHARE_BTN).click();
        await this.page.locator(BoardPage.SHARE_SEARCH_INPUT).waitFor({ state: 'visible' });
        return;
      } catch {
        if (attempt === 2) throw new Error('Could not open Share dialog');
        await this.page.waitForTimeout(500);
      }
    }
  }

  async closeDialog() {
    await this.page.locator(BoardPage.CLOSE_DIALOG_BTN).click();
  }

  async inviteMemberByEmail(email) {
    const searchInput = this.page.locator(BoardPage.SHARE_SEARCH_INPUT);
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill(email);
    await this.page.waitForTimeout(1500);

    try {
      const suggestion = this.page.locator(BoardPage.TYPEAHEAD_SUGGESTION);
      await suggestion.waitFor({ state: 'visible', timeout: 5000 });
      await suggestion.click();
      await this.page.waitForTimeout(2000);
      if (!await this.page.locator(BoardPage.SEND_INVITE_BTN).isVisible()) {
        await this.page.waitForTimeout(2000);
        return;
      }
    } catch { /* no typeahead — fall through to invite button */ }

    await this.page.locator(BoardPage.SEND_INVITE_BTN).click();
    const countBefore = await this.page.locator(BoardPage.MEMBER_ITEM).count();
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      if (await this.page.locator(BoardPage.MEMBER_ITEM).count() > countBefore) break;
      await this.page.waitForTimeout(300);
    }
    await this.page.waitForTimeout(1000);
  }

  async isMemberOnBoard(emailOrName) {
    try {
      const deadline = Date.now() + 10000;
      while (Date.now() < deadline) {
        const members = this.page.locator(BoardPage.MEMBER_ITEM);
        const count = await members.count();
        for (let i = 0; i < count; i++) {
          const text = (await members.nth(i).textContent()).toLowerCase();
          if (text.includes(emailOrName.toLowerCase())) return true;
        }
        await this.page.waitForTimeout(300);
      }
      return false;
    } catch {
      return false;
    }
  }

  async setMemberRole(emailOrName, role) {
    const row = await this._findMemberRow(emailOrName);
    await row.locator(BoardPage.MEMBER_ROLE_SELECT).click();
    await this.page.locator(`xpath=//*[@data-item-title='true'][normalize-space(text())='${role}']`).click();
  }

  async getMemberRole(emailOrName) {
    try {
      const row = await this._findMemberRow(emailOrName);
      return (await row.locator(BoardPage.MEMBER_ROLE_SELECT).textContent()).trim();
    } catch {
      return '';
    }
  }

  async _findMemberRow(emailOrName) {
    const members = this.page.locator(BoardPage.MEMBER_ITEM);
    const count = await members.count();
    for (let i = 0; i < count; i++) {
      const text = (await members.nth(i).textContent()).toLowerCase();
      if (text.includes(emailOrName.toLowerCase())) return members.nth(i);
    }
    throw new Error(`No board member found matching: ${emailOrName}`);
  }

  async isAddCardAvailable() {
    try {
      return await this.page.locator(BoardPage.ADD_CARD_BTN).count() > 0;
    } catch {
      return false;
    }
  }

  async isShareButtonEnabled() {
    try {
      const btn = this.page.locator(BoardPage.SHARE_BTN);
      await btn.waitFor({ state: 'visible', timeout: 15000 });
      return await btn.isEnabled();
    } catch {
      return false;
    }
  }

  // ── Board Creation ─────────────────────────────────────────────────────────

  async createNewBoard(name) {
    await this.page.waitForTimeout(3000);

    let menuOpened = false;
    for (let retries = 3; retries > 0 && !menuOpened; retries--) {
      await this.page.locator(BoardPage.HEADER_CREATE_MENU_BTN).click();
      try {
        await this.page.locator(BoardPage.HEADER_CREATE_BOARD_BTN).waitFor({ state: 'visible', timeout: 2000 });
        menuOpened = true;
      } catch {
        console.log(`Dropdown didn't open. Retrying... (${retries - 1} left)`);
      }
    }

    await this.page.locator(BoardPage.HEADER_CREATE_BOARD_BTN).click();
    await this.page.locator(BoardPage.BOARD_TITLE_INPUT).fill(name);
    await this.page.locator(BoardPage.FINAL_CREATE_BTN).click();

    await this.page.waitForURL('**/b/**', { timeout: 15000 });
    await this.page.locator(BoardPage.BOARD_TITLE_DISPLAY).waitFor({ state: 'visible' });
    await this.page.waitForTimeout(2000);

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const title = await this.getBoardTitle();
      const prefix = name.length > 50 ? name.substring(0, 50) : name;
      if (title.includes(prefix) || title === name) break;
      await this.page.waitForTimeout(300);
    }
  }

  // ── Board Title / Star ─────────────────────────────────────────────────────

  async getBoardTitle() {
    await this.page.locator(BoardPage.BOARD_TITLE_DISPLAY).waitFor({ state: 'visible' });
    return (await this.page.locator(BoardPage.BOARD_TITLE_DISPLAY).textContent()).trim();
  }

  async getBoardTitleElement() {
    await this.page.locator(BoardPage.BOARD_TITLE_DISPLAY).waitFor({ state: 'visible' });
    return this.page.locator(BoardPage.BOARD_TITLE_DISPLAY);
  }

  async updateBoardTitle(newName) {
    await this.page.locator(BoardPage.BOARD_TITLE_DISPLAY).click();
    await this.page.waitForTimeout(1000);
    const titleInput = this.page.locator(BoardPage.BOARD_TITLE_INPUT_FIELD);
    await titleInput.waitFor({ state: 'visible' });
    await titleInput.fill(newName);
    await titleInput.press('Enter');

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if ((await this.page.locator(BoardPage.BOARD_TITLE_DISPLAY).textContent()).includes(newName)) break;
      await this.page.waitForTimeout(300);
    }
    await this.page.waitForTimeout(3000);
  }

  async toggleStarBoard() {
    await this.page.locator(BoardPage.BOARD_STAR_BTN).click();
  }

  async isBoardStarred() {
    await this.page.locator(BoardPage.BOARD_STAR_BTN).waitFor({ state: 'visible' });
    const label = await this.page.locator(BoardPage.BOARD_STAR_BTN).getAttribute('aria-label');
    return label != null && label.includes('Unstar');
  }

  // ── Background / Visibility ────────────────────────────────────────────────

  async changeBackgroundToColor() {
    try { await this.page.locator(BoardPage.SHOW_MENU_BTN).first().click(); } catch { /* ignored */ }
    await this.page.locator(BoardPage.CHANGE_BACKGROUND_BTN).first().click();
    await this.page.locator(BoardPage.BACKGROUND_COLORS_OPTION).first().click();
    await this.page.locator(BoardPage.COLOR_TILE).first().click();
  }

  async changeVisibilityToPrivate() {
    await this.page.locator(BoardPage.BOARD_VISIBILITY_BTN).first().click();
    await this.page.locator(BoardPage.PRIVATE_VISIBILITY_OPTION).first().click();
  }

  async getVisibilityText() {
    const btn = this.page.locator(BoardPage.BOARD_VISIBILITY_BTN).first();
    await btn.waitFor({ state: 'visible' });
    const ariaLabel = await btn.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    return (await btn.textContent()).trim();
  }

  // ── Close / Reopen / Delete Board ─────────────────────────────────────────

  async closeBoard() {
    console.log('[closeBoard] Starting close board procedure...');
    try {
      if (await this.page.locator(BoardPage.CLOSED_BOARD_MESSAGE).first().isVisible()) {
        console.log('[closeBoard] Board is already closed!');
        return;
      }
    } catch { /* ignored */ }

    try {
      await this.page.locator(BoardPage.SHOW_MENU_BTN).first().click();
    } catch { /* ignored */ }

    await this.page.waitForTimeout(1000);

    if (!await this.page.locator(BoardPage.CLOSE_BOARD_MENU_LINK).first().isVisible()) {
      try {
        await this.page.locator(
          "a.js-open-more, button[class*='open-more'], [data-testid='more-menu-button'], li.js-open-more button"
        ).first().click();
        await this.page.waitForTimeout(1000);
      } catch { /* ignored */ }
    }

    await this.page.locator(BoardPage.CLOSE_BOARD_MENU_LINK).first().click();
    await this.page.waitForTimeout(1000);
    await this.page.locator(BoardPage.CLOSE_CONFIRM_BTN).first().click();
    await this.page.locator(BoardPage.CLOSED_BOARD_MESSAGE).first().waitFor({ state: 'visible' });
    console.log('[closeBoard] Board closed successfully.');
  }

  async isClosedScreenDisplayed() {
    try {
      await this.page.locator(BoardPage.CLOSED_BOARD_MESSAGE).first().waitFor({ state: 'visible', timeout: 5000 });
      return await this.page.locator(BoardPage.CLOSED_BOARD_MESSAGE).first().isVisible();
    } catch {
      return false;
    }
  }

  async reopenBoard() {
    console.log('[reopenBoard] Starting reopen board procedure...');
    await this.page.locator(BoardPage.REOPEN_BOARD_BTN).first().waitFor({ state: 'attached' });
    await this.page.locator(BoardPage.REOPEN_BOARD_BTN).first().click();
    await this.page.waitForTimeout(2000);

    try {
      const confirmBtn = this.page.locator(
        "xpath=//button[@data-testid='workspace-chooser-reopen-button']" +
        " | //div[contains(@class,'popover')]//button[normalize-space(.)='Reopen']" +
        " | //input[@value='Reopen']" +
        " | //button[@data-testid='close-board-reopen-button-confirm']" +
        " | //button[normalize-space(.)='Reopen']"
      );
      if (await confirmBtn.first().isVisible()) await confirmBtn.first().click();
    } catch { /* ignored */ }

    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
      if (!await this.page.locator(BoardPage.REOPEN_BOARD_BTN).first().isVisible()) break;
      await this.page.waitForTimeout(300);
    }

    await this.page.locator(BoardPage.BOARD_TITLE_DISPLAY).waitFor({ state: 'visible' });
    await this.page.waitForTimeout(3000);
    console.log('[reopenBoard] Board reopened and settled.');
  }

  async deleteBoardPermanently() {
    console.log('[deleteBoardPermanently] Starting permanent delete...');
    await this.page.locator(BoardPage.PERMANENT_DELETE_LINK).first().waitFor({ state: 'attached' });
    await this.page.locator(BoardPage.PERMANENT_DELETE_LINK).first().click();
    await this.page.waitForTimeout(1000);
    await this.page.locator(BoardPage.DELETE_CONFIRM_BTN).first().waitFor({ state: 'attached' });
    await this.page.locator(BoardPage.DELETE_CONFIRM_BTN).first().click();
    console.log('[deleteBoardPermanently] Board permanently deleted.');
  }

  // ── Board Menu (Archive flow) ──────────────────────────────────────────────

  async openBoardMenu() {
    await this.page.locator(BoardPage.BOARD_MENU_BUTTON).waitFor({ state: 'visible' });
    await this.page.locator(BoardPage.BOARD_MENU_BUTTON).click();
  }

  async closeBoardMenu() {
    try {
      await this.page.locator(BoardPage.CLOSE_PANEL_BUTTON).click();
      await this.page.locator(BoardPage.ARCHIVED_ITEMS_PANEL).waitFor({ state: 'hidden' });
    } catch {
      console.log('[closeBoardMenu] Panel already closed — skipping.');
    }
  }

  async openArchivedItems() {
    await this.page.locator(BoardPage.ARCHIVED_ITEMS_OPTION).waitFor({ state: 'visible' });
    await this.page.locator(BoardPage.ARCHIVED_ITEMS_OPTION).click();
  }

  async waitForArchivedItemsPanel() {
    await this.page.locator(BoardPage.ARCHIVED_ITEMS_PANEL).waitFor({ state: 'visible' });
  }

  async waitForArchivedCardToAppear(cardTitle) {
    console.log(`  [BoardPage] Waiting for archived card '${cardTitle}'...`);
    await this.page.locator(this._archivedCardItemLocator(cardTitle)).waitFor({ state: 'visible' });
    console.log(`  [BoardPage] Archived card '${cardTitle}' is visible.`);
  }

  async clickDeleteButtonForArchivedCard(cardTitle) {
    await this.page.locator(this._deleteButtonInsideArchivedCard(cardTitle)).click();
  }

  async confirmCardDeletion(cardTitle) {
    await this.page.locator(`button[aria-label='Permanently delete ${cardTitle}']`).click();
  }

  async isCardDeletedFromArchivedItems(cardTitle) {
    const xpath = `xpath=//*[@data-testid='archived-card-list-item']//*[normalize-space(text())='${cardTitle}']`;
    const count = await this.page.locator(xpath).count();
    if (count === 0) return true;
    return !await this.page.locator(xpath).first().isVisible();
  }

  // ── Drag and Drop ──────────────────────────────────────────────────────────

  async dragListToPosition(sourceListName, targetListName) {
    let source = await this._findListHeader(sourceListName);
    let target = await this._findListHeader(targetListName);
    if (!source) throw new Error(`Source list '${sourceListName}' not found`);
    if (!target) throw new Error(`Target list '${targetListName}' not found`);

    await source.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    source = await this._findListHeader(sourceListName);
    target = await this._findListHeader(targetListName);

    await source.dragTo(target, { force: true });
    await this.page.waitForTimeout(1500);
  }

  async _findListHeader(listName) {
    const headers = this.page.locator(BoardPage.LIST_HEADER);
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      try {
        if ((await headers.nth(i).textContent()).includes(listName)) return headers.nth(i);
      } catch { /* ignored */ }
    }
    return null;
  }

  async getListOrder() {
    return await this.page
      .locator("xpath=//li[@data-testid='list-wrapper']//h2[@data-testid='list-name']//span")
      .allTextContents();
  }

  async waitForListReorder(listName, previousIndex) {
    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      const names = await this.getListOrder();
      const idx = names.indexOf(listName);
      if (idx >= 0 && idx !== previousIndex) return;
      await this.page.waitForTimeout(300);
    }
  }
}

module.exports = { BoardPage };
