const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const path = require('node:path');
const base = process.env.LS_PREVIEW_URL || 'http://127.0.0.1:8000/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ reducedMotion: 'reduce' });
  await page.goto(`${base}#home`, { waitUntil: 'networkidle' });
  for (const language of ['en', 'zh', 'ms']) {
    await page.selectOption('#language-picker', language);
    for (const width of [320, 360, 390, 768, 820, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const layout = await page.evaluate(() => {
        const controls = [...document.querySelectorAll('.site-header .brand, .primary-nav > a, .header-actions > *, .mobile-toggle')]
          .filter(el => el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden')
          .map(el => ({ label: el.textContent.trim() || el.getAttribute('aria-label'), rect: el.getBoundingClientRect().toJSON() }));
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          outside: controls.filter(({ rect }) => rect.left < 0 || rect.right > innerWidth + 1),
          overlap: controls.flatMap((a, i) => controls.slice(i + 1).filter(b => a.rect.left < b.rect.right - 1 && a.rect.right > b.rect.left + 1 && a.rect.top < b.rect.bottom - 1 && a.rect.bottom > b.rect.top + 1).map(b => [a.label, b.label]))
        };
      });
      assert.equal(layout.overflow, false, `${language}/${width}: page overflow`);
      assert.deepEqual(layout.outside, [], `${language}/${width}: header control outside viewport`);
      assert.deepEqual(layout.overlap, [], `${language}/${width}: overlapping header controls`);
    }
  }
  await page.selectOption('#language-picker', 'en');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.primary-nav a').first().focus();
  assert.equal(await page.locator('.mega-panel').getAttribute('aria-hidden'), 'false', 'keyboard focus should reveal catalogue navigation');
  await page.locator('.mega-panel a').first().focus();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mega-panel').getAttribute('aria-hidden'), 'true', 'Escape closes catalogue navigation');
  assert.equal(await page.locator('.primary-nav a').first().evaluate(el => el === document.activeElement), true, 'Escape restores focus');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.mobile-toggle').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.mobile-toggle').getAttribute('aria-expanded'), 'false');
  assert.equal(await page.locator('.mobile-toggle').getAttribute('aria-label'), 'Open navigation');
  await page.locator('.mobile-toggle').click();
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('.mobile-toggle').getAttribute('aria-expanded'), 'false', 'rotation resets the mobile menu');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.mobile-toggle').click();
  await page.locator('.primary-nav a[href="#machines"]').click();
  await page.waitForURL('**/#machines');
  assert.equal(await page.locator('.mobile-toggle').getAttribute('aria-label'), 'Open navigation', 'following a menu link resets its name');
  await page.goto(`${base}#home`);
  await page.locator('.hero-product-link').click();
  await page.waitForURL('**/#machine/lsf-502-mcd');
  await page.locator('#lead-form[data-machine="LSF 502 MCD"]').waitFor();
  assert.match(await page.locator('#inquiry-summary').innerText(), /LSF 502 MCD/);
  await page.goto(`${base}#home`);
  await page.locator('.intro-video source').evaluate(el => el.dispatchEvent(new Event('error')));
  assert.equal(await page.locator('.video-static-fallback').isVisible(), true, 'a source failure shows the local poster');
  await page.locator('.cms-trigger').click();
  await page.locator('#cms-current-title').fill('Private title check');
  await page.locator('#cms-current').fill('Private body check');
  assert.match(await page.locator('#cms-preview-card').innerText(), /Private title check/);
  assert.match(await page.locator('#cms-preview-card').innerText(), /Private body check/);
  assert.equal(await page.locator('#intro-film-title').innerText(), 'A closer look at LS.', 'unsaved CMS edits remain private');
  await page.locator('.cms-close').click();
  await page.reload();
  await page.locator('.hero-machine-image').evaluate(image => image.decode());
  await page.screenshot({ path: path.resolve('audit-assets/homepage-mobile.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.locator('.hero-machine-image').evaluate(image => image.decode());
  await page.screenshot({ path: path.resolve('audit-assets/homepage-desktop.png') });
  await browser.close();
  console.log('PASS: homepage fits 8 widths in 3 languages; header controls do not overlap; keyboard and mobile menus, featured machine inquiry context, and source-error poster fallback work.');
})().catch(error => { console.error(error); process.exit(1); });
