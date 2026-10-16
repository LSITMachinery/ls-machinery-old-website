from pathlib import Path
import json
stock=json.loads(Path('audit-assets/oct15-food-photo-records.json').read_text(encoding='utf8'))
ls=json.loads(Path('audit-assets/oct15-ls-cookie-records.json').read_text(encoding='utf8'))
photos={r['key']:r for r in stock+ls}
def t(en,zh,ms):return {'en':en,'zh':zh,'ms':ms}
def visual(key,names,machines=[],evidence='',stage=None):
 r=photos[key];o={k:r[k] for k in ['src','width','height','source','sizes','original','sha256']};o['name']=t(*names);o['alt']=t(*names);o['machineNames']=machines;o['matchEvidence']=evidence or 'Real photograph of this food type; food discovery reference, not evidence of an LS-machine production result.';o['imageRole']='ls-source-food-example' if key.startswith('ls-') else 'food-reference';o['credit']={'author':r['author'],'source':r['source'],'license':r['license'],'licenseUrl':r.get('licenseUrl',''),'changes':'Resized to WebP; page display may crop the photograph.'}
 if stage:o['process']=t(*stage)
 return o
piped=visual('ls-piped-cookies',('Piped cookies','挤花曲奇','Kuki paip'),['Mini Cookie Depositor (MCD)'],'Published LS machine profile post 3083, Product section: IMG_2623 paired with Jenny Cookie. Visual inspection: real camera photograph of piped cookies on a dark baking tray. Use generic piped-cookie label, avoiding any Jenny Bakery endorsement.',('Cookie depositing','饼干挤注','Pendepositan kuki'))
# Stage copy is optional and stored with translations rather than inferred performance claims.
piped['process']=t('Cookie depositing','饼干挤注','Pendepositan kuki')
spiral=visual('ls-spiral-cookies',('Spiral cookies','螺旋曲奇','Kuki lingkaran'),['Mini Cookie Depositor (MCD)'],'Published LS machine profile post 3083, Product section: IMG_20250818_130309 paired with Spiral Cookies. Source photo shows piped spiral cookies arranged on baking trays.',('Cookie depositing','饼干挤注','Pendepositan kuki'))
rounds=visual('ls-round-cookies',('Round cookies','圆形饼干','Kuki bulat'),[],'LS archive IMG_20250212_130544 shows rows of round cookies. Source caption says Chocolate Chip Cookie, but visible inclusions are unclear; do not claim chocolate-chip recipe compatibility or assign it as an exact machine output.')
butter=visual('butter-cookies',('Butter biscuits','奶油饼干','Biskut mentega'))
chocolate=visual('chocolate-cake',('Layer cakes','分层蛋糕','Kek berlapis'),['Cake Cutter'],'Published LS post 5467 describes round, square and layered cakes. This licensed photograph illustrates a finished layered cake, not an LS cutting result.',('Cake portioning','蛋糕分切','Pembahagian kek'))
sponge=visual('sponge-cake',('Sponge cakes','海绵蛋糕','Kek span'),['Mini Cake Depositor (MCAD)'],'Published LS posts 6184 and 5288 / Mini Cake Depositor content describes soft cake batter and sponge cakes. Food photograph is a reference; cake finishing and baking require their respective stages.',('Batter depositing','面糊注料','Pendepositan adunan'))
loaf=visual('bread-loaf',('Loaf bread','面包','Roti buku'))
roll=visual('bread-rolls',('Bread rolls','餐包','Bun roti'))
croissant=visual('croissants',('Croissants','可颂','Croissant'),['Blast Freezer'],'Published LS post 5512 lists croissants as a freezing-stage application. This photograph is baked croissants; it does not show the freezing stage or prove a forming machine configuration.',('Freezing workflow planning','冷冻流程规划','Perancangan aliran pembekuan'))
angku=visual('ang-ku-kueh',('Ang ku kueh','红龟粿','Ang ku kuih'),['Dough Encrusting Machine'],'Published LS machine profile post 7112 describes ang ku kueh among filled-product applications. Photograph is a real market food reference; moulded finish requires process/configuration review.',('Filling and forming','包馅与成型','Pengisian dan pembentukan'))
ondeh=visual('ondeh-ondeh',('Ondeh-ondeh','椰糖糯米球','Ondeh-ondeh'),['Dough Encrusting Machine'],'Published LS machine profile post 7112 explicitly lists Ondeh-ondeh among its product examples. Real licensed reference photo, not a claimed LS machine trial.',('Filling and forming','包馅与成型','Pengisian dan pembentukan'))
dimsum=visual('dim-sum',('Steamed dim sum','蒸点心','Dim sum kukus'),['Steamer'],'Published LS post 5451 describes steaming buns, dim sum and traditional foods. Assorted-food photograph is not proof that a single LS forming machine makes every pictured item.',('Steaming','蒸制','Pengukusan'))
mantou=visual('mantou',('Steamed buns','馒头','Roti kukus'),['Steamer'],'Published LS post 5451 names buns as a steaming application. Photograph is a real steamed-bun reference, not an LS forming/recipe performance claim.',('Steaming','蒸制','Pengukusan'))
groups=[
 ('Cookies & Biscuits','butter-cookies',[piped,spiral,rounds,butter]),
 ('Cakes','chocolate-cake',[chocolate,sponge]),
 ('Bread & Buns','bread-rolls',[loaf,roll,mantou]),
 ('Pastries & Crusted Foods','croissants',[croissant]),
 ('Kueh & Asian Foods','ang-ku-kueh',[angku,ondeh]),
 ('Dim Sum','dim-sum',[dimsum,mantou])
]
labels={'Cookies & Biscuits':t('Assorted butter cookies','什锦奶油曲奇','Aneka kuki mentega'),'Cakes':t('Chocolate layer cake','巧克力分层蛋糕','Kek coklat berlapis'),'Bread & Buns':t('Golden bread rolls','金黄餐包','Bun roti keemasan'),'Pastries & Crusted Foods':t('Baked croissants','烤可颂','Croissant dibakar'),'Kueh & Asian Foods':t('Ang ku kueh at a Malaysian market','马来西亚市场的红龟粿','Ang ku kuih di pasar Malaysia'),'Dim Sum':t('Dim sum in bamboo steamers','竹蒸笼里的点心','Dim sum dalam pengukus buluh')}
result={}
for name,key,items in groups:
 r=photos[key];result[name]={'name':name,'src':r['src'],'width':r['width'],'height':r['height'],'sizes':r['sizes'],'alt':labels[name],'source':r['source'],'credit':{'author':r['author'],'source':r['source'],'license':r['license'],'licenseUrl':r.get('licenseUrl',''),'changes':'Resized to WebP; display crops may be used.'},'items':items,'imageRole':'food-reference'}
outputs={}
# Only explicit LS process relationships are exposed. Stock photos never claim to be machine trial evidence.
for item in [piped,spiral,chocolate,sponge,angku,ondeh,dimsum,mantou,croissant]:
 for machine in item['machineNames']:outputs.setdefault(machine,[]).append(item)
header='/* Real photographed food references and source-backed LS process examples.\n   Stock photographs are not LS-made samples or complete machine-capability evidence.\n   Attribution records: food-photo-credits.html and audit-assets/oct15-food-review.md. */\n'
Path('food-applications.js').write_text(header+'window.LS_FOOD_VISUALS = '+json.dumps(result,ensure_ascii=False,indent=2)+';\nwindow.LS_MACHINE_FOOD_OUTPUTS = '+json.dumps(outputs,ensure_ascii=False,indent=2)+';\n',encoding='utf8')
print('groups',len(result),'group items',sum(len(v['items']) for v in result.values()),'documented machine relationships',len(outputs))

