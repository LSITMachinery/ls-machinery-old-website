# LS YouTube channel inventory — 18 October 2026

This audit records all accessible listing and watch-page metadata from the LS Smart Machinery channel, plus limited visual samples for two repeated-title pairs. It does not claim that any full video or narration was reviewed.

## Files

- [channel-listing.psv](channel-listing.psv) — 251 visible entries with video ID, format, listing duration where shown, title and watch URL.
- [watch-page-metadata-all.json](watch-page-metadata-all.json) — captured YouTube watch-page metadata for all 251 visible IDs, including upload timestamp, duration, view count at capture, page title, channel identity, YouTube category, playability status, caption-track languages and source-description keys.
- [watch-page-metadata-96.psv](watch-page-metadata-96.psv) — earlier UI inspection of 96 regular videos from the first 96 listing positions, including the captions-control text and description capture status.
- [watch-page-descriptions.json](watch-page-descriptions.json) — earlier description captures for those 96 pages. Values marked as fallback or missing are only snippets, not complete descriptions.
- [repeated-title-groups.psv](repeated-title-groups.psv) — repeated normalized title groups from the visible listing. These are candidates for review, not confirmed duplicate footage.
- [sampled-repeat-watch-pages.json](sampled-repeat-watch-pages.json) — live watch-page metadata, descriptions and caption status for the two sampled Multipurpose Production Line uploads.
- [sampled-pancake-repeat-evidence.json](sampled-pancake-repeat-evidence.json) — captured metadata and timestamped visual comparison notes for the two Pancake Depositor uploads.
- [video-inventory.json](video-inventory.json) — one review-status record for each accessible channel video or Short.
- [video-placement-review.json](video-placement-review.json) — one placement decision row per accessible video; all target routes are held pending timestamped footage evidence.
- [cms-video-library-draft-import.json](cms-video-library-draft-import.json) — draft import payload with the original source details; records remain unpublished and unplaced.
- `duplicate-multipurpose-<video-id>-<sample-time>.png` — retained screenshots from the limited G5 comparison described below.
- `screenshots/duplicate-pancake-<video-id>-<sample-time>.png` — retained screenshots from the limited G6 comparison described below.

## Inventory count

The public channel header showed 255 videos. The Videos tab exposed 149 distinct IDs and the Shorts tab exposed 102 distinct IDs. The combined listing has 251 unique IDs, with no overlap between the two tabs. Four entries in the header count are not accounted for by the visible listings. The public page does not explain this difference; the remaining four could not be identified from the listing.

The listing file was checked for ID format, duplicate IDs, supported formats, missing titles or URLs, and row shape. It contains 149 video rows and 102 Shorts rows, all with unique 11-character IDs.

For the 149 regular videos, the channel listing shows a duration one second longer than the watch-page duration on 65 entries. The other 84 regular videos agree. Shorts listings did not expose a duration for comparison. This appears to be display rounding; the source values are preserved separately.

## Watch-page details captured

Watch-page metadata was captured for all 251 listed IDs. Every request returned a player record for the same LS channel ID, `UCg47JfshoyGiWqhftKV19MQ`, with watch-page playability status `OK`. One page had no description; the other 250 descriptions reduce to 12 distinct source texts. View counts are a point-in-time observation and change over time. YouTube’s own category labels are metadata only and are not used as LS content classifications.

The watch-page player response listed caption-track metadata for 149 videos and Shorts; 102 responses listed no tracks. This does not mean those captions were readable or reviewed. The earlier UI pass found the captions control reporting “Subtitles/closed captions unavailable” on all 96 pages it checked. A spot check of a video whose player response listed auto-generated English captions showed the same unavailable control; requesting that track returned an empty response. The sources therefore disagree, and no transcript or narration has been reviewed. The register keeps the track languages and old control text separate so LS can review the discrepancy.

The local site’s YouTube player emitted a `PLAYING` event for JKolefbjkLM after a visitor selected it. That checks the player integration for this one video; it does not verify all 251 embeds or prove that their full footage was watched.

## Repeated-title groups

Six groups contain more than one visible listing title after removing the repeated channel-name suffix:

