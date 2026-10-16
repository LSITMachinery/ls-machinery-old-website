import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicRelease } from '../src/publication.mjs';

const page = {
  id: 'page-1', type: 'machine', slug: 'mini-cookie-depositor', route: '/machine/mini-cookie-depositor/',
  revisionId: 'revision-1', revisionNumber: 3, publishedAt: '2026-10-16T00:00:00.000Z',
  fields: {
    translations: {
      en: { title: 'Mini Cookie Depositor', description: 'Deposits cookie dough.' },
      zh: { title: '迷你曲奇挤出机', description: '挤出曲奇面团。' },
      ms: { title: 'Pendeposit Biskut Mini', description: 'Mendeposit doh biskut.' }
    },
    data: { modelCode: 'LSF 502 MCD' }, mediaIds: []
  }
};

test('publication build creates complete localized routes, metadata and search indexes', () => {
  const release = buildPublicRelease([page]);
  assert.equal(release.manifest.pageCount, 1);
  assert.equal(release.manifest.localePageCounts.zh, 1);
  assert.equal(release.localizedPages.zh[0].route, '/zh/machine/mini-cookie-depositor/');
  assert.equal(release.localizedPages.ms[0].title, 'Pendeposit Biskut Mini');
  assert.equal(release.localizedPages.en[0].alternates.ms, '/ms/machine/mini-cookie-depositor/');
  assert.match(release.searchIndex.en[0].text, /LSF 502 MCD/);
  assert.match(release.searchIndex.zh[0].text, /迷你曲奇挤出机/);
});

test('publication build fails before activation when a page is incomplete or routes conflict', () => {
  assert.throws(() => buildPublicRelease([{ ...page, fields: { ...page.fields, translations: { en: {}, zh: {} } } }]), /missing its ms translation/);
  assert.throws(() => buildPublicRelease([page, { ...page, revisionId: 'revision-2' }]), /Duplicate public route/);
});
