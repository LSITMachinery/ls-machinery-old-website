(() => {
  'use strict';
  const node = document.getElementById('cms-preview-data');
  if (!node) return;
  let preview;
  try { preview = JSON.parse(node.textContent || '{}'); } catch { return; }

  function applyPreview() {
    const main = document.querySelector('#main');
    const locale = preview.locale || 'en';
    const translation = preview.fields?.translations?.[locale] || preview.fields?.translations?.en;
    if (!main || !translation) return;
    if (window.LSCmsContent?.apply) {
      const meta = window.LSCmsContent.apply(main, { fields: preview.fields }, locale);
      if (meta) window.LSPageMetadata?.update?.(main.dataset.route || '', meta);
      return;
    }
    const heading = translation.h1 || translation.heading || translation.title;
    if (heading && main.querySelector('h1') && main.querySelector('h1').textContent !== heading) main.querySelector('h1').textContent = heading;
    if (translation.subtitle && main.querySelector('.machine-subtitle') && main.querySelector('.machine-subtitle').textContent !== translation.subtitle) main.querySelector('.machine-subtitle').textContent = translation.subtitle;
    if (translation.intro) {
      const intro = main.querySelector('.machine-hero-copy .lede,.reference-hero-panel .lede,.pp-hero-copy p,.pp-solutions-intro p,.pp-insights-intro p,.lede');
      if (intro && intro.textContent !== translation.intro) intro.textContent = translation.intro;
    }
    if (translation.metaTitle) document.title = translation.metaTitle;
  }

  applyPreview();
  const main = document.querySelector('#main');
  if (main) {
    const observer = new MutationObserver(() => {
      observer.disconnect();
      setTimeout(applyPreview, 0);
    });
    observer.observe(main, { childList: true, subtree: true, characterData: true });
  }
})();
