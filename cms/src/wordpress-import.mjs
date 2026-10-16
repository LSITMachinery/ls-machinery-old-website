import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const DEFAULT_XML_LIMIT = 32 * 1024 * 1024;
const DEFAULT_NODE_LIMIT = 100_000;
const DEFAULT_ITEM_LIMIT = 25_000;
const DEFAULT_FILE_LIMIT = 100_000;
const DEFAULT_ARCHIVE_LIMIT = 128 * 1024 * 1024;
const DEFAULT_EXPANDED_LIMIT = 512 * 1024 * 1024;

/**
 * Parse a standard WordPress WXR export without loading XML libraries or resolving
 * external entities. The output is an inventory only; it is never written to a CMS.
 *
 * @param {string|Buffer|Uint8Array} input
 * @param {{ localMediaFiles?: Array<string|{path?:string,sourceUrl?:string}>, siteOrigin?: string, maxBytes?: number, maxNodes?: number, maxItems?: number }} [options]
 */
export function parseWordPressWxr(input, options = {}) {
  const xml = decodeXmlInput(input, options.maxBytes ?? DEFAULT_XML_LIMIT);
  const document = parseXml(xml, { maxNodes: options.maxNodes ?? DEFAULT_NODE_LIMIT });
  const channel = findDescendant(document, 'channel');
  if (!channel) throw new TypeError('The XML document does not contain a WordPress WXR channel.');

  const channelOrigin = safeOrigin(options.siteOrigin)
    || safeOrigin(childText(channel, 'wp:base_blog_url'))
    || safeOrigin(childText(channel, 'link'));
  const categories = channel.children.filter(node => ['wp:category', 'wp:tag', 'wp:term'].includes(node.name)).map(node => ({
    sourceTaxonomy: node.name.slice(3),
    id: childText(node, 'wp:term_id') || null,
    name: childText(node, 'wp:cat_name') || childText(node, 'wp:tag_name') || childText(node, 'wp:term_name') || null,
    slug: childText(node, 'wp:category_nicename') || childText(node, 'wp:tag_slug') || childText(node, 'wp:term_slug') || null,
    parent: childText(node, 'wp:category_parent') || null,
    description: childText(node, 'wp:category_description') || childText(node, 'wp:tag_description') || childText(node, 'wp:term_description') || ''
  }));

  const items = channel.children.filter(node => node.name === 'item');
  if (items.length > (options.maxItems ?? DEFAULT_ITEM_LIMIT)) throw new RangeError('The WXR export contains too many items.');
  const records = [];
  const unsupported = [];
  const conflicts = [];
  const seenIdentities = new Set();

  for (const [index, item] of items.entries()) {
    const postType = childText(item, 'wp:post_type') || 'post';
    const sourceId = childText(item, 'wp:post_id');
    const title = childText(item, 'title');
    const originalUrl = childText(item, 'link') || null;
    const originalGuid = childText(item, 'guid') || null;
    const postName = childText(item, 'wp:post_name') || null;
    const sourceStatus = childText(item, 'wp:status') || null;
    const content = childText(item, 'content:encoded');
    const excerpt = childText(item, 'excerpt:encoded');
    const taxonomyTerms = item.children.filter(node => node.name === 'category').map(node => ({
      taxonomy: node.attributes.domain || 'category',
      slug: node.attributes.nicename || null,
      name: textContent(node).trim()
    }));
    const meta = item.children.filter(node => node.name === 'wp:postmeta').map(node => ({
      key: childText(node, 'wp:meta_key'),
      value: childText(node, 'wp:meta_value')
    })).filter(entry => entry.key);
    const attachmentUrl = childText(item, 'wp:attachment_url') || null;
    const attachedFile = meta.find(entry => entry.key === '_wp_attached_file')?.value || null;
    const identity = sourceId ? `wordpress:${postType}:${sourceId}` : null;
    if (identity && seenIdentities.has(identity)) conflicts.push({ code: 'DUPLICATE_SOURCE_ID', identity, recordIndex: index, message: 'The WXR export repeats this post type and source ID; review before importing.' });
    if (identity) seenIdentities.add(identity);
    const record = {
      source: { platform: 'wordpress', type: postType, id: sourceId || null, identity },
      kind: postType === 'page' ? 'page' : postType === 'post' ? 'post' : postType === 'attachment' ? 'media' : 'unsupported',
      title,
      slug: postName,
      sourceStatus,
      originalUrl,
      originalGuid,
      content,
      excerpt,
      terms: taxonomyTerms,
      categories: taxonomyTerms.filter(term => term.taxonomy === 'category'),
      attachment: postType === 'attachment' ? { url: attachmentUrl, relativePath: safeRelativeMediaPath(attachedFile) } : null,
      sourceMeta: meta,
      sourceChecksum: sha256Buffer(Buffer.from(stableSourceRecord({ postType, sourceId, originalUrl, title, postName, sourceStatus, content, excerpt, taxonomyTerms, attachmentUrl, attachedFile })))
    };
    records.push(record);

    if (!sourceId) conflicts.push({ code: 'MISSING_SOURCE_ID', recordIndex: index, identity: null, message: 'WXR item has no wp:post_id; it cannot be safely matched on a later import.' });
    if (!['page', 'post', 'attachment'].includes(postType)) {
      unsupported.push({ code: 'UNSUPPORTED_POST_TYPE', identity, recordIndex: index, postType, title, originalUrl, message: `Post type "${postType}" needs an explicit migration mapping.` });
    }
    for (const term of taxonomyTerms) {
      if (!['category', 'post_tag'].includes(term.taxonomy)) unsupported.push({ code: 'UNSUPPORTED_TAXONOMY', identity, recordIndex: index, taxonomy: term.taxonomy, message: `Taxonomy "${term.taxonomy}" is preserved in the inventory but needs a migration mapping.` });
    }
  }

  const mediaReferences = collectMediaReferences(records, channelOrigin);
  const localMedia = options.localMediaFiles === undefined ? null : normalizeMediaInventory(options.localMediaFiles);
  if (localMedia) {
    for (const ref of mediaReferences) {
      if (ref.local && !matchesMedia(ref, localMedia)) conflicts.push({
        code: 'MISSING_MEDIA',
        identity: ref.identity,
        url: ref.url,
        path: ref.relativePath,
        message: 'Referenced WordPress media was not found in the supplied uploads inventory.'
      });
    }
  }

  return {
    format: 'wordpress-wxr',
    source: { origin: channelOrigin, siteTitle: childText(channel, 'title') || null },
    counts: {
      items: records.length,
      pages: records.filter(record => record.kind === 'page').length,
      posts: records.filter(record => record.kind === 'post').length,
      attachments: records.filter(record => record.kind === 'media').length,
      unsupported: unsupported.length,
      categories: categories.length,
      mediaReferences: mediaReferences.length
    },
    categories,
    records,
    mediaReferences,
    unsupported,
    conflicts
  };
}

