/* Public path routing, with compatibility for previously shared fragment links. */
(() => {
  'use strict';
  const roots=new Set(['home','machines','machine','food','segment','solutions','solution','services','service','company','insights','inquiry','privacy','search','videos']);
  const languages=new Set(['en','zh','ms']);
  const legacy=new URLSearchParams(location.search).get('legacy')==='1';
  if(legacy&&document.querySelector('base'))document.querySelector('base').href=location.pathname+location.search;
  let renderPage=()=>{};
  function pathState(pathname=location.pathname){
    const parts=pathname.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);
    const language=languages.has(parts[0])?parts.shift():'en';
    return {language,route:parts.join('/')||'home'};
  }
  let activeLanguage=pathState().language;
  const route=()=>legacy?location.hash.slice(1)||'home':(activeLanguage=pathState().language,pathState().route+(location.search||''));
  const url=(value,language=activeLanguage)=>{
    if(legacy)return '#'+value;
    const [path,query]=String(value).replace(/^#/,'').split('?');
    const parts=path.replace(/^\/+|\/+$/g,'').split('/').filter(Boolean);
    if(languages.has(parts[0]))parts.shift();
    const clean=parts.join('/');
    const prefix=language==='en'?'':'/'+language;
    return prefix+(clean?'/'+clean+'/':'/')+(query?'?'+query:'');
  };
  const isRoute=value=>roots.has(String(value).replace(/^#/,'').split(/[/?]/)[0]);
  const isPublicPath=pathname=>{
    const parsed=pathState(pathname);
    return parsed.route==='home'||roots.has(parsed.route.split('/')[0]);
  };
  function convertLinks(root=document){
    if(legacy)return;
    root.querySelectorAll('a[href^="#"]').forEach(a=>{
      const href=a.getAttribute('href');
      if(!a.matches('[data-scroll-to],.section-index-link')&&isRoute(href))a.setAttribute('href',url(href));
    });
  }
  function navigate(value,replace=false){
    if(legacy){location.hash=value.replace(/^#/,'');return;}
    if(String(value).replace(/^\//,'').startsWith('inquiry')){
      const target=new URL(url(value),location.origin);if(!target.searchParams.has('from'))target.searchParams.set('from',route().split('?')[0]);value=target.pathname.replace(/^\/+|\/+$/g,'')+target.search;
    }
    history[replace?'replaceState':'pushState'](null,'',url(value));
    window.dispatchEvent(new Event('ls:navigate'));
    renderPage();
  }
  document.addEventListener('click',event=>{
    if(legacy||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const a=event.target.closest('a[href]');
    if(!a||a.target||a.hasAttribute('download')||a.matches('.portal-button,[data-scroll-to],.section-index-link'))return;
    const dest=new URL(a.href,location.href);
    if(dest.origin!==location.origin||dest.hash||!isPublicPath(dest.pathname))return;
    const parsed=pathState(dest.pathname);
    event.preventDefault();activeLanguage=parsed.language;navigate(parsed.route+(dest.search||''));
  });
  window.addEventListener('popstate',()=>{if(!legacy){window.dispatchEvent(new Event('ls:navigate'));renderPage();}});
  window.addEventListener('hashchange',()=>{
    if(legacy){renderPage();return;}
    if(isRoute(location.hash))navigate(location.hash,true);
  });
  if(!legacy&&isRoute(location.hash))history.replaceState(null,'',url(location.hash));
  new MutationObserver(()=>convertLinks()).observe(document.documentElement,{childList:true,subtree:true});
  function setLanguage(language){
    if(!languages.has(language)||legacy)return;
    const currentRoute=pathState().route+(location.search||'');
    activeLanguage=language;
    history.pushState(null,'',url(currentRoute,language));
    window.dispatchEvent(new Event('ls:navigate'));
    renderPage();
  }
  window.LSRouter={route,url,navigate,convertLinks,legacy,language:()=>activeLanguage,setLanguage,start(callback){renderPage=callback;convertLinks();}};
})();
