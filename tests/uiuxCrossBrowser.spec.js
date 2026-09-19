// @ts-check
const { test, expect } = require('../fixtures/base');
const { BoardPage }    = require('../pages/BoardPage');
const { CardPage }     = require('../pages/CardPage');
const { ListPage }     = require('../pages/ListPage');
const { DashboardPage } = require('../pages/DashboardPage');
const { resizeViewport, hasHorizontalOverflow, isVisibleWithinViewport } = require('../utils/responsiveUtils');

/**
 * UI/UX & Cross-Browser Validation tests.
 * Mirrors UIUXCrossBrowserTests.java — same test cases, same assertions.
 *
 * Run once per browser:
 *   npx playwright test tests/uiuxCrossBrowser.spec.js --project=chrome
 *   npx playwright test tests/uiuxCrossBrowser.spec.js --project=firefox
 *   npx playwright test tests/uiuxCrossBrowser.spec.js --project=edge
 */

const FIXED_BOARD_NAME     = 'UI UX Cross Browser Test Board';
const FIXED_LIST_NAME      = 'To Do';
const FIXED_CARD_NAME      = 'UI UX Test Card';
const FIXED_CHECKLIST_NAME = 'UI UX Checklist';
const FIXED_CHECKLIST_ITEM = 'Verify layout';

/** Retry a click up to 4 times (Trello placeholder fade-in can intercept). */
async function clickWithRetry(fn, description) {
  for (let attempts = 0; attempts < 4; attempts++) {
    try {
      await fn();
      return;
    } catch (e) {
      if (attempts >= 3) throw e;
      console.log(`Click on ${description} was intercepted, retrying (attempt ${attempts + 2})...`);
    }
  }
}

async function ensureFixtureReady(page, performLogin, dismissCookieBannerIfPresent) {
  await performLogin();
  const boardPage     = new BoardPage(page);
  const listPage      = new ListPage(page);
  const cardPage      = new CardPage(page);
  const dashboardPage = new DashboardPage(page);
  cardPage.listName   = FIXED_LIST_NAME;

  if (await dashboardPage.isBoardPresent(FIXED_BOARD_NAME)) {
    await dashboardPage.openBoard(FIXED_BOARD_NAME);
  } else {
    await boardPage.createNewBoard(FIXED_BOARD_NAME);
  }
  await dismissCookieBannerIfPresent();

  if (!await listPage.isListCreated(FIXED_LIST_NAME)) {
    await clickWithRetry(() => listPage.clickAddListButton(), 'add-list button');
    await listPage.enterListName(FIXED_LIST_NAME);
    await listPage.clickAddListSubmit();
    expect(await listPage.isListCreated(FIXED_LIST_NAME)).toBe(true);
  }
  if (!await cardPage.isCardCreated(FIXED_CARD_NAME)) {
    await clickWithRetry(() => cardPage.clickAddCardButton(), 'add-card button');
    await cardPage.enterCardTitle(FIXED_CARD_NAME);
    await cardPage.clickAddCardSubmit();
    expect(await cardPage.isCardCreated(FIXED_CARD_NAME)).toBe(true);
  }

  return { boardPage, listPage, cardPage };
}

const VIEWPORTS = [
  { name: 'Desktop-1920x1080', width: 1920, height: 1080 },
  { name: 'Laptop-1280x800',   width: 1280, height: 800  },
  { name: 'Mobile-375x812',    width: 375,  height: 812  },
];

// ── Login page layout ──────────────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test(`testLoginPageLayout [${vp.name}]`, async ({
    page, navigateToLoginPage, loginPage,
  }) => {
    await navigateToLoginPage();
    await resizeViewport(page, vp.width, vp.height);

    const emailInput     = await loginPage.getEmailInputElement();
    const continueButton = await loginPage.getContinueButtonElement();

    expect(await emailInput.isVisible()).toBe(true);
    expect(await continueButton.isVisible() && await continueButton.isEnabled()).toBe(true);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

// ── Dashboard layout ───────────────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test(`testDashboardLayout [${vp.name}]`, async ({
    page, performLogin, dismissCookieBannerIfPresent, dashboardPage,
  }) => {
    await performLogin();
    await resizeViewport(page, vp.width, vp.height);
    await dismissCookieBannerIfPresent();

    const header            = await dashboardPage.getHeaderElement();
    const createBoardButton = await dashboardPage.getCreateBoardButtonElement();

    expect(await header.isVisible()).toBe(true);
    expect(await createBoardButton.isVisible() && await createBoardButton.isEnabled()).toBe(true);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

// ── Board page layout ──────────────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test(`testBoardPageLayout [${vp.name}]`, async ({
    page, performLogin, dismissCookieBannerIfPresent,
  }) => {
    const { boardPage, listPage } = await ensureFixtureReady(page, performLogin, dismissCookieBannerIfPresent);
    await resizeViewport(page, vp.width, vp.height);

    const boardTitle    = await boardPage.getBoardTitle();
    const addListButton = await listPage.getAddListButtonElement();

    expect(boardTitle).toBe(FIXED_BOARD_NAME);
    expect(await addListButton.isVisible() && await addListButton.isEnabled()).toBe(true);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });
}

