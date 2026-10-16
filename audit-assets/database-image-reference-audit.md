# Database image reference audit

Source: `C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0`.

## Media library

- 853 WordPress `_wp_attached_file` records; all 853 paths exist in uploads.
- 846 of those paths have image extensions. Existence is not the same as readability: `2025/07/Steamer-Tray.png` (attachment 6106) is unreadable by Pillow and has no same-name derivative in uploads.
- Attachment metadata contains 8,258 distinct image paths; 8,254 exist and four generated Elementor thumbnail paths are absent. The four corresponding main images exist.

Missing metadata thumbnails:

- `elementor/thumbs/Kuih-500x500-1-150x150.png`
- `elementor/thumbs/images-150x150.jpeg`
- `elementor/thumbs/images-1-150x150.jpeg`
- `elementor/thumbs/images-1-1-150x150.jpeg`

## Published content references

Published WordPress pages, posts, products and their metadata contain 2,061 distinct image URL paths on `lsmachinery.com.my` or `www.lsmachinery.com.my`. Of these, 2,058 resolve exactly to a file in uploads. Three paths do not:

1. `2025/06/LS-Website-Asset-2025-27.jpg` is referenced by Food Machinery Solutions (page 2394). A similarly named `2025/06/LS-Website-Asset-2025-27-1.jpg` exists; visual confirmation is required before substituting it.
2. `2026/01/elementor/thumbs/LS-Machine-Thumbnails-2025-Web-22-rhcoa9bndmyaxl05uq5vevgx2ctutci8hik7wj7udk.png`
3. `2026/01/elementor/thumbs/LS-Machine-Thumbnails-2025-Web-22-rhcoa9bptcj65lbmojw7n15n51944uxo93qk7c6afs.png`

The latter two are referenced by Bakery & Pastry Machinery 2 (page 7151) and Luxury Deck Oven (page 7236). Both exact filenames exist under `uploads/elementor/thumbs/`; the stored URL paths incorrectly include an additional `2026/01/` prefix.

## Method and limits

Read the SQL dump without importing or executing it. Parsed attachment path records and serialized metadata file names. Scanned image URLs, retained LS domains, and joined post metadata to published page/post/product records. Compared paths with the local uploads tree using Windows extended-length paths to avoid false missing-file results for long filenames. Preserved the backup unchanged.

The database also contains revisions, cached records and third-party theme/template image URLs. Those are not proof of missing public LS images and are excluded from the published-content totals. This is a static reference audit, not a browser audit of a restored WordPress website. Dynamic image generation, CSS outside the database, runtime plugins, remote URL availability and every catalogue item's image suitability remain outside this reference check.

Evidence files: `attachment-image-references.csv`, `ls-domain-upload-references.csv`, `image-reference-audit.json`, and `ls-domain-reference-summary.json`. The broader `database-upload-image-urls.csv` includes all domains and historical records; do not interpret its missing-file rows as live broken images.
