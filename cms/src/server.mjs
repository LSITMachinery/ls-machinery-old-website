import http from 'node:http';
import path from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, readFile, rm, mkdtemp, writeFile } from 'node:fs/promises';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import {
  constantTimeTextEqual, csrfFor, expiredSessionCookie, hashPassword,
  isLoopbackAddress, parseCookies, passwordError, randomToken,
  requestOriginAllowed, sessionCookie, sessionHash, sha256, verifyPassword
} from './security.mjs';
import { CONTENT_TYPES, CONTENT_SCHEMAS, CONTENT_DATA_FIELDS, LOCALES, PERMISSION_STATUSES, MATCH_STATUSES, validateContent, validateSlugRoute } from './schema.mjs';
import { PgRepository } from './repository.mjs';
import { createSiteRegistry, SITE_ROOT } from './site-registry.mjs';
import { parseWordPressWxr, listCpanelTarArchive, sha256Buffer } from './wordpress-import.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.resolve(here, '..', 'public');
const COOKIE_NAME = 'ls_cms_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const JSON_LIMIT = 1_500_000;
const MEDIA_LIMIT = 100 * 1024 * 1024;
const MIGRATION_LIMIT = 128 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIME_EXT = new Map([
  ['image/jpeg', '.jpg'], ['image/png', '.png'], ['image/webp', '.webp'], ['image/avif', '.avif'],
  ['video/mp4', '.mp4'], ['video/webm', '.webm'], ['application/pdf', '.pdf']
]);
let dummyHashPromise;

function readSiteRegistry() {
  try { return createSiteRegistry({ rootDir: process.env.CMS_SITE_ROOT || SITE_ROOT }); }
  catch { return null; }
}

function cmsTypeForTemplate(template) {
  return ({
    homepage:'home','machine-catalogue':'machine','machine-category':'machine','machine-detail':'machine',
    'food-catalogue':'food','food-detail':'food',segment:'segment','solutions-index':'solution','solution-detail':'solution',
    'services-overview':'service','service-detail':'service',company:'company',insights:'insight',inquiry:'contact',privacy:'privacy',search:'search'
  })[template] || null;
}

function schemaLabel(value) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, character => character.toUpperCase());
}

function cmsFieldSchemas(records = []) {
  const types = {};
  for (const [type, schema] of Object.entries(CONTENT_SCHEMAS)) {
    const example = records.find(item => item.type === type)?.revision?.fields || {};
    const translationKeys = new Set(['title','h1','heading','subtitle','intro','summary','metaTitle','metaDescription','sections']);
    for (const copy of Object.values(example.translations || {})) {
      for (const key of Object.keys(copy || {})) translationKeys.add(key);
    }
    const fields = [...translationKeys].map(key => ({
      key: `translations.${key}`, label: schemaLabel(key), kind: key === 'sections' ? 'repeatable' : ['intro','summary','metaDescription'].includes(key) ? 'textarea' : 'text',
      required: key === 'title', repeatable: key === 'sections', locales: LOCALES
    }));
    for (const key of CONTENT_DATA_FIELDS[type] || []) fields.push({
      key: `data.${key}`, label: schemaLabel(key), kind: Array.isArray(example.data?.[key]) || ['strengths','demonstrations','applications','configurations','components','specifications','documents','relatedMachines','steps','questions','chapters','examples','requirements','companies'].includes(key) ? 'repeatable' : 'text',
      required: type === 'machine' && key === 'modelCode', repeatable: ['strengths','demonstrations','applications','configurations','components','specifications','documents','relatedMachines','steps','questions','chapters','examples','requirements','companies'].includes(key), locales: []
    });
    types[type] = { fields, allowedDataFields: CONTENT_DATA_FIELDS[type] || [], schemaVersion: schema.schemaVersion };
  }
  return types;
}

function importedPlainText(value) {
  return String(value || '').replace(/<(?:script|style)\b[\s\S]*?<\/(?:script|style)\s*>/gi, ' ')
    .replace(/<\/(?:p|div|li|h[1-6]|br)\s*>/gi, '\n').replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_, number) => String.fromCodePoint(Math.min(0x10ffff, Number(number) || 0x20)))
    .replace(/\s+/g, ' ').trim().slice(0, 24_000);
}

function safeImportName(value) {
  const name = path.posix.basename(String(value || 'backup').replaceAll('\\', '/')).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160);
  return name || 'backup';
}

function buildWxrPreview(parsed, registry) {
  const items = parsed.records.map(record => {
    const resolved = record.originalUrl ? registry?.resolvePath(record.originalUrl) : null;
    const route = resolved?.entry.paths.en || '';
    const suggestedType = resolved ? cmsTypeForTemplate(resolved.entry.template) : record.kind === 'post' ? 'insight' : record.kind === 'page' ? 'company' : null;
    const supported = Boolean(record.source.identity && ['page','post'].includes(record.kind));
    return {
      title: record.title || record.slug || 'Untitled source item', sourceType: record.source.type,
      sourceIdentity: record.source.identity, oldUrl: record.originalUrl || record.originalGuid || '',
      supported, proposedType: suggestedType, proposedRoute: route,
      reason: supported ? '' : record.kind === 'media' ? 'Media files need to be uploaded into the authenticated media library and checked separately.' : 'This source item has no supported page type or stable source identity.'
    };
  });
  const missingMedia = parsed.conflicts.filter(item => item.code === 'MISSING_MEDIA').map(item => ({ path:item.path, title:item.identity, message:item.message }));
  const conflicts = parsed.conflicts.filter(item => item.code !== 'MISSING_MEDIA');
  return {
    format: parsed.format,
    counts: { ...parsed.counts, missingMedia: missingMedia.length },
    items, warnings: parsed.unsupported.map(item => ({ title:item.title, message:item.message })),
    conflicts, missingMedia,
    sourceRecords: parsed.records
  };
}

async function readRawBody(request, limit = MIGRATION_LIMIT) {
  const length = Number(request.headers['content-length'] || 0);
  if (length > limit) { request.resume(); const error = new Error('The backup file is too large.'); error.status = 413; throw error; }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) { request.resume(); const error = new Error('The backup file is too large.'); error.status = 413; throw error; }
    chunks.push(chunk);
  }
  if (!size) { const error = new Error('Select a file before continuing.'); error.status = 400; throw error; }
  return Buffer.concat(chunks);
}

