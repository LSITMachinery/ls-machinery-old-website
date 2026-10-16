const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');
const names = ['Rondo Solution Page.mp4','Rondo Baked Goods page.mp4','Rondo machines - Dough sheeters, Compas 4.0 page.mp4','Rondo machine landing page.mp4'];
const slugs=['solutions','baked-goods','compas-detail','machine-landing'];
const root=__dirname;
const server=http.createServer((req,res)=>{
 const i=Number(req.url.slice(1));
 if(req.url==='/'){res.setHeader('Content-Type','text/html');res.end('<video muted></video><canvas></canvas>');return;}
 if(!Number.isInteger(i)||i<0||i>=names.length){res.writeHead(404);res.end();return;}
 const file=path.join('C:/Users/likto/Downloads',names[i]);const size=fs.statSync(file).size;
 const range=req.headers.range;
 if(range){const [a,b]=range.replace('bytes=','').split('-');const start=Number(a),end=b?Number(b):size-1;res.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${size}`,'Accept-Ranges':'bytes','Content-Length':end-start+1,'Content-Type':'video/mp4'});fs.createReadStream(file,{start,end}).pipe(res);}
 else {res.writeHead(200,{'Content-Length':size,'Content-Type':'video/mp4'});fs.createReadStream(file).pipe(res);}
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;const browser=await chromium.launch();const page=await browser.newPage();await page.goto(`http://127.0.0.1:${port}`);const metadata=[];
for(let i=0;i<names.length;i++){
 const meta=await page.evaluate(async i=>{const v=document.querySelector('video');v.src=`/${i}`;await new Promise((r,j)=>{v.onloadeddata=r;v.onerror=j});return {duration:v.duration,width:v.videoWidth,height:v.videoHeight}},i);
 console.log(slugs[i],meta);metadata.push({name:names[i],slug:slugs[i],...meta});
 const dir=path.join(root,slugs[i]);fs.mkdirSync(dir,{recursive:true});
 for(let t=0;t<meta.duration;t+=1){const data=await page.evaluate(async t=>{const v=document.querySelector('video');if(t!==v.currentTime){await new Promise(r=>{v.onseeked=r;v.currentTime=t})};const c=document.querySelector('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL('image/jpeg',.85).split(',')[1]},t);fs.writeFileSync(path.join(dir,`${String(t).padStart(4,'0')}.jpg`),Buffer.from(data,'base64'));}
}
fs.writeFileSync(path.join(root,'metadata.json'),JSON.stringify(metadata,null,2));await browser.close();server.close();})().catch(e=>{console.error(e);server.close();process.exitCode=1});

