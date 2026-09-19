// @ts-check
const { test, expect } = require('../fixtures/base');
const { BoardPage } = require('../pages/BoardPage');
const { CardPage }  = require('../pages/CardPage');
const { ListPage }  = require('../pages/ListPage');

/**
 * Card attribute / detail tests.
 * Mirrors CardDetailsTest.java — same test cases, same assertions.
 */
test.describe('Card Details Tests', () => {

  const FIXED_BOARD_NAME = 'Card Attributes Test Board';
  const FIXED_LIST_NAME  = 'To Do';
  const FIXED_CARD_NAME  = 'Card Attributes Test Card';
  const ATTACHMENT_URL   = 'https://www.atlassian.com/software/trello';

  test.beforeEach(async ({ page, performLogin, dismissCookieBannerIfPresent }) => {
    await performLogin();

    const boardPage = new BoardPage(page);
    const listPage  = new ListPage(page);
    const cardPage  = new CardPage(page);
    cardPage.listName = FIXED_LIST_NAME;

    // Ensure fixture board
    const { DashboardPage } = require('../pages/DashboardPage');
    const dashboardPage = new DashboardPage(page);
    if (await dashboardPage.isBoardPresent(FIXED_BOARD_NAME)) {
      console.log('FIXTURE: Board already exists, opening it.');
      await dashboardPage.openBoard(FIXED_BOARD_NAME);
    } else {
      console.log('FIXTURE: Board not found, creating it.');
      await boardPage.createNewBoard(FIXED_BOARD_NAME);
    }
    await dismissCookieBannerIfPresent();

    // Ensure fixture list
    if (!await listPage.isListCreated(FIXED_LIST_NAME)) {
      console.log('FIXTURE: List not found, creating it.');
      await listPage.clickAddListButton();
      await listPage.enterListName(FIXED_LIST_NAME);
      await listPage.clickAddListSubmit();
      expect(await listPage.isListCreated(FIXED_LIST_NAME)).toBe(true);
    }

    // Ensure fixture card
    if (!await cardPage.isCardCreated(FIXED_CARD_NAME)) {
      console.log('FIXTURE: Card not found, creating it.');
      await cardPage.clickAddCardButton();
      await cardPage.enterCardTitle(FIXED_CARD_NAME);
      await cardPage.clickAddCardSubmit();
      expect(await cardPage.isCardCreated(FIXED_CARD_NAME)).toBe(true);
    }
  });

  // ── Helper to get fresh CardPage inside each test ──────────────────────
  function card(page) {
    const c = new CardPage(page);
    c.listName = FIXED_LIST_NAME;
    return c;
  }

  test('addDescription', async ({ page }) => {
    const description =
      'This is an automated card description. and Script was automatically updated over thier.';
    const cardPage = card(page);

    await cardPage.openCard(FIXED_CARD_NAME);
    await cardPage.clickDescription();
    await cardPage.addDescription(description);
    await cardPage.savedescription();

    expect(await cardPage.isSavedDescriptionDisplayed(description)).toBe(true);
    await cardPage.closeCard();

    // Reopen and verify persistence
    await cardPage.openCard(FIXED_CARD_NAME);
    expect(await cardPage.isSavedDescriptionDisplayed(description)).toBe(true);
    await cardPage.closeCard();
  });

  test('addGreenLabel', async ({ page }) => {
    const cardPage = card(page);

    await cardPage.openCard(FIXED_CARD_NAME);
    await cardPage.ensureLabelApplied('green');
    expect(await cardPage.isLabelApplied('green')).toBe(true);
    await cardPage.closeCard();

    // Reopen and verify persistence
    await cardPage.openCard(FIXED_CARD_NAME);
    expect(await cardPage.isLabelApplied('green')).toBe(true);
    await cardPage.closeCard();
  });

  test('setDueDate', async ({ page }) => {
    const cardPage = card(page);

    await cardPage.openCard(FIXED_CARD_NAME);
    await cardPage.clickDates();
    await cardPage.enterDueDate('9/15/2026');
    await cardPage.saveDueDate();

    expect(await cardPage.isDueDateDisplayed('Sep 15')).toBe(true);
    await cardPage.closeCard();

    // Reopen and verify persistence
    await cardPage.openCard(FIXED_CARD_NAME);
    expect(await cardPage.isDueDateDisplayed('Sep 15')).toBe(true);
    await cardPage.closeCard();
  });

  test('addChecklist', async ({ page }) => {
    const checklistName = 'Automation Checklist';
    const checklistItem = 'Verify Trello automation';
    const cardPage      = card(page);

    await cardPage.openCard(FIXED_CARD_NAME);
    await cardPage.clickChecklist();

    if (!await cardPage.isChecklistPresent(checklistName)) {
      await cardPage.enterChecklistName(checklistName);
      await cardPage.addChecklist();
    }
    if (!await cardPage.isChecklistItemDisplayed(checklistItem)) {
      await cardPage.enterChecklistItem(checklistItem);
      await cardPage.addChecklistItem();
    }

    expect(await cardPage.isChecklistItemDisplayed(checklistItem)).toBe(true);

    await cardPage.checkChecklistItem(checklistItem);
    expect(await cardPage.isChecklistItemChecked(checklistItem)).toBe(true);

    await cardPage.closeCard();

    // Reopen and verify persistence
    await cardPage.openCard(FIXED_CARD_NAME);
    expect(await cardPage.isChecklistItemDisplayed(checklistItem)).toBe(true);
    expect(await cardPage.isChecklistItemChecked(checklistItem)).toBe(true);
    await cardPage.closeCard();
  });

  test('addLinkAttachment', async ({ page }) => {
    const cardPage = card(page);

    await cardPage.openCard(FIXED_CARD_NAME);
    await cardPage.ensureLinkAttached(ATTACHMENT_URL);
    expect(await cardPage.isAttachmentPresent(ATTACHMENT_URL)).toBe(true);
    await cardPage.closeCard();

    // Reopen and verify persistence
    await cardPage.openCard(FIXED_CARD_NAME);
    expect(await cardPage.isAttachmentPresent(ATTACHMENT_URL)).toBe(true);
    await cardPage.closeCard();
  });

  test('setCoverColor', async ({ page }) => {
    const cardPage = card(page);

    await cardPage.openCard(FIXED_CARD_NAME);
    await cardPage.ensureCoverApplied();
    expect(await cardPage.isCoverApplied()).toBe(true);
    await cardPage.closeCard();

    // Reopen and verify persistence
    await cardPage.openCard(FIXED_CARD_NAME);
    expect(await cardPage.isCoverApplied()).toBe(true);
    await cardPage.closeCard();
  });

  test('addWhitespaceChecklistItem', async ({ page }) => {
    const checklistName = 'Automation Checklist';
    const checklistItem = '   ';
    const cardPage      = card(page);

    await cardPage.openCard(FIXED_CARD_NAME);
    await cardPage.clickChecklist();

    if (!await cardPage.isChecklistPresent(checklistName)) {
      await cardPage.enterChecklistName(checklistName);
      await cardPage.addChecklist();
    }

    await cardPage.enterChecklistItem(checklistItem);
    await cardPage.addChecklistItem();

    expect(await cardPage.isChecklistItemDisplayed(checklistItem)).toBe(false);
    await cardPage.closeCard();
  });
});
