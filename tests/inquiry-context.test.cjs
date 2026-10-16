const assert = require("node:assert/strict");
const { chromium } = require("playwright");

const base = process.env.LS_PREVIEW_URL || "http://127.0.0.1:8000/";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1365, height: 900 } });
  await page.goto(`${base}#service/spare-parts-request`, { waitUntil: "domcontentloaded" });
  await page.locator("#part-machine").fill("SN-123");
  await page.locator("#part-model").fill("Hopper Series");
  await page.locator("#part-number").fill("HP-44");
  await page.locator("#part-description").fill("Hopper bracket");
  await page.locator("#part-quantity").fill("2");
  await page.locator("#part-address").fill("12 Bakery Road");
  await page.locator("#part-remarks").fill("Bent in transit");
  await page.getByRole("link", { name: /Use the general inquiry form/ }).click();
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route === "inquiry");
  const message = page.locator("#inq-message");
  for (const detail of ["SN-123", "Hopper Series", "HP-44", "Hopper bracket", "Quantity: 2", "12 Bakery Road", "Bent in transit"]) {
    assert.ok((await message.inputValue()).includes(detail), `general inquiry should preserve ${detail}`);
  }
  assert.match(await page.locator(".inquiry-context").innerText(), /Spare parts follow-up/, "the carried inquiry purpose should be visible");
  await page.locator("#inq-name").fill("Sam Lee");
  await page.locator("#inq-phone").fill("0123456789");
  await page.evaluate(() => { window.__opened = ""; window.open = url => { window.__opened = url; return {}; }; });
  await page.locator("[data-open-whatsapp]").click();
  const whatsapp = await page.evaluate(() => window.__opened);
  assert.ok(decodeURIComponent(whatsapp).includes("Hopper bracket"), "WhatsApp handoff should preserve carried part details");

  await page.evaluate(() => { location.hash = "#inquiry?context=LSF%20502%20MCD&intent=quote"; });
  await page.waitForFunction(() => document.querySelector(".inquiry-context")?.textContent.includes("LSF 502 MCD"));
  assert.match(await page.locator(".inquiry-context").innerText(), /LSF 502 MCD/, "a direct machine inquiry should show its machine context");
  assert.equal(await page.locator("#inq-message").inputValue(), "", "a previous spare-parts summary must not leak into a new machine inquiry");
  await page.evaluate(() => { location.hash = "#machine/lsf-502-mcd"; });
  await page.waitForFunction(() => document.querySelector("#main")?.dataset.route === "machine/lsf-502-mcd");
  const handoffEmail = await page.locator(".inquiry-actions [data-inquiry-email]").last().getAttribute("href");
  const handoffWhatsApp = await page.locator(".inquiry-actions [data-inquiry-whatsapp]").last().getAttribute("href");
  assert.ok(decodeURIComponent(handoffEmail).includes("Inquiry intent: Request a quote"), "email strip handoff should preserve the quote intent");
  assert.ok(decodeURIComponent(handoffEmail).includes("LSF 502 MCD"), "email strip handoff should preserve the model context");
  assert.ok(decodeURIComponent(handoffWhatsApp).includes("Inquiry intent: Request a quote"), "WhatsApp strip handoff should preserve the quote intent");
  assert.ok(decodeURIComponent(handoffWhatsApp).includes("LSF 502 MCD"), "WhatsApp strip handoff should preserve the model context");

  await browser.close();
  console.log("PASS: the spare-parts hero follow-up preserves all fields in WhatsApp and new inquiries show only their own context.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
