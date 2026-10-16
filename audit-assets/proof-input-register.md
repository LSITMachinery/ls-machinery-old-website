# Buyer proof and privacy input register

Reviewed: 15 October 2026, Asia/Kuala_Lumpur. Internal working record, not public page copy.

Scope: current website assets and content modules; read-only filenames under `C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0\uploads`; the existing image/source audits; published LS service-process record. This was not an exhaustive legal or certification audit.

## What can be published from current evidence

| Item | Status | Evidence and publication limit |
|---|---|---|
| How a project works | Done | `buyer-resources.js` provides six stages: appointment, floor planning/design, order placement, installation, technology transfer, after-sales. [LS service process](https://lsmachinery.com.my/service-flow/) publishes this sequence; the backup also contains those labels. Descriptions explain what to discuss. They do not promise delivery dates, factory acceptance tests, certifications, warranty or response times. |
| Existing original LS workshop/site photographs | Available | Source paths and hashes are in `asset-source-index.json` and `asset-manifest.js`. Process-page photograph uses the existing customer archive assignment `photo-9`. This is supporting photography, not a claim about a named customer's measurable result. |
| Two company identities in current client library | Available | Gardenia and TK Bakery already have source-backed logo assignments. They support an honest, short static row. Repeating them cannot substantiate a larger client list. |
| Existing machine-page specifications | Available with model limits | `machine-content.js` records the originating LS post IDs. MCD has model, dimensions, published output, electrical supply and weight. Preserve the source qualifier on output and verify the offered configuration when quoting. Other machines have different coverage. |
| Current website enquiry privacy explanation | Implemented for review | `buyer-resources.js` includes the complete English and Bahasa Malaysia explanation together. It describes the form fields, purpose, choices, browser session recovery, email/WhatsApp handoff and conditional website delivery. It does not assert completed legal compliance. Production sign-off inputs are below. |

## Evidence still needed from LS

| Item | Status | Exact input needed |
|---|---|---|
| Downloadable model datasheets | Needs LS input | LS-approved model/configuration, drawing dimensions, specification revision, tested output conditions, utilities, options and authorised PDF. Eighteen matched machine photographs do not establish eighteen verified technical records. No machine datasheet PDF was found in this scoped backup search. |
| Certificates | Needs LS input | Certificate copy, issuer, holder's legal identity, scope, issue/expiry dates and permission to publish. Current footer says MATRADE registered/MOF organisation certified; that wording is not evidence of CE, ISO, product certification or a current certificate. No certificate-named document was found in the scoped filename search. |
| Two or three actual project stories | Needs LS input | Identify the project and photo, permission to name or anonymise the customer, original challenge, LS scope and confirmed outcome. Photographs demonstrate people/equipment but do not prove output increases, savings or customer satisfaction. |
| Customer quotations | Needs LS input | Original attributed statement, speaker/role, date and publication approval. Do not convert LS marketing text or gallery captions into quotations. |
| Six or more client logos | Needs LS input | Company identity, authentic artwork, relationship evidence and publication permission for each. |
| Named sales contact | Needs LS input | Current approved name, role, photograph, contact route and consent to publication. Generic marketing email remains available. A person's appearance in a team photo does not establish a sales role. |
| Service commitments | Needs LS input | Approved response target, service areas, warranty terms, parts support scope and exclusions. Do not infer them from generic after-sales language. |
| Production privacy notice | Needs LS input | Confirm the operational owner for privacy requests, named delivery/hosting/mail processors and locations, permitted recipients, security practices, retention/deletion schedule and cross-border arrangements. Confirm that the final notice matches the deployed service. The current text is confined to website enquiry behavior and contains no invented retention period or DPO appointment. |

## PDF inventory actually found

Only five PDFs were returned beneath the extracted backup's `uploads` directory:

- `uploads/2023/10/ZipScreen-E-Catalogue.pdf`
- `uploads/2024/03/NEXT-DESIGN-BEDROOM-SERIES.pdf`
- `uploads/2024/04/NEXT-DESIGN-DINING-ROOM-SERIES-.pdf`
- `uploads/2024/04/NEXT-DESIGN-LIVING-ROOM-SERIES-1.pdf`
- `uploads/2024/04/NEXT-DESIGN-OUTDOOR-SERIES.pdf`

These filenames concern blinds/furniture, consistent with the previous image audit's legacy-template finding. They are not LS machine evidence and were not copied into the public site. A `Catalogue-Image-.png` family also exists; a website banner is not a downloadable model datasheet.

## Privacy preparation sources

The official Commissioner's guidance calls for a clear description of the information, purposes, source, choices, rights and recipients. It requires the national and English languages. It also distinguishes informing a person from obtaining blanket consent. The operational data flow must be understood before a notice is finalised.

- [Commissioner's notice preparation guide](https://www.pdp.gov.my/ppdpv1/en/akta/guidance-on-the-preparation-of-personal-data-protection-notices/).
- [Official guide PDF, 2022](https://www.pdp.gov.my/ppdpv1/wp-content/uploads/2024/07/Panduan-Penyediaan-Notis-PDP-2022-compressed.pdf), especially pages 5–8.
- [Commissioner's Act 709 page](https://www.pdp.gov.my/ppdpv1/en/akta/pdp-act-2010-en/), which links the Act and subsequent amendments. Do not reuse the guide's old penalty figures as current legal advice.

No enquiry, message, application or subscription was sent during this research.

## Integration

Load `buyer-resources.js` before `app.js`. Call `window.LSBuyerResources.render(designConfig(route), route)` for `company/project-process` and `privacy`; unsupported routes return `null`. Both use existing `production-pages.css` classes and the existing contact/asset helpers. Privacy includes both languages regardless of the selected site language. The process page has EN/ZH/MS text. Route metadata and navigation/footer links are provided by the main application integration.

Verification: the module was executed in an isolated JavaScript context for both routes in EN/ZH/MS. Each rendered exactly one main heading, no `undefined` values, and the process exported six stages. End-to-end route, layout and submission checks belong to the integrated website verification.
