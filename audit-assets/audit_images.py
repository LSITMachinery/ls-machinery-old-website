from pathlib import Path
from collections import Counter
from PIL import Image
import json,csv,re,hashlib
root=Path(r'C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0')
out=Path(r'C:\Users\likto\Documents\ChatGPT\LS Website\audit-assets')
exts={'.jpg','.jpeg','.png','.webp','.gif','.svg','.avif','.bmp','.tif','.tiff','.ico'}
files=[p for p in root.rglob('*') if p.is_file()]
images=[p for p in files if p.suffix.lower() in exts]
rows=[]
for p in images:
 rel=p.relative_to(root).as_posix(); isupload=rel.startswith('uploads/'); w=h=''; status='not decoded'; digest=''
 if isupload:
  digest=hashlib.sha256(p.read_bytes()).hexdigest()
  if p.suffix.lower()!='.svg':
   try:
    with Image.open(p) as im: w,h=im.size; im.verify()
    status='verified'
   except Exception as e: status=type(e).__name__+': '+str(e)[:120]
  else: status='SVG (not raster decoded)'
 rows.append(dict(path=rel,bytes=p.stat().st_size,width=w,height=h,status=status,sha256=digest,resized_variant=bool(re.search(r'-\d+x\d+(?:-[^.]+)?\.[^.]+$',p.name))))
with (out/'image-inventory.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.DictWriter(f,fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)
u=[r for r in rows if r['path'].startswith('uploads/')]; hashes=Counter(r['sha256'] for r in u)
summary={'total_files':len(files),'total_bytes':sum(p.stat().st_size for p in files),'images_total':len(images),'image_locations':dict(Counter(r['path'].split('/')[0] for r in rows)),'uploads_images':len(u),'uploads_image_bytes':sum(r['bytes'] for r in u),'uploads_formats':dict(Counter(Path(r['path']).suffix.lower() for r in u)),'uploads_resized_variants':sum(r['resized_variant'] for r in u),'uploads_unique_hashes':len(hashes),'exact_duplicate_copies':sum(n-1 for n in hashes.values()),'zero_byte_images':[r['path'] for r in u if not r['bytes']],'decode_errors':[r for r in u if r['status'] not in ('verified','SVG (not raster decoded)')],'other_media':dict(Counter(p.suffix.lower() for p in files if p.suffix.lower() in {'.pdf','.mp4','.mov','.webm','.avi','.mp3'}))}
(out/'image-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
print('NON-THUMBNAIL SAMPLE')
print('\n'.join(r['path'] for r in u if not r['resized_variant'])[:15000])
