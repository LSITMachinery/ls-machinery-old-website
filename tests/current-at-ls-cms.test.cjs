const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1365, height: 900 }, reducedMotion: "reduce" });
    page.on("dialog", dialog => dialog.accept());
    await page.goto(`${base}?studio=1`, { waitUntil: "networkidle" });
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: "networkidle" });

    const publicTitle = page.locator(".current-editorial-title");
    const publicBody = page.locator(".current-editorial-panel .body-copy").first();
    const originalTitle = await publicTitle.innerText();
    const originalBody = await publicBody.innerText();
    const changedTitle = "Current at LS title preview fixture";
    const changedBody = "Current at LS description preview fixture";

    await page.locator(".cms-trigger").click();
    await page.locator("#cms-page").selectOption("home");
    await page.locator("#cms-current-title").fill(changedTitle);
    await page.locator("#cms-current").fill(changedBody);
    assert.match(await page.locator("#cms-preview-card").innerText(), /Current at LS title preview fixture/, "the Current at LS title should update in the private preview while editing");
    assert.match(await page.locator("#cms-preview-card").innerText(), /Current at LS description preview fixture/, "the Current at LS description should update in the private preview while editing");
    assert.equal(await publicTitle.innerText(), originalTitle, "unsaved title edits must remain private");
    assert.equal(await publicBody.innerText(), originalBody, "unsaved description edits must remain private");

    await page.locator("[data-save-draft]").click();
    await page.locator(".cms-close").click();
    assert.equal(await publicTitle.innerText(), originalTitle, "saving a draft must not change the public title");
    assert.equal(await publicBody.innerText(), originalBody, "saving a draft must not change the public description");

    await page.locator(".cms-trigger").click();
    await page.locator("#cms-page").selectOption("home");
    assert.equal(await page.locator("#cms-current-title").inputValue(), changedTitle, "the saved title draft should reopen");
    assert.equal(await page.locator("#cms-current").inputValue(), changedBody, "the saved description draft should reopen");
    assert.equal(await page.locator("[data-publish]").isDisabled(), true, "editors must not publish the draft");
    await page.locator("#cms-role").selectOption("publisher");
    await page.locator("[data-publish]").click();
    assert.equal(await publicTitle.innerText(), changedTitle, "publisher confirmation should apply the Current at LS title");
    assert.equal(await publicBody.innerText(), changedBody, "publisher confirmation should apply the Current at LS description");

    console.log("PASS: Current at LS title and description preview live, drafts remain private, and publisher confirmation applies both fields.");
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
