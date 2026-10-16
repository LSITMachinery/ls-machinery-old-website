import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
export const SITE_ROOT = path.resolve(moduleDirectory, '../..');
export const SITE_LOCALES = Object.freeze(['en', 'zh', 'ms']);

/**
 * @typedef {'homepage'|'machine-catalogue'|'machine-category'|'machine-detail'|'food-catalogue'|'food-detail'|'segment'|'solutions-index'|'solution-detail'|'services-overview'|'service-detail'|'company'|'insights'|'inquiry'|'privacy'|'search'} SiteTemplate
 * @typedef {'en'|'zh'|'ms'} SiteLocale
 * @typedef {{ routeKey: string, template: SiteTemplate, paths: Readonly<Record<SiteLocale, string>>, generatedFiles: Readonly<Record<SiteLocale, string>> }} SiteRoute
 */

/** Classify an existing public route key without adding or deriving content. */
export function templateForRoute(routeKey) {
  if (routeKey === 'home') return 'homepage';
  if (routeKey === 'machines') return 'machine-catalogue';
  if (routeKey.startsWith('machines/')) return 'machine-category';
  if (routeKey.startsWith('machine/')) return 'machine-detail';
  if (routeKey === 'food') return 'food-catalogue';
  if (routeKey.startsWith('food/')) return 'food-detail';
  if (routeKey.startsWith('segment/')) return 'segment';
  if (routeKey === 'solutions') return 'solutions-index';
  if (routeKey.startsWith('solution/')) return 'solution-detail';
  if (routeKey === 'services') return 'services-overview';
  if (routeKey.startsWith('service/')) return 'service-detail';
  if (routeKey === 'company' || routeKey.startsWith('company/')) return 'company';
  if (routeKey === 'insights') return 'insights';
  if (routeKey === 'inquiry') return 'inquiry';
  if (routeKey === 'privacy') return 'privacy';
  if (routeKey === 'search') return 'search';
  throw new TypeError(`No site template is registered for route key: ${routeKey}`);
}

function canonicalPath(routeKey, locale) {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  if (routeKey === 'home') return `${prefix}/`;
  return `${prefix}/${routeKey}/`;
}

function generatedFile(routeKey, locale) {
  const localePrefix = locale === 'en' ? [] : [locale];
  return path.posix.join('public-pages', ...localePrefix, ...routeKey.split('/'), 'index.html');
}

function validateRouteKeys(routeKeys) {
  if (!Array.isArray(routeKeys) || routeKeys.length === 0) {
    throw new TypeError('The public route manifest must be a non-empty array.');
  }
  const seen = new Set();
  for (const routeKey of routeKeys) {
    if (typeof routeKey !== 'string' || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(routeKey)) {
      throw new TypeError(`Invalid public route key: ${String(routeKey)}`);
    }
    if (seen.has(routeKey)) throw new TypeError(`Duplicate public route key: ${routeKey}`);
    seen.add(routeKey);
    templateForRoute(routeKey);
  }
  if (!seen.has('home')) throw new TypeError('The public route manifest must include the home route.');
}

/**
 * Create the metadata registry from the generated public route manifest.
 * The records deliberately contain no titles, copy, machine claims or approvals.
 *
 * @param {{ rootDir?: string, publicPagesDir?: string, routeKeys?: string[], locales?: SiteLocale[] }} [options]
 */
export function createSiteRegistry(options = {}) {
  const rootDir = path.resolve(options.rootDir || SITE_ROOT);
  const publicPagesDir = path.resolve(options.publicPagesDir || path.join(rootDir, 'public-pages'));
  const manifestPath = path.join(publicPagesDir, 'routes.json');
  const routeKeys = options.routeKeys || JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const locales = [...(options.locales || SITE_LOCALES)];
  if (!locales.length || new Set(locales).size !== locales.length || locales.some(locale => !SITE_LOCALES.includes(locale))) {
    throw new TypeError(`Locales must be unique supported values: ${SITE_LOCALES.join(', ')}`);
  }
  validateRouteKeys(routeKeys);

  /** @type {SiteRoute[]} */
  const entries = routeKeys.map(routeKey => {
    const paths = {};
    const generatedFiles = {};
    for (const locale of locales) {
      paths[locale] = canonicalPath(routeKey, locale);
      generatedFiles[locale] = generatedFile(routeKey, locale);
    }
    return Object.freeze({
      routeKey,
      template: templateForRoute(routeKey),
      paths: Object.freeze(paths),
      generatedFiles: Object.freeze(generatedFiles)
    });
  });

  const byKey = new Map(entries.map(entry => [entry.routeKey, entry]));
  const byLocalizedPath = new Map();
  for (const entry of entries) {
    for (const locale of locales) {
      const normalizedPath = entry.paths[locale];
      if (byLocalizedPath.has(normalizedPath)) throw new TypeError(`Duplicate localized site path: ${normalizedPath}`);
      byLocalizedPath.set(normalizedPath, Object.freeze({ entry, locale, path: normalizedPath }));
    }
  }

  return Object.freeze({
    rootDir,
    publicPagesDir,
    locales: Object.freeze(locales),
    entries: Object.freeze(entries),
    routeCount: entries.length,
    pageCount: entries.length * locales.length,
    get(routeKey) {
      return byKey.get(routeKey) || null;
    },
    resolvePath(value) {
      let pathname;
      try {
        pathname = new URL(String(value), 'http://site-registry.local').pathname;
        pathname = decodeURIComponent(pathname);
      } catch {
        return null;
      }
      const normalized = pathname === '/' ? '/' : `/${pathname.replace(/^\/+|\/+$/g, '')}/`;
      return byLocalizedPath.get(normalized) || null;
    },
    fileFor(routeKey, locale) {
      const entry = byKey.get(routeKey);
      if (!entry || !locales.includes(locale)) return null;
      return path.resolve(rootDir, entry.generatedFiles[locale]);
    }
  });
}

/**
 * Check that each registered locale path has a generated HTML snapshot and that
 * the snapshot identifies the same language and source route key.
 */
export function assertGeneratedPageCoverage(registry = createSiteRegistry()) {
  const expectedHtmlLanguage = { en: 'en', zh: 'zh-Hans', ms: 'ms' };
  const problems = [];
  for (const entry of registry.entries) {
    for (const locale of registry.locales) {
      const filePath = registry.fileFor(entry.routeKey, locale);
      if (!filePath || !fs.existsSync(filePath)) {
        problems.push(`Missing snapshot: ${entry.generatedFiles[locale]}`);
        continue;
      }
      const html = fs.readFileSync(filePath, 'utf8').slice(0, 6000);
      const language = html.match(/<html\b[^>]*\blang="([^"]+)"/i)?.[1];
      const metadataRoute = html.match(/<html\b[^>]*\bdata-metadata-route="([^"]+)"/i)?.[1];
      if (language !== expectedHtmlLanguage[locale]) {
        problems.push(`Unexpected document language in ${entry.generatedFiles[locale]}: ${language || 'missing'}`);
      }
      if (metadataRoute !== entry.routeKey) {
        problems.push(`Unexpected metadata route in ${entry.generatedFiles[locale]}: ${metadataRoute || 'missing'}`);
      }
    }
  }
  if (problems.length) throw new Error(`Generated page coverage failed:\n${problems.join('\n')}`);
  return Object.freeze({ routeCount: registry.routeCount, pageCount: registry.pageCount, locales: registry.locales });
}

export const siteRegistry = createSiteRegistry();
