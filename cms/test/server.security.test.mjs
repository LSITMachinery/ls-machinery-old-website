import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCmsServer } from '../src/server.mjs';
import { FakeRepository } from './support/fake-repository.mjs';

const SECRET='local-test-cms-secret-that-is-at-least-thirty-two-bytes';
const PASSWORDS={admin:'Admin-Strong-Passphrase-2026!',editor:'Editor-Strong-Passphrase-2026!',reviewer:'Reviewer-Strong-Passphrase-2026!',publisher:'Publisher-Strong-Passphrase-2026!'};

test('HTTP sign-in rejects a temporary account unless local preview is enabled', async(t)=>{
  for (const enabled of [false,true]) {
    const app=await harness({localPreview:enabled});t.after(app.close);
    const visitor=client(app.base);
    await request(visitor,'/api/cms/bootstrap',{method:'POST',csrf:false,body:{email:'temporary@example.test',displayName:'Temporary',password:PASSWORDS.admin}});
    const account=app.repository.users[0];
    account.local_preview_password_hash=account.password_hash;
    const login=await request(visitor,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:account.email,password:PASSWORDS.admin}});
    assert.equal(login.response.status,enabled?200:403);
  }
});

async function harness(options={}) {
  const repository=new FakeRepository();
  const server=createCmsServer({repository,csrfSecret:SECRET,loginLimit:options.loginLimit??8,mediaRoot:options.mediaRoot,localPreview:options.localPreview??false});
  await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  return {repository,base,close:()=>new Promise((resolve)=>server.close(resolve))};
}

