// @ts-check
const { test, expect } = require('../fixtures/base');
const { BoardPage } = require('../pages/BoardPage');
const { ListPage }  = require('../pages/ListPage');

/**
 * List operation tests.
 * Mirrors ListTests.java — same test cases, same assertions.
 */
test.describe('List Tests', () => {

  let boardUrl = null;

  test.beforeEach(async ({ page, performLogin }) => {
    await performLogin();
    const boardPage = new BoardPage(page);
    const listPage  = new ListPage(page);

    if (!boardUrl) {
      await boardPage.createNewBoard(`List-Test-Board-${Date.now()}`);
      boardUrl = page.url();
    } else {
      await page.goto(boardUrl);
    }
  });

  test('TC01_createList', async ({ page }) => {
    const listName = `Test-List-${Date.now()}`;
    const listPage = new ListPage(page);
    await listPage.createList(listName);
    expect(await listPage.isListCreated(listName)).toBe(true);
  });

  test('TC02_renameList', async ({ page }) => {
    const oldName  = `Test-List-${Date.now()}`;
    const newName  = `Renamed-List-${Date.now()}`;
    const listPage = new ListPage(page);
    await listPage.createList(oldName);
    await listPage.renameList(oldName, newName);
    expect(await listPage.isListCreated(newName)).toBe(true);
  });

  test('TC03_archiveList', async ({ page }) => {
    const listName = `Archive-List-${Date.now()}`;
    const listPage = new ListPage(page);
    await listPage.createList(listName);
    await listPage.archiveList(listName);
    expect(await listPage.isListCreated(listName)).toBe(false);
  });

  test('TC04_emptyTitleValidation', async ({ page }) => {
    const listPage = new ListPage(page);
    await listPage.waitForBoardToLoad();
    const countBefore = await listPage.getListCount();
    await listPage.attemptEmptyListSubmit();
    const countAfter = await listPage.getListCount();
    expect(countAfter).toBe(countBefore);
  });

  test('TC05_copyList', async ({ page }) => {
    const listName    = `Copy-Source-${Date.now()}`;
    const listPage    = new ListPage(page);
    await listPage.createList(listName);
    const countBefore = await listPage.getListCount();
    await listPage.copyList(listName);
    const countAfter  = await listPage.getListCount();
    expect(countAfter).toBe(countBefore + 1);
  });

  test('TC06_whitespaceOnlyListName', async ({ page }) => {
    const listPage = new ListPage(page);
    await listPage.waitForBoardToLoad();
    const countBefore = await listPage.getListCount();
    await listPage.clickAddListButton();
    await listPage.enterListName('     ');
    await listPage.clickAddListSubmit();
    const countAfter = await listPage.getListCount();
    expect(countAfter).toBe(countBefore);
  });

  test('TC07_scriptInjectionListName', async ({ page }) => {
    const maliciousName = `<script>alert(1)</script>-${Date.now()}`;
    const listPage      = new ListPage(page);
    await listPage.createList(maliciousName);
    expect(await listPage.getListOrder()).toContain(maliciousName);
  });
});
