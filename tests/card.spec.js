// @ts-check
const { test, expect } = require('../fixtures/base');
const { BoardPage } = require('../pages/BoardPage');
const { CardPage }  = require('../pages/CardPage');
const { ListPage }  = require('../pages/ListPage');

/**
 * Card operation tests.
 * Mirrors CardTests.java — same test cases, same assertions.
 */
test.describe('Card Tests', () => {

  const EXISTING_BOARD_NAME = 'My Trello Board';
  const EXISTING_LIST_NAME  = 'Today';

  test.beforeEach(async ({ page, performLogin, dismissCookieBannerIfPresent }) => {
    console.log('=================================================');
    console.log('SETUP: Logging in and ensuring fixture exists...');
    console.log('=================================================');

    await performLogin();
    await dismissCookieBannerIfPresent();

    const boardPage = new BoardPage(page);
    const listPage  = new ListPage(page);

    // Ensure board exists
    const dashPage = (await import('../pages/DashboardPage')).DashboardPage;
    const dashboard = new dashPage(page);
    if (!await dashboard.isBoardPresent(EXISTING_BOARD_NAME)) {
      await boardPage.createNewBoard(EXISTING_BOARD_NAME);
    } else {
      await dashboard.openBoard(EXISTING_BOARD_NAME);
    }

    await page.waitForURL('**/b/**', { timeout: 20000 });
    console.log('SETUP: Board opened. URL:', page.url());

    await listPage.ensureListExists(EXISTING_LIST_NAME);

    console.log('=================================================');
    console.log('SETUP COMPLETE. Fixture ready.');
    console.log('=================================================');
  });

  // ── helpers ─────────────────────────────────────────────────────────────

  async function createCard(page, cardTitle) {
    console.log(`PRECONDITION: Creating card '${cardTitle}'...`);
    const cardPage = new CardPage(page);
    await page.locator("[data-testid='list-card-composer-textarea']").waitFor({ state: 'visible' });
    await cardPage.enterCardTitle(cardTitle);
    await page.locator("button[data-testid='list-card-composer-add-card-button']").waitFor({ state: 'visible' });
    await cardPage.clickAddCardSubmit();
    await page.locator(`xpath=//a[@data-testid='card-name' and text()='${cardTitle}']`).waitFor({ state: 'visible' });
    console.log(`PRECONDITION: Card '${cardTitle}' created.`);
  }

  async function archiveCard(page, cardTitle) {
    console.log(`PRECONDITION: Archiving card '${cardTitle}'...`);
    const cardPage = new CardPage(page);
    await page.locator(`xpath=//a[@data-testid='card-name' and text()='${cardTitle}']`).waitFor({ state: 'visible' });
    await cardPage.openCard(cardTitle);
    await cardPage.waitForCardModalToOpen();
    await cardPage.clickActionsButton();
    await cardPage.clickArchiveFromActions();
    await cardPage.closeCard();
    await cardPage.waitForCardModalToClose();
    console.log(`PRECONDITION: Card '${cardTitle}' archived.`);
  }

  // ── BM-003: Create Single Card ──────────────────────────────────────────

  test('test01_createCard', async ({ page }) => {
    const cardTitle = 'My Automated Card';
    const cardPage  = new CardPage(page);

    console.log('=================================================');
    console.log('RUNNING: BM-003 — Create Single Card');
    console.log('=================================================');

    console.log('STEP 1: Entering card title:', cardTitle);
    await page.locator("[data-testid='list-card-composer-textarea']").waitFor({ state: 'visible' });
    await cardPage.enterCardTitle(cardTitle);

    console.log('STEP 2: Submitting card...');
    await page.locator("button[data-testid='list-card-composer-add-card-button']").waitFor({ state: 'visible' });
    await cardPage.clickAddCardSubmit();

    console.log('STEP 3: Verifying card on board...');
    await page.locator(`xpath=//a[@data-testid='card-name' and text()='${cardTitle}']`).waitFor({ state: 'visible' });
    expect(await cardPage.isCardCreated(cardTitle)).toBe(true);

    console.log(`BM-003 PASSED: Card '${cardTitle}' created!`);
  });

  // ── KAN-31: Create Multiple Cards ──────────────────────────────────────

  test('test02_createMultipleCards', async ({ page }) => {
    const cardPage  = new CardPage(page);
    const cardTitles = ['Automated Card 1', 'Automated Card 2', 'Automated Card 3'];

    console.log('=================================================');
    console.log('RUNNING: KAN-31 — Create Multiple Cards');
    console.log('=================================================');

    for (let i = 0; i < cardTitles.length; i++) {
      const cardTitle = cardTitles[i];
      console.log(`Creating Card ${i + 1}: ${cardTitle}`);

      await page.locator("[data-testid='list-card-composer-textarea']").waitFor({ state: 'visible' });
      await cardPage.enterCardTitle(cardTitle);
      await page.locator("button[data-testid='list-card-composer-add-card-button']").waitFor({ state: 'visible' });
      await cardPage.clickAddCardSubmit();
      await page.locator(`xpath=//a[@data-testid='card-name' and text()='${cardTitle}']`).waitFor({ state: 'visible' });
      expect(await cardPage.isCardCreated(cardTitle)).toBe(true);
      console.log('Card created:', cardTitle);
    }

    console.log('KAN-31 PASSED: All 3 cards created!');
  });

  // ── BM-004: Archive Single Card ─────────────────────────────────────────

  test('test03_archiveSingleCard', async ({ page }) => {
    const cardTitle = 'My Automated Card';
    const cardPage  = new CardPage(page);
    const boardPage = new BoardPage(page);

    console.log('=================================================');
    console.log('RUNNING: BM-004 — Archive Single Card');
    console.log('=================================================');

    await createCard(page, cardTitle);

    console.log('STEP 1: Waiting for card...');
    await page.locator(`xpath=//a[@data-testid='card-name' and text()='${cardTitle}']`).waitFor({ state: 'visible' });

    console.log('STEP 2: Opening card...');
    await cardPage.openCard(cardTitle);

    console.log('STEP 3: Clicking Actions...');
    await cardPage.clickActionsButton();

    console.log('STEP 4: Clicking Archive...');
    await cardPage.clickArchiveFromActions();
    await cardPage.closeCard();
    await cardPage.waitForCardModalToClose();

    console.log('STEP 5: Opening Board Menu...');
    await boardPage.openBoardMenu();

    console.log('STEP 6: Opening Archived Items...');
    await boardPage.openArchivedItems();
    await boardPage.waitForArchivedItemsPanel();

    console.log('STEP 7: Verifying card in Archived Items...');
    expect(await cardPage.isArchivedCardListed(cardTitle)).toBe(true);

    await boardPage.closeBoardMenu();
    console.log('BM-004 PASSED: Card archived and verified!');
  });

  // ── KAN-32: Archive Multiple Cards ──────────────────────────────────────

  test('test04_archiveMultipleCards', async ({ page }) => {
    const cardTitles = ['Automated Card 1', 'Automated Card 2', 'Automated Card 3'];
    const cardPage   = new CardPage(page);
    const boardPage  = new BoardPage(page);

    console.log('=================================================');
    console.log('RUNNING: KAN-32 — Archive Multiple Cards');
    console.log('=================================================');

    console.log('PRECONDITION: Creating all cards...');
    for (const title of cardTitles) await createCard(page, title);

    for (let i = 0; i < cardTitles.length; i++) {
      const cardTitle = cardTitles[i];
      console.log(`Archiving Card ${i + 1}: ${cardTitle}`);
      await page.locator(`xpath=//a[@data-testid='card-name' and text()='${cardTitle}']`).waitFor({ state: 'visible' });
      await cardPage.openCard(cardTitle);
      await cardPage.waitForCardModalToOpen();
      await cardPage.clickActionsButton();
      await cardPage.clickArchiveFromActions();
      await cardPage.closeCard();
      await cardPage.waitForCardModalToClose();

      await boardPage.openBoardMenu();
      await boardPage.openArchivedItems();
      await boardPage.waitForArchivedItemsPanel();
      expect(await cardPage.isArchivedCardListed(cardTitle)).toBe(true);
      await boardPage.closeBoardMenu();
      console.log(`Card ${i + 1} archived and verified: ${cardTitle}`);
    }

    console.log('KAN-32 PASSED: All 3 cards archived and verified!');
  });

  // ── BM-005: Delete Single Archived Card ─────────────────────────────────

  test('test05_deleteSingleArchivedCard', async ({ page }) => {
    const cardTitle = 'My Automated Card';
    const boardPage = new BoardPage(page);

    console.log('=================================================');
    console.log('RUNNING: BM-005 — Delete Single Archived Card');
    console.log('=================================================');

    await createCard(page, cardTitle);
    await archiveCard(page, cardTitle);

    console.log('STEP 1: Opening Board Menu...');
    await boardPage.openBoardMenu();

    console.log('STEP 2: Opening Archived Items panel...');
    await boardPage.openArchivedItems();
    await boardPage.waitForArchivedItemsPanel();

    console.log('STEP 3: Waiting for archived card to appear...');
    await boardPage.waitForArchivedCardToAppear(cardTitle);

    console.log('STEP 4: Clicking Delete button for:', cardTitle);
    await boardPage.clickDeleteButtonForArchivedCard(cardTitle);

    console.log('STEP 5: Confirming deletion...');
    await boardPage.confirmCardDeletion(cardTitle);

    console.log('STEP 6: Verifying card is removed...');
    expect(await boardPage.isCardDeletedFromArchivedItems(cardTitle)).toBe(true);

    console.log(`BM-005 PASSED: Card '${cardTitle}' permanently deleted!`);
  });

  // ── KAN-33: Delete Multiple Archived Cards ──────────────────────────────

  test('test06_deleteMultipleArchivedCards', async ({ page }) => {
    const cardTitles = ['Automated Card 1', 'Automated Card 2', 'Automated Card 3'];
    const boardPage  = new BoardPage(page);

    console.log('=================================================');
    console.log('RUNNING: KAN-33 — Delete Multiple Archived Cards');
    console.log('=================================================');

    console.log('PRECONDITION: Creating all cards...');
    for (const title of cardTitles) await createCard(page, title);

    console.log('PRECONDITION: Archiving all cards...');
    for (const title of cardTitles) await archiveCard(page, title);

    for (let i = 0; i < cardTitles.length; i++) {
      const cardTitle = cardTitles[i];
      console.log(`Deleting Archived Card ${i + 1}: ${cardTitle}`);
      await boardPage.openBoardMenu();
      await boardPage.openArchivedItems();
      await boardPage.waitForArchivedItemsPanel();
      await boardPage.waitForArchivedCardToAppear(cardTitle);
      await boardPage.clickDeleteButtonForArchivedCard(cardTitle);
      await boardPage.confirmCardDeletion(cardTitle);
      expect(await boardPage.isCardDeletedFromArchivedItems(cardTitle)).toBe(true);
      await boardPage.closeBoardMenu();
      console.log(`Card ${i + 1} deleted: ${cardTitle}`);
    }

    console.log('KAN-33 PASSED: All 3 archived cards deleted and verified!');
  });
});
