export const ROLES = Object.freeze(['admin', 'editor', 'technical_reviewer', 'publisher']);
export const CONTENT_TYPES = Object.freeze([
  'home', 'machine', 'food', 'segment', 'solution', 'service', 'faq',
  'company', 'insight', 'career', 'contact', 'partnership', 'privacy', 'search', 'video_library'
]);
export const LOCALES = Object.freeze(['en', 'zh', 'ms']);
export const PERMISSION_STATUSES = Object.freeze(['ls_owned', 'licensed', 'permission_pending', 'unknown']);
export const MATCH_STATUSES = Object.freeze(['exact', 'category', 'illustrative', 'unverified']);

const publicFields = ['translations', 'data', 'mediaIds'];
const internalFields = ['internalNotes', 'sourceEvidence'];

export const CONTENT_DATA_FIELDS = Object.freeze({
  home: ['hero','currentAtLs','foodChoices','capabilities','segments','insights','partnerships','contact','videoPlacements'],
  machine: ['modelCode','process','strengths','operatingDetails','demonstrations','applications','configurations','components','specifications','documents','serviceLinks','relatedMachines','videoPlacements'],
  food: ['applications','productGroups','gallery','equipmentRoutes','videoPlacements'],
  segment: ['situation','planningGuide','examples','routes','inquiryIntent','videoPlacements'],
  solution: ['scope','steps','outputs','contactAction','videoPlacements'],
  service: ['scope','steps','requiredDetails','contactAction','videoPlacements'],
  faq: ['questions','pageContext'],
  company: ['chapters','history','locations','registrations','partnerships','videoPlacements'],
  insight: ['category','excerpt','article','publishedAt','author','relatedRoutes','videoPlacements'],
  career: ['roleTitle','requirements','source','checkedAt','contactRoute'],
  contact: ['channels','address','hours','privacyNotice'],
  partnership: ['companies','proof','videoPlacements'],
  privacy: ['notice','contactDetails','updatedAt'],
  search: ['suggestions','commonQuestions'],
  video_library: ['videos']
});

export const VIDEO_CATEGORIES = Object.freeze([
  'company', 'machine', 'production-line', 'food', 'operation', 'updates', 'unclassified'
]);
export const VIDEO_PUBLICATION_STATUSES = Object.freeze([
  'included', 'duplicate_alternative', 'historical', 'unavailable', 'awaiting_clarification'
]);

const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_ROW_STATUSES = Object.freeze({
  evidenceStatus: ['pending', 'verified', 'unclear'],
  reviewStatus: ['awaiting_review', 'approved', 'changes_requested', 'rejected'],
  availability: ['available', 'unavailable', 'private', 'unknown'],
  captionStatus: ['not_checked', 'available', 'unavailable', 'blocked'],
  embedStatus: ['not_tested', 'verified', 'external_only', 'blocked']
});

function validTimestamp(value) {
  return typeof value === 'string' && /^(?:\d{1,2}:)?[0-5]?\d:[0-5]\d$/.test(value);
}

