const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const base=process.env.LS_PREVIEW_URL||'http://127.0.0.1:8000/';
const clients=Array.from({length:6},(_,i)=>({name:'Carousel fixture '+(i+1),image:'',source:'Isolated approved-source test fixture'}));
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:2215,height:1252}});
 await page.addInitScript(clients=>{clients.forEach((client,index)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=16;const ctx=canvas.getContext('2d');ctx.fillStyle=`hsl(${index*50},50%,50%)`;ctx.fillRect(0,0,16,16);client.customImage=canvas.toDataURL('image/png');});localStorage.setItem('ls-site-cms-published-v1',JSON.stringify({en:{clients}}));},clients);
 await page.goto(base+'#home',{waitUntil:'networkidle'});
 const strip=page.locator('[data-client-carousel]'),track=page.locator('[data-client-track]');
 await strip.scrollIntoViewIfNeeded();await page.mouse.move(5,5);
 assert.equal(await page.locator('.client-strip-logo').count(),6);
 assert.equal(await strip.locator('button').count(),0,'marquee should have no local controls');
 const bounds=await page.locator('.client-marquee').boundingBox();assert.ok(Math.abs(bounds.x)<1&&Math.abs(bounds.width-2215)<1,'client strip spans the viewport');
 await page.waitForFunction(()=>document.querySelector('[data-client-carousel]').dataset.running==='true');
 const transform=()=>track.evaluate(el=>el.style.transform);
 const start=await transform();await page.waitForTimeout(260);assert.notEqual(await transform(),start,'logos move continuously');
 await page.locator('[data-motion-toggle]').first().click();const frozen=await transform();await page.waitForTimeout(300);assert.equal(await transform(),frozen,'global motion control pauses logos');
 await page.locator('[data-motion-toggle]').first().click();await strip.scrollIntoViewIfNeeded();await page.mouse.move(5,5);await page.waitForTimeout(260);assert.notEqual(await transform(),frozen,'global control resumes logos');
 assert.equal(await page.locator('.client-strip-clone:not([aria-hidden="true"])').count(),0,'loop copies do not duplicate accessible company names');
 for(const width of[390,768,1440]){await page.setViewportSize({width,height:900});await page.waitForTimeout(50);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.ok(Math.abs((await page.locator('.client-marquee').boundingBox()).width-width)<1);}
 const reduced=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});await reduced.goto(base+'#home');assert.equal(await reduced.locator('.client-marquee.is-static').count(),1,'fewer than six sourced clients use a static row');assert.equal(await reduced.locator('[data-client-carousel]').count(),0);await reduced.locator('.client-marquee').scrollIntoViewIfNeeded();const still=await reduced.locator('[data-client-track]').getAttribute('style');await reduced.waitForTimeout(300);assert.equal(await reduced.locator('[data-client-track]').getAttribute('style'),still,'reduced motion stays static');
 await browser.close();console.log('PASS: full-width continuous client marquee, global pause/resume, decorative loop copies and reduced motion.');
})().catch(error=>{console.error(error);process.exit(1)});
