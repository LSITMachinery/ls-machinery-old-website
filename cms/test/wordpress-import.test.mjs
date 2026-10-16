import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import test from 'node:test';
import {
  createContentProvenance,
  inventoryCpanelStagingDirectory,
  listCpanelTarArchive,
  parseWordPressWxr,
  planAssetImport,
  planWordPressRecordImport,
  readWordPressWxrFromStaging,
  sha256Buffer
} from '../src/wordpress-import.mjs';

const fixturePath = new URL('./fixtures/wordpress/sample-export.xml', import.meta.url);
const sampleWxr = fs.readFileSync(fixturePath);

test('WXR inventory preserves source IDs, original links, fields, terms and unsupported types', () => {
  const result = parseWordPressWxr(sampleWxr, { localMediaFiles: ['wp-content/uploads/2025/team.jpg'] });
  assert.equal(result.format, 'wordpress-wxr');
  assert.deepEqual(result.counts, { items: 4, pages: 1, posts: 1, attachments: 1, unsupported: 1, categories: 2, mediaReferences: 2 });
  const page = result.records.find(record => record.source.id === '11');
  assert.equal(page.source.identity, 'wordpress:page:11');
  assert.equal(page.originalUrl, 'https://example.test/about/');
  assert.equal(page.originalGuid, 'https://example.test/?page_id=11');
  assert.equal(page.slug, 'about');
  assert.equal(page.content, '<p>Safe sample copy.</p><img src="https://example.test/wp-content/uploads/2025/team.jpg" alt="Team">');
  assert.deepEqual(page.categories, [{ taxonomy: 'category', slug: 'bakery', name: 'Bakery' }]);
  const post = result.records.find(record => record.source.id === '22');
  assert.equal(post.kind, 'post');
  assert.equal(post.sourceStatus, 'draft');
  const attachment = result.records.find(record => record.source.id === '33');
  assert.deepEqual(attachment.attachment, { url: 'https://example.test/wp-content/uploads/2025/team.jpg', relativePath: '2025/team.jpg' });
  assert.equal(result.unsupported[0].code, 'UNSUPPORTED_POST_TYPE');
  assert.equal(result.unsupported[0].postType, 'ls_machine');
  assert.equal(result.conflicts.length, 0);
});

test('missing attachment files are explicit conflicts; media inventory is optional', () => {
  const absent = parseWordPressWxr(sampleWxr, { localMediaFiles: [] });
  assert.equal(absent.conflicts.filter(conflict => conflict.code === 'MISSING_MEDIA').length, 2);
  const noInventory = parseWordPressWxr(sampleWxr);
  assert.equal(noInventory.conflicts.some(conflict => conflict.code === 'MISSING_MEDIA'), false);
  const maliciousRelative = parseWordPressWxr(sampleWxr, { localMediaFiles: ['../outside/team.jpg'] });
  assert.equal(maliciousRelative.conflicts.filter(conflict => conflict.code === 'MISSING_MEDIA').length, 2);
});

test('WXR parser rejects DTDs, external entities and malformed structures', () => {
  assert.throws(() => parseWordPressWxr('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///secret">]><rss/>'), /declarations are not accepted/);
  assert.throws(() => parseWordPressWxr('<rss><channel>&custom;</channel></rss>'), /Unsupported XML entity/);
  const escapedHtmlEntity = parseWordPressWxr('<rss><channel><item><title>literal &amp;nbsp; text</title><wp:post_id>1</wp:post_id><wp:post_type>page</wp:post_type></item></channel></rss>');
  assert.equal(escapedHtmlEntity.records[0].title, 'literal &nbsp; text');
  assert.throws(() => parseWordPressWxr('<rss><channel><title>bare & sign</title></channel></rss>'), /unescaped ampersand/);
  assert.throws(() => parseWordPressWxr('<rss><channel><item></channel></rss>'), /mismatched closing tags/);
  assert.throws(() => parseWordPressWxr(Buffer.from([0xff, 0xfe])), /valid UTF-8/);
});

test('staged WXR reads are confined to ordinary files inside the staging root', t => {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-wp-stage-'));
  t.after(() => fs.rmSync(stage, { recursive: true, force: true }));
  fs.writeFileSync(path.join(stage, 'export.xml'), sampleWxr);
  assert.equal(readWordPressWxrFromStaging(stage, 'export.xml').counts.items, 4);
  assert.throws(() => readWordPressWxrFromStaging(stage, '../outside.xml'), /inside the staging directory/);
  const outside = path.join(os.tmpdir(), `ls-outside-${process.pid}.xml`);
  fs.writeFileSync(outside, sampleWxr);
  try {
    fs.symlinkSync(outside, path.join(stage, 'linked.xml'));
    assert.throws(() => readWordPressWxrFromStaging(stage, 'linked.xml'), /regular file, not a symlink/);
  } catch (error) {
    if (error.code !== 'EPERM' && error.code !== 'EACCES') throw error;
  } finally {
    fs.rmSync(outside, { force: true });
  }
});

