const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const path = require('node:path');
const base = process.env.LS_PREVIEW_URL || 'http://127.0.0.1:8000/';
(async()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'#home',{waitUntil:'networkidle'});
  for(const width of [1440,390]) {
    await page.setViewportSize({width,height:900});
    for(const route of ['food','machines','solutions','services','company']) {
      await page.goto(base+'#home');
      if(width<1001) await page.locator('.mobile-toggle').click();
      const link=page.locator(`.primary-nav .ls-nav-link[data-nav="${route}"]`);
      assert.equal(await link.count(),1,`the ${route} label must be a page link`);
      assert.equal(await link.getAttribute('href'),'#'+route);
      await link.click();
      await page.waitForFunction(route=>document.querySelector('#main').dataset.route===route,route);
      assert.equal(await page.evaluate(()=>location.hash),'#'+route);
      assert.equal(await page.locator('#main h1').count(),1);
      assert.equal(await page.locator('#main').evaluate(el=>el.inert),false);
    }
    await page.goto(base+'#home');
    if(width<1001) await page.locator('.mobile-toggle').click();
    if(width>1000) {
      await page.locator('.ls-nav-item:has([data-nav="machines"])').hover();
      assert.equal(await page.locator('.ls-desktop-menu').isVisible(),true,'desktop menus should preview on hover');
      await page.locator('.ls-nav-trigger[data-menu="machines"]').click();
    } else await page.locator('.ls-nav-trigger[data-menu="machines"]').click();
    assert.equal(await page.evaluate(()=>location.hash),'#home','dropdown control must not change pages');
    const menu=width>1000?page.locator('.ls-desktop-menu'):page.locator('#ls-mobile-machines');
    assert.equal(await menu.isVisible(),true);
    const machineCategories = menu.locator('[data-machine-category]');
    assert.equal(await machineCategories.count(),5,'machine dropdown should select among five categories');
    const selectedMachinePanel = menu.locator('[data-machine-category-panel]:visible');
    assert.equal(await selectedMachinePanel.count(),0,'machine choices stay hidden until a category is hovered or focused');
    if(width>1000)await machineCategories.filter({hasText:'Bakery'}).hover();else await machineCategories.filter({hasText:'Bakery'}).click();
    assert.equal(await selectedMachinePanel.count(),1);
    assert.equal(await selectedMachinePanel.locator('li a').count(),3,'the selected category should show three featured machines');
    assert.deepEqual(await selectedMachinePanel.locator('li a').allTextContents(),['Mini Cookie Depositor (MCD)','Mini Cookie Wire Cut (MCWC)','Mini Cake Depositor (MCAD)'],'Bakery should prioritize the three requested cookie/cake machine candidates');
    assert.equal(await selectedMachinePanel.locator('.ls-menu-all').getAttribute('href'),'#machines/bakery','View all should open the selected category');
    await machineCategories.filter({hasText:'Bakery'}).focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.machineCategory),'kitchen','arrow keys should move between category controls');
    assert.equal(await menu.locator('[data-machine-category-panel]:visible .ls-menu-all').getAttribute('href'),'#machines/kitchen','keyboard focus should preview the focused category');
    await page.keyboard.press('Enter');
    if(width>1000) {
      await machineCategories.filter({hasText:'Kitchen'}).hover();
      assert.equal(await menu.locator('[data-machine-category-panel]:visible .ls-menu-all').getAttribute('href'),'#machines/kitchen','hover should preview a category');
    }
    await machineCategories.filter({hasText:'Kitchen'}).click();
    await machineCategories.filter({hasText:'Bakery'}).hover();
    assert.equal(await menu.locator('[data-machine-category-panel]:visible .ls-menu-all').getAttribute('href'),width>1000?'#machines/bakery':'#machines/kitchen','desktop hover follows the pointer; mobile selection follows taps');
    await machineCategories.filter({hasText:'Bakery'}).click();
    await menu.locator('a[href="#machines/bakery"]').first().click();
    await page.waitForFunction(()=>document.querySelector('#main').dataset.route==='machines/bakery');
    assert.equal(await page.locator('#main').evaluate(el=>el.inert),false);
  }
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base+'#home');
  await page.locator('.ls-nav-trigger[data-menu="services"]').click();
  const serviceMenu=page.locator('.ls-desktop-menu');
  assert.equal(await serviceMenu.locator('.ls-menu-column h3 a').count(),5,'all five services remain available');
  assert.equal(await serviceMenu.locator('img,p').count(),0,'service choices contain titles only');
  assert.ok(await serviceMenu.evaluate(el=>el.scrollHeight<=el.clientHeight+1),'all service choices fit without internal scrolling');
  await page.keyboard.press('Escape');
  await page.locator('.ls-nav-trigger[data-menu="machines"]').click();
  const bakeryTab=page.locator('.ls-desktop-menu [data-machine-category="bakery"]');
  await bakeryTab.hover();
  assert.equal(await bakeryTab.evaluate(el=>getComputedStyle(el).outlineStyle),'none','pointer hover has no outline box');
  await page.keyboard.press('Escape');
  await page.locator('.insights-link').click();
  await page.waitForFunction(()=>document.querySelector('#main').dataset.route==='insights');
  await page.locator('.portal-button').click();
  assert.equal(await page.locator('.ls-contact-drawer').evaluate(el=>el.open),true);
  await page.keyboard.press('Escape');
  await page.locator('.ls-header .brand').click();
  await page.waitForFunction(()=>document.querySelector('#main').dataset.route==='home');
  await page.locator('.ls-nav-link[data-nav="machines"]').click();
  await page.waitForFunction(()=>document.querySelector('#main').dataset.route==='machines');
  await page.locator('#main img').first().evaluate(el=>el.decode());
  await page.screenshot({path:path.join(require('node:os').tmpdir(),'ls-navigation-links.png')});
  assert.deepEqual(errors,[]);
  await browser.close();
  console.log('PASS: all five navigation labels redirect on desktop and mobile; separate dropdown controls and category links work; Insights, Portal and home links work.');
})().catch(error=>{console.error(error);process.exit(1)});
