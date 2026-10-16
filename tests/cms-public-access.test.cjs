const assert = require('node:assert/strict');
const {test} = require('node:test');

const base = new URL(process.env.LS_PREVIEW_URL || 'http://127.0.0.1:8011/');

test('unauthenticated CMS requests cannot read drafts or staff accounts', async context => {
  const privateContent = await fetch(new URL('api/cms/content',base));
  if (privateContent.status === 503) return context.skip('CMS runtime is unavailable because its database service is offline.');
  assert.equal(privateContent.status,401,'private drafts require a signed-in staff member');

  const publicContent = await fetch(new URL('api/content/published?route=%2Fcms-access-check%2F',base));
  assert.equal(publicContent.status,200);
  assert.equal((await publicContent.json()).content,null,'an unpublished CMS draft must remain private');

  const staff = await fetch(new URL('api/cms/staff',base));
  assert.equal(staff.status,401,'staff accounts and role information are private');
});
