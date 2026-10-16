import re,json,csv,html
from pathlib import Path,PurePosixPath
from urllib.parse import unquote,urlsplit
from collections import Counter,defaultdict
root=Path(r'\\?\C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0')
out=Path(r'C:\Users\likto\Documents\ChatGPT\LS Website\audit-assets')
files={p.relative_to(root/'uploads').as_posix() for p in (root/'uploads').rglob('*') if p.is_file()}
imgs={'.jpg','.jpeg','.png','.gif','.webp','.svg','.avif','.bmp','.tif','.tiff','.ico','.heic'}
def unescape(s): return re.sub(r'\\(.)',lambda m:{'0':'\0','n':'\n','r':'\r','Z':'\x1a'}.get(m[1],m[1]),s)
def fields(line):
 vals=[];i=line.index('VALUES (')+8;n=len(line)
 while i<n:
  if line[i]=="'":
   i+=1;v=[]
   while i<n:
    c=line[i]
    if c=='\\' and i+1<n:v.extend((c,line[i+1]));i+=2;continue
    if c=="'":i+=1;break
    v.append(c);i+=1
   vals.append(unescape(''.join(v)))
  else:
   j=i
   while i<n and line[i] not in ',)':i+=1
   vals.append(line[j:i])
  if i>=n or line[i]!=',': break
  i+=1
 return vals
posts={};refs=Counter();hostcounts=Counter()
with (root/'database.sql').open(encoding='utf8',errors='replace') as f:
 for line in f:
  t=re.match(r'INSERT INTO `([^`]+)` VALUES \((\d+)',line)
  if not t:continue
  table,rid=t.groups();pid=''
  if table.endswith('_posts'):
   v=fields(line)
   if len(v)>=22:posts[v[0]]={'status':v[7],'type':v[20],'title':v[5]}
   pid=rid
  elif table.endswith('_postmeta'):
   m=re.match(r'INSERT INTO `[^`]+` VALUES \(\d+,(\d+),',line);pid=m[1] if m else ''
  if 'uploads' not in line:continue
  s=unescape(line).replace('\\/','/')
  for m in re.finditer(r'https?://[^\s\"\'<>\\]+',s):
   url=m[0].rstrip(');,]}')
   try:u=urlsplit(url)
   except ValueError:continue
   if '/wp-content/uploads/' not in u.path:continue
   path=unquote(html.unescape(u.path.split('/wp-content/uploads/',1)[1])).rstrip('.,;')
   if PurePosixPath(path).suffix.lower() not in imgs:continue
   host=u.hostname or '';refs[(host,path,table,pid)]+=1;hostcounts[host]+=1
lsrefs=[(h,p,t,pid,n) for (h,p,t,pid),n in refs.items() if h in ['lsmachinery.com.my','www.lsmachinery.com.my']]
scoped=[]
for h,p,t,pid,n in lsrefs:
 post=posts.get(pid,{})
 scoped.append({'path':p,'exists':p in files,'table':t,'post_id':pid,'post_status':post.get('status',''),'post_type':post.get('type',''),'occurrences':n})
with (out/'ls-domain-upload-references.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=list(scoped[0]));w.writeheader();w.writerows(scoped)
allpaths={r['path'] for r in scoped};published={r['path'] for r in scoped if r['post_status']=='publish' and r['post_type'] in ['page','post','product']}
missing=sorted(published-files)
summary={'external_hosts_top':hostcounts.most_common(12),'ls_unique_paths':len(allpaths),'ls_missing_paths':len(allpaths-files),'published_page_post_product_unique_paths':len(published),'published_page_post_product_missing_paths':missing,'missing_reference_posts':[{'id':pid,**posts[pid]} for pid in sorted({r['post_id'] for r in scoped if r['path'] in missing and r['post_status']=='publish' and r['post_type'] in ['page','post','product']})]}
(out/'ls-domain-reference-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
print(json.dumps(summary,indent=2))