/** Read a WXR file only when it is an ordinary file inside the chosen staging root. */
export function readWordPressWxrFromStaging(stagingRoot, wxrPath, options = {}) {
  const safePath = resolveStagedFile(stagingRoot, wxrPath);
  const stat = fs.statSync(safePath);
  if (stat.size > (options.maxBytes ?? DEFAULT_XML_LIMIT)) throw new RangeError('The WXR file exceeds the configured size limit.');
  return parseWordPressWxr(fs.readFileSync(safePath), options);
}

/**
 * Inventory an already-extracted cPanel/WordPress backup. Symlinks are never
 * followed. SQL and PHP are listed as files for review only; neither is executed.
 */
export function inventoryCpanelStagingDirectory(stagingRoot, options = {}) {
  const root = fs.realpathSync(stagingRoot);
  const maxFiles = options.maxFiles ?? DEFAULT_FILE_LIMIT;
  const maxDepth = options.maxDepth ?? 40;
  const files = [];
  const issues = [];
  const stack = [{ absolute: root, relative: '', depth: 0 }];
  while (stack.length) {
    const current = stack.pop();
    if (current.depth > maxDepth) {
      issues.push({ code: 'DIRECTORY_DEPTH_LIMIT', path: current.relative });
      continue;
    }
    for (const entry of fs.readdirSync(current.absolute, { withFileTypes: true })) {
      const relative = current.relative ? `${current.relative}/${entry.name}` : entry.name;
      const absolute = path.join(current.absolute, entry.name);
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        issues.push({ code: 'SYMLINK_SKIPPED', path: relative });
        continue;
      }
      if (stat.isDirectory()) {
        stack.push({ absolute, relative, depth: current.depth + 1 });
        continue;
      }
      if (!stat.isFile()) {
        issues.push({ code: 'NON_REGULAR_FILE_SKIPPED', path: relative });
        continue;
      }
      if (files.length >= maxFiles) throw new RangeError('The cPanel staging directory contains too many files.');
      files.push({ path: relative.replaceAll('\\', '/'), size: stat.size, category: classifyBackupFile(relative) });
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  return {
    format: 'cpanel-extracted-directory',
    files,
    counts: {
      files: files.length,
      wxr: files.filter(file => file.category === 'wordpress-export').length,
      sql: files.filter(file => file.category === 'sql-review-only').length,
      media: files.filter(file => file.category === 'media').length,
      php: files.filter(file => file.category === 'php-review-only').length
    },
    issues,
    notes: ['SQL files are inventoried only and are never applied to the CMS database.', 'PHP files are inventoried only and are never executed.']
  };
}

/**
 * List safe entries in an uncompressed .tar or .tar.gz/.tgz archive. This does
 * not extract entries. The archive itself must be an ordinary file inside the
 * caller-provided staging directory. ZIP, RAR and proprietary cPanel formats
 * are deliberately unsupported by this dependency-free reader.
 */
export function listCpanelTarArchive(stagingRoot, archivePath, options = {}) {
  const stagedPath = resolveStagedFile(stagingRoot, archivePath);
  const archiveStat = fs.statSync(stagedPath);
  const maxArchiveBytes = options.maxArchiveBytes ?? DEFAULT_ARCHIVE_LIMIT;
  const maxExpandedBytes = options.maxExpandedBytes ?? DEFAULT_EXPANDED_LIMIT;
  if (archiveStat.size > maxArchiveBytes) throw new RangeError('The cPanel archive exceeds the configured compressed size limit.');
  const raw = fs.readFileSync(stagedPath);
  const lower = stagedPath.toLowerCase();
  let tar;
  if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
    try {
      tar = gunzipSync(raw, { maxOutputLength: maxExpandedBytes });
    } catch (error) {
      if (error?.code === 'ERR_BUFFER_TOO_LARGE') throw new RangeError('The cPanel archive expands beyond the configured size limit.');
      throw new TypeError('The cPanel gzip archive is invalid.');
    }
  } else if (lower.endsWith('.tar')) tar = raw;
  else throw new TypeError('Only .tar, .tar.gz and .tgz archives can be listed.');
  if (tar.length > maxExpandedBytes) throw new RangeError('The cPanel archive expands beyond the configured size limit.');
  return listTarEntries(tar, options.maxEntries ?? DEFAULT_FILE_LIMIT);
}

