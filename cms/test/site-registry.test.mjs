import assert from 'node:assert/strict';
import test from 'node:test';
import { assertGeneratedPageCoverage, createSiteRegistry, siteRegistry, templateForRoute } from '../src/site-registry.mjs';

test('registry covers all generated canonical routes in three locales', () => {
  assert.equal(siteRegistry.routeCount, 98);
  assert.deepEqual(siteRegistry.locales, ['en', 'zh', 'ms']);
  assert.equal(siteRegistry.pageCount, 294);
  assert.deepEqual(assertGeneratedPageCoverage(siteRegistry), {
    routeCount: 98,
    pageCount: 294,
    locales: ['en', 'zh', 'ms']
  });
});

test('records provide stable localized paths, template classes and snapshot files', () => {
  const home = siteRegistry.get('home');
  const machine = siteRegistry.get('machine/mini-cookie-depositor-mcd');
  assert.equal(home.template, 'homepage');
  assert.deepEqual(home.paths, { en: '/', zh: '/zh/', ms: '/ms/' });
  assert.equal(machine.template, 'machine-detail');
  assert.equal(machine.paths.en, '/machine/mini-cookie-depositor-mcd/');
  assert.equal(machine.paths.zh, '/zh/machine/mini-cookie-depositor-mcd/');
  assert.equal(machine.generatedFiles.ms, 'public-pages/ms/machine/mini-cookie-depositor-mcd/index.html');
  assert.deepEqual(siteRegistry.resolvePath('/zh/machine/mini-cookie-depositor-mcd/?from=search'), {
    entry: machine,
    locale: 'zh',
    path: '/zh/machine/mini-cookie-depositor-mcd/'
  });
  assert.equal(siteRegistry.resolvePath('/not-a-site-route/'), null);
  assert.equal(siteRegistry.fileFor('home', 'en').endsWith('public-pages\\home\\index.html'), true);
});

test('template classification follows existing route families only', () => {
  assert.equal(templateForRoute('machines/bakery'), 'machine-category');
  assert.equal(templateForRoute('food/cakes'), 'food-detail');
  assert.equal(templateForRoute('solutions'), 'solutions-index');
  assert.equal(templateForRoute('services'), 'services-overview');
  assert.equal(siteRegistry.get('machine/not-in-manifest'), null);
  assert.throws(() => templateForRoute('unregistered/content'), /No site template/);
  assert.throws(() => createSiteRegistry({ routeKeys: ['home', 'machine/nope', 'machine/nope'] }), /Duplicate/);
});
