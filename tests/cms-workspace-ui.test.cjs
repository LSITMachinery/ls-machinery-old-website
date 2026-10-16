const assert = require('node:assert/strict');
const {test} = require('node:test');

const base = new URL(process.env.LS_PREVIEW_URL || 'http://127.0.0.1:8011/');

test('the private CMS route provides a no-index staff sign-in and three interface languages', async context => {
  const response = await fetch(new URL('cms/',base));
  if (response.status === 503) return context.skip('CMS workspace cannot be served until its database service is available.');
  assert.equal(response.status,200);
  const html = await response.text();
  assert.match(html,/<title>LS CMS · Staff workspace<\/title>/);
  assert.match(html,/name="robots" content="noindex,nofollow"/);
  assert.match(html,/id="login-form"/);
  assert.match(html,/name="email" type="email"/);
  assert.match(html,/name="password" type="password"/);
  assert.match(html,/id="ui-language"[\s\S]*value="en"[\s\S]*value="zh"[\s\S]*value="ms"/);
  assert.doesNotMatch(html,/cms-trigger/);

  const scriptResponse = await fetch(new URL('cms/cms.js',base));
  assert.equal(scriptResponse.status,200);
  const script = await scriptResponse.text();
  for (const label of ['员工工作区','Ruang kerja kakitangan','工作邮箱','E-mel kerja']) assert.ok(script.includes(label),`CMS translation should include ${label}`);

  const setupResponse = await fetch(new URL('api/cms/setup-status',base));
  if (setupResponse.status === 503) return context.skip('CMS setup status requires the unavailable database runtime.');
  assert.equal(setupResponse.status,200);
  assert.equal(typeof (await setupResponse.json()).firstAdminRequired,'boolean');
});
