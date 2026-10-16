# RONDO recordings — interaction reference

Reviewed 13 October 2026. Source recordings supplied by the user; originals in Downloads were read only. Frames were decoded locally with Chromium and saved at one-second intervals. Contact sheets are indexes; full-resolution frames retain text and layout detail.

## Evidence and limits

| Recording | Duration | Frame size | Main evidence |
|---|---:|---:|---|
| Rondo Solution Page.mp4 | 13.386878 s | 1920 × 988 | Artisan segment/solution layout, content reveal, inquiry band, food selection, shared ending |
| Rondo Baked Goods page.mp4 | 24.063278 s | 1920 × 984 | Application hero, process accordion, food outputs, product recommendations, section index |
| Rondo machines - Dough sheeters, Compas 4.0 page.mp4 | 48.278667 s | 1920 × 980 | Mega-menu, category listing, FAQ, route transitions, full product page |
| Rondo machine landing page.mp4 | 15.788667 s | 1920 × 986 | Why RONDO, food shortcuts, customer segment accordion, news, stories, shared ending |

Durations above are decoded file metadata. Times below are measured recording positions, not measured CSS animation durations. One-second samples establish order and visible states; they do not establish exact easing curves or hover/click triggers. Screen-recording speed and browser zoom are not known. Black frames at 0 s and the vertical screenrec toolbar/right-corner microphone warning belong to the recording environment, not the intended website design.

## Shared visual and motion system

- A consistently centered content area occupies approximately x=465–1455 of these 1920-pixel recordings. Header, hero, section titles, grids, and footer share this alignment. Some full-width color bands surround the centered content. Treat this as a reference proportion, not a universal 990-pixel requirement.
- Typography is a coherent rounded/grotesque sans-serif system: large semibold section headings, normal readable body text, restrained small utility text. There is no editorial serif headline treatment.
- White and very pale grey alternate with charcoal product/technical bands. Brand gold identifies active navigation, links, circular plus controls, and compact pill buttons. For LS, transfer these roles to its orange palette rather than copy gold.
- Images have modest rounded corners; cutout machines sit on consistent charcoal tiles. Food shortcuts use circular photographs beside underlined labels, rather than large photographic cards with overlay text.
- Header at page top has utility links above the main navigation and a logo subtitle. After scrolling, it compresses into a single compact white strip, still visible at the viewport top. The expanded recording header is about 90 pixels; compressed about 55 pixels.
- Content reveals are conspicuous: headings and card columns emerge from low opacity, often in left-to-right order. Examples: Compas 7–8 s, 28–29 s, 36–39 s; Baked Goods 6–7 s and 14–15 s. Some fast-scroll frames show temporarily faint content. Exact distance/easing requires live inspection.
- Navigation between pages uses a full-screen brand-color curtain, followed by a staged page reveal: Baked Goods 2–5 s; Compas 4–6 s and 24–25 s. The gold-covered state is part of the design, unlike the initial black recording frames.
- There is no evidence in these recordings of scroll hijacking, continuous parallax everywhere, or 3D effects being required for the overall experience. Distinct components, media, staging, and state transitions account for most of its character.

## Header and mega-menu

Compas 1–2 s: Machines opens a white panel spanning the viewport beneath the retained header. The rest of the page is dimmed. A close X sits at the panel's upper right within the aligned content area. Menu content appears in grouped columns, with brand-color group headings and dark product links underneath. The selected top-level item has an upward chevron and accent color. The menu panel is tall enough for its content and overlays the current hero rather than moving it down. At 3 s the panel has closed and the hero is visible again.

At 1 s some links remain faint; at 2 s they are fully visible. This supports staggered/fading entry, but does not prove the exact opening mechanism or duration. The live page should settle click-versus-hover, pointer exit behavior, Escape, focus return, outside-click dismissal, and mobile behavior.

LS adaptation: five confirmed machinery categories; at most five featured items for the selected group; preserve category full-list links. Reproduce the spatial behavior, grouping, chevron/close states, backdrop, and coordinated entrance.

## Homepage/landing discovery

Machine Landing 1 s shows the end of Current/news-style feature content and a three-column Why RONDO row with small photographs above explanatory titles.

2–4 s: six circular food photographs in a three-column, two-row list. Labels are visibly links and can change to the brand color on hover. This compact section introduces food choices without becoming a large block of cards.

4–6 s: customer segments use a large square photograph on the left and an accordion on the right. Initially Industrial baked goods production is open with body text and a Discover more button; Artisanal bakeries is collapsed with a circular plus. At 6 s a bakery photograph and the artisan description replace the industrial state. Selection changes both the text and contextual image. This is a linked accordion/image interaction, not independent cards.

7–8 s: news uses three equal image-led cards with small classification/date text. 9–10 s: customer success stories use two broad photographs with dark gradients and white titles over the image. These section patterns depend on genuine published content.

11–15 s: shared contact/community section, three white link cards, then a newsletter panel overlapping the transition into a two-tone dark footer. The footer splits local contact details from headquarters/social/legal links. The recording also shows a cookie consent dialog fixed near the lower center, dismissed around 14 s; that consent UI is not a reason to add tracking to LS.