- Air Mixer — nfjHT29efVo (0:22) and -1YDdZt8SWI (2:18).
- Automatic Dough Sheeter — aBLIP2AsTe4 (1:24), riJuW354LMk (1:08) and LGpKBjdCWTA (1:16).
- Continuous Dough Segmentation — WibaeYEEfpM (0:55) and Short nSeR5D5Fri0 (no duration shown in the Shorts listing).
- Fully Automatic Jar Filling Packaging Line — 95VxewbeZY8 (2:18) and EiL4AugUu7M (4:03).
- Multipurpose Production Line 多样化生产线 — JKolefbjkLM and 8uc_nD3ptJs, both listed as 1:18.
- Pancake Depositor — 4L6Mix-t-a4 and abwPqZSE8-k, both listed as 0:47.

The Multipurpose Production Line pair was visually sampled near 00:12, 00:40 and 01:10. The openings differ. Both show setup work around 00:12, from different views; both show the same training scene and caption around 00:40; both show the LS outro around 01:10. These samples support a strong shared-footage candidate, but the complete sequences and audio have not been compared, so neither upload is marked as a confirmed duplicate. Screenshots are retained in this folder as `duplicate-multipurpose-<video-id>-<sample-time>.png`. Their watch-page metadata and source descriptions are recorded in `sampled-repeat-watch-pages.json`; the observed views are time-sensitive. The 96-record watch-page file was collected separately. The 8uc_nD3ptJs watch page reports 78 seconds while the listing rounds to 1:18.

The Pancake Depositor pair, 4L6Mix-t-a4 (uploaded 17 July 2025) and abwPqZSE8-k (uploaded 10 October 2024), has the same normalized title, 46-second watch-page duration, and source description. Samples at 00:00, 00:10, 00:25 and 00:40 show matching imagery at each sampled point: the title/intro, the depositor tray, batter portions and browned product pieces. The comparison supports a strong shared-footage candidate. It does not establish that the complete cuts or audio are identical; one sampled ending frame also shows different small logo placement. Keep both uploads available until full sequences and audio are compared. The screenshot pairs and the captured metadata are retained in this folder.

The other repeated-title groups may contain different demonstrations or edits and have not been compared.

## Website and CMS checks

The local website now has `/videos/`, `/zh/videos/` and `/ms/videos/` routes with localized titles and metadata, search, category/machine/food filters, pagination, URL state, a click-to-play YouTube player, Shorts portrait sizing, player cleanup and failure fallback. Machine-page video sections render only from exact reviewed placements. The video CMS records are part of the page schema, preview and publication checks.

The public video page currently shows a review-in-progress message because the local CMS public-content endpoint returned HTTP 503 while its database service was unavailable. The 251 draft records have not been published or imported into a running CMS. This keeps unreviewed titles and guessed placements off the public page.

The CMS automated suite passed 26 tests with one PostgreSQL integration test skipped because `CMS_TEST_DATABASE_URL` is not configured. Playwright checked all three video routes at viewport widths 375, 768, 1025, 1440 and 2215 CSS pixels; none had horizontal overflow, and each route returned its localized title, language code and canonical URL. Reduced-motion mode reduced filter transitions and animations to 0.01 milliseconds. A 13-record temporary browser fixture verified filtering, pagination, query clearing and language switching without adding those records to the public library. The real YouTube player was confirmed for JKolefbjkLM only; switching and cleanup were also checked with test players.

The refreshed English full-page screenshots are in `screenshots/videos-en-final-<width>.png`. Chinese and Malay screenshots are captured at 375 and 1440 pixels. The screenshots show the review-in-progress state, not a populated or approved library.

## Work still needed

The listing and watch-page metadata are captured for all 251 accessible IDs, but the video footage, narration, captions and technical claims have not been reviewed video-by-video. Only limited visual samples for the Multipurpose Production Line and Pancake Depositor pairs were compared. These observations do not establish machine identity, food output, ownership rights, LS category, or correct website placement. Every record remains awaiting clarification; no video has been approved for publication, and no duplicate has been confirmed or removed. Compare the complete suspected-repeat pairs and reconcile the four header-count entries if a fuller channel export or account access becomes available. Database-backed draft import and publishing also remain unverified until the local database service is available.

The pages were read from the channel's [Videos tab](https://www.youtube.com/@lssmartmachinery/videos) and [Shorts tab](https://www.youtube.com/@lssmartmachinery/shorts) on 18 October 2026.