// ── Card modal layout ──────────────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test(`testCardModalLayout [${vp.name}]`, async ({
    page, performLogin, dismissCookieBannerIfPresent,
  }) => {
    const { cardPage } = await ensureFixtureReady(page, performLogin, dismissCookieBannerIfPresent);
    await resizeViewport(page, vp.width, vp.height);

    await cardPage.openCard(FIXED_CARD_NAME);

    const closeButton     = await cardPage.getCloseCardButtonElement();
    const descriptionArea = await cardPage.getDescriptionAreaElement();

    expect(await descriptionArea.isVisible()).toBe(true);
    expect(await closeButton.isVisible() && await closeButton.isEnabled()).toBe(true);
    expect(await isVisibleWithinViewport(page, closeButton)).toBe(true);

    await cardPage.closeCard();
  });
}

// ── Checklist panel layout ─────────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test(`testChecklistPanelLayout [${vp.name}]`, async ({
    page, performLogin, dismissCookieBannerIfPresent,
  }) => {
    const { cardPage } = await ensureFixtureReady(page, performLogin, dismissCookieBannerIfPresent);
    await resizeViewport(page, vp.width, vp.height);

    await cardPage.openCard(FIXED_CARD_NAME);

    if (!await cardPage.isChecklistPresent(FIXED_CHECKLIST_NAME)) {
      await clickWithRetry(() => cardPage.clickChecklist(), 'checklist button');
      await cardPage.enterChecklistName(FIXED_CHECKLIST_NAME);
      await cardPage.addChecklist();
    }
    if (!await cardPage.isChecklistItemDisplayed(FIXED_CHECKLIST_ITEM)) {
      await cardPage.enterChecklistItem(FIXED_CHECKLIST_ITEM);
      await cardPage.addChecklistItem();
    }

    const checklistItemRow = await cardPage.getChecklistItemCheckboxElement(FIXED_CHECKLIST_ITEM);

    expect(await checklistItemRow.isVisible()).toBe(true);
    expect(await checklistItemRow.isEnabled()).toBe(true);
    expect(await isVisibleWithinViewport(page, checklistItemRow)).toBe(true);
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await cardPage.closeCard();
  });
}

// ── Cover color picker layout ──────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test(`testCoverColorPickerLayout [${vp.name}]`, async ({
    page, performLogin, dismissCookieBannerIfPresent,
  }) => {
    const { cardPage } = await ensureFixtureReady(page, performLogin, dismissCookieBannerIfPresent);
    await resizeViewport(page, vp.width, vp.height);

    await cardPage.openCard(FIXED_CARD_NAME);
    await clickWithRetry(() => cardPage.clickCover(), 'cover button');

    const swatches = await cardPage.getCoverColorSwatchElements();
    expect(swatches.length).toBeGreaterThan(0);

    const firstSwatch = swatches[0];
    const lastSwatch  = swatches[swatches.length - 1];

    expect(await firstSwatch.isVisible() && await firstSwatch.isEnabled()).toBe(true);
    expect(await lastSwatch.isVisible()  && await lastSwatch.isEnabled()).toBe(true);
    expect(await isVisibleWithinViewport(page, firstSwatch)).toBe(true);
    expect(await isVisibleWithinViewport(page, lastSwatch)).toBe(true);
    expect(await hasHorizontalOverflow(page)).toBe(false);

    await cardPage.closeCoverPopover();
    await cardPage.closeCard();
  });
}

// ── Negative: card modal must not overflow on mobile ──────────────────────────

test('testCardModalNoHorizontalOverflowOnMobile', async ({
  page, performLogin, dismissCookieBannerIfPresent,
}) => {
  const { cardPage } = await ensureFixtureReady(page, performLogin, dismissCookieBannerIfPresent);
  await resizeViewport(page, 375, 812);

  await cardPage.openCard(FIXED_CARD_NAME);
  expect(await hasHorizontalOverflow(page)).toBe(false);
  await cardPage.closeCard();
});