/** Compute an asset checksum for byte-identical de-duplication. */
export function sha256Buffer(value) {
  if (!(typeof value === 'string' || Buffer.isBuffer(value) || value instanceof Uint8Array)) throw new TypeError('Checksum input must be a string or byte array.');
  return createHash('sha256').update(value).digest('hex');
}

/** Create stable source provenance for an imported content record. */
export function createContentProvenance({ platform = 'wordpress', sourceType, sourceId, sourceUrl = null, originalGuid = null, checksum }) {
  if (!['wordpress', 'cpanel-wordpress'].includes(platform)) throw new TypeError('Unsupported migration source platform.');
  if (typeof sourceType !== 'string' || !sourceType.trim()) throw new TypeError('sourceType is required.');
  if (sourceId === undefined || sourceId === null || String(sourceId).trim() === '') throw new TypeError('sourceId is required for stable provenance.');
  if (checksum && !/^[a-f0-9]{64}$/i.test(checksum)) throw new TypeError('checksum must be a SHA-256 hex digest.');
  return Object.freeze({ platform, sourceType, sourceId: String(sourceId), sourceKey: `${platform}:${sourceType}:${sourceId}`, sourceUrl, originalGuid, checksum: checksum?.toLowerCase() || null });
}

/**
 * Plan an idempotent asset import by checksum. Existing records may contain
 * checksum, sourceUrl and source identifiers; this helper does not mutate them.
 */
