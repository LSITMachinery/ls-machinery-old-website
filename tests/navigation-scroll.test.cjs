const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('../preview-server.cjs');

(async () => {
  delete process.env.LS_SKIP_PRERENDER;
  const server = createServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const routes = [
    '/',
    '/machines/',
    '/machine/mini-cookie-depositor-mcd/',
    '/solution/factory-line-planning/',
    '/services/',
    '/inquiry/',
  ];

  try {
    for (const url of routes) {
      await page.goto(base + url);
      await page.locator('#main h1').first().waitFor();
      await page.evaluate(() => window.scrollTo(0, Math.max(0, document.documentElement.scrollHeight / 2)));
      await page.waitForTimeout(100);

      const headerTop = await page.locator('.site-header').evaluate((header) => header.getBoundingClientRect().top);
      assert.ok(headerTop >= -1 && headerTop <= 1, `${url}: sticky header stays at the top after scrolling (got ${headerTop})`);
      assert.equal(await page.locator('body').evaluate((body) => getComputedStyle(body).overflowY), 'visible', `${url}: desktop page scrolling remains enabled`);

      const companyMenuButton = page.locator('[data-menu="company"]');
      await companyMenuButton.hover();
      await page.waitForFunction(() => document.querySelector('[data-menu="company"]')?.getAttribute('aria-expanded') === 'true');
      assert.equal(await page.locator('#ls-desktop-menu').isVisible(), true, `${url}: company menu opens after scrolling`);
      assert.ok(await page.locator('#ls-desktop-menu a[href*="company"]').first().isVisible(), `${url}: company menu link is reachable`);

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.querySelector('[data-menu="company"]')?.getAttribute('aria-expanded') === 'false');
      assert.equal(await page.locator('body').evaluate((body) => body.inert), false, `${url}: closing the menu leaves page content interactive`);
    }
    console.log(`PASS: sticky navigation remains usable after scrolling on all ${routes.length} key page types; desktop scrolling stays enabled and Escape closes the menu without leaving the page inert.`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
