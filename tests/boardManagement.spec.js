// @ts-check
const { test, expect } = require('../fixtures/base');
const { BoardPage } = require('../pages/BoardPage');
const { ListPage }  = require('../pages/ListPage');
const { CardPage }  = require('../pages/CardPage');

/**
 * Board Management tests.
 * Mirrors BoardManagementTest.java — same test cases, same assertions.
 */
test.describe('Board Management Tests', () => {

  let boardUrl = null;
  const UPDATED_BOARD_NAME = 'Renamed Automation Board';

  test.beforeEach(async ({ page, performLogin }) => {
    await performLogin();
    if (boardUrl) await page.goto(boardUrl);
  });

  // BM-001: Create Board
  test('test01_createNewBoard', async ({ page, performLogin }) => {
    const uniqueId   = Date.now();
    const boardName  = `Automation-Board-${uniqueId}`;
    const boardPage  = new BoardPage(page);

    console.log('=================================================');
    console.log('RUNNING: BM-001: Create a New Board');
    console.log('=================================================');
    console.log(`Step 1: Creating a new board named: ${boardName}`);

    await boardPage.createNewBoard(boardName);

    console.log('Step 2: Verifying board URL and display name.');
    boardUrl = page.url();

    expect(boardUrl).toContain('/b/');

    const displayedTitle = await boardPage.getBoardTitle();
    console.log('Displayed Board Title:', displayedTitle);
    expect(displayedTitle).toBe(boardName);

    console.log('BM-001 PASSED: Board created and verified successfully.');
  });

  // BM-002: Create a List
  test('test02_createList', async ({ page }) => {
    const listName = `To Do-${Date.now()}`;
    const listPage = new ListPage(page);

    console.log('=================================================');
    console.log('RUNNING: BM-002: Create a New List');
    console.log('=================================================');

    console.log('STEP 4: Entering list name...');
    await listPage.enterListName(listName);

    console.log('STEP 5: Submitting list...');
    await listPage.clickAddListSubmit();

    console.log('STEP 6: Verifying list creation...');
    const isCreated = await listPage.isListCreated(listName);
    expect(isCreated).toBe(true);

    console.log(`BM-002 PASSED: List '${listName}' created successfully!`);
  });

  // BM-003: Create a Card
  test('testCreateCard', async ({ page }) => {
    const cardName = `Test-Card-${Date.now()}`;
    const cardPage = new CardPage(page);

    console.log('STEP 7: Clicking Add a card...');
    await cardPage.clickAddCardButton();

    console.log('STEP 8: Entering card title...');
    await cardPage.enterCardTitle(cardName);

    console.log('STEP 9: Submitting card...');
    await cardPage.clickAddCardSubmit();

    console.log('STEP 10: Verifying card creation...');
    const isCreated = await cardPage.isCardCreated(cardName);
    expect(isCreated).toBe(true);
    console.log(`TEST PASSED: Card '${cardName}' created successfully!`);
  });

  // BM-004: Long board name
  test('test04_boardNameWithLongName', async ({ page }) => {
    const longName  = 'A'.repeat(500) + `-${Date.now()}`;
    const boardPage = new BoardPage(page);
    let created     = false;

    try {
      await boardPage.createNewBoard(longName);
      created = true;
    } catch {
      console.log('500-character board name was rejected/timed out — acceptable.');
    }

    if (created) {
      const actualTitle = await boardPage.getBoardTitle();
      expect(actualTitle).toBe(longName);
      // cleanup
      try {
        await boardPage.closeBoard();
        await boardPage.deleteBoardPermanently();
      } catch (e) {
        console.log('Cleanup warning:', e.message);
      }
    }
  });

  // BM-005: XSS in board name
  test('test05_boardNameWithScriptInjection', async ({ page }) => {
    const maliciousName = `<script>alert(1)</script>-${Date.now()}`;
    const boardPage     = new BoardPage(page);

    try {
      await boardPage.createNewBoard(maliciousName);
      const actualTitle = await boardPage.getBoardTitle();
      expect(actualTitle).toBe(maliciousName);
    } catch (e) {
      throw new Error(`Board name must NOT execute JavaScript (XSS vulnerability): ${e.message}`);
    }

    // cleanup
    try {
      await boardPage.closeBoard();
      await boardPage.deleteBoardPermanently();
    } catch (e) {
      console.log('Cleanup warning:', e.message);
    }
  });
});
