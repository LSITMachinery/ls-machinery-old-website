# LS Smart Machinery — UI/UX and conversion audit

16 October 2026 · Malaysia time · Audit only

**Recommendation: refine the existing industrial direction around equipment selection, credible evidence and a reliable enquiry path. A wholesale visual replacement is not justified.** The current homepage already explains LS clearly and presents a recognisable industrial brand. Its larger weakness is the information available after a visitor decides to explore machinery.

No frontend code, CMS content, production service or third-party integration was changed. Audit documents, screenshots and diagnostic records were created locally. No enquiry was submitted and no email or WhatsApp message was sent.

## Scope and evidence

The audited target is the current local frontend at `C:\Users\likto\Documents\ChatGPT\LS Website`, served temporarily at `http://127.0.0.1:8011/`. This is a local preview assessment, not a production audit, user acceptance test or launch approval.

Inspection covered the entry shell, all runtime modules, stylesheet source order and tokens, generated route inventory, catalogue and media data, navigation, page composition, interaction lifecycle, browser-local CMS boundaries and enquiry adapter. All 99 manifest routes received HTTP checks. Critical buyer journeys received interactive browser checks; every route did not receive an individual visual review.

Playwright MCP captured 375 × 812, 768 × 1024 and 1440 × 1000 CSS-pixel viewports in Chromium. These are viewport simulations; physical phones, touch gestures, Safari, Firefox and assistive technology were not tested. Separate source/design and technical assessments were reconciled with browser evidence.

Impeccable supplied the visual and technical audit framework. Emil's guidance informed functional interaction and feedback. gpt-taste supplied hierarchy, composition, asset and repetition criteria. Its stock-image, font-randomisation and decorative GSAP prescriptions were excluded under the user's explicit industrial-brand and motion constraints.

No project-root DESIGN.md exists. The supplied directory contains 84 community design analyses. After the user authorised choosing suitable references, IBM, DJI and BMW DESIGN.md files were inspected. **IBM is the primary reference for information discipline; DJI is a secondary reference for equipment presentation.** These analyses are inspiration, not official brand standards or authority over LS. Nothing was copied into the application.

## Implementation integrity and health

**Visual coherence: PASS. Implementation integrity: PARTIAL.** The visible identity is coherent, but unresolved catalogue names, an HTTP route mismatch and overlapping historical styles reduce confidence in future expansion. The detector produced nine raw diagnostics; runtime/source reconciliation did not establish any of those nine as an active defect. Hidden or overridden old styles and dynamically generated image markup caused the warnings. Confirmed findings below come from additional source and browser checks.

| Impeccable dimension | Score / 4 | Assessment |
| --- | ---: | --- |
| Accessibility | 2 | Labels, skip link, keyboard menus and motion alternatives exist; route changes leave focus on BODY without announcing the new page. Full WCAG conformance was not assessed. |
| Performance | 3 | Healthy local load observations and responsive images; broad runtime loading and local-server delivery leave optimisation work. |
| Tokens and consistency | 2 | Shared tokens and one compiled stylesheet exist; parallel colour families and historical selector overlap remain. |
| Responsiveness | 3 | Readable composition at all requested widths; mobile utilities are crowded and some controls are below the 44px comfort target. |
| Implementation integrity | 2 | Genuine product-specific content and generated routes; unresolved public names and one linked HTTP 404 remain. |
| **Total** | **12 / 20** | **Acceptable, with significant targeted work.** |

Scores are expert inspection judgements, not measured conversion rates or accessibility certification. The ten prioritised findings comprise three P1 items and seven P2 items. One P1 is an operational dependency rather than a broken feature. No P0 task-blocking failure was established in the exercised local browsing journeys.

## Frontend and CMS map

