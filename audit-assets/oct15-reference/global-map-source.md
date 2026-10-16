# LS international markets map

Asset: `assets/maps/ls-global-markets.svg`

Base geometry: Natural Earth 1:110m land polygons, obtained on 15 October 2026 from the Natural Earth vector repository:

- https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
- https://github.com/nvkelso/natural-earth-vector
- Terms: https://www.naturalearthdata.com/about/terms-of-use/

Natural Earth identifies all versions of its raster and vector map data as public domain. Commercial use and modification are permitted and credit is optional. Suggested attribution: **Made with Natural Earth.**

Downloaded source: `audit-assets/oct15-reference/ne_110m_land.geojson`

SHA-256: `9E0729EE253CA7D7A5C4AE9395FB1902264C5377C52E224D13DD85010E2835D9`

The SVG uses a simple equirectangular projection, 1200 × 560 viewBox, and real Natural Earth land outlines. Antarctica is omitted to allow a more useful inhabited-world view. Graticule, colors, labels and curves are LS presentation treatments. The Malaysia base marker uses approximate Balakong coordinates 101.75° E, 3.0° N. Region markers use approximate illustration positions: Southeast Asia 115° E, 10° N; Middle East 45° E, 25° N; South Africa 25° E, 29° S. These are market-region annotations, **not overseas office pins**.

LS market context was drawn from its published company/history material reviewed by the parent task. This map must remain paired with translated surrounding copy and must not be described as a network of LS offices. The SVG includes an accessible title/description for standalone use. For decorative embedding alongside equivalent localized text, the host page can use empty alt text.

Reproducible construction: `audit-assets/oct15-reference/build-global-map.cjs`. Rendered visual check: `audit-assets/oct15-reference/ls-global-markets-preview.png`.
