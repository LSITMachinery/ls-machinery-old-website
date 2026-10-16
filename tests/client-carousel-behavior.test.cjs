const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const base = process.env.LS_PREVIEW_URL || 'http://127.0.0.1:8000/';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:2215,height:1252}});
  await page.goto(new URL('home/', base).href, {waitUntil:'domcontentloaded'});
  const strip = page.locator('.client-marquee');
  await strip.waitFor({state:'visible'});

  for (const width of [390,768,1440,2215]) {
    await page.setViewportSize({width,height:900});
    await page.waitForTimeout(40);
    assert.equal(await page.locator('.client-marquee.is-static').count(),1,'the small verified-logo set stays static');
    assert.equal(await page.locator('.client-strip-logo').count(),2,'only the two available logo records are shown');
    assert.equal(await page.locator('[data-client-carousel], .client-strip-clone, .client-marquee button').count(),0,'there is no automatic carousel or local control');
    const box = await strip.boundingBox();
    assert.ok(box && box.width >= width - 20,`the client row spans the viewport at ${width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),true,`no horizontal overflow at ${width}px`);
  }

  const track = page.locator('[data-client-track]');
  const initialStyle = await track.getAttribute('style');
  await page.waitForTimeout(300);
  assert.equal(await track.getAttribute('style'),initialStyle,'static client marks do not move automatically');
  await browser.close();
  console.log('PASS: the client row stays static with the current two verified logos and fits desktop and mobile widths.');
})().catch(error => { console.error(error); process.exit(1); });