export function planAssetImport(incomingAssets, existingAssets = []) {
  const existingByChecksum = new Map();
  for (const asset of existingAssets) {
    const checksum = normalizeChecksum(asset.checksum);
    if (checksum && !existingByChecksum.has(checksum)) existingByChecksum.set(checksum, asset);
  }
  const seenIncoming = new Map();
  const toImport = [];
  const reuse = [];
  const duplicates = [];
  for (const asset of incomingAssets) {
    const checksum = normalizeChecksum(asset.checksum);
    if (!checksum) throw new TypeError('Every asset needs a SHA-256 checksum before de-duplication.');
    if (existingByChecksum.has(checksum)) {
      reuse.push({ incoming: asset, existing: existingByChecksum.get(checksum), checksum });
    } else if (seenIncoming.has(checksum)) {
      duplicates.push({ incoming: asset, first: seenIncoming.get(checksum), checksum });
    } else {
      seenIncoming.set(checksum, asset);
      toImport.push(asset);
    }
  }
  return { toImport, reuse, duplicates };
}

/** Classify repeat-import records without overwriting an editor-curated record. */
export function planWordPressRecordImport(incomingRecords, existingRecords = []) {
  const existingByKey = new Map(existingRecords.map(record => [record.provenance?.sourceKey || record.source?.identity, record]).filter(([key]) => key));
  const createDrafts = [];
  const unchanged = [];
  const updateDrafts = [];
  const conflicts = [];
  for (const incoming of incomingRecords) {
    const key = incoming.source?.identity || (incoming.source?.id ? `wordpress:${incoming.source.type}:${incoming.source.id}` : null);
    if (!key) {
      conflicts.push({ code: 'MISSING_SOURCE_IDENTITY', incoming, message: 'Cannot safely re-import this record without a WordPress source ID.' });
      continue;
    }
    const existing = existingByKey.get(key);
    if (!existing) {
      createDrafts.push(incoming);
      continue;
    }
    if (existing.provenance?.checksum === incoming.sourceChecksum) {
      unchanged.push({ incoming, existing });
    } else if (existing.curated === true || existing.provenance?.curated === true) {
      conflicts.push({ code: 'CURATED_RECORD_PRESERVED', incoming, existing, message: 'The existing curated record is preserved for review.' });
    } else {
      updateDrafts.push({ incoming, existing });
    }
  }
  return { createDrafts, unchanged, updateDrafts, conflicts };
}

// Lightweight XML tree parser. External DTD/entity declarations are rejected;
// only the five predefined XML entities and numeric character references decode.
function parseXml(xml, { maxNodes }) {
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw new TypeError('WXR document types and entity declarations are not accepted.');
  const tokens = xml.match(/<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<[^>]*>|[^<]+/g) || [];
  if (tokens.join('') !== xml) throw new TypeError('The WXR XML contains malformed markup.');
  const root = { name: '#document', attributes: {}, children: [], parts: [] };
  const stack = [root];
  let nodes = 0;
  for (const token of tokens) {
    if (token.startsWith('<!--') || token.startsWith('<?')) continue;
    if (token.startsWith('<![CDATA[')) {
      stack.at(-1).parts.push(token.slice(9, -3));
      continue;
    }
    if (token.startsWith('</')) {
      const match = /^<\/([A-Za-z_][\w:.-]*)\s*>$/.exec(token);
      if (!match || stack.length === 1 || stack.at(-1).name !== match[1]) throw new TypeError('The WXR XML has mismatched closing tags.');
      stack.pop();
      continue;
    }
    if (token.startsWith('<!')) throw new TypeError('Unsupported XML declaration in WXR.');
    if (token.startsWith('<')) {
      const match = /^<([A-Za-z_][\w:.-]*)([\s\S]*?)\s*(\/?)>$/.exec(token);
      if (!match) throw new TypeError('The WXR XML contains a malformed start tag.');
      const node = { name: match[1], attributes: parseAttributes(match[2]), children: [], parts: [] };
      stack.at(-1).children.push(node);
      stack.at(-1).parts.push(node);
      nodes += 1;
      if (nodes > maxNodes) throw new RangeError('The WXR XML contains too many elements.');
      if (!match[3]) {
        stack.push(node);
        if (stack.length > 130) throw new RangeError('The WXR XML nesting is too deep.');
      }
      continue;
    }
    stack.at(-1).parts.push(decodeXmlEntities(token));
  }
  if (stack.length !== 1) throw new TypeError('The WXR XML has unclosed elements.');
  return root;
}

