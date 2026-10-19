# Review LS on this computer

Double-click **Start LS locally.cmd** in this folder to start the website and CMS. Keep Docker Desktop running while using the CMS. Refresh the browser after changing website files.

- Website: http://127.0.0.1:8011/home/
- Staff CMS: http://127.0.0.1:8011/cms/
- Video audit: http://127.0.0.1:8011/review/videos/

Use these addresses instead of opening index.html directly. Website routes, images and the CMS need the local server. This preview loads the current source files; it does not use old generated pages by default. Set `LS_USE_PRERENDER=1` only when deliberately reviewing generated snapshots.

## Video review

The audit page lists all 251 discovered videos and Shorts. Search a title, expand **Source and evidence**, then open the original YouTube video. The page includes the captured descriptions, possible-repeat groups, missing evidence and a filtered CSV export. It is a read-only review snapshot, not a publication screen.

The channel header showed 255 videos, so four entries remain unaccounted for. Six groups share titles; none is a confirmed duplicate. All 251 proposed placements remain pending. Metadata collection is complete for the discovered records; full footage, narration and exact machine matching are not complete. Do not treat this register as approval to insert every video.

The audit is served only by the local preview and is blocked in public mode. It is not linked from the public website navigation. The underlying JSON and internal audit folder remain blocked by the web server.

## Current homepage change

The annotated Featured machine section was removed. The intro video is followed by the six food choices and Current at LS. The three generated homepage language snapshots were refreshed.

## Local data

CMS accounts, drafts and media persist in the existing Docker volumes. Startup preserves those volumes and the local .env file. This setup does not publish the site, change DNS, replace WordPress or send inquiries to a CRM.
