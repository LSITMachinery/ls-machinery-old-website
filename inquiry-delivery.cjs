const crypto=require('node:crypto');
const rates=new Map(),requests=new Map();
const fields=['name','company','email','phone','country','inquiryType','intent','journeyStage','machineNumber','partModel','partNumber','partDescription','quantity','deliveryAddress','remarks','message','product','dailyOutput','factoryLocation','timeline','kind','context','sourcePage','sourceUrl','language','messageText','website'];
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
function deliveryConfigured(){try{const target=new URL(process.env.LS_INQUIRY_WEBHOOK_URL);return target.protocol==='https:'||target.protocol==='http:'&&['127.0.0.1','localhost','[::1]'].includes(target.hostname);}catch{return false;}}
async function handle(req,res){
  if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return;}
  const origin=req.headers.origin;
  if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`){json(res,403,{error:'Origin rejected'});return;}
  if(!String(req.headers['content-type']).startsWith('application/json')){json(res,415,{error:'JSON required'});return;}
  const forwarded=String(req.headers['x-forwarded-for']||'').split(',')[0].trim();
  const now=Date.now(),ip=process.env.LS_TRUST_PROXY==='1'&&/^[a-fA-F0-9:.]{3,50}$/.test(forwarded)?forwarded:req.socket.remoteAddress;
  for(const [key,value]of rates)if(now-value.start>600000)rates.delete(key);
  for(const [key,value]of requests)if(now-value.time>600000)requests.delete(key);
  const rate=rates.get(ip)||{start:now,count:0};rates.set(ip,rate);if(++rate.count>20){json(res,429,{error:'Please wait before trying again'});return;}
  let raw='';try{for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>32768){json(res,413,{error:'Request too large'});return;}}}catch{json(res,400,{error:'Invalid request'});return;}
  let input;try{input=JSON.parse(raw);}catch{json(res,400,{error:'Invalid request'});return;}
  if(!input||Array.isArray(input)||typeof input!=='object'){json(res,400,{error:'Invalid request'});return;}
  const values={};for(const key of fields){if(input[key]!=null&&typeof input[key]!=='string'){json(res,400,{error:'Invalid field'});return;}values[key]=String(input[key]||'').trim();if(values[key].length>(['message','messageText','remarks','deliveryAddress'].includes(key)?6000:500)){json(res,400,{error:'Field too long'});return;}}
  if(values.website||!values.name||!(values.email||values.phone)||!(values.kind==='spare-parts'?values.partDescription:values.message)||values.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)||values.quantity&&!/^[1-9]\d{0,5}$/.test(values.quantity)){json(res,422,{error:'Provide a name, reply contact and request details'});return;}
  if(!deliveryConfigured()){json(res,503,{error:'Use email or WhatsApp while web delivery is unavailable'});return;}
  const key=String(req.headers['idempotency-key']||'');if(!/^[a-zA-Z0-9-]{16,80}$/.test(key)){json(res,400,{error:'Request key required'});return;}
  const digest=crypto.createHash('sha256').update(JSON.stringify(values)).digest('hex');
  if(requests.has(key)){const previous=requests.get(key);if(previous.digest!==digest){json(res,409,{error:'Request key reused with different details'});return;}const result=await previous.promise;json(res,result.status,result.body);return;}
  const reference='LS-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+crypto.randomBytes(5).toString('hex').toUpperCase();
  const promise=(async()=>{try{
    const response=await fetch(process.env.LS_INQUIRY_WEBHOOK_URL,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key,...(process.env.LS_INQUIRY_WEBHOOK_TOKEN?{Authorization:'Bearer '+process.env.LS_INQUIRY_WEBHOOK_TOKEN}:{})},body:JSON.stringify({reference,submittedAt:new Date().toISOString(),audience:'sales-and-marketing',...values}),signal:AbortSignal.timeout(12000),redirect:'error'});
    if(!response.ok)throw new Error('provider rejected');
    return {status:202,body:{status:'accepted-for-delivery',reference}};
  }catch{return {status:502,body:{error:'Delivery unavailable. Your details remain in the form.'}};}})();
  requests.set(key,{time:now,digest,promise});const result=await promise;if(result.status!==202)requests.delete(key);json(res,result.status,result.body);
}
module.exports={handle,deliveryConfigured};
