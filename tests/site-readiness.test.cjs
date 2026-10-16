const assert=require('node:assert/strict');
const http=require('node:http');
const {chromium}=require('playwright');
const {createServer}=require('../preview-server.cjs');
(async()=>{
 delete process.env.LS_INQUIRY_WEBHOOK_URL;delete process.env.LS_SKIP_PRERENDER;
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const deliveries=[];let providerStatus=500;
 const provider=http.createServer(async(req,res)=>{let text='';for await(const chunk of req)text+=chunk;deliveries.push(JSON.parse(text));res.writeHead(providerStatus).end();});await new Promise(resolve=>provider.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const route='/machine/mini-cookie-depositor-mcd/';
  const response=await page.request.get(base+route);assert.equal(response.status(),200);const html=await response.text();
  assert.match(html,/<title>[^<]*Mini Cookie Depositor[^<]*LS Smart Machinery/);assert.match(html,/<h1[^>]*>LSF 502 MCD<\/h1>/);assert.match(html,/property="og:image"[^>]+https:\/\/lsmachinery.com.my/);assert.match(html,/rel="canonical"[^>]+https:\/\/lsmachinery.com.my\/machine\/mini-cookie-depositor-mcd\//);assert.match(html,/application\/ld\+json/);assert.match(html,/noindex,nofollow/);
  const sitemap=await(await page.request.get(base+'/sitemap.xml')).text();assert.ok((sitemap.match(/<url>/g)||[]).length>=95);assert.doesNotMatch(sitemap,/#/);
  const noJs=await browser.newPage({javaScriptEnabled:false});await noJs.goto(base+route);assert.equal(await noJs.locator('#main h1').innerText(),'LSF 502 MCD');await noJs.close();
  await page.goto(base+'/');assert.equal(await page.locator('.cms-trigger,[name="insights"]').count(),0);assert.equal(await page.locator('.language-picker').isVisible(),true);assert.equal(await page.locator('#language-picker option').count(),3);assert.equal(await page.locator('.portal-button').innerText(),'Contact\n↗');assert.equal(await page.locator('.client-marquee.is-static .client-strip-logo').count(),2);assert.equal(await page.locator('.client-strip-clone,[data-client-carousel]').count(),0);
  await page.locator('.header-search-link').first().click();await page.waitForURL('**/search/');await page.locator('input[name="q"]').fill('LSF-502-MCD');await page.locator('input[name="q"]').press('Enter');await page.locator('.discovery-result').first().waitFor();assert.equal(await page.locator('.discovery-result').count(),2);await page.locator('[data-search-type="machine"]').click();assert.equal(await page.locator('.discovery-result').count(),1);await page.locator('.discovery-result').first().click();await page.waitForURL('**/machine/mini-cookie-depositor-mcd/');assert.equal(new URL(page.url()).hash,'');await page.goBack();assert.equal(await page.locator('input[name="q"]').inputValue(),'LSF-502-MCD');await page.locator('.discovery-result').first().waitFor();assert.equal(await page.locator('.discovery-result').count(),2,'Back restores the query and returns to all matching content types');assert.equal(await page.locator('[data-search-type="all"]').getAttribute('aria-pressed'),'true');
  await page.goto(base+'/#machine/mini-cookie-depositor-mcd');await page.waitForURL('**/machine/mini-cookie-depositor-mcd/');assert.equal(await page.locator('#main').getAttribute('data-route'),'machine/mini-cookie-depositor-mcd');
  await page.goto(base+'/privacy/');assert.equal(await page.locator('#privacy-en[lang="en"]').count(),1);assert.equal(await page.locator('#privacy-ms[lang="ms"]').count(),1);assert.equal(await page.locator('#privacy-zh[lang="zh-Hans"]').count(),1);
  const retired=await page.request.get(base+'/company/project-process/',{maxRedirects:0});assert.equal(retired.status(),308);assert.equal(retired.headers()['location'],'/services/#working-process');
  await page.goto(base+'/services/#working-process');assert.equal(await page.locator('#working-process [data-journey-stage]').count(),6);
  await page.goto(base+'/inquiry/');assert.equal(await page.locator('[data-submit-inquiry]').isVisible(),false);assert.equal(await page.locator('#lead-form a[href="/privacy/"]').count(),1);
  const body={name:'Test Buyer',email:'buyer@example.test',message:'Local delivery fixture',kind:'inquiry'};
  assert.equal((await page.request.post(base+'/api/inquiries',{data:body,headers:{'Idempotency-Key':'test-unconfigured-0001'}})).status(),503);
  process.env.LS_INQUIRY_WEBHOOK_URL='http://127.0.0.1:'+provider.address().port;
  await page.reload();await page.locator('[data-submit-inquiry]').waitFor();
  await page.locator('#inq-name').fill(body.name);await page.locator('#inq-email').fill(body.email);await page.locator('#inq-message').fill(body.message);await page.locator('.inquiry-production-details summary').click();await page.locator('#inq-product').fill('Cookies');await page.locator('#inq-output').fill('200 trays');await page.locator('#inq-factory').fill('Selangor');await page.locator('#inq-timeline').fill('Next year');
  await page.locator('[data-submit-inquiry]').click();await page.waitForFunction(()=>document.querySelector('.form-status').textContent.includes('could not be submitted'));assert.equal(await page.locator('#inq-message').inputValue(),body.message);
  await page.reload();assert.equal(await page.locator('#inq-name').inputValue(),body.name);providerStatus=202;
  let submitted;page.on('request',request=>{if(request.url().endsWith('/api/inquiries'))submitted={body:request.postDataJSON(),key:request.headers()['idempotency-key']};});
  await page.locator('[data-submit-inquiry]').click();await page.waitForFunction(()=>document.querySelector('.form-status').textContent.includes('accepted for delivery'));assert.match(await page.locator('.form-status').innerText(),/LS-\d{8}-[A-F0-9]{10}/);assert.equal(await page.locator('[data-submit-inquiry]').isDisabled(),true);assert.equal(deliveries.length,2);assert.equal(deliveries[1].dailyOutput,'200 trays');assert.equal(deliveries[1].factoryLocation,'Selangor');
  const duplicate=await page.request.post(base+'/api/inquiries',{data:submitted.body,headers:{'Idempotency-Key':submitted.key}});assert.equal(duplicate.status(),202);assert.equal(deliveries.length,2,'retry must not forward an accepted request twice');
  assert.equal((await page.request.post(base+'/api/inquiries',{data:{...submitted.body,message:'Changed'},headers:{'Idempotency-Key':submitted.key}})).status(),409);
  assert.equal((await page.request.post(base+'/api/inquiries',{data:body,headers:{Origin:'https://unrelated.example','Idempotency-Key':'test-other-origin-01'}})).status(),403);
  const parts={name:'Parts Buyer',phone:'0123456789',kind:'spare-parts',partDescription:'Bracket',partModel:'MCD',machineNumber:'SN-TEST',partNumber:'PART-TEST',quantity:'3',deliveryAddress:'Local fixture address',remarks:'Fixture only',context:'Spare parts',sourcePage:'service/spare-parts-request'};
  assert.equal((await page.request.post(base+'/api/inquiries',{data:parts,headers:{'Idempotency-Key':'test-parts-fields-001'}})).status(),202);
  for(const [key,value]of Object.entries(parts))assert.equal(deliveries.at(-1)[key],value,'spare field retained: '+key);
  assert.equal((await page.request.post(base+'/api/inquiries',{data:{...parts,quantity:'-1'},headers:{'Idempotency-Key':'test-parts-invalid-01'}})).status(),422);
  await page.getByRole('button',{name:'Clear form',exact:true}).click();await page.reload();assert.equal(await page.locator('#inq-name').inputValue(),'');
  for(const width of [320,375,768,1440,2504]){await page.setViewportSize({width,height:900});await page.goto(base+'/');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`home overflow ${width}`);if(width<1001)assert.ok(await page.locator('.header-whatsapp').isVisible());}
  assert.deepEqual(errors,[]);
  console.log('PASS: crawlable HTML, clean paths, legacy links, model search, sharing metadata, private CMS entry, static proof row, bilingual privacy, process stages, mobile header and truthful validated/idempotent delivery success/failure with a local mock provider. No message sent to LS.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));await new Promise(resolve=>provider.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
