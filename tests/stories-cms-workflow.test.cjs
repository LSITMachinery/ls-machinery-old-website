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
  const pagePicker = page.locator("#cms-page");
  assert.ok(await pagePicker.locator('option[value="stories"]').count(), "the shared editor should offer Clients & experiences");
  await pagePicker.selectOption("stories");
  await page.locator(".cms-story-slot").nth(15).locator("summary").click();
  await page.locator('[data-story-body="9"]').fill("Tenth gallery description preview fixture");
  assert.equal(await page.locator(".cms-story-gallery-preview figure").count(), 10, "the private preview should include every editable gallery item");
  assert.match(await page.locator("#cms-preview-card").innerText(), /Tenth gallery description preview fixture/, "gallery description edits should appear in the live private preview");
  await page.locator(".cms-story-slot").nth(2).locator("summary").click();
  await page.locator('[data-story-client-name="2"]').fill("New documented client");
  await page.locator('[data-story-client-source="2"]').fill("LS-approved client reference");
  assert.match(await page.locator("#cms-preview-card").innerText(), /New documented client/, "edits should update the private preview");
  await page.locator("[data-save-draft]").click();
  await page.locator(".cms-status").waitFor();
  await page.locator(".cms-close").click();
  assert.equal(await page.locator(".client-strip-logo").filter({ hasText: "New documented client" }).count(), 0, "saving a draft must not change the public client strip");

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("stories");
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  await page.locator(".cms-close").click();
  assert.equal(await page.locator(".client-strip-logo").filter({ hasText: "New documented client" }).count(), 1, "publisher confirmation should publish the reviewed client entry");

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("stories");
  await page.locator(".cms-story-slot").nth(3).locator("summary").click();
  await page.locator('[data-story-client-name="3"]').fill("Client without a source");
  await page.locator('[data-story-client-source="3"]').fill("");
  await page.locator("[data-save-draft]").click();
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  assert.match(await page.locator(".cms-status").innerText(), /source/i, "publishing a client without a source must be blocked with a clear reason");
  await page.locator(".cms-close").click();
  assert.equal(await page.locator(".client-strip-logo").filter({ hasText: "Client without a source" }).count(), 0, "an unsourced client must remain private");

  await browser.close();
  console.log("PASS: story CMS edits stay private until publisher confirmation, and unsupported client entries cannot publish.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
