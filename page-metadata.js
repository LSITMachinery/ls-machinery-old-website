(() => {
  'use strict';
  const origin='https://lsmachinery.com.my';
  const brand={en:'LS Smart Machinery Malaysia',zh:'LS Smart Machinery 马来西亚',ms:'LS Smart Machinery Malaysia'};
  const homeTitle={
    en:'Food production machinery and production planning',
    zh:'食品生产设备与生产线规划',
    ms:'Mesin makanan dan perancangan barisan pengeluaran'
  };
  const fallbackDescription={
    en:'Explore LS food-production machinery, production planning, installation and support in Malaysia.',
    zh:'了解 LS 在马来西亚提供的食品生产设备、生产线规划、安装与服务支持。',
    ms:'Terokai mesin pengeluaran makanan, perancangan barisan, pemasangan dan sokongan LS di Malaysia.'
  };
  function update(route, cmsMeta={}){
    const language=window.LSRouter.language();
    const h1=document.querySelector('#main h1');
    const heading=(h1?.textContent||'Page not found').replace(/\s+/g,' ').trim();
    const subtitle=document.querySelector('#main .machine-subtitle')?.textContent.trim();
    const headingTitle=route==='home'?homeTitle[language]:[heading,subtitle].filter(Boolean).join(' · ');
    const videoTitle={en:'LS Machinery Videos',zh:'LS 设备视频',ms:'Video Mesin LS'}[language];
    const title=`${cmsMeta.title||(route==='videos'?videoTitle:headingTitle)} | ${brand[language]}`;
    const lead=(document.querySelector('#main .machine-hero-copy .lede,#main .reference-hero-panel .lede,#main .pp-hero-copy p,#main .pp-solutions-intro p,#main .pp-insights-intro p,#main .lede,#main p')?.textContent||'').replace(/\s+/g,' ').trim();
    const description=String(cmsMeta.description||(language==='en'&&lead?`${heading} — ${lead}`:language!=='en'&&lead?lead:fallbackDescription[language])).replace(/\s+/g,' ').trim().slice(0,280);
    const canonical=origin+window.LSRouter.url(route,language).split('?')[0];
    const productImage=document.querySelector('#main .industrial-product .machine-photo');
    const image=route.startsWith('machine/')?productImage:document.querySelector('#main .home-machine-static img,#main .reference-hero-image,#main img');
    const imagePath=image?.getAttribute('src');
    const imageUrl=imagePath?origin+'/'+imagePath.replace(/^\//,''):origin+'/assets/images/responsive/img-cd7cb0e90ca8-w480.webp';
    document.title=title;
    const meta=(name,content,property=false)=>{let el=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.append(el);}el.content=content;};
    meta('description',description);meta('og:title',title,true);meta('og:description',description,true);meta('og:url',canonical,true);meta('og:image',imageUrl,true);meta('og:site_name','LS Smart Machinery',true);meta('og:type',route.startsWith('machine/')?'product':'website',true);meta('twitter:card','summary_large_image');
    let link=document.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link);}link.href=canonical;
    document.head.querySelectorAll('link[data-language-alternate]').forEach(item=>item.remove());
    for(const [code,tag] of [['en','en'],['zh','zh-Hans'],['ms','ms-MY'],['en','x-default']]){
      const alternate=document.createElement('link');alternate.rel='alternate';alternate.hreflang=tag;alternate.href=origin+window.LSRouter.url(route,code);alternate.dataset.languageAlternate='true';document.head.append(alternate);
    }
    let structured=document.querySelector('#ls-structured-data');if(!structured){structured=document.createElement('script');structured.type='application/ld+json';structured.id='ls-structured-data';document.head.append(structured);}
    const entity=route.startsWith('machine/')?{'@type':'Product',name:[heading,subtitle].filter(Boolean).join(' · '),description,...(productImage?{image:imageUrl}:{}),url:canonical}:{'@type':'Organization',name:'LS Smart Machinery (M) SDN BHD',url:origin,logo:origin+'/assets/images/responsive/img-cd7cb0e90ca8-w480.webp'};
    structured.textContent=JSON.stringify({'@context':'https://schema.org',...entity});
    document.documentElement.dataset.metadataRoute=route;
  }
  window.LSPageMetadata={update};
})();
