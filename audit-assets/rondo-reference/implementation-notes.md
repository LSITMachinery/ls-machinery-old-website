# LS reference rebuild — local preview

Reference: the four supplied RONDO screen recordings and live exploration at https://www.rondo-online.com/apac/en. Review completed 14 October 2026.

## Implemented

- White header with utility row that compacts during normal scrolling; click-open menus, closing animations, dimmed backdrop, Escape, focus restoration and mobile grouped navigation.
- Portal as a sliding inquiry destination. Quote, consultation and visit selections preserve the originating machine and preselect the form intent.
- Media/title overlap heroes, bold sans-serif typography, orange state accents, rounded photographic panels and charcoal product/technical bands.
- Six circular food shortcuts; all three LS customer segments in a synchronized photo/accordion layout.
- Five expanding planning stages on food pages. These explain requirements gathering rather than claim an unverified machine process.
- Multi-open FAQ; bottom page section navigation, active-state tracking and section jumps that retain the current route.
- Orange route curtain, staggered content reveal, hero photo sequence and local/static video fallbacks. Motion preferences and offscreen pause are respected.
- Reusable layouts across the current catalogue, food, solution, segment, service and company routes.

## Evidence

- Asset check PASS: 61 entries, 51 preserved source image records.
- Route browser check PASS: 89 desktop routes, including all 61 catalogue entries, with no broken images, empty media panels or horizontal overflow. Gallery focus return, inquiry context, language selection and 390px mobile pages pass.
- Reference interaction check PASS: five menu categories and at most five featured entries each; six food choices; three segment choices; Portal context/intent; process keyboard selection; multi-open FAQ; section jumps; fullscreen focus return; 18 language/width combinations from 320px to 1440px.
- Independent review found two content-preservation regressions in the shared hero conversion. Food overview links and service/company guidance are restored, with browser regression checks added.
- RONDO reference behavior is recreated in original LS code. Exact RONDO source code and its company/media assets are not copied.

## Remaining content/media limits

- Exact product imagery remains confirmed for 14 entries; 47 entries retain explicit category/application references.
- Technical data, certifications, history, customer evidence and public contact destinations require verified LS information.
- Some older company/service/footer wording remains English under the secondary language settings.
- The Higgsfield introduction depends on its CDN. Local poster/failure behavior is tested; this sandbox's network restrictions prevent confirming live video playback.
- Fonts may fall back to Arial if the external font service is unavailable.

## 14 October 2026 — navigation repair and dark hero restoration

- Top navigation labels are native page links. Adjacent chevrons open dropdowns. Focus transfer inside a dropdown no longer closes it before a link activates.
- Restored the second supplied screenshot's full-width dark hero treatment across existing pages: white headings, orange highlights, imagery beside the copy and no overlapping white panel. Mobile heroes stack image and copy within the same dark section.
- Machine images remain contained with complete geometry, KRONO branding, zoom and left-side fullscreen controls. Inquiry and missing-page views also receive illustrated heroes.
- Preserved the existing LS image assignments, carousel pause behavior, reduced-motion choice, route transitions and inquiry context.
- Current verification PASS: all five navigation labels and dropdown destinations on desktop/mobile; existing RONDO interaction checks and 18 responsive/language combinations; all 99 routes at desktop and 390px mobile with full-width heroes, no broken assets, empty media or horizontal overflow. Gallery and inquiry context checks pass.
- Before-change source copies are saved under `audit-assets/checkpoints/before-dark-heroes`. Current proof images: `audit-assets/dark-hero-desktop.png` and `audit-assets/dark-hero-mobile.png`.
