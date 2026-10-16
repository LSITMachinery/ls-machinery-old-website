const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const {createServer}=require('../preview-server.cjs');
(async()=>{
 delete process.env.LS_SKIP_PRERENDER;
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',error=>errors.push(error.message));
 const routes=JSON.parse(fs.readFileSync(path.join(__dirname,'../public-pages/routes.json'),'utf8'));
 try{
  const titles=new Set();
  for(const route of routes){
   const url=route==='home'?'/':'/'+route+'/';const response=await page.request.get(base+url);assert.equal(response.status(),200,route);const html=await response.text();assert.match(html,/<main[^>]*>[\s\S]*?<h1\b/,'server-rendered main heading: '+route);const title=html.match(/<title>([^<]+)<\/title>/)?.[1];assert.ok(title,route);assert.ok(!titles.has(title),'unique page title: '+route);titles.add(title);assert.ok(html.includes('https://lsmachinery.com.my'+url),'canonical public address: '+route);
   for(const width of [1440,390]){
    await page.setViewportSize({width,height:1000});await page.goto(base+url);await page.waitForFunction(route=>document.querySelector('#main')?.dataset.route===route,route);
    const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('#main h1').length,rows:document.querySelectorAll('.ls-header-main').length,search:document.querySelectorAll('.header-search-link').length,quick:document.querySelectorAll('.header-whatsapp').length,nav:document.querySelectorAll('.ls-nav-item').length,sectionIndex:document.querySelectorAll('.section-index').length,hash:location.hash}));
    assert.equal(state.overflow,false,route+'/'+width);assert.equal(state.h1,1,route);assert.equal(state.rows,1,'one hydrated header: '+route);assert.equal(state.search,1,route);assert.equal(state.quick,1,route);assert.equal(state.nav,5,route);assert.ok(state.sectionIndex<=1,route);assert.equal(state.hash,'',route);
   }
  }
  assert.deepEqual(errors,[]);console.log(`PASS: ${routes.length} real page addresses have complete HTML, unique titles and production canonicals; ${routes.length*2} hydrated desktop/mobile layouts have one header, working route identity and no horizontal overflow.`);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
