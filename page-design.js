(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const slug = value => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const text = (c, en, zh, ms) => c.language === 'zh' ? zh : c.language === 'ms' ? ms : en;
  const homeIntroVideoId = '4RA9dekfBEc';
  let youtubeApiPromise = null;
  let cleanupHomeVideo = () => {};

  function loadYouTubeApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (!youtubeApiPromise) {
      youtubeApiPromise = new Promise((resolve, reject) => {
        let settled = false;
        let timeout = 0;
        let script = document.querySelector('script[data-ls-youtube-api]');
        const previousReady = window.onYouTubeIframeAPIReady;
        const restoreReady = () => {
          if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previousReady;
        };
        const fail = () => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          restoreReady();
          script?.remove();
          reject(new Error('YouTube player could not be loaded'));
        };
        const ready = () => {
          if (typeof previousReady === 'function') {
            try { previousReady(); } catch {}
          }
          if (settled) return;
          if (!window.YT?.Player) { fail(); return; }
          settled = true;
          window.clearTimeout(timeout);
          restoreReady();
          resolve(window.YT);
        };
        window.onYouTubeIframeAPIReady = ready;
        timeout = window.setTimeout(fail, 12000);
        if (!script) {
          script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          script.dataset.lsYoutubeApi = '';
          script.addEventListener('error', fail, { once: true });
          document.head.append(script);
        } else {
          script.addEventListener('error', fail, { once: true });
        }
      }).catch(error => {
        youtubeApiPromise = null;
        throw error;
      });
    }
    return youtubeApiPromise;
  }

  function mountHomeVideo(main, c) {
    const root = main.querySelector('[data-home-intro-video]');
    const host = root?.querySelector('[data-home-video-player]');
    const toggle = root?.querySelector('[data-home-video-toggle]');
    const toggleIcon = toggle?.querySelector('[data-video-icon]');
    const playButton = root?.querySelector('[data-home-video-play]');
    if (!root || !host || !toggle || !playButton) return () => {};

    const labels = {
      play: text(c, 'Play intro video', '播放介绍视频', 'Mainkan video pengenalan'),
      resume: text(c, 'Resume intro video', '继续播放介绍视频', 'Sambung video pengenalan'),
      pause: text(c, 'Pause intro video', '暂停介绍视频', 'Jeda video pengenalan'),
      region: text(c, 'LS Smart Machinery introduction video', 'LS Smart Machinery 介绍视频', 'Video pengenalan LS Smart Machinery')
    };
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('motion-opted-in');
    const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let player = null;
    let ready = false;
    let disposed = false;
    let request = null;
    let autoplayWanted = !reducedMotion;
    let explicitPlay = false;
    let userPaused = false;
    let resumeAfterGlobalPause = false;
    let fallbackTimer = 0;
    let observer = null;
    let playerResizeObserver = null;

    root.setAttribute('aria-label', labels.region);
    root.dataset.videoState = reducedMotion ? 'poster' : 'loading';
    const motionIsPaused = () => document.body.classList.contains('motion-paused') || (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('motion-opted-in'));
    const setState = state => {
      if (disposed) return;
      root.dataset.videoState = state;
      const playing = state === 'playing';
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-label', playing ? labels.pause : labels.resume);
      toggleIcon.textContent = playing ? 'Ⅱ' : '▶';
      playButton.setAttribute('aria-label', playing ? labels.pause : (state === 'paused' ? labels.resume : labels.play));
      playButton.querySelector('[data-play-label]').textContent = state === 'paused' ? labels.resume : labels.play;
    };
    const fitPlayer = () => {
      if (!ready || !player) return;
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const width = Math.ceil(Math.max(rect.width, rect.height * 16 / 9));
      const height = Math.ceil(Math.max(rect.height, rect.width * 9 / 16));
      try {
        player.setSize(width, height);
        Object.assign(player.getIframe().style, { position: 'absolute', top: '50%', left: '50%', maxWidth: 'none', transform: 'translate(-50%, -50%)', pointerEvents: 'none' });
      } catch {}
    };
    const play = fromUser => {
      if (disposed) return;
      if (fromUser) {
        autoplayWanted = true;
        explicitPlay = true;
        userPaused = false;
        resumeAfterGlobalPause = false;
      }
      if (ready && player) {
        try {
          player.mute();
          if (root.dataset.videoState === 'failed') player.loadVideoById({ videoId: homeIntroVideoId, startSeconds: 0 });
          else player.playVideo();
          setState('loading');
        } catch { setState('failed'); }
        return;
      }
      if (request) return;
      setState('loading');
      request = loadYouTubeApi().then(YT => {
        request = null;
        if (disposed || !host.isConnected) return;
        player = new YT.Player(host, {
          width: '100%',
          height: '100%',
          videoId: homeIntroVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            loop: 1,
            origin: location.origin,
            playlist: homeIntroVideoId,
            playsinline: 1,
            rel: 0
          },
          events: {
            onReady(event) {
              if (disposed) { try { event.target.destroy(); } catch {} return; }
              player = event.target;
              ready = true;
              player.mute();
              fitPlayer();
              if (typeof ResizeObserver === 'function') {
                playerResizeObserver = new ResizeObserver(fitPlayer);
                playerResizeObserver.observe(root);
              } else window.addEventListener('resize', fitPlayer);
              if ((explicitPlay || autoplayWanted) && !userPaused) {
                if (motionIsPaused() && !explicitPlay) resumeAfterGlobalPause = true;
                else player.playVideo();
              } else setState('poster');
            },
            onStateChange(event) {
              if (disposed || !window.YT?.PlayerState) return;
              if (event.data === window.YT.PlayerState.PLAYING) {
                window.clearTimeout(fallbackTimer);
                setState('playing');
              } else if (event.data === window.YT.PlayerState.ENDED) {
                player.seekTo(0, true);
                player.playVideo();
              } else if (event.data === window.YT.PlayerState.PAUSED && root.dataset.videoState === 'playing') setState('paused');
            },
            onAutoplayBlocked() { if (!disposed) setState('blocked'); },
            onError() { if (!disposed) setState('failed'); }
          }
        });
        fallbackTimer = window.setTimeout(() => {
          if (!disposed && root.dataset.videoState === 'loading') setState('blocked');
        }, 11000);
      }).catch(() => {
        request = null;
        if (!disposed) setState('failed');
      });
    };
    const pauseByUser = () => {
      userPaused = true;
      autoplayWanted = false;
      resumeAfterGlobalPause = false;
      try { player?.pauseVideo(); } catch {}
      setState('paused');
    };
    const togglePlayback = () => root.dataset.videoState === 'playing' ? pauseByUser() : play(true);
    const handleMotionChange = () => {
      if (motionIsPaused()) {
        if (root.dataset.videoState === 'playing') {
          resumeAfterGlobalPause = true;
          try { player?.pauseVideo(); } catch {}
          setState('paused');
        } else if (autoplayWanted && !userPaused) resumeAfterGlobalPause = true;
      } else if (resumeAfterGlobalPause && !userPaused) {
        resumeAfterGlobalPause = false;
        play(false);
      }
    };
    const onToggle = () => togglePlayback();
    toggle.addEventListener('click', onToggle);
    playButton.addEventListener('click', onToggle);
    window.addEventListener('ls:motion-change', handleMotionChange);
    reducedMotionQuery?.addEventListener?.('change', handleMotionChange);
    if (!reducedMotion) play(false);

    if (typeof MutationObserver === 'function') {
      observer = new MutationObserver(() => {
        if (!root.isConnected) cleanup();
      });
      observer.observe(main, { childList: true, subtree: true });
    }
    function cleanup() {
      if (disposed) return;
      disposed = true;
      observer?.disconnect();
      playerResizeObserver?.disconnect();
      window.removeEventListener('resize', fitPlayer);
      window.clearTimeout(fallbackTimer);
      window.removeEventListener('ls:motion-change', handleMotionChange);
      reducedMotionQuery?.removeEventListener?.('change', handleMotionChange);
      toggle.removeEventListener('click', onToggle);
      playButton.removeEventListener('click', onToggle);
      try { player?.destroy(); } catch {}
      player = null;
      ready = false;
    }
    return cleanup;
  }
  const foodLinks = c => `<div class="food-shortcuts">${c.foods.slice(0,6).map(food => `<a class="food-shortcut fade-in" href="#food/${slug(food.name)}">${c.assetImage(c.sectionAsset('foods',slug(food.name)), 'food-shortcut-image', {alt:'',sizes:'84px'})}<span class="food-name">${esc(c.localName(food.name))}</span><span aria-hidden="true">↗</span></a>`).join('')}</div>`;
  function segmentPicker(c) {
    return `<div class="segment-picker" data-segment-picker><figure class="segment-picker-visual">${c.segments.slice(0,3).map((segment,i) => c.assetImage(c.sectionAsset('segments',slug(segment.name)), `segment-picker-image ${i===0?'is-active':''}`, {sizes:'(max-width:800px) 90vw, 45vw'}).replace('<img ',`<img data-segment-image="${i}" `)).join('')}</figure><div class="segment-picker-items">${c.segments.slice(0,3).map((segment,i) => `<article class="segment-picker-item ${i===0?'is-active':''}"><h3><button type="button" data-segment-index="${i}" aria-expanded="${i===0}" aria-controls="segment-panel-${i}"><span class="circle-plus" aria-hidden="true">${i===0?'−':'+'}</span>${esc(c.localName(segment.name))}</button></h3><div class="segment-picker-panel" id="segment-panel-${i}" data-segment-panel="${i}" ${i===0?'':'hidden inert'}><p>${esc(c.pageText(`segment0${i+1}`))}</p>${c.buttonLink(`#segment/${slug(segment.name)}`,text(c,'Discover this segment','探索此企业类别','Terokai segmen ini'))}</div></article>`).join('')}</div></div>`;
  }
  function photoHero(c, title, lead, image, eyebrow, reference=false) {
    return `<section class="reference-hero"><figure class="reference-hero-media ${reference?'is-equipment-reference':''}">${c.assetImage(image,'reference-hero-image',{priority:true,loading:'eager',sizes:'(max-width:800px) 100vw, 70vw'})}</figure><div class="reference-hero-panel"><span class="eyebrow">${esc(eyebrow)}</span><h1 class="display-title">${esc(title)}</h1>${lead?`<p class="lede">${esc(lead)}</p>`:''}</div></section>`;
  }
  function inquiryBand(c, context='', audience='sales', intent='consult') {
    const careers = audience === 'careers';
    const heading = careers ? text(c,'Questions about joining LS?','想加入 LS？欢迎咨询。','Ada soalan tentang menyertai LS?') : text(c,'Let’s talk about your production.','一起讨论您的生产需求。','Mari bincangkan pengeluaran anda.');
    const formLabel = careers ? text(c,'View listed roles','查看已列出的职位','Lihat jawatan yang disenaraikan') : text(c,'Prefer a form? Use the contact page','更喜欢表单？前往联系页面','Lebih suka borang? Gunakan halaman hubungi');
    const query = [context ? `context=${encodeURIComponent(context)}` : '', intent ? `intent=${encodeURIComponent(intent)}` : ''].filter(Boolean).join('&');
    const formHref = careers ? c.getContact().jobListUrl : `#inquiry${query ? `?${query}` : ''}`;
    return `<section class="production-invitation"><div class="section-wrap"><div class="invitation-copy"><h2>${esc(heading)}</h2>${context&&!careers?`<p class="invitation-context">${esc(context)}</p>`:''}</div><div class="invitation-actions">${c.inquiryActions({machine:context,audience,intent,variant:'light'})}<a class="arrow-link" href="${esc(formHref)}"${careers?' target="_blank" rel="noopener noreferrer"':''}>${esc(formLabel)} <span aria-hidden="true">↗</span></a></div></div></section>`;
  }
  function segmentPickLinks(c, segment) {
    const picks = c.segmentPicks(segment.name).slice(0,3);
    if (!picks.length) return '';
    return `<ul class="segment-picks" aria-label="${esc(text(c,'Suggested machines','推荐设备','Mesin yang dicadangkan'))}">${picks.map(({product})=>`<li><a href="${c.productUrl(product.name)}">${esc(product.name)}</a></li>`).join('')}</ul>`;
  }
  function clientStrip(c) {
    const clients=(c.stories?.clients||[]).filter(item=>item?.name&&item?.source&&(item.customImage||!item.image||c.sectionAsset('clients',item.image))).slice(0,100);
    if(!clients.length)return '';
    const logoClients=clients.filter(item=>item.image||item.customImage);
    const uniqueNames=new Set(logoClients.map(item=>item.name.trim().toLowerCase()));
    const uniqueLogos=new Set(logoClients.map(item=>item.customImage||c.assets.images[c.sectionAsset('clients',item.image)]?.sha256||c.sectionAsset('clients',item.image)));
    const continuous=uniqueNames.size>=6&&uniqueLogos.size>=6;
    return `<section class="client-strip-wrap client-marquee ${continuous?'':'is-static'}" aria-label="${esc(text(c,'Companies LS has worked with','LS 的合作企业','Syarikat yang pernah bekerjasama dengan LS'))}"><p class="client-strip-heading">${esc(text(c,'Companies LS has worked with','LS 的合作企业','Syarikat yang pernah bekerjasama dengan LS'))}</p><div class="client-strip" ${continuous?'data-client-carousel data-client-continuous':''}><div class="client-strip-viewport"><div class="client-strip-list" data-client-track>${clients.map(item=>`<figure class="client-strip-logo">${item.image||item.customImage?c.storyImage(item.customImage,c.sectionAsset('clients',item.image),'client-logo',{alt:item.name,sizes:'240px'}):`<span class="client-name-only">${esc(item.name)}</span>`}<figcaption class="sr-only">${esc(item.name)}</figcaption></figure>`).join('')}</div></div></div></section>`;
  }
  function currentEditorial(c) {
    const currentImage=c.sectionAsset('history','early-phases')||c.sectionAsset('currentProduction');
    return `<section class="section-wrap section-pad home-current editorial-current" id="current"><div class="current-editorial-layout"><figure class="current-editorial-media">${c.assetImage(currentImage,'current-editorial-image',{sizes:'(max-width:800px) 100vw, 76vw'})}</figure><div class="current-editorial-panel"><span class="eyebrow">${esc(c.t('latest'))}</span><h2 class="current-editorial-title">${esc(c.content.currentTitle)}</h2><p class="body-copy">${esc(c.content.currentText)}</p><div class="current-editorial-actions">${c.arrowLink('#company',text(c,'Meet LS Smart Machinery','认识 LS Smart Machinery','Kenali LS Smart Machinery'))}<a class="arrow-link" href="#company/history">${esc(text(c,'Our story','我们的故事','Kisah kami'))} ↗</a></div></div></div>${clientStrip(c)}</section>`;
  }
  function capabilitiesExplorer(c, capabilities) {
    const rows = [
      { image:c.sectionAsset('solutions','factory-line-planning'), alt:text(c,'LS premises in Malaysia','马来西亚 LS 厂房','Premis LS di Malaysia'), href:'#solution/factory-line-planning', action:text(c,'Explore factory and line planning','了解工厂与生产线规划','Terokai perancangan kilang dan barisan') },
      { image:c.sectionAsset('solutions','machinery-automation'), alt:text(c,'LS machinery collage; equipment examples only','LS 机械拼图；设备示例','Kolaj mesin LS; contoh peralatan sahaja'), caption:text(c,'Machinery examples from LS','LS 机械示例','Contoh mesin daripada LS'), href:'#machines', action:text(c,'Explore machines','浏览设备','Terokai mesin') },
      { image:c.sectionAsset('services'), alt:text(c,'LS team inspecting food machinery','LS 团队检查食品机械','Pasukan LS memeriksa mesin makanan'), caption:text(c,'LS team inspecting food machinery','LS 团队检查食品机械','Pasukan LS memeriksa mesin makanan'), href:'#service/installation-training', action:text(c,'Discuss installation and training','讨论安装与培训','Bincangkan pemasangan dan latihan') },
      { image:c.sectionAsset('customerExperiences','photo-1'), alt:text(c,'Food-production equipment at a customer site','客户现场的食品生产设备','Peralatan pengeluaran makanan di tapak pelanggan'), caption:text(c,'Food-production equipment at a customer site','客户现场的食品生产设备','Peralatan pengeluaran makanan di tapak pelanggan'), href:'#service/support-repairs', action:text(c,'Contact LS support','联系 LS 服务团队','Hubungi sokongan LS') }
    ];
    return `<div class="home-capability-explorer" data-capability-explorer><div class="home-capability-media" aria-label="${esc(text(c,'LS photographs','LS 实景照片','Foto LS'))}">${rows.map((row,i)=>`<figure class="home-capability-photo ${i===0?'is-active':''}" data-capability-photo="${i}" aria-hidden="${i!==0}" ${i===0?'':'inert'}>${c.assetImage(row.image,'home-capability-image',{alt:row.alt,sizes:'(max-width:800px) 100vw, 48vw',loading:i===0?'eager':'lazy'})}${row.caption?`<figcaption>${esc(row.caption)}</figcaption>`:''}</figure>`).join('')}</div><div class="home-capability-copy"><div class="home-capability-tabs" role="tablist" aria-label="${esc(text(c,'Ways LS can help','LS 可提供的协助','Cara LS boleh membantu'))}">${capabilities.map(([title],i)=>`<button type="button" role="tab" class="home-capability-tab ${i===0?'is-active':''}" id="home-capability-tab-${i}" aria-controls="home-capability-panel-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" data-capability-tab="${i}">${esc(title)}<span aria-hidden="true">↗</span></button>`).join('')}</div>${capabilities.map(([title,body],i)=>`<section class="home-capability-panel" role="tabpanel" id="home-capability-panel-${i}" aria-labelledby="home-capability-tab-${i}" data-capability-panel="${i}" ${i===0?'':'hidden inert'}><h3>${esc(title)}</h3><p>${esc(body)}</p><a class="arrow-link" href="${esc(rows[i].href)}">${esc(rows[i].action)} <span aria-hidden="true">↗</span></a></section>`).join('')}</div></div>`;
  }
  function experienceCards(c, limit = 3) {
    const source = c.stories?.experiences || [
      { title: text(c,'Equipment in a food-production setting','食品生产场景中的设备','Peralatan dalam persekitaran pengeluaran makanan'), body: text(c,'A view from LS’s published gallery of machinery and production environments.','来自 LS 已发布图库的设备与生产环境画面。','Paparan mesin dan persekitaran pengeluaran daripada galeri terbitan LS.'), image: 'photo-1' },
      { title: text(c,'People and machinery at work','人员与设备协同工作','Orang dan mesin sedang bekerja'), body: text(c,'People alongside food-production equipment in images from LS’s gallery.','LS 图库中人员与食品生产设备的画面。','Orang bersama peralatan pengeluaran makanan dalam imej galeri LS.'), image: 'photo-2' },
      { title: text(c,'Production equipment on site','现场生产设备','Peralatan pengeluaran di tapak'), body: text(c,'A closer look at equipment shown in LS’s published gallery.','近距离了解 LS 已发布图库中的设备。','Lihat lebih dekat peralatan dalam galeri terbitan LS.'), image: 'photo-3' }
    ];
    return source.filter(item=>(item?.image&&c.sectionAsset('customerExperiences',item.image))||item?.customImage).slice(0,limit).map(item=>`<article class="customer-experience-card fade-in"><figure>${c.storyImage(item.customImage,c.sectionAsset('customerExperiences',item.image),'experience-image',{alt:item.customImage?(item.title||item.body||text(c,'LS gallery image','LS 图库图片','Imej galeri LS')):undefined,sizes:'(max-width:800px) 90vw, 32vw'})}</figure>${item.title||item.body?`<div class="customer-experience-copy">${item.title?`<h3>${esc(item.title)}</h3>`:''}${item.body?`<p>${esc(item.body)}</p>`:''}</div>`:''}</article>`).join('');
  }
  function socialLinks(c) {
    return (c.socialLinks || []).map(({name,href,icon})=>`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="LS Smart Machinery on ${esc(name)}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg></a>`).join('');
  }
  function newsSection(c) { return window.LSProductionPages.newsSection(c); }
  function home(c) {
    const heroChoices = [
      {model:'LSF 502 MCD',catalogueName:'Mini Cookie Depositor (MCD)'},
      {model:'LSF 502 MCWC',catalogueName:'Mini Cookie Wire Cut (MCWC)'},
      {model:'LSF 502 MCAD',catalogueName:'Mini Cake Depositor (MCAD)'}
    ];
    const heroMachine = heroChoices.find(item=>item.model===c.content.homeHeroModel)||heroChoices[0];
    const heroImage = c.assets.catalogue[heroMachine.catalogueName]?.image;
    const capabilities = c.homeText('why').slice(0,4);
    return `<div class="home-page reference-home">
      <section class="reference-hero home-hero home-video-hero" aria-labelledby="home-title"><div class="home-intro-video" data-home-intro-video data-video-state="loading" role="group"><div class="home-intro-poster" aria-hidden="true">${c.assetImage(c.sectionAsset('currentProduction'),'home-intro-poster-image',{alt:'',loading:'eager',sizes:'100vw'})}</div><div class="home-intro-player" id="ls-home-intro-player" data-home-video-player aria-hidden="true"></div><div class="home-intro-video-shade" aria-hidden="true"></div><div class="reference-hero-panel"><span class="eyebrow">${esc(c.t('heroEyebrow'))}</span><h1 id="home-title" class="display-title">${esc(c.content.heroTitleA)}<br><span class="hero-accent">${esc(c.content.heroTitleB)}</span></h1><p class="lede">${esc(c.content.heroLead)}</p><div class="hero-actions"><a class="button-link home-food-action" href="#food" data-scroll-to="food">${esc(c.t('allFood'))} <span class="button-arrow" aria-hidden="true">↗</span></a>${c.arrowLink('#machines',c.t('exploreMachines'))}${c.arrowLink('#inquiry?intent=quote',c.t('askForQuote'))}<button type="button" class="home-video-play" data-home-video-play><span data-play-label>${esc(text(c,'Play intro video','播放介绍视频','Mainkan video pengenalan'))}</span><span aria-hidden="true">▶</span></button></div></div><button type="button" class="home-video-toggle" data-home-video-toggle aria-pressed="false" aria-label="${esc(text(c,'Resume intro video','继续播放介绍视频','Sambung video pengenalan'))}"><span data-video-icon aria-hidden="true">▶</span></button></div></section>
      <section class="section-wrap home-featured-machine" aria-label="${esc(text(c,'Featured machine','精选设备','Mesin pilihan'))}"><div class="home-featured-machine-copy"><span class="eyebrow">${esc(text(c,'FEATURED MACHINE','精选设备','MESIN PILIHAN'))}</span><h2>${esc(heroMachine.model)}</h2><p>${esc(c.localName(heroMachine.catalogueName))}</p><a class="arrow-link" href="${esc(c.productUrl(heroMachine.catalogueName))}">${esc(text(c,'Explore this machine','了解这台设备','Terokai mesin ini'))} <span aria-hidden="true">↗</span></a></div><figure class="home-featured-machine-visual">${c.assetImage(heroImage,'home-featured-machine-image',{priority:true,loading:'eager',alt:heroMachine.model,sizes:'(max-width:800px) 45vw, 25vw'})}</figure></section>
      <section class="section-wrap section-pad home-food-section" id="food" aria-labelledby="home-food-title"><h2 id="home-food-title" class="section-title compact-heading">${esc(text(c,'What would you like to produce?','您希望生产哪类食品？','Apakah yang ingin anda hasilkan?'))}</h2>${foodLinks(c)}</section>
      ${currentEditorial(c)}
      <section class="section-wrap section-pad home-capabilities" id="why-ls" aria-labelledby="home-capabilities-title"><div class="home-capabilities-intro"><h2 id="home-capabilities-title" class="section-title">${esc(text(c,'From product planning to ongoing support','从产品规划到持续支持','Daripada perancangan produk hingga sokongan berterusan'))}</h2><p>${esc(text(c,'Bring your product, space and production goals. LS can help you work through the next step.','带上您的产品、空间与生产目标，与 LS 一起讨论下一步。','Kongsikan produk, ruang dan matlamat pengeluaran anda. LS boleh membantu merancang langkah seterusnya.'))}</p></div>${capabilitiesExplorer(c,capabilities)}</section>
      <section class="section-wrap section-pad home-segments" id="segments"><h2 class="section-title">${esc(text(c,'Customer segments','客户群体','Segmen pelanggan'))}</h2>${segmentPicker(c)}</section>
      ${newsSection(c)}
      <section class="section-wrap section-pad home-experiences" id="customer-experiences"><div class="section-heading-row"><div><span class="eyebrow">${esc(text(c,'CUSTOMER PARTNERSHIPS','客户合作','KERJASAMA PELANGGAN'))}</span><h2 class="section-title">${esc(text(c,'Built around the people who produce.','围绕每一位食品生产者。','Bersama mereka yang menghasilkan.'))}</h2></div><a href="#company/customer-partnerships">${esc(text(c,'Explore our partnerships','了解客户合作','Terokai kerjasama kami'))} ↗</a></div><p class="customer-partnership-intro">${esc(text(c,'People and machinery in LS’s published production gallery.','LS 已发布生产图库中的团队与机器。','Orang dan mesin dalam galeri pengeluaran LS.'))}</p><div class="customer-experience-grid">${experienceCards(c,3)}</div></section>
      ${inquiryBand(c)}
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
      [text(c,'Can LS support installation and training?','LS 是否提供安装与培训支持？','Adakah LS menyediakan pemasangan dan latihan?'),text(c,'LS provides installation, technology transfer, maintenance and after-sales support. Discuss the services required for your equipment and production setup with the team.','LS 提供安装、技术转移、维护及售后支持。欢迎与团队讨论设备及生产配置所需的服务。','LS menyediakan pemasangan, pemindahan teknologi, penyelenggaraan dan sokongan selepas jualan. Bincangkan perkhidmatan yang diperlukan untuk mesin dan susunan pengeluaran anda bersama pasukan.')],
      [text(c,'What should I include in an inquiry?','咨询时应提供哪些资料？','Apakah maklumat untuk pertanyaan?'),text(c,'Include your product, current process, requirements and a reply contact. When you start from a machine page, its model is carried into your email or WhatsApp message automatically.','请提供产品、现有流程、需求及联系方式。从设备页面发起咨询时，型号会自动加入电邮或 WhatsApp 消息。','Sertakan produk, proses semasa, keperluan dan cara dihubungi. Model dibawa secara automatik ke mesej e-mel atau WhatsApp apabila anda bermula dari halaman mesin.')]
    ];
    return `<section class="section-wrap section-pad faq-section" id="faq"><div><span class="eyebrow">FAQ</span><h2 class="section-title">${esc(text(c,'Your questions, answered.','解答您的问题。','Jawapan untuk soalan anda.'))}</h2></div><div>${questions.map(([q,a])=>`<details class="faq-item"><summary>${esc(q)}<span class="circle-plus" aria-hidden="true"></span></summary><div><p>${esc(a)}</p></div></details>`).join('')}</div></section>`;
  }
  function food(c, food) {
    const mapping = {'cookies-biscuits':['Bakery','Production Line','Package'],'cakes':['Bakery','Production Line','Package'],'bread-buns':['Bakery','Production Line'],'pastries-crusted-foods':['Bakery','Production Line'],'kueh-asian-foods':['Kitchen','Bakery'],'dim-sum':['Kitchen','Bakery','Package']};
    const categories=(mapping[slug(food.name)]||['Bakery']).map(name=>c.categories.find(category=>category.name===name));
    const title=c.localName(food.name);
    const lead=text(c,'Explore equipment and planning around the food you make. Confirm the right configuration with LS for your ingredients, process and production goals.','围绕您的食品探索设备与生产规划。根据原料、流程及生产目标，与 LS 确认合适的配置。','Terokai mesin dan perancangan mengikut makanan anda. Sahkan konfigurasi dengan LS berdasarkan ramuan, proses dan matlamat pengeluaran.');
    return `${photoHero(c,title,lead,c.sectionAsset('foods',slug(food.name)),c.t('navFood'))}${window.LSIndustrial.foodGallery(c,food.name)}${process(c,food.name)}<section class="section-wrap section-pad" id="equipment"><h2 class="section-title">${esc(text(c,'Explore equipment for your next step','探索下一步所需的设备','Terokai peralatan untuk langkah seterusnya'))}</h2><div class="tiles-grid category-index-grid">${categories.map(category=>{return `<a class="info-tile category-index-card fade-in" href="#machines/${slug(category.name)}">${c.categoryImage(category)}<h3>${esc(c.localName(category.name))}<span aria-hidden="true"> ↗</span></h3></a>`}).join('')}</div></section>${inquiryBand(c,food.name)}${faq(c,food.name)}`;
  }
  function cleanup() {
    cleanupHomeVideo();
    cleanupHomeVideo = () => {};
  }
  function enhance(c) {
    cleanup();
    const {main,route}=c;
    document.body.dataset.pageFamily=route.split('/')[0];
    if(route.startsWith('machine/')) {
      main.querySelector('.machine-page-hero')?.classList.add('reference-product-hero');
      const tabs=main.querySelector('.machine-tabs');
      if(tabs) tabs.hidden=true;
    } else if(route.startsWith('inquiry')) {
      main.insertAdjacentHTML('afterbegin',photoHero(c,text(c,'Let’s talk about your production.','一起讨论您的生产需求。','Mari bincangkan pengeluaran anda.'),text(c,'Request a quote, book a consultation or arrange a visit to LS.','索取报价、预约咨询或安排到访 LS。','Minta sebut harga, tempah konsultasi atau atur lawatan ke LS.'),c.sectionAsset('building'),c.t('portal')));
    } else if(!route.startsWith('food/')&&route!=='home') {
      const hero=main.querySelector('.content-page-hero,.segment-hero,.category-hero');
      if(hero) {
        const title=hero.querySelector('h1');
        let machinesReference=null;
        let image=route.startsWith('company')?(route.endsWith('careers')?c.sectionAsset('careers',c.content.careerImage||'recruitment'):c.sectionAsset('building')):route==='insights'?c.sectionAsset('news'):route.startsWith('service')?c.sectionAsset('services'):route.startsWith('segment')?c.sectionAsset('segments',route.split('/')[1]):route.startsWith('solution')?(c.sectionAsset('solutions',route.split('/')[1]||'machinery-automation')||c.sectionAsset('solutions','machinery-automation')):c.sectionAsset('solutions','machinery-automation');
        if (route === 'food') image = c.sectionAsset('foods','cookies-biscuits');
        if (route.startsWith('machines/')) {
          const category = c.categories.find(category => slug(category.name) === route.split('/')[1]);
          const items = category?.items || (category?.subcategories || []).flatMap(sub => sub.items);
          const exact = (items || []).find(item => c.assets.catalogue[item.name]?.match === 'exact');
          image = exact ? c.assets.catalogue[exact.name].image : image;
          machinesReference = exact ? 'equipment' : 'capability';
        }
        if(title&&image) {
          const lead=hero.querySelector('.lede');
          const reference=machinesReference||(route.startsWith('machine')?'equipment':route.startsWith('service')?'capability':false);
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
    if(!main.querySelector('.reference-hero,.machine-page-hero')&&main.querySelector('.not-found h1')) {
      const missing=main.querySelector('.not-found h1');
      main.insertAdjacentHTML('afterbegin',photoHero(c,missing.textContent,'',c.sectionAsset('building'),c.t('navCompany')));
      missing.remove();
    }
    if(route.startsWith('machines/')&&!main.querySelector('#faq')) main.querySelector('.production-invitation')?.insertAdjacentHTML('beforebegin',faq(c));
        main.querySelectorAll('.section-title,.content-columns,.info-tile,.catalogue-item,.reference-hero-panel').forEach(el=>el.classList.add('fade-in'));
    if (route === 'home') cleanupHomeVideo = mountHomeVideo(main, c);
  }
  function company(c) {
    const record = id => c.assets.images[id];
    const chapters = [
      { image:c.sectionAsset('building'), title:text(c,'Rooted in Balakong','扎根 Balakong','Berakar di Balakong'), body:text(c,'LS Smart Machinery (M) Sdn Bhd is based in Balakong, Selangor, supplying machinery and production support to food makers in Malaysia.','LS Smart Machinery (M) Sdn Bhd 位于雪兰莪 Balakong，为马来西亚食品生产商提供设备与生产支持。','LS Smart Machinery (M) Sdn Bhd berpusat di Balakong, Selangor, membekalkan mesin dan sokongan pengeluaran kepada pengeluar makanan di Malaysia.'), link:['#company/locations',text(c,'Visit our premises','到访我们的厂房','Lawati premis kami')] },
      { image:c.sectionAsset('solutions','machinery-automation'), title:text(c,'What we build','我们提供什么','Apa yang kami bina'), body:text(c,'From bakery and kitchen equipment to packaging, refrigeration and complete production lines, planned from design to production around your product and process.','从烘焙、厨房设备到包装、制冷与整条生产线，围绕您的产品与流程，从设计规划到投入生产。','Daripada peralatan bakeri dan dapur kepada pembungkusan, penyejukan dan barisan pengeluaran lengkap, dirancang dari reka bentuk hingga pengeluaran mengikut produk dan proses anda.'), link:['#machines',text(c,'Explore the machines','探索机器设备','Terokai mesin')] },
      { image:c.sectionAsset('services'), title:text(c,'Support across the process','为生产流程提供支持','Sokongan sepanjang proses'), body:text(c,'LS lists factory and line planning, installation, training, technology transfer, maintenance and after-sales support among its services.','LS 列出的服务包括工厂与生产线规划、安装、培训、技术转移、维护及售后支持。','LS menyenaraikan perancangan kilang dan barisan, pemasangan, latihan, pemindahan teknologi, penyelenggaraan dan sokongan selepas jualan.'), link:['#services',text(c,'See our services','了解我们的服务','Lihat perkhidmatan kami')] },
      { image:c.sectionAsset('company'), title:text(c,'A story still unfolding','仍在延续的故事','Kisah yang berterusan'), body:text(c,'Explore the published company history, the people and equipment in LS’s gallery, and opportunities to meet the team.','了解公司已发布的历程、图库中的人员与设备，以及与团队交流的机会。','Terokai sejarah syarikat yang diterbitkan, pasukan dan peralatan dalam galeri LS, serta peluang untuk bertemu pasukan.'), link:['#company/history',text(c,'Follow the LS story','了解 LS 历程','Ikuti kisah LS')] }
    ];
    const chapter = (item, i) => {
      const r = record(item.image);
      const wide = r && r.width / r.height > 2;
      return `<section class="story-chapter fade-in ${wide?'is-wide':''} ${i%2?'is-reversed':''}" id="chapter-${i+1}"><figure class="story-media">${c.assetImage(item.image,'story-image',{sizes:wide?'(max-width:800px) 100vw, 1100px':'(max-width:800px) 100vw, 50vw'})}</figure><div class="story-copy"><span class="story-number">${String(i+1).padStart(2,'0')} / 04</span><h2 class="section-title">${esc(item.title)}</h2><p class="body-copy">${esc(item.body)}</p>${item.values?`<ul class="story-values">${item.values.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}${c.arrowLink(item.link[0],item.link[1])}</div></section>`;
    };
    const title = text(c,'Food production, thoughtfully engineered','食品生产，用心设计','Pengeluaran makanan, direka dengan teliti');
    const lead = text(c,'LS Smart Machinery designs, supplies and supports machinery for food producers across Malaysia. This is how we work.','LS Smart Machinery 为马来西亚食品生产商设计、供应并支持生产设备。这就是我们的工作方式。','LS Smart Machinery mereka bentuk, membekal dan menyokong mesin untuk pengeluar makanan di seluruh Malaysia. Beginilah cara kami bekerja.');
    return `${photoHero(c,title,lead,c.sectionAsset('homepageHero'),c.t('navCompany'))}<div class="company-story">${chapters.map(chapter).join('')}</div><section class="section-wrap section-pad company-pathways"><a href="#company/history"><span class="eyebrow">${esc(text(c,'THE LS STORY','LS 历程','KISAH LS'))}</span><h2>${esc(text(c,'See how the story developed.','了解 LS 如何一路发展。','Lihat bagaimana kisah ini berkembang.'))}</h2><span>${esc(text(c,'Explore the history','了解公司历程','Terokai sejarah'))} ↗</span></a><a href="#company/customer-partnerships"><span class="eyebrow">${esc(text(c,'PEOPLE & PRODUCTION','人员与生产','ORANG & PENGELUARAN'))}</span><h2>${esc(text(c,'Step inside the work.','走进实际工作现场。','Lihat suasana kerja.'))}</h2><span>${esc(text(c,'Customer partnerships','客户合作','Kerjasama pelanggan'))} ↗</span></a></section>${inquiryBand(c)}`;
  }
  function history(c) {
    const chapters=[
      ['beginning',text(c,'A first machine. A direction for the future.','从第一台设备，找到前行方向。','Mesin pertama. Arah untuk masa depan.'),text(c,'The LS journey began with the LSF-800-SM. That first step into food machinery set the direction for the work that followed: developing equipment around the way food is made.','LS 的食品机械历程始于 LSF-800-SM。这第一步确立了此后的方向：围绕食品的制作流程发展设备。','Perjalanan LS bermula dengan LSF-800-SM. Langkah pertama dalam mesin makanan ini membentuk arah seterusnya: membangunkan peralatan mengikut cara makanan dihasilkan.'),text(c,'THE BEGINNING','起点','PERMULAAN')],
      ['early-phases',text(c,'Learning through the process.','在工序中不断探索。','Belajar melalui proses.'),text(c,'Encrusting became an early focus. LS worked on refining these systems, building its food-machinery journey around the details of forming and filling products.','包馅技术成为早期发展的重点。LS 专注于改进这些系统，围绕食品成型与包馅工序中的细节，延续食品机械的发展。','Sistem encrusting menjadi tumpuan awal. LS memperhalus sistem ini, membina perjalanan mesin makanannya melalui butiran pembentukan dan pengisian produk.'),text(c,'FINDING OUR FOCUS','专注与探索','MEMBENTUK TUMPUAN')],
      ['cruiser-period',text(c,'From individual machines to wider connections.','从单台设备，走向更广阔的合作。','Daripada mesin kepada hubungan lebih luas.'),text(c,'The journey grew beyond a single machine. Encrusting equipment reached bakeries and OEM food factories across Southeast Asia, connecting LS with different products and production environments.','历程逐渐超越单台设备。包馅设备进入东南亚的烘焙店及 OEM 食品工厂，让 LS 接触不同产品与生产环境。','Perjalanan berkembang melangkaui sebuah mesin. Peralatan encrusting sampai ke bakeri dan kilang makanan OEM di Asia Tenggara, menghubungkan LS dengan pelbagai produk dan persekitaran pengeluaran.'),text(c,'GROWING CONNECTIONS','合作与成长','HUBUNGAN YANG BERKEMBANG')],
      ['new-chapter',text(c,'Malaysia at our heart. More possibilities ahead.','立足马来西亚，继续走向更远。','Berakar di Malaysia. Peluang lebih luas di hadapan.'),text(c,'The story continued into markets including the Middle East and South Africa. From our base in Balakong, LS brings machinery, production planning and support into the next conversation with food manufacturers.','故事继续延伸至中东及南非等市场。从 Balakong 的基地出发，LS 将设备、生产规划与支持带入与食品制造商的下一次合作。','Kisah ini berterusan ke pasaran termasuk Timur Tengah dan Afrika Selatan. Dari pangkalan di Balakong, LS membawa mesin, perancangan pengeluaran dan sokongan ke perbincangan seterusnya bersama pengeluar makanan.'),text(c,'THE NEXT CHAPTER','续写新篇','BAB SETERUSNYA')]
    ];
    return `<div class="history-book"><section class="history-cover section-wrap"><div class="history-cover-copy"><span class="eyebrow">${esc(text(c,'THE LS STORY','LS 的故事','KISAH LS'))}</span><h1>${esc(text(c,'One machine. The beginning of LS.','一台设备，开启 LS 的历程。','Sebuah mesin. Bermulanya kisah LS.'))}</h1><p>${esc(text(c,'From the LSF-800-SM to encrusting systems and markets beyond Malaysia. Follow the people, equipment and ideas behind the LS story.','从 LSF-800-SM 到包馅系统，再走向马来西亚以外的市场。走进 LS 历程中的团队、设备与想法。','Daripada LSF-800-SM kepada sistem encrusting dan pasaran di luar Malaysia. Ikuti pasukan, peralatan dan idea di sebalik kisah LS.'))}</p><a class="history-read-cue" href="#history-1" data-scroll-to="history-1">${esc(text(c,'Read our story','走进我们的故事','Baca kisah kami'))}<span aria-hidden="true">↓</span></a></div><figure>${c.assetImage(c.sectionAsset('currentProduction'),'history-cover-image',{priority:true,loading:'eager',sizes:'(max-width:800px) 100vw, 56vw'})}</figure></section><div class="company-story history-story">${chapters.map(([key,title,body,label],i)=>`<section class="story-chapter history-chapter fade-in ${i%2?'is-reversed':''}" id="history-${i+1}" data-story-chapter><figure class="story-media">${c.assetImage(c.sectionAsset('history',key),'story-image',{sizes:'(max-width:800px) 100vw, 52vw'})}<figcaption>${esc(label)}</figcaption></figure><div class="story-copy"><span class="story-number">${String(i+1).padStart(2,'0')} — ${esc(label)}</span><h2 class="section-title">${esc(title)}</h2><p class="body-copy">${esc(body)}</p></div></section>`).join('')}</div><section class="history-closing section-wrap section-pad"><span class="eyebrow">${esc(text(c,'AND THE STORY CONTINUES','故事，仍在继续','KISAH INI BERTERUSAN'))}</span><h2>${esc(text(c,'The next chapter could begin with your production.','下一篇章，也许始于您的生产计划。','Bab seterusnya boleh bermula dengan pengeluaran anda.'))}</h2>${c.arrowLink('#company',text(c,'Meet LS today','认识今天的 LS','Kenali LS hari ini'))}</section></div>${inquiryBand(c)}`;
  }
  function customerExperiences(c) {
    const steps=[
      [text(c,'Understand','了解需求','Memahami'),text(c,'Appointment','预约','Janji temu'),text(c,'A conversation about your product and production plans.','从产品与生产计划开始沟通。','Perbincangan tentang produk dan rancangan pengeluaran anda.')],
      [text(c,'Plan','规划','Merancang'),text(c,'Floor planning and design','厂房规划与设计','Perancangan ruang dan reka bentuk'),text(c,'Bring the equipment and production flow into one layout.','在布局中衔接设备与生产动线。','Gabungkan peralatan dan aliran pengeluaran dalam satu susun atur.')],
      [text(c,'Prepare','准备','Menyediakan'),text(c,'Order placement','下单','Pesanan'),text(c,'Bring the agreed machinery requirements together.','落实已商定的设备需求。','Selaraskan keperluan mesin yang dipersetujui.')],
      [text(c,'Install','安装','Memasang'),text(c,'Machine installation','设备安装','Pemasangan mesin'),text(c,'Support the move from machinery selection to installation.','从设备选择走向现场安装。','Sokong peralihan daripada pemilihan mesin kepada pemasangan.')],
      [text(c,'Transfer','技术转移','Memindahkan'),text(c,'Technology transfer','技术转移','Pemindahan teknologi'),text(c,'Connect the equipment with the people who use it.','让使用设备的团队掌握相关技术。','Hubungkan peralatan dengan orang yang menggunakannya.')],
      [text(c,'Continue','持续支持','Meneruskan'),text(c,'After-sales service','售后服务','Khidmat selepas jualan'),text(c,'Keep the relationship open for maintenance and support.','持续提供维护与服务沟通。','Teruskan hubungan untuk penyelenggaraan dan sokongan.')]
    ];
    return `<div class="partnership-page">${photoHero(c,text(c,'Customer partnerships','客户合作','Kerjasama pelanggan'),text(c,'Machines bring a process together. People make the partnership work.','设备衔接生产流程，伙伴共同推动生产。','Mesin menyatukan proses. Orang menjayakan kerjasama.'),c.sectionAsset('customerExperiences','photo-1'),text(c,'WORKING WITH LS','与 LS 同行','BEKERJA BERSAMA LS'))}<section class="section-wrap section-pad partnership-opening"><span class="eyebrow">${esc(text(c,'BUILT THROUGH THE WORK','在合作中建立联系','DIBINA MELALUI KERJA'))}</span><h2>${esc(text(c,'Alongside the people behind every product.','与每一款食品背后的生产者同行。','Bersama orang di sebalik setiap produk.'))}</h2><p>${esc(text(c,'From machinery discussions to installation, technology transfer and after-sales service, LS works with food producers across the production journey. These are moments with the people and equipment at the heart of that work.','从设备讨论到安装、技术转移与售后支持，LS 在生产旅程中与食品生产者合作。以下画面记录了合作中的人员与设备。','Daripada perbincangan mesin kepada pemasangan, pemindahan teknologi dan perkhidmatan selepas jualan, LS bekerja bersama pengeluar makanan sepanjang perjalanan pengeluaran. Inilah detik bersama orang dan peralatan di sebalik kerja tersebut.'))}</p></section><section class="section-wrap partnership-gallery-section" id="gallery"><div class="customer-experience-grid customer-gallery partnership-gallery">${experienceCards(c,10)}</div></section><section class="partnership-process section-pad" id="partnership"><div class="section-wrap"><div class="partnership-process-heading"><span class="eyebrow">${esc(text(c,'ONE CONTINUING RELATIONSHIP','持续的合作关系','HUBUNGAN YANG BERTERUSAN'))}</span><h2>${esc(text(c,'From the first conversation. Beyond installation.','从初次沟通，到安装之后。','Dari perbualan pertama. Melepasi pemasangan.'))}</h2></div><ol class="service-journey">${steps.map(([label,step,body],i)=>`<li><span>${String(i+1).padStart(2,'0')} / ${esc(label)}</span><strong>${esc(step)}</strong><p>${esc(body)}</p></li>`).join('')}</ol></div></section></div>${inquiryBand(c,text(c,'Customer partnerships','客户合作','Kerjasama pelanggan'),'sales','consult')}`;
  }
  function recommendations(c, segment) {
    const picks = c.segmentPicks(segment.name);
    if (!picks.length) return '';
    return `<section class="section-wrap section-pad segment-recommendations" id="recommended"><span class="eyebrow">${esc(text(c,'RECOMMENDED STARTING POINTS','推荐起点','TITIK PERMULAAN DISYORKAN'))}</span><h2 class="section-title">${esc(text(c,'Machines to look at for this stage','此阶段值得关注的设备','Mesin untuk diteliti pada peringkat ini'))}</h2><div class="catalogue-list segment-picks-grid">${picks.map(({pick})=>c.catalogueCardByName(pick.name,{reason:pick.reason[c.language]||pick.reason.en})).join('')}</div><p class="small-note">${esc(text(c,'These are starting points for discussion. LS confirms suitability for your product, process and space.','以上仅作讨论起点，适用性由 LS 根据您的产品、流程与空间确认。','Ini ialah titik permulaan perbincangan. LS mengesahkan kesesuaian untuk produk, proses dan ruang anda.'))}</p></section>`;
  }
  function editorial(c, title, body, image, reverse=false, id='') {
    return `<section class="section-wrap section-pad editorial-section ${reverse?'is-reversed':''}" ${id?`id="${id}"`:''}><figure>${c.assetImage(image,'editorial-image',{sizes:'(max-width:800px) 90vw, 45vw'})}</figure><div><h2 class="section-title">${esc(title)}</h2><p class="body-copy">${esc(body)}</p></div></section>`;
  }
  function segmentJourney(c, index) {
    // Equipment examples use existing published LS backup records, also indexed in
    // machine-content.js: MCD post 3083, Cake Cutter post 5467, Tunnel Oven post 5479.
    // These explain documented processes; none is a client project or an approved
    // startup setup. Category links follow the supplied LS_CATALOGUE grouping.
    const journeys = [
      {
        label:text(c,'BEFORE YOUR FIRST EQUIPMENT DISCUSSION','首次设备沟通之前','SEBELUM PERBINCANGAN PERALATAN PERTAMA'),
        title:text(c,'Turn a product idea into a workable brief.','将产品想法转化为清晰的生产需求。','Jadikan idea produk satu keperluan kerja yang jelas.'),
        lead:text(c,'Begin with the product you want to make. Then work through the process and the room it will occupy.','从您想制作的产品开始，再梳理工序与所需空间。','Mulakan dengan produk yang ingin dihasilkan. Kemudian teliti proses dan ruang yang akan digunakan.'),
        steps:[
          [text(c,'Define your product range','明确产品范围','Tentukan rangkaian produk'),text(c,'Bring a sample or photograph, the recipe process and the shapes or sizes you want to make.','准备样品或照片、配方工序，以及希望制作的形状与尺寸。','Sediakan sampel atau gambar, proses resipi serta bentuk atau saiz yang ingin dihasilkan.'),'#food',text(c,'Explore food processes','探索食品工序','Terokai proses makanan')],
          [text(c,'Map the work around it','梳理前后工序','Petakan kerja di sekelilingnya'),text(c,'Follow preparation, forming, cooking and packing. Decide which task needs equipment and which tasks remain with your team.','梳理准备、成型、烹制与包装，确定需要设备协助的工序，以及继续由团队完成的工作。','Ikuti penyediaan, pembentukan, memasak dan pembungkusan. Tentukan tugas yang memerlukan mesin serta tugas yang dikendalikan pasukan.'),'#solution/machinery-automation',text(c,'Explore machinery planning','了解设备规划','Terokai perancangan mesin')],
          [text(c,'Make the space work','让空间配合生产','Sesuaikan ruang kerja'),text(c,'Bring room, doorway and work-surface dimensions into the layout discussion, alongside available power and utilities.','讨论布局时，一并提供房间、门口、工作台尺寸，以及可用电力与公用设施。','Sertakan ukuran ruang, pintu dan permukaan kerja dalam perbincangan susun atur, bersama bekalan kuasa dan utiliti tersedia.'),'#solution/factory-line-planning',text(c,'Explore layout planning','了解布局规划','Terokai perancangan susun atur')]
        ],
        exampleTitle:text(c,'Equipment example · Piped cookies','设备实例 · 挤花饼干','Contoh peralatan · Kuki paip'),
        example:text(c,'The LSF-502-MCD deposits cookie dough onto trays. Its interchangeable nozzles and recipe memory illustrate the choices to discuss when defining cookie shapes and repeat production. Product trials and the surrounding process determine the final setup.','LSF-502-MCD 将饼干面团挤注到烤盘上。可更换花嘴与配方记忆，展示了讨论饼干造型与重复生产时可考虑的功能。最终配置需结合产品试制与前后工序确定。','LSF-502-MCD mendeposit doh kuki ke atas dulang. Muncung boleh tukar dan memori resipi menunjukkan pilihan untuk dibincangkan bagi bentuk kuki serta pengeluaran berulang. Ujian produk dan proses sekeliling menentukan susunan akhir.'),
        model:'Mini Cookie Depositor (MCD)'
      },
      {
        label:text(c,'IMPROVE YOUR EXISTING PROCESS','改善现有流程','TAMBAH BAIK PROSES SEDIA ADA'),
        title:text(c,'Where is your line slowing down?','哪一道工序拖慢了生产？','Di manakah barisan anda menjadi perlahan?'),
        lead:text(c,'Follow one product through a normal production run. Note where work queues up, where people wait and what happens immediately before and after that stage.','跟踪一款产品的日常生产，记录积压、等待发生在哪里，以及该工序前后的实际情况。','Ikuti satu produk dalam pengeluaran biasa. Catat tempat kerja bertimbun, pekerja menunggu dan perkara yang berlaku sebelum serta selepas peringkat tersebut.'),
        steps:[
          [text(c,'Mixing','搅拌','Pengadunan'),text(c,'Compare batch preparation and mixing time with the pace needed at the next stage.','比较批次准备、搅拌时间与下一道工序所需的节奏。','Bandingkan masa penyediaan kelompok dan pengadunan dengan keperluan peringkat seterusnya.'),'#machines/bakery',text(c,'Bakery · Mixers','烘焙设备 · 搅拌机','Bakeri · Pengadun')],
          [text(c,'Forming','成型','Pembentukan'),text(c,'Watch portioning, depositing and tray handling. Record which operation holds the next batch back.','观察分份、挤注与烤盘操作，记录哪项工作延误下一批生产。','Perhatikan pembahagian, pendepositan dan pengendalian dulang. Catat operasi yang melambatkan kelompok berikutnya.'),'#machines/bakery',text(c,'Bakery · Forming and depositing','烘焙设备 · 成型与挤注','Bakeri · Pembentukan dan pendepositan')],
          [text(c,'Baking','烘烤','Pembakaran'),text(c,'Review loading, baking and unloading together, including tray or rack movements.','结合上料、烘烤、卸料与烤盘或烤架移动，整体梳理。','Semak pemuatan, pembakaran dan pemunggahan bersama pergerakan dulang atau rak.'),'#machines/bakery',text(c,'Bakery · Ovens','烘焙设备 · 烤炉','Bakeri · Ketuhar')],
          [text(c,'Cooling and cold storage','冷却与冷藏','Penyejukan dan penyimpanan sejuk'),text(c,'Check holding time and storage space before packing. Review refrigeration only where the product needs a cold stage.','检查包装前的停留时间与储存空间；仅在产品需要冷链工序时评估制冷设备。','Semak masa menunggu dan ruang simpanan sebelum pembungkusan. Teliti penyejukan hanya apabila produk memerlukan peringkat sejuk.'),'#machines/refrigeration-series',text(c,'Refrigeration equipment','制冷设备','Peralatan penyejukan')],
          [text(c,'Packing','包装','Pembungkusan'),text(c,'Review product feeding, weighing and sealing against the output arriving from production.','结合前道工序的实际产出，检查产品进料、称重与封口。','Semak suapan produk, penimbangan dan pengedapan berbanding produk yang tiba daripada pengeluaran.'),'#machines/package',text(c,'Packaging equipment','包装设备','Peralatan pembungkusan')]
        ],
        exampleTitle:text(c,'Equipment example · Cake portioning','设备实例 · 蛋糕分份','Contoh peralatan · Pembahagian kek'),
        example:text(c,'LS’s Cake Cutter record describes adjustable cutting sizes for round, square and layered cakes, including Swiss rolls and kek lapis. It is a concrete process to review when portioning sits between baking and packing; suitability depends on the cake and required format.','LS 的蛋糕切割机资料列出可调切割尺寸，适用于圆形、方形与分层蛋糕，包括瑞士卷及千层蛋糕。当分份位于烘烤与包装之间，可据此讨论该工序；适用性仍取决于蛋糕与所需形式。','Rekod Cake Cutter LS menerangkan saiz potongan boleh laras bagi kek bulat, persegi dan berlapis, termasuk gulung Swiss dan kek lapis. Proses ini boleh diteliti apabila pembahagian terletak antara pembakaran dan pembungkusan; kesesuaian bergantung pada kek serta format diperlukan.'),
        model:'Cake Cutter'
      },
      {
        label:text(c,'ALIGN ENGINEERING AND PROCUREMENT','衔接工程与采购','SELARASKAN KEJURUTERAAN DAN PEROLEHAN'),
        title:text(c,'Define the connections before choosing the line.','选择生产线之前，先明确工序衔接。','Tentukan sambungan sebelum memilih barisan.'),
        lead:text(c,'Bring production, engineering and procurement into one brief, with a clear record of what the proposed line must connect to.','让生产、工程与采购共同建立需求说明，明确拟定生产线需要连接的设备与条件。','Satukan pengeluaran, kejuruteraan dan perolehan dalam satu taklimat dengan rekod jelas tentang sambungan yang diperlukan bagi barisan cadangan.'),
        steps:[
          [text(c,'Product and process boundaries','产品与工序范围','Skop produk dan proses'),text(c,'Define product formats, the sequence of operations and the existing equipment that will remain in use.','明确产品形式、工序顺序，以及计划继续使用的现有设备。','Tentukan format produk, urutan operasi dan peralatan sedia ada yang akan terus digunakan.'),'#machines/production-line',text(c,'Explore production lines','探索生产线','Terokai barisan pengeluaran')],
          [text(c,'Interfaces and facility layout','设备接口与厂房布局','Antara muka dan susun atur kilang'),text(c,'Review transfers between machines, access for operators and maintenance, and the site utilities required by the proposed equipment.','评估设备间转移、操作与维护通道，以及拟定设备所需的现场公用设施。','Semak pemindahan antara mesin, akses pengendali serta penyelenggaraan dan utiliti tapak yang diperlukan oleh peralatan cadangan.'),'#solution/factory-line-planning',text(c,'Explore integration planning','了解整合规划','Terokai perancangan integrasi')],
          [text(c,'Installation and handover','安装与交接','Pemasangan dan penyerahan'),text(c,'Agree the installation scope, operator training and documents needed for handover, with a route to continued service.','商定安装范围、操作培训与交接文件，并明确后续服务渠道。','Persetujui skop pemasangan, latihan pengendali dan dokumen penyerahan, bersama saluran perkhidmatan berterusan.'),'#service/installation-training',text(c,'Explore installation and training','了解安装与培训','Terokai pemasangan dan latihan')]
        ],
        exampleTitle:text(c,'Equipment example · Continuous baking','设备实例 · 连续烘烤','Contoh peralatan · Pembakaran berterusan'),
        example:text(c,'The Hybrid Tunnel Oven record describes adjustable baking zones and conveyor speed, with gas, electric or hybrid heating. Those are defined interfaces for a line discussion: product travel through the oven, upstream feeding, downstream handling and site utilities.','混合式隧道炉资料列出可调烘烤区、输送速度，以及燃气、电热或混合加热选项。这些为生产线讨论提供具体接口：产品通过烤炉的过程、前道进料、后道处理及现场能源。','Rekod Hybrid Tunnel Oven menerangkan zon pembakaran dan kelajuan penghantar boleh laras, dengan pemanasan gas, elektrik atau hibrid. Ini memberikan antara muka jelas untuk perbincangan barisan: perjalanan produk melalui ketuhar, suapan huluan, pengendalian hiliran dan utiliti tapak.'),
        model:'Hybrid Tunnel Oven (LPG/NPG/Electric Heating System)'
      }
    ];
    const journey=journeys[index]||journeys[0];
    return `<section class="partnership-process section-pad segment-decision-guide" id="${index===1?'bottlenecks':'production-brief'}"><div class="section-wrap"><div class="partnership-process-heading"><span class="eyebrow">${esc(journey.label)}</span><h2 class="section-title">${esc(journey.title)}</h2><p class="body-copy">${esc(journey.lead)}</p></div><ol class="service-journey">${journey.steps.map(([title,body,href,label],step)=>`<li><span>${String(step+1).padStart(2,'0')}</span><strong>${esc(title)}</strong><p>${esc(body)}</p>${c.arrowLink(href,label)}</li>`).join('')}</ol><article class="segment-equipment-example"><h3>${esc(journey.exampleTitle)}</h3><p class="body-copy">${esc(journey.example)}</p>${c.arrowLink(c.productUrl(journey.model),text(c,'View the equipment record','查看设备资料','Lihat rekod peralatan'))}</article></div></section>`;
  }
  function segment(c, segment) {
    const i=Math.max(0,c.segments.findIndex(item=>item.name===segment.name));
    const content=[
      {title:text(c,'Start with your product. Build your process.','从产品出发，建立生产流程。','Mulakan dengan produk. Bina proses anda.'),lead:text(c,'Machinery and production guidance for micro and startup food businesses, from the first product range to the next step in production.','为微型及初创食品企业提供设备与生产规划支持，从首批产品到下一步生产发展。','Mesin dan panduan pengeluaran untuk perniagaan makanan mikro dan baharu, daripada rangkaian produk pertama kepada langkah seterusnya.'),heading:text(c,'A clear starting point for your production.','让生产有清晰的起点。','Titik permulaan yang jelas untuk pengeluaran anda.'),body:text(c,'Your first equipment choices begin with the food you make and the way you work. Product variety, daily tasks and available space all shape the production setup.','首次选择设备，从您制作的食品与工作方式出发。产品种类、日常工序及可用空间都会影响生产配置。','Pemilihan peralatan pertama bermula dengan makanan dan cara kerja anda. Kepelbagaian produk, tugas harian dan ruang membentuk susunan pengeluaran.'),responseTitle:text(c,'A practical route from idea to equipment.','从想法到设备，规划实用路径。','Laluan praktikal daripada idea kepada peralatan.'),response:text(c,'Explore mixing, depositing, dough forming and baking. LS can help you review equipment selection alongside layout, installation and training, so each decision stays connected to the food you want to produce.','探索搅拌、挤出、面团成型与烘烤。LS 可结合布局、安装与培训，协助讨论设备选择，让每项决定与您计划制作的食品相衔接。','Terokai pengadunan, depositing, pembentukan doh dan pembakaran. LS boleh membantu menyemak pemilihan mesin bersama susun atur, pemasangan dan latihan supaya setiap keputusan berkaitan dengan produk anda.'),priorities:[text(c,'Product range','产品种类','Rangkaian produk'),text(c,'Available working space','可用工作空间','Ruang kerja tersedia'),text(c,'The next production step','下一道生产工序','Langkah pengeluaran seterusnya')],categories:['Bakery','Kitchen','Package'],route:'#solution/machinery-automation'},
      {title:text(c,'Take the next step in production.','推动生产，迈向下一步。','Ambil langkah seterusnya dalam pengeluaran.'),lead:text(c,'Equipment and production planning for SMEs and expanding manufacturers. Focus the next investment on the process that needs it.','为中小型及扩展中的制造商提供设备与生产规划，让下一步投入对准需要改善的工序。','Peralatan dan perancangan untuk PKS serta pengilang yang berkembang. Tumpukan pelaburan seterusnya pada proses yang memerlukannya.'),heading:text(c,'Build on the production you already know.','以现有生产为基础，规划发展。','Bina berdasarkan pengeluaran yang anda kenali.'),body:text(c,'Expansion brings decisions about the next machine, the next product and how it all fits together. Addressing a bottleneck means understanding the tasks before and after it.','扩展生产时，需要考虑新设备、新产品以及整体衔接。改善生产瓶颈，需要了解前后各道工序。','Pengembangan melibatkan keputusan tentang mesin, produk baharu dan cara semuanya disatukan. Mengatasi kesesakan memerlukan pemahaman tentang tugas sebelum dan selepasnya.'),responseTitle:text(c,'Review the process. Plan the next move.','梳理流程，规划下一步。','Semak proses. Rancang langkah seterusnya.'),response:text(c,'LS brings equipment supply, modification and factory-flow planning into the same discussion. Installation, technology transfer and after-sales support help connect the machinery decision with the team operating it.','LS 将设备供应、改装与厂房动线规划结合讨论。安装、技术转移及售后支持，让设备决策与操作团队相衔接。','LS menggabungkan bekalan mesin, pengubahsuaian dan perancangan aliran kilang. Pemasangan, pemindahan teknologi dan sokongan selepas jualan menghubungkan keputusan mesin dengan pasukan pengendalinya.'),priorities:[text(c,'Production bottlenecks','生产瓶颈','Kesesakan pengeluaran'),text(c,'Equipment and workflow','设备与工作流程','Peralatan dan aliran kerja'),text(c,'Training and continued support','培训与持续支持','Latihan dan sokongan berterusan')],categories:['Bakery','Package','Refrigeration Series'],route:'#solution/factory-line-planning'},
      {title:text(c,'Bring the entire production line into view.','以整体视角，规划生产线。','Lihat keseluruhan barisan pengeluaran.'),lead:text(c,'Machinery, line planning and integration discussions for large food manufacturers, with installation, technology transfer and continued support.','为大型食品制造商提供设备、生产线规划与整合讨论，并衔接安装、技术转移及持续支持。','Mesin, perancangan barisan dan perbincangan integrasi untuk pengilang makanan besar, bersama pemasangan, pemindahan teknologi dan sokongan berterusan.'),heading:text(c,'Connected thinking for complex production.','为复杂生产，建立衔接思路。','Pemikiran bersepadu untuk pengeluaran kompleks.'),body:text(c,'A production line is a sequence of connected processes. Product requirements, existing equipment, movement through the factory and operator support all need to work together.','生产线由相互衔接的工序组成。产品需求、现有设备、厂房动线与操作支持都需要整体考虑。','Barisan pengeluaran ialah urutan proses yang saling berkaitan. Keperluan produk, peralatan sedia ada, pergerakan dalam kilang dan sokongan pengendali perlu diselaraskan.'),responseTitle:text(c,'Plan the line as one production system.','将整条生产线作为一个系统规划。','Rancang barisan sebagai satu sistem pengeluaran.'),response:text(c,'Explore processing, forming, packaging and refrigeration alongside line layout and integration requirements. LS can discuss the machinery, installation and technology transfer needed for the proposed configuration.','结合生产线布局与整合需求，探索加工、成型、包装及制冷。LS 可讨论拟定配置所需的设备、安装与技术转移。','Terokai pemprosesan, pembentukan, pembungkusan dan penyejukan bersama susun atur serta keperluan integrasi. LS boleh membincangkan mesin, pemasangan dan pemindahan teknologi untuk konfigurasi yang dicadangkan.'),priorities:[text(c,'Line layout and integration','生产线布局与整合','Susun atur dan integrasi barisan'),text(c,'Process connections','工序衔接','Hubungan antara proses'),text(c,'Installation and technology transfer','安装与技术转移','Pemasangan dan pemindahan teknologi')],categories:['Production Line','Package','Refrigeration Series'],route:'#solution/factory-line-planning'}
    ][i];
    const paths=content.categories.map(name=>c.categories.find(category=>category.name===name)).filter(Boolean);
    const heroImage=i===0?c.sectionAsset('foods','cookies-biscuits'):i===1?c.sectionAsset('history','early-phases'):c.sectionAsset('customerExperiences','photo-7');
    const responseImage=i===0?c.sectionAsset('history','early-phases'):i===1?c.sectionAsset('services'):c.sectionAsset('customerExperiences','photo-5');
    const needImage=i===0?c.sectionAsset('foods','cookies-biscuits'):c.sectionAsset('customerExperiences',i===1?'photo-5':'photo-1');
    return `<div class="segment-editorial-page segment-stage-${i+1}">${photoHero(c,content.title,content.lead,heroImage,c.localName(segment.name),false)}<section class="section-wrap section-pad segment-production-intro" id="requirements"><figure>${c.assetImage(needImage,'segment-needs-image',{sizes:'(max-width:800px) 100vw, 48vw'})}</figure><div><span class="eyebrow">${esc(text(c,'YOUR PRODUCTION PRIORITIES','您的生产重点','KEUTAMAAN PENGELUARAN ANDA'))}</span><h2>${esc(content.heading)}</h2><p>${esc(content.body)}</p><ul class="segment-priorities">${content.priorities.map(item=>`<li>${esc(item)}</li>`).join('')}</ul></div></section>${segmentJourney(c,i)}<section class="section-wrap section-pad editorial-section segment-response is-reversed" id="support"><figure>${c.assetImage(responseImage,'editorial-image',{sizes:'(max-width:800px) 100vw, 48vw'})}</figure><div><span class="eyebrow">${esc(text(c,'HOW LS SUPPORTS YOU','LS 如何支持您','CARA LS MENYOKONG ANDA'))}</span><h2 class="section-title">${esc(content.responseTitle)}</h2><p class="body-copy">${esc(content.response)}</p>${c.arrowLink(content.route,text(c,'Explore production support','了解生产支持','Terokai sokongan pengeluaran'))}</div></section><section class="segment-production-paths section-pad" id="solutions"><div class="section-wrap"><div class="section-heading-row"><div><span class="eyebrow">${esc(text(c,'YOUR PRODUCTION PATH','您的生产路径','LALUAN PENGELUARAN ANDA'))}</span><h2 class="section-title">${esc(text(c,'Explore the equipment behind your process.','探索生产工序背后的设备。','Terokai peralatan di sebalik proses anda.'))}</h2></div></div><div class="segment-path-grid">${paths.map(category=>`<a href="#machines/${slug(category.name)}" class="segment-path-card">${c.categoryImage(category)}<h3>${esc(c.localName(category.name))}<span aria-hidden="true">↗</span></h3></a>`).join('')}</div></div></section><section class="section-wrap section-pad segment-food" id="food"><span class="eyebrow">${esc(c.t('navFood'))}</span><h2 class="section-title">${esc(text(c,'Start with the food you make.','从您制作的食品出发。','Bermula dengan makanan anda.'))}</h2>${foodLinks(c)}</section>${inquiryBand(c,segment.name)}</div>`;
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
    return `${photoHero(c,title,lead,image,c.t('navSolutions'),selected==='factory-line-planning'?false:'capability')}${editorial(c,text(c,'Begin with your production requirements','从生产需求开始','Mulakan dengan keperluan pengeluaran'),text(c,'Bring your product, current process and planned changes into the conversation. LS can help you review layout, equipment and support together.','分享您的产品、现有流程与计划中的调整。LS 可协助您一起讨论布局、设备及支持。','Kongsikan produk, proses semasa dan perubahan yang dirancang. LS boleh membantu menyemak susun atur, mesin dan sokongan bersama.'),c.sectionAsset('building'),false,'requirements')}<section class="section-wrap section-pad" id="capabilities"><h2 class="section-title">${esc(c.t('capabilities'))}</h2><div class="tiles-grid">${capabilities.map(item=>`<a class="info-tile capability-card fade-in" href="#solution/${slug(item)}">${c.assetImage(c.sectionAsset('solutions',slug(item)),'capability-image',{sizes:'(max-width:800px) 90vw, 45vw'})}<h3>${esc(c.localName(item))}<span aria-hidden="true"> ↗</span></h3><p>${esc(copy[item])}</p></a>`).join('')}</div><div class="coming-soon"><span>${esc(c.t('aiComing'))}</span><p>${esc(text(c,'AI technology implementation','AI 技术实施','Pelaksanaan teknologi AI'))}</p></div></section>${inquiryBand(c,selected||'Solutions')}<section class="section-wrap section-pad" id="food"><h2 class="section-title">${esc(text(c,'What is your product?','您的产品是什么？','Apakah produk anda?'))}</h2>${foodLinks(c)}</section>`;
  }
  window.LSDesign={home,food,segment,solutions,company,history,customerExperiences,newsSection,inquiryBand,enhance,cleanup};
})();
