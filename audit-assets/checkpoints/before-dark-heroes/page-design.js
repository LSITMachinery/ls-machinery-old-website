(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const text = (c, en, zh, ms) => c.language === 'zh' ? zh : c.language === 'ms' ? ms : en;
  const foodLinks = c => `<div class="food-shortcuts">${c.foods.slice(0,6).map(food => `<a class="food-shortcut fade-in" href="#food/${slug(food.name)}">${c.assetImage(c.sectionAsset('foods',slug(food.name)), 'food-shortcut-image', {alt:'',sizes:'96px'})}<span class="food-name">${esc(c.localName(food.name))}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>`;
  function segmentPicker(c) {
    return `<div class="segment-picker" data-segment-picker><figure class="segment-picker-visual">${c.segments.slice(0,3).map((segment,i) => c.assetImage(c.sectionAsset('segments',slug(segment.name)), `segment-picker-image ${i===0?'is-active':''}`, {sizes:'(max-width:800px) 90vw, 45vw'}).replace('<img ',`<img data-segment-image="${i}" `)).join('')}</figure><div class="segment-picker-items">${c.segments.slice(0,3).map((segment,i) => `<article class="segment-picker-item ${i===0?'is-active':''}"><h3><button type="button" data-segment-index="${i}" aria-expanded="${i===0}" aria-controls="segment-panel-${i}"><span class="circle-plus" aria-hidden="true">${i===0?'−':'+'}</span>${esc(c.localName(segment.name))}</button></h3><div class="segment-picker-panel" id="segment-panel-${i}" data-segment-panel="${i}" ${i===0?'':'hidden inert'}><p>${esc(c.pageText(`segment0${i+1}`))}</p>${c.buttonLink(`#segment/${slug(segment.name)}`,text(c,'Discover this segment','探索此企业类别','Terokai segmen ini'))}</div></article>`).join('')}</div></div>`;
  }
  function photoHero(c, title, lead, image, eyebrow, reference=false) {
    return `<section class="reference-hero"><figure class="reference-hero-media ${reference?'is-equipment-reference':''}">${c.assetImage(image,'reference-hero-image',{priority:true,loading:'eager',sizes:'(max-width:800px) 95vw, 90vw'})}${reference?`<figcaption>${esc(text(c,'Equipment image · confirm the model on its detail page','设备图片 · 型号以设备详情页为准','Imej peralatan · sahkan model pada halaman butiran'))}</figcaption>`:''}</figure><div class="reference-hero-panel"><span class="eyebrow">${esc(eyebrow)}</span><h1 class="display-title">${esc(title)}</h1><p class="lede">${esc(lead)}</p></div></section>`;
  }
  function inquiryBand(c, context='') {
    const route = `#inquiry${context?'?context='+encodeURIComponent(context):''}`;
    const intentRoute = intent => `${route}${context?'&':'?'}intent=${intent}`;
    return `<section class="production-invitation"><div class="section-wrap"><h2>${esc(text(c,'Let’s talk about your production.','一起讨论您的生产需求。','Mari bincangkan pengeluaran anda.'))}</h2><div>${c.buttonLink(intentRoute('consult'),c.t('consult'),'light')}${c.buttonLink(intentRoute('quote'),c.t('askForQuote'),'outline')}</div></div></section>`;
  }
  function home(c) {
    const models = ['LSF 502 MCD','LSF 502 MCWC','LSF 502 MCAD'];
    const sourceNames = ['Mini Cookie Depositor (MCD)','Mini Cookie Wire Cut (MCWC)','Mini Cake Depositor (MCAD)'];
    const machineImages = models.map((model,i) => {
      const record = c.assets.catalogue[sourceNames[i]];
      return `<figure class="home-machine-frame ${i===0?'is-active':''}" data-hero-slide="${i}">${c.assetImage(record?.image,'hero-machine-image',{priority:i===0,loading:i===0?'eager':'lazy',sizes:'(max-width:800px) 95vw, 62vw'})}<figcaption><a class="hero-product-link" href="${c.productUrl(model)}">${esc(model)} <span aria-hidden="true">↗</span></a></figcaption></figure>`;
    }).join('');
    const why = c.homeText('why').slice(0,3);
    const whyImages = [c.sectionAsset('solutions','factory-line-planning'),c.sectionAsset('solutions','machinery-automation'),c.sectionAsset('services')];
    return `<div class="home-page reference-home">
      <section class="reference-hero home-hero" aria-labelledby="home-title"><div class="home-machinery-media" data-hero-cycle>${machineImages}<div class="hero-media-controls"><span class="hero-count" data-hero-count>01 / 03</span><button type="button" data-hero-pause aria-label="${esc(text(c,'Pause image sequence','暂停图片切换','Jeda urutan imej'))}">Ⅱ</button></div><span class="hero-media-label">LS SMART MACHINERY · MALAYSIA</span></div><div class="reference-hero-panel"><span class="eyebrow">${esc(c.t('heroEyebrow'))}</span><h1 class="display-title" id="home-title">${esc(c.content.heroTitleA)}<br>${esc(c.content.heroTitleB)}</h1><p class="lede">${esc(c.content.heroLead)}</p><div class="hero-actions">${c.buttonLink('#machines',c.t('exploreMachines'))}${c.arrowLink('#inquiry?intent=quote',c.t('askForQuote'))}</div></div></section>
      <section class="section-wrap section-pad home-current" id="current"><h2 class="section-title">${esc(c.t('latest'))}</h2>${c.introMediaSection()}</section>
      <section class="why-visual-section section-pad"><div class="section-wrap"><h2 class="section-title">${esc(text(c,'Why LS?','为什么选择 LS？','Mengapa LS?'))}</h2><div class="why-visual-grid">${why.map(([title,body],i)=>`<article class="why-visual-card fade-in">${c.assetImage(whyImages[i],'why-visual-image',{sizes:'(max-width:800px) 90vw, 30vw'})}<h3>${esc(title)}</h3><p>${esc(body)}</p></article>`).join('')}</div>${c.arrowLink('#solutions',c.t('allSolutions'))}</div></section>
      <section class="section-wrap section-pad" id="food"><h2 class="section-title compact-heading">${esc(text(c,'What would you like to produce?','您希望生产哪类食品？','Apakah yang ingin anda hasilkan?'))}</h2>${foodLinks(c)}<p class="small-note">${esc(c.pageText('foodNote'))}</p></section>
      <section class="section-wrap section-pad home-segments" id="segments"><h2 class="section-title">${esc(text(c,'Our customer segments','我们的客户群体','Segmen pelanggan kami'))}</h2>${segmentPicker(c)}<p class="small-note">${esc(c.homeText('segmentNote'))}</p></section>
      ${inquiryBand(c)}${c.inquirySection()}
    </div>`;
  }
  function process(c, context) {
    const stages = [
      [text(c,'Your product','您的产品','Produk anda'),text(c,'Describe what you make.','描述您生产的食品。','Terangkan produk anda.'),text(c,'Share the product, ingredients and sizes you want to produce. Photos or samples can help the discussion.','分享食品种类、原料及尺寸。图片或样品有助于沟通。','Kongsikan produk, ramuan dan saiz yang ingin dihasilkan. Foto atau sampel boleh membantu perbincangan.'),c.sectionAsset('foods',slug(context))],
      [text(c,'Your process','生产流程','Proses anda'),text(c,'Understand each step.','了解每个环节。','Fahami setiap langkah.'),text(c,'Identify the steps you carry out today and the tasks you want to automate or improve.','说明现有生产步骤，以及希望自动化或改善的工序。','Kenal pasti langkah semasa serta tugas yang ingin diautomasi atau ditambah baik.'),c.sectionAsset('solutions','machinery-automation')],
      [text(c,'Your space','厂房空间','Ruang anda'),text(c,'Plan the layout.','规划布局。','Rancang susun atur.'),text(c,'Discuss your available space, access and production flow with LS before selecting a configuration.','选择设备配置前，与 LS 讨论空间、出入通道及生产动线。','Bincangkan ruang, akses dan aliran pengeluaran dengan LS sebelum memilih konfigurasi.'),c.sectionAsset('solutions','factory-line-planning')],
      [text(c,'Your equipment','生产设备','Peralatan anda'),text(c,'Confirm the machine fit.','确认设备适用性。','Sahkan kesesuaian mesin.'),text(c,'Review model details, configuration and compatibility with LS. Catalogue categories provide a starting point.','与 LS 核实型号、配置及兼容性。设备分类可作为初步浏览的起点。','Semak model, konfigurasi dan keserasian dengan LS. Kategori katalog menjadi titik permulaan.'),c.sectionAsset('homepageHero')],
      [text(c,'Your support','服务支持','Sokongan anda'),text(c,'Prepare for the next stage.','准备迈向下一阶段。','Bersedia untuk peringkat seterusnya.'),text(c,'Discuss installation, training, technology transfer and continued after-sales support.','讨论安装、培训、技术转移及持续售后支持。','Bincangkan pemasangan, latihan, pemindahan teknologi dan sokongan selepas jualan.'),c.sectionAsset('services')]
    ];
    return `<section class="section-wrap section-pad" id="process"><h2 class="section-title">${esc(text(c,'Plan your food production','规划您的食品生产','Rancang pengeluaran makanan anda'))}</h2><p class="body-copy">${esc(text(c,'Explore the questions that shape your machinery and production plan.','了解设备选择与生产规划需要考虑的问题。','Terokai persoalan yang membentuk rancangan mesin dan pengeluaran anda.'))}</p><div class="process-accordion" data-process>${stages.map(([title,heading,body,image],i)=>`<article class="process-step ${i===0?'is-active':''}"><button type="button" class="process-trigger" data-process-index="${i}" aria-expanded="${i===0}" aria-controls="process-panel-${i}"><span>${esc(title)}</span><span class="circle-plus" aria-hidden="true">${String(i+1).padStart(2,'0')}</span></button><div class="process-content" id="process-panel-${i}" ${i===0?'':'hidden inert'}>${c.assetImage(image,'process-image',{sizes:'(max-width:800px) 90vw, 40vw'})}<h3>${esc(heading)}</h3><p>${esc(body)}</p></div></article>`).join('')}</div></section>`;
  }
  function faq(c, context='') {
    const questions = [
      [text(c,'How do I choose suitable equipment?','如何选择适合的设备？','Bagaimana memilih peralatan yang sesuai?'),text(c,'Start with your product, process, intended output and available space. LS can review those requirements with you before confirming machine suitability.','先考虑产品、流程、预期产量及空间。LS 可与您讨论需求，再确认设备适用性。','Mulakan dengan produk, proses, output sasaran dan ruang. LS boleh menyemak keperluan anda sebelum mengesahkan kesesuaian mesin.')],
      [text(c,'Are all catalogue photographs exact model images?','所有目录图片都对应具体型号吗？','Adakah semua foto katalog sepadan dengan model?'),text(c,'Confirmed matches use the actual product photograph. Other entries are explicitly labelled as category or food-application references until LS confirms the exact image.','已确认的项目使用实际设备照片。其他项目会明确标注为设备分类或食品应用参考图片，待 LS 确认。','Padanan yang disahkan menggunakan foto produk sebenar. Entri lain dilabel sebagai rujukan kategori atau aplikasi makanan sehingga imej tepat disahkan.')],
      [text(c,'What should I include in an inquiry?','咨询时应提供哪些资料？','Apakah maklumat untuk pertanyaan?'),text(c,'Include your product, current process, requirements and a reply contact. When you start from a machine page, its model is carried into the inquiry automatically.','请提供产品、现有流程、需求及联系方式。从设备页面发起咨询时，型号会自动加入咨询摘要。','Sertakan produk, proses semasa, keperluan dan cara dihubungi. Model dibawa secara automatik apabila pertanyaan bermula dari halaman mesin.')]
    ];
    return `<section class="section-wrap section-pad faq-section" id="faq"><div><span class="eyebrow">FAQ</span><h2 class="section-title">${esc(text(c,'Your questions, answered.','解答您的问题。','Jawapan untuk soalan anda.'))}</h2></div><div>${questions.map(([q,a])=>`<details class="faq-item"><summary>${esc(q)}<span class="circle-plus" aria-hidden="true"></span></summary><div><p>${esc(a)}</p></div></details>`).join('')}</div></section>`;
  }
  function food(c, food) {
    const mapping = {'cookies-biscuits':['Bakery','Production Line','Package'],'cakes':['Bakery','Production Line','Package'],'bread-buns':['Bakery','Production Line'],'pastries-crusted-foods':['Bakery','Production Line'],'kueh-asian-foods':['Kitchen','Bakery'],'dim-sum':['Kitchen','Bakery','Package']};
    const categories=(mapping[slug(food.name)]||['Bakery']).map(name=>c.categories.find(category=>category.name===name));
    const title=c.localName(food.name);
    const lead=text(c,'Explore equipment and planning around the food you make. Confirm the right configuration with LS for your ingredients, process and production goals.','围绕您的食品探索设备与生产规划。根据原料、流程及生产目标，与 LS 确认合适的配置。','Terokai mesin dan perancangan mengikut makanan anda. Sahkan konfigurasi dengan LS berdasarkan ramuan, proses dan matlamat pengeluaran.');
    return `${photoHero(c,title,lead,c.sectionAsset('foods',slug(food.name)),c.t('navFood'))}${process(c,food.name)}<section class="section-wrap section-pad" id="equipment"><h2 class="section-title">${esc(text(c,'Explore equipment for your next step','探索下一步所需的设备','Terokai peralatan untuk langkah seterusnya'))}</h2><div class="tiles-grid category-index-grid">${categories.map(category=>{const items=category.items||(category.subcategories||[]).flatMap(sub=>sub.items);return `<a class="info-tile category-index-card fade-in" href="#machines/${slug(category.name)}">${c.catalogueImage(items[0].name,category.name)}<h3>${esc(c.localName(category.name))}</h3><p>${esc(text(c,'Explore the category and discuss suitability with LS.','浏览设备分类，并与 LS 讨论适用性。','Terokai kategori dan bincangkan kesesuaian dengan LS.'))}</p></a>`}).join('')}</div><p class="small-note">${esc(text(c,'Category links are browsing starting points. Compatibility requires confirmation by LS.','设备分类仅供初步浏览；兼容性须由 LS 确认。','Pautan kategori ialah titik permulaan. Keserasian perlu disahkan oleh LS.'))}</p></section>${inquiryBand(c,food.name)}${faq(c,food.name)}${c.inquirySection(food.name)}`;
  }
  function enhance(c) {
    const {main,route}=c;
    document.body.dataset.pageFamily=route.split('/')[0];
    if(route.startsWith('machine/')) {
      main.querySelector('.machine-page-hero')?.classList.add('reference-product-hero');
      const tabs=main.querySelector('.machine-tabs');
      if(tabs) tabs.hidden=true;
    } else if(!route.startsWith('food/')&&route!=='home'&&!route.startsWith('inquiry')) {
      const hero=main.querySelector('.content-page-hero,.segment-hero,.category-hero');
      if(hero) {
        const title=hero.querySelector('h1');
        let image=route.startsWith('company')?c.sectionAsset('building'):route.startsWith('service')?c.sectionAsset('services'):route.startsWith('segment')?c.sectionAsset('segments',route.split('/')[1]):route.startsWith('solution')?(c.sectionAsset('solutions',route.split('/')[1]||'machinery-automation')||c.sectionAsset('solutions','machinery-automation')):c.sectionAsset('solutions','machinery-automation');
        if (route === 'food') image = c.sectionAsset('foods','cookies-biscuits');
        if (route.startsWith('machines/')) {
          const category = c.categories.find(category => slug(category.name) === route.split('/')[1]);
          const first = category?.items?.[0] || category?.subcategories?.[0]?.items?.[0];
          image = c.assets.catalogue[first?.name]?.image || image;
        }
        if(title&&image) {
          const lead=hero.querySelector('.lede');
          const reference=route.startsWith('machine')||route.startsWith('solution')||route.startsWith('segment');
          const banner=document.createElement('div');
          const area = route.split('/')[0];
          const eyebrow = area === 'machines' ? c.t('navMachines') : area === 'food' ? c.t('navFood') : area.startsWith('solution') ? c.t('navSolutions') : area.startsWith('service') ? c.t('navServices') : c.t('navCompany');
          banner.innerHTML=photoHero(c,title.textContent.replace(/\.$/,''),lead?.textContent||'',image,eyebrow,reference);
          hero.before(banner.firstElementChild);
          title.remove();lead?.remove();
          const supporting = hero.querySelector('.content-info-card');
          if (supporting) {
            supporting.querySelector('.route-photo')?.remove();
            const context = document.createElement('section');
            context.className = 'section-wrap reference-context';
            context.append(supporting);
            hero.before(context);
          }
          const heading=hero.querySelector('.category-heading');
          if(heading) heading.remove();
          if(!hero.querySelector('.catalogue-list,.tiles-grid,.food-grid')) hero.remove();
          else hero.classList.add('reference-listing');
        }
      }
    }
    if(route.startsWith('machines/')&&!main.querySelector('#faq')) main.querySelector('.inquiry-section')?.insertAdjacentHTML('beforebegin',faq(c));
    if((route.startsWith('solution')||route.startsWith('segment'))&&!main.querySelector('.production-invitation'))main.querySelector('.inquiry-section')?.insertAdjacentHTML('beforebegin',inquiryBand(c,main.querySelector('h1')?.textContent||''));
    main.querySelectorAll('.section-title,.content-columns,.info-tile,.catalogue-item,.reference-hero-panel').forEach(el=>el.classList.add('fade-in'));
  }
  function editorial(c, title, body, image, reverse=false, id='') {
    return `<section class="section-wrap section-pad editorial-section ${reverse?'is-reversed':''}" ${id?`id="${id}"`:''}><figure>${c.assetImage(image,'editorial-image',{sizes:'(max-width:800px) 90vw, 45vw'})}</figure><div><h2 class="section-title">${esc(title)}</h2><p class="body-copy">${esc(body)}</p></div></section>`;
  }
  function segment(c, segment) {
    const i=c.segments.findIndex(item=>item.name===segment.name);
    const title=c.localName(segment.name);
    const lead=c.pageText(`segment0${i+1}`);
    const challenges=text(c,'Start with the questions that matter','从关键问题出发','Mulakan dengan persoalan penting');
    const challengeBody=text(c,'What do you want to produce? Which steps need attention? Share your product, process, space and intended output so LS can understand your requirements.','您希望生产什么？哪些工序需要改善？请分享产品、流程、空间及预期产量，以便 LS 了解需求。','Apakah yang ingin dihasilkan? Langkah mana memerlukan perhatian? Kongsikan produk, proses, ruang dan output sasaran supaya LS memahami keperluan anda.');
    return `${photoHero(c,title,lead,c.sectionAsset('segments',slug(segment.name)),text(c,'CUSTOMER SEGMENTS','客户群体','SEGMEN PELANGGAN'))}${editorial(c,challenges,challengeBody,c.sectionAsset('building'),false,'requirements')}${editorial(c,text(c,'Connect planning, machinery and support','连接规划、设备与支持','Hubungkan perancangan, mesin dan sokongan'),c.content.homeIntro,c.sectionAsset('solutions','machinery-automation'),true,'solutions')}${inquiryBand(c,segment.name)}<section class="section-wrap section-pad" id="food"><h2 class="section-title">${esc(text(c,'What is your product?','您的产品是什么？','Apakah produk anda?'))}</h2>${foodLinks(c)}<p class="small-note">${esc(c.homeText('segmentNote'))}</p></section>${c.inquirySection(segment.name)}`;
  }
  function solutions(c, name='') {
    const capabilities=['Factory & Line Planning','Machinery & Automation','Facility Fit-Out','Financing Support'];
    const selected=capabilities.find(item=>slug(item)===name);
    const title=selected?c.localName(selected):c.t('navSolutions');
    const copy={
      'Factory & Line Planning':text(c,'Factory layout and production-line design begin with your product, process and available space.','工厂布局与生产线设计，从产品、流程及可用空间出发。','Susun atur kilang dan reka bentuk barisan bermula dengan produk, proses dan ruang tersedia.'),
      'Machinery & Automation':text(c,'Explore machinery supply, customized production solutions, modification and technology transfer with LS.','与 LS 探索设备供应、定制生产方案、改装及技术转移。','Terokai bekalan mesin, penyelesaian pengeluaran tersuai, pengubahsuaian dan pemindahan teknologi bersama LS.'),
      'Facility Fit-Out':text(c,'Discuss epoxy services and clean-room paneling in the context of your facility requirements.','根据厂房需求，讨论环氧地坪服务与洁净室板材工程。','Bincangkan perkhidmatan epoksi dan panel bilik bersih mengikut keperluan kemudahan anda.'),
      'Financing Support':text(c,'Ask LS about financial assistance. Eligibility, terms and availability require confirmation.','向 LS 咨询财务协助；资格、条款及可用性须确认。','Tanya LS tentang bantuan kewangan. Kelayakan, syarat dan ketersediaan perlu disahkan.')
    };
    const image=c.sectionAsset('solutions',name||'factory-line-planning')||c.sectionAsset('building');
    const lead=selected?copy[selected]:c.content.solutionIntro;
    return `${photoHero(c,title,lead,image,c.t('navSolutions'))}${editorial(c,text(c,'Begin with your production requirements','从生产需求开始','Mulakan dengan keperluan pengeluaran'),text(c,'Bring your product, current process and planned changes into the conversation. LS can help you review layout, equipment and support together.','分享您的产品、现有流程与计划中的调整。LS 可协助您一起讨论布局、设备及支持。','Kongsikan produk, proses semasa dan perubahan yang dirancang. LS boleh membantu menyemak susun atur, mesin dan sokongan bersama.'),c.sectionAsset('building'),false,'requirements')}<section class="section-wrap section-pad" id="capabilities"><h2 class="section-title">${esc(c.t('capabilities'))}</h2><div class="tiles-grid">${capabilities.map(item=>`<a class="info-tile capability-card fade-in" href="#solution/${slug(item)}">${c.assetImage(c.sectionAsset('solutions',slug(item)),'capability-image',{sizes:'(max-width:800px) 90vw, 45vw'})}<h3>${esc(c.localName(item))}<span aria-hidden="true"> ↗</span></h3><p>${esc(copy[item])}</p></a>`).join('')}</div><p class="small-note">${esc(text(c,'Capability images are visual references; project details are confirmed directly with LS.','能力图片仅作视觉参考；项目详情请直接与 LS 确认。','Imej keupayaan ialah rujukan visual; butiran projek disahkan terus dengan LS.'))}</p><div class="coming-soon"><span>${esc(c.t('aiComing'))}</span><p>${esc(text(c,'AI technology implementation','AI 技术实施','Pelaksanaan teknologi AI'))}</p></div></section>${inquiryBand(c,selected||'Solutions')}<section class="section-wrap section-pad" id="food"><h2 class="section-title">${esc(text(c,'What is your product?','您的产品是什么？','Apakah produk anda?'))}</h2>${foodLinks(c)}</section>${c.inquirySection(selected||'Solutions')}`;
  }
  window.LSDesign={home,food,segment,solutions,enhance};
})();
