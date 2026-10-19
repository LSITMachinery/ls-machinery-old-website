const LOCALES = Object.freeze(['en', 'zh', 'ms']);
const LOCALE_PREFIX = Object.freeze({ en: '', zh: '/zh', ms: '/ms' });

function collectText(value, output = []) {
  if (typeof value === 'string') {
    const text = value.trim();
    if (text) output.push(text);
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    output.push(String(value));
  } else if (Array.isArray(value)) {
    for (const entry of value) collectText(entry, output);
  } else if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) collectText(entry, output);
  }
  return output;
}

function firstText(record, keys) {
  for (const key of keys) {
    const value = record?.[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function localizedRoute(route, locale) {
  return `${LOCALE_PREFIX[locale]}${route}`;
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const PUBLIC_VIDEO_STATUSES = new Set(['included', 'historical']);

function buildVideoCatalog(pages) {
  const records = new Map();
  for (const page of pages.filter(item => item.type === 'video_library')) {
    const videos = page.fields.data?.videos || [];
    if (!Array.isArray(videos)) throw new Error(`Video library ${page.route} must have a video list.`);
    for (const video of videos) {
      if (!video || typeof video !== 'object' || !YOUTUBE_ID.test(video.youtubeId || '')) throw new Error(`Video library ${page.route} contains an invalid YouTube video ID.`);
      if (records.has(video.youtubeId)) throw new Error(`Duplicate YouTube video ID in the published release: ${video.youtubeId}`);
      records.set(video.youtubeId, video);
    }
  }

  const publicRecords = new Map();
  for (const video of records.values()) {
    if (video.duplicateOfYoutubeId && !records.has(video.duplicateOfYoutubeId)) {
      throw new Error(`Video ${video.youtubeId} points to a duplicate target that is missing from the library.`);
    }
    if (!PUBLIC_VIDEO_STATUSES.has(video.publicationStatus)) continue;
    if (video.category === 'unclassified') throw new Error(`Video ${video.youtubeId} must be classified before publication.`);
    if (video.publicationStatus === 'included' && video.duplicateOfYoutubeId) throw new Error(`Video ${video.youtubeId} cannot be included while linked as a duplicate alternative.`);
    if (video.evidenceStatus !== 'verified' || video.reviewStatus !== 'approved' || video.availability !== 'available' || !['verified', 'external_only'].includes(video.embedStatus)) {
      throw new Error(`Video ${video.youtubeId} is marked for publication without verified evidence, review and playback availability.`);
    }
    if (typeof video.sourceUrl !== 'string' || !video.sourceUrl || typeof video.sourceTitle !== 'string' || !video.sourceTitle) throw new Error(`Video ${video.youtubeId} is missing its source title or URL.`);
    for (const locale of LOCALES) {
      const translation = video.translations?.[locale];
      if (!translation || typeof translation.title !== 'string' || !translation.title.trim() || typeof translation.summary !== 'string' || !translation.summary.trim()) {
        throw new Error(`Video ${video.youtubeId} needs a title and summary in ${locale}.`);
      }
    }
    publicRecords.set(video.youtubeId, {
      youtubeId: video.youtubeId,
      sourceUrl: video.sourceUrl,
      sourceTitle: video.sourceTitle,
      channelIdentity: video.channelIdentity,
      durationSeconds: Number(video.durationSeconds) || 0,
      uploadDate: video.uploadDate || '',
      format: video.format,
      category: video.category,
      publicationStatus: video.publicationStatus,
      captionStatus: video.captionStatus,
      embedStatus: video.embedStatus,
      machineNames: [...new Set((video.machineNames || []).map(value => value.trim()))],
      foodApplications: [...new Set((video.foodApplications || []).map(value => value.trim()))],
      translations: video.translations
    });
  }
  return { records, publicRecords };
}

function publicData(page, publicVideos) {
  const data = page.fields.data || {};
  const result = Object.fromEntries(Object.entries(data).filter(([key]) => !['videos', 'videoPlacements'].includes(key)));
  if (page.type === 'video_library') result.videos = [...publicVideos.values()].sort((a, b) => a.uploadDate.localeCompare(b.uploadDate) || a.youtubeId.localeCompare(b.youtubeId));
  if (Array.isArray(data.videoPlacements)) {
    result.videoPlacements = data.videoPlacements
      .filter(placement => placement.placementStatus === 'approved')
      .map(placement => {
        const video = publicVideos.get(placement.youtubeId);
        if (!video) throw new Error(`Approved placement ${placement.youtubeId} on ${page.route} has no published video record.`);
        if (page.type === 'machine' && placement.matchStatus !== 'exact') throw new Error(`Machine page ${page.route} requires an exact verified video match.`);
        return {
          youtubeId: placement.youtubeId,
          purpose: placement.purpose,
          sortOrder: Number(placement.sortOrder),
          matchStatus: placement.matchStatus,
          translations: placement.translations,
          video
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder || a.youtubeId.localeCompare(b.youtubeId));
  }
  return result;
}

function localizedData(data, locale) {
  const result = { ...data };
  if (Array.isArray(data.videos)) {
    result.videos = data.videos.map(video => ({
      ...video,
      ...video.translations[locale],
      translations: undefined
    }));
  }
  if (Array.isArray(data.videoPlacements)) {
    result.videoPlacements = data.videoPlacements.map(placement => ({
      ...placement,
      summary: placement.translations[locale].summary,
      video: {
        ...placement.video,
        ...placement.video.translations[locale],
        translations: undefined
      }
    }));
  }
  return result;
}

function publicPage(page) {
  if (!page || typeof page !== 'object' || typeof page.route !== 'string' || !page.route.startsWith('/')) {
    throw new Error('Every published page must have an absolute route.');
  }
  if (!page.fields?.translations || typeof page.fields.translations !== 'object') {
    throw new Error(`Page ${page.route} is missing translated content.`);
  }
  for (const locale of LOCALES) {
    if (!page.fields.translations[locale] || typeof page.fields.translations[locale] !== 'object') {
      throw new Error(`Page ${page.route} is missing its ${locale} translation.`);
    }
  }
  return {
    id: page.id,
    type: page.type,
    slug: page.slug,
    route: page.route,
    revisionId: page.revisionId,
    revisionNumber: page.revisionNumber,
    fields: page.fields,
    publishedAt: page.publishedAt
  };
}

export function buildPublicRelease(inputPages) {
  if (!Array.isArray(inputPages)) throw new Error('The public page source must be a list.');
  const pages = inputPages.map(publicPage).sort((a, b) => a.route.localeCompare(b.route));
  const routes = new Set();
  for (const page of pages) {
    if (routes.has(page.route)) throw new Error(`Duplicate public route: ${page.route}`);
    routes.add(page.route);
  }

  const { publicRecords: publicVideos } = buildVideoCatalog(pages);
  if (publicVideos.size && !pages.some(page => page.type === 'video_library' && page.route === '/videos/')) {
    throw new Error('Published videos require a video-library page at /videos/.');
  }
  const publicPages = pages.map(page => ({
    ...page,
    fields: {
      translations: page.fields.translations,
      data: publicData(page, publicVideos),
      mediaIds: page.fields.mediaIds || []
    }
  }));

  const localizedPages = Object.fromEntries(LOCALES.map((locale) => [locale, publicPages.map((page) => ({
    locale,
    route: localizedRoute(page.route, locale),
    sourceRoute: page.route,
    alternates: Object.fromEntries(LOCALES.map((alternate) => [alternate, localizedRoute(page.route, alternate)])),
    type: page.type,
    slug: page.slug,
    revisionId: page.revisionId,
    revisionNumber: page.revisionNumber,
    title: firstText(page.fields.translations[locale], ['title', 'headline', 'name', 'roleTitle']),
    description: firstText(page.fields.translations[locale], ['metaDescription', 'description', 'excerpt', 'summary']),
    translation: page.fields.translations[locale],
    data: localizedData(page.fields.data || {}, locale),
    mediaIds: page.fields.mediaIds || []
  }))]));

  const searchIndex = Object.fromEntries(LOCALES.map((locale) => [locale, [
    ...publicPages.map((page) => {
      const translation = page.fields.translations[locale];
      return {
        type: page.type,
        title: firstText(translation, ['title', 'headline', 'name', 'roleTitle', 'question']),
        summary: firstText(translation, ['description', 'summary', 'excerpt', 'intro', 'process']),
        route: localizedRoute(page.route, locale),
        sourceRoute: page.route,
        revisionId: page.revisionId,
        text: [...new Set(collectText({ translation, data: localizedData(page.fields.data || {}, locale) }).join(' ').split(/\s+/).filter(Boolean))].join(' ')
      };
    }),
    ...[...publicVideos.values()].map(video => {
      const translated = video.translations[locale];
      const terms = [...new Set([
        ...(translated.searchTerms || []),
        ...video.machineNames,
        ...video.foodApplications
      ].map(term => term.trim()).filter(Boolean))];
      return {
        type: 'video',
        title: translated.title,
        summary: translated.summary,
        terms,
        route: `${localizedRoute('/videos/', locale)}?v=${encodeURIComponent(video.youtubeId)}`,
        sourceRoute: '/videos/',
        revisionId: pages.find(page => page.type === 'video_library')?.revisionId || null,
        text: [...new Set([translated.title, translated.summary, ...terms].join(' ').split(/\s+/).filter(Boolean))].join(' ')
      };
    })
  ]]));

  return {
    pages: publicPages,
    localizedPages,
    searchIndex,
    manifest: {
      pageCount: pages.length,
      videoCount: publicVideos.size,
      localePageCounts: Object.fromEntries(LOCALES.map((locale) => [locale, localizedPages[locale].length])),
      searchEntryCounts: Object.fromEntries(LOCALES.map((locale) => [locale, searchIndex[locale].length])),
      routes: pages.map((page) => page.route),
      revisionIds: pages.map((page) => page.revisionId)
    }
  };
}
