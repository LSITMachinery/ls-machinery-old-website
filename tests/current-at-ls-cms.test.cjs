const assert = require('node:assert/strict');
const {checkPublicPage} = require('./public-cms-boundary-support.cjs');

checkPublicPage('home', async page => {
  const title = await page.locator('.current-editorial-title').innerText();
  const body = await page.locator('.current-editorial-panel .body-copy').first().innerText();
  assert.doesNotMatch(title,/Private browser override fixture/,'browser storage cannot replace published Current at LS content');
  assert.doesNotMatch(body,/Private browser override fixture/,'browser storage cannot replace published Current at LS text');
  const order = await page.locator('.home-page > section').evaluateAll(sections => sections.map(section => section.id || section.classList[0]));
  assert.deepEqual(order.slice(0,4),['reference-hero','section-wrap','food','current'],'the homepage keeps the annotated food and Current at LS order');
  console.log('PASS: Current at LS uses published content and the requested homepage section order.');
},true).catch(error => { console.error(error); process.exit(1); });
