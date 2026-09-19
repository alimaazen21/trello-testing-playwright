// @ts-check

/**
 * Page Object Model for Trello List operations.
 * All selectors identical to the original Java version.
 */
class ListPage {
  static ADD_LIST_BUTTON =
    "xpath=//button[contains(.,'Add another list') or contains(.,'Add list') or contains(.,'Add a list')]";
  static LIST_NAME_INPUT  = "xpath=//textarea[@placeholder='Enter list name\u2026']";
  static SUBMIT_LIST_BUTTON = "xpath=//button[@data-testid='list-composer-add-list-button']";
  static LIST_HEADER      = "xpath=//div[@data-testid='list-header']";

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
  }

  async clickAddListButton() {
    console.log("ListPage: Clicking 'Add a list' button...");
    await this.page.locator(ListPage.ADD_LIST_BUTTON).waitFor({ state: 'visible' });
    await this.page.locator(ListPage.ADD_LIST_BUTTON).click();
  }

  /** Returns the "Add a list" locator, for layout assertions. */
  async getAddListButtonElement() {
    await this.page.locator(ListPage.ADD_LIST_BUTTON).waitFor({ state: 'visible' });
    return this.page.locator(ListPage.ADD_LIST_BUTTON);
  }

  async enterListName(listName) {
    console.log(`ListPage: Entering list name: ${listName}`);
    await this.page.locator(ListPage.LIST_NAME_INPUT).waitFor({ state: 'visible' });
    await this.page.locator(ListPage.LIST_NAME_INPUT).fill(listName);
  }

  async clickAddListSubmit() {
    console.log('ListPage: Clicking submit button...');
    await this.page.locator(ListPage.SUBMIT_LIST_BUTTON).click();
  }

  async isListCreated(listName) {
    try {
      const sel = `xpath=//span[contains(text(),'${listName}')]`;
      await this.page.locator(sel).waitFor({ state: 'visible', timeout: 15000 });
      console.log(`ListPage: List '${listName}' found on board!`);
      return true;
    } catch {
      console.log(`ListPage: List '${listName}' NOT found!`);
      return false;
    }
  }

  async createList(listName) {
    await this.clickAddListButton();
    await this.enterListName(listName);
    await this.clickAddListSubmit();
  }

  async renameList(oldName, newName) {
    console.log(`ListPage: Renaming list '${oldName}' to '${newName}'...`);
    const titleButton = this.page.locator(
      `xpath=//span[normalize-space(text())='${oldName}']/ancestor::button[1]`
    );
    await titleButton.waitFor({ state: 'visible' });
    await titleButton.scrollIntoViewIfNeeded();
    await titleButton.click();

    const renameInputSel =
      `xpath=//span[normalize-space(text())='${oldName}']` +
      `/ancestor::div[@data-testid='list-header'][1]` +
      `//textarea[@data-testid='list-name-textarea']`;
    const input = this.page.locator(renameInputSel);
    try {
      await input.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
      await titleButton.click({ force: true });
      await input.waitFor({ state: 'visible' });
    }
    await input.fill(newName);
    await input.press('Enter');
  }

  async archiveList(listName) {
    console.log(`ListPage: Archiving list '${listName}'...`);
    const menuButton = this.page.locator(
      `xpath=//*[normalize-space(text())='${listName}']` +
      `/ancestor::div[@data-testid='list-header'][1]` +
      `//button[@data-testid='list-edit-menu-button']`
    );
    await menuButton.waitFor({ state: 'visible' });
    await menuButton.click();

    await this.page.locator("[data-testid='list-actions-archive-list-button']").waitFor({ state: 'visible' });
    await this.page.locator("[data-testid='list-actions-archive-list-button']").click();

    await this.page.locator("xpath=//button[normalize-space()='Archive list']").waitFor({ state: 'visible' });
    await this.page.locator("xpath=//button[normalize-space()='Archive list']").click();

    await this.page.locator(
      `xpath=//div[@data-testid='list-header']//*[normalize-space(text())='${listName}']`
    ).waitFor({ state: 'hidden' });
  }

  async copyList(originalName) {
    console.log(`ListPage: Copying list '${originalName}'...`);

    // Dismiss cookie banner if present
    const acceptAllBtn = this.page.locator("[data-testid='accept-all-button']");
    if (await acceptAllBtn.count() > 0 && await acceptAllBtn.first().isVisible()) {
      await acceptAllBtn.first().click();
    }

    const countBeforeCopy = await this.getListCount();

    const menuButton = this.page.locator(
      `xpath=//*[normalize-space(text())='${originalName}']` +
      `/ancestor::div[@data-testid='list-header'][1]` +
      `//button[@data-testid='list-edit-menu-button']`
    );
    await menuButton.waitFor({ state: 'visible' });
    await menuButton.click();

    await this.page.locator("[data-testid='list-actions-copy-list-button']").waitFor({ state: 'visible' });
    await this.page.locator("[data-testid='list-actions-copy-list-button']").click();

    const popup = this.page.locator("[data-testid='list-actions-copy-list-popover']");
    await popup.waitFor({ state: 'visible' });
    await popup.locator("xpath=.//button[normalize-space()='Create list']").click();
    await popup.waitFor({ state: 'hidden' });

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await this.getListCount() > countBeforeCopy) break;
      await this.page.waitForTimeout(300);
    }
  }

  async attemptEmptyListSubmit() {
    console.log('ListPage: Attempting to submit an empty list name...');
    await this.clickAddListButton();
    const textarea = this.page.locator("[data-testid='list-name-textarea']").first();
    await textarea.waitFor({ state: 'visible' });
    await textarea.fill('');
    await this.page.locator(ListPage.SUBMIT_LIST_BUTTON).click();
  }

  async waitForBoardToLoad() {
    await this.page.locator(ListPage.ADD_LIST_BUTTON).waitFor({ state: 'visible' });
  }

  async getListCount() {
    return await this.page.locator(ListPage.LIST_HEADER).count();
  }

  async getListOrder() {
    const headers = this.page.locator(
      "xpath=//div[@data-testid='list-header']//h2[@data-testid='list-name']//span"
    );
    const names = [];
    const count = await headers.count();
    for (let i = 0; i < count; i++) names.push(await headers.nth(i).textContent());
    return names;
  }

  async ensureListExists(listName) {
    if (await this.isListCreated(listName)) {
      console.log(`[ListPage] List '${listName}' already exists.`);
      return false;
    }
    console.log(`[ListPage] Creating list: ${listName}`);
    await this.createList(listName);
    if (!await this.isListCreated(listName)) {
      throw new Error(`Failed to create list '${listName}'`);
    }
    console.log(`[ListPage] List '${listName}' created successfully.`);
    return true;
  }
}

module.exports = { ListPage };
