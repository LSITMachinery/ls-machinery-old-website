import re,json,csv,html
from pathlib import Path, PurePosixPath
from urllib.parse import unquote
from collections import Counter
root=Path(r'\\?\C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0')
out=Path(r'C:\Users\likto\Documents\ChatGPT\LS Website\audit-assets')
files={p.relative_to(root/'uploads').as_posix():p for p in (root/'uploads').rglob('*') if p.is_file()}
imgs={'.jpg','.jpeg','.png','.gif','.webp','.svg','.avif','.bmp','.tif','.tiff','.ico','.heic'}
attached={}; metadata={}; url_paths=Counter(); tables=Counter()
pat=re.compile(r"INSERT INTO `([^`]+)` VALUES \(\d+,(\d+),'(_wp_attached_file|_wp_attachment_metadata)','(.*)'\);\s*$")
def unescape(s):
 return re.sub(r'\\(.)',lambda m:{'0':'\0','n':'\n','r':'\r','Z':'\x1a'}.get(m[1],m[1]),s)
with (root/'database.sql').open('r',encoding='utf8',errors='replace') as f:
 for line in f:
  m=pat.match(line)
  if m:
   table,pid,key,value=m.groups();tables[table]+=1
   (attached if key=='_wp_attached_file' else metadata)[pid]=unescape(value)
  if 'uploads' in line:
   normalized=unescape(line).replace('\\/','/')
   for m in re.finditer(r'/wp-content/uploads/([^\s\"\'<>\\?&#\)\]}]+)',normalized):
    path=unquote(html.unescape(m[1])).rstrip('.,;')
    if PurePosixPath(path).suffix.lower() in imgs: url_paths[path]+=1
refs=[]
for pid,path in attached.items():
 refs.append({'attachment_id':pid,'source':'attached_file','path':path,'exists':path in files,'image':PurePosixPath(path).suffix.lower() in imgs})
for pid,value in metadata.items():
 vals=re.findall(r's:\d+:"(file|original_image)";s:\d+:"(.*?)";',value)
 base=PurePosixPath(attached.get(pid, next((v for k,v in vals if k=='file'),''))).parent
 for i,(key,v) in enumerate(vals):
  path=v if '/' in v else str(base/v)
  refs.append({'attachment_id':pid,'source':'metadata_'+key,'path':path,'exists':path in files,'image':PurePosixPath(path).suffix.lower() in imgs})
with (out/'attachment-image-references.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.DictWriter(f,fieldnames=['attachment_id','source','path','exists','image']);w.writeheader();w.writerows(refs)
with (out/'database-upload-image-urls.csv').open('w',newline='',encoding='utf-8-sig') as f:
 w=csv.writer(f);w.writerow(['upload_path','occurrences','exists']);w.writerows((p,n,p in files) for p,n in sorted(url_paths.items()))
unique_image_refs={r['path'] for r in refs if r['image']}
missing=sorted(unique_image_refs-files.keys())
summary={'upload_files':len(files),'upload_images':sum(PurePosixPath(p).suffix.lower() in imgs for p in files),'attached_rows':len(attached),'attached_images':sum(PurePosixPath(p).suffix.lower() in imgs for p in attached.values()),'metadata_rows':len(metadata),'reference_rows':len(refs),'unique_attachment_image_paths':len(unique_image_refs),'missing_attachment_image_paths':missing,'missing_attached_files':[{'id':pid,'path':p} for pid,p in attached.items() if p not in files],'unique_database_image_url_paths':len(url_paths),'missing_database_image_url_paths':sorted(set(url_paths)-files.keys()),'tables':dict(tables)}
(out/'image-reference-audit.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
print(json.dumps({k:v for k,v in summary.items() if k!='missing_database_image_url_paths'},indent=2))