LS adaptation: preserve all three required customer segments in the linked image/accordion layout; retain actual standalone destination links. Keep unsupported news/testimonials unpublished rather than manufacture content to fill the pattern.

## Solution/segment page

Solutions 2–3 s: large centered landscape footage with rounded corners. A white title panel overlaps the lower left of the media, extending below it; the media remains visible to the panel's right. Title and introduction emerge after the media. The visible page is Artisanal bakeries, a customer segment solution page.

3–6 s: alternating two-column editorial rows. Challenges has photo left/text right; Our solutions has text left/photo right. The list items are compact and concrete. Each section has substantial but consistent vertical breathing room.

7–8 s: full-width charcoal inquiry band, short left-aligned invitation and two vertically arranged compact buttons on the right. Button hover changes contrast; the whole region has a clear inquiry purpose.

8–10 s: a small testimonial with a circular person photo, followed by compact circular food shortcuts. 11–13 s: shared ending. LS must omit the testimonial until its source is verified.

## Food/application page

Baked Goods 4–5 s: matching overlapping media/title hero. The video or image loads first, then the title and introduction become legible. A circular playback control sits near the media's bottom-right corner.

6–8 s: three-column challenge cards, then three-column solution cards. Each combines an image, a short bold heading, and explanatory body copy; these reveal in sequence.

8–11 s: a five-stage horizontal accordion explains a production process. Inactive stages are narrow vertical strips with rotated names and numbered circular controls near the bottom. The active strip widens into an image plus heading, body, and optional link. At 9 s Rounding is expanded; by 11 s Cutting is expanded, while other stages narrow. Both width and content opacity participate in the transition. Native page scrolling continues around the component.

12–13 s: a small food-output gallery, then an image/text education section. 14–18 s: three relevant production-line cards on charcoal image backgrounds, supported by concise qualification facts and explicit destination buttons. Hover accents occur on text and buttons rather than large disruptive transformations.

19–24 s: consultation invitation left and named local contact card right. A small white floating section index remains at the bottom center throughout the application page and accents the current section.

LS adaptation: process stages must match the chosen LS application and supported production workflow. Do not transfer RONDO capacity figures, outputs, claims, machinery photographs, or local contact details.

## Category listing and product page

Compas 6–11 s: category page has overlapping hero followed by equipment subgroups. Each subgroup uses a two-column grid of machine photos on charcoal, then linked model title and explanation. Whitespace organizes the groups; cards have little decorative chrome.

12–16 s: FAQ places a large section heading in the left column and full-width accordion rows in the right column. Rows have thin dividers and compact circular plus/minus controls. Multiple answers remain open simultaneously (first and second at 14 s; further answers appear at 15–16 s). Expanding answers pushes subsequent rows down in normal flow.

24–26 s: product page transitions into a charcoal hero. Breadcrumb, product name, and short explanation sit above a large isolated machine visual. A small circular image/viewer control appears on the left. The recording does not demonstrate zoom or rotation; do not infer its actual operation from this control alone.

26–27 s: suitability section with introduction and three highlighted facts. 27 s: demonstration video thumbnail beside a benefit introduction. 28–30 s: six illustrated strength cards arranged three across over a pale background. Cards reveal left to right and combine real detail photos, headings, bullets, and paragraphs.

31 s: inquiry band. 32–33 s: image-led insights. 33–35 s: charcoal technical-data band, tight multi-column information layout. The user selects text at 35 s, confirming that these specifications are page text, not a flattened image.

36 s: three accessory cards. 37 s: complementary machine cards. 38–41 s: similar machine grid. 42–44 s: consultation/contact section. 45–48 s: shared ending. A floating bottom section index tracks the long page: product, key features, benefits, touch control, baked goods, contact, inspiration, technical data, accessories, supplementary machines, similar machines, sales contact.

LS adaptation: retain the requested LS sequence and only verified technical data. Keep the image-first gallery/fullscreen implementation; this recording supplies no evidence for authentic LS rotation assets.

## What faithful reconstruction requires

1. One coordinated header/menu system, including compact scroll state, overlay/backdrop, close states, and keyboard/touch parity.
2. Consistent container alignment and type scale across every page family, with bright white/grey and charcoal zones serving clear purposes.
3. Overlapping photographic/video heroes for application/solution/category pages, plus a dedicated charcoal product hero.
4. Linked segment image/accordion, application process accordion, multi-open FAQ, and bottom section index with active-state tracking.
5. Controlled route curtain and staggered reveals, with immediate content and transitions for reduced-motion preference.
6. Visible, truthful LS inquiry paths at several points, rather than treating one long form at the bottom as the entire conversion journey.

Outstanding live checks: exact menu triggers and closure, transition timing/easing, scroll offsets, bottom-index behavior near footer, viewer/fullscreen operation, mobile adaptations, accessibility semantics, keyboard focus, media pause behavior. These recordings establish the design direction but do not prove those behaviors.
