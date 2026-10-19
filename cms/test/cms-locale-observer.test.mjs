import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../public/cms.js', import.meta.url), 'utf8');

test('locale pass never rewrites the media heading unless its text changes', () => {
  assert.match(source, /if\(heading\.textContent!==label\)heading\.textContent=label/);
  assert.doesNotMatch(source, /\$\('#media-details-heading'\)\.textContent=uiCopyFor\('Edit media details'\)/);
});

test('locale observer pauses itself while translating so its own edits cannot retrigger it', () => {
  const observer = source.match(/const localeObserver=new MutationObserver\(\(\)=>\{([^]*?)\}\);localeObserver\.observe/);
  assert.ok(observer, 'locale observer callback should be present');
  const body = observer[1];
  assert.ok(body.indexOf('disconnect()') < body.indexOf('applyCmsLocale()'));
  assert.ok(body.indexOf('applyCmsLocale()') < body.indexOf('takeRecords()'));
  assert.ok(body.indexOf('takeRecords()') < body.indexOf('.observe('));
});
