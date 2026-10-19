/* Build a traceable, non-public register from observed LS channel listings. */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'audit-assets', 'video-channel');
const parsePsv = name => {
  const lines = fs.readFileSync(path.join(source, name), 'utf8').trim().split(/\r?\n/);
  const headers = lines.shift().split('|');
  return lines.map((line, rowIndex) => {
    const values = line.split('|');
    if (values.length !== headers.length) throw new Error(`${name}:${rowIndex + 2} has ${values.length} columns; expected ${headers.length}.`);
    return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  });
};
const listing = parsePsv('channel-listing.psv');
const watch = parsePsv('watch-page-metadata-96.psv');
const repeats = parsePsv('repeated-title-groups.psv');
const descriptions = JSON.parse(fs.readFileSync(path.join(source, 'watch-page-descriptions.json'), 'utf8'));
const expandedWatch = JSON.parse(fs.readFileSync(path.join(source, 'watch-page-metadata-all.json'), 'utf8'));
const expandedDescriptions = expandedWatch.descriptions || {};
const watchById = new Map(watch.map(row => [row.video_id, row]));
const repeatById = new Map(repeats.map(row => [row.video_id, row]));
const expandedWatchById = new Map((expandedWatch.records || []).map(row => [row.youtubeId, row]));
const sampledVisualReviews = {
  G5: {
  status: 'partial_visual_sampling',
  note: 'Openings differ. Both uploads show setup work around 00:12 from different views, the same training scene and caption around 00:40, and the LS outro near 01:10. Full sequences and audio were not compared.',
  screenshots: [
    'duplicate-multipurpose-JKolefbjkLM-00s.png',
    'duplicate-multipurpose-8uc_nD3ptJs-00s.png',
    'duplicate-multipurpose-JKolefbjkLM-12s.png',
    'duplicate-multipurpose-8uc_nD3ptJs-12s.png',
    'duplicate-multipurpose-JKolefbjkLM-40s.png',
    'duplicate-multipurpose-8uc_nD3ptJs-40s.png',
    'duplicate-multipurpose-JKolefbjkLM-70s.png',
    'duplicate-multipurpose-8uc_nD3ptJs-70s.png'
  ]
  },
  G6: {
    status: 'partial_visual_sampling',
    note: 'Samples near 00:00, 00:10, 00:25 and 00:40 show matching imagery in both uploads. The sampled ending frame shows different small-logo placement. Full sequences and audio were not compared; this is not a confirmed duplicate decision.',
    screenshots: [
      'screenshots/duplicate-pancake-4L6Mix-t-a4-00s.png',
      'screenshots/duplicate-pancake-abwPqZSE8-k-00s.png',
      'screenshots/duplicate-pancake-4L6Mix-t-a4-10s.png',
      'screenshots/duplicate-pancake-abwPqZSE8-k-10s.png',
      'screenshots/duplicate-pancake-4L6Mix-t-a4-25s.png',
      'screenshots/duplicate-pancake-abwPqZSE8-k-25s.png',
      'screenshots/duplicate-pancake-4L6Mix-t-a4-40s.png',
      'screenshots/duplicate-pancake-abwPqZSE8-k-40s.png'
    ]
  }
};

function seconds(value) {
  const match = String(value || '').match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  return match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : null;
}
function listingSeconds(value) {
  const parts = String(value || '').split(':').map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] * 60 + parts[1];
  if (parts.length === 3 && parts.every(Number.isFinite)) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}
function dateOnly(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || '';
}
function titleWithoutChannel(title) {
  return title.replace(/\s*[／/|·-]+\s*LS\s*SMART\s*MACHINERY(?:\s*\(M\)\s*SDN\s*BHD)?\s*$/i, '').trim();
}
function categoryCandidate(title) {
  const text = title.toLocaleLowerCase();
  if (/company|corporate|history|factory tour|our story|about ls|anniversary/.test(text)) return 'company';
  if (/exhibition|expo|news|event|promotion|opening|visit us/.test(text)) return 'updates';
  if (/cleaning|maintenance|repair|service|operation|how to|setup|set up|installation|training/.test(text)) return 'operation';
  if (/production line|packaging line|automatic line|line introduction|line solution/.test(text)) return 'production-line';
  if (/cookie|biscuit|cake|bread|bun|pastry|croissant|pancake|roti|kuih|kueh|noodle|dumpling|dim sum|food|dough|fish ball|spring roll|pizza|tart|mooncake|bao/.test(text)) return 'food';
  if (/machine|depositor|mixer|oven|cutter|moulder|molder|sheeter|divider|rounder|proofer|fryer|cooker|freezer|steamer|filler|packaging|encrusting|forming|segment|slicer|weigher/.test(text)) return 'machine';
  return 'unclassified';
}

