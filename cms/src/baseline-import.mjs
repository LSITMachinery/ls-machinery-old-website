import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createSiteRegistry, SITE_ROOT, assertGeneratedPageCoverage } from './site-registry.mjs';

const TYPE_BY_TEMPLATE = Object.freeze({
  homepage: 'home', 'machine-catalogue': 'machine', 'machine-category': 'machine', 'machine-detail': 'machine',
  'food-catalogue': 'food', 'food-detail': 'food', segment: 'segment', 'solutions-index': 'solution',
  'solution-detail': 'solution', 'services-overview': 'service', 'service-detail': 'service', company: 'company',
  insights: 'insight', inquiry: 'contact', privacy: 'privacy', search: 'search', 'video-library': 'video_library'
});

function decodeHtml(value) {
  return String(value || '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, code) => {
    if (code[0] === '#') {
      const number = code[1].toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : match;
    }
    return ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[code.toLowerCase()] || match;
  });
}

function plainText(markup) {
  return decodeHtml(String(markup || '').replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function elementText(html, tag, className) {
  const classPattern = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matcher = new RegExp(`<${tag}\\b(?=[^>]*\\bclass=["'][^"']*\\b${classPattern}\\b[^"']*["'])[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  return plainText(html.match(matcher)?.[1] || '');
}

function attributeValue(html, name) {
  const matcher = new RegExp(`<meta\\b(?=[^>]*\\bname=["']${name}["'])[^>]*\\bcontent=["']([^"']*)["']`, 'i');
  return decodeHtml(html.match(matcher)?.[1] || '');
}

function titleValue(html) {
  return plainText(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s*\|\s*LS Smart Machinery(?: Malaysia)?$/i, '').trim();
}

function localizedFields(html) {
  const heading = plainText(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const subtitle = elementText(html, 'p', 'machine-subtitle');
  const intro = elementText(html, 'p', 'lede');
  return {
    title: heading || titleValue(html),
    h1: heading,
    ...(subtitle ? { subtitle } : {}),
    ...(intro ? { intro } : {}),
    metaTitle: titleValue(html),
    metaDescription: attributeValue(html, 'description')
  };
}

function assetReferences(html) {
  return [...html.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].slice(0, 40).map(match => ({
    src: decodeHtml(match[1]),
    alt: decodeHtml(match[0].match(/\balt=["']([^"']*)["']/i)?.[1] || '')
  }));
}

export async function collectSiteBaseline({ rootDir = SITE_ROOT, registry = createSiteRegistry({ rootDir }) } = {}) {
  assertGeneratedPageCoverage(registry);
  const records = [];
  const assetHashes = new Map();
  for (const entry of registry.entries) {
    const translations = {};
    const sourceEvidence = [];
    const refs = new Map();
    for (const locale of registry.locales) {
      const sourcePath = registry.fileFor(entry.routeKey, locale);
      const bytes = await fs.readFile(sourcePath);
      const html = bytes.toString('utf8');
      translations[locale] = localizedFields(html);
      sourceEvidence.push({ kind: 'local-public-preview', locale, path: path.relative(rootDir, sourcePath).replaceAll('\\', '/'), sha256: createHash('sha256').update(bytes).digest('hex') });
      for (const reference of assetReferences(html)) {
        if (!reference.src || /^(?:https?:|data:|\/\/)/i.test(reference.src)) continue;
        const cleanPath = reference.src.split(/[?#]/, 1)[0].replace(/^\//, '');
        const localPath = path.resolve(rootDir, cleanPath);
        if (!localPath.startsWith(path.resolve(rootDir) + path.sep)) continue;
        const key = `${cleanPath}|${reference.alt}`;
        if (refs.has(key)) continue;
        let sha256 = assetHashes.get(localPath) || null;
        if (!assetHashes.has(localPath)) {
          try { sha256 = createHash('sha256').update(await fs.readFile(localPath)).digest('hex'); } catch { /* Retain the source reference even if the asset is missing locally. */ }
          assetHashes.set(localPath, sha256);
        }
        refs.set(key, { path: cleanPath, alt: reference.alt, sha256 });
      }
    }
    const routeKey = entry.routeKey;
    const slug = routeKey.split('/').at(-1) || 'home';
    const route = entry.paths.en;
    const type = TYPE_BY_TEMPLATE[entry.template];
    if (!type) throw new Error(`No CMS content type is mapped for route template ${entry.template}.`);
    records.push({
      type, slug, route,
      fields: { translations, mediaIds: [] },
      sourceEvidence: [{ kind: 'baseline-import', source: 'current local public preview', routeKey, assets: [...refs.values()] }, ...sourceEvidence]
    });
  }
  return records;
}
