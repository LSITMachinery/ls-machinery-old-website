const assert=require('node:assert/strict');
const http=require('node:http');
const {createServer}=require('../preview-server.cjs');

async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return server.address().port;}
async function call(port,path,options={}){
  return new Promise((resolve,reject)=>{
    const request=http.request({hostname:'127.0.0.1',port,path,method:options.method||'GET',headers:options.headers||{}},response=>{
      const chunks=[];response.on('data',chunk=>chunks.push(chunk));response.on('end',()=>resolve({status:response.statusCode,headers:response.headers,body:Buffer.concat(chunks).toString()}));
    });
    request.on('error',reject);if(options.body)request.write(options.body);request.end();
  });
}

(async()=>{
  const originalPort=process.env.LS_CMS_PORT;
  const upstream=http.createServer(async(request,response)=>{
    let body='';for await(const chunk of request)body+=chunk;
    response.writeHead(207,{'Content-Type':'application/json','Set-Cookie':'ls_cms_session=fixture; Path=/; HttpOnly; SameSite=Strict','X-Upstream-Method':request.method});
    response.end(JSON.stringify({url:request.url,method:request.method,host:request.headers.host,origin:request.headers.origin||'',body}));
  });
  const upstreamPort=await listen(upstream);process.env.LS_CMS_PORT=String(upstreamPort);
  const preview=createServer();const previewPort=await listen(preview);
  try{
    const cms=await call(previewPort,'/cms/');
    assert.equal(cms.status,207);assert.match(cms.headers['set-cookie'][0],/HttpOnly/);assert.deepEqual(JSON.parse(cms.body),{url:'/cms/',method:'GET',host:`127.0.0.1:${previewPort}`,origin:'' ,body:''});
    const payload='{"email":"editor@example.test"}';
    const api=await call(previewPort,'/api/cms/auth/login?source=site',{method:'POST',headers:{'Content-Type':'application/json','Origin':`http://127.0.0.1:${previewPort}`},body:payload});
    assert.equal(api.status,207);assert.deepEqual(JSON.parse(api.body),{url:'/api/cms/auth/login?source=site',method:'POST',host:`127.0.0.1:${previewPort}`,origin:`http://127.0.0.1:${previewPort}`,body:payload});
    const published=await call(previewPort,'/api/content/published?route=%2Fmachine%2Fmcd%2F');
    assert.equal(JSON.parse(published.body).url,'/api/content/published?route=%2Fmachine%2Fmcd%2F');
    console.log('PASS: /cms, authenticated CMS API and published-content API preserve method, path, query, origin, host and secure cookies through the local reverse proxy.');
  }finally{
    await new Promise(resolve=>preview.close(resolve));await new Promise(resolve=>upstream.close(resolve));
    if(originalPort===undefined)delete process.env.LS_CMS_PORT;else process.env.LS_CMS_PORT=originalPort;
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
