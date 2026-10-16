# LS Smart Machinery Website Preview

A local LS Smart Machinery preview with generated HTML pages, a browser application and a Node enquiry-delivery adapter. Generated pages and the stylesheet are included; editing them requires the build steps below.

## Run locally

Start the static server from this folder:

```powershell
node preview-server.cjs
```

Open `http://localhost:8000` in a browser.

## Included

- Responsive homepage, food application, machine category and detail, customer segment, solution, service, company, history, location, careers, insights and inquiry views.
- All 61 catalogue entries across Bakery, Kitchen, Package, Refrigeration Series and Production Line.
- A curated local image library with preserved source files, responsive WebP copies, source hashes and a shared asset manifest.
- Compact catalogue cards with 12 results per page, live search, Bakery subcategory filtering and restored page state. The menu uses a vertical category rail and a vertical list of three machines for the selected category. Category pages introduce featured equipment and production processes before an open, compact equipment range. The 61-entry image audit records 18 exact product-photo matches and 43 labelled category/application references; unresolved products remain text cards rather than borrowing another machine’s photo.
- Public English content. Chinese and Bahasa Melayu drafts remain in the explicit local studio while incomplete translations are reviewed. The enquiry privacy notice includes full English and Bahasa Malaysia text.
- Original-resolution machine inspection with a fitted whole-machine view, zoom slider, wheel zoom, drag/keyboard panning, reset and focus return. Visible motion controls and reduced-motion support. The motion toggle follows the browser preference and allows a saved opt-in.
- The reviewed Higgsfield introduction remains in the asset library. The homepage video disclosure has been removed following the latest browser annotation.
- A RONDO-reference design system with an overlapping production-floor introduction, charcoal product pages, photographic food selections, a linked three-segment photo accordion, expanding planning stages, multi-open FAQ, compact sticky header, click-open navigation, a sliding Portal panel, section tracking and route transitions. Verified client logos appear once in a static row while fewer than six records are available. Six or more sourced records enable continuous motion, with no local headings, arrows or play/pause buttons. The persistent global motion control pauses them; reduced motion stays static. Only sourced client records are shown. The history has a distinct editorial cover and alternating archival chapters, without an orange progress line. The CMS launcher is available only through the explicit ?studio=1 demonstration entry.
- A browser-local CMS demonstration (including a **Contact details** page for the inquiry and careers email and WhatsApp numbers, phone, address and per-weekday opening hours) with private preview, separate editor and publisher roles, drafts, discard, restore, activity history and machine technical-review checks.
- Two-action inquiries: most pages show **Email** (opens a filled draft) and **WhatsApp** (opens a chat with the message filled in), carrying the machine or page context. The full form appears only on Contact (`#inquiry`) and Spare Parts, and also offers email and WhatsApp.
- All three customer segments retain direct production and equipment-category pathways. Inline and dedicated recommendation lists have been removed following the latest annotations; their earlier planning data remains in the source archive.
- A four-chapter Company story and an undated history sequence based on LS’s published history, with restrained scroll motion (off under reduced motion or when motion is paused). The Company menu links to Customer Partnerships. The gallery uses authentic LS-sourced photographs, but no client quote is shown without an attributable source. Careers links to 14 distinct search-indexed Indeed role listings, the LS employer profile and HR contact; no public link leads back to the legacy website. Locations uses a real world map to distinguish the Malaysian base from documented market regions, alongside the Balakong address, visit actions and user-approved opening hours.

## Local CMS boundary

The CMS demonstrates the requested workflow in this browser only. It has no login, server-side permissions, shared storage or public publishing service. The website does not connect to a CRM.

## Before public use

The asset audit records all 61 machine image assignments and their source evidence under `audit-assets/`; 18 are exact product-photo matches and 43 use labelled category/application references. Those 43 do not appear as machine photos on product cards or detail stages. `Steamer-Tray.png` was unreadable and excluded. The reviewed eight-second intro uses Higgsfield-produced framing and crossfades over authentic LS assets; a local poster remains visible if remote playback is unavailable.

