// @ts-check

/**
 * Page Object Model for Trello Card operations.
 * All selectors identical to the original Java version.
 */
class CardPage {
  // ── Locators ───────────────────────────────────────────────────────────────

  // Board-level card link (Anirudh)
  static MY_TRELLO_BOARD =
    "xpath=//a[@href='/b/d8xcq3jv/my-trello-board' and @title='My Trello Board']";

  // Card back modal
  static CARD_BACK_MODAL   = "[data-testid='card-back-panel']";
  static CARD_BACK_HEADER  = "[data-testid='card-back-header']";
  static CARD_BACK_TITLE   = "[data-testid='card-back-title-input']";
  static ACTIONS_BUTTON    = "[data-testid='card-back-actions-button']";
  static CARD_DONE_BUTTON  = "[data-testid='card-done-state-completion-button']";
  static ARCHIVE_CARD_OPTION =
    "xpath=//button[contains(.,'Archive') or .//span[normalize-space()='Archive']]";

  // Description (Harshit)
  static DESCRIPTION_BUTTON   = "button[data-testid='description-button']";
  static EDIT_DESCRIPTION_BTN = "button[aria-label='Edit description']";
  static DESCRIPTION_FIELD    = '#ak-editor-textarea';
  static DESCRIPTION_SAVE_BTN = "button[data-testid='description-save-button']";

  // Labels / Dates
  static LABELS_BUTTON    = "xpath=//button[normalize-space()='Labels']";
  static CLOSE_CARD_BUTTON = "button[aria-label='Close dialog']";
  static DATES_BUTTON     = "button[data-testid='card-back-due-date-button']";
  static SAVE_DATE_BUTTON = "button[data-testid='save-date-button']";
  static DUE_DATE_FIELD   = "input[data-testid='due-date-field']";

  // Checklist
  static CHECKLIST_BUTTON      = "xpath=//button[normalize-space()='Checklist']";
  static CHECKLIST_TITLE_FIELD = '#id-checklist';
  static CHECKLIST_ADD_BUTTON  = "button[data-testid='checklist-add-button']";
  static CHECKLIST_ITEM_INPUT  = "textarea[data-testid='check-item-name-input']";
  static CHECKLIST_ITEM_ADD_BTN = "button[data-testid='check-item-add-button']";

  // Attachments
  static ADD_TO_CARD_BUTTON   = "xpath=//button[@aria-label='Add to card']";
  static ATTACHMENT_BUTTON    = "[data-testid='card-back-attachment-button']";
  static ATTACH_LINK_INPUT    = "input[data-testid='link-url']";
  static ATTACH_LINK_SUBMIT   = "[data-testid='link-picker-insert-button']";
  static ATTACHMENTS_LIST_ITEM = "[data-testid='attachment-links-list'] li";

  // Cover
  static COVER_BUTTON           = "[data-testid='card-back-cover-button']";
  static COVER_COLOR_SWATCH     = "[data-testid^='color-tile-']";
  static COVER_APPLIED_INDICATOR = "[data-testid='card-cover']";

  // Collaboration
  static ADD_TO_CARD_BTN_LOC       = "button[aria-label='Add to card']";
  static ADD_MEMBERS_MENU_ITEM     = "button[data-testid='card-back-members-button']";
  static MEMBER_SEARCH_INPUT       = "input[aria-label='Search members']";
  static MEMBER_SEARCH_RESULT      = "button[data-testid='choose-member-item-add-member-button']";
  static ASSIGNED_MEMBER_AVATAR    = "button[data-testid='card-back-member-avatar']";
  static NEW_COMMENT_SKELETON_BTN  = "button[data-testid='card-back-new-comment-input-skeleton']";
  static COMMENT_EDITOR            = "[data-testid='editor-content-container'] .ProseMirror";
  static COMMENT_SAVE_BTN          = "button[data-testid='card-back-comment-save-button']";
  static ACTIONS_BTN_LOC           = "button[data-testid='card-back-actions-button']";
  static SUBSCRIBED_BTN            = "button[data-testid='card-back-subscribed-button']";
  static ACTIVITY_FEED_ITEM        = "[data-testid='card-back-action']";

