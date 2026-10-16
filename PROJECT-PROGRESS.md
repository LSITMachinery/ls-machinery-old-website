# LS Smart Machinery — project objectives and progress

Latest recorded review: 17 October 2026. This repository is a local development and management-review project. The existing WordPress/cPanel website remains the live system.

## Objective

Create a credible industrial website for LS Smart Machinery that helps food producers find suitable equipment, understand the available evidence and contact LS with useful production context. Give staff a private CMS to maintain the new website as content is migrated from WordPress.

## Goals

- Present LS as an established machinery and engineering partner with a modern European industrial visual style.
- Help visitors browse by food, machine, production need and service, without a shopping-cart experience.
- Explain machine capabilities using verified specifications, real photographs and appropriately matched demonstrations.
- Keep pages readable on phones and large desktops, with accessible navigation and restrained motion.
- Support English, Simplified Chinese and Malaysian Malay, including search and page metadata.
- Provide real page addresses, sharing metadata and the intended domain `lsmachinery.com.my`.
- Protect drafts and technical claims through staff permissions, revision history, technical review and publisher confirmation.
- Prepare WordPress content import into the new CMS while keeping production cutover separate.

## Visitors and journeys

| Visitor | Main journey |
|---|---|
| Startup or small food business | Choose a food, explore relevant processes, review equipment, ask LS about suitability. |
| Growing manufacturer | Find equipment around a bottleneck, compare documented capabilities, discuss space and production requirements. |
| Large manufacturer or technical buyer | Review model details and evidence, discuss configuration and integration, request technical information or a quotation. |
| Existing customer or operator | Find support, training, documents or spare parts and include the machine context in the inquiry. |
| Job applicant | Review careers and follow the recorded recruitment channels. |
| LS staff | Sign in privately, edit named fields and translations, manage media, request review and publish approved revisions. |

## Personalization for LS

These are LS-specific brand and interaction decisions; the site does not implement individual visitor profiling.

- Orange, white and charcoal remain the primary identity, with the approved typography and image scale.
- Real LS and food photography is retained with source records. Missing evidence is not replaced with invented technical claims or testimonials.
- The homepage begins with the supplied LS YouTube introduction (`4RA9dekfBEc`), a compact headline panel and the featured machine. Food links precede Current at LS.
- Food links are unboxed and use circular photographs. Machine food applications use the same compact circular treatment.
- The production-stage selector appears only on Services and describes the visitor's stated need.
- Inquiry handoffs carry relevant machine, food, page and intent context. Direct CRM delivery remains deferred.
- Language switching retains the page; personal language and motion preferences remain available.
- The staff CMS uses `/cms/` and has no public navigation or footer link.

## Latest progress

| Work | Current state |
|---|---|
| Public annotations | Implemented: sticky navigation fix, Services-only journey selector, reduced hero clutter, category popover, food circles, unboxed food links and removed selected caption/banner. |
| Homepage video | Implemented with muted repeating playback, pause/resume, poster/Play fallback and route cleanup. Playback was observed in Playwright. |
| Search | Live suggestions, content-type filtering, clear/reset behavior, localized results and query restoration were checked. |
| Public route build | 98 canonical paths across three languages; 294 localized HTML pages generated. |
| CMS workspace | Dashboard, page fields, media, reviews/history, settings/staff and migration interface implemented in source. |
| CMS connection | Public content-provider hook, route registry, baseline import, private template preview bridge and async publication interfaces implemented. Live end-to-end operation remains unverified. |
| WordPress migration | WXR parsing, preview and draft import tested with fixtures; provenance and conflict information retained. |
| cPanel migration | Safe TAR/TAR.GZ inventory implemented. SQL-only conversion and ZIP/RAR extraction remain unfinished. No actual LS export was supplied. |

## Verification and limits

- Public browser suite: **18 passed, 0 failed, 2 skipped**. The skipped checks require the unavailable live CMS service.
- CMS source suite: **22 passed, 0 failed, 1 skipped**. The skipped test requires a disposable PostgreSQL database.
- Checks covered clean routes, metadata, navigation after scrolling, catalogue pagination, inquiry context, image integrity, multiple-open FAQs, reduced motion and responsive/language combinations.
- Playwright MCP inspected the homepage at 375, 768, 1025, 1440 and 2215 px with no horizontal overflow; English, Chinese and Malay searches returned results.
- The local website preview was reachable at `http://127.0.0.1:8011/home/` during the recorded check. This address works only while the local preview server is running.
- The Docker engine was unavailable in the latest session. `/cms/` and CMS APIs returned 503, so the requested temporary administrator was **not created**. No temporary password is included in this repository.
- Live sign-in, uploads, database persistence, complete publishing activation, backup recovery and rollback still need verification with PostgreSQL running.
- Technical translations and unresolved machine evidence still need LS review. Automated route coverage is not editorial or technical approval.

See [qa/implementation-register.md](qa/implementation-register.md) for the detailed completed/unresolved register and screenshot links.

## Technology, tools and methods used

| Tool or technology | Purpose |
|---|---|
| HTML, CSS and JavaScript | Existing public templates, navigation, responsive layouts, search and interactions. |
| Node.js | Local preview server, build scripts and CMS application; CMS target runtime is Node.js 24. |
| PostgreSQL 18 | Intended persistent CMS records, staff accounts, revisions and release state. Live verification is pending. |
| Docker Compose | Local CMS/database packaging and preparation for later server hosting. |
| YouTube IFrame Player API | Supplied LS homepage introduction, playback state and pause/resume. |
| CSS, Web Animations API and scoped GSAP | Control feedback, disclosures, transitions and photographic interactions. |
| Playwright MCP and Playwright browser scripts | Actual browser inspection, interactions, responsive checks and screenshots. |
| Node test runner | Route, content, security, permission, publishing and migration-fixture checks. |
| PowerShell, Git and ripgrep | Windows workspace operations, version control and source inspection. |
| Codex and delegated implementation agents | Coordinated frontend, CMS interface and migration implementation, with combined verification. |
| Emil Design Engineering skill | Easing, timing, motion restraint, interaction feedback and reduced motion. |
| Impeccable skill | Typography, hierarchy, spacing, responsive layout and accessibility guidance. |
| GPT Taste skill | Visual composition and refinement within LS's established identity. |
| RONDO and Polin references | Industrial presentation and machine-content structure; their content is not LS evidence. |

## Next work

1. Make the local Docker engine available, start PostgreSQL/CMS and create the authorized administrator through local setup.
2. Verify staff sign-in, roles, upload, edit, preview, review, publish and fresh-browser page/search updates.
3. Verify concurrent edits/publications, failed builds, rollback, restart persistence and fresh-instance backup recovery.
4. Finish cPanel SQL conversion and test the migration against an actual supplied LS export.
5. Review technical content, media matching and translations with LS.
6. Confirm CRM delivery and hosting later. Production replacement, DNS and deployment require the separate management-approved cutover.

## Repository contents and exclusions

The repository includes source code, generated public pages, CMS code and migrations, local media/assets, evidence records, tests, design-review documents and screenshots. Environment secrets, private CMS backups, runtime media/data, dependency folders and transient browser logs are excluded. Supply local secrets through environment configuration; do not commit credentials or imported customer/inquiry records.