| Area | Current implementation |
| --- | --- |
| Entry and routing | `index.html`; vanilla JavaScript; `site-routing.js` intercepts internal paths; `app.js` renders state and pages. |
| Public routes | 99 generated HTML pages in `public-pages/`, including 61 machine details, five machine categories, six food applications, three customer segments and solution/service/company/contact/search/privacy pages. |
| Page modules | `page-design.js`, `industrial-ui.js`, `production-pages.js`, `buyer-resources.js`; navigation/contact drawer in `navigation.js`; interactions in `experience.js`. |
| Data | `catalogue-data.js`, `machine-content.js`, `food-applications.js`, `career-opportunities.js`, `asset-manifest.js`, `content-assets.js`, `page-metadata.js`. |
| Design system | `styles/tokens.css` and `styles/shared.css`; `styles/manifest.json` orders 13 sources into `site.css`. The stylesheet freshness check passed. |
| CMS | Browser-local storage and demonstration editor/publisher roles, entered through `?studio=1`. No authenticated shared CMS, server-side permissions, database publishing or CRM connection. This audit did not enter or modify the studio. |
| Enquiry | Email/WhatsApp draft handoffs; conditional `/api/inquiries` webhook adapter; `/api/config` currently returns `inquiryDelivery: false`. |
| Hosting boundary | The local Node preview serves generated content and assets. Production caching, CDN, delivery configuration and monitoring remain unverified. |

The catalogue contains Bakery 32, Kitchen 11, Package 7, Refrigeration Series 5 and Production Line 6. The source snapshot and complete route list are in [source-inventory.json](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/source-inventory.json>).

## Homepage assessment

| Requested area | Finding |
| --- | --- |
| First impression | Strong. Real machinery, factory background and restrained orange/charcoal feel appropriate to industrial food production. |
| Explanation of LS | Clear. The live heading is “Food production. Engineered around you.” The lead explicitly names machinery, production-line planning and after-sales support. Older unused/default copy was excluded from this verdict. |
| Navigation and machinery discovery | Five clear equipment families, food-first links and Search exist. Buyers without equipment vocabulary still need more help narrowing a suitable process or configuration. |
| Trust and credibility | Actual site/team photography and two source-backed client records are strengths. Logos appear roughly 2,400–2,500px down the page after content settles; gallery imagery has little visible project context. |
| CTA hierarchy | Food discovery is visually primary; catalogue and quote links remain visible. This is already a hierarchy, but its primary label promises browsing more clearly than equipment selection. Header Contact adds a choice drawer; direct quote links bypass it. |
| Mobile | Readable 17px hero lead and a three-line heading at 375px. The 117px two-row header gives several utilities substantial space and makes the logo visually small. |
| Images | The hero machine retains its full geometry. Food photographs are useful discovery cues. The main machine is visually prominent but lacks a visible name/application or direct product link. Catalogue evidence gaps are more serious than homepage image styling. |
| Accessibility and typography | Readable body scale, visible focus rules and labelled form fields are present. Mobile menu Escape restores focus. New-page focus/announcement needs attention. No blanket low-contrast or tiny-type failure was established. |
| Repetition | Company editorial, capabilities, people-focused news and partnership gallery restate related messages. “Built around the people who make it” is followed by “Built around the people who produce.” |
| Performance and stability | No persistent homepage horizontal overflow was reproduced at the requested widths after settling. Local initial layout movement was very small. These observations do not establish production Core Web Vitals. |

The live lead prioritises Malaysia. The brief includes international customers, so verified overseas enquiry, delivery and support scope should become easier to find. Existing history content mentions overseas markets; it does not establish a current worldwide service promise.

## Ten highest-impact findings

Ranking combines task impact, likely business importance and evidence confidence. Business impact is a reasoned assessment; no analytics or customer research was provided. Complexity estimates describe implementation effort, with content and approval dependencies stated separately.

