const assert = require('node:assert/strict');
const {checkPublicPage} = require('./public-cms-boundary-support.cjs');

checkPublicPage('machine/mini-cookie-depositor-mcd', async page => {
  assert.ok((await page.locator('.machine-page-hero h1').innerText()).trim(),'the machine identity remains visible');
  assert.ok(await page.locator('.machine-specs > div').count(),'the machine technical specifications remain in the public template');
  assert.equal(await page.locator('.pp-journey-picker').count(),0,'the production-stage selector is limited to Services');
  console.log('PASS: machine details stay public, while staff editing and technical publishing controls stay private.');
}).catch(error => { console.error(error); process.exit(1); });
