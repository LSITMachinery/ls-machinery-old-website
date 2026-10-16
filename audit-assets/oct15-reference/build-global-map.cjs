const fs = require('node:fs');
const path = require('node:path');
const source = JSON.parse(fs.readFileSync(path.join(__dirname, 'ne_110m_land.geojson'), 'utf8'));
const project = ([lon,lat]) => [48 + (lon + 180) * (1104 / 360), 42 + (83 - lat) * (1104 / 360)];
const point = coordinates => project(coordinates).map(n => n.toFixed(2)).join(',');
const polygonPath = rings => Math.max(...rings[0].map(coordinate => coordinate[1])) < -58 ? '' : rings.map(ring => `M${ring.map(point).join('L')}Z`).join('');
const land = source.features.map(feature => {
  const geometry = feature.geometry;
  return geometry.type === 'Polygon' ? polygonPath(geometry.coordinates) : geometry.coordinates.map(polygonPath).join('');
}).join('');
const [mx,my] = project([101.75,3]);
const regions = [
  {name:'Southeast Asia', point:[115,10], control:[976,205], label:[994,242], anchor:'start'},
  {name:'Middle East', point:[45,25], control:[827,147], label:[728,187], anchor:'middle'},
  {name:'South Africa', point:[25,-29], control:[813,424], label:[617,438], anchor:'middle'}
];
const connections = regions.map(region => {
  const [x,y] = project(region.point);
  return `<path d="M${mx.toFixed(2)} ${my.toFixed(2)} Q${region.control.join(' ')} ${x.toFixed(2)} ${y.toFixed(2)}"/><circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="4" fill="#8a8d84" stroke="none"/>`;
}).join('');
const labels = regions.map(region => `<text x="${region.label[0]}" y="${region.label[1]}" text-anchor="${region.anchor}">${region.name}</text>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="map-title map-description">
  <title id="map-title">Malaysia base, international possibilities</title>
  <desc id="map-description">A world map locating LS Smart Machinery's Malaysian base near Balakong. Dotted connections indicate Southeast Asia, the Middle East and South Africa as market regions. These are not overseas office locations.</desc>
  <defs>
    <clipPath id="map-bounds"><rect x="24" y="20" width="1152" height="490" rx="8"/></clipPath>
    <radialGradient id="malaysia-glow"><stop stop-color="#ff6b2c" stop-opacity=".16"/><stop offset="1" stop-color="#ff6b2c" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="560" fill="#f6f5f0"/>
  <g clip-path="url(#map-bounds)">
    <g fill="none" stroke="#e7e6df" stroke-width="1">
      <path d="M48 143.2H1152M48 235.2H1152M48 327.2H1152M48 419.2H1152"/>
      <path d="M232 20V510M416 20V510M600 20V510M784 20V510M968 20V510"/>
    </g>
    <path d="${land}" fill="#d7d9d1" fill-rule="evenodd" stroke="#f6f5f0" stroke-width=".5" stroke-linejoin="round"/>
    <g fill="none" stroke="#a6aaa0" stroke-width="1.5" stroke-dasharray="2 6" stroke-linecap="round">${connections}</g>
    <circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="58" fill="url(#malaysia-glow)"/>
    <circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="14" fill="#ff6b2c" opacity=".16"/>
    <circle cx="${mx.toFixed(2)}" cy="${my.toFixed(2)}" r="6" fill="#f96326" stroke="#fff" stroke-width="2.5"/>
  </g>
  <g font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="500" fill="#64695f">${labels}</g>
  <path d="M${mx.toFixed(2)} ${(my+16).toFixed(2)}V323H946" fill="none" stroke="#f96326" stroke-width="1.25"/>
  <text x="956" y="321" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#282c26">Malaysia</text>
  <text x="956" y="342" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#686b64">Our base · Balakong</text>
  <g font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#71756c"><circle cx="56" cy="530" r="4" fill="#f96326"/><text x="70" y="534">Malaysia base</text><path d="M198 530H228" stroke="#a6aaa0" stroke-width="1.5" stroke-dasharray="2 5"/><text x="238" y="534">Market regions</text></g>
</svg>`;
const output = path.join(__dirname, '../../assets/maps/ls-global-markets.svg');
fs.mkdirSync(path.dirname(output), {recursive:true});
fs.writeFileSync(output, svg);
console.log(output);

