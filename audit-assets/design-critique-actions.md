# LS website implementation register

Updated 16 October 2026. Status refers to the local preview and source code. It does not certify business claims, public deployment, production enquiry delivery or legal compliance.

The production domain is `lsmachinery.com.my`. Sales and marketing will own enquiries and connect them to CRM later; LS has not yet selected the delivery service. The WordPress website and current cPanel hosting remain live while the local version is reviewed.

## Implemented in the preview

| Area | Status | Result |
|---|---|---|
| Shared navigation | Done | Desktop menus no longer lock body scrolling. The header stays reachable after scrolling; mobile retains its own scroll lock. Language, click/hover, Escape and focus-return behavior are preserved. |
| Home sequence and food shortcuts | Done | Hero → Current at LS and the client row → food choices → capabilities → remaining home sections. Food choices use compact round, framed real photographs. |
| Capabilities and planning | Done | Four capabilities pair relevant LS photographs with a next action. Factory and Line Planning has three expandable steps, what to prepare and a direct LS inquiry link. |
| Journey stages | Done | Services, machine discovery and the inquiry form offer six optional production stages. The chosen stage, page context and inquiry intent continue into handoffs. Copy says this is the visitor's stated need, not project tracking. |
| Search | Done | Live suggestions begin after one character, rank model matches, group content types, support filters and keyboard movement, link to FAQ answers, preserve query on Back, and give no-results guidance. Search index includes English, Chinese and Malay text. |
| Project Process route | Done | Removed as a Company destination and search item. The old address redirects to the working-process section on Services. |
| Language routes | Done | English default plus `/zh/` and `/ms/`, route-preserving language switching and localized metadata/canonical alternatives. Model codes, proper names and technical values remain intact. |
| CMS service | Running locally; first staff account pending | Dedicated `/cms/` staff application and API with role checks, sign-in, draft revisions, revision history, technical review, publisher confirmation, media evidence and backup/restore scripts. The old `?studio=1` local prototype launcher has been removed. The private preview currently shows record copy in a CMS frame; it does not yet render the public website's full page template. |
| CMS publishing | Partial | Publishing now builds all localized page records, alternate routes, metadata and a search index, then activates one immutable release in a PostgreSQL transaction. A failed build preserves the prior release. The current static page templates are not yet connected to the published-content API, so CMS changes do not update the rendered preview pages until that integration is completed. |
| Evidence control | Done | Missing photos, specifications, videos and claims are withheld where records do not support them. The CMS keeps media ownership, permission and subject-match evidence with the content. |
| Content policy and footer | Done | Newsletter block removed. Privacy notice is available in three languages. Public preview has no CMS shortcut. |

## Machine evidence and remaining content

All 61 catalogue models have an entry in `machine-evidence-register.md`. The available evidence supports 21 model-specific content records, 18 exact machine-photo associations and five MCD specifications. No exact machine demonstration videos were verified. The register documents conflicts for MCAD and Rotary Moulder/MCD. MCD is the strongest detailed example so far; the shared machine template is in place, while unsupported details stay out of public pages.

LS still needs to confirm disputed model relationships and provide or approve additional descriptions, operating details, configuration/tooling information, specifications, exact detail photographs, videos, datasheets and certificates. A verified photo does not establish performance or prove an installation, training or customer result. Project stories, measurements, named sales contact, warranty/response commitments and customer permissions also remain open.

## Operations and independent checks still needed

| Item | Status | Next input or check |
|---|---|---|
| Docker-backed CMS | Runtime, persistence and restore verified | The local container build and `/health` endpoint passed. PostgreSQL migrations and the revision/review/publish workflow passed in a disposable database, including failed-release preservation. A private draft and media file survived database and app restarts. A fresh isolated restore recovered one private draft and one media file; the public API kept the draft private. Temporary records, backups, test database and restore volumes were removed. |
| Enquiry delivery | Needs LS input | Select the approved provider and configure its credentials. Email and WhatsApp handoffs remain usable; no request was sent to LS during local tests. |
| CMS content migration | Later phase | Map approved WordPress content into CMS records, then compare representative routes before cutover. |
| Hosting, NAS and launch | Later phase | Management review, hosting fit and an approved migration plan are required before moving production. No DNS, hosting or live-site change has been made. |
| Translated copy review | Needs LS review | Automated/source-based English, Simplified Chinese and Malaysian Malay content is available. Technical wording with ambiguous source evidence needs a qualified LS review before public launch. |
| Public SEO and previews | Preview verified; public result pending | Static pages include unique metadata and language alternatives. Search indexing and social cache previews need the public deployment. |
| Privacy operations | Needs LS review | Confirm data ownership, processor list, retention, contact route and final privacy wording for the chosen delivery provider. |
| Full Playwright coverage | Passed for locally runnable public pages | Automated checks cover all 98 routes in three languages, 196 desktop/mobile layouts at 1440 and 390 px, six key-page navigation after scrolling, inquiry context, live catalogue/search behavior and the current industrial page flows. Focused Playwright MCP checks confirmed translated search and FAQ links, multiple independently open FAQs, stage selection, inquiry handoff content and reduced-motion visibility. |
| CMS interface languages | Passed in interface and browser checks | The staff sign-in labels switch among English, Simplified Chinese and Malaysian Malay in Playwright MCP. Database-backed revision and publishing behavior passed the PostgreSQL integration test. First-admin sign-in has not been configured for LS. |
| CMS smoke checks | Done | Replaced the old `.cms-trigger` tests with checks for the dedicated sign-in route, three interface languages, unauthenticated API denial and published-only public reads. Playwright MCP checked the live sign-in form, language switching, the published search endpoint and removal of the `?studio=1` prototype button. |
| Screenshots | Captured | `audit-assets/final-homepage-desktop.png` and `audit-assets/final-homepage-mobile.png` show the current homepage after its real photography has loaded. |

## Visitor readiness

| Visitor | Ready in the preview | Still needs evidence or input |
|---|---|---|
| New buyer | Food and machine paths, multilingual search, route-preserving language switch, contact options | Approved machine suitability and performance data |
| Startup or SME | Factory-planning guide, expandable next steps, stage selector and machine inquiry | LS-confirmed project examples, achievable outputs and indicative project scope |
| Larger manufacturer | Planning, equipment, installation and support routes | Verified project results, datasheets, certificates and approved engineering references |
| Existing customer | Machine context, service routes and spare-parts request | Approved response, warranty and parts commitments |
| Candidate | Careers pages and current destination links | A live vacancy feed requires an approved LS recruitment source |
| Staff editor/reviewer/publisher | Separate CMS workflow, local runtime and PostgreSQL revision checks | LS must create the first administrator; public-template preview, static renderer connection, and later WordPress content migration remain open |

The current static build contains 294 complete HTML files across English, Simplified Chinese and Malaysian Malay. Full-page desktop and mobile previews are saved under `audit-assets/`. The local desktop layout, navigation, route, search and inquiry checks passed. The CMS containers remain running locally with an empty staff/content/media store; its integration, restart and one-draft/one-media restore checks passed, and all temporary data was removed. First LS administrator setup, enquiry delivery, public indexing, content migration and launch review remain open. No enquiry was sent to LS, and no public deployment or production cutover was made.
