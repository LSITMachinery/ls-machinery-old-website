# LS website backup — image audit

Audit date: 13 October 2026.

Source: `C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0`

Archive also found: `C:\Users\likto\Downloads\lsmachinery-com-my-20260926-141447-vcu6ltj866a0.wpress` (5.66 GB).

## Finding

The extracted backup contains a substantial existing LS image collection. All 846 WordPress image attachment records have their main files present. However, one of those files is unreadable by the image validator, four generated thumbnail references are missing, and three unique image paths in published content do not resolve exactly. Therefore, file presence is strong, but the collection is not entirely ready to use without cleanup.

## Inventory

| Check | Result |
|---|---:|
| Files in extracted backup | 35,168 |
| Extracted size | 7.90 GB |
| Image files across backup | 20,007 |
| Image files under uploads | 16,508 |
| Upload image size | 4.69 GB |
| Filename-marked resized variants | 14,257 |
| Byte-identical duplicate copies beyond first copy | 1,008 |
| Image attachment records with main file present | 846 / 846 |
| Unique attachment image paths, including sizes | 8,254 / 8,258 present |
| Unique LS upload image URL paths in published pages/posts/products and their metadata | 2,058 / 2,061 resolve exactly |
| Empty upload image files | 0 |
| Raster files passing Pillow structure verification | 16,441 / 16,442 |
| SVG files inventoried but not raster validated | 66 |

Image totals include theme/demo/imported content, old uploads, and derivatives. They are not counts of unique machines or approved LS photographs. Duplicate and resized-variant counts overlap.

Formats under uploads: 10,389 PNG; 5,024 JPG; 918 JPEG; 96 WebP; 66 SVG; 15 AVIF.

## Useful assets found

Representative files were visually inspected directly or in the contact sheet:

- `uploads/2025/11/LSF-502-MCD-Mini-Cookies-Depositor.png`: 3128 × 2952; KRONO branding visible.
- `uploads/2025/11/Mini-Cookies-Wire-Cut-Depositor-LSF-502-MCWC.png`.
- `uploads/2025/08/MCD-MCAD-WIRECUT.jpg`: comparison graphic includes MCD / MCWC / MCAD; this is not confirmation of a separate MCAD product photograph.
- `uploads/2025/06/LS-building.webp`: LS premises image.
- `uploads/2025/06/LS-Machinery-Logo-Innovation-10.png`: LS logo.
- Equipment imagery for mixers, sheeters, ovens, encrusting, packaging, and production lines.
- Food imagery, service graphics, website banners, and social icons are also present.

The uploads also contain five MP4 files and one MOV. Notable filenames include `Website-Logo-Animation.mp4` and `Fully-Automatic-Cream-Roll-Production-Line-／-LS-SMART-MACHINERY.mp4`. Their playback, contents, and suitability were not reviewed. Five PDFs appear by filename to concern furniture or blinds, rather than the LS machinery catalogue.

Older uploads contain home-decor, furniture, blinds, stock-photo, and generated-image material. Presence in this backup does not establish LS authenticity or approval for reuse.

## Issues

### Unreadable original

`uploads/2025/07/Steamer-Tray.png` exists (2,819,782 bytes) but Pillow cannot identify it as an image; its header does not resemble a PNG. Treat it as unusable pending recovery or replacement. This audit does not establish whether damage occurred before or during extraction.

### Four missing generated thumbnails

- `uploads/elementor/thumbs/Kuih-500x500-1-150x150.png`
- `uploads/elementor/thumbs/images-1-1-150x150.jpeg`
- `uploads/elementor/thumbs/images-1-150x150.jpeg`
- `uploads/elementor/thumbs/images-150x150.jpeg`

Their main image files exist. These are derivative gaps, not missing source-photo records.

### Three unresolved image paths in published content

- Food Machinery Solutions: `2025/06/LS-Website-Asset-2025-27.jpg`; a candidate file named `LS-Website-Asset-2025-27-1.jpg` exists instead. Confirm intended image before replacing the reference.
- Bakery & Pastry Machinery 2 and Luxury Deck Oven: two thumbnail paths incorrectly prepend `2026/01/` before `elementor/thumbs/`. Both thumbnail files exist under `uploads/elementor/thumbs/`.

A broader historical LS-domain scan found 191 unresolved paths among 3,319 paths. That scan includes revisions and other stored content; it is not a count of current broken public images. External theme/demo image hosts were also present and were excluded from the scoped local comparison.

## Reuse readiness

- **PASS — file presence:** all 846 image attachment main-file paths exist.
- **PARTIAL — image integrity:** one unreadable original; SVG rendering was not checked.
- **PARTIAL — stored references:** four missing generated thumbnails and three unresolved paths in published page/post/product content.
- **NOT YET VERIFIED — 61-machine coverage:** each approved inventory entry still needs an exact asset and model match. Image filenames are useful leads, not proof of suitability, specification, or availability.
- **NOT YET VERIFIED — complete rendered site:** this was an offline file/database audit, not a restored WordPress browser test or live-site crawl.

Recommended next work: map the strongest existing originals to the 61 entries, retain KRONO branding, identify any truly missing machine assets, and use the verified selections to replace prototype placeholders.

## Method and scope

Read-only inspection of the extracted backup; no WordPress/PHP code was executed. Files were inventoried by extension. Upload image hashes and dimensions were recorded; raster structures were checked with Pillow `verify()` (not full visual inspection of every image). Windows extended-length paths were used to include eight long-filename images. Database media attachment paths, generated-size metadata, and scoped LS upload image URLs were compared with local files. All original backup files were left unchanged. The .wpress archive was located but was not independently compared byte-for-byte with its extracted copy.

Supporting files: `image-inventory.csv`, `image-summary.json`, `attachment-image-references.csv`, `ls-domain-upload-references.csv`, `ls-domain-reference-summary.json`, and `asset-contact-sheet.jpg`.