| Rank | Severity | Problem and evidence | Business impact | Complexity | Recommended response |
| --- | --- | --- | --- | --- | --- |
| **1** | **P1 Major** | **Equipment pages lack selection evidence.** Only 18/61 image assignments are exact product matches; 43 are category references. Only 21 entries have specific content records, and only MCD has numeric technical data. Forty entries fall back to general copy. | High: buyers cannot confidently shortlist, compare suitability or prepare informed enquiries. | High content effort; medium template effort. Requires LS technical evidence. | Prioritise commercially important models. Obtain approved photos, applications and supported specifications; show an explicit request-for-details path where facts remain unavailable. Keep reference imagery clearly distinguished. |
| **2** | **P1 Dependency** | **Direct enquiry delivery is not configured in this preview.** `/api/config` returns false; the Send request button is hidden. The available form actions open email/WhatsApp for the visitor to send. | High: completing a form does not itself transmit an enquiry, and another application introduces a completion step. | Medium after provider selection; operational effort depends on the approved service. | Decide the intended conversion path. If web submission is wanted, connect an approved service with failure recovery and an owned follow-up process. Meanwhile make handoff expectations clear. Existing handoffs are intentional and correctly labelled. |
| **3** | **P1 Major** | **Six catalogue names flagged for LS confirmation appear publicly.** Examples: “Diser Heating,” “Mini Rotary Convention Oven,” “Ultrasound SoundCake Cutter” and “Combi Oven (Laynox).” Rendering does not enforce `confirmWithLS`. | High: unresolved names weaken technical credibility and search confidence. | Low rendering effort; LS confirmation required. | Resolve or hold the six records before publication. Preserve aliases only after the intended product identity is confirmed. |
| **4** | **P2** | **No guided Find My Machine journey is implemented.** Search and food/category pathways exist, but selection relies on names, models or family labels. A cookie application page leads to broad categories rather than a contextual shortlist. | High: first-time buyers may know the food/process, but not the machine name. | Medium; high dependency on verified product/application mapping. | Introduce a short food/process selection path with explainable matches and an “unsure” consultation route. Treat this as a proposed feature, not a broken existing wizard. |
| **5** | **P2** | **Proof arrives late and narrative repeats.** Client logos sit several screens below the hero. Company editorial, capabilities and adjacent people/gallery sections overlap. | High: visitors scroll through company language before receiving enough concrete reasons to choose LS. | Medium design/content effort. | Move compact approved proof near discovery; combine overlapping stories into one contextual customer/application section; make each retained section answer a different buying question. |
| **6** | **P2** | **The history link has inconsistent server routing.** Homepage/Insights story tiles point to `/company/our-history/`, which returns HTTP 404; the app subsequently renders history. The manifest route `/company/history/` returns 200. | Medium: direct visits, shared links and crawlers receive a failure status despite visible content. | Low. | Align links, canonical destination and server alias behaviour. Verify direct requests and in-app navigation separately. |
| **7** | **P2** | **Internal navigation does not communicate the new page through focus.** Keyboard activation of Explore our machines changes the route and leaves `document.activeElement` on BODY; no dedicated route announcement was found. Screen-reader announcement behaviour remains unverified. | Medium: keyboard and screen-reader users can lose page orientation. A specific WCAG failure was not certified. | Low. | Move focus to the new heading/main after route completion and expose a concise navigation announcement. Preserve browser back/forward and modal focus return. |
| **8** | **P2** | **Mobile header utility prominence outweighs brand and buyer navigation.** At 375px, two rows total 117px; Search, Insights, Contact, WhatsApp, motion and menu compete. The motion control measures 30 × 40px. | Medium: smaller brand recognition and a less comfortable utility target on narrow screens. | Low–medium. | Simplify utility prominence, increase the motion hit area and preserve direct contact access. A sub-44px control is a comfort finding, not automatically a WCAG AA violation. |
| **9** | **P2** | **The hero machine is an attractive dead end.** The static MCD figure has model alt text but no visible identification, application caption or detail link. | Medium: the most prominent equipment image contributes little to machinery discovery. | Low. | Propose a restrained model/application link alongside the existing composition. This would revise the earlier caption-free presentation and needs explicit design approval. Preserve machine scale and geometry. |
| **10** | **P2** | **Shared payload and historical styling increase future cost.** Every route loads 15 deferred scripts totalling 502,247 raw bytes plus 208,628 bytes of CSS. Thirteen ordered CSS sources retain overlapping selectors and parallel accent families. | Medium: unnecessary startup work and higher visual-regression risk as the site grows. | Medium. | Retain generated HTML; reduce route-independent work, consolidate approved semantic tokens and remove obsolete rules in controlled batches. Verify production compression/caching before making speed claims. |

### Source evidence for the ranked findings

