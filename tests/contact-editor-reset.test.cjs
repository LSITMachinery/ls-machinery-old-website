const assert = require('node:assert/strict');
const {checkPublicPage} = require('./public-cms-boundary-support.cjs');

checkPublicPage('inquiry', async page => {
  assert.equal(await page.locator('#lead-form').count(),1,'the inquiry form remains available to visitors');
  assert.equal(await page.locator('.pp-journey-picker').count(),0,'the production-stage selector appears only on Services');
  assert.equal(await page.locator('#lead-form a[href="/privacy/"]').count(),1,'the inquiry form links to the privacy notice');
  console.log('PASS: the public inquiry form works without exposing staff editing controls or the Services-only journey selector.');
}).catch(error => { console.error(error); process.exit(1); });
