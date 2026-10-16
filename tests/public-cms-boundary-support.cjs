const assert = require('node:assert/strict');
const {chromium} = require('playwright');

const base = process.env.LS_PREVIEW_URL || 'http://127.0.0.1:8000/';

async function checkPublicPage(route, verifyPage = async () => {}, seedContentOverride = false) {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1365,height:900}});
    if (seedContentOverride) {
      await page.addInitScript(() => localStorage.setItem('ls-site-cms-published-v1', JSON.stringify({en:{currentTitle:'Private browser override fixture',currentText:'Private browser override fixture'}})));
    }
    await page.goto(new URL(`${route.replace(/^\/+|\/+$/g,'')}/`,base).href,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(expected => document.querySelector('#main')?.dataset.route === expected, route.replace(/^\/+|\/+$/g,''));
    assert.equal(await page.locator('.cms-trigger, .cms-modal, [data-cms-editor]').count(),0,'public pages do not expose inline CMS controls');
    assert.equal(await page.locator('a[href*="/cms"]').count(),0,'the staff CMS has no public navigation link');
    await verifyPage(page);
  } finally {
    await browser.close();
  }
}

module.exports = {checkPublicPage};