function parseAttributes(source) {
  const attributes = {};
  let rest = source;
  while (rest.trim()) {
    const match = /^\s+([A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/.exec(rest);
    if (!match) throw new TypeError('The WXR XML contains a malformed attribute.');
    if (Object.hasOwn(attributes, match[1])) throw new TypeError('The WXR XML contains a duplicate attribute.');
    attributes[match[1]] = decodeXmlEntities(match[2] ?? match[3]);
    rest = rest.slice(match[0].length);
  }
  return attributes;
}

function decodeXmlEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|[A-Za-z][\w.-]*);|&/g, (entity, name) => {
    if (!name) throw new TypeError('The WXR XML contains an unescaped ampersand.');
    if (name === 'amp') return '&';
    if (name === 'lt') return '<';
    if (name === 'gt') return '>';
    if (name === 'quot') return '"';
    if (name === 'apos') return "'";
    if (!name.startsWith('#x') && !name.startsWith('#')) throw new TypeError('Unsupported XML entity: ' + entity);
    const codepoint = name.startsWith('#x') ? Number.parseInt(name.slice(2), 16) : Number.parseInt(name.slice(1), 10);
    if (!Number.isInteger(codepoint) || codepoint <= 0 || codepoint > 0x10ffff || (codepoint >= 0xd800 && codepoint <= 0xdfff)) throw new TypeError(`Invalid XML character reference: ${entity}`);
    return String.fromCodePoint(codepoint);
  });
}

