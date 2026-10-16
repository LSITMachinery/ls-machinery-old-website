/* Public path routing, with compatibility for previously shared fragment links. */
(() => {
  'use strict';
  const roots=new Set(['home','machines','machine','food','segment','solutions','solution','services','service','company','insights','inquiry','privacy','search']);
  const legacy=new URLSearchParams(location.search).get('legacy')==='1';
  if(legacy&&document.querySelector('base'))document.querySelector('base').href=location.pathname+location.search;
  let renderPage=()=>{};
  const route=()=>legacy?location.hash.slice(1)||'home':location.pathname.replace(/^\/+|\/+$/g,'')+(location.search||'')||'home';
  const url=value=>{
    if(legacy)return '#'+value;
    const [path,query]=String(value).replace(/^#/,'').split('?');
    return (path==='home'?'/':'/'+path.replace(/^\/+|\/+$/g,'')+'/')+(query?'?'+query:'');
  };
  const isRoute=value=>roots.has(String(value).replace(/^#/,'').split(/[/?]/)[0]);
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
    if(dest.origin!==location.origin||dest.hash||!isRoute(dest.pathname.slice(1))&&dest.pathname!=='/')return;
    event.preventDefault();navigate(dest.pathname.replace(/^\/+|\/+$/g,'')+(dest.search||'')||'home');
  });
  window.addEventListener('popstate',()=>{if(!legacy){window.dispatchEvent(new Event('ls:navigate'));renderPage();}});
  window.addEventListener('hashchange',()=>{
    if(legacy){renderPage();return;}
    if(isRoute(location.hash))navigate(location.hash,true);
  });
  if(!legacy&&isRoute(location.hash))history.replaceState(null,'',url(location.hash));
  new MutationObserver(()=>convertLinks()).observe(document.documentElement,{childList:true,subtree:true});
  window.LSRouter={route,url,navigate,convertLinks,legacy,start(callback){renderPage=callback;convertLinks();}};
})();
