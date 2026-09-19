// @ts-check
const { test } = require('../fixtures/base');
const { BoardPage }     = require('../pages/BoardPage');

/**
 * Collaboration diagnostic test.
 * Mirrors CollaborationDiagnosticTest.java — run this first to check workspace setup.
 */
test.describe('Collaboration Diagnostic', () => {

  function secondAccountEmail() {
    return process.env.TRELLO_EMAIL_SECOND || '';
  }
  function secondAccountName() {
    return 'Rashmi';
  }

  test('testDiagnosticInvite', async ({ page, performLogin, secondSession }) => {
    console.log('========================================');
    console.log('COLLABORATION DIAGNOSTIC TEST');
    console.log('========================================');

    // Step 1: Login with main account
    console.log('\n[STEP 1] Logging in with main account...');
    await performLogin();
    console.log('[STEP 1] ✓ Main account logged in');

    // Step 2: Login with second account
    console.log('\n[STEP 2] Checking second account...');
    if (!secondSession) {
      console.log('[STEP 2] ✗ Second account not configured — set TRELLO_EMAIL_SECOND / TRELLO_PASSWORD_SECOND');
    } else {
      console.log('[STEP 2] ✓ Second account logged in');
    }

    // Step 3: Create diagnostic board
    console.log('\n[STEP 3] Creating diagnostic board...');
    const boardName  = `Diagnostic-Board-${Date.now()}`;
    const board      = new BoardPage(page);
    await board.createNewBoard(boardName);
    console.log('[STEP 3] ✓ Board created:', boardName);

    // Step 4: Open Share dialog
    console.log('\n[STEP 4] Opening Share dialog...');
    await board.openShareDialog();
    console.log('[STEP 4] ✓ Share dialog opened');

    // Step 5: Check current members
    console.log('\n[STEP 5] Checking current board members...');
    const currentMembersLoc  = page.locator("[data-testid='member-item']");
    const currentMemberCount = await currentMembersLoc.count();
    console.log('[STEP 5] Current member count:', currentMemberCount);
    for (let i = 0; i < currentMemberCount; i++) {
      console.log(`[STEP 5] Member[${i}]:`, await currentMembersLoc.nth(i).innerText());
    }

    // Step 6: Type email and check for typeahead
    console.log('\n[STEP 6] Typing second account email:', secondAccountEmail());
    const searchInput = page.locator("input[data-testid='add-members-input']");
    await searchInput.clear();
    await searchInput.fill(secondAccountEmail());
    await page.waitForTimeout(2000);

    const suggestionsLoc = page.locator("[data-testid='team-invitee-option']");
    const suggestionCount = await suggestionsLoc.count();
    console.log('[STEP 6] Typeahead suggestions found:', suggestionCount);

    if (suggestionCount === 0) {
      console.log('[STEP 6] ⚠ WARNING: No typeahead suggestions!');
      console.log('[STEP 6] This means accounts are likely NOT in the same workspace.');
      console.log('[STEP 6] See COLLABORATION_SETUP.md for how to fix this.');
      const allButtons = await page.locator('button').count();
      console.log('[STEP 6] Total buttons visible:', allButtons);
    } else {
      console.log('[STEP 6] ✓ Typeahead suggestions found!');
      for (let i = 0; i < suggestionCount; i++) {
        console.log(`[STEP 6] Suggestion[${i}]:`, await suggestionsLoc.nth(i).innerText());
      }
    }

    // Step 7: Try to invite
    console.log('\n[STEP 7] Attempting to invite member...');
    try {
      await board.inviteMemberByEmail(secondAccountEmail());
      console.log('[STEP 7] ✓ Invite method completed');
    } catch (e) {
      console.log('[STEP 7] ✗ Invite method failed:', e.message);
    }

    // Step 8: Check members again
    console.log('\n[STEP 8] Checking board members after invite...');
    const membersAfterLoc   = page.locator("[data-testid='member-item']");
    const membersAfterCount = await membersAfterLoc.count();
    console.log('[STEP 8] Member count after invite:', membersAfterCount);
    for (let i = 0; i < membersAfterCount; i++) {
      const memberText = await membersAfterLoc.nth(i).innerText();
      console.log(`[STEP 8] Member[${i}]:`, memberText);
      if (memberText.includes(secondAccountName())) console.log('[STEP 8] ✓ FOUND second account in member list!');
      if (memberText.toLowerCase().includes(secondAccountName().toLowerCase())) console.log('[STEP 8] ✓ FOUND (case-insensitive match)!');
      if (memberText.includes(secondAccountEmail())) console.log('[STEP 8] ✓ FOUND by email!');
    }

    // Step 9: Summary
    console.log('\n========================================');
    console.log('DIAGNOSTIC SUMMARY');
    console.log('========================================');
    console.log("Looking for member name: '" + secondAccountName() + "'");
    console.log("Looking for email: '" + secondAccountEmail() + "'");
    console.log('Typeahead suggestions:', suggestionCount);
    console.log('Members before invite:', currentMemberCount);
    console.log('Members after invite:', membersAfterCount);

    if (membersAfterCount > currentMemberCount) {
      console.log('✓ Member count increased - invitation worked!');
    } else if (suggestionCount === 0) {
      console.log('✗ No typeahead - accounts not in same workspace');
      console.log('ACTION REQUIRED: Add both accounts to same workspace');
    } else {
      console.log('✗ Unknown issue - check member names above');
    }
    console.log('========================================');

    // Keep browser open for manual inspection
    await page.waitForTimeout(5000);
  });
});
