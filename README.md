# LS Smart Machinery website preview

This repository contains the local website preview, its generated public pages and the separate staff CMS service. It keeps LS’s orange, white and charcoal identity, the reviewed image scale and real LS or food photography whose source is recorded.

See [PROJECT-PROGRESS.md](PROJECT-PROGRESS.md) for the objectives, visitor journeys, LS-specific design decisions, tools used, latest verification and remaining work. The [implementation register](qa/implementation-register.md) and [desktop](qa/ls-home-desktop.png), [phone](qa/ls-home-mobile.png) and [machine-page](qa/ls-mcd-desktop.png) screenshots record the latest local review.

## Run the website

```powershell
$env:PORT = '8011'
node preview-server.cjs
```

Open `http://127.0.0.1:8011/`. English is the default. Simplified Chinese and Malaysian Malay use `/zh/` and `/ms/`; switching language keeps the current route. The preview is marked no-index. `lsmachinery.com.my` is the intended public domain, but this project has not been deployed or connected to DNS.

The preview server also provides `/cms/`, `/api/cms/*` and `/api/content/*` routes. When the CMS service is stopped, those routes show that the local CMS is unavailable; they do not silently open a browser-only editor.

## Start the CMS

The CMS is a Node.js 24 and PostgreSQL 18 service packaged with Docker Compose. Follow [cms/README.md](cms/README.md) to create local secrets, start the containers, make the first administrator, and test backup and fresh-instance restore. It has no public registration or preset password. In the latest verification, the local Docker engine was unavailable; the CMS route returned 503 and the requested first administrator was not created.

The CMS staff interface contains English, Simplified Chinese and Malaysian Malay labels. The service implements staff accounts, fixed content records, drafts, revision history, technical review, publisher confirmation, media evidence and published-only content interfaces. Server permissions apply to each action, and a later machine edit requires technical review again. A public content-provider hook and private template preview bridge connect the existing website templates to CMS content. The complete database-backed edit, preview, publish, fresh-browser update and rollback flow still needs live verification. Passing isolated tests is not evidence of a running CMS installation.

## Build and check the website

After editing a page or its source styles, run:

```powershell
node scripts/build-styles.cjs
node scripts/build-pages.cjs
```

The page build visits the public routes and writes complete static HTML for English, Simplified Chinese and Malaysian Malay. Source pages are rendered through the local application, so the build requires the project's Playwright runtime. The build also writes `public-pages/routes.json` and `public-pages/build.json`.

The route, search and inquiry checks start their own preview server. Browser journey tests use a running preview; set its address first. The current local preview is on port 8011:

```powershell
$env:LS_PREVIEW_URL = 'http://127.0.0.1:8011/'
```

Useful checks include:

```powershell
node scripts/build-styles.cjs --check
node --test cms/test/*.test.mjs
.\cms\scripts\test-postgres.ps1 -ProjectName ls-website-cms
node tests/cms-proxy.test.cjs
node tests/cms-workspace-ui.test.cjs
node tests/cms-public-access.test.cjs
node tests/cms-ui-language.test.cjs
node tests/site-readiness.test.cjs
node tests/clean-route-layouts.test.cjs
node tests/navigation-scroll.test.cjs
node tests/navigation-links.test.cjs
node tests/industrial-redesign.test.cjs
node tests/inquiry-context.test.cjs
node tests/catalogue-pagination.test.cjs
node tests/client-carousel-behavior.test.cjs
node tests/visual-assets.test.cjs
```

The visual and content records are kept in `audit-assets/`. `machine-evidence-register.md` records the 61 catalogue entries, verified model-specific evidence and unresolved conflicts. Missing specifications, exact product photographs and demonstration videos are omitted until LS can confirm them. Food and company photographs have source notes in the asset audit.

## Current boundaries

The existing WordPress site and paid cPanel hosting remain live. No production cutover, DNS change, NAS setup or public deployment has been made. Enquiry email/WhatsApp handoffs are available; direct server delivery awaits LS’s choice of provider and credentials. CRM connection is deferred. Project results, machine claims and customer evidence remain subject to source and LS approval.

Latest recorded checks: the public suite passed 18 checks with 2 live-CMS checks skipped; the CMS source suite passed 22 checks with 1 PostgreSQL integration check skipped. The build generated 294 localized HTML pages. Database persistence, administrator setup, media upload, live publishing, backup restoration and rollback remain unverified in the current environment. See [PROJECT-PROGRESS.md](PROJECT-PROGRESS.md), [qa/implementation-register.md](qa/implementation-register.md) and `audit-assets/design-critique-actions.md` for the remaining work.
