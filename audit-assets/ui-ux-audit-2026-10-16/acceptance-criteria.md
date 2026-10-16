# LS Smart Machinery — proposed acceptance criteria

For an approved future implementation · 16 October 2026

These are completion criteria, not claims that implementation or production verification has passed. Criteria involving new features or integrations apply only if that scope is approved.

| ID | Acceptance criterion | Verification evidence |
| --- | --- | --- |
| BRAND-1 | The current LS logo, approved orange/charcoal identity and authentic visual material remain recognisable. Any palette or typography change has explicit design approval. | Review approved design against all three audit baselines. |
| BRAND-2 | An LS-specific token document defines approved colour roles, type, spacing, surfaces and action states. Community references are identified as inspiration. | Review source tokens and the approved design document. |
| HOME-1 | The first screen at 375, 768 and 1440px shows a readable explanation of LS's offering, intended buyer and principal action without clipping or overlap. | Screenshots at the recorded viewport sizes, with loaded fonts. |
| HOME-2 | There is one visually primary discovery action, a clear enquiry action and a direct catalogue alternative. Each label accurately describes its destination. | Click-through checks and design review. |
| HOME-3 | Each retained homepage section adds a distinct decision, evidence or next step. Overlapping people/company storytelling is consolidated. | Section-by-section content review against the proposed page sequence. |
| HOME-4 | At least one compact block of approved proof appears before the longer company narrative. Every client, project, registration or international-service claim has a recorded source and LS approval. | Content approval register and viewport/scroll review. |
| HOME-5 | If the hero label/link proposal is approved, its model and application are visibly identified and its detail link loads the correct product. | Screenshot, keyboard activation and direct HTTP request. |
| DISC-1 | All five machinery categories remain reachable from desktop and mobile navigation; all 61 approved entries have working detail paths or an explicit held-content policy. | Route inventory and sampled keyboard/mobile journey checks. |
| DISC-2 | Model search for “LSF 502 MCD” returns the correct product; Bakery Depositor Series returns the expected four current records; empty and no-result states offer a useful next step. | Deterministic browser checks using the approved catalogue. |
| DISC-3 | If a finder is approved, a buyer can begin with food/process, see explainable matches, change answers and choose an unsure/consultation path. Answers survive product-to-enquiry navigation. | End-to-end browser scenarios using approved application mappings. |
| DATA-1 | All six `confirmWithLS` records are resolved, explicitly withheld or presented under an approved confirmation policy. No internal flag is silently ignored. | Catalogue review and rendering checks for each flagged record. |
| DATA-2 | Every priority machine agreed with LS has an approved exact image or a clearly stated photo gap, useful applications, known model identity, verified selection information and a contextual enquiry link. | Product evidence checklist signed off by LS technical/content owners. |
| DATA-3 | Published numbers have model-specific source evidence. Unknown values remain unknown; reference food/category images are never represented as exact product photos. | Source-to-rendered-content sampling. |
| IMG-1 | Whole-machine images retain natural proportions and fit their parent stage at all baseline widths. No new broad scaling or cropping is introduced without approval. | Element/parent bounding boxes, screenshots and image-viewer checks. |
| ENQ-1 | Model/page, intent and entered production details remain attached to the enquiry through the approved route. | Product → quote → summary check with synthetic data in an isolated test. |
| ENQ-2 | Forms have labels, required indicators, valid reply-channel rules, clear errors and retained values after failure. Optional production details remain optional. | Invalid/valid field and failure-state checks without real customer data. |
| ENQ-3 | Draft handoffs explicitly require the visitor to send in the external application. Success language never equates opening a draft with LS receiving a message. | UI copy and encoded payload review. |
| ENQ-4 | If web delivery is approved, a controlled test proves provider acceptance, records a reference, prevents duplicate forwarding, preserves values on error and routes enquiries to an owned operational destination. Inbox/CRM receipt and staff follow-up are verified separately. | Approved test destination and backend/provider evidence; real LS contact only with authorisation. |
| ENQ-5 | Phone, email, WhatsApp, address, hours and international support scope are confirmed by LS. | Owner sign-off plus destination inspection. |
| ROUTE-1 | All 99 manifest routes and linked public aliases return the intended status, content and canonical destination on a direct request. `/company/our-history/` redirects to the approved history path or is removed from links. | HTTP and in-app navigation checks, including refresh and back/forward. |
| A11Y-1 | Route changes focus the new heading/main or provide an equivalent tested orientation mechanism. Menus/dialogs preserve Escape, focus containment where appropriate, and focus return. | Keyboard sequence plus screen-reader check. |
| A11Y-2 | Text contrast meets 4.5:1 for normal text and 3:1 for large text; meaningful controls and states meet applicable non-text contrast requirements. Photographic overlays are tested in their actual rendered state. | Automated checks plus manual state/image review. |
| A11Y-3 | Primary touch controls meet the project's 44 × 44px comfort target. Any smaller utility is explicitly reviewed against WCAG 2.2 target-size and spacing requirements. | Rendered hit-area measurements and touch review. |
| A11Y-4 | Reduced motion exposes complete readable content, preserves useful state feedback and removes unnecessary motion. Keyboard focus remains visible. | Reduced-motion browser checks and keyboard walkthrough. |
| RESP-1 | No persistent horizontal overflow, clipped text, concealed action or overlapping control exists at 375, 768 and 1440px, including open navigation and enquiry states. | Settled-state screenshots and scroll/element measurements. |
| RESP-2 | Representative pages remain usable with 200% text enlargement and at a 320px reflow width. Mobile navigation and any custom gesture work on an actual touch device. | Reflow/text tests and physical-device evidence. These were not completed in this audit. |
| PERF-1 | Generated public HTML remains useful before enhancement; route-specific optimisations preserve discovery, metadata and enquiry behaviour. The compiled stylesheet matches its sources. | Direct HTML inspection, browser journeys and stylesheet freshness check. |
| PERF-2 | Before release, production delivery is checked for compression, caching, image sizing and resource failures. Agreed mobile lab conditions and repeatable measurements are recorded. | Deployed environment/network evidence, not localhost timing alone. |
| PERF-3 | Where sufficient field data exists, target LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile. Until then, report lab results and field status separately. | Field dashboard or explicitly labelled lab evidence. |
| CMS-1 | Current browser-local CMS limitations remain explicit. Any future shared CMS requires separately approved authentication, publishing and storage scope. | Architecture and access-control evidence appropriate to that later scope. |
| MEASURE-1 | If analytics is approved, handoff clicks, quote starts and accepted enquiries are distinct events. No personal form content enters analytics. | Event inspection and privacy review. |

Standards: [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [W3C target-size minimum](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds).

Approval can cover a bounded homepage refinement first. Product evidence, a new finder, production enquiry delivery and shared CMS work each have separate content or operational dependencies; a visual approval alone does not complete them.
