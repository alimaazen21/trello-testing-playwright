// @ts-check
const { test, expect } = require('../fixtures/base');
const { BoardPage }     = require('../pages/BoardPage');
const { CardPage }      = require('../pages/CardPage');
const { ListPage }      = require('../pages/ListPage');
const { DashboardPage } = require('../pages/DashboardPage');

/**
 * Drag and Drop tests.
 * Mirrors DragAndDrop_Test.java — same test cases, same assertions.
 *
 * ⚠️  EXPERIMENTAL — may be flaky on SPAs with dynamic DOM.
 * Set SKIP_ALL_DRAG_TESTS = true below to disable if flakiness returns.
 */

const SKIP_ALL_DRAG_TESTS = false; // set to true to disable
const BOARD_NAME    = 'Trello Project';
const REQUIRED_LISTS = ['To Do', 'Doing', 'Done'];
const REQUIRED_CARDS = [
  'Create test cases',
  'implement test cases',
  'Prepare test script',
];

test.describe('Drag and Drop Tests', () => {

  // Shared state — setUp runs once before all drag tests
  let fixtureReady = false;

  test.beforeAll(async ({ browser }) => {
    if (SKIP_ALL_DRAG_TESTS) return;

    // We create a fresh context just for setup; each test gets its own page
    // but we only need one login session to prepare fixtures.
    const ctx  = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const page = await ctx.newPage();

    const { LoginPage }  = require('../pages/LoginPage');
    const loginPage      = new LoginPage(page);
    const dashboardPage  = new DashboardPage(page);

    await page.goto(process.env.TRELLO_URL || 'https://trello.com/login');
    await loginPage.login(
      process.env.TRELLO_EMAIL    || '',
      process.env.TRELLO_PASSWORD || ''
    );

    // Dismiss cookie banner
    try {
      const btn = page.locator("[data-testid='accept-all-button']");
      if (await btn.count() > 0 && await btn.first().isVisible()) {
        await btn.first().click();
        await page.waitForTimeout(500);
      }
    } catch { /* ignored */ }

    const boardPage = new BoardPage(page);
    const listPage  = new ListPage(page);
    const cardPage  = new CardPage(page);

    console.log('=================================================');
    console.log('SETUP: Ensuring DragAndDrop fixture exists...');
    console.log('=================================================');

    if (!await dashboardPage.isBoardPresent(BOARD_NAME)) {
      await boardPage.createNewBoard(BOARD_NAME);
    } else {
      await dashboardPage.openBoard(BOARD_NAME);
    }
    await page.waitForTimeout(2000);

    for (const listName of REQUIRED_LISTS) await listPage.ensureListExists(listName);
    for (const cardName of REQUIRED_CARDS) {
      cardPage.listName = 'To Do';
      await cardPage.ensureCardExists(cardName);
    }

    console.log('=================================================');
    console.log('SETUP COMPLETE. DragAndDrop fixture ready!');
    console.log('=================================================');

    fixtureReady = true;
    await ctx.close();
  });

  test.beforeEach(async ({ page, performLogin, dismissCookieBannerIfPresent }) => {
    test.skip(SKIP_ALL_DRAG_TESTS, 'Drag-and-drop tests are disabled (SKIP_ALL_DRAG_TESTS=true)');
    await performLogin();
    await dismissCookieBannerIfPresent();

    const dashboardPage = new DashboardPage(page);
    if (await dashboardPage.isBoardPresent(BOARD_NAME)) {
      await dashboardPage.openBoard(BOARD_NAME);
    }
    await page.waitForTimeout(1000);
  });

  // TC-1: verify the project board opens correctly
  test('openBoard', async ({ page }) => {
    const boardPage = new BoardPage(page);
    expect(await boardPage.getBoardTitle()).toBe(BOARD_NAME);
  });

  // TC-2: drag a card from one list to another
  test('DragAndDrop_CardFromOneListToOther', async ({ page }) => {
    const cardName   = 'Create test cases';
    const sourceList = 'To Do';
    const targetList = 'Doing';

    const cardPage = new CardPage(page);
    await cardPage.dragCardToList(cardName, sourceList, targetList);

    expect(await cardPage.countCardsInList(cardName, sourceList)).toBe(0);
    expect(await cardPage.isCardInList(cardName, targetList)).toBe(true);
  });

  // TC-3: drag a card within the same list to reorder it
  test('DragAndDrop_CardInAList', async ({ page }) => {
    const sourceCard = 'implement test cases';
    const targetCard = 'Prepare test script';
    const listName   = 'To Do';

    const cardPage   = new CardPage(page);
    const indexBefore = await cardPage.getCardIndexInList(sourceCard, listName);
    await cardPage.dragCardInList(sourceCard, targetCard, listName);
    const indexAfter  = await cardPage.getCardIndexInList(sourceCard, listName);

    expect(indexAfter).not.toBe(indexBefore);
  });

  // TC-4: drag an entire list to reorder it on the board
  test('DragAndDrop_EntireList', async ({ page }) => {
    const sourceList  = 'Doing';
    const destList    = 'Done';

    const boardPage    = new BoardPage(page);
    const namesBefore  = await boardPage.getListOrder();
    const indexBefore  = namesBefore.indexOf(sourceList);

    await boardPage.dragListToPosition(sourceList, destList);
    await boardPage.waitForListReorder(sourceList, indexBefore);

    const namesAfter  = await boardPage.getListOrder();
    const indexAfter  = namesAfter.indexOf(sourceList);

    expect(namesAfter).toContain(sourceList);
    expect(namesAfter).toContain(destList);
    expect(indexAfter).not.toBe(indexBefore);
  });

  // TC-5: drag card to invalid zone — should return to original position
  test('DragCard_OutsideScope_ReturnsToPosition', async ({ page, waitUntil }) => {
    const cardText = 'Prepare test script';
    const cardPage = new CardPage(page);

    const listName = await cardPage.findListContainingCard(cardText);
    expect(listName).not.toBeNull();

    const indexBefore = await cardPage.getCardIndexInList(cardText, listName);
    await cardPage.dragCardToInvalidTarget(cardText, listName);

    await waitUntil(async () => await cardPage.getCardIndexInList(cardText, listName) >= 0);

    const indexAfter = await cardPage.getCardIndexInList(cardText, listName);
    expect(indexAfter).toBeGreaterThanOrEqual(0);
    expect(indexAfter).toBe(indexBefore);
  });
});