test('extracted cPanel inventory lists SQL and PHP for review without reading or running them', t => {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-cpanel-stage-'));
  t.after(() => fs.rmSync(stage, { recursive: true, force: true }));
  fs.mkdirSync(path.join(stage, 'home', 'site', 'wp-content', 'uploads'), { recursive: true });
  fs.writeFileSync(path.join(stage, 'home', 'site', 'wordpress-export.xml'), sampleWxr);
  fs.writeFileSync(path.join(stage, 'home', 'site', 'backup.sql'), 'never execute');
  fs.writeFileSync(path.join(stage, 'home', 'site', 'wp-config.php'), '<?php throw new Error("do not execute");');
  fs.writeFileSync(path.join(stage, 'home', 'site', 'wp-content', 'uploads', 'team.jpg'), 'fixture');
  const result = inventoryCpanelStagingDirectory(stage);
  assert.deepEqual(result.counts, { files: 4, wxr: 1, sql: 1, media: 1, php: 1 });
  assert.ok(result.files.some(file => file.category === 'sql-review-only'));
  assert.ok(result.files.some(file => file.category === 'php-review-only'));
  assert.ok(result.notes.some(note => note.includes('never applied')));
});

test('tar archive listing reports safe paths and rejects traversal and links without extracting', t => {
  const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'ls-tar-stage-'));
  t.after(() => fs.rmSync(stage, { recursive: true, force: true }));
  const tar = makeTar([
    { name: './home/site/wordpress-export.xml', body: sampleWxr },
    { name: './home/site/wp-content/uploads/team.jpg', body: Buffer.from('fixture') },
    { name: '../escape.php', body: Buffer.from('not executed') },
    { name: './home/site/wp-config.php', body: Buffer.from('<?php not run') },
    { name: './home/site/db.sql', body: Buffer.from('not applied') },
    { name: './home/site/link', type: '2', link: '../outside' }
  ]);
  fs.writeFileSync(path.join(stage, 'backup.tar.gz'), gzipSync(tar));
  const result = listCpanelTarArchive(stage, 'backup.tar.gz');
  assert.equal(result.extracted, false);
  assert.ok(result.entries.some(entry => entry.path === 'home/site/wordpress-export.xml' && entry.category === 'wordpress-export'));
  assert.ok(result.entries.some(entry => entry.path === 'home/site/wp-content/uploads/team.jpg' && entry.category === 'media'));
  assert.ok(result.entries.some(entry => entry.category === 'php-review-only'));
  assert.ok(result.entries.some(entry => entry.category === 'sql-review-only'));
  assert.ok(result.issues.some(issue => issue.code === 'UNSAFE_ARCHIVE_PATH_SKIPPED'));
  assert.ok(result.issues.some(issue => issue.code === 'ARCHIVE_LINK_SKIPPED'));
  assert.throws(() => listCpanelTarArchive(stage, '../backup.tar.gz'), /inside the staging directory/);
});

test('checksum and provenance helpers support repeatable asset and record imports', () => {
  const checksum = sha256Buffer(Buffer.from('same media bytes'));
  assert.equal(checksum, 'de7ee61b2f36097ccb2edee8ef1c97384855c3908875ca6144ed57e1c324ecf3');
  const provenance = createContentProvenance({ sourceType: 'page', sourceId: 11, sourceUrl: 'https://example.test/about/', checksum });
  assert.equal(provenance.sourceKey, 'wordpress:page:11');
  const inventory = parseWordPressWxr(sampleWxr);
  const same = planWordPressRecordImport(inventory.records, [{ provenance: { sourceKey: 'wordpress:page:11', checksum: inventory.records[0].sourceChecksum } }]);
  assert.equal(same.unchanged.length, 1);
  const curated = planWordPressRecordImport(inventory.records, [{ provenance: { sourceKey: 'wordpress:page:11', checksum: '0'.repeat(64) }, curated: true }]);
  assert.equal(curated.conflicts[0].code, 'CURATED_RECORD_PRESERVED');
  assert.equal(curated.createDrafts.length, 3);
  const planned = planAssetImport([
    { name: 'one.jpg', checksum },
    { name: 'copy.jpg', checksum },
    { name: 'new.jpg', checksum: 'b'.repeat(64) }
  ], [{ id: 'existing', checksum }]);
  assert.equal(planned.reuse.length, 2);
  assert.equal(planned.toImport.length, 1);
  assert.equal(planned.duplicates.length, 0);
});

function makeTar(entries) {
  const chunks = [];
  for (const entry of entries) {
    const body = Buffer.from(entry.body || '');
    const header = Buffer.alloc(512);
    writeString(header, 0, 100, entry.name);
    writeOctal(header, 100, 8, 0o644);
    writeOctal(header, 108, 8, 0);
    writeOctal(header, 116, 8, 0);
    writeOctal(header, 124, 12, body.length);
    writeOctal(header, 136, 12, 1_700_000_000);
    header.fill(32, 148, 156);
    header[156] = (entry.type || '0').charCodeAt(0);
    if (entry.link) writeString(header, 157, 100, entry.link);
    writeString(header, 257, 6, 'ustar\0');
    writeString(header, 263, 2, '00');
    const checksum = header.reduce((sum, byte) => sum + byte, 0);
    writeOctal(header, 148, 8, checksum);
    chunks.push(header, body);
    const padding = (512 - (body.length % 512)) % 512;
    if (padding) chunks.push(Buffer.alloc(padding));
  }
  chunks.push(Buffer.alloc(1024));
  return Buffer.concat(chunks);
}

function writeString(buffer, start, length, value) {
  Buffer.from(value, 'utf8').copy(buffer, start, 0, length);
}

function writeOctal(buffer, start, length, value) {
  const text = value.toString(8).padStart(length - 1, '0') + '\0';
  buffer.write(text, start, length, 'ascii');
}