function textContent(node) {
  return node.parts.map(part => typeof part === 'string' ? part : textContent(part)).join('');
}
function child(node, name) { return node.children.find(entry => entry.name === name) || null; }
function childText(node, name) { const found = child(node, name); return found ? textContent(found).trim() : ''; }
function findDescendant(node, name) {
  if (node.name === name) return node;
  for (const item of node.children) { const found = findDescendant(item, name); if (found) return found; }
  return null;
}
function decodeXmlInput(input, maxBytes) {
  const bytes = Buffer.isBuffer(input) ? input : input instanceof Uint8Array ? Buffer.from(input) : Buffer.from(String(input), 'utf8');
  if (bytes.length > maxBytes) throw new RangeError('The WXR export exceeds the configured size limit.');
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes).replace(/^\uFEFF/, ''); }
  catch { throw new TypeError('The WXR export must be valid UTF-8.'); }
}
function stableSourceRecord(value) { return JSON.stringify(value); }
function safeOrigin(value) { try { return value ? new URL(value).origin : null; } catch { return null; } }
function safeRelativeMediaPath(value) {
  if (!value) return null;
  const normalized = String(value).replaceAll('\\', '/').replace(/^\/+/, '');
  if (normalized.split('/').includes('..') || /^[A-Za-z]:/.test(normalized)) return null;
  return normalized;
}
function normalizeMediaInventory(files) {
  const paths = new Set(); const urls = new Set();
  for (const entry of files) {
    const value = typeof entry === 'string' ? { path: entry } : entry || {};
    const safePath = safeRelativeMediaPath(value.path);
    if (safePath) paths.add(normalizeMediaPath(safePath));
    const url = normalizeUrl(value.sourceUrl);
    if (url) urls.add(url);
  }
  return { paths, urls };
}
function normalizeMediaPath(value) {
  let normalized;
  try { normalized = decodeURIComponent(value); }
  catch { normalized = value; }
  normalized = normalized.replaceAll('\\', '/').replace(/^\/+/, '').toLowerCase();
  const uploadsIndex = normalized.lastIndexOf('/uploads/');
  if (uploadsIndex >= 0) normalized = normalized.slice(uploadsIndex + 1);
  return normalized;
}
function normalizeUrl(value) { try { const url = new URL(value); url.hash = ''; return url.href.replace(/\/$/, '').toLowerCase(); } catch { return null; } }
function collectMediaReferences(records, sourceOrigin) {
  const refs = [];
  for (const record of records) {
    if (record.attachment?.url) refs.push(makeMediaReference(record, record.attachment.url, sourceOrigin, true));
    for (const content of [record.content, record.excerpt]) {
      if (!content) continue;
      const tags = content.match(/<(?:img|video|audio|source|track|input)\b[^>]*>/gi) || [];
      for (const tag of tags) {
        for (const match of tag.matchAll(/\b(?:src|poster)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi)) {
          const url = (match[1] || match[2] || match[3] || '').trim();
          if (url) refs.push(makeMediaReference(record, url, sourceOrigin, false));
        }
      }
    }
  }
  const seen = new Set();
  return refs.filter(ref => { const key = `${ref.identity || ''}\u0000${ref.url}`; if (seen.has(key)) return false; seen.add(key); return true; });
}
function makeMediaReference(record, value, sourceOrigin, isAttachment) {
  let url = null; let relativePath = null; let local = false;
  try {
    if (value.startsWith('//')) value = `https:${value}`;
    if (/^[a-z][a-z\d+.-]*:/i.test(value)) {
      const parsed = new URL(value);
      url = parsed.href;
      local = Boolean(sourceOrigin && parsed.origin === sourceOrigin) || (isAttachment && !sourceOrigin);
      relativePath = uploadsPath(parsed.pathname);
    } else {
      relativePath = safeRelativeMediaPath(value.split(/[?#]/, 1)[0]);
      local = Boolean(relativePath);
    }
  } catch { /* malformed media references remain in the source content, not the inventory */ }
  return { identity: record.source.identity, url: url || value, relativePath, local };
}
function uploadsPath(pathname) {
  const decoded = (() => { try { return decodeURIComponent(pathname); } catch { return pathname; } })().replaceAll('\\', '/');
  const index = decoded.toLowerCase().lastIndexOf('/uploads/');
  return index >= 0 ? safeRelativeMediaPath(decoded.slice(index + 1)) : null;
}
function matchesMedia(ref, inventory) {
  const normalizedUrl = normalizeUrl(ref.url);
  if (normalizedUrl && inventory.urls.has(normalizedUrl)) return true;
  return Boolean(ref.relativePath && inventory.paths.has(normalizeMediaPath(ref.relativePath)));
}
function normalizeChecksum(value) { return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null; }
function classifyBackupFile(relative) {
  const lower = relative.toLowerCase();
  if (lower.endsWith('.xml') && /wordpress|wxr|export/i.test(path.basename(lower))) return 'wordpress-export';
  if (/\.sql(?:\.gz)?$/.test(lower)) return 'sql-review-only';
  if (lower.endsWith('.php')) return 'php-review-only';
  if (/(?:^|\/)uploads?\//.test(lower) || /\.(?:jpe?g|png|gif|webp|avif|svg|mp4|webm|mov|pdf)$/i.test(lower)) return 'media';
  if (/\.(?:zip|tar|tgz|gz|7z|rar)$/.test(lower)) return 'archive-not-extracted';
  return 'other';
}
function resolveStagedFile(stagingRoot, requestedPath) {
  const root = fs.realpathSync(stagingRoot);
  const target = path.resolve(root, requestedPath);
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === '..' || path.isAbsolute(relative)) throw new TypeError('The requested file must be inside the staging directory.');
  const stat = fs.lstatSync(target);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new TypeError('The staged input must be a regular file, not a symlink.');
  const real = fs.realpathSync(target);
  const realRelative = path.relative(root, real);
  if (realRelative.startsWith(`..${path.sep}`) || realRelative === '..' || path.isAbsolute(realRelative)) throw new TypeError('The requested file resolves outside the staging directory.');
  return real;
}

function listTarEntries(tar, maxEntries) {
  const entries = [];
  const issues = [];
  let offset = 0;
  let pendingPath = null;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    if (!validTarChecksum(header)) throw new TypeError('The cPanel tar archive has an invalid header checksum.');
    const name = tarString(header, 0, 100);
    const prefix = tarString(header, 345, 155);
    const headerPath = prefix ? `${prefix}/${name}` : name;
    const size = tarOctal(header.subarray(124, 136));
    if (size === null || size < 0) throw new TypeError('The cPanel tar archive has an unsupported entry size.');
    const type = String.fromCharCode(header[156] || 48);
    const dataStart = offset + 512;
    const dataEnd = dataStart + size;
    if (dataEnd > tar.length) throw new TypeError('The cPanel tar archive is truncated.');
    const data = tar.subarray(dataStart, dataEnd);
    offset = dataStart + Math.ceil(size / 512) * 512;
    if (type === 'x' || type === 'g') {
      if (size > 1024 * 1024) { issues.push({ code: 'PAX_HEADER_TOO_LARGE', path: headerPath }); pendingPath = null; continue; }
      const pax = parsePax(data);
      if (type === 'x' && pax.path) pendingPath = pax.path;
      continue;
    }
    if (type === 'L') {
      pendingPath = tarString(data, 0, data.length);
      continue;
    }
    const entryPath = pendingPath || headerPath;
    pendingPath = null;
    const safeName = validateArchiveEntryPath(entryPath);
    if (!safeName) {
      issues.push({ code: 'UNSAFE_ARCHIVE_PATH_SKIPPED', path: entryPath });
      continue;
    }
    if (type === '1' || type === '2') {
      issues.push({ code: 'ARCHIVE_LINK_SKIPPED', path: safeName });
      continue;
    }
    if (!['0', '\0', '5', '7'].includes(type)) {
      issues.push({ code: 'UNSUPPORTED_ARCHIVE_ENTRY_SKIPPED', path: safeName, type });
      continue;
    }
    entries.push({ path: safeName, size, type: type === '5' ? 'directory' : 'file', category: classifyBackupFile(safeName) });
    if (entries.length > maxEntries) throw new RangeError('The cPanel archive contains too many entries.');
  }
  return { format: 'cpanel-tar-listing', entries, issues, extracted: false, counts: { entries: entries.length, files: entries.filter(entry => entry.type === 'file').length, directories: entries.filter(entry => entry.type === 'directory').length } };
}
function validTarChecksum(header) {
  const expected = tarOctal(header.subarray(148, 156));
  if (expected === null) return false;
  let sum = 0;
  for (let index = 0; index < header.length; index += 1) sum += index >= 148 && index < 156 ? 32 : header[index];
  return sum === expected;
}
function tarString(buffer, start, length) { const value = buffer.subarray(start, start + length); const nul = value.indexOf(0); return value.subarray(0, nul < 0 ? value.length : nul).toString('utf8').trimEnd(); }
function tarOctal(buffer) {
  const value = buffer.toString('ascii').replace(/\0.*$/, '').trim();
  if (!value) return 0;
  if (!/^[0-7]+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 8);
  return Number.isSafeInteger(parsed) ? parsed : null;
}
function validateArchiveEntryPath(value) {
  if (typeof value !== 'string' || !value || value.includes('\0') || value.includes('\\') || value.startsWith('/') || /^[A-Za-z]:/.test(value)) return null;
  const segments = value.split('/');
  while (segments[0] === '.') segments.shift();
  if (segments.some(segment => segment === '..' || segment === '.')) return null;
  return segments.filter(Boolean).join('/');
}
function parsePax(data) {
  const result = {};
  let offset = 0;
  while (offset < data.length) {
    const space = data.indexOf(32, offset);
    if (space < 0) break;
    const length = Number.parseInt(data.subarray(offset, space).toString('ascii'), 10);
    if (!Number.isInteger(length) || length <= space - offset + 1 || offset + length > data.length) break;
    const record = data.subarray(space + 1, offset + length).toString('utf8').replace(/\n$/, '');
    const equals = record.indexOf('=');
    if (equals > 0) result[record.slice(0, equals)] = record.slice(equals + 1);
    offset += length;
  }
  return result;
}