function client(base) { return {base,cookie:'',csrf:''}; }
async function request(client,path,{method='GET',body,csrf=true,origin=client.base}={}) {
  const headers={};
  if(origin)headers.Origin=origin;
  if(body!==undefined)headers['Content-Type']='application/json';
  if(client.cookie)headers.Cookie=client.cookie;
  if(method!=='GET'&&method!=='HEAD'&&csrf&&client.csrf)headers['X-CSRF-Token']=client.csrf;
  const response=await fetch(client.base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  if(path==='/api/cms/auth/login'&&response.ok){const cookie=response.headers.get('set-cookie');client.cookie=cookie.split(';')[0];const result=await response.json();client.csrf=result.csrfToken;return {response,data:result};}
  const data=(response.headers.get('content-type')||'').includes('application/json')?await response.json().catch(()=>({})):await response.text();
  if(path==='/api/cms/auth/logout'&&response.ok){client.cookie='';client.csrf='';}
  return {response,data};
}
async function requestRaw(client,path,{method='POST',body,contentType='application/octet-stream',fileName,csrf=true}={}) {
  const headers={Origin:client.base,'Content-Type':contentType};if(fileName)headers['X-File-Name']=fileName;if(client.cookie)headers.Cookie=client.cookie;if(method!=='GET'&&csrf&&client.csrf)headers['X-CSRF-Token']=client.csrf;
  const response=await fetch(client.base+path,{method,headers,body});const data=(response.headers.get('content-type')||'').includes('application/json')?await response.json().catch(()=>({})):await response.text();return {response,data};
}
async function createStaff(admin,role,email,password) {
  return request(admin,'/api/cms/staff',{method:'POST',body:{email,displayName:role,role,password}});
}
async function waitForPublication(client,id) {
  for (let attempt=0;attempt<40;attempt++) {
    const result=await request(client,`/api/cms/publication-jobs/${id}`);
    if (result.data.job?.status==='active'||result.data.job?.status==='failed') return result.data.job;
    await new Promise(resolve=>setTimeout(resolve,10));
  }
  throw new Error('Publication job did not finish in time.');
}
function machineFields(title='Mini Cookie Depositor') {
  return {translations:{en:{title,summary:'Deposit cookie dough onto trays.'},zh:{title:'曲奇挤出机',summary:'将曲奇面团挤到烤盘上。'},ms:{title:'Pendeposit biskut mini',summary:'Mendeposit doh biskut ke atas dulang.'}},data:{modelCode:'LSF 502 MCD'},mediaIds:[],internalNotes:'Verify against LS source before release.',sourceEvidence:['internal-record-1']};
}

test('HTTP CMS enforces login, CSRF, roles, revision-bound technical review and publisher confirmation', async(t)=>{
  const app=await harness();t.after(app.close);
  const admin=client(app.base);const setup=await request(admin,'/api/cms/setup-status');assert.equal(setup.data.firstAdminRequired,true);
  const bootstrap=await request(admin,'/api/cms/bootstrap',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',displayName:'Local Admin',password:PASSWORDS.admin}});
  assert.equal(bootstrap.response.status,201);
  const duplicate=await request(admin,'/api/cms/bootstrap',{method:'POST',csrf:false,body:{email:'other@lsmachinery.test',displayName:'Second Admin',password:PASSWORDS.admin}});assert.equal(duplicate.response.status,409);
  const noRegister=await request(admin,'/api/cms/register',{method:'POST',body:{email:'public@example.test'}});assert.equal(noRegister.response.status,404);

  const loggedIn=await request(admin,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'ADMIN@LSMACHINERY.TEST',password:PASSWORDS.admin}});
  assert.equal(loggedIn.response.status,200);
  assert.match(loggedIn.response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  assert.equal(loggedIn.data.user.role,'admin');
  const adminFields={translations:{en:{title:'Food catalogue'},zh:{title:'食品目录'},ms:{title:'Katalog makanan'}},mediaIds:[]};
  const adminDraft=await request(admin,'/api/cms/content',{method:'POST',body:{type:'food',slug:'admin-food-page',route:'/food/',fields:adminFields}});
  assert.equal(adminDraft.response.status,201);
  const adminReview=await request(admin,`/api/cms/content/${adminDraft.data.content.id}/request-review`,{method:'POST',body:{revisionId:adminDraft.data.content.revision.id,expectedVersion:adminDraft.data.content.version}});
  assert.equal(adminReview.response.status,200);
  const adminPublish=await request(admin,`/api/cms/content/${adminDraft.data.content.id}/publish`,{method:'POST',body:{confirmPublish:true,revisionId:adminReview.data.content.revision.id,confirmRevisionId:adminReview.data.content.revision.id,expectedVersion:adminReview.data.content.version}});
  assert.equal(adminPublish.response.status,202);
  assert.equal((await waitForPublication(admin,adminPublish.data.job.id)).status,'active');
  const adminAudit=await request(admin,'/api/cms/audit');assert.equal(adminAudit.response.status,200);assert.ok(adminAudit.data.events.some((event)=>event.action==='bootstrap_admin'));
  const cannotDemoteSelf=await request(admin,`/api/cms/staff/${loggedIn.data.user.id}`,{method:'PATCH',body:{role:'editor'}});assert.equal(cannotDemoteSelf.response.status,400);
  const cannotDisableSelf=await request(admin,`/api/cms/staff/${loggedIn.data.user.id}`,{method:'PATCH',body:{disabled:true}});assert.equal(cannotDisableSelf.response.status,400);
  const missingCsrf=await request(admin,'/api/cms/staff',{method:'POST',csrf:false,body:{email:'bad@lsmachinery.test'}});assert.equal(missingCsrf.response.status,403);
  const badOrigin=await request(admin,'/api/cms/staff',{method:'POST',origin:'https://attacker.invalid',body:{email:'bad@lsmachinery.test'}});assert.equal(badOrigin.response.status,403);

  assert.equal((await createStaff(admin,'editor','editor@lsmachinery.test',PASSWORDS.editor)).response.status,201);
  assert.equal((await createStaff(admin,'technical_reviewer','reviewer@lsmachinery.test',PASSWORDS.reviewer)).response.status,201);
  assert.equal((await createStaff(admin,'publisher','publisher@lsmachinery.test',PASSWORDS.publisher)).response.status,201);
  const editor=client(app.base);assert.equal((await request(editor,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'editor@lsmachinery.test',password:PASSWORDS.editor}})).response.status,200);
  const editorCannotReadAudit=await request(editor,'/api/cms/audit');assert.equal(editorCannotReadAudit.response.status,403);
  const reviewer=client(app.base);assert.equal((await request(reviewer,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'reviewer@lsmachinery.test',password:PASSWORDS.reviewer}})).response.status,200);
  const publisher=client(app.base);assert.equal((await request(publisher,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'publisher@lsmachinery.test',password:PASSWORDS.publisher}})).response.status,200);
  const editorRecord=(await request(admin,'/api/cms/staff')).data.staff.find((account)=>account.email==='editor@lsmachinery.test');
  const editorCannotManageStaff=await request(editor,`/api/cms/staff/${editorRecord.id}`,{method:'PATCH',body:{disabled:true}});assert.equal(editorCannotManageStaff.response.status,403);

  const created=await request(editor,'/api/cms/content',{method:'POST',body:{type:'machine',slug:'mini-cookie-depositor',route:'/machine/mini-cookie-depositor/',fields:machineFields()}});
  assert.equal(created.response.status,201);const item=created.data.content;
  const adminCannotReviewMachine=await request(admin,`/api/cms/content/${item.id}/technical-review`,{method:'POST',body:{revisionId:item.revision.id,expectedVersion:item.version,decision:'approved'}});assert.equal(adminCannotReviewMachine.response.status,403);
  assert.equal(item.revision.status,'draft');assert.equal(item.revision.changedByName,'editor');
  const publicDraft=await request(editor,'/api/content/published?route=%2Fmachine%2Fmini-cookie-depositor%2F');assert.equal(publicDraft.data.content,null);
  const anon=client(app.base);const privatePreview=await request(anon,`/api/cms/preview/${item.id}?revision=${item.revision.id}`);assert.equal(privatePreview.response.status,401);
  const preview=await request(editor,`/api/cms/preview/${item.id}?revision=${item.revision.id}`);assert.equal(preview.response.status,200);assert.match(preview.data,/Private preview/);assert.equal(preview.response.headers.get('x-robots-tag'),'noindex, nofollow');
  const wrongRole=await request(reviewer,`/api/cms/content/${item.id}/draft`,{method:'PUT',body:{expectedVersion:item.version,fields:machineFields()}});assert.equal(wrongRole.response.status,403);

  const firstSubmit=await request(editor,`/api/cms/content/${item.id}/request-review`,{method:'POST',body:{revisionId:item.revision.id,expectedVersion:item.version}});assert.equal(firstSubmit.response.status,200);
  const queued=firstSubmit.data.content;
  const approval=await request(reviewer,`/api/cms/content/${item.id}/technical-review`,{method:'POST',body:{revisionId:queued.revision.id,expectedVersion:queued.version,decision:'approved',note:'Model code checked.'}});assert.equal(approval.response.status,200);assert.equal(approval.data.content.revision.status,'ready_to_publish');

  const editedFields=machineFields('Mini Cookie Depositor · revised copy');
  const changed=await request(editor,`/api/cms/content/${item.id}/draft`,{method:'PUT',body:{expectedVersion:approval.data.content.version,fields:editedFields}});assert.equal(changed.response.status,200);
  const latest=changed.data.content;assert.equal(latest.revision.revisionNumber,2);assert.equal(latest.revision.status,'draft');assert.notEqual(latest.revision.id,queued.revision.id);
  const staleSave=await request(editor,`/api/cms/content/${item.id}/draft`,{method:'PUT',body:{expectedVersion:approval.data.content.version,fields:editedFields}});assert.equal(staleSave.response.status,409);
  const stalePublish=await request(publisher,`/api/cms/content/${item.id}/publish`,{method:'POST',body:{confirmPublish:true,revisionId:latest.revision.id,confirmRevisionId:latest.revision.id,expectedVersion:latest.version}});assert.equal(stalePublish.response.status,409);
  const publisherCannotReview=await request(publisher,`/api/cms/content/${item.id}/technical-review`,{method:'POST',body:{revisionId:latest.revision.id,expectedVersion:latest.version,decision:'approved'}});assert.equal(publisherCannotReview.response.status,403);

  const secondSubmit=await request(editor,`/api/cms/content/${item.id}/request-review`,{method:'POST',body:{revisionId:latest.revision.id,expectedVersion:latest.version}});assert.equal(secondSubmit.response.status,200);
  const current=secondSubmit.data.content;
  const approvedAgain=await request(reviewer,`/api/cms/content/${item.id}/technical-review`,{method:'POST',body:{revisionId:current.revision.id,expectedVersion:current.version,decision:'approved'}});assert.equal(approvedAgain.response.status,200);
  const confirmedWrong=await request(publisher,`/api/cms/content/${item.id}/publish`,{method:'POST',body:{confirmPublish:true,revisionId:approvedAgain.data.content.revision.id,confirmRevisionId:queued.revision.id,expectedVersion:approvedAgain.data.content.version}});assert.equal(confirmedWrong.response.status,409);
  const history=await request(editor,`/api/cms/content/${item.id}/revisions`);assert.equal(history.response.status,200);assert.equal(history.data.revisions.length,2);assert.equal(history.data.revisions[0].revisionNumber,2);assert.ok(history.data.revisions.every((rev)=>rev.changedBy&&rev.createdAt));
  const published=await request(publisher,`/api/cms/content/${item.id}/publish`,{method:'POST',body:{confirmPublish:true,revisionId:approvedAgain.data.content.revision.id,confirmRevisionId:approvedAgain.data.content.revision.id,expectedVersion:approvedAgain.data.content.version}});assert.equal(published.response.status,202);assert.equal((await waitForPublication(publisher,published.data.job.id)).status,'active');
  const live=await request(anon,'/api/content/published?route=%2Fmachine%2Fmini-cookie-depositor%2F');assert.equal(live.response.status,200);assert.equal(live.data.content.fields.translations.en.title,'Mini Cookie Depositor · revised copy');
  const searchIndex=await request(anon,'/api/content/published/search?locale=zh');assert.equal(searchIndex.response.status,200);const machineSearch=searchIndex.data.searchIndex.find(entry=>entry.route==='/zh/machine/mini-cookie-depositor/');assert.ok(machineSearch);assert.match(machineSearch.text,/LSF 502 MCD/);
  const unsupportedSearch=await request(anon,'/api/content/published/search?locale=fr');assert.equal(unsupportedSearch.response.status,400);

  const logout=await request(editor,'/api/cms/auth/logout',{method:'POST'});assert.equal(logout.response.status,200);
  const afterLogout=await request(editor,`/api/cms/content/${item.id}`);assert.equal(afterLogout.response.status,401);
});

