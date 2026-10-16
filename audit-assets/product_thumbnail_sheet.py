from pathlib import Path
from PIL import Image,ImageDraw
root=Path(r'\\?\C:\Users\likto\Desktop\lsmachinery-com-my-20260926-141447-vcu6ltj866a0\uploads\2026\01')
files=sorted(root.glob('LS-Machine-Thumbnails-2025-Web-??.png'))
thumb=230; label=34; cols=5; rows=(len(files)+cols-1)//cols
sheet=Image.new('RGB',(cols*thumb,rows*(thumb+label)),'#eeeae2');draw=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 im=Image.open(p).convert('RGB'); im.thumbnail((thumb-12,thumb-12))
 x=(i%cols)*thumb+(thumb-im.width)//2;y=(i//cols)*(thumb+label)+(thumb-im.height)//2
 sheet.paste(im,(x,y));draw.text(((i%cols)*thumb+12,(i//cols)*(thumb+label)+thumb+4),p.stem.replace('LS-Machine-Thumbnails-2025-Web-','LS MACHINE '),fill='black')
sheet.save('audit-assets/machine-thumbnails-contact.jpg',quality=82)
print(f'created sheet for {len(files)} assets: {sheet.width}x{sheet.height}')