function validateVideoRow(row, index) {
  const prefix = `data.videos[${index}]`;
  if (!row || typeof row !== 'object' || Array.isArray(row)) return `${prefix} must be an object`;
  if (typeof row.youtubeId !== 'string' || !YOUTUBE_ID.test(row.youtubeId)) return `${prefix}.youtubeId must be an 11-character YouTube video ID`;
  if (typeof row.sourceTitle !== 'string' || !row.sourceTitle.trim()) return `${prefix}.sourceTitle is required`;
  let source;
  try { source = new URL(row.sourceUrl); } catch { return `${prefix}.sourceUrl must be a YouTube video URL`; }
  const host = source.hostname.toLowerCase().replace(/^www\./, '');
  const urlId = host === 'youtu.be' ? source.pathname.split('/').filter(Boolean)[0]
    : source.searchParams.get('v') || source.pathname.split('/').filter(Boolean).at(-1);
  if (!['youtube.com', 'm.youtube.com', 'youtu.be'].includes(host) || urlId !== row.youtubeId) {
    return `${prefix}.sourceUrl must point to its youtubeId on YouTube`;
  }
  if (!VIDEO_CATEGORIES.includes(row.category)) return `${prefix}.category must use a supported video category`;
  if (!['video', 'short'].includes(row.format)) return `${prefix}.format must be video or short`;
  if (!VIDEO_PUBLICATION_STATUSES.includes(row.publicationStatus)) return `${prefix}.publicationStatus must be a supported review outcome`;
  for (const [field, allowed] of Object.entries(VIDEO_ROW_STATUSES)) {
    if (!allowed.includes(row[field])) {
      return `${prefix} has an unsupported ${field}`;
    }
  }
  if (row.durationSeconds !== undefined && row.durationSeconds !== '' && (!Number.isInteger(Number(row.durationSeconds)) || Number(row.durationSeconds) < 0)) return `${prefix}.durationSeconds must be a non-negative whole number`;
  if (row.uploadDate && !/^\d{4}-\d{2}-\d{2}$/.test(row.uploadDate)) return `${prefix}.uploadDate must use YYYY-MM-DD`;
  for (const field of ['machineNames', 'foodApplications']) {
    if (row[field] !== undefined && (!Array.isArray(row[field]) || row[field].some(value => typeof value !== 'string' || !value.trim()))) return `${prefix}.${field} must be a list of non-empty text values`;
  }
  if (row.sourceDescription !== undefined && typeof row.sourceDescription !== 'string') return `${prefix}.sourceDescription must be text`;
  if (row.captionText !== undefined && typeof row.captionText !== 'string') return `${prefix}.captionText must be text`;
  if (typeof row.channelIdentity !== 'string' || !row.channelIdentity.trim()) return `${prefix}.channelIdentity is required`;
  if (!row.translations || typeof row.translations !== 'object' || Array.isArray(row.translations)) return `${prefix}.translations must include English, Chinese and Malay`;
  for (const locale of LOCALES) {
    const translated = row.translations[locale];
    if (!translated || typeof translated !== 'object' || Array.isArray(translated)) return `${prefix}.translations.${locale} must be an object`;
    if (translated.searchTerms !== undefined && (!Array.isArray(translated.searchTerms) || translated.searchTerms.some(term => typeof term !== 'string'))) return `${prefix}.translations.${locale}.searchTerms must be a list of text`;
  }
  if (row.evidence !== undefined && (!Array.isArray(row.evidence) || row.evidence.some(evidence => !evidence || typeof evidence !== 'object' || Array.isArray(evidence) || !validTimestamp(evidence.timestamp) || typeof evidence.observation !== 'string' || !evidence.observation.trim()))) {
    return `${prefix}.evidence must contain timestamped observations`;
  }
  if (row.evidenceStatus === 'verified' && !row.evidence?.length) return `${prefix} needs timestamped evidence before it can be marked verified`;
  if (row.duplicateOfYoutubeId !== undefined && row.duplicateOfYoutubeId !== '' && (!YOUTUBE_ID.test(row.duplicateOfYoutubeId) || row.duplicateOfYoutubeId === row.youtubeId)) return `${prefix}.duplicateOfYoutubeId must identify another video`;
  if (row.publicationStatus === 'duplicate_alternative' && !row.duplicateOfYoutubeId) return `${prefix} needs duplicateOfYoutubeId when marked as a duplicate alternative`;
  if (row.category === 'unclassified' && ['included', 'historical'].includes(row.publicationStatus)) return `${prefix} must be classified before publication`;
  if (row.publicationStatus === 'included' || row.publicationStatus === 'historical') {
    if (row.evidenceStatus !== 'verified' || row.reviewStatus !== 'approved') return `${prefix} cannot be published until its evidence and review are approved`;
    if (row.availability !== 'available') return `${prefix} cannot be published while unavailable`;
    if (!['verified', 'external_only'].includes(row.embedStatus)) return `${prefix} must have a checked embed or external-link fallback`;
    for (const locale of LOCALES) {
      const translated = row.translations[locale];
      if (typeof translated.title !== 'string' || !translated.title.trim() || typeof translated.summary !== 'string' || !translated.summary.trim()) return `${prefix} needs a title and summary in ${locale}`;
    }
  }
  return null;
}

function validateVideoPlacement(row, index, type) {
  const prefix = `data.videoPlacements[${index}]`;
  if (!row || typeof row !== 'object' || Array.isArray(row)) return `${prefix} must be an object`;
  if (typeof row.youtubeId !== 'string' || !YOUTUBE_ID.test(row.youtubeId)) return `${prefix}.youtubeId must be an 11-character YouTube video ID`;
  if (typeof row.purpose !== 'string' || !row.purpose.trim()) return `${prefix}.purpose is required`;
  if (!Number.isInteger(Number(row.sortOrder)) || Number(row.sortOrder) < 0) return `${prefix}.sortOrder must be a non-negative whole number`;
  if (!['exact', 'category', 'unverified'].includes(row.matchStatus)) return `${prefix}.matchStatus must be exact, category or unverified`;
  if (!['pending', 'verified', 'unclear'].includes(row.evidenceStatus)) return `${prefix}.evidenceStatus is unsupported`;
  if (!['awaiting_review', 'approved', 'changes_requested', 'rejected'].includes(row.reviewStatus)) return `${prefix}.reviewStatus is unsupported`;
  if (!['approved', 'pending', 'held'].includes(row.placementStatus)) return `${prefix}.placementStatus is unsupported`;
  if (!row.translations || typeof row.translations !== 'object' || Array.isArray(row.translations)) return `${prefix}.translations must contain localized summaries`;
  if (row.evidence !== undefined && (!Array.isArray(row.evidence) || row.evidence.some(evidence => !evidence || typeof evidence !== 'object' || Array.isArray(evidence) || !validTimestamp(evidence.timestamp) || typeof evidence.observation !== 'string' || !evidence.observation.trim()))) return `${prefix}.evidence must contain timestamped observations`;
  for (const locale of LOCALES) {
    const translation = row.translations[locale];
    if (!translation || typeof translation !== 'object' || Array.isArray(translation)) return `${prefix}.translations.${locale} must be an object`;
    if (row.placementStatus === 'approved' && (typeof translation.summary !== 'string' || !translation.summary.trim())) return `${prefix} needs a summary in ${locale}`;
  }
  if (row.placementStatus === 'approved' && (row.evidenceStatus !== 'verified' || !row.evidence?.length || row.reviewStatus !== 'approved' || row.matchStatus === 'unverified')) return `${prefix} cannot be published without timestamped placement evidence and review`;
  if (type === 'machine' && row.placementStatus === 'approved' && row.matchStatus !== 'exact') return `${prefix} machine videos require an exact verified model match`;
  return null;
}