const videos = listing.map(row => {
  const page = watchById.get(row.video_id);
  const metadata = expandedWatchById.get(row.video_id);
  const description = metadata?.descriptionKey
    ? expandedDescriptions[metadata.descriptionKey] || ''
    : page?.description_key ? descriptions[page.description_key] || '' : '';
  const repeated = repeatById.get(row.video_id);
  const visualSampleReview = repeated ? sampledVisualReviews[repeated.group_id] || null : null;
  return {
    youtubeId: row.video_id,
    sourceTitle: row.title,
    normalizedTitle: titleWithoutChannel(row.title),
    sourceUrl: row.url,
    channelIdentity: 'LS Smart Machinery (M) Sdn. Bhd. — @lssmartmachinery',
    format: row.format,
    listingDuration: row.listing_duration || '',
    sourceTitleObserved: metadata?.sourceTitle || '',
    channelNameObserved: metadata?.channelName || '',
    channelIdObserved: metadata?.channelId || '',
    durationSeconds: metadata?.durationSeconds ?? (page ? seconds(page.duration_iso) : null),
    uploadDate: dateOnly(metadata?.uploadTimestamp || page?.upload_date_iso || ''),
    uploadTimestampObserved: metadata?.uploadTimestamp || page?.upload_date_iso || '',
    viewCountObserved: metadata?.viewCountObserved || '',
    youtubeCategory: metadata?.youtubeCategory || '',
    watchPageHttpStatus: metadata?.httpStatus ?? null,
    playabilityStatus: metadata?.playabilityStatus || '',
    metadataStatus: metadata?.metadataStatus || 'not_captured',
    sourceDescription: description,
    descriptionStatus: metadata?.descriptionKey ? 'full_watch_page_description_captured' : page?.description_status || 'missing_or_not_captured',
    captionTrackCodes: metadata?.captionTrackCodes || [],
    captionStatus: metadata?.captionTrackCodes?.length ? 'track_metadata_reported_transcript_not_reviewed' : metadata ? 'no_tracks_reported_transcript_not_reviewed' : page?.caption_status || 'not_checked',
    captionControlObserved: page?.caption_control || '',
    watchPageStatus: metadata ? 'watch_page_metadata_captured' : page?.watch_page_status || 'not_captured',
    embedStatus: row.video_id === 'JKolefbjkLM' ? 'local_player_emitted_playing_state' : 'not_tested',
    availability: metadata?.playabilityStatus === 'OK' ? 'watch_page_playable' : 'unknown',
    categoryCandidate: categoryCandidate(row.title),
    categoryEvidence: 'listing title only; footage not reviewed',
    repeatTitleGroup: repeated?.group_id || '',
    repeatedTitleFinding: repeated?.finding || '',
    visualSampleReview,
    auditStatus: 'awaiting_clarification',
    publicationStatus: 'awaiting_clarification',
    evidenceStatus: 'pending',
    reviewStatus: 'awaiting_review',
    placements: [],
    reviewNote: visualSampleReview
      ? 'Limited visual samples were compared. This does not confirm video identity, technical claims, narration, full-footage equivalence or publication placement.'
      : 'Watch-page metadata was captured, but the footage and narration were not reviewed.'
  };
});