  // ── Dynamic selectors ──────────────────────────────────────────────────────
  _cardNameLocator(cardTitle) {
    return `xpath=//a[@data-testid='card-name' and text()='${cardTitle}']`;
  }
  _archivedCardLocator(cardTitle) {
    return `xpath=//div[@data-testid='archived-card']//a[@data-testid='card-name' and normalize-space()='${cardTitle}']`;
  }
  _checklistItemCheckboxInput(itemName) {
    return `xpath=//input[@type='checkbox' and @aria-label='${itemName}']`;
  }
  _checklistItemCheckboxLabel(itemName) {
    return `xpath=//label[@data-testid='clickable-checkbox'][.//input[@aria-label='${itemName}']]`;
  }

  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    // TestData equivalent — set by the test fixture before use
    this.listName = '';
  }

  // ── Collaboration ──────────────────────────────────────────────────────────

  async isCardOpen() {
    try {
      await this.page.locator(CardPage.CARD_BACK_MODAL).waitFor({ state: 'visible', timeout: 15000 });
      return await this.page.locator(CardPage.CARD_BACK_MODAL).isVisible();
    } catch {
      return false;
    }
  }

  async addMember(nameOrUsernameFragment) {
    await this.page.locator(CardPage.ADD_TO_CARD_BTN_LOC).click();
    await this.page.locator(CardPage.ADD_MEMBERS_MENU_ITEM).click();

    if (await this.isMemberAssigned(nameOrUsernameFragment)) {
      await this.page.keyboard().press('Escape');
      return;
    }

    await this.page.locator(CardPage.MEMBER_SEARCH_INPUT).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.MEMBER_SEARCH_INPUT).fill(nameOrUsernameFragment);
    await this.page.waitForTimeout(1000);

    await this.page.locator(CardPage.MEMBER_SEARCH_RESULT).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.MEMBER_SEARCH_RESULT).click();
    await this.page.keyboard().press('Escape');

    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      if (await this.isMemberAssigned(nameOrUsernameFragment)) break;
      await this.page.waitForTimeout(500);
    }
  }

  async isMemberAssigned(nameOrUsernameFragment) {
    try {
      const avatars = this.page.locator(CardPage.ASSIGNED_MEMBER_AVATAR);
      const count = await avatars.count();
      for (let i = 0; i < count; i++) {
        const title = await avatars.nth(i).getAttribute('title');
        if (title && title.includes(nameOrUsernameFragment)) return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Card Basic Operations ──────────────────────────────────────────────────

  async clickAddCardButton() {
    const addCardBtn = `xpath=//button[@aria-label='Add a card in ${this.listName}']`;
    await this.page.locator(addCardBtn).waitFor({ state: 'visible' });
    await this.page.locator(addCardBtn).click();
    console.log('Button Got Clicked');
  }

  async enterCardTitle(cardTitle) {
    console.log(`STEP: Entering card title: ${cardTitle}`);
    await this.page.locator("[data-testid='list-card-composer-textarea']").waitFor({ state: 'visible' });
    await this.page.locator("[data-testid='list-card-composer-textarea']").fill(cardTitle);
    console.log(`STEP: Card title entered: ${cardTitle}`);
  }

  async clickAddCardSubmit() {
    console.log("STEP: Clicking 'Add card' submit button...");
    await this.page.locator("button[data-testid='list-card-composer-add-card-button']").click();
    console.log('STEP: Card submitted successfully.');
  }

  async isCardCreated(cardTitle) {
    console.log(`STEP: Verifying card '${cardTitle}' is created...`);
    try {
      const sel = `xpath=//a[@data-testid='card-name' and contains(text(),'${cardTitle}')]`;
      await this.page.locator(sel).waitFor({ state: 'visible', timeout: 15000 });
      const isVisible = await this.page.locator(sel).isVisible();
      console.log(`STEP: Card visible on board: ${isVisible}`);
      return isVisible;
    } catch {
      console.log('Card NOT found');
      return false;
    }
  }

  async waitForCardModalToOpen() {
    await this.page.locator(CardPage.CARD_BACK_MODAL).waitFor({ state: 'visible' });
  }

  async waitForCardModalToClose() {
    await this.page.locator(CardPage.CARD_BACK_MODAL).waitFor({ state: 'hidden' });
  }

  async clickActionsButton() {
    await this.page.locator(CardPage.ACTIONS_BUTTON).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.ACTIONS_BUTTON).click();
  }

  async clickArchiveFromActions() {
    await this.page.locator(CardPage.ARCHIVE_CARD_OPTION).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.ARCHIVE_CARD_OPTION).click();
  }

  async isCardVisibleOnBoard(cardTitle) {
    const cards = this.page.locator(this._cardNameLocator(cardTitle));
    return await cards.count() > 0 && await cards.first().isVisible();
  }

  async isArchivedCardListed(cardTitle) {
    const anyArchived = "xpath=//div[@data-testid='archived-card']";
    try {
      await this.page.locator(anyArchived).waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      console.log('No archived cards loaded in panel within timeout.');
      return false;
    }
    const cards = this.page.locator(this._archivedCardLocator(cardTitle));
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      if (await cards.nth(i).isVisible()) return true;
    }
    return false;
  }

  // ── Card Back Modal ────────────────────────────────────────────────────────

  async openCard(cardTitle) {
    const cardSel = `xpath=//*[@data-testid='card-name' and normalize-space()='${cardTitle}']`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const cardElement = this.page.locator(cardSel);
      await cardElement.waitFor({ state: 'visible' });
      await cardElement.scrollIntoViewIfNeeded();
      try {
        await cardElement.click();
      } catch {
        await cardElement.click({ force: true });
      }
      try {
        await this.page.locator(CardPage.CLOSE_CARD_BUTTON).waitFor({ state: 'visible', timeout: 15000 });
        console.log(`STEP: Card opened successfully: ${cardTitle}`);
        return;
      } catch {
        if (attempt === 2) throw new Error(`Card modal did not open for: ${cardTitle}`);
        console.log(`STEP: Card modal did not open on attempt ${attempt}, retrying...`);
      }
    }
  }

  async clickDescription() {
    console.log('STEP: Clicking Description...');
    const addButton = this.page.locator(CardPage.DESCRIPTION_BUTTON);
    const addVisible = await addButton.count() > 0 && await addButton.first().isVisible();
    const target = addVisible ? CardPage.DESCRIPTION_BUTTON : CardPage.EDIT_DESCRIPTION_BTN;
    await this.page.locator(target).waitFor({ state: 'visible' });
    await this.page.locator(target).click();
    console.log('STEP: Description opened.');
  }

  async addDescription(description) {
    const field = this.page.locator(CardPage.DESCRIPTION_FIELD);
    await field.waitFor({ state: 'visible' });
    await field.click();
    await field.press('Control+a');
    await field.press('Delete');
    await field.fill(description);
  }

  async savedescription() {
    console.log('Button clicked and yet to save');
    await this.page.locator(CardPage.DESCRIPTION_SAVE_BTN).click();
    console.log('the button gotclicked and save');
  }

  async isSavedDescriptionDisplayed(expectedDescription) {
    const savedArea = "[data-testid='description-content-area']";
    try {
      await this.page.locator(savedArea).waitFor({ state: 'visible', timeout: 15000 });
      const actual = await this.page.locator(savedArea).textContent();
      console.log(`Expected saved description: ${expectedDescription}`);
      console.log(`Actual saved description:   ${actual}`);
      return actual.trim() === expectedDescription.trim();
    } catch {
      return false;
    }
  }

  async postComment(text) {
    const editor = await this._openCommentEditor();
    await editor.fill(text);
    await this._saveComment();
  }

  async postCommentMentioning(mentionFragment, commentText) {
    const editor = await this._openCommentEditor();
    await editor.type('@');

    const mentionOptionSel =
      `xpath=//div[@data-testid='popup-wrapper']//div[@role='option'][contains(@aria-label,'${mentionFragment}')]`;
    await this.page.locator(mentionOptionSel).waitFor({ state: 'visible' });
    await this.page.locator(mentionOptionSel).click();

    await editor.type(` ${commentText}`);
    await this._saveComment();
  }

  async _openCommentEditor() {
    await this.page.locator(CardPage.NEW_COMMENT_SKELETON_BTN).click();
    const editor = this.page.locator(CardPage.COMMENT_EDITOR);
    await editor.waitFor({ state: 'visible' });
    await editor.click();
    return editor;
  }

  async _saveComment() {
    await this.page.locator(CardPage.COMMENT_SAVE_BTN).click();
  }

  async isCommentPresent(text) {
    return this.isActivityEntryPresent(text);
  }

  async toggleWatch() {
    await this.page.locator(CardPage.ACTIONS_BTN_LOC).click();
    await this.page.locator(CardPage.SUBSCRIBED_BTN).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.SUBSCRIBED_BTN).click();
    await this.page.keyboard().press('Escape');
  }

  async ensureWatched() {
    if (!await this.isWatched()) await this.toggleWatch();
  }

  async isWatched() {
    try {
      await this.page.locator(CardPage.ACTIONS_BTN_LOC).click();
      const btn = this.page.locator(CardPage.SUBSCRIBED_BTN);
      await btn.waitFor({ state: 'visible' });
      const watching = await btn.getAttribute('aria-pressed') === 'true';
      await this.page.keyboard().press('Escape');
      return watching;
    } catch {
      return false;
    }
  }

  async isActivityEntryPresent(textFragment) {
    try {
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) {
        const entries = this.page.locator(CardPage.ACTIVITY_FEED_ITEM);
        const count = await entries.count();
        for (let i = 0; i < count; i++) {
          if ((await entries.nth(i).textContent()).includes(textFragment)) return true;
        }
        await this.page.waitForTimeout(300);
      }
      return false;
    } catch {
      return false;
    }
  }

  // ── Labels ─────────────────────────────────────────────────────────────────

  async clickLabels() {
    console.log('STEP: Clicking Labels...');
    const labels = this.page.locator(CardPage.LABELS_BUTTON);
    await labels.waitFor({ state: 'visible' });
    await labels.scrollIntoViewIfNeeded();
    await labels.click({ force: true });
    console.log('STEP: Labels menu opened.');
  }

  async selectLabel(color) {
    console.log(`STEP: Selecting label: ${color}`);
    const labelSel = `span[data-testid='card-label'][data-color='${color}']`;
    await this.page.locator(labelSel).waitFor({ state: 'visible' });
    await this.page.locator(labelSel).click();
    console.log(`STEP: Label selected: ${color}`);
  }

  async isLabelApplied(color) {
    const sel = `button[data-testid='compact-card-label'][data-color='${color}']`;
    try {
      await this.page.locator(sel).waitFor({ state: 'visible', timeout: 15000 });
      const displayed = await this.page.locator(sel).isVisible();
      console.log(`STEP: Label '${color}' displayed on card: ${displayed}`);
      return displayed;
    } catch {
      console.log(`STEP: Label '${color}' not applied.`);
      return false;
    }
  }

  async ensureLabelApplied(color) {
    if (await this.isLabelApplied(color)) {
      console.log(`STEP: Label '${color}' already applied, skipping.`);
      return;
    }
    await this.clickLabels();
    await this.selectLabel(color);
  }

  async clickAppliedLabel(color) {
    const sel = `button[data-testid='compact-card-label'][data-color='${color}']`;
    await this.page.locator(sel).waitFor({ state: 'visible' });
    await this.page.locator(sel).click({ force: true });
  }

  // ── Dates ──────────────────────────────────────────────────────────────────

  async clickDates() {
    console.log('STEP: Clicking Dates...');
    const datesQuickButton = "xpath=//button[normalize-space()='Dates']";
    const dueDateBadge     = "button[data-testid='due-date-badge-with-date-range-picker']";
    const quick = this.page.locator(datesQuickButton);
    const target = (await quick.count() > 0 && await quick.first().isVisible()) ? datesQuickButton : dueDateBadge;
    await this.page.locator(target).waitFor({ state: 'visible' });
    await this.page.locator(target).scrollIntoViewIfNeeded();
    await this.page.locator(target).click({ force: true });
    console.log('STEP: Dates menu opened.');
  }

  async enterDueDate(dueDate) {
    console.log(`STEP: Entering due date: ${dueDate}`);
    await this.page.locator(CardPage.DUE_DATE_FIELD).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.DUE_DATE_FIELD).click();
    await this.page.locator(CardPage.DUE_DATE_FIELD).press('Control+a');
    await this.page.locator(CardPage.DUE_DATE_FIELD).press('Backspace');
    await this.page.waitForTimeout(500);
    await this.page.locator(CardPage.DUE_DATE_FIELD).fill(dueDate);
    console.log(`STEP: Due date entered: ${dueDate}`);
  }

  async saveDueDate() {
    console.log('STEP: Saving due date...');
    await this.page.locator(CardPage.SAVE_DATE_BUTTON).click();
    console.log('STEP: Due date saved successfully.');
    await this.page.waitForTimeout(1500);
    await this.page.locator("button[data-testid='due-date-badge-with-date-range-picker']").waitFor({ state: 'visible' });
  }

  async isDueDateDisplayed(expectedDate) {
    const sel = "button[data-testid='due-date-badge-with-date-range-picker']";
    try {
      await this.page.locator(sel).waitFor({ state: 'visible', timeout: 15000 });
      const actual = await this.page.locator(sel).textContent();
      console.log(`Expected Due Date: ${expectedDate}`);
      console.log(`Actual Due Date:   ${actual}`);
      return actual.includes(expectedDate);
    } catch {
      return false;
    }
  }

  // ── Checklist ──────────────────────────────────────────────────────────────

  async clickChecklist() {
    console.log('STEP: Clicking Checklist...');
    await this.page.locator(CardPage.CHECKLIST_BUTTON).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.CHECKLIST_BUTTON).click();
    await this.page.waitForTimeout(1000);
    await this.page.locator(CardPage.CHECKLIST_TITLE_FIELD).waitFor({ state: 'visible' });
    console.log('STEP: Checklist menu opened.');
  }

  async enterChecklistName(checklistName) {
    console.log(`STEP: Entering checklist name: ${checklistName}`);
    await this.page.locator(CardPage.CHECKLIST_TITLE_FIELD).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.CHECKLIST_TITLE_FIELD).fill(checklistName);
    console.log(`STEP: Checklist name entered: ${checklistName}`);
  }

  async addChecklist() {
    console.log('STEP: Clicking Add checklist...');
    await this.page.locator(CardPage.CHECKLIST_ADD_BUTTON).click();
    console.log('STEP: Checklist added successfully.');
    await this.page.waitForTimeout(1500);
    await this.page.locator(CardPage.CHECKLIST_ITEM_INPUT).waitFor({ state: 'visible' });
  }

  async enterChecklistItem(itemName) {
    console.log(`STEP: Entering checklist item: ${itemName}`);
    await this.page.locator(CardPage.CHECKLIST_ITEM_INPUT).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.CHECKLIST_ITEM_INPUT).fill(itemName);
    console.log(`STEP: Checklist item entered: ${itemName}`);
  }

  async addChecklistItem() {
    console.log('STEP: Clicking Add checklist item...');
    await this.page.locator(CardPage.CHECKLIST_ITEM_ADD_BTN).click();
    console.log('STEP: Checklist item added successfully.');
  }

  async isChecklistItemDisplayed(expectedItem) {
    try {
      await this.page.locator(this._checklistItemCheckboxInput(expectedItem))
        .waitFor({ state: 'visible', timeout: 15000 });
      return await this.page.locator(this._checklistItemCheckboxInput(expectedItem)).isVisible();
    } catch {
      console.log(`Checklist item '${expectedItem}' not found`);
      return false;
    }
  }

  async isChecklistPresent(checklistName) {
    const sel = `xpath=//h3[@data-testid='checklist-title'][contains(normalize-space(), '${checklistName}')]`;
    try {
      await this.page.locator(sel).waitFor({ state: 'visible', timeout: 3000 });
      return await this.page.locator(sel).isVisible();
    } catch {
      return false;
    }
  }

  async checkChecklistItem(itemName) {
    if (await this.isChecklistItemChecked(itemName)) {
      console.log(`STEP: Checklist item '${itemName}' already checked, skipping.`);
      return;
    }
    console.log(`STEP: Checking checklist item: ${itemName}`);
    await this.page.locator(this._checklistItemCheckboxLabel(itemName)).waitFor({ state: 'visible' });
    await this.page.locator(this._checklistItemCheckboxLabel(itemName)).click();

    const deadline = Date.now() + 15000;
    while (Date.now() < deadline) {
      if (await this.isChecklistItemChecked(itemName)) break;
      await this.page.waitForTimeout(300);
    }
    console.log(`STEP: Checklist item checked: ${itemName}`);
  }

  async isChecklistItemChecked(itemName) {
    const input = this.page.locator(this._checklistItemCheckboxInput(itemName));
    await input.waitFor({ state: 'visible' });
    const checked = await this.page.evaluate(el => el.checked, await input.elementHandle());
    console.log(`STEP: Checklist item '${itemName}' checked: ${checked}`);
    return checked;
  }

  // ── Attachments ────────────────────────────────────────────────────────────

  async clickAttachment() {
    console.log("STEP: Opening 'Add to card' menu...");
    await this.page.locator(CardPage.ADD_TO_CARD_BUTTON).scrollIntoViewIfNeeded();
    await this.page.locator(CardPage.ADD_TO_CARD_BUTTON).click();
    console.log('STEP: Clicking Attachment...');
    await this.page.locator(CardPage.ATTACHMENT_BUTTON).scrollIntoViewIfNeeded();
    await this.page.locator(CardPage.ATTACHMENT_BUTTON).click();
    console.log('STEP: Attachment menu opened.');
  }

  async attachLink(url) {
    console.log(`STEP: Attaching link: ${url}`);
    await this.page.locator(CardPage.ATTACH_LINK_INPUT).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.ATTACH_LINK_INPUT).fill(url);
  }

  async confirmAttachLink() {
    console.log('STEP: Confirming link attachment...');
    await this.page.locator(CardPage.ATTACH_LINK_SUBMIT).click();
    console.log('STEP: Link attachment submitted.');
  }

  async isAttachmentPresent(urlOrNameFragment) {
    try {
      const deadline = Date.now() + 5000;
      while (Date.now() < deadline) {
        const items = this.page.locator(CardPage.ATTACHMENTS_LIST_ITEM);
        const count = await items.count();
        for (let i = 0; i < count; i++) {
          const text = await items.nth(i).textContent();
          const href = await items.nth(i).getAttribute('href');
          if ((text && text.includes(urlOrNameFragment)) || (href && href.includes(urlOrNameFragment))) return true;
        }
        await this.page.waitForTimeout(300);
      }
      return false;
    } catch {
      return false;
    }
  }

  async ensureLinkAttached(url) {
    if (await this.isAttachmentPresent(url)) {
      console.log(`STEP: Attachment '${url}' already present, skipping.`);
      return;
    }
    await this.clickAttachment();
    await this.attachLink(url);
    await this.confirmAttachLink();
  }

  // ── Cover ──────────────────────────────────────────────────────────────────

  async clickCover() {
    console.log('STEP: Clicking Cover...');
    await this.page.locator(CardPage.COVER_BUTTON).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.COVER_BUTTON).click();
    console.log('STEP: Cover menu opened.');
  }

  async selectCoverColor() {
    console.log('STEP: Selecting a cover color...');
    await this.page.locator(CardPage.COVER_COLOR_SWATCH).first().waitFor({ state: 'visible' });
    await this.page.locator(CardPage.COVER_COLOR_SWATCH).first().click();
    console.log('STEP: Cover color applied.');
    await this.page.keyboard().press('Escape');
  }

  async isCoverApplied() {
    try {
      await this.page.locator(CardPage.COVER_APPLIED_INDICATOR).waitFor({ state: 'visible', timeout: 5000 });
      return await this.page.locator(CardPage.COVER_APPLIED_INDICATOR).isVisible();
    } catch {
      return false;
    }
  }

  async ensureCoverApplied() {
    if (await this.isCoverApplied()) {
      console.log('STEP: Cover already applied, skipping.');
      return;
    }
    await this.clickCover();
    await this.selectCoverColor();
  }

  /** Returns all cover color swatch locators, for layout assertions. */
  async getCoverColorSwatchElements() {
    await this.page.locator(CardPage.COVER_COLOR_SWATCH).first().waitFor({ state: 'visible' });
    return await this.page.locator(CardPage.COVER_COLOR_SWATCH).all();
  }

  /** Dismisses the cover color popover without picking a color. */
  async closeCoverPopover() {
    await this.page.keyboard().press('Escape');
  }

  /** Returns the close-dialog button locator, for layout assertions. */
  async getCloseCardButtonElement() {
    await this.page.locator(CardPage.CLOSE_CARD_BUTTON).waitFor({ state: 'visible' });
    return this.page.locator(CardPage.CLOSE_CARD_BUTTON);
  }

  /** Returns the description area locator, for layout assertions. */
  async getDescriptionAreaElement() {
    const savedArea = "[data-testid='description-content-area']";
    try {
      await this.page.locator(savedArea).waitFor({ state: 'visible', timeout: 5000 });
      return this.page.locator(savedArea);
    } catch {
      await this.page.locator(CardPage.DESCRIPTION_BUTTON).waitFor({ state: 'visible' });
      return this.page.locator(CardPage.DESCRIPTION_BUTTON);
    }
  }

  /** Returns the checklist item checkbox locator, for layout assertions. */
  async getChecklistItemCheckboxElement(itemName) {
    const sel = this._checklistItemCheckboxInput(itemName);
    await this.page.locator(sel).waitFor({ state: 'visible' });
    return this.page.locator(sel);
  }

  async closeCard() {
    console.log('STEP: Closing card...');
    await this.page.locator(CardPage.CLOSE_CARD_BUTTON).waitFor({ state: 'visible' });
    await this.page.locator(CardPage.CLOSE_CARD_BUTTON).click();
    await this.page.locator(CardPage.CLOSE_CARD_BUTTON).waitFor({ state: 'hidden' });
    console.log('STEP: Card closed successfully.');
  }

  // ── Drag and Drop ──────────────────────────────────────────────────────────

  async dragCardToList(cardName, sourceList, targetList) {
    const sourceCard = await this._findCardInList(cardName, sourceList);
    if (!sourceCard) throw new Error(`Card '${cardName}' not found in list '${sourceList}'`);

    const targetListEl = await this._findListCardContainer(targetList);
    if (!targetListEl) throw new Error(`List '${targetList}' not found`);

    console.log(`DEBUG: Dragging card '${cardName}' from '${sourceList}' to '${targetList}'`);
    await sourceCard.dragTo(targetListEl, { force: true });
    await this.page.waitForTimeout(1000);
  }

  async _findCardInList(cardName, listName) {
    const listWrapper = await this._findListWrapper(listName);
    if (!listWrapper) return null;
    await this.page.waitForTimeout(500);
    const cards = listWrapper.locator("[data-testid='list-card']");
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      try {
        const name = (await cards.nth(i).locator("[data-testid='card-name']").textContent()).trim();
        if (name === cardName) return cards.nth(i);
      } catch { /* ignored */ }
    }
    return null;
  }

  async _findListWrapper(listName) {
    const lists = this.page.locator("[data-testid='list-wrapper']");
    const count = await lists.count();
    for (let i = 0; i < count; i++) {
      try {
        const name = (await lists.nth(i).locator("[data-testid='list-name']").textContent()).trim();
        if (name === listName) return lists.nth(i);
      } catch { /* ignored */ }
    }
    return null;
  }

  async _findListCardContainer(listName) {
    const wrapper = await this._findListWrapper(listName);
    if (!wrapper) return null;
    return wrapper.locator("[data-testid='list-cards']");
  }

  async dragCardInList(cardName, targetCard, listName) {
    const source = await this._findCardInList(cardName, listName);
    const target = await this._findCardInList(targetCard, listName);
    if (!source) throw new Error(`Source card '${cardName}' not found in list '${listName}'`);
    if (!target) throw new Error(`Target card '${targetCard}' not found in list '${listName}'`);
    await source.dragTo(target, { force: true });
    await this.page.waitForTimeout(1000);
  }

  async getCardIndexInList(cardName, listName) {
    const listBy =
      `xpath=//li[@data-testid='list-wrapper']` +
      `[.//h2[@data-testid='list-name']//span[text()='${listName}']]` +
      `//ol[@data-testid='list-cards']`;
    try {
      await this.page.locator(listBy).waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return -1;
    }
    const allCardsBy =
      `xpath=//li[@data-testid='list-wrapper']` +
      `[.//h2[@data-testid='list-name']//span[text()='${listName}']]` +
      `//ol[@data-testid='list-cards']//li[@data-testid='list-card']`;
    const cards = this.page.locator(allCardsBy);
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      try {
        const text = await cards.nth(i).locator("xpath=.//a[@data-testid='card-name']").textContent();
        if (text === cardName) return i;
      } catch { /* ignored */ }
    }
    return -1;
  }

  async findListContainingCard(cardName) {
    const allListNames = "xpath=//li[@data-testid='list-wrapper']//h2[@data-testid='list-name']//span";
    try {
      await this.page.locator(allListNames).first().waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      return null;
    }
    const lists = this.page.locator(allListNames);
    const count = await lists.count();
    for (let i = 0; i < count; i++) {
      const listName = await lists.nth(i).textContent();
      if (await this.getCardIndexInList(cardName, listName) >= 0) return listName;
    }
    return null;
  }

  async isCardInList(cardName, listName) {
    const cardBy =
      `xpath=//li[@data-testid='list-wrapper']` +
      `[.//h2[@data-testid='list-name']//span[text()='${listName}']]` +
      `//li[@data-testid='list-card'][.//a[@data-testid='card-name'][text()='${cardName}']]`;
    try {
      await this.page.locator(cardBy).waitFor({ state: 'visible', timeout: 15000 });
      return await this.page.locator(cardBy).isVisible();
    } catch {
      return false;
    }
  }

  async countCardsInList(cardName, listName) {
    const cardBy =
      `xpath=//li[@data-testid='list-wrapper']` +
      `[.//h2[@data-testid='list-name']//span[text()='${listName}']]` +
      `//li[@data-testid='list-card'][.//a[@data-testid='card-name'][text()='${cardName}']]`;
    return await this.page.locator(cardBy).count();
  }

  async dragCardToInvalidTarget(cardName, listName) {
    const sourceCardBy =
      `xpath=//li[@data-testid='list-wrapper']` +
      `[.//h2[@data-testid='list-name']//span[text()='${listName}']]` +
      `//ol[@data-testid='list-cards']` +
      `//li[@data-testid='list-card'][.//a[@data-testid='card-name'][text()='${cardName}']]`;

    const sourceCard = this.page.locator(sourceCardBy);
    await sourceCard.waitFor({ state: 'visible' });

    const invalidTarget = this.page.locator("xpath=//nav[@data-testid='authenticated-header']");
    await invalidTarget.waitFor({ state: 'visible' });

    await sourceCard.hover();
    await this.page.waitForTimeout(1000);
    await this.page.mouse.down();
    await this.page.waitForTimeout(1000);
    const srcBox = await sourceCard.boundingBox();
    await this.page.mouse.move(srcBox.x + 5, srcBox.y + 5);
    await this.page.waitForTimeout(1000);
    const headerBox = await invalidTarget.boundingBox();
    await this.page.mouse.move(headerBox.x + headerBox.width / 2, headerBox.y + headerBox.height / 2);
    await this.page.waitForTimeout(1000);
    await this.page.mouse.up();
    await this.page.waitForTimeout(1000);
  }

  // ── Fixture helper ─────────────────────────────────────────────────────────

  async ensureCardExists(cardName) {
    if (await this.isCardCreated(cardName)) {
      console.log(`[CardPage] Card '${cardName}' already exists.`);
      return false;
    }
    console.log(`[CardPage] Creating card: ${cardName}`);
    await this.clickAddCardButton();
    await this.enterCardTitle(cardName);
    await this.clickAddCardSubmit();
    await this.page.waitForTimeout(1000);
    if (!await this.isCardCreated(cardName)) {
      throw new Error(`Failed to create card '${cardName}'`);
    }
    console.log(`[CardPage] Card '${cardName}' created successfully.`);
    return true;
  }
}

module.exports = { CardPage };
