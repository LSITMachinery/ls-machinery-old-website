import test from 'node:test';
import assert from 'node:assert/strict';
import { requiresTechnicalReview, validateContent } from '../src/schema.mjs';
import { buildPublicRelease } from '../src/publication.mjs';

const translations = {
  en: { title: 'Cookie depositor demonstration', summary: 'Shows the depositor forming piped cookies.', searchTerms: ['cookie machine'] },
  zh: { title: '曲奇挤出机演示', summary: '展示挤出机制作裱花曲奇。', searchTerms: ['曲奇设备'] },
  ms: { title: 'Demonstrasi pendeposit biskut', summary: 'Menunjukkan mesin membentuk biskut picit.', searchTerms: ['mesin biskut'] }
};

const video = {
  youtubeId: 'abcdefghijk', sourceTitle: 'Cookie depositor', sourceUrl: 'https://www.youtube.com/watch?v=abcdefghijk',
  channelIdentity: 'https://www.youtube.com/@lssmartmachinery', sourceDescription: 'Internal source copy.',
  durationSeconds: 72, uploadDate: '2025-05-20', format: 'video', category: 'machine',
  machineNames: ['LSF 502 MCD', 'LSF 502 MCD'], foodApplications: ['Piped cookies'],
  captionStatus: 'available', captionText: 'Internal transcript excerpt.', availability: 'available', embedStatus: 'verified',
  evidenceStatus: 'verified', reviewStatus: 'approved', publicationStatus: 'included', duplicateOfYoutubeId: '',
  evidence: [{ timestamp: '00:12', observation: 'Depositor head places dough on a tray.', source: 'Channel video' }], translations
};

const placement = {
  youtubeId: video.youtubeId, purpose: 'Machine demonstration', sortOrder: 0, matchStatus: 'exact',
  evidenceStatus: 'verified', reviewStatus: 'approved', placementStatus: 'approved',
  evidence: [{ timestamp: '00:12', observation: 'The named model appears in the demonstration.' }],
  translations: {
    en: { summary: 'Watch the depositor place cookie dough.' },
    zh: { summary: '观看挤出机挤出曲奇面团。' },
    ms: { summary: 'Lihat mesin meletakkan doh biskut.' }
  }
};

function page(type, route, data = {}) {
  return {
    id: route, type, slug: route.split('/').filter(Boolean).at(-1) || 'home', route,
    revisionId: `revision-${route}`, revisionNumber: 1, publishedAt: '2026-10-18T00:00:00Z',
    fields: {
      translations: { en: { title: 'Page' }, zh: { title: '页面' }, ms: { title: 'Halaman' } },
      data, mediaIds: []
    }
  };
}

test('video library and page placements require exact source evidence and preserve each record language', () => {
  const library = page('video_library', '/videos/', { videos: [video] });
  const machine = page('machine', '/machine/cookie-depositor/', { modelCode: 'LSF 502 MCD', videoPlacements: [placement] });
  const release = buildPublicRelease([library, machine]);
  const publicVideo = release.pages.find(record => record.type === 'video_library').fields.data.videos[0];
  const publicPlacement = release.pages.find(record => record.type === 'machine').fields.data.videoPlacements[0];
  assert.equal(release.manifest.videoCount, 1);
  assert.equal(publicVideo.youtubeId, video.youtubeId);
  assert.equal(publicVideo.translations.zh.summary, translations.zh.summary);
  assert.deepEqual(publicVideo.machineNames, ['LSF 502 MCD']);
  assert.deepEqual(publicVideo.foodApplications, ['Piped cookies']);
  assert.equal('evidence' in publicVideo, false);
  assert.equal('captionText' in publicVideo, false);
  assert.equal('sourceDescription' in publicVideo, false);
  assert.equal(publicPlacement.video.sourceUrl, video.sourceUrl);
  assert.equal(publicPlacement.translations.ms.summary, placement.translations.ms.summary);
  assert.match(release.searchIndex.zh.find(item => item.type === 'video_library').text, /曲奇挤出机演示/);
  const localizedVideoResult = release.searchIndex.zh.find(item => item.type === 'video');
  assert.equal(localizedVideoResult.route, '/zh/videos/?v=abcdefghijk');
  assert.equal(localizedVideoResult.title, translations.zh.title);
  assert.equal(localizedVideoResult.summary, translations.zh.summary);
  assert.ok(localizedVideoResult.terms.includes('曲奇设备'));
  assert.match(localizedVideoResult.text, /LSF 502 MCD/);
});

test('uncertain videos and pending placements stay out of the public release', () => {
  const uncertain = { ...video, evidenceStatus: 'unclear', reviewStatus: 'awaiting_review', publicationStatus: 'awaiting_clarification' };
  const pendingPlacement = { ...placement, placementStatus: 'pending' };
  const release = buildPublicRelease([
    page('video_library', '/videos/', { videos: [uncertain] }),
    page('machine', '/machine/cookie-depositor/', { modelCode: 'LSF 502 MCD', videoPlacements: [pendingPlacement] })
  ]);
  assert.deepEqual(release.pages.find(record => record.type === 'video_library').fields.data.videos, []);
  assert.deepEqual(release.pages.find(record => record.type === 'machine').fields.data.videoPlacements, []);
  assert.equal(release.manifest.videoCount, 0);
});

test('video records and machine placements reject unsupported or mismatched source details', () => {
  const videoFields = { translations: { en: {}, zh: {}, ms: {} }, data: { videos: [video] }, mediaIds: [] };
  assert.equal(validateContent('video_library', videoFields).error, undefined);
  assert.match(validateContent('video_library', { ...videoFields, data: { videos: [{ ...video, machineNames: 'LSF 502 MCD' }] } }).error, /machineNames must be a list/);
  assert.match(validateContent('video_library', { ...videoFields, data: { videos: [{ ...video, category: 'unclassified' }] } }).error, /must be classified before publication/);
  assert.match(validateContent('video_library', { ...videoFields, data: { videos: [{ ...video, sourceUrl: 'https://youtu.be/zyxwvutsrqp' }] } }).error, /sourceUrl must point/);
  const fields = { translations: { en: {}, zh: {}, ms: {} }, data: { modelCode: 'LSF 502 MCD', videoPlacements: [{ ...placement, matchStatus: 'category' }] }, mediaIds: [] };
  assert.match(validateContent('machine', fields).error, /exact verified model match/);
  assert.equal(requiresTechnicalReview('video_library', { data: {} }), true);
  assert.equal(requiresTechnicalReview('food', { data: { videoPlacements: [placement] } }), true);
  assert.equal(requiresTechnicalReview('food', { data: { videoPlacements: [] } }), false);
});

test('an approved placement cannot publish if its shared video record is absent or unapproved', () => {
  const machine = page('machine', '/machine/cookie-depositor/', { modelCode: 'LSF 502 MCD', videoPlacements: [placement] });
  assert.throws(() => buildPublicRelease([machine]), /no published video record/);
  assert.throws(() => buildPublicRelease([page('video_library', '/archive/', { videos: [video] })]), /video-library page at \/videos\//);
  const pendingVideo = { ...video, reviewStatus: 'awaiting_review', publicationStatus: 'included' };
  assert.throws(() => buildPublicRelease([
    page('video_library', '/videos/', { videos: [pendingVideo] }), machine
  ]), /without verified evidence, review and playback availability/);
});
