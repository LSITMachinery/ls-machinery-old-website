const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on("dialog", dialog => dialog.accept());
  await page.goto(`${base}#machine/planetary-mixer`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const originalIntro = await page.locator(".machine-page-hero .lede").count();

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("machine");
  const machinePicker = page.locator("#cms-machine-model");
  assert.equal(await machinePicker.locator("option").count(), 61, "machine editor should cover every unique catalogue entry");
  await machinePicker.selectOption("planetary-mixer");
  await page.locator("#cms-machine-intro").fill("Approved Planetary Mixer detail fixture");
  assert.match(await page.locator("#cms-preview-card").innerText(), /Planetary Mixer/);
  assert.match(await page.locator("#cms-preview-card").innerText(), /Approved Planetary Mixer detail fixture/);
  await page.locator("[data-save-draft]").click();
  await page.locator(".cms-close").click();
  assert.equal(await page.locator(".machine-page-hero .lede").count(), originalIntro, "machine draft must not change public content");

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("machine");
  await page.locator("#cms-machine-model").selectOption("planetary-mixer");
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  assert.match(await page.locator(".cms-status").innerText(), /technical review/i, "every machine page requires technical review");
  await page.locator("#cms-technical-review").check();
  await page.locator("[data-save-draft]").click();
  await page.locator("[data-publish]").click();
  assert.match(await page.locator(".machine-page-hero .lede").innerText(), /Approved Planetary Mixer detail fixture/);
  await page.goto(`${base}#machine/spiral-mixer`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route === "machine/spiral-mixer");
  assert.doesNotMatch(await page.locator(".machine-page-hero .lede").innerText(), /Approved Planetary Mixer detail fixture/, "one machine edit must not appear on another model page");

  await browser.close();
  console.log("PASS: machine CMS selects all 61 catalogue entries, saves per-model private drafts, and requires technical review before public preview changes.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
