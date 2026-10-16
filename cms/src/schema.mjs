export const ROLES = Object.freeze(['admin', 'editor', 'technical_reviewer', 'publisher']);
export const CONTENT_TYPES = Object.freeze([
  'home', 'machine', 'food', 'segment', 'solution', 'service', 'faq',
  'company', 'insight', 'career', 'contact', 'partnership', 'privacy', 'search'
]);
export const LOCALES = Object.freeze(['en', 'zh', 'ms']);
export const PERMISSION_STATUSES = Object.freeze(['ls_owned', 'licensed', 'permission_pending', 'unknown']);
export const MATCH_STATUSES = Object.freeze(['exact', 'category', 'illustrative', 'unverified']);

const publicFields = ['translations', 'data', 'mediaIds'];
const internalFields = ['internalNotes', 'sourceEvidence'];

export const CONTENT_DATA_FIELDS = Object.freeze({
  home: ['hero','currentAtLs','foodChoices','capabilities','segments','insights','partnerships','contact'],
  machine: ['modelCode','process','strengths','operatingDetails','demonstrations','applications','configurations','components','specifications','documents','serviceLinks','relatedMachines'],
  food: ['applications','productGroups','gallery','equipmentRoutes'],
  segment: ['situation','planningGuide','examples','routes','inquiryIntent'],
  solution: ['scope','steps','outputs','contactAction'],
  service: ['scope','steps','requiredDetails','contactAction'],
  faq: ['questions','pageContext'],
  company: ['chapters','history','locations','registrations','partnerships'],
  insight: ['category','excerpt','article','publishedAt','author','relatedRoutes'],
  career: ['roleTitle','requirements','source','checkedAt','contactRoute'],
  contact: ['channels','address','hours','privacyNotice'],
  partnership: ['companies','proof'],
  privacy: ['notice','contactDetails','updatedAt'],
  search: ['suggestions','commonQuestions']
});

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
    for (const field of ['strengths','demonstrations','applications','configurations','components','specifications','documents','relatedMachines','steps','questions','chapters','examples','requirements','companies']) {
      if (field in input.data && !Array.isArray(input.data[field])) return { error: `data.${field} must be an array` };
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