| Findings | Principal source locations |
| --- | --- |
| 1 | [Product rendering](<C:/Users/likto/Documents/ChatGPT/LS Website/industrial-ui.js:69>), [catalogue cards](<C:/Users/likto/Documents/ChatGPT/LS Website/app.js:387>), `machine-content.js`, `asset-manifest.js`; independently counted in source-inventory.json. |
| 2 | [Enquiry capability and validation](<C:/Users/likto/Documents/ChatGPT/LS Website/app.js:749>), [handoff generation](<C:/Users/likto/Documents/ChatGPT/LS Website/app.js:338>), [delivery adapter](<C:/Users/likto/Documents/ChatGPT/LS Website/inquiry-delivery.cjs:5>). |
| 3 | [Catalogue confirmation policy](<C:/Users/likto/Documents/ChatGPT/LS Website/catalogue-data.js:2>); flagged records at lines 32, 73, 77, 88, 114 and 181; [card renderer](<C:/Users/likto/Documents/ChatGPT/LS Website/app.js:398>). |
| 4 | [Search matching](<C:/Users/likto/Documents/ChatGPT/LS Website/app.js:497>), [food-to-category pathway](<C:/Users/likto/Documents/ChatGPT/LS Website/page-design.js:91>). |
| 5 and 9 | [Homepage composition](<C:/Users/likto/Documents/ChatGPT/LS Website/page-design.js:51>), [current editorial](<C:/Users/likto/Documents/ChatGPT/LS Website/page-design.js:35>), [news stories](<C:/Users/likto/Documents/ChatGPT/LS Website/production-pages.js:55>). |
| 6 | [Story destinations](<C:/Users/likto/Documents/ChatGPT/LS Website/production-pages.js:59>), [server route handling](<C:/Users/likto/Documents/ChatGPT/LS Website/preview-server.cjs:34>). |
| 7 | [Route lifecycle](<C:/Users/likto/Documents/ChatGPT/LS Website/site-routing.js:19>), [render completion](<C:/Users/likto/Documents/ChatGPT/LS Website/app.js:600>). |
| 8 | [Mobile header rules](<C:/Users/likto/Documents/ChatGPT/LS Website/navigation.css:110>), baseline mobile screenshot and rendered hit-area measurement. |
| 10 | [Entry resources](<C:/Users/likto/Documents/ChatGPT/LS Website/index.html:15>), [token source](<C:/Users/likto/Documents/ChatGPT/LS Website/styles/tokens.css:2>), [cascade limitation](<C:/Users/likto/Documents/ChatGPT/LS Website/styles/README.md:15>), [homepage accent](<C:/Users/likto/Documents/ChatGPT/LS Website/homepage.css:5>). |

## Critical journey results

| Journey | Status | Observed result and boundary |
| --- | --- | --- |
| Find My Machine | NOT IMPLEMENTED | No dedicated finder. Food-first browsing and search provide alternatives; a guided finder is a proposal. |
| Category discovery | PASS, sampled interactions | All five category routes load. Bakery Depositor Series returns four records; searching MCD narrows to one. Category and pagination code were inspected. |
| Model search | PASS | “LSF 502 MCD” returns the expected single product. The singular result label says “1 machines”; minor copy polish, outside the top ten. |
| Food-first browsing | PASS with selection limitation | Cookies & Biscuits opens product formats, planning questions and equipment categories. Suitability still requires consultation. |
| Product → quote | PASS | MCD quote opens the form with quote intent and model context preserved in the URL and page. |
| Contact drawer | PASS, sampled | Desktop Contact opens choices for email, WhatsApp, quote, consultation and visit. Escape closes it. |
| Mobile navigation | PASS, sampled | Opens at 375px, reports expanded state, closes with Escape and restores focus to Open navigation. Physical touch operation remains untested. |
| Enquiry validation | PARTIAL | Empty form fails native validity; visible input/select/textarea fields have labels. Source requires one reply channel. No valid submission or external handoff was triggered. |
| Direct web submission | DISABLED IN PREVIEW | Capability returns false; submit control is hidden. Provider acceptance, inbox receipt, retries and staff response are NOT VERIFIED. |
| Email / WhatsApp | LINK AND CONTEXT VERIFIED | Model/intent and encoded message are present; WhatsApp uses the configured `wa.me` number. Account ownership, app launch, delivery and human response are NOT VERIFIED. |
| Phone / map | DESTINATIONS INSPECTED | `tel:` and map links exist alongside email, address and opening hours. No calls or external map actions were made. |
| Spare parts | PARTIAL | Route and labelled fields inspected at 375px; no submission or part-identification outcome tested. |
| Route integrity | 99/99 manifest routes HTTP 200 | 101 unique manifest/linked page paths checked. One additional linked alias, `/company/our-history/`, returns 404. |

