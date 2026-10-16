import assert from 'node:assert/strict';
import test from 'node:test';
import { collectSiteBaseline } from '../src/baseline-import.mjs';
import { createSiteRegistry } from '../src/site-registry.mjs';

test('local site baseline covers each registered route in all three languages with source evidence', async () => {
  const registry = createSiteRegistry();
  const records = await collectSiteBaseline({ registry });
  assert.equal(registry.routeCount, 98);
  assert.equal(records.length, registry.routeCount);
  assert.equal(registry.pageCount, 294);
  const routes = new Set(records.map(record => record.route));
  assert.equal(routes.size, 98);
  assert.ok(records.every(record => ['en','zh','ms'].every(locale => record.fields.translations[locale])));
  assert.ok(records.every(record => record.sourceEvidence[0].assets && record.sourceEvidence.length === 4));
  assert.equal(records.filter(record => record.type === 'machine').some(record => 'data' in record.fields), false);
  const homepage = records.find(record => record.route === '/');
  assert.ok(homepage.fields.translations.en.h1);
  assert.match(homepage.sourceEvidence[1].sha256, /^[a-f0-9]{64}$/);
});
