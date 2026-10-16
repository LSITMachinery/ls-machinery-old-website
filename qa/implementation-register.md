# LS website implementation register

Checked 17 October 2026 against the local preview at http://127.0.0.1:8011/.

## Completed in the local website

| Area | Result |
|---|---|
| Homepage | Added the muted, looping LS intro video with a Play fallback and pause/resume control. The featured machine follows the video; food links now come before Current at LS, matching the annotations. |
| Food links and photos | Removed the visible “LS premises in Malaysia” caption while preserving its alternative text. Homepage food links are unboxed with round photos. Machine food applications use round, framed photos and labels. |
| Navigation and catalogue | Fixed desktop menu scroll locking. The production journey selector is limited to Services. Removed the extra machine search and catalogue explanation. Replaced the native category presentation with an accessible popover. |
| Search | Removed the “Popular destinations” banner. Live results, type filters, counts and query links update together; clearing a query removes stale filters. Back restores the query and returns to all matching types. Chinese and Malay searches return localized results. |
| Shared motion | Page reveals now finish within 450 ms. FAQs, menus, filtering and reduced-motion behavior were exercised in browser checks. |
| Route and language build | Generated 294 English, Simplified Chinese and Malaysian Malay route pages from the 98-path registry. Public titles, canonical routes, language paths and search indexes are covered by automated checks. |
| Machine and media evidence | Visual route checks found no broken images, missing alt text, empty media panels or horizontal overflow on the checked routes. The MCD page shows its technical data and circular food examples. |
| Staff CMS source | Added the private workspace interface for dashboard, pages, named fields, media, reviews/history, settings/staff and migration. CMS APIs, permissions, revisions, async publishing and the public content provider are implemented in source. |
| WordPress import source | WXR files can be previewed and imported into drafts with provenance and conflict information. TAR/TAR.GZ cPanel archives are safely inventoried without executing or restoring their contents. |

## Verification

- Public browser suite: **18 passed, 0 failed, 2 skipped**. The checks cover navigation after scrolling, search, inquiry context, food images, 98 canonical routes, 100 visual route surfaces, three languages, and responsive layouts.
- CMS source suite: **22 passed, 0 failed, 1 skipped**. It covers salted password handling, permissions, revision-bound technical approval, publishing rules, WXR parsing, route coverage and failed-build protection.
- Generated pages: **294 complete HTML pages**. Stylesheet build check passed.
- Playwright checked the homepage at 375, 768, 1025, 1440 and 2215 px. No horizontal overflow was found. Search was checked in English, Simplified Chinese and Malay.
- Full-page captures: [desktop homepage](ls-home-desktop.png), [phone homepage](ls-home-mobile.png), and [MCD machine page](ls-mcd-desktop.png).

## Unresolved

| Item | State and reason |
|---|---|
| CMS service and first administrator | Not verified or created. The local Docker engine is unavailable, so `/cms/` and CMS API requests return 503 before they reach PostgreSQL. The supplied temporary login has not been saved or used. Start the Docker engine before creating the administrator and checking sign-in. |
| Live CMS workflow | Not verified in a running database: sign-in, staff roles, media upload/storage, template preview, saved drafts, reviews, publish jobs, fresh-browser updates, persistence, backup restore and rollback. The database integration test is skipped because `CMS_TEST_DATABASE_URL` is not configured. |
| Publication activation | Unit tests cover the localized route, metadata and search build and reject failed candidates. Database-backed activation and rollback against the live website remain unverified. |
| cPanel backup conversion | No WordPress/cPanel archive was supplied. SQL-only conversion into an isolated import database and ZIP/RAR extraction are not implemented. The current cPanel archive tool inventories TAR/TAR.GZ safely; it does not import SQL or execute PHP. |
| Translation review | All three locales build and the public UI/search checks pass. A full human technical-language review across every machine description and glossary term remains outstanding. |
| Production migration | CRM delivery, WordPress/cPanel cutover, hosting changes and DNS are deferred as planned. |
