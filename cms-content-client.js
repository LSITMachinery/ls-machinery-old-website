(() => {
  'use strict';
  const routePath = route => route === 'home' ? '/' : `/${String(route || '').replace(/^\/+|\/+$/g, '')}/`;

  async function page(route, locale) {
    if (document.getElementById('cms-preview-data')) return null;
    return fetch(`/api/content/published?route=${encodeURIComponent(routePath(route))}`, { credentials: 'same-origin', cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(result => result?.content || null)
      .catch(() => null);
  }

  async function search(locale) {
    return fetch(`/api/content/published/search?locale=${encodeURIComponent(locale)}`, { credentials: 'same-origin', cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(result => Array.isArray(result?.searchIndex) ? result.searchIndex : [])
      .catch(() => []);
  }

  function apply(main, record, locale) {
    const translation = record?.fields?.translations?.[locale];
    if (!translation || !main) return null;
    const heading = translation.h1 || translation.heading || translation.title;
    if (heading) {
      const h1 = main.querySelector('h1');
      if (h1 && h1.textContent !== heading) h1.textContent = heading;
    }
    if (translation.subtitle) {
      const subtitle = main.querySelector('.machine-subtitle');
      if (subtitle && subtitle.textContent !== translation.subtitle) subtitle.textContent = translation.subtitle;
    }
    const intro = translation.intro;
    if (intro) {
      const target = main.querySelector('.machine-hero-copy .lede,.reference-hero-panel .lede,.pp-hero-copy p,.pp-solutions-intro p,.pp-insights-intro p,.lede');
      if (target && target.textContent !== intro) target.textContent = intro;
    }
    if (Array.isArray(translation.sections)) {
      for (const section of translation.sections) {
        if (!section || typeof section.id !== 'string') continue;
        const target = main.querySelector(`#${CSS.escape(section.id)}`);
        if (!target) continue;
        if (typeof section.heading === 'string') {
          const headingNode = target.querySelector('h2,h3');
          if (headingNode) headingNode.textContent = section.heading;
        }
        if (typeof section.body === 'string') {
          const bodyNode = target.querySelector('.lede,.body-copy,p');
          if (bodyNode) bodyNode.textContent = section.body;
        }
      }
    }
    return {
      title: translation.metaTitle || translation.pageTitle || heading || '',
      description: translation.metaDescription || translation.seoDescription || translation.summary || ''
    };
  }

  window.LSCmsContent = Object.freeze({ page, search, apply, routePath });
})();
