const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const scriptOrder = ["catalogue-data.js", "asset-manifest.js", "app.js"].map((src) => index.indexOf(src));
assert.ok(scriptOrder.every((index) => index >= 0), "catalogue, asset manifest and app scripts must all load");
assert.ok(scriptOrder[0] < scriptOrder[1] && scriptOrder[1] < scriptOrder[2], "asset manifest must load after catalogue data and before app rendering");

const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "catalogue-data.js"), "utf8"), context);
vm.runInNewContext(fs.readFileSync(path.join(root, "asset-manifest.js"), "utf8"), context);
vm.runInNewContext(fs.readFileSync(path.join(root,'food-applications.js'),'utf8'),context);
vm.runInNewContext(fs.readFileSync(path.join(root,'content-assets.js'),'utf8'),context);
const catalogue = context.window.LS_CATALOGUE;
const manifest = context.window.LS_ASSET_MANIFEST;
assert.ok(manifest && manifest.images && manifest.catalogue, "shared image and catalogue mappings must be available");
assert.match(manifest.media?.introVideo || "", /^https:\/\//, "the homepage intro should reference the reviewed Higgsfield video");
assert.ok(fs.readFileSync(path.join(root, "audit-assets/build_visual_assets.py"), "utf8").includes(manifest.media.introVideo), "rebuilding the image manifest must preserve the intro video reference");
const recommendationNames = Object.values(catalogue.segmentRecommendations || {}).flat();
assert.equal(Object.keys(catalogue.segmentRecommendations || {}).length, catalogue.businessSegments.length, "every customer segment needs recommendations");
const catalogueNames = new Set(catalogue.categories.flatMap((category) => category.items || category.subcategories.flatMap((subcategory) => subcategory.items)).map((item) => item.name));
for (const pick of recommendationNames) { assert.ok(catalogueNames.has(pick.name), `segment recommendation is not a catalogue entry: ${pick.name}`); assert.ok(pick.reason.en && pick.reason.zh && pick.reason.ms, `recommendation needs en/zh/ms reasons: ${pick.name}`); }
const items = catalogue.categories.flatMap((category) => category.items || category.subcategories.flatMap((subcategory) => subcategory.items));
assert.equal(items.length, 61, "source catalogue should remain complete");
assert.equal(Object.keys(manifest.catalogue).length, items.length, "every catalogue entry needs an explicit image assignment");
for (const item of items) {
  const assignment = manifest.catalogue[item.name];
  assert.ok(assignment, `missing image mapping: ${item.name}`);
  assert.ok(["exact", "category"].includes(assignment.match), `invalid image match type: ${item.name}`);
  assert.ok(manifest.images[assignment.image], `missing image record for ${item.name}`);
  if (assignment.match === "category") assert.ok(assignment.label, `category image needs a visible label for ${item.name}`);
}
for (const [key, image] of Object.entries(manifest.images)) {
  assert.ok(image.width > 0 && image.height > 0, `image dimensions missing: ${key}`);
  assert.ok(image.source, `source provenance missing: ${key}`);
  assert.ok(image.sha256 && /^[a-f0-9]{64}$/.test(image.sha256), `source hash missing: ${key}`);
  assert.ok(image.original && fs.existsSync(path.join(root, image.original)), `preserved original missing: ${key}`);
  for (const language of ["en", "zh", "ms"]) assert.ok(image.alt[language], `${language} alt text missing: ${key}`);
  const responsiveWidths = Object.keys(image.sizes).map(Number).sort((a, b) => a - b);
  assert.ok(responsiveWidths.length >= 2, `responsive image sizes missing: ${key}`);
  for (const width of responsiveWidths) {
    const asset = image.sizes[width];
    assert.ok(asset, `${width}px image missing: ${key}`);
    assert.ok(fs.existsSync(path.join(root, asset)), `local image file missing: ${asset}`);
  }
}
for (const key of ["brand", "homepageHero", "building", "foods", "segments", "solutions", "services"]) {
  assert.ok(manifest.sections[key], `shared page image assignment missing: ${key}`);
}
assert.ok(manifest.sections.foods["cookies-biscuits"], "food groups need local photographs");
assert.ok(manifest.sections.segments["micro-startup-businesses"], "business segment pages need illustrative photographs");
assert.equal(Object.keys(manifest.captions || {}).length, 0, "remove the requested public image-audit captions");
console.log(`PASS: ${items.length} catalogue entries and ${Object.keys(manifest.images).length} sourced images resolve to preserved originals and responsive local sizes.`);