export function requiresTechnicalReview(type, fields = {}) {
  return type === 'machine' || type === 'video_library' || Boolean(fields?.data?.videoPlacements?.length);
}

export const CONTENT_SCHEMAS = Object.freeze(Object.fromEntries(CONTENT_TYPES.map((type) => [type, {
  schemaVersion: 1,
  allowedFields: Object.freeze([...publicFields, ...internalFields]),
  requiredFields: Object.freeze(['translations']),
  translationShape: 'locale-keyed page copy; model codes, names and technical values belong in data'
}])));

export function validateTranslations(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'translations must be an object';
  for (const locale of LOCALES) {
    const translated = value[locale];
    if (!translated || typeof translated !== 'object' || Array.isArray(translated)) {
      return `translations.${locale} must be an object`;
    }
  }
  for (const key of Object.keys(value)) {
    if (!LOCALES.includes(key)) return `unsupported translation locale: ${key}`;
  }
  return null;
}

export function validateContent(type, input) {
  const schema = CONTENT_SCHEMAS[type];
  if (!schema) return { error: 'Unsupported content type' };
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Content fields must be an object' };
  const unknown = Object.keys(input).filter((field) => !schema.allowedFields.includes(field));
  if (unknown.length) return { error: `Unsupported fields: ${unknown.join(', ')}` };
  for (const field of schema.requiredFields) {
    if (!(field in input)) return { error: `Missing required field: ${field}` };
  }
  const translationError = validateTranslations(input.translations);
  if (translationError) return { error: translationError };
  if ('data' in input && (!input.data || typeof input.data !== 'object' || Array.isArray(input.data))) {
    return { error: 'data must be an object' };
  }
  if (input.data) {
    const unknownData = Object.keys(input.data).filter((field) => !CONTENT_DATA_FIELDS[type].includes(field));
    if (unknownData.length) return { error: `Unsupported ${type} data fields: ${unknownData.join(', ')}` };
    if (type === 'machine' && (typeof input.data.modelCode !== 'string' || !input.data.modelCode.trim())) return { error: 'Machine records must include their modelCode.' };
    for (const field of ['strengths','demonstrations','applications','configurations','components','specifications','documents','relatedMachines','steps','questions','chapters','examples','requirements','companies','videos','videoPlacements']) {
      if (field in input.data && !Array.isArray(input.data[field])) return { error: `data.${field} must be an array` };
    }
    if (type === 'video_library' && Array.isArray(input.data.videos)) {
      const seen = new Set();
      for (let index = 0; index < input.data.videos.length; index++) {
        const error = validateVideoRow(input.data.videos[index], index);
        if (error) return { error };
        const id = input.data.videos[index].youtubeId;
        if (seen.has(id)) return { error: `data.videos contains duplicate YouTube ID ${id}` };
        seen.add(id);
      }
    }
    if (Array.isArray(input.data.videoPlacements)) {
      for (let index = 0; index < input.data.videoPlacements.length; index++) {
        const error = validateVideoPlacement(input.data.videoPlacements[index], index, type);
        if (error) return { error };
      }
      const placements = input.data.videoPlacements.filter(item => item?.placementStatus === 'approved');
      const orders = placements.map(item => Number(item.sortOrder));
      if (new Set(orders).size !== orders.length) return { error: 'Approved video placements must have unique sortOrder values.' };
    }
  }
  if ('mediaIds' in input && (!Array.isArray(input.mediaIds) || input.mediaIds.some((id) => typeof id !== 'string'))) {
    return { error: 'mediaIds must be an array of media identifiers' };
  }
  if ('sourceEvidence' in input && !Array.isArray(input.sourceEvidence)) return { error: 'sourceEvidence must be an array' };
  if ('internalNotes' in input && typeof input.internalNotes !== 'string') return { error: 'internalNotes must be text' };
  const mediaIds = [...new Set(input.mediaIds || [])];
  return {
    value: {
      fields: { translations: input.translations, ...(input.data ? { data: input.data } : {}), mediaIds },
      internalNotes: input.internalNotes || '',
      sourceEvidence: input.sourceEvidence || [],
      mediaIds
    }
  };
}

export function validateSlugRoute(slug, route) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return 'slug must use lowercase letters, numbers and hyphens';
  if (typeof route !== 'string' || !route.startsWith('/') || route.includes('..') || route.length > 240) return 'route must be a safe absolute path';
  return null;
}
