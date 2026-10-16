import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { hashPassword } from '../src/security.mjs';
import { PgRepository } from '../src/repository.mjs';

const connectionString=process.env.CMS_TEST_DATABASE_URL;

test('PostgreSQL migrations and revision workflow persist and isolate private/public reads', {
  skip: connectionString ? false : 'Set CMS_TEST_DATABASE_URL to a disposable PostgreSQL test database.'
}, async(t)=>{
  const url=new URL(connectionString);
  const databaseName=decodeURIComponent(url.pathname.replace(/^\//,''));
  assert.match(databaseName,/(?:^|[_-])test$/i,'Use a dedicated test database whose name ends in test.');
  const {Pool}=await import('pg');
  const adminPool=new Pool({connectionString});
  const schema=`cms_test_${randomUUID().replaceAll('-','')}`;
  await adminPool.query(`CREATE SCHEMA ${schema}`);
  const pool=new Pool({connectionString,options:`-c search_path=${schema}`});
  const repository=new PgRepository(pool);
  t.after(async()=>{await pool.end();await adminPool.query(`DROP SCHEMA ${schema} CASCADE`);await adminPool.end();});
  await repository.migrate();
  const admin=await repository.bootstrapAdmin({email:`admin-${schema}@example.test`,displayName:'Local Admin',passwordHash:await hashPassword('Admin-Integration-Passphrase-2026!')});
  const editor=await repository.createStaff({email:`editor-${schema}@example.test`,displayName:'Editor',role:'editor',passwordHash:await hashPassword('Editor-Integration-Passphrase-2026!')},admin.id);
  const reviewer=await repository.createStaff({email:`reviewer-${schema}@example.test`,displayName:'Reviewer',role:'technical_reviewer',passwordHash:await hashPassword('Reviewer-Integration-Passphrase-2026!')},admin.id);
  const publisher=await repository.createStaff({email:`publisher-${schema}@example.test`,displayName:'Publisher',role:'publisher',passwordHash:await hashPassword('Publisher-Integration-Passphrase-2026!')},admin.id);
  await assert.rejects(()=>repository.updateStaff({id:admin.id,role:'editor'},admin.id),{code:'LAST_ADMIN'});
  const validated={fields:{translations:{en:{title:'Test machine'},zh:{title:'测试机器'},ms:{title:'Mesin ujian'}},data:{modelCode:'TEST-1'},mediaIds:[]},internalNotes:'private test note',sourceEvidence:['test source'],mediaIds:[]};
  const item=await repository.createContent({type:'machine',slug:`machine-${schema}`.slice(0,80),route:`/test/${schema}/`,validated,actorId:editor.id});
  assert.equal(await repository.getPublished(item.route),null);
  const queued=await repository.requestReview({id:item.id,revisionId:item.revision.id,expectedVersion:item.version,actorId:editor.id});
  const reviewed=await repository.reviewTechnical({id:item.id,revisionId:queued.revision.id,expectedVersion:queued.version,decision:'approved',note:'Verified in integration fixture.',actorId:reviewer.id});
  const revised=await repository.updateDraft({id:item.id,expectedVersion:reviewed.version,validated:{...validated,fields:{...validated.fields,translations:{...validated.fields.translations,en:{title:'Revised test machine'}}}},actorId:editor.id});
  await assert.rejects(()=>repository.publish({id:item.id,revisionId:revised.revision.id,expectedVersion:revised.version,confirmedRevisionId:revised.revision.id,actorId:publisher.id}),{code:'REVIEW_REQUIRED'});
  const requeued=await repository.requestReview({id:item.id,revisionId:revised.revision.id,expectedVersion:revised.version,actorId:editor.id});
  const reapproved=await repository.reviewTechnical({id:item.id,revisionId:requeued.revision.id,expectedVersion:requeued.version,decision:'approved',note:'Updated revision verified.',actorId:reviewer.id});
  const normalBuilder=repository.publicationBuilder;
  repository.publicationBuilder=()=>{const error=new Error('Simulated public build failure.');error.code='PUBLICATION_BUILD_FAILED';throw error;};
  await assert.rejects(()=>repository.publish({id:item.id,revisionId:reapproved.revision.id,expectedVersion:reapproved.version,confirmedRevisionId:reapproved.revision.id,actorId:publisher.id}),{code:'PUBLICATION_BUILD_FAILED'});
  assert.equal(await repository.getPublished(item.route),null,'a failed first build must not create public content');
  assert.equal(await repository.getActivePublication(),null,'a failed first build must not activate an empty or partial release');
  repository.publicationBuilder=normalBuilder;
  const live=await repository.publish({id:item.id,revisionId:reapproved.revision.id,expectedVersion:reapproved.version,confirmedRevisionId:reapproved.revision.id,actorId:publisher.id});
  assert.equal(live.publishedRevisionId,live.revision.id);
  assert.equal((await repository.getPublished(item.route)).fields.translations.en.title,'Revised test machine');
  const firstRelease=await repository.getActivePublication();
  assert.equal(firstRelease.manifest.pageCount,1);
  assert.equal(firstRelease.manifest.localePageCounts.zh,1);
  assert.match((await repository.getPublishedSearchIndex('en'))[0].text,/TEST-1/);

  const nextDraft=await repository.updateDraft({id:item.id,expectedVersion:live.version,validated:{...validated,fields:{...validated.fields,translations:{...validated.fields.translations,en:{title:'Candidate public copy'}}}},actorId:editor.id});
  const nextQueued=await repository.requestReview({id:item.id,revisionId:nextDraft.revision.id,expectedVersion:nextDraft.version,actorId:editor.id});
  const nextApproved=await repository.reviewTechnical({id:item.id,revisionId:nextQueued.revision.id,expectedVersion:nextQueued.version,decision:'approved',note:'Candidate revision checked.',actorId:reviewer.id});
  repository.publicationBuilder=()=>{const error=new Error('Simulated public build failure.');error.code='PUBLICATION_BUILD_FAILED';throw error;};
  await assert.rejects(()=>repository.publish({id:item.id,revisionId:nextApproved.revision.id,expectedVersion:nextApproved.version,confirmedRevisionId:nextApproved.revision.id,actorId:publisher.id}),{code:'PUBLICATION_BUILD_FAILED'});
  assert.equal((await repository.getActivePublication()).id,firstRelease.id,'a failed rebuild must preserve the previous active release');
  assert.equal((await repository.getPublished(item.route)).fields.translations.en.title,'Revised test machine','failed builds must not leak candidate page content');
  repository.publicationBuilder=normalBuilder;

  const finalLive=await repository.publish({id:item.id,revisionId:nextApproved.revision.id,expectedVersion:nextApproved.version,confirmedRevisionId:nextApproved.revision.id,actorId:publisher.id});
  assert.equal(finalLive.publishedRevisionId,finalLive.revision.id);
  assert.equal((await repository.getPublished(item.route)).fields.translations.en.title,'Candidate public copy');
  assert.equal((await repository.getPrivateRevision(item.id,live.revision.id)).revision.internalNotes,'private test note');
  assert.equal((await repository.getRevisionHistory(item.id)).length,3);
});
