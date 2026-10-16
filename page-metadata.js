(() => {
  'use strict';
  const origin='https://lsmachinery.com.my';
  const homeMetadata={
    description:'Food production.Engineered around you. — Machinery, production-line planning and after-sales support for food producers in Malaysia.',
    image:origin+'/assets/images/responsive/ls-production-floor-w800.webp'
  };
  function update(route){
    const h1=document.querySelector('#main h1');
    const heading=(h1?.textContent||'Page not found').replace(/\s+/g,' ').trim();
    const subtitle=document.querySelector('#main .machine-subtitle')?.textContent.trim();
    const title=(route==='home'?'Food production machinery & production planning':heading+(subtitle?' · '+subtitle:''))+' | LS Smart Machinery Malaysia';
    const lead=(document.querySelector('#main .lede,#main .pp-hero-copy p,#main .pp-solutions-intro p,#main .pp-insights-intro p,#main p')?.textContent||'Explore LS Smart Machinery equipment, production planning and support in Malaysia.').replace(/\s+/g,' ').trim();
    const description=route==='home'?homeMetadata.description:(lead.includes(heading)?lead:heading+' — '+lead).slice(0,280);
    const canonical=origin+window.LSRouter.url(route).split('?')[0].replace(/^#home$/,'/').replace(/^#/,'/');
    const productImage=document.querySelector('#main .industrial-product .machine-photo');
    const image=route.startsWith('machine/')?productImage:document.querySelector('#main .home-machine-static img,#main .reference-hero-image,#main img');
    const imagePath=image?.getAttribute('src');
    const imageUrl=route==='home'?homeMetadata.image:(imagePath?origin+'/'+imagePath.replace(/^\//,''):origin+'/assets/images/responsive/img-cd7cb0e90ca8-w480.webp');
    document.title=title;
    const meta=(name,content,property=false)=>{let el=document.head.querySelector(`meta[${property?'property':'name'}="${name}"]`);if(!el){el=document.createElement('meta');el.setAttribute(property?'property':'name',name);document.head.append(el);}el.content=content;};
    meta('description',description);meta('og:title',title,true);meta('og:description',description,true);meta('og:url',canonical,true);meta('og:image',imageUrl,true);meta('og:site_name','LS Smart Machinery',true);meta('og:type',route.startsWith('machine/')?'product':'website',true);meta('twitter:card','summary_large_image');
    let link=document.querySelector('link[rel="canonical"]');if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link);}link.href=canonical;
    let structured=document.querySelector('#ls-structured-data');if(!structured){structured=document.createElement('script');structured.type='application/ld+json';structured.id='ls-structured-data';document.head.append(structured);}
    const entity=route.startsWith('machine/')?{'@type':'Product',name:heading,description,...(productImage?{image:imageUrl}:{}),url:canonical}:{'@type':'Organization',name:'LS Smart Machinery (M) SDN BHD',url:origin,logo:origin+'/assets/images/responsive/img-cd7cb0e90ca8-w480.webp'};
    structured.textContent=JSON.stringify({'@context':'https://schema.org',...entity});
    document.documentElement.dataset.metadataRoute=route;
  }
  window.LSPageMetadata={update};
})();
