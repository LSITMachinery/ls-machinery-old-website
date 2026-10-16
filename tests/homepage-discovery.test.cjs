const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { createServer } = require('../preview-server.cjs');

// This test owns its local server and never opens a real contact destination.
(async () => {
  delete process.env.LS_INQUIRY_WEBHOOK_URL;
  delete process.env.LS_SKIP_PRERENDER;
  const server = createServer();
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const errors = [];
  const failedResources = [];
  try {
    browser = await chromium.launch();
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      const request = response.request();
      if (response.url().startsWith(base) && response.status() >= 400 &&
          ['script', 'stylesheet', 'image'].includes(request.resourceType())) {
        failedResources.push(`${response.status()} ${response.url()}`);
      }
    });
    const home = async () => {
      await page.goto(base + '/');
      await page.waitForFunction(() => document.querySelector('#main')?.dataset.route === 'home');
      await page.locator('.home-machine-search').waitFor();
    };
    const routeIsFocused = async route => {
      await page.waitForFunction(expected => document.querySelector('#main')?.dataset.route === expected, route);
      await page.waitForFunction(() => document.activeElement === document.querySelector('#main h1'));
    };

    for (const width of [375, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await home();
      await page.evaluate(async () => {
        await document.fonts.ready;
        await document.querySelector('.hero-machine-image').decode();
      });
      assert.equal(await page.locator('#main h1').count(), 1, `one homepage heading at ${width}`);
      const layout = await page.evaluate(() => {
        const image = document.querySelector('.hero-machine-image');
        const imageBox = image.getBoundingClientRect();
        const stage = image.closest('figure').getBoundingClientRect();
        const title = document.querySelector('#main h1').getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          titleFits: title.left >= 0 && title.right <= innerWidth + 1,
          imageLoaded: image.naturalWidth > 0 && image.naturalHeight > 0,
          imageFits: imageBox.left >= stage.left - 1 && imageBox.right <= stage.right + 1,
          reduced: document.body.classList.contains('motion-paused'),
          trustBeforeFood: document.querySelector('.home-trust').getBoundingClientRect().top < document.querySelector('#food').getBoundingClientRect().top
        };
      });
      assert.equal(layout.overflow, false, `homepage fits ${width}px`);
      assert.ok(layout.titleFits && layout.imageLoaded && layout.imageFits, `readable heading and contained genuine image at ${width}`);
      assert.ok(layout.reduced, 'reduced-motion preference is respected');
      assert.ok(layout.trustBeforeFood, 'verified client proof precedes food discovery');

      const originalUrl = page.url();
      await page.locator('.home-food-action').focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => document.activeElement === document.querySelector('#food h2'));
      assert.equal(page.url(), originalUrl, 'food discovery preserves the homepage route');
      const foodPosition = await page.locator('#food h2').boundingBox();
      assert.ok(foodPosition.y >= 0 && foodPosition.y < 900, 'keyboard discovery exposes its heading');
      assert.equal(await page.locator('.food-shortcut').count(), 6);
      assert.equal(await page.locator('.home-equipment-list > li > a').count(), 5);

      await page.locator('.home-equipment-list > li > a').first().click();
      await routeIsFocused('machines/bakery');
      assert.ok(await page.locator('#catalogue-list .catalogue-item').count() > 0, 'category discovery reaches usable equipment');
      await home();
      if (width < 1001) {
        await page.locator('.mobile-toggle').focus();
        await page.keyboard.press('Enter');
        await page.waitForFunction(() => document.querySelector('.mobile-toggle').getAttribute('aria-expanded') === 'true');
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, 'open mobile navigation fits');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.mobile-toggle').getAttribute('aria-expanded'), 'false');
        assert.ok(await page.locator('.mobile-toggle').evaluate(element => element === document.activeElement), 'mobile menu returns focus');
      } else {
        await page.locator('.ls-nav-trigger[data-menu="machines"]').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.locator('.ls-desktop-menu').getAttribute('aria-hidden'), 'false');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.ls-desktop-menu').getAttribute('aria-hidden'), 'true');
        assert.ok(await page.locator('.ls-nav-trigger[data-menu="machines"]').evaluate(element => element === document.activeElement), 'desktop menu returns focus');
      }
    }

    // Verify the new discovery and service links against the real local route map.
    await home();
    const destinations = await page.locator('.food-shortcut, .home-equipment-list a, .home-capability-list > li > a, .home-machine-link').evaluateAll(links => links.map(link => link.getAttribute('href')));
    assert.equal(await page.locator('.home-capability-list > li > a').count(), 4);
    for (const href of new Set(destinations)) {
      assert.match(href, /^\/(?:food|machines|machine|solution|service)\//, 'discovery uses public page paths');
      const response = await page.request.get(base + href);
      assert.equal(response.status(), 200, `local destination resolves: ${href}`);
    }

    await page.locator('#home-machine-query').fill('MCD');
    await page.locator('#home-machine-query').press('Enter');
    await page.waitForURL('**/search/?q=MCD');
    assert.equal(await page.locator('input[name="q"]').inputValue(), 'MCD');
    await page.locator('.catalogue-item').first().click();
    await routeIsFocused('machine/mini-cookie-depositor-mcd');
    for (const selector of ['[data-inquiry-email]', '[data-inquiry-whatsapp]']) {
      const href = await page.locator('.production-invitation ' + selector).getAttribute('href');
      assert.match(decodeURIComponent(href), /LSF 502 MCD/);
      assert.match(decodeURIComponent(href), /Request a quote/);
      if (selector.includes('whatsapp')) assert.match(href, /^https:\/\/wa\.me\/60126577922\?text=/);
    }
    await page.locator('.production-invitation a.arrow-link').click();
    await routeIsFocused('inquiry');
    assert.equal(await page.locator('#inq-type').inputValue(), 'Request a quote');
    assert.match(await page.locator('.inquiry-context').innerText(), /LSF 502 MCD/);

    let submitted = 0;
    await page.route('**/api/inquiries', route => { submitted++; return route.abort(); });
    await page.evaluate(() => {
      window.__homepageTestOpens = [];
      window.open = url => { window.__homepageTestOpens.push(url); return null; };
    });
    await page.locator('[data-open-whatsapp]').click();
    assert.equal(await page.locator('#inq-name').evaluate(element => element.validity.valueMissing), true, 'required name blocks handoff');
    await page.locator('#inq-name').fill('Homepage regression fixture');
    await page.locator('#inq-message').fill('Synthetic fixture; do not send.');
    await page.locator('[data-open-whatsapp]').click();
    assert.match(await page.locator('.form-status').innerText(), /provide an email address or telephone number/);
    await page.locator('#inq-email').fill('invalid-email');
    await page.locator('[data-open-whatsapp]').click();
    assert.equal(await page.locator('#inq-email').evaluate(element => element.validity.typeMismatch), true, 'invalid email blocks handoff');
    assert.deepEqual(await page.evaluate(() => window.__homepageTestOpens), [], 'invalid forms never open external apps');
    assert.equal(submitted, 0, 'invalid handoffs never post enquiries');

    const noJs = await browser.newPage({ javaScriptEnabled: false });
    await noJs.goto(base + '/');
    assert.equal(await noJs.locator('#main h1').count(), 1, 'homepage remains useful before enhancement');
    assert.equal(await noJs.locator('.home-equipment-list a').count(), 5);
    assert.equal(await noJs.locator('.home-machine-search').getAttribute('action'), '/search/');
    assert.equal(await noJs.locator('link[rel="canonical"]').getAttribute('href'), 'https://lsmachinery.com.my/');
    await noJs.close();
    assert.deepEqual(errors, [], 'no uncaught browser errors');
    assert.deepEqual(failedResources, [], 'no broken local image, style or script requests');
    console.log('PASS: homepage discovery, genuine imagery, reduced motion, keyboard menus and route focus at 375/768/1440px; public discovery/service destinations, native model search, contextual quote links, invalid-form guards and useful no-JavaScript HTML. No enquiry or external handoff sent.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