## Performance, accessibility and layout evidence

Three fresh Chromium contexts measured the initial homepage locally without network/CPU throttling. Each measurement is one sample, after network idle plus a short observation period. Resource transfer excludes the HTML document and may omit cross-origin font transfer details. These numbers describe this machine and local server only.

| Viewport width | Observed LCP | Initial CLS sum | Long tasks | Resource transfer observed |
| --- | ---: | ---: | --- | ---: |
| 375px | 312ms | 0.000049 | 182ms | 1.07MB |
| 768px | 292ms | 0.000017 | 185ms | 1.14MB |
| 1440px | 288ms | 0.000156 | 178ms and 52ms | 1.36MB |

Initial layout stability looks healthy. INP, mobile CPU/network performance, production cache behaviour and field percentiles were not measured. The broad payload and startup tasks justify optimisation; they do not establish a failed Core Web Vital. Good production targets are LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile. [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds).

No persistent horizontal overflow was reproduced on the settled homepage or sampled category, text-only product, contact and spare-parts pages at 375px. A transient overflow reading during scroll/reveal capture settled back within the viewport; it was not promoted to a confirmed defect. A blank centre gallery image in an early full-page capture was a capture-timing artefact: all three images subsequently loaded and the full-page baselines were recaptured.

Reduced-motion emulation left all homepage headings visible and no active animation objects in the sampled state. The original default-motion viewport screenshots are retained. This was a bounded check, not a full motion/gesture audit. A limited solid-background contrast calculation on the machines overview found no candidates below the relevant minimum; photographic overlays, all states and all routes were not comprehensively measured.

Use normal-text contrast ≥4.5:1 and large-text contrast ≥3:1 in implementation review. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Aim for 44 × 44px touch controls as the project comfort target; WCAG 2.2 AA's target-size minimum is 24 × 24px with defined exceptions. [W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

## Baseline screenshots

Viewport images record the first screen with normal loading. For reliable full-page records, images were temporarily requested eagerly in the audit browser, the page was scrolled and transitions were settled for capture. This changed no source or CMS data. Full-page images show the loaded composition, not initial loading behaviour; performance samples used normal loading in separate fresh contexts.

| Width | First screen | Full page |
| --- | --- | --- |
| 375px | [Mobile viewport](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/homepage-375-viewport.png>) | [Mobile full page](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/homepage-375-full.png>) |
| 768px | [Tablet viewport](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/homepage-768-viewport.png>) | [Tablet full page](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/homepage-768-full.png>) |
| 1440px | [Desktop viewport](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/homepage-1440-viewport.png>) | [Desktop full page](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/homepage-1440-full.png>) |

Additional records: [contact drawer](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/contact-drawer-1440.png>), [mobile navigation](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/navigation-375.png>), [mobile enquiry](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/inquiry-375.png>), [MCD detail](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/machine-mcd-1440.png>), [loaded partnership gallery](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/screenshots/partnership-gallery-1440.png>).

## Proposed direction and approval boundary

The [homepage improvement plan](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/homepage-improvement-plan.md>) proposes a shorter, buyer-led structure and explains the selected reference principles. The [acceptance criteria](<C:/Users/likto/Documents/ChatGPT/LS Website/audit-assets/ui-ux-audit-2026-10-16/acceptance-criteria.md>) define reviewable outcomes before any future work is called complete.

Suggested Impeccable sequence after approval: `clarify` for discovery/CTA language, `harden` for route and enquiry states, `adapt` for mobile controls, `distill` for repeated content, `document` for the approved LS tokens, `optimize` for verified payload opportunities, then `polish` as the final pass. These commands have not been run as edits.

Audit complete. Implementation awaits approval. Questions skipped: the user's requested endpoint is the completed audit followed by an implementation approval boundary.
