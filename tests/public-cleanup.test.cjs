const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await page.goto(`${base}#home`, { waitUntil: "networkidle" });
  const homeText = await page.locator("#main").innerText();
  assert.doesNotMatch(homeText, /Equipment and food images are visual references|00:08\s*\/\s*LS SMART MACHINERY|LS premises & machinery · 8-second introduction/i);
  assert.equal(await page.locator(".catalogue-item .small-note, .catalogue-item .catalogue-cue").count(), 0, "catalogue cards should not show editorial asset notes");
  assert.equal(await page.locator(".client-strip-logo").count(), 2, "current client strip should use its two sourced client records");
  assert.equal(await page.locator(".footer-brand .brand-logo").count(), 1, "the footer should display one visible LS mark");
  assert.equal(await page.locator(".footer-social-icons a").count(), 7, "the footer should link all seven verified social and recruitment channels as icons");
  assert.match(await page.locator(".site-footer").innerText(), /1308318-K[\s\S]*MATRADE Registered · MOF Organization Certified/);

  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('[data-client-pause],[data-client-prev],[data-client-next]').count(),0,'client marquee must not show local slideshow controls');
  assert.ok(Math.abs((await page.locator('.client-marquee').boundingBox()).width-390)<1,'client marquee spans the viewport');

  await page.evaluate(() => { location.hash = "#machine/heavy-duty-robot-cooker-machine"; });
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route === "machine/heavy-duty-robot-cooker-machine");
  assert.equal(await page.locator(".machine-stage-text p").count(), 0, "an unconfirmed machine image should not be replaced with an editorial placeholder");
  assert.equal(await page.locator(".machine-hero-copy h1").innerText(), "Heavy Duty Robot Cooker Machine");
  assert.equal(await page.locator(".machine-stage").count(), 0, "unmatched machines should not have an empty image stage");

  await page.evaluate(() => { location.hash = "#company/customer-experiences"; });
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route === "company/customer-experiences");
  assert.equal(await page.locator(".customer-experience-card blockquote").count(), 0, "the gallery must not invent customer quotations");
  assert.equal(await page.locator(".customer-experience-grid img").count(), 10, "the gallery should use all ten sourced LS gallery images");
  await browser.close();
  console.log("PASS: public imagery is free of audit captions, unresolved catalogue notes, empty machine photo copy and fabricated testimonials; the client strip remains full width without local controls.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