function json(response, status, value, headers = {}) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  response.end(body);
}

function html(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
  });
  response.end(body);
}

function plainError(response, status, message) {
  json(response, status, { error: message });
}

async function readJson(request, limit = JSON_LIMIT) {
  const contentType = request.headers['content-type'] || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    request.resume(); const error = new Error('Use an application/json request body.'); error.status = 415; throw error;
  }
  const length = Number(request.headers['content-length'] || 0);
  if (Number.isFinite(length) && length > limit) {
    request.resume(); const error = new Error('Request body is too large.'); error.status = 413; throw error;
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > limit) { request.resume(); const error = new Error('Request body is too large.'); error.status = 413; throw error; }
    chunks.push(chunk);
  }
  if (!size) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { const error = new Error('Request body must be valid JSON.'); error.status = 400; throw error; }
}

function sendStatic(response, filePath, contentType) {
  response.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
  });
  createReadStream(filePath).pipe(response);
}

function normalizedEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validName(value, max = 120) {
  return typeof value === 'string' && value.trim().length > 0 && value.trim().length <= max;
}

function validId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function statusForError(error) {
  if (error.status) return error.status;
  switch (error.code) {
    case 'BOOTSTRAPPED': return 409;
    case 'LAST_ADMIN': return 409;
    case 'VERSION_CONFLICT': return 409;
    case 'INVALID_STATE': case 'REVIEW_REQUIRED': case 'MEDIA_NOT_READY': return 409;
    case 'NOT_FOUND': return 404;
    case 'MEDIA_NOT_FOUND': return 400;
    case '23505': return 409;
    case '23503': return 400;
    default: return 500;
  }
}

function publicError(error) {
  const status = statusForError(error);
  if (status >= 500) return { status, message: 'The CMS could not complete that request.' };
  if (error.code === 'LAST_ADMIN') return { status, message: 'Keep at least one active administrator account.' };
  if (error.code === '23505') return { status, message: 'A record with that email, slug or route already exists.' };
  if (error.code === '23503') return { status, message: 'A linked staff or media record could not be found.' };
  return { status, message: error.message || 'The request could not be completed.' };
}

function responseHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function titleFromFields(fields, locale) {
  const translation = fields?.translations?.[locale] || fields?.translations?.en || {};
  return translation.title || translation.name || translation.heading || 'Private content preview';
}

function textFromFields(fields, locale) {
  const translation = fields?.translations?.[locale] || fields?.translations?.en || {};
  return translation.summary || translation.description || translation.intro || '';
}

function supportsMagic(mime, head) {
  if (mime === 'image/jpeg') return head.length >= 3 && head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (mime === 'image/png') return head.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/webp') return head.length >= 12 && head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP';
  if (mime === 'image/avif') return head.length >= 12 && head.toString('ascii', 4, 8) === 'ftyp' && /avif|avis/.test(head.toString('ascii', 8, 16));
  if (mime === 'video/mp4') return head.length >= 12 && head.toString('ascii', 4, 8) === 'ftyp';
  if (mime === 'video/webm') return head.subarray(0, 4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]));
  if (mime === 'application/pdf') return head.toString('ascii', 0, 5) === '%PDF-';
  return false;
}

async function storeUpload(request, mediaRoot, mimeType) {
  const extension = MIME_EXT.get(mimeType);
  if (!extension) { request.resume(); const error = new Error('This file type is not allowed.'); error.status = 415; throw error; }
  const contentLength = Number(request.headers['content-length'] || 0);
  if (contentLength > MEDIA_LIMIT) { request.resume(); const error = new Error('Media files must be 100 MB or smaller.'); error.status = 413; throw error; }
  await mkdir(mediaRoot, { recursive: true });
  const storageKey = `${randomUUID()}${extension}`;
  const tempPath = path.join(mediaRoot, `.${storageKey}.part`);
  const finalPath = path.join(mediaRoot, storageKey);
  const { createHash } = await import('node:crypto');
  const digest = createHash('sha256');
  let byteSize = 0;
  let first = Buffer.alloc(0);
  const meter = new Transform({
    transform(chunk, encoding, callback) {
      byteSize += chunk.length;
      if (byteSize > MEDIA_LIMIT) { callback(Object.assign(new Error('Media files must be 100 MB or smaller.'), { status: 413 })); return; }
      digest.update(chunk);
      if (first.length < 32) first = Buffer.concat([first, chunk.subarray(0, 32 - first.length)]);
      callback(null, chunk);
    }
  });
  try {
    await pipeline(request, meter, createWriteStream(tempPath, { flags: 'wx', mode: 0o600 }));
    if (!byteSize || !supportsMagic(mimeType, first)) { const error = new Error('The file content does not match its declared type.'); error.status = 415; throw error; }
    const file = await open(tempPath, 'r');
    await file.sync();
    await file.close();
    const { rename } = await import('node:fs/promises');
    await rename(tempPath, finalPath);
    return { storageKey, byteSize, sha256: digest.digest('hex') };
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => {});
    throw error;
  }
}

function csrfOkay(request, rawToken, secret) {
  if (!rawToken || !requestOriginAllowed(request)) return false;
  const expected = csrfFor(rawToken, secret);
  return constantTimeTextEqual(request.headers['x-csrf-token'], expected);
}

