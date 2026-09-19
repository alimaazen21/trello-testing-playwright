// @ts-check
const { test, expect } = require('../fixtures/base');
const { BoardPage }     = require('../pages/BoardPage');
const { CardPage }      = require('../pages/CardPage');
const { DashboardPage } = require('../pages/DashboardPage');

/**
 * Collaboration feature tests.
 * Mirrors CollaborationTests.java — same test cases, same assertions.
 *
 * These tests require a second Trello account configured via
 * TRELLO_EMAIL_SECOND / TRELLO_PASSWORD_SECOND (see .env.example).
 * Tests are automatically skipped when the second account is not configured.
 */
test.describe('Collaboration Tests', () => {

  function secondAccountEmail() {
    return process.env.TRELLO_EMAIL_SECOND || '';
  }

  async function secondAccountName(secondSession) {
    if (secondSession?.dashboardPage) {
      const name = await secondSession.dashboardPage.getLoggedInUserDisplayName();
      if (name) return name;
    }
    return 'Rashmi';
  }

  async function ensureBoardExists(page, dashboardPage, boardName) {
    if (await dashboardPage.isBoardPresent(boardName)) {
      await dashboardPage.openBoard(boardName);
    } else {
      console.log(`FIXTURE: Board '${boardName}' not found, creating it...`);
      const boardPage = new BoardPage(page);
      await boardPage.createNewBoard(boardName);
      await page.waitForTimeout(2000);
    }
    return new BoardPage(page);
  }

  // ── Invite Member ──────────────────────────────────────────────────────────

  test('testInviteMemberToBoard', async ({ page, performLogin, secondSession }) => {
    test.skip(!secondSession, 'Second account not configured');

    const dashboardPage = new DashboardPage(page);
    await performLogin();
    const secondName = await secondAccountName(secondSession);
    const boardName  = 'Collab-Invite';
    const board      = await ensureBoardExists(page, dashboardPage, boardName);

    await board.openShareDialog();
    await board.inviteMemberByEmail(secondAccountEmail());

    expect(await board.isMemberOnBoard(secondName)).toBe(true);

    await secondSession.page.goto(process.env.TRELLO_URL || 'https://trello.com');
    expect(await secondSession.dashboardPage.isBoardVisible(boardName)).toBe(true);
  });

  // ── Admin Role ─────────────────────────────────────────────────────────────

  test('testAdminRoleGrantsFullAccess', async ({ page, performLogin, secondSession }) => {
    test.skip(!secondSession, 'Second account not configured');

    const dashboardPage = new DashboardPage(page);
    await performLogin();
    const secondNameAdmin = await secondAccountName(secondSession);
    const boardName       = 'Collab-Admin';
    const board           = await ensureBoardExists(page, dashboardPage, boardName);

    await board.openShareDialog();
    await board.inviteMemberByEmail(secondAccountEmail());
    expect(await board.isMemberOnBoard(secondNameAdmin)).toBe(true);

    await board.closeDialog();
    await page.waitForTimeout(1000);
    await board.openShareDialog();
    await board.setMemberRole(secondNameAdmin, 'Admin');
    expect(await board.getMemberRole(secondNameAdmin)).toBe('Admin');

    await secondSession.page.goto(process.env.TRELLO_URL || 'https://trello.com');
    expect(await secondSession.dashboardPage.isBoardVisible(boardName)).toBe(true);
    await secondSession.dashboardPage.openBoard(boardName);

    const secondUserBoard = new BoardPage(secondSession.page);
    expect(await secondUserBoard.isShareButtonEnabled()).toBe(true);
  });

  // ── Observer Role ──────────────────────────────────────────────────────────

  test('testObserverRoleRestrictsEditing', async ({ page, performLogin, secondSession }) => {
    test.skip(!secondSession, 'Second account not configured');

    const dashboardPage   = new DashboardPage(page);
    await performLogin();
    const secondNameObs = await secondAccountName(secondSession);
    const boardName     = 'Collab-Observer';
    const board         = await ensureBoardExists(page, dashboardPage, boardName);

    await board.openShareDialog();
    await board.inviteMemberByEmail(secondAccountEmail());
    await board.closeDialog();
    await page.waitForTimeout(1000);
    await board.openShareDialog();
    await board.setMemberRole(secondNameObs, 'Observer');
    expect(await board.getMemberRole(secondNameObs)).toBe('Observer');

    await secondSession.page.goto(process.env.TRELLO_URL || 'https://trello.com');
    expect(await secondSession.dashboardPage.isBoardVisible(boardName)).toBe(true);
    await secondSession.dashboardPage.openBoard(boardName);

    const secondUserBoard = new BoardPage(secondSession.page);
    expect(await secondUserBoard.isAddCardAvailable()).toBe(false);
  });

  // ── Assign Member to Card ──────────────────────────────────────────────────

  test('testAssignMemberToCard', async ({ page, performLogin, secondSession }) => {
    test.skip(!secondSession, 'Second account not configured');

    const dashboardPage = new DashboardPage(page);
    await performLogin();
    const secondName = await secondAccountName(secondSession);
    const boardName  = 'Collab-Assign';
    const board      = await ensureBoardExists(page, dashboardPage, boardName);

    await board.openShareDialog();
    await board.inviteMemberByEmail(secondAccountEmail());
    await board.closeDialog();

    await board.ensureCardExists('To Do', 'Card to assign');
    await board.openCard('Card to assign');
    const card = new CardPage(page);
    await card.addMember(secondName);
    expect(await card.isMemberAssigned(secondName)).toBe(true);

    await secondSession.page.goto(process.env.TRELLO_URL || 'https://trello.com');
    expect(await secondSession.dashboardPage.isBoardVisible(boardName)).toBe(true);
    await secondSession.dashboardPage.openBoard(boardName);

    const secondUserBoard = new BoardPage(secondSession.page);
    await secondUserBoard.openCard('Card to assign');
    const secondUserCard = new CardPage(secondSession.page);
    expect(await secondUserCard.isMemberAssigned(secondName)).toBe(true);
  });

  // ── @Mention in Comment ────────────────────────────────────────────────────

  test('testMentionInCommentNotifiesMember', async ({
    page, performLogin, secondSession, waitUntil,
  }) => {
    test.skip(!secondSession, 'Second account not configured');

    const dashboardPage = new DashboardPage(page);
    await performLogin();
    const secondName = await secondAccountName(secondSession);
    const boardName  = 'Collab-Mention';
    const board      = await ensureBoardExists(page, dashboardPage, boardName);

    await board.openShareDialog();
    await board.inviteMemberByEmail(secondAccountEmail());
    await board.closeDialog();

    await board.ensureCardExists('To Do', 'Card with mention');
    await board.openCard('Card with mention');
    const card = new CardPage(page);
    await card.postCommentMentioning(secondName, 'please review');
    expect(await card.isCommentPresent('please review')).toBe(true);

    expect(await waitUntil(() => secondSession.dashboardPage.hasUnreadNotifications())).toBe(true);
  });

  // ── Post Comment ───────────────────────────────────────────────────────────

  test('testPostComment', async ({ page, performLogin }) => {
    const dashboardPage = new DashboardPage(page);
    await performLogin();
    const boardName = 'Collab-Comment';
    const board     = await ensureBoardExists(page, dashboardPage, boardName);

    await board.ensureCardExists('To Do', 'Card for comment');
    await board.openCard('Card for comment');

    const card = new CardPage(page);
    await card.postComment('This is a test comment');
    expect(await card.isCommentPresent('This is a test comment')).toBe(true);
  });

  // ── Watch Card ─────────────────────────────────────────────────────────────

  test('testWatchCardNotifiesOnUpdate', async ({
    page, performLogin, secondSession, waitUntil,
  }) => {
    test.skip(!secondSession, 'Second account not configured');

    const dashboardPage = new DashboardPage(page);
    await performLogin();
    const boardName = 'Collab-Watch';
    const board     = await ensureBoardExists(page, dashboardPage, boardName);

    await board.openShareDialog();
    await board.inviteMemberByEmail(secondAccountEmail());
    await board.closeDialog();
    await board.ensureCardExists('To Do', 'Card to watch');

    await secondSession.page.goto(process.env.TRELLO_URL || 'https://trello.com');
    expect(await secondSession.dashboardPage.isBoardVisible(boardName)).toBe(true);
    await secondSession.dashboardPage.openBoard(boardName);

    const secondUserBoard = new BoardPage(secondSession.page);
    await secondUserBoard.openCard('Card to watch');
    const secondUserCard = new CardPage(secondSession.page);
    await secondUserCard.ensureWatched();
    expect(await secondUserCard.isWatched()).toBe(true);

    await board.openCard('Card to watch');
    const card = new CardPage(page);
    await card.postComment('Update for watchers');

    expect(await waitUntil(() => secondSession.dashboardPage.hasUnreadNotifications())).toBe(true);
  });

  // ── Activity Log ───────────────────────────────────────────────────────────

  test('testActivityLogRecordsCardActions', async ({ page, performLogin }) => {
    const dashboardPage = new DashboardPage(page);
    await performLogin();
    const boardName = 'Collab-Activity';
    const board     = await ensureBoardExists(page, dashboardPage, boardName);

    await board.ensureCardExists('To Do', 'Card for activity log');
    await board.openCard('Card for activity log');

    const card = new CardPage(page);
    await card.postComment('Logged comment');
    expect(await card.isActivityEntryPresent('Logged comment')).toBe(true);
  });
});
