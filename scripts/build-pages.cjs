/* Static HTML for crawlers, sharing previews and visitors without JavaScript. */
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
process.env.LS_SKIP_PRERENDER='1';
const homeOnly=process.argv.includes('--home-only');
const {createServer}=require('../preview-server.cjs');
const slug=value=>value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
(async()=>{
 const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const originalHeader=fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<header\b[\s\S]*?<\/header>/)[0];
 const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const base='http://127.0.0.1:'+server.address().port;
  await page.goto(base+'/');
  const catalogue=await page.evaluate(()=>window.LS_CATALOGUE.categories.map(c=>({name:c.name,items:c.items||(c.subcategories||[]).flatMap(s=>s.items)})));
  const routes=['home','machines','food','solutions','services','company','company/history','company/customer-partnerships','company/project-process','company/locations','company/careers','insights','inquiry','privacy','search',...['cookies-biscuits','cakes','bread-buns','pastries-crusted-foods','kueh-asian-foods','dim-sum'].map(s=>'food/'+s),...['micro-startup-businesses','smes-expanding-manufacturers','large-mega-enterprises'].map(s=>'segment/'+s),...['factory-line-planning','machinery-automation','facility-fit-out','financing-support'].map(s=>'solution/'+s),...['support-repairs','installation-training','technical-documents','spare-parts-request','production-improvement'].map(s=>'service/'+s),...catalogue.map(c=>'machines/'+slug(c.name)),...catalogue.flatMap(c=>c.items.map(i=>'machine/'+slug(i.name)))];
  const allRoutes=[...new Set(routes)],unique=homeOnly?allRoutes.filter(route=>route==='home'):allRoutes,out=path.join(root,'public-pages');fs.mkdirSync(out,{recursive:true});
  for(const route of unique){
   await page.goto(base+(route==='home'?'/':'/'+route+'/'));
   await page.waitForFunction(route=>document.querySelector('#main')?.dataset.route===route&&document.documentElement.dataset.metadataRoute===route,route);
   const html=await page.evaluate(originalHeader=>{
    const clone=document.documentElement.cloneNode(true);clone.querySelectorAll('meta[name="robots"],.cms-trigger,.route-curtain,.client-strip-clone').forEach(e=>e.remove());
    clone.querySelectorAll('.ls-navigation-backdrop,.ls-contact-drawer,.section-index').forEach(e=>e.remove());
    clone.querySelector('header.site-header').outerHTML=originalHeader;
    clone.querySelectorAll('header a[href^="#"]').forEach(a=>{const value=a.getAttribute('href').slice(1);a.setAttribute('href',value==='home'?'/':'/'+value+'/');});
    clone.querySelectorAll('.fade-in').forEach(e=>e.classList.add('is-visible'));
    const main=clone.querySelector('#main');main.inert=false;main.removeAttribute('inert');
    clone.querySelectorAll('[aria-hidden="false"]').forEach(e=>e.removeAttribute('aria-hidden'));
    clone.querySelectorAll('input,textarea').forEach(e=>{if(!['search','hidden'].includes(e.type))e.value='';});
    clone.querySelectorAll('dialog[open]').forEach(e=>e.removeAttribute('open'));
    return '<!doctype html>\n'+clone.outerHTML;
   },originalHeader);
   const dest=path.join(out,route);fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'index.html'),html);
  }
  if(errors.length)throw new Error([...new Set(errors)].join('\n'));
  if(!homeOnly){
   fs.writeFileSync(path.join(out,'routes.json'),JSON.stringify(unique,null,2));
   fs.writeFileSync(path.join(out,'build.json'),JSON.stringify({builtAt:new Date().toISOString(),domain:'https://lsmachinery.com.my',pages:unique.length},null,2));
   console.log(`Built ${unique.length} complete HTML pages with unique metadata, canonical links and share images.`);
  } else console.log('Built homepage snapshot only; route manifest and shared build metadata were preserved.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
