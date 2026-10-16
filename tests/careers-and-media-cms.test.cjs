const assert = require('node:assert/strict');
const {checkPublicPage} = require('./public-cms-boundary-support.cjs');

checkPublicPage('company/careers', async page => {
  assert.equal(await page.locator('.career-role').count(),14,'the careers page keeps its current public roles');
  assert.ok(await page.locator('.reference-hero-image').count(),'the public careers image remains available');
  console.log('PASS: Careers content stays public while its editing controls remain in the private CMS.');
}).catch(error => { console.error(error); process.exit(1); });
