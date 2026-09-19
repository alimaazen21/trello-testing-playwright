// @ts-check

/**
 * Responsive / viewport utility helpers.
 * Playwright equivalent of the original Java ResponsiveUtils.
 */

/**
 * Resize the browser viewport.
 * @param {import('@playwright/test').Page} page
 * @param {number} width
 * @param {number} height
 */
async function resizeViewport(page, width, height) {
  await page.setViewportSize({ width, height });
}

/**
 * Detect unwanted horizontal scroll (1 px tolerance for sub-pixel rounding).
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<boolean>}
 */
async function hasHorizontalOverflow(page) {
  return await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
  );
}

/**
 * Checks the element's bounding box is entirely within the current viewport.
 * @param {import('@playwright/test').Page} page
 * @param {import('@playwright/test').Locator} locator
 * @returns {Promise<boolean>}
 */
async function isVisibleWithinViewport(page, locator) {
  return await page.evaluate(el => {
    const r  = el.getBoundingClientRect();
    const vw = window.innerWidth  || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    return r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
  }, await locator.elementHandle());
}

module.exports = { resizeViewport, hasHorizontalOverflow, isVisibleWithinViewport };
