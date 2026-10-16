const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await page.goto(`${base}#home`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const kitchen = window.LS_CATALOGUE.categories.find((category) => category.name === "Kitchen");
    kitchen.items = Array.from({ length: 100 }, (_, index) => ({ name: `Kitchen Fixture ${String(index).padStart(3, "0")}` }));
    location.hash = "#machines/kitchen";
  });
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route === "machines/kitchen");

  assert.equal(await page.locator("#catalogue-count").innerText(), "100 machines", "the result count should reflect all filtered records");
  assert.equal(await page.locator(".catalogue-item").count(), 12, "the first page should show no more than 12 cards");
  assert.equal(await page.locator("[data-catalogue-page]").count(), 9, "100 items should use nine pages at 12 per page");
  await page.locator("#language-picker").selectOption("zh");
  await page.waitForFunction(() => document.querySelector("#catalogue-count")?.textContent === "100 台设备");
  assert.equal(await page.locator("#catalogue-pagination").getAttribute("aria-label"), "目录分页", "pagination navigation should be translated into Chinese");
  assert.equal(await page.locator("[data-catalogue-page='1']").getAttribute("aria-label"), "第 1 页", "page controls should be translated into Chinese");
  await page.locator("#language-picker").selectOption("ms");
  await page.waitForFunction(() => document.querySelector("#catalogue-count")?.textContent === "100 mesin");
  assert.equal(await page.locator("#catalogue-pagination").getAttribute("aria-label"), "Halaman katalog", "pagination navigation should be translated into Malay");
  await page.locator("#language-picker").selectOption("en");
  await page.waitForFunction(() => document.querySelector("#catalogue-count")?.textContent === "100 machines");

  await page.locator("#catalogue-search").fill("Fixture 0");
  assert.equal(await page.locator("#catalogue-count").innerText(), "100 machines", "search should update the filtered result count");
  await page.locator("[data-catalogue-page='3']").click();
  assert.equal(await page.locator("[data-catalogue-page='3']").getAttribute("aria-current"), "page", "search should preserve the current page when it remains valid");
  const selectedMachine = page.locator(".catalogue-item").first();
  const selectedHref = await selectedMachine.getAttribute("href");
  await selectedMachine.click();
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route.startsWith("machine/"));
  await page.goBack();
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route === "machines/kitchen");
  assert.equal(await page.locator("#catalogue-search").inputValue(), "Fixture 0", "returning from a product should restore the search");
  assert.equal(await page.locator("[data-catalogue-page='3']").getAttribute("aria-current"), "page", "returning from a product should restore the page");
  assert.equal(await page.locator(".catalogue-item").first().getAttribute("href"), selectedHref, "the same filtered page should be restored");

  await browser.close();
  console.log("PASS: 100-entry catalogues paginate at 12 items and restore search/page state after returning from a machine.");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