export function createCmsServer({ repository, csrfSecret, secureCookies = false, mediaRoot = path.resolve(process.env.CMS_DATA_DIR || path.join(here, '..', 'data'), 'media'), loginLimit = 8, loginWindowMinutes = 15 } = {}) {
  if (!repository) throw new Error('A CMS repository is required.');
  if (typeof csrfSecret !== 'string' || Buffer.byteLength(csrfSecret) < 32) throw new Error('CMS_SESSION_SECRET must contain at least 32 bytes.');
  const server = http.createServer(async (request, response) => {
    responseHeaders(response);
    let url;
    try { url = new URL(request.url, 'http://cms.local'); }
    catch { plainError(response, 400, 'Invalid request URL.'); return; }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { plainError(response, 400, 'Invalid request path.'); return; }
    try {
      if (request.method === 'GET' && pathname === '/health') { json(response, 200, { status: 'ok' }); return; }
      if (request.method === 'GET' && pathname === '/api/cms/setup-status') { json(response, 200, { firstAdminRequired: (await repository.userCount()) === 0 }); return; }
      if (request.method === 'GET' && pathname === '/cms') { response.writeHead(308, { Location: '/cms/' }).end(); return; }
      if (request.method === 'GET' && (pathname === '/cms/' || pathname === '/cms/index.html')) {
        sendStatic(response, path.join(staticRoot, 'index.html'), 'text/html; charset=utf-8'); return;
      }
      if (request.method === 'GET' && pathname === '/cms/cms.js') { sendStatic(response, path.join(staticRoot, 'cms.js'), 'text/javascript; charset=utf-8'); return; }
      if (request.method === 'GET' && pathname === '/cms/cms.css') { sendStatic(response, path.join(staticRoot, 'cms.css'), 'text/css; charset=utf-8'); return; }
      if (request.method === 'GET' && pathname === '/cms/preview-bridge.js') { sendStatic(response, path.join(staticRoot, 'preview-bridge.js'), 'text/javascript; charset=utf-8'); return; }
      if (request.method === 'GET' && pathname === '/cms/preview.css') { sendStatic(response, path.join(staticRoot, 'preview.css'), 'text/css; charset=utf-8'); return; }
      if (pathname.startsWith('/api/cms/') && !requestOriginAllowed(request)) { request.resume(); plainError(response, 403, 'Requests must come from this site.'); return; }

      if (pathname === '/api/cms/bootstrap' && request.method === 'POST') {
        if (!isLoopbackAddress(request.socket.remoteAddress || '')) { request.resume(); plainError(response, 403, 'Initial setup is available only from this computer.'); return; }
        const body = await readJson(request);
        const email = normalizedEmail(body.email);
        const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
        const passError = passwordError(body.password);
        if (!EMAIL_RE.test(email) || !validName(displayName) || passError) { plainError(response, 400, passError || 'Enter a valid work email and display name.'); return; }
        const user = await repository.bootstrapAdmin({ email, displayName, passwordHash: await hashPassword(body.password) });
        json(response, 201, { user, note: 'Administrator created. Sign in to continue.' }); return;
      }

      if (pathname === '/api/cms/auth/login' && request.method === 'POST') {
        const body = await readJson(request);
        const email = normalizedEmail(body.email);
        const password = typeof body.password === 'string' ? body.password : '';
        const ip = request.socket.remoteAddress || 'unknown';
        const limitKey = sha256(`${ip}\0${email}`);
        const ipLimitKey = sha256(`ip\0${ip}`);
        const [attempt, ipAttempt] = await Promise.all([
          repository.consumeLoginAttempt(limitKey, { limit: loginLimit, windowMinutes: loginWindowMinutes }),
          repository.consumeLoginAttempt(ipLimitKey, { limit: Math.max(loginLimit * 5, 40), windowMinutes: loginWindowMinutes })
        ]);
        if (!attempt.allowed || !ipAttempt.allowed) { plainError(response, 429, 'Too many sign-in attempts. Try again later.'); return; }
        const account = EMAIL_RE.test(email) ? await repository.findUserByEmail(email) : null;
        if (!dummyHashPromise) dummyHashPromise = hashPassword(randomBytes(32).toString('hex'));
        const candidateHash = account?.password_hash || account?.passwordHash || await dummyHashPromise;
        const matched = password.length <= 256 && await verifyPassword(password, candidateHash);
        if (!account || account.disabled || !matched) { plainError(response, 401, 'Email or passphrase is incorrect.'); return; }
        await Promise.all([repository.clearLoginAttempts(limitKey), repository.clearLoginAttempts(ipLimitKey)]);
        const token = randomToken();
        await repository.createSession({ tokenHash: sessionHash(token), userId: account.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
        response.setHeader('Set-Cookie', sessionCookie(token, { secure: secureCookies, maxAge: SESSION_TTL_MS / 1000 }));
        json(response, 200, { user: { id: account.id, email: account.email, displayName: account.display_name || account.displayName, role: account.role }, csrfToken: csrfFor(token, csrfSecret) }); return;
      }

      const cookies = parseCookies(request.headers.cookie || '');
      const rawToken = cookies[COOKIE_NAME];
      const tokenHash = rawToken ? sessionHash(rawToken) : null;
      const session = tokenHash ? await repository.getSession(tokenHash) : null;
      const user = session?.user || null;
      const requireUser = () => {
        if (!user) { request.resume(); plainError(response, 401, 'Sign in to use the CMS.'); return false; }
        return true;
      };
      const requireRole = (...roles) => {
        if (!requireUser()) return false;
        if (!roles.includes(user.role)) { request.resume(); plainError(response, 403, 'Your account cannot perform that action.'); return false; }
        return true;
      };
      const requireCsrf = () => {
        if (!requireUser()) return false;
        if (!csrfOkay(request, rawToken, csrfSecret)) { request.resume(); plainError(response, 403, 'Refresh the page and try again.'); return false; }
        return true;
      };

      if (pathname === '/api/cms/auth/me' && request.method === 'GET') {
        if (!user) { json(response, 200, { user: null }); return; }
        json(response, 200, { user, csrfToken: csrfFor(rawToken, csrfSecret) }); return;
      }
      if (pathname === '/api/cms/auth/logout' && request.method === 'POST') {
        if (!requireCsrf()) return;
        await repository.deleteSession(tokenHash);
        response.setHeader('Set-Cookie', expiredSessionCookie({ secure: secureCookies }));
        json(response, 200, { signedOut: true }); return;
      }

      if (pathname === '/api/content/published' && request.method === 'GET') {
        const route = url.searchParams.get('route');
        const content = route ? await repository.getPublished(route) : await repository.listPublished();
        json(response, 200, { content }); return;
      }
      if (pathname === '/api/content/published/search' && request.method === 'GET') {
        const locale = url.searchParams.get('locale') || 'en';
        if (!LOCALES.includes(locale)) { plainError(response, 400, 'Choose en, zh or ms for the search language.'); return; }
        const searchIndex = await repository.getPublishedSearchIndex(locale);
        json(response, 200, { locale, searchIndex }); return;
      }
      if (pathname === '/api/cms/dashboard' && request.method === 'GET') {
        if (!requireUser()) return;
        const registry = readSiteRegistry();
        json(response, 200, await repository.getDashboardMetrics(registry?.routeCount || 0)); return;
      }
      if (pathname === '/api/cms/site-registry' && request.method === 'GET') {
        if (!requireUser()) return;
        const registry = readSiteRegistry();
        if (!registry) { plainError(response, 503, 'The public route registry is not available in this CMS installation.'); return; }
        const records = await repository.listContent();
        const byRoute = new Map(records.map(item => [item.route, item]));
        const routes = registry.entries.map(entry => {
          const item = byRoute.get(entry.paths.en);
          const translations = item?.revision?.fields?.translations || {};
          const title = translations.en?.title || translations.en?.h1 || translations.en?.metaTitle || entry.routeKey;
          return {
            path: entry.paths.en, type: cmsTypeForTemplate(entry.template), template: entry.template,
            title, contentId: item?.id || null,
            locales: Object.fromEntries(LOCALES.map(locale => {
              const values = translations[locale] || {};
              const complete = Object.values(values).some(value => typeof value === 'string' ? value.trim() : Array.isArray(value) ? value.length > 0 : Boolean(value));
              return [locale, { status: item ? item.revision?.status || 'draft' : 'not imported', complete }];
            }))
          };
        });
        json(response, 200, { routes }); return;
      }
      if (pathname === '/api/cms/field-schemas' && request.method === 'GET') {
        if (!requireUser()) return;
        const records = await repository.listContent();
        json(response, 200, { types: cmsFieldSchemas(records) }); return;
      }
      if (pathname === '/api/cms/publication-history' && request.method === 'GET') {
        if (!requireUser()) return;
        const jobs = await repository.listPublicationJobs();
        json(response, 200, { jobs }); return;
      }
      if (pathname === '/api/cms/settings' && request.method === 'GET') {
        if (!requireUser()) return;
        json(response, 200, await repository.getSiteSettings()); return;
      }
      if (pathname === '/api/cms/settings' && request.method === 'PATCH') {
        if (!requireRole('admin') || !requireCsrf()) return;
        const body = await readJson(request);
        const settings = body.settings;
        if (!settings || typeof settings !== 'object' || Array.isArray(settings) || Object.keys(settings).some(key => !['navigation','footer','contact','metadata'].includes(key)) || Object.values(settings).some(value => !value || typeof value !== 'object' || Array.isArray(value)) || JSON.stringify(settings).length > 100_000) {
          plainError(response, 400, 'Settings must contain navigation, footer, contact or metadata objects and stay under 100 KB.'); return;
        }
        const current = await repository.getSiteSettings();
        const next = { ...current.settings, ...settings };
        json(response, 200, await repository.updateSiteSettings(next, user.id)); return;
      }
      if (pathname === '/api/cms/migration/preview' && request.method === 'POST') {
        if (!requireRole('admin') || !requireCsrf()) return;
        const fileName = safeImportName(request.headers['x-file-name']);
        const extension = fileName.toLowerCase();
        const bytes = await readRawBody(request);
        const registry = readSiteRegistry();
        let sourceFormat;
        let storedPreview;
        if (extension.endsWith('.xml')) {
          sourceFormat = 'wordpress-wxr';
          const parsed = parseWordPressWxr(bytes, { localMediaFiles: [] });
          storedPreview = buildWxrPreview(parsed, registry);
        } else if (extension.endsWith('.tar') || extension.endsWith('.tar.gz') || extension.endsWith('.tgz')) {
          sourceFormat = 'cpanel-tar';
          const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'ls-cms-import-'));
          try {
            const stagedName = extension.endsWith('.tar.gz') ? 'source.tar.gz' : extension.endsWith('.tgz') ? 'source.tgz' : 'source.tar';
            await writeFile(path.join(temporaryRoot, stagedName), bytes, { flag:'wx', mode:0o600 });
            const inventory = listCpanelTarArchive(temporaryRoot, stagedName);
            const items = inventory.entries.filter(entry => entry.type !== 'directory').map(entry => ({
              title: entry.path, sourceType: entry.category || entry.type, oldUrl: entry.path,
              supported: false, sourceIdentity: null,
              reason: entry.category === 'wordpress-export' ? 'The export is inside this archive. Extract it into a separate WordPress XML export for page mapping.' : entry.category === 'media' ? 'The archive media is inventoried but must be uploaded and checked in the media library.' : 'This archive entry is inventoried only; database and hosting files are never executed.'
            }));
            storedPreview = {
              format: inventory.format,
              counts: { ...inventory.counts, items:items.length, wordpressExports:inventory.entries.filter(entry=>entry.category==='wordpress-export').length, media:inventory.entries.filter(entry=>entry.category==='media').length },
              items, warnings:[...inventory.issues, 'Archive listing is read-only. Upload the contained WordPress XML separately to map content; SQL and PHP files are never run.'],
              conflicts:inventory.issues, missingMedia:[], sourceRecords:[], entries:inventory.entries
            };
          } finally { await rm(temporaryRoot, { recursive:true, force:true }); }
        } else {
          plainError(response, 415, 'Use a WordPress XML export or a .tar, .tar.gz or .tgz archive.'); return;
        }
        const previewId = randomUUID();
        await repository.createMigrationPreview({ id:previewId, actorId:user.id, sourceFormat, fileName, sourceChecksum:sha256Buffer(bytes), preview:storedPreview, expiresAt:new Date(Date.now()+8*60*60*1000) });
        const { sourceRecords, entries, ...publicPreview } = storedPreview;
        json(response, 200, { previewId, ...publicPreview }); return;
      }
      if (pathname === '/api/cms/migration/import' && request.method === 'POST') {
        if (!requireRole('admin') || !requireCsrf()) return;
        const body = await readJson(request);
        if (body.confirm !== true || !validId(body.previewId) || !body.mappings || typeof body.mappings !== 'object' || Array.isArray(body.mappings) || Object.keys(body.mappings).length > 2000) { plainError(response, 400, 'Confirm a reviewed migration preview and include page mappings.'); return; }
        const previewRecord = await repository.getMigrationPreview(body.previewId,user.id);
        if (!previewRecord) { plainError(response,404,'The migration preview expired or could not be found. Preview the source again.'); return; }
        if (previewRecord.sourceFormat !== 'wordpress-wxr' || !Array.isArray(previewRecord.preview.sourceRecords)) { plainError(response,409,'This archive is an inventory only. Upload its WordPress XML export separately before importing pages.'); return; }
        const sourceByIdentity = new Map(previewRecord.preview.sourceRecords.map(record=>[record.source?.identity,record]).filter(([identity])=>identity));
        const selected=[];
        for (const [identity,mapping] of Object.entries(body.mappings)) {
          const record=sourceByIdentity.get(identity);
          if (!record || !['page','post'].includes(record.kind) || !mapping || typeof mapping!=='object' || typeof mapping.type!=='string' || typeof mapping.route!=='string') continue;
          const resolved=readSiteRegistry()?.resolvePath(mapping.route);
          if (!resolved || resolved.locale!=='en' || resolved.path!==mapping.route || cmsTypeForTemplate(resolved.entry.template)!==mapping.type) continue;
          selected.push({ record, mapping, route:resolved.entry.paths.en });
        }
        if (!selected.length) { plainError(response,400,'Map at least one supported WordPress page to a registered English website path and matching page type.'); return; }
        const job=await repository.createMigrationJob({previewId:body.previewId,actorId:user.id});
        json(response,202,{job});
        setImmediate(async()=>{
          const result={created:[],unchanged:[],conflicts:[],total:selected.length};
          try {
            await repository.updateMigrationJob({id:job.id,status:'building',progress:5,message:'Checking mapped WordPress content and registered LS pages.'});
            for (const [index,entry] of selected.entries()) {
              const {record,route}=entry;
              const identity=record.source.identity;
              const previousImport=await repository.getImportedSource?.(identity);
              if (previousImport?.sourceChecksum===record.sourceChecksum) { result.unchanged.push({sourceIdentity:identity,route}); continue; }
              if (previousImport) { result.conflicts.push({sourceIdentity:identity,route,message:'This WordPress source item was imported before. Existing LS edits were kept for review.'}); continue; }
              let current=await repository.getContentByRoute?.(route);
              if (current && (current.version>1 || current.type!==entry.mapping.type)) { result.conflicts.push({sourceIdentity:identity,route,message:'This route already has edited CMS content. Its current version was kept unchanged.'}); continue; }
              if (!current) current=await repository.getContentByRoute?.(route);
              const fields=current?.revision?.fields||{translations:{en:{},zh:{},ms:{}},data:{},mediaIds:[]};
              const translations={...fields.translations,en:{...(fields.translations?.en||{})}};
              const bodyText=importedPlainText(record.content);
              const excerptText=importedPlainText(record.excerpt);
              translations.en={...translations.en,...(record.title?{title:record.title}:{}),...(excerptText?{summary:excerptText}:{}),...(bodyText?{intro:bodyText}:{})};
              const data={...(fields.data||{})};
              if(entry.mapping.type==='insight') { if(bodyText)data.article=bodyText; if(excerptText)data.excerpt=excerptText; }
              if(entry.mapping.type==='machine') {
                const model=record.sourceMeta?.find(meta=>['model_code','model code','modelnumber','machine_model','machine model'].includes(String(meta.key).toLowerCase()))?.value?.trim();
                if(!model && !data.modelCode) { result.conflicts.push({sourceIdentity:identity,route,message:'Machine content needs a model code from the WordPress record or an LS reviewer before it can be imported.'}); continue; }
                data.modelCode=data.modelCode||model;
              }
              const sourceEvidence=[...(current?.revision?.sourceEvidence||[]),{kind:'wordpress-import',sourceIdentity:identity,sourceType:record.source.type,sourceUrl:record.originalUrl||null,sourceChecksum:record.sourceChecksum,previewChecksum:previewRecord.sourceChecksum}];
              const internalNotes=[current?.revision?.internalNotes||'',`Imported from WordPress source ${identity}. Review and verify before requesting publication.`].filter(Boolean).join('\n');
              const validated=validateContent(entry.mapping.type,{translations,data,mediaIds:fields.mediaIds||[],internalNotes,sourceEvidence});
              if(validated.error) { result.conflicts.push({sourceIdentity:identity,route,message:validated.error}); continue; }
              const content=current
                ? await repository.updateDraft({id:current.id,expectedVersion:current.version,validated:validated.value,actorId:user.id})
                : await repository.createContent({type:entry.mapping.type,slug:route.split('/').filter(Boolean).at(-1)||'home',route,validated:validated.value,actorId:user.id});
              const imported=await repository.recordImportedSource({sourceKey:identity,sourceChecksum:record.sourceChecksum,sourceUrl:record.originalUrl||null,platform:'wordpress',contentId:content.id,actorId:user.id});
              if(imported) result.created.push({sourceIdentity:identity,route,contentId:content.id,revisionId:content.revision?.id});
              else result.conflicts.push({sourceIdentity:identity,route,message:'This source item was claimed by another import while this job was running.'});
              await repository.updateMigrationJob({id:job.id,status:'building',progress:Math.round(((index+1)/selected.length)*95),message:`Reviewed ${index+1} of ${selected.length} mapped source items.`});
            }
            await repository.updateMigrationJob({id:job.id,status:'completed',progress:100,message:`Created ${result.created.length} draft revisions; public pages were unchanged.`,result});
          } catch {
            await repository.updateMigrationJob({id:job.id,status:'failed',progress:100,message:'The import stopped. Any drafts already created remain private; public pages were unchanged.',result}).catch(()=>{});
          }
        });
        return;
      }
      const migrationJobMatch=pathname.match(/^\/api\/cms\/migration\/jobs\/([0-9a-f-]+)$/i);
      if(migrationJobMatch && request.method==='GET') {
        if(!requireRole('admin')) return;
        const job=await repository.getMigrationJob(migrationJobMatch[1],user.id);
        if(!job){plainError(response,404,'Migration job not found.');return;}
        json(response,200,{job});return;
      }
      const publicationJobMatch = pathname.match(/^\/api\/cms\/publication-jobs\/([0-9a-f-]+)$/i);
      if (publicationJobMatch && request.method === 'GET') {
        if (!requireUser()) return;
        const job = await repository.getPublicationJob(publicationJobMatch[1]);
        if (!job) { plainError(response, 404, 'Publication job not found.'); return; }
        json(response, 200, { job }); return;
      }
      const publicMedia = pathname.match(/^\/api\/content\/media\/([0-9a-f-]+)$/i);
      if (publicMedia && request.method === 'GET') {
        const media = await repository.isPublishedMedia(publicMedia[1]);
        if (!media) { plainError(response, 404, 'Media not found.'); return; }
        await streamMedia(response, path.join(mediaRoot, path.basename(media.storageKey)), media.mimeType, false); return;
      }

      if (pathname === '/api/cms/staff' && request.method === 'GET') {
        if (!requireRole('admin')) return;
        json(response, 200, { staff: await repository.listStaff() }); return;
      }
      if (pathname === '/api/cms/staff' && request.method === 'POST') {
        if (!requireRole('admin') || !requireCsrf()) return;
        const body = await readJson(request);
        const email = normalizedEmail(body.email);
        const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : '';
        const passError = passwordError(body.password);
        if (!EMAIL_RE.test(email) || !validName(displayName) || passError) { plainError(response, 400, passError || 'Enter a valid work email and display name.'); return; }
        if (!['admin','editor','technical_reviewer','publisher'].includes(body.role)) { plainError(response, 400, 'Choose a valid staff role.'); return; }
        const account = await repository.createStaff({ email, displayName, role: body.role, passwordHash: await hashPassword(body.password) }, user.id);
        json(response, 201, { user: account }); return;
      }
      const staffMatch = pathname.match(/^\/api\/cms\/staff\/([0-9a-f-]+)$/i);
      if (staffMatch && request.method === 'PATCH') {
        if (!requireRole('admin') || !requireCsrf()) return;
        const body = await readJson(request);
        if (body.role !== undefined && !['admin','editor','technical_reviewer','publisher'].includes(body.role)) { plainError(response, 400, 'Choose a valid staff role.'); return; }
        if (body.disabled !== undefined && typeof body.disabled !== 'boolean') { plainError(response, 400, 'disabled must be true or false.'); return; }
        if (body.displayName !== undefined && !validName(body.displayName)) { plainError(response, 400, 'Enter a display name.'); return; }
        if (staffMatch[1] === user.id && (body.disabled === true || (body.role && body.role !== 'admin'))) { plainError(response, 400, 'You cannot disable or demote your own administrator account.'); return; }
        const account = await repository.updateStaff({ id: staffMatch[1], role: body.role, disabled: body.disabled, displayName: body.displayName }, user.id);
        json(response, 200, { user: account }); return;
      }

      if (pathname === '/api/cms/content' && request.method === 'GET') {
        if (!requireUser()) return;
        const type = url.searchParams.get('type') || undefined;
        if (type && !CONTENT_TYPES.includes(type)) { plainError(response, 400, 'Unknown content type.'); return; }
        json(response, 200, { content: await repository.listContent({ type }) }); return;
      }
      const historyMatch = pathname.match(/^\/api\/cms\/content\/([0-9a-f-]+)\/revisions$/i);
      if (historyMatch && request.method === 'GET') {
        if (!requireUser()) return;
        const item = await repository.getContent(historyMatch[1]);
        if (!item) { plainError(response, 404, 'Content record not found.'); return; }
        json(response, 200, { revisions: await repository.getRevisionHistory(historyMatch[1]) }); return;
      }
      if (pathname === '/api/cms/content' && request.method === 'POST') {
        if (!requireRole('editor','admin') || !requireCsrf()) return;
        const body = await readJson(request);
        const type = body.type;
        if (!CONTENT_TYPES.includes(type)) { plainError(response, 400, 'Choose a supported fixed page type.'); return; }
        const routeError = validateSlugRoute(body.slug, body.route);
        if (routeError) { plainError(response, 400, routeError); return; }
        const validated = validateContent(type, body.fields);
        if (validated.error) { plainError(response, 400, validated.error); return; }
        const content = await repository.createContent({ type, slug: body.slug, route: body.route, validated: validated.value, actorId: user.id });
        json(response, 201, { content }); return;
      }
      const itemMatch = pathname.match(/^\/api\/cms\/content\/([0-9a-f-]+)$/i);
      if (itemMatch && request.method === 'GET') {
        if (!requireUser()) return;
        const content = await repository.getContent(itemMatch[1]);
        if (!content) { plainError(response, 404, 'Content record not found.'); return; }
        json(response, 200, { content }); return;
      }
      const draftMatch = pathname.match(/^\/api\/cms\/content\/([0-9a-f-]+)\/draft$/i);
      if (draftMatch && request.method === 'PUT') {
        if (!requireRole('editor','admin') || !requireCsrf()) return;
        const body = await readJson(request);
        if (!Number.isInteger(body.expectedVersion) || body.expectedVersion < 1) { plainError(response, 400, 'Include the version you opened.'); return; }
        const item = await repository.getContent(draftMatch[1]);
        if (!item) { plainError(response, 404, 'Content record not found.'); return; }
        const validated = validateContent(item.type, body.fields);
        if (validated.error) { plainError(response, 400, validated.error); return; }
        const content = await repository.updateDraft({ id: item.id, expectedVersion: body.expectedVersion, validated: validated.value, actorId: user.id });
        json(response, 200, { content }); return;
      }
      const reviewMatch = pathname.match(/^\/api\/cms\/content\/([0-9a-f-]+)\/request-review$/i);
      if (reviewMatch && request.method === 'POST') {
        if (!requireRole('editor','admin') || !requireCsrf()) return;
        const body = await readJson(request);
        if (!validId(body.revisionId) || !Number.isInteger(body.expectedVersion)) { plainError(response, 400, 'Include the current revision and version.'); return; }
        const content = await repository.requestReview({ id: reviewMatch[1], revisionId: body.revisionId, expectedVersion: body.expectedVersion, actorId: user.id });
        json(response, 200, { content }); return;
      }
      const techMatch = pathname.match(/^\/api\/cms\/content\/([0-9a-f-]+)\/technical-review$/i);
      if (techMatch && request.method === 'POST') {
        if (!requireRole('technical_reviewer') || !requireCsrf()) return;
        const body = await readJson(request);
        if (!validId(body.revisionId) || !Number.isInteger(body.expectedVersion) || !['approved','changes_requested'].includes(body.decision)) { plainError(response, 400, 'Include a current revision, version and review decision.'); return; }
        if (body.note !== undefined && (typeof body.note !== 'string' || body.note.length > 4000)) { plainError(response, 400, 'Review notes must be 4,000 characters or fewer.'); return; }
        const content = await repository.reviewTechnical({ id: techMatch[1], revisionId: body.revisionId, expectedVersion: body.expectedVersion, decision: body.decision, note: body.note || '', actorId: user.id });
        json(response, 200, { content }); return;
      }
      const publishMatch = pathname.match(/^\/api\/cms\/content\/([0-9a-f-]+)\/publish$/i);
      if (publishMatch && request.method === 'POST') {
        if (!requireRole('publisher','admin') || !requireCsrf()) return;
        const body = await readJson(request);
        if (body.confirmPublish !== true || !validId(body.revisionId) || !Number.isInteger(body.expectedVersion)) { plainError(response, 400, 'Confirm the current revision before publishing.'); return; }
        const current = await repository.getContent(publishMatch[1]);
        if (!current) { plainError(response, 404, 'Content record not found.'); return; }
        if (current.version !== body.expectedVersion || current.revision?.id !== body.revisionId || body.confirmRevisionId !== body.revisionId) { plainError(response, 409, 'Publishing requires explicit confirmation of the current revision. Reload and confirm again.'); return; }
        const requiredStatus = current.type === 'machine' ? 'ready_to_publish' : 'review_requested';
        if (current.revision?.status !== requiredStatus) { plainError(response, 409, 'This revision has not completed its required reviews.'); return; }
        const job = await repository.createPublicationJob({ actorId: user.id, contentId: current.id, revisionId: body.revisionId });
        json(response, 202, { job });
        setImmediate(async () => {
          try {
            await repository.updatePublicationJob({ id: job.id, status: 'building', progress: 25, message: 'Building localized page records and search indexes.' });
            await repository.publish({ id: current.id, revisionId: body.revisionId, expectedVersion: body.expectedVersion, confirmedRevisionId: body.confirmRevisionId, actorId: user.id });
            const active = await repository.getActivePublication?.();
            await repository.updatePublicationJob({ id: job.id, status: 'active', progress: 100, message: 'The complete content release is active.', releaseId: active?.id || null });
          } catch (error) {
            await repository.updatePublicationJob({ id: job.id, status: 'failed', progress: 100, message: error.code === 'REVIEW_REQUIRED' ? 'Required review is missing for this exact revision.' : 'The release build failed. The previous public release remains active.' }).catch(() => {});
          }
        });
        return;
      }
      const previewMatch = pathname.match(/^\/api\/cms\/preview\/([0-9a-f-]+)$/i);
      if (previewMatch && request.method === 'GET') {
        if (!requireUser()) return;
        const revisionId = url.searchParams.get('revision') || undefined;
        if (revisionId && !validId(revisionId)) { plainError(response, 400, 'Invalid revision identifier.'); return; }
        const preview = await repository.getPrivateRevision(previewMatch[1], revisionId);
        if (!preview) { plainError(response, 404, 'Preview not found.'); return; }
        const locale = LOCALES.includes(url.searchParams.get('lang')) ? url.searchParams.get('lang') : 'en';
        const registry = readSiteRegistry();
        const routeEntry = registry?.entries.find(entry => entry.paths.en === preview.item.route);
        if (routeEntry) {
          const templatePath = registry.fileFor(routeEntry.routeKey, locale);
          const template = await readFile(templatePath, 'utf8');
          const nonce = randomBytes(18).toString('base64');
          const copy = { en:'Private staff preview', zh:'员工私密预览', ms:'Pratonton kakitangan peribadi' }[locale];
          const values = JSON.stringify({ fields: preview.revision.fields, locale, title: titleFromFields(preview.revision.fields, locale), preview: copy, route: preview.item.route, revision: preview.revision.revisionNumber }).replace(/</g, '\\u003c');
          let rendered = template.replace(/<head\b([^>]*)>/i, `<head$1><base href="/"><meta name="robots" content="noindex,nofollow"><link rel="stylesheet" href="/cms/preview.css">`);
          rendered = rendered.replace(/<body\b([^>]*)>/i, `<body$1><aside class="cms-preview-banner"><strong>LS CMS · ${escapeHtml(copy)}</strong><span>${escapeHtml(preview.item.route)} · ${locale.toUpperCase()} · revision ${preview.revision.revisionNumber}</span><a href="/cms/">Return to CMS</a></aside>`);
          rendered = rendered.replace(/<\/body>/i, `<script id="cms-preview-data" type="application/json">${values}</script><script src="/cms/preview-bridge.js" nonce="${nonce}" defer></script></body>`);
          response.writeHead(200, {
            'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'private, no-store',
            'X-Content-Type-Options':'nosniff', 'X-Robots-Tag':'noindex, nofollow',
            'Content-Security-Policy':`default-src 'self' data: https:; img-src 'self' data: https:; media-src 'self' https:; style-src 'self' 'unsafe-inline' https:; script-src 'self' 'nonce-${nonce}' https:; connect-src 'self' https:; base-uri 'self'; frame-ancestors 'self'; form-action 'self'`
          });
          response.end(rendered);
          return;
        }
        const copy = {
          en: { lang:'en', privatePreview:'Private preview', returnToCms:'Return to CMS', draftPreview:'Draft preview · visible only to signed-in staff', revision:'Revision' },
          zh: { lang:'zh-Hans', privatePreview:'私密预览', returnToCms:'返回 CMS', draftPreview:'草稿预览 · 仅登录员工可见', revision:'修订' },
          ms: { lang:'ms', privatePreview:'Pratonton peribadi', returnToCms:'Kembali ke CMS', draftPreview:'Pratonton draf · hanya kakitangan yang log masuk boleh melihat', revision:'Pindaan' }
        }[locale];
        const title = escapeHtml(titleFromFields(preview.revision.fields, locale));
        const summary = escapeHtml(textFromFields(preview.revision.fields, locale));
        html(response, 200, `<!doctype html><html lang="${copy.lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${title} · ${copy.privatePreview}</title><link rel="stylesheet" href="/cms/cms.css"><body class="preview-page"><header><span>LS CMS · ${copy.privatePreview}</span><a href="/cms/">${copy.returnToCms}</a></header><main><p>${escapeHtml(preview.item.route)} · ${copy.revision} ${preview.revision.revisionNumber}</p><h1>${title}</h1><p>${summary}</p><small>${copy.draftPreview}</small></main></body></html>`); return;
      }
      if (pathname === '/api/cms/media' && request.method === 'GET') {
        if (!requireUser()) return;
        json(response, 200, { media: await repository.listMedia() }); return;
      }
      if (pathname === '/api/cms/media' && request.method === 'POST') {
        if (!requireRole('editor','admin') || !requireCsrf()) return;
        const metadataText = url.searchParams.get('metadata');
        let metadata;
        try { metadata = JSON.parse(metadataText || ''); }
        catch { plainError(response, 400, 'Include media metadata in the request.'); return; }
        if (!PERMISSION_STATUSES.includes(metadata.permissionStatus) || !MATCH_STATUSES.includes(metadata.matchStatus)) { plainError(response, 400, 'Choose media permission and match statuses.'); return; }
        if (typeof metadata.sourceUrl !== 'string' || metadata.sourceUrl.length > 1000) { plainError(response, 400, 'Source must be 1,000 characters or fewer.'); return; }
        const altError = validateContent('food', { translations: metadata.altTexts });
        if (altError.error) { plainError(response, 400, `Alt text: ${altError.error}`); return; }
        const mimeType = request.headers['content-type']?.split(';')[0].trim().toLowerCase();
        const stored = await storeUpload(request, mediaRoot, mimeType);
        try {
          const media = await repository.addMedia({ ...stored, mimeType, sourceUrl: metadata.sourceUrl.trim(), permissionStatus: metadata.permissionStatus, matchStatus: metadata.matchStatus, altTexts: metadata.altTexts }, user.id);
          json(response, 201, { media });
        } catch (error) {
          await rm(path.join(mediaRoot, stored.storageKey), { force: true }).catch(() => {});
          throw error;
        }
        return;
      }
      const mediaMatch = pathname.match(/^\/api\/cms\/media\/([0-9a-f-]+)$/i);
      if (mediaMatch && request.method === 'GET') {
        if (!requireUser()) return;
        if (url.searchParams.get('details') === '1') {
          const details = await repository.getMediaDetails(mediaMatch[1]);
          if (!details) { plainError(response, 404, 'Media not found.'); return; }
          json(response, 200, { media: details }); return;
        }
        const media = await repository.getMedia(mediaMatch[1]);
        if (!media) { plainError(response, 404, 'Media not found.'); return; }
        await streamMedia(response, path.join(mediaRoot, path.basename(media.storageKey)), media.mimeType, true); return;
      }
      if (mediaMatch && request.method === 'PATCH') {
        if (!requireRole('editor','admin') || !requireCsrf()) return;
        const body = await readJson(request);
        if (!PERMISSION_STATUSES.includes(body.permissionStatus) || !MATCH_STATUSES.includes(body.matchStatus)) { plainError(response, 400, 'Choose media permission and match statuses.'); return; }
        if (typeof body.sourceUrl !== 'string' || body.sourceUrl.trim().length > 1000) { plainError(response, 400, 'Source must be 1,000 characters or fewer.'); return; }
        if (!body.altTexts || typeof body.altTexts !== 'object' || Array.isArray(body.altTexts) || LOCALES.some(locale => typeof body.altTexts[locale]?.alt !== 'string' || body.altTexts[locale].alt.length > 1000)) { plainError(response, 400, 'Provide alternative text in English, Simplified Chinese and Malay.'); return; }
        const media = await repository.updateMediaMetadata(mediaMatch[1], { ...body, sourceUrl: body.sourceUrl.trim() }, user.id);
        if (!media) { plainError(response, 404, 'Media not found.'); return; }
        json(response, 200, { media: await repository.getMediaDetails(mediaMatch[1]) }); return;
      }
      const auditMatch = pathname === '/api/cms/audit' && request.method === 'GET';
      if (auditMatch) {
        if (!requireRole('admin')) return;
        json(response, 200, { events: await repository.listAuditEvents() }); return;
      }
      if (pathname.startsWith('/api/')) { request.resume(); plainError(response, 404, 'API route not found.'); return; }
      if (request.method !== 'GET' && request.method !== 'HEAD') { request.resume(); plainError(response, 405, 'Method not allowed.'); return; }
      plainError(response, 404, 'Not found.');
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      const { status, message } = publicError(error);
      json(response, status, { error: message });
    }
  });
  return server;
}