const ids = new Set(videos.map(video => video.youtubeId));
if (ids.size !== videos.length) throw new Error(`Duplicate YouTube IDs found: ${videos.length - ids.size}.`);
if (videos.some(video => !/^[\w-]{11}$/.test(video.youtubeId))) throw new Error('A video ID is malformed.');
const watchIds = new Set((expandedWatch.records || []).map(video => video.youtubeId));
if (watchIds.size !== expandedWatch.records?.length) throw new Error('Duplicate YouTube IDs found in expanded watch-page metadata.');
const missingWatchIds = videos.filter(video => !watchIds.has(video.youtubeId)).map(video => video.youtubeId);
const extraWatchIds = [...watchIds].filter(id => !ids.has(id));
if (missingWatchIds.length || extraWatchIds.length) throw new Error(`Watch-page metadata does not match the listing. Missing: ${missingWatchIds.length}; extra: ${extraWatchIds.length}.`);
const channelMismatches = videos.filter(video => video.channelIdObserved && video.channelIdObserved !== expandedWatch.channelId).map(video => video.youtubeId);
if (channelMismatches.length) throw new Error(`Videos belong to a different channel ID: ${channelMismatches.join(', ')}.`);
for (const video of videos) {
  video.listingDurationSeconds = listingSeconds(video.listingDuration);
  video.listingDurationOffsetSeconds = video.listingDurationSeconds !== null && video.durationSeconds !== null
    ? video.listingDurationSeconds - video.durationSeconds
    : null;
}
const detailCount = videos.filter(video => video.uploadTimestampObserved).length;
const output = {
  generatedAt: new Date().toISOString(),
  channelUrl: 'https://www.youtube.com/@lssmartmachinery/videos',
  expectedHeaderCount: 255,
  accessibleListingCount: videos.length,
  unaccountedHeaderEntries: 255 - videos.length,
  listingCounts: {
    video: videos.filter(video => video.format === 'video').length,
    short: videos.filter(video => video.format === 'short').length
  },
  detailedWatchPageCount: videos.filter(video => video.metadataStatus === 'captured').length,
  notYetDetailedCount: videos.filter(video => video.metadataStatus !== 'captured').length,
  channelIdMismatchCount: channelMismatches.length,
  missingWatchPageDescriptionCount: videos.filter(video => !video.sourceDescription).length,
  listingDurationOffsetCounts: videos.reduce((counts, video) => {
    const key = video.listingDurationOffsetSeconds === null ? 'unknown' : String(video.listingDurationOffsetSeconds);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {}),
  captionTrackMetadataCount: videos.filter(video => video.captionTrackCodes.length > 0).length,
  captionTranscriptReviewCount: 0,
  repeatedTitleGroupCount: new Set(repeats.map(row => row.group_id)).size,
  confirmedDuplicateCount: 0,
  note: 'Watch-page metadata is captured for all 251 visible listings. Caption-track metadata is recorded separately from caption-control status; transcripts and narration were not reviewed. Limited samples from two repeated-title pairs were compared. Machine identity, food outputs, technical claims and page placements remain unreviewed. No duplicate has been confirmed.',
  videos
};
fs.writeFileSync(path.join(source, 'video-inventory.json'), `${JSON.stringify(output, null, 2)}\n`);

const cmsPayload = {
  route: '/videos/',
  type: 'video_library',
  translations: { en: { title: 'LS video library' }, zh: { title: 'LS 视频库' }, ms: { title: 'Pustaka video LS' } },
  data: {
    videos: videos.map(video => ({
      youtubeId: video.youtubeId,
      sourceUrl: video.sourceUrl,
      sourceTitle: video.sourceTitle,
      channelIdentity: video.channelIdentity,
      sourceDescription: video.sourceDescription,
      durationSeconds: video.durationSeconds ?? undefined,
      uploadDate: video.uploadDate,
      format: video.format,
      category: 'unclassified',
      captionStatus: 'not_checked',
      captionText: '',
      availability: 'unknown',
      embedStatus: 'not_tested',
      evidenceStatus: 'pending',
      reviewStatus: 'awaiting_review',
      publicationStatus: 'awaiting_clarification',
      duplicateOfYoutubeId: '',
      evidence: [],
      machineNames: [],
      foodApplications: [],
      translations: {
        en: { title: '', summary: '', searchTerms: [video.normalizedTitle] },
        zh: { title: '', summary: '', searchTerms: [] },
        ms: { title: '', summary: '', searchTerms: [] }
      },
      internalSourceDescriptionKey: video.descriptionStatus === 'full_watch_page_description_captured' ? expandedWatchById.get(video.youtubeId)?.descriptionKey || '' : watchById.get(video.youtubeId)?.description_key || '',
      internalAuditStatus: 'awaiting_clarification',
      internalRepeatTitleGroup: video.repeatTitleGroup
    }))
  }
};
fs.writeFileSync(path.join(source, 'cms-video-library-draft-import.json'), `${JSON.stringify(cmsPayload, null, 2)}\n`);
const placementReview = {
  generatedAt: new Date().toISOString(),
  sourceInventory: 'video-inventory.json',
  publicPlacementsApproved: 0,
  note: 'No page placement is proposed as verified until footage and narration support the target. Candidate categories are based on listing titles only.',
  videos: videos.map(video => ({
    youtubeId: video.youtubeId,
    sourceTitle: video.sourceTitle,
    format: video.format,
    sourceUrl: video.sourceUrl,
    titleBasedCategoryCandidate: video.categoryCandidate,
    categoryEvidence: video.categoryEvidence,
    proposedRoutes: [],
    placementStatus: 'awaiting_evidence_review',
    requiredEvidence: ['reviewed footage and narration', 'timestamped evidence for identity, process or food application', 'translated public title and summary'],
    repeatedTitleGroup: video.repeatTitleGroup || null,
    repeatedTitleFinding: video.repeatedTitleFinding || null
  }))
};
fs.writeFileSync(path.join(source, 'video-placement-review.json'), `${JSON.stringify(placementReview, null, 2)}\n`);
console.log(JSON.stringify({ records: videos.length, detailedWatchPages: detailCount, listingCounts: output.listingCounts, duplicateIds: videos.length - ids.size, suspectedRepeatedGroups: output.repeatedTitleGroupCount, unaccountedHeaderEntries: output.unaccountedHeaderEntries }, null, 2));
