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

  const localizedPages = Object.fromEntries(LOCALES.map((locale) => [locale, pages.map((page) => ({
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
    data: page.fields.data || {},
    mediaIds: page.fields.mediaIds || []
  }))]));

  const searchIndex = Object.fromEntries(LOCALES.map((locale) => [locale, pages.map((page) => {
    const translation = page.fields.translations[locale];
    return {
      type: page.type,
      title: firstText(translation, ['title', 'headline', 'name', 'roleTitle', 'question']),
      summary: firstText(translation, ['description', 'summary', 'excerpt', 'intro', 'process']),
      route: localizedRoute(page.route, locale),
      sourceRoute: page.route,
      revisionId: page.revisionId,
      text: [...new Set(collectText({ translation, data: page.fields.data || {} }).join(' ').split(/\s+/).filter(Boolean))].join(' ')
    };
  })]));

  return {
    pages,
    localizedPages,
    searchIndex,
    manifest: {
      pageCount: pages.length,
      localePageCounts: Object.fromEntries(LOCALES.map((locale) => [locale, localizedPages[locale].length])),
      searchEntryCounts: Object.fromEntries(LOCALES.map((locale) => [locale, searchIndex[locale].length])),
      routes: pages.map((page) => page.route),
      revisionIds: pages.map((page) => page.revisionId)
    }
  };
}