Before launch, LS should confirm remaining catalogue/model relationships, specifications, ambiguous product names, customer project details and any attributable comments, social/job destinations, and technical claims. The live LS website currently publishes company registration `1308318-K`, MATRADE/MOF wording and the Balakong address; these are sourced to LS’s site but still need final LS/legal confirmation. Its published history has no dates, so the preview uses undated chapters and avoids conflicting experience-duration claims. The opening hours remain the schedule confirmed for this project (Tue–Sat 9:00am–6:30pm; Sun and Mon closed), which differs from the hours currently shown on the live site. The website remains a local preview: CMS editing is browser-local and CRM, production authentication/storage, hosting and deployment are deferred.

## Reference evidence and checks

`audit-assets/rondo-reference/recordings-review.md` records observations from all four supplied recordings and distinguishes visible evidence from timing assumptions. Live RONDO inspection confirmed click-open menus, scroll-compacting header, the contact drawer, food/category/product and customer-segment paths, and 400ms menu-item transitions with `cubic-bezier(.3,.4,.3,1)` easing. The reconstruction uses LS content and assets; reference company claims, images and specifications are not imported.

Page composition is in `page-design.js` and `reference-design.css`. Navigation and Portal are in `navigation.js` / `navigation.css`; page interaction lifecycles are in `experience.js`. Earlier homepage files are preserved in `audit-assets/checkpoints/before-rondo/`.

Run `node tests/visual-assets.test.cjs`, `node tests/visual-routes.test.cjs`, and `node tests/rondo-experience.test.cjs` with the available Playwright dependency path. The route check includes every catalogue entry. Browser checks cover context and inquiry intent, navigation close/focus behavior, process keyboard controls, FAQ state, section scrolling, reduced motion, and responsive language layouts. Core new components are translated; older company/service/footer copy still needs a complete translation pass. Contact details edited in the CMS are saved in that browser only; production CMS infrastructure remains unconfigured.


## 15 October visual revision

The four new recordings are reviewed in `audit-assets/oct15-reference/reference-review.md`. The authentic production-floor photograph used in the supplied concept is now curated locally with responsive sizes and its source hash. `industrial-ui.js` and `industrial-design.css` provide the equipment pages, original-image viewer, map and aligned footer treatment; `editorial-pages.css` provides the Current at LS, segment, partnership and history compositions. `machine-content.js` holds 21 translated, source-linked machine descriptions/features; numeric technical data is shown only where a particular model is supported. It deliberately excludes copied template data and unrelated videos.

The footer retains the company, registration, contact, address, opening hours and navigation information. Social icons appear in the footer only. The Insights newsletter block has now been removed across all footers, as requested in the latest annotations.

Recruitment evidence, freshness limits and the recruitment destinations are recorded in `audit-assets/oct15-social-review.md`. The employer-profile link is retained because direct job availability can change. The refreshed 14-role data is in `career-opportunities.js`, with freshness limits in `audit-assets/oct15-careers-current.md`; it is not an automatic recruitment feed. No salary, vacancy count, new-post label or unverified Threads profile is published.

Additional checks: `tests/industrial-redesign.test.cjs` verifies vertical discovery, footer cleanup, high-resolution image inspection, recruitment links, map regions and the revised stories. Existing tests cover the 100-item catalogue fixture, three languages, CMS draft isolation/technical review, context preservation, motion, desktop/mobile routes and video fallback.

## Browser annotation revision

The latest 14 annotations are implemented through `brand-refresh.css`, the photographic Services/Solutions/Insights module (`production-pages.js`), `food-applications.js` and shared asset registration (`content-assets.js`). The duplicate capability photographs were caused by legacy image insertion and are now guarded against. The footer and client marquee span the viewport; all legal, company, contact and navigation information is retained. Machine previews remain hidden until a category is hovered/focused (tap on mobile), and change with the hovered category.

All six food groups now use verified real photography with local derivatives and credits in `food-photo-credits.html`. The library contains 13 original photographs and 14 group examples. MCD shows two documented LS cookie applications: piped and spiral cookies. Other machine food examples are restricted to documented process relationships and distinguish stock food references from LS-sourced application photos. The available evidence does not establish a complete list of every recipe or product a configuration can make.

The shared runtime manifest resolves 90 image records, including the additional food references, source hashes, local originals, responsive sizes and three-language alternative text. Only Gardenia and TK Bakery are verified named clients; the duplicate Gardenia files were not counted as additional companies. Additional client records can be prepared in the existing draft/publisher workflow.

