from pathlib import Path
from PIL import Image
from collections import Counter
import csv,json,re,hashlib
root=Path(r'\\?\C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0')
out=Path('audit-assets'); summary=json.loads((out/'image-summary.json').read_text())
with (out/'image-inventory.csv').open(encoding='utf-8-sig',newline='') as f: rows=list(csv.DictReader(f))
known={r['path'] for r in rows}; added=[]
for p in (root/'uploads').rglob('*'):
 if p.suffix.lower() not in {'.jpg','.jpeg','.png','.webp','.gif','.svg','.avif','.bmp','.tif','.tiff','.ico'}:continue
 rel=p.relative_to(root).as_posix()
 if rel in known or not p.is_file():continue
 with Image.open(p) as im: w,h=im.size; im.verify()
 r=dict(path=rel,bytes=p.stat().st_size,width=w,height=h,status='verified',sha256=hashlib.sha256(p.read_bytes()).hexdigest(),resized_variant=bool(re.search(r'-\d+x\d+(?:-[^.]+)?\.[^.]+$',p.name)));rows.append(r);added.append(r)
with (out/'image-inventory.csv').open('w',newline='',encoding='utf-8-sig') as f:
 writer=csv.DictWriter(f,fieldnames=rows[0].keys());writer.writeheader();writer.writerows(rows)
u=[r for r in rows if r['path'].startswith('uploads/')];hashes=Counter(r['sha256'] for r in u)
summary.update(total_files=summary['total_files']+len(added),total_bytes=summary['total_bytes']+sum(r['bytes'] for r in added),images_total=len(rows),uploads_images=len(u),uploads_image_bytes=sum(int(r['bytes']) for r in u),uploads_formats=dict(Counter(Path(r['path']).suffix.lower() for r in u)),uploads_resized_variants=sum(str(r['resized_variant'])=='True' for r in u),uploads_unique_hashes=len(hashes),exact_duplicate_copies=sum(n-1 for n in hashes.values()))
summary['image_locations']['uploads']=len(u)
(out/'image-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
p=root/'uploads/2025/07/Steamer-Tray.png'; print('Steamer-Tray header:',repr(p.read_bytes()[:40]))
print('VIDEO AND PDF FILES:')
print('\n'.join(str(p.relative_to(root)) for p in root.rglob('*') if p.suffix.lower() in {'.mp4','.mov','.pdf'}))
