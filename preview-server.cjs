const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const delivery=require('./inquiry-delivery.cjs');

const root = __dirname;
const port = Number(process.env.PORT || 8000);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

function proxyCms(request,response){
  const cmsPort=Number(process.env.LS_CMS_PORT||8412);
  const upstream=http.request({hostname:'127.0.0.1',port:cmsPort,path:request.url,method:request.method,headers:{...request.headers,host:request.headers.host||`127.0.0.1:${cmsPort}`}},upstreamResponse=>{
    response.writeHead(upstreamResponse.statusCode||502,upstreamResponse.headers);
    upstreamResponse.pipe(response);
  });
  upstream.on('error',()=>{
    if(response.headersSent){response.destroy();return;}
    const api=request.url.startsWith('/api/');
    response.writeHead(503,{'Content-Type':api?'application/json; charset=utf-8':'text/plain; charset=utf-8','Cache-Control':'no-store','Retry-After':'10','X-Content-Type-Options':'nosniff'});
    response.end(api?JSON.stringify({error:'cms_unavailable',message:'The local CMS service is not running. Start the LS CMS with Docker Compose.'}):'The local CMS service is not running. Start the LS CMS with Docker Compose.');
  });
  request.pipe(upstream);
}

function createServer(){return http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }
  if(pathname==='/cms') {response.writeHead(308,{Location:'/cms/'+new URL(request.url,'http://127.0.0.1').search}).end();return;}
  if(pathname==='/cms/'||pathname.startsWith('/cms/')||pathname==='/api/cms'||pathname.startsWith('/api/cms/')||pathname==='/api/content'||pathname.startsWith('/api/content/')){proxyCms(request,response);return;}
  if(pathname==='/api/config'){
    if(!['GET','HEAD'].includes(request.method)){response.writeHead(405).end();return;}
    response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify({inquiryDelivery:delivery.deliveryConfigured()}));return;
  }
  if(pathname==='/api/inquiries'){delivery.handle(request,response).catch(()=>{if(!response.headersSent)response.writeHead(500);response.end();});return;}
  if(request.method!=='GET'&&request.method!=='HEAD'){response.writeHead(405).end('Method not allowed');return;}
  const publicRoot=process.env.LS_SITE_URL||'https://lsmachinery.com.my';
  const publicMode=process.env.LS_PUBLIC_SITE==='1';
  const pagesDir=path.join(root,'public-pages');
  let manifest=[];try{manifest=JSON.parse(fs.readFileSync(path.join(pagesDir,'routes.json'),'utf8'));}catch{}
  if(pathname==='/robots.txt'){response.writeHead(200,{'Content-Type':'text/plain'}).end(publicMode?'User-agent: *\nAllow: /\nSitemap: '+publicRoot+'/sitemap.xml\n':'User-agent: *\nDisallow: /\n');return;}
  if(pathname==='/sitemap.xml'){
    const routes=manifest.filter(route=>route!=='company/project-process');
    const locations=['','/zh','/ms'].flatMap(prefix=>routes.map(route=>publicRoot+prefix+(route==='home'?'/':'/'+route+'/')));
    response.writeHead(200,{'Content-Type':'application/xml'}).end('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+locations.map(url=>'<url><loc>'+url+'</loc></url>').join('')+'</urlset>');return;
  }
  if(/(?:^|\/)\.[^/]/.test(pathname)||/^\/(?:audit-assets|tests|scripts|styles|public-pages)(?:\/|$)/i.test(pathname)||/\.(?:md|cjs|env|toml|sql|log)$/i.test(pathname)){response.writeHead(404).end('Not found');return;}
  const pathParts=pathname.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);
  const language=['zh','ms'].includes(pathParts[0])?pathParts.shift():'en';
  const route=pathParts.join('/')||'home';
  if(route==='company/project-process'){
    const prefix=language==='en'?'':'/'+language;
    response.writeHead(308,{Location:prefix+'/services/#working-process'+new URL(request.url,'http://localhost').search}).end();return;
  }
  const aliases={'machine/lsf-502-mcd':'machine/mini-cookie-depositor-mcd','machine/lsf-502-mcwc':'machine/mini-cookie-wire-cut-mcwc','machine/lsf-502-mcad':'machine/mini-cake-depositor-mcad','company/customer-experiences':'company/customer-partnerships'};
  if(aliases[route]){const prefix=language==='en'?'':'/'+language;response.writeHead(308,{Location:prefix+'/'+aliases[route]+'/'+new URL(request.url,'http://localhost').search}).end();return;}
  const routeRoot=route.split('/')[0];
  const isPage=route==='home'||['machines','machine','food','segment','solution','solutions','service','services','company','insights','inquiry','privacy','search'].includes(routeRoot);
  if(isPage&&!pathname.includes('.')){
    if(pathname!=='/'&&!pathname.endsWith('/')){response.writeHead(308,{Location:pathname+'/'+new URL(request.url,'http://localhost').search}).end();return;}
    const snapshot=path.resolve(pagesDir,language==='en'?route:path.join(language,route),'index.html');
    const safeSnapshot=snapshot.startsWith(pagesDir+path.sep)&&process.env.LS_SKIP_PRERENDER!=='1'&&fs.existsSync(snapshot);
    let html=fs.readFileSync(safeSnapshot?snapshot:path.join(root,'index.html'),'utf8');
    if(!publicMode)html=html.replace('</head>','<meta name="robots" content="noindex,nofollow"></head>');
    response.writeHead(manifest.length&&!manifest.includes(route)?404:200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});
    response.end(request.method==='HEAD'?'':html);return;
  }
  if (pathname === "/") pathname = "/index.html";
  const filename = path.resolve(root, `.${pathname}`);
  if (filename !== root && !filename.startsWith(root + path.sep)) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  fs.stat(filename, (error, stat) => {
    if (error || !stat.isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": types[path.extname(filename).toLowerCase()] || "application/octet-stream",
      "Content-Length": stat.size,
      "X-Content-Type-Options": "nosniff"
    });
    if (request.method === "HEAD") response.end();
    else fs.createReadStream(filename).pipe(response);
  });
});}
if(require.main===module)createServer().listen(port, "127.0.0.1", () => {
  console.log(`LS Smart Machinery preview: http://127.0.0.1:${port}`);
});
module.exports={createServer};
