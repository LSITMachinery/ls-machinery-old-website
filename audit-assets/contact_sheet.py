from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import re,json
root=Path(r'\\?\C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0\uploads')
files=[p for y in ['2025','2026'] for p in (root/y).rglob('*') if p.suffix.lower() in {'.png','.jpg','.jpeg','.webp'} and not re.search(r'-\d+x\d+\.',p.name) and '-scaled' not in p.name]
Path('audit-assets/recent-image-names.txt').write_text('\n'.join(str(p.relative_to(root)) for p in files),encoding='utf-8')
print('Recent original-name image candidates:',len(files))
print('\n'.join(str(p.relative_to(root)) for p in files)[:14000])
# Sheet of machine / brand / company filename candidates, one per stem.
terms=['LSF','MCAD','MCWC','logo','company','factory','building','showroom','office','krono','mixer','sheeter','oven','encrust','packag','dim-sum']
selected=[p for p in files if any(t.lower() in p.name.lower() for t in terms)][:64]
sheet=Image.new('RGB',(1280,((len(selected)+5)//6)*185),'#eeeeee'); draw=ImageDraw.Draw(sheet)
for i,p in enumerate(selected):
 try:
  with Image.open(p) as im:
   im.thumbnail((200,145)); tile=Image.new('RGBA',im.size,'white');tile.alpha_composite(im.convert('RGBA')); sheet.paste(tile.convert('RGB'),((i%6)*213+(200-im.width)//2,(i//6)*185))
  draw.text(((i%6)*213+3,(i//6)*185+146),p.name[:30],fill='black')
  draw.text(((i%6)*213+3,(i//6)*185+160),p.name[30:59],fill='black')
 except Exception: pass
sheet.save('audit-assets/asset-contact-sheet.jpg')