async function streamMedia(response, filePath, mimeType, isPrivate) {
  try {
    const handle = await open(filePath, 'r');
    const stats = await handle.stat();
    await handle.close();
    response.writeHead(200, {
      'Content-Type': mimeType,
      'Content-Length': stats.size,
      'Content-Disposition': mimeType === 'application/pdf' ? 'attachment' : 'inline',
      'Cache-Control': isPrivate ? 'private, no-store' : 'public, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'same-origin'
    });
    createReadStream(filePath).pipe(response);
  } catch {
    plainError(response, 404, 'Media file not found.');
  }
}

async function main() {
  const secret = process.env.CMS_SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) throw new Error('Set CMS_SESSION_SECRET to a random value of at least 32 bytes.');
  const { Pool } = await import('pg');
  const pool = new Pool({
    host: process.env.CMS_DB_HOST || '127.0.0.1',
    port: Number(process.env.CMS_DB_PORT || 5432),
    database: process.env.CMS_DB_NAME || 'ls_cms',
    user: process.env.CMS_DB_USER || 'ls_cms',
    password: process.env.CMS_DB_PASSWORD,
    max: Number(process.env.CMS_DB_POOL_SIZE || 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000
  });
  const repository = new PgRepository(pool);
  await repository.migrate();
  const server = createCmsServer({
    repository, csrfSecret: secret, secureCookies: process.env.CMS_SECURE_COOKIE === '1',
    mediaRoot: path.resolve(process.env.CMS_DATA_DIR || path.join(here, '..', 'data'), 'media')
  });
  const host = process.env.CMS_HOST || '127.0.0.1';
  const port = Number(process.env.CMS_PORT || 8412);
  server.listen(port, host, () => console.log(`LS CMS listening on http://${host}:${port}/cms/`));
  const shutdown = () => server.close(() => pool.end().finally(() => process.exit(0)));
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}

