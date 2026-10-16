const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on("dialog", dialog => dialog.accept());
  await page.goto(`${base}#machine/lsf-502-mcd`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  const publicTitle = page.locator(".machine-page-hero h1");
  const publicIntro = page.locator(".machine-page-hero .lede");
  const originalTitle = await publicTitle.innerText();
  const originalIntro = await publicIntro.innerText();

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("machine");
  await page.locator("#cms-machine-title").fill("Reviewed MCD title fixture");
  await page.locator("#cms-machine-intro").fill("Reviewed machine introduction fixture");
  assert.match(await page.locator("#cms-preview-card").innerText(), /Reviewed MCD title fixture/);
  assert.match(await page.locator("#cms-preview-card").innerText(), /Reviewed machine introduction fixture/);
  await page.locator("[data-save-draft]").click();
  await page.locator(".cms-close").click();
  assert.equal(await publicTitle.innerText(), originalTitle, "saving a machine draft must not change the public page");
  assert.equal(await publicIntro.innerText(), originalIntro, "saving a machine draft must not change public machine copy");

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("machine");
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  assert.match(await page.locator(".cms-status").innerText(), /technical review/i, "machine copy cannot publish without a saved technical review");
  await page.locator("#cms-technical-review").check();
  await page.locator("[data-save-draft]").click();
  await page.locator("[data-publish]").click();
  assert.equal(await publicTitle.innerText(), "Reviewed MCD title fixture", "publisher confirmation should apply the reviewed title");
  assert.equal(await publicIntro.innerText(), "Reviewed machine introduction fixture", "publisher confirmation should apply the reviewed introduction");

  await page.locator("#cms-machine-intro").fill("Changed after technical review");
  assert.equal(await page.locator("#cms-technical-review").isChecked(), false, "editing reviewed machine copy must revoke its review");
  await page.locator("[data-save-draft]").click();
  await page.locator("[data-publish]").click();
  assert.match(await page.locator(".cms-status").innerText(), /technical review/i, "changed machine copy needs a new technical review");
  assert.equal(await publicIntro.innerText(), "Reviewed machine introduction fixture", "unreviewed changes must remain private");

  await browser.close();
  console.log("PASS: featured-machine CMS edits preview live, drafts stay private, publishers need technical review, and changed copy requires renewed review.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
