const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  page.on("dialog", dialog => dialog.accept());
  await page.goto(`${base}#company/careers`, { waitUntil: "networkidle" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  const originalCareerHero = await page.locator(".reference-hero-image").getAttribute("src");

  await page.locator(".cms-trigger").click();
  const pagePicker = page.locator("#cms-page");
  assert.ok(await pagePicker.locator('option[value="careers"]').count(), "the shared CMS should include Careers");
  await pagePicker.selectOption("stories");
  assert.ok(await page.locator("#cms-page option[value=\"careers\"]").count(), "the Clients & experiences editor should include Careers");
  await pagePicker.selectOption("careers");
  assert.equal(await page.locator("#career-intro").count(), 1, "selecting Careers from Stories should render the Careers editor");
  await pagePicker.selectOption("contact");
  assert.ok(await page.locator("#cms-page option[value=\"careers\"]").count(), "the Contact editor should include Careers");
  await pagePicker.selectOption("careers");
  assert.equal(await page.locator("#career-intro").count(), 1, "selecting Careers from Contact should render the Careers editor");
  await page.locator(".cms-close").click();

  await page.locator(".cms-trigger").click();
  const generalPagePicker = page.locator("#cms-page");
  assert.ok(await generalPagePicker.locator('option[value="careers"]').count(), "the general CMS editor should include Careers");
  await generalPagePicker.selectOption("careers");
  await page.locator("#career-intro").fill("Careers CMS preview copy fixture");
  const originalPreviewCareerImage = await page.locator(".cms-career-preview-image").getAttribute("src");
  await page.locator("#career-image").selectOption("team");
  assert.notEqual(await page.locator(".cms-career-preview-image").getAttribute("src"), originalPreviewCareerImage, "approved careers media selection should update the private preview");
  await page.locator('[data-career-role-name="0"]').fill("CMS Preview Engineer");
  await page.locator('[data-career-role-url="0"]').fill("https://malaysia.indeed.com/viewjob?jk=3c7cc6d24dbbe026");
  assert.match(await page.locator("#cms-preview-card").innerText(), /Careers CMS preview copy fixture/);
  assert.match(await page.locator("#cms-preview-card").innerText(), /CMS Preview Engineer/);
  await page.locator("[data-save-draft]").click();
  await page.locator(".cms-close").click();
  await page.goto(`${base}#company/careers`, { waitUntil: "networkidle" });
  assert.equal(await page.locator(".career-role").filter({ hasText: "CMS Preview Engineer" }).count(), 0, "career draft must not alter the public preview");

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("careers");
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  assert.equal(await page.locator(".career-role").filter({ hasText: "CMS Preview Engineer" }).count(), 1, "publisher confirmation should publish the careers entry");
  assert.match(await page.locator(".reference-hero-panel .lede").innerText(), /Careers CMS preview copy fixture/);
  assert.notEqual(await page.locator(".reference-hero-image").getAttribute("src"), originalCareerHero, "publisher confirmation should change the careers image selection");
  await page.locator(".cms-close").click();

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("careers");
  await page.locator('[data-career-role-url="1"]').fill("https://example.com/unverified-role");
  await page.locator('[data-career-role-name="1"]').fill("Unverified role");
  await page.locator("[data-save-draft]").click();
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  assert.match(await page.locator(".cms-status").innerText(), /verified LS|social|recruitment/i, "non-LS application links must be blocked");
  await page.locator(".cms-close").click();
  assert.equal(await page.locator(".career-role").filter({ hasText: "Unverified role" }).count(), 0);

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-language").selectOption("zh");
  await page.locator("#cms-role").selectOption("editor");
  await page.locator("#career-intro").fill("职业页面中文翻译测试");
  await page.locator("[data-save-draft]").click();
  await page.locator(".cms-close").click();
  assert.doesNotMatch(await page.locator(".reference-hero-panel .lede").innerText(), /职业页面中文翻译测试/, "Chinese career drafts must remain private before publisher approval");
  await page.locator(".cms-trigger").click();
  await page.locator("#cms-language").selectOption("zh");
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  assert.match(await page.locator(".reference-hero-panel .lede").innerText(), /职业页面中文翻译测试/);
  await page.locator(".cms-close").click();
  await page.locator("#language-picker").selectOption("en");
  assert.match(await page.locator(".reference-hero-panel .lede").innerText(), /Careers CMS preview copy fixture/, "publishing Chinese copy must leave the English translation unchanged");

  await page.goto(`${base}#home`, { waitUntil: "networkidle" });
  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("home");
  const originalHeroSrc = await page.locator(".home-machine-static .hero-machine-image").getAttribute("src");
  await page.locator("#cms-home-hero-machine").selectOption("LSF 502 MCWC");
  assert.match(await page.locator("#cms-preview-card img").getAttribute("alt"), /MCWC/i, "homepage media selection should immediately update the private preview");
  await page.locator("[data-save-draft]").click();
  await page.locator(".cms-close").click();
  assert.equal(await page.locator(".home-machine-static .hero-machine-image").getAttribute("src"), originalHeroSrc, "saving media selection must not change public homepage");

  await page.locator(".cms-trigger").click();
  await page.locator("#cms-page").selectOption("home");
  await page.locator("#cms-role").selectOption("publisher");
  await page.locator("[data-publish]").click();
  assert.notEqual(await page.locator(".home-machine-static .hero-machine-image").getAttribute("src"), originalHeroSrc, "publisher confirmation should change the homepage hero image selection");

  await browser.close();
  console.log("PASS: Careers copy, media and official job links use private preview and publisher approval; homepage hero selection follows the same workflow.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
