const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on("dialog", dialog => dialog.accept());
  await page.goto(`${base}#home`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("contact");
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator('[data-contact-field="phone"]').fill("+60 11-2222 3333");
  await page.locator("[data-contact-publish]").click();
  assert.match(await page.locator(".site-footer").innerText(), /\+60 11-2222 3333/, "publisher-confirmed contact data should appear in the preview");

  await page.locator(".cms-close").click();
  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("contact");
  await page.locator("#cms-role").selectOption("editor");
  await page.locator("[data-contact-reset]").click();
  assert.match(await page.locator(".cms-status").innerText(), /private draft|Publisher must confirm/i, "reset should prepare a private draft");
  assert.match(await page.locator(".site-footer").innerText(), /\+60 11-2222 3333/, "reset must not change the published contact preview");

  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-contact-publish]").click();
  assert.match(await page.locator(".site-footer").innerText(), /\+60 12-657 7922/, "the built-in details should appear only after publisher confirmation");
  await browser.close();
  console.log("PASS: resetting contact details creates a private draft; only Publisher confirmation updates the website preview.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