The company strip is no longer limited to six records: the existing editor offers Add another company and keeps additional entries private until Publisher confirmation. Only two named company records are currently verified. The source-backed browser-annotation checklist and exact verification scope are in `audit-assets/browser-annotations-review.md`.

## Annotation fixes and restored proportions

The broad desktop redesign has been rolled back. The previous page widths, typography, spacing, colors and image scale are restored through the existing stylesheets. The superseded redesign files are archived under `audit-assets/checkpoints/desktop-redesign/` and are not loaded by the website.

The former annotation stylesheet has been merged into component sources. Those rules retain the three annotated changes: no orange hover box around machine categories, a titles-only Services menu that fits without internal scrolling, and one static home machine without a slide counter, rotating frames or model captions. The original home composition and production-floor background are restored. The CMS still controls its selected machine.

Image adjustments are limited to fitting problems: category discovery images fit inside their existing cards with complete machine geometry, wide company photographs retain their proportions, and the static home machine is centered on small screens. The footer and client strip retain their full viewport width. Current verification notes are in `audit-assets/desktop-proportions-review.md`.
## Full-site critique improvements

Public navigation now uses real paths such as `/machine/mini-cookie-depositor-mcd/`, with legacy fragment links retained for compatibility. `public-pages/` contains 99 complete HTML pages with unique titles/descriptions, production canonical URLs, Open Graph sharing metadata and organization/product structured data. The Node server serves those files before browser enhancement. The sitemap uses the user-confirmed domain `https://lsmachinery.com.my`. Previews are noindex by default; public indexing is a deployment configuration, not evidence of a Google ranking.

The site loads one `site.css`. Edit the component files listed in `styles/manifest.json`; tokens and shared layout have one source. Some historical component overlap remains documented in `styles/README.md`.

Rebuild after changing public content or templates (the page build requires the existing Playwright development runtime):

```powershell
node scripts/build-styles.cjs
node scripts/build-pages.cjs
```

New public pages are `/company/project-process/`, `/privacy/` and `/search/`. Search matches model aliases across all categories. Contact replaces Portal. Public CMS and unfinished language controls are hidden; use `/?studio=1` for the browser-local CMS demonstration. This is not authentication. Startup, SME and enterprise pages have distinct practical guides and documented equipment examples. They do not invent approved client projects, results or starter configurations.

Contact and Parts retain email/WhatsApp handoffs. The newsletter checkbox is removed. Optional production details and session recovery are available. A web-submit action is revealed only when `GET /api/config` reports configured delivery. `POST /api/inquiries` validates fields/origin, limits request sizes/rate, and prevents duplicate forwarding of an accepted request key within the current server process. Its reference confirms provider acceptance, not inbox delivery or a person reading it.

The approved delivery provider will be confirmed by LS later. Deployment operators can configure `LS_INQUIRY_WEBHOOK_URL` (HTTPS; local HTTP allowed only for loopback testing) and optional `LS_INQUIRY_WEBHOOK_TOKEN`. The adapter sends JSON to that approved service; no credentials are sent to the browser. Set `LS_TRUST_PROXY=1` only behind a correctly configured trusted proxy. The adapter is not a durable queue; the chosen provider must own delivery, retry and operational logging. CRM remains deferred.

A non-personal `ls:inquiry-accepted` browser event is emitted after provider acceptance for a future approved analytics connection. No analytics provider was connected and no enquiry was sent to LS during tests. Existing Google Fonts requests are described in the privacy notice. Production privacy ownership, processors and retention need LS approval.

The review response is in `audit-assets/design-critique-actions.md`; evidence gaps are in `audit-assets/proof-input-register.md`. No verified LS datasheets/certificate PDFs, named sales contact or measured client project results were found in the scoped backup search. No substitute evidence was manufactured.

Verification: `tests/site-readiness.test.cjs` and `tests/clean-route-layouts.test.cjs` run the new public server routes and local mock delivery. The original 15 tests retain legacy route/CMS compatibility coverage using `LS_PREVIEW_URL=http://127.0.0.1:PORT/?legacy=1&studio=1`. `node scripts/build-styles.cjs --check` checks stylesheet freshness. For public deployment the server also supports `LS_PUBLIC_SITE=1`; keep previews at their default noindex setting.