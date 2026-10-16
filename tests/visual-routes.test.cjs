const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";
const routes = [
  "home", "machines", "machines/bakery", "machines/kitchen", "machines/package",
  "machines/refrigeration-series", "machines/production-line", "food", "food/cookies-biscuits",
  "food/bread-buns", "food/cakes", "food/pastries-crusted-foods", "food/kueh-asian-foods", "food/dim-sum", "segment/micro-startup-businesses", "segment/smes-expanding-manufacturers",
  "segment/large-mega-enterprises", "solutions", "solution/factory-line-planning",
  "solution/facility-fit-out", "solution/machinery-automation", "solution/financing-support", "services", "service/support-repairs", "service/spare-parts-request", "service/installation-training", "service/technical-documents", "service/production-improvement",
  "company", "company/history", "company/customer-experiences", "company/customer-partnerships", "company/locations", "company/careers", "insights", "inquiry",
  "machine/lsf-502-mcd", "machine/lsf-502-mcwc", "machine/lsf-502-mcad"
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference" });
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto(`${base}?visual-check=1`, { waitUntil: "domcontentloaded" });
  const navigate = async route => {
    await page.evaluate(nextRoute => { location.hash = '#' + nextRoute; }, route);
    try {
      await page.waitForFunction(nextRoute => document.querySelector('#main').dataset.route === nextRoute, route, {timeout:5000});
    } catch {
      const current = await page.evaluate(() => ({url:location.href,route:document.querySelector('#main')?.dataset.route,router:typeof window.LSRouter}));
      throw new Error(`route did not render: ${route}; current state ${JSON.stringify(current)}`);
    }
    await page.waitForFunction(() => !document.querySelector('.route-curtain'));
  };
  const catalogueRoutes = await page.evaluate(() => window.LS_CATALOGUE.categories.flatMap(category => category.items || (category.subcategories || []).flatMap(sub => sub.items)).map(item => 'machine/' + item.name.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')));
  routes.push(...catalogueRoutes.filter(route => !routes.includes(route)));

  assert.equal(await page.locator('.intro-video,.current-intro-disclosure,.footer-newsletter').count(),0,'removed homepage media and newsletter must stay absent');
  const reducedMotionPage = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reducedMotionPage.goto(base+'?visual-check=1', {waitUntil:'domcontentloaded'});
  const reducedMotionToggle=reducedMotionPage.locator('[data-motion-toggle]').first();
  assert.equal(await reducedMotionToggle.getAttribute('aria-pressed'),'true');
  await reducedMotionToggle.click();
  assert.equal(await reducedMotionPage.locator('html').evaluate(el=>el.classList.contains('motion-opted-in')),true);
  await reducedMotionPage.close();

  for (const route of routes) {
    await navigate(route);
    await page.locator("#main").waitFor({ state: "visible" });
    await page.waitForFunction(() => document.querySelector("#main")?.children.length > 0);
    await page.evaluate(async () => {
      const images = [...document.querySelectorAll("#main img")];
      images.forEach((image) => { image.loading = "eager"; });
      await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    });
    const state = await page.evaluate(() => ({
      imageCount: document.querySelectorAll("#main img").length,
      broken: [...document.querySelectorAll("#main img")].filter((image) => !image.naturalWidth || !image.naturalHeight).map((image) => image.currentSrc || image.src),
      missingAlt: [...document.querySelectorAll("#main img")].filter((image) => !image.hasAttribute("alt")).length,
      emptyMedia: document.querySelectorAll(".video-placeholder, .benefit-visual, .accessory-placeholder").length,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      hero: (() => {
        const el=document.querySelector('.reference-hero,.machine-page-hero,.history-cover,.pp-solutions-intro,.pp-insights-intro');
        if(!el) return null;
        const box=el.getBoundingClientRect();
        const title=el.querySelector('h1');
        const panel=title?.closest('.reference-hero-panel');
        return {editorial:el.matches(".pp-solutions-intro,.pp-insights-intro"),left:box.left,right:box.right,width:innerWidth,title:title?.textContent.trim(),color:title?getComputedStyle(title).color:'',panelBackground:panel?getComputedStyle(panel).backgroundColor:'',images:el.querySelectorAll('img').length};
      })(),
      textStage: !!document.querySelector('.is-process-overview'),
      tallCards: [...document.querySelectorAll('.catalogue-item')].filter((card) => card.getBoundingClientRect().height > 520).length,
      textCardImages: document.querySelectorAll('.catalogue-item.is-text-card img').length,
      route: document.querySelector('#main')?.dataset.route
    }));
    assert.equal(state.route, route, `route did not render: ${route}`);
    assert.ok(state.imageCount > 0 || (route.startsWith("machine/") && state.textStage), `route has neither verified imagery nor the clean text treatment for an unmatched machine: ${route}`);
    assert.deepEqual(state.broken, [], `broken images on ${route}`);
    assert.equal(state.missingAlt, 0, `images without alt text on ${route}`);
    assert.equal(state.emptyMedia, 0, `empty media panels on ${route}`);
    assert.equal(state.overflow, false, `horizontal overflow at desktop width on ${route}`);
    assert.ok(state.hero?.title && (state.hero.images>0 || state.textStage || state.hero.editorial), `missing illustrated page hero on ${route}`);
    assert.equal(state.tallCards, 0, `catalogue cards taller than 520px on ${route}`);
    assert.equal(state.textCardImages, 0, `text-only catalogue cards must not show an image on ${route}`);
    assert.equal(await page.locator(".catalogue-item .small-note, .catalogue-item .catalogue-cue").count(), 0, `catalogue cards must not expose internal asset-review notes on ${route}`);
    assert.doesNotMatch(await page.locator("#main").innerText(), /Details to be confirmed before publication|Photo and details on request|Ask LS for the machine photograph|Equipment and food images are visual references|00:08\s*\/\s*LS SMART MACHINERY|LS premises & machinery · 8-second introduction/i, `public editorial notes must be removed on ${route}`);
    assert.equal(await page.locator('#lead-form').count(), route === 'inquiry' || route === 'services/spare-parts' || route === 'service/spare-parts-request' ? 1 : 0, `full inquiry form should appear only on Contact and Spare Parts (${route})`);
    assert.ok(route === "company/history" || state.hero.editorial || (Math.abs(state.hero.left)<1 && Math.abs(state.hero.right-state.hero.width)<1), `hero does not span the page on ${route}`);
    const titleColor=state.hero.color.match(/\d+/g).map(Number);
    const titleOnLightPanel=route==='home'&&Math.max(...titleColor)<100&&state.hero.panelBackground.match(/\d+/g)?.map(Number).slice(0,3).every(value=>value>220);
    assert.ok(route==='company/history'||state.hero.editorial?Math.max(...titleColor)<100:titleOnLightPanel||Math.min(...titleColor)>225,`hero title should remain readable on ${route}`);
  }

  await navigate('machine/lsf-502-mcd');
  assert.equal(await page.locator("#lead-form").count(), 0, "machine pages should not repeat the full inquiry form");
  assert.equal(await page.locator("#inquiry-summary").count(), 0, "the visible inquiry summary was removed");
  const bandEmail = await page.locator(".production-invitation [data-inquiry-email]").getAttribute("href");
  const bandWhatsApp = await page.locator(".production-invitation [data-inquiry-whatsapp]").getAttribute("href");
  assert.match(bandEmail, /^mailto:marketing@lsmachinery\.com\.my\?subject=.*LSF%20502%20MCD/, "email action should open a draft to marketing with the machine in the subject");
  assert.match(decodeURIComponent(bandEmail), /LSF 502 MCD/, "email draft should carry the machine context");
  assert.match(bandWhatsApp, /^https:\/\/wa\.me\/60126577922\?text=/, "WhatsApp action should open a chat with a pre-filled message");
  assert.match(decodeURIComponent(bandWhatsApp), /LSF 502 MCD/, "WhatsApp message should carry the machine context");
  await page.locator('[data-zoom="in"]').click();
  assert.equal(await page.locator(".viewer-dialog").evaluate(dialog=>dialog.open), true, "zoom opens the high-resolution inspection viewer");
  assert.ok(Number(await page.locator("[data-viewer-range]").inputValue()) > 1, "zoom action should open an enlarged view");
  await page.keyboard.press("Escape");
  await page.locator(".stage-controls [data-fullscreen]").click();
  assert.equal(await page.locator(".viewer-dialog").evaluate((dialog) => dialog.open), true, "fullscreen viewer should open");
  assert.equal(await page.locator(".viewer-dialog .viewer-image").count(), 1, "fullscreen viewer should show the selected machine photo");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".viewer-dialog").evaluate((dialog) => dialog.open), false, "Escape should close the image viewer");
  assert.equal(await page.locator(".stage-controls [data-fullscreen]").evaluate((button) => document.activeElement === button), true, "focus should return to the fullscreen control");

  const motion = page.locator("[data-motion-toggle]").first();
  await motion.click();
  assert.equal(await motion.getAttribute("aria-pressed"), "true", "motion toggle should expose the paused state");
  assert.equal(await page.locator("body").evaluate((body) => body.classList.contains("motion-paused")), true, "motion toggle should pause page effects");
  assert.equal(await page.evaluate(() => localStorage.getItem("ls-site-motion-paused")), "true", "motion choice should persist");
  await motion.click();

  await navigate('food');
  await page.locator(".food-name").first().waitFor({ state: "visible" });
  await page.locator("#language-picker").selectOption("zh");
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-Hans");
  assert.equal(await page.locator(".food-name").first().innerText(), "饼干");
  await page.locator("#language-picker").selectOption("ms");
  assert.equal(await page.locator("html").getAttribute("lang"), "ms");
  assert.equal(await page.locator(".food-name").first().innerText(), "Biskut & Kuki");

  await page.setViewportSize({ width: 390, height: 844 });
  // Check every rendered page on mobile with static transitions for a bounded run.
  await page.locator('[data-motion-toggle]').first().click();
  for (const route of routes) {
    await navigate(route);
    const overflow = await page.evaluate(() => ({
      width: innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyChildren: [...document.body.children].map((element) => ({ className: element.className, right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width), scrollWidth: element.scrollWidth })),
      mainSections: [...document.querySelectorAll("#main > *")].map((element) => ({ className: element.className, id: element.id, right: Math.round(element.getBoundingClientRect().right), scrollWidth: element.scrollWidth, clientWidth: element.clientWidth })),
      currentElements: [...document.querySelectorAll(".current-section *")].map((element) => ({ tag: element.tagName, className: typeof element.className === "string" ? element.className : "", right: Math.round(element.getBoundingClientRect().right), left: Math.round(element.getBoundingClientRect().left), width: Math.round(element.getBoundingClientRect().width), scrollWidth: element.scrollWidth })),
      elements: [...document.querySelectorAll("body *")].map((element) => ({
        tag: element.tagName.toLowerCase(), className: typeof element.className === "string" ? element.className : "",
        right: Math.round(element.getBoundingClientRect().right), text: element.textContent?.trim().slice(0, 50)
      })).filter((element) => element.right > innerWidth + 1).sort((a, b) => b.right - a.right).slice(0, 12)
    }));
    assert.ok(overflow.documentWidth <= overflow.width + 1, `horizontal overflow at mobile width on ${route}: ${JSON.stringify(overflow)}`);
    const mobileHero=await page.locator('.reference-hero,.machine-page-hero,.history-cover,.pp-solutions-intro,.pp-insights-intro').evaluate(el=>({editorial:el.matches('.pp-solutions-intro,.pp-insights-intro'),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,width:innerWidth,title:el.querySelector('h1')?.getBoundingClientRect().right}));
    assert.ok((route === "company/history" || mobileHero.editorial || (Math.abs(mobileHero.left)<1 && Math.abs(mobileHero.right-mobileHero.width)<1)) && mobileHero.title<=mobileHero.width, `mobile hero overflow on ${route}`);
  }

  await navigate('home');
  await page.selectOption("#language-picker", "en");
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(os.tmpdir(), "ls-home-mobile.png"), fullPage: true });
  await page.screenshot({ path: path.join(os.tmpdir(), "ls-dark-hero-mobile.png") });
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:path.join(os.tmpdir(), "ls-dark-hero-desktop.png")});
  assert.deepEqual(pageErrors, [], "browser should not report uncaught JavaScript errors");
  await browser.close();
  console.log(`PASS: ${routes.length} desktop routes render sourced images without broken assets, empty media or horizontal overflow; gallery, inquiry context, motion toggle and three languages work.`);
  console.log(`PASS: all ${routes.length} route layouts fit desktop and mobile, including the distinct history cover; screenshots were written to the system temporary folder.`);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