test('login rate limit is server-side and gives the same response for unknown users and wrong passphrases', async(t)=>{
  const app=await harness({loginLimit:2});t.after(app.close);
  const setup=client(app.base);
  await request(setup,'/api/cms/bootstrap',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',displayName:'Local Admin',password:PASSWORDS.admin}});
  const attempts=client(app.base);
  const one=await request(attempts,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'unknown@lsmachinery.test',password:'Wrong-Strong-Passphrase-2026!'}});
  const two=await request(attempts,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',password:'Wrong-Strong-Passphrase-2026!'}});
  assert.equal(one.response.status,401);assert.equal(two.response.status,401);assert.equal(one.data.error,two.data.error);
  await request(attempts,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',password:'Wrong-Strong-Passphrase-2026!'}});
  const three=await request(attempts,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',password:PASSWORDS.admin}});
  assert.equal(three.response.status,429);
});

test('admin WordPress import previews source evidence and creates private drafts only',async t=>{
  const app=await harness();t.after(app.close);const admin=client(app.base);
  await request(admin,'/api/cms/bootstrap',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',displayName:'Local Admin',password:PASSWORDS.admin}});
  await request(admin,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',password:PASSWORDS.admin}});
  const source=await readFile(new URL('./fixtures/wordpress/sample-export.xml',import.meta.url));
  const preview=await requestRaw(admin,'/api/cms/migration/preview',{body:source,fileName:'sample-export.xml',contentType:'application/xml'});
  assert.equal(preview.response.status,200);assert.equal(preview.data.counts.pages,1);assert.ok(preview.data.missingMedia.length>0);
  const page=preview.data.items.find(item=>item.sourceIdentity==='wordpress:page:11');assert.equal(page.supported,true);
  const imported=await request(admin,'/api/cms/migration/import',{method:'POST',body:{previewId:preview.data.previewId,confirm:true,mappings:{[page.sourceIdentity]:{type:'company',route:'/company/'}}}});
  assert.equal(imported.response.status,202);let job;
  for(let attempt=0;attempt<40;attempt++){const check=await request(admin,`/api/cms/migration/jobs/${imported.data.job.id}`);job=check.data.job;if(job?.status==='completed'||job?.status==='failed')break;await new Promise(resolve=>setTimeout(resolve,10));}
  assert.equal(job.status,'completed');assert.equal(job.result.created.length,1);
  const content=await request(admin,'/api/cms/content/'+encodeURIComponent(job.result.created[0].contentId));assert.equal(content.response.status,200);assert.equal(content.data.content.revision.status,'draft');assert.equal(content.data.content.revision.fields.translations.en.title,'About LS');
  const publicPage=await request(client(app.base),'/api/content/published?route=%2Fcompany%2F');assert.equal(publicPage.data.content,null);
});

test('saved revisions on registered routes use a private page-template preview',async t=>{
  const app=await harness();t.after(app.close);const admin=client(app.base);
  await request(admin,'/api/cms/bootstrap',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',displayName:'Local Admin',password:PASSWORDS.admin}});
  await request(admin,'/api/cms/auth/login',{method:'POST',csrf:false,body:{email:'admin@lsmachinery.test',password:PASSWORDS.admin}});
  const created=await request(admin,'/api/cms/content',{method:'POST',body:{type:'home',slug:'home',route:'/',fields:{translations:{en:{title:'Preview title'},zh:{title:'预览标题'},ms:{title:'Tajuk pratonton'}},mediaIds:[]}}});
  const preview=await request(admin,`/api/cms/preview/${created.data.content.id}?revision=${created.data.content.revision.id}`);
  assert.equal(preview.response.status,200);assert.equal(preview.response.headers.get('x-robots-tag'),'noindex, nofollow');assert.match(preview.data,/#main/);assert.match(preview.data,/cms-preview-data/);assert.match(preview.data,/preview-bridge\.js/);assert.match(preview.data,/Private staff preview/);
});
