(() => {
  'use strict';

  const copy = {
    en: {
      title: 'LS machines, at work.', intro: 'Introductions, production runs and practical know-how from the LS channel.',
      search: 'Search videos, products or model codes', categories: ['All videos','Company','Machines','Production lines','Food applications','Operation & care','Updates'],
      allMachines: 'All machines', allFoods: 'All food applications', results: n => `${n} ${n === 1 ? 'video' : 'videos'}`, empty: 'No videos match those filters.',
      clear: 'Clear filters', play: 'Play video', list: 'Choose a video', source: 'Watch on YouTube', machine: 'Machine', food: 'Food application',
      previous: 'Previous page', next: 'Next page', page: n => `Page ${n}`, introMachine: 'Machine introduction', duration: 'Video length',
      available: 'Video available on the LS YouTube channel', language: 'Video information', category: 'Video category',
      videoLabel: 'LS video player', playHint: 'Select a video to watch it here.',
      preparing: 'The LS video library is being prepared.', preparingHint: 'Video selections are being checked before they are added here.'
    },
    zh: {
      title: 'LS 设备，正在运作。', intro: '来自 LS 频道的设备介绍、生产演示与实用知识。',
      search: '搜索视频、产品或型号', categories: ['全部视频','公司介绍','设备','生产线','食品应用','操作与维护','资讯'],
      allMachines: '全部设备', allFoods: '全部食品应用', results: n => `${n} 个视频`, empty: '没有符合筛选条件的视频。',
      clear: '清除筛选', play: '播放视频', list: '选择视频', source: '在 YouTube 观看', machine: '设备', food: '食品应用',
      previous: '上一页', next: '下一页', page: n => `第 ${n} 页`, introMachine: '设备介绍', duration: '视频长度',
      available: '视频发布于 LS YouTube 频道', language: '视频资料', category: '视频类别',
      videoLabel: 'LS 视频播放器', playHint: '选择视频即可在此观看。',
      preparing: 'LS 视频库正在整理中。', preparingHint: '视频内容正在核实，确认后会在此发布。'
    },
    ms: {
      title: 'Mesin LS, sedang beroperasi.', intro: 'Pengenalan mesin, demonstrasi pengeluaran dan panduan praktikal daripada saluran LS.',
      search: 'Cari video, produk atau kod model', categories: ['Semua video','Syarikat','Mesin','Barisan pengeluaran','Aplikasi makanan','Operasi & penjagaan','Kemas kini'],
      allMachines: 'Semua mesin', allFoods: 'Semua aplikasi makanan', results: n => `${n} video`, empty: 'Tiada video sepadan dengan tapisan ini.',
      clear: 'Kosongkan tapisan', play: 'Mainkan video', list: 'Pilih video', source: 'Tonton di YouTube', machine: 'Mesin', food: 'Aplikasi makanan',
      previous: 'Halaman sebelumnya', next: 'Halaman seterusnya', page: n => `Halaman ${n}`, introMachine: 'Pengenalan mesin', duration: 'Tempoh video',
      available: 'Video tersedia di saluran YouTube LS', language: 'Maklumat video', category: 'Kategori video',
      videoLabel: 'Pemain video LS', playHint: 'Pilih video untuk menontonnya di sini.',
      preparing: 'Pustaka video LS sedang disediakan.', preparingHint: 'Pilihan video sedang disemak sebelum dipaparkan di sini.'
    }
  };

  const englishCategories = ['all','company','machine','production-line','food','operation','updates','unclassified'];
  const categoryCopy = {
    all: ['All videos','全部视频','Semua video'], company: ['Company','公司介绍','Syarikat'], machine: ['Machines','设备','Mesin'],
    'production-line': ['Production lines','生产线','Barisan pengeluaran'], food: ['Food applications','食品应用','Aplikasi makanan'],
    operation: ['Operation & care','操作与维护','Operasi & penjagaan'], updates: ['Updates','资讯','Kemas kini'],
    unclassified: ['Other LS videos','其他 LS 视频','Video LS lain']
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const localeText = (value, language) => typeof value === 'string' ? value : value?.[language] || value?.en || '';
  const youtubeId = value => /^[A-Za-z0-9_-]{11}$/.test(String(value || '')) ? String(value) : '';
  const routeFor = (c, route) => c.routeUrl ? c.routeUrl(route) : window.LSRouter.url(route);
  let activePlayers = new Set();
  let activeEmbed = null;
  const activeMounts = new WeakMap();
  let apiPromise = null;
  let nextPlayerId = 0;

  function recordsFrom(source) {
    const rows = Array.isArray(source) ? source : Array.isArray(source?.videos) ? source.videos : [];
    return rows.filter(video => youtubeId(video.youtubeId || video.id) && video.availability !== 'unavailable' && video.visibility !== 'hidden');
  }

  function getVideos() {
    return recordsFrom(window.LS_VIDEO_LIBRARY?.videos || window.LS_VIDEO_LIBRARY);
  }

  function normalized(video, language) {
    const translated = video.translations?.[language] || video.translations?.en || {};
    const localizedTitle=typeof video.title==='object'?video.title?.[language]||video.title?.en:'';
    const placements=(video.placements||[]).filter(placement=>placement.matchStatus==='exact'&&placement.reviewStatus==='approved'&&placement.evidenceStatus==='verified');
    return {
      ...video,
      id: youtubeId(video.youtubeId || video.id),
      title: translated.title || localizedTitle || video.title || video.sourceTitle || video.originalTitle || '',
      summary: translated.summary || video.summary || '',
      terms: [translated.searchTerms || [], video.searchTerms || [], video.sourceTitle || video.originalTitle || video.title || '', video.sourceDescription || ''].flat().filter(Boolean).join(' '),
      category: video.category || 'unclassified',
      format: video.format || 'landscape',
      machines: video.machines || video.machineNames || placements.map(placement=>placement.machineName).filter(Boolean),
      foods: video.foods || video.foodApplications || []
    };
  }

  function formatDuration(seconds) {
    const total = Number(seconds);
    if (!Number.isFinite(total) || total <= 0) return '';
    const minutes = Math.floor(total / 60);
    return `${minutes}:${String(Math.floor(total % 60)).padStart(2, '0')}`;
  }

  function thumb(video) {
    return `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  }

  function makePlayerApi() {
    if (window.YT?.Player) return Promise.resolve(window.YT);
    if (apiPromise) return apiPromise;
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      let settled = false;
      let timeout;
      const finish = () => {
        if (settled) return;
        if (typeof previous === 'function') { try { previous(); } catch {} }
        if (!window.YT?.Player) { fail(); return; }
        settled = true;
        clearTimeout(timeout);
        if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previous;
        resolve(window.YT);
      };
      const fail = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        if (window.onYouTubeIframeAPIReady === ready) window.onYouTubeIframeAPIReady = previous;
        reject(new Error('The YouTube player is unavailable.'));
      };
      const ready = () => finish();
      window.onYouTubeIframeAPIReady = ready;
      timeout = setTimeout(fail, 12000);
      let script = document.querySelector('script[data-ls-youtube-api]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.lsYoutubeApi = '';
        script.addEventListener('error', fail, { once: true });
        document.head.append(script);
      } else script.addEventListener('error', fail, { once: true });
    }).catch(error => { apiPromise = null; throw error; });
    return apiPromise;
  }

  function page(c) {
    const language = c.language || 'en';
    const words = copy[language] || copy.en;
    const languageIndex = language === 'zh' ? 1 : language === 'ms' ? 2 : 0;
    const categories = englishCategories.map((key, index) => `<button type="button" class="video-category-button${index === 0 ? ' is-active' : ''}" data-video-category="${key}" aria-pressed="${index === 0 ? 'true' : 'false'}">${esc(categoryCopy[key][languageIndex])}</button>`).join('');
    const machines = [...new Set(getVideos().flatMap(video => (video.machines || video.machineNames || []).map(item => typeof item === 'string' ? item : item.name).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
    const machineOptions = machines.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
    const foods = [...new Set(getVideos().flatMap(video => (video.foods || video.foodApplications || []).map(item => typeof item === 'string' ? item : item.name).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
    const foodOptions = foods.map(name => `<option value="${esc(name)}">${esc(name)}</option>`).join('');
    return `<section class="video-library-page section-wrap section-pad" aria-labelledby="video-library-title">
      <header class="video-library-heading"><div><h1 class="display-title" id="video-library-title">${esc(words.title)}</h1><p class="lede">${esc(words.intro)}</p></div><a class="arrow-link" href="https://www.youtube.com/@lssmartmachinery/videos" target="_blank" rel="noopener noreferrer">${esc(words.available)} ↗</a></header>
      <div class="video-library-tools"><label class="video-search-label"><span class="sr-only">${esc(words.search)}</span><input type="search" name="video-query" data-video-query placeholder="${esc(words.search)}" autocomplete="off"></label><label class="video-machine-filter"><span class="sr-only">${esc(words.machine)}</span><select data-video-machine><option value="">${esc(words.allMachines)}</option>${machineOptions}</select></label><label class="video-food-filter"><span class="sr-only">${esc(words.food)}</span><select data-video-food><option value="">${esc(words.allFoods)}</option>${foodOptions}</select></label></div>
      <div class="video-category-filter" role="group" aria-label="${esc(words.category)}">${categories}</div>
      <p class="video-result-count" data-video-count aria-live="polite"></p>
      <div class="video-library-layout"><section class="video-feature" aria-label="${esc(words.videoLabel)}" data-video-feature></section><aside class="video-list-panel" aria-labelledby="video-list-title"><h2 id="video-list-title">${esc(words.list)}</h2><div class="video-list" data-video-list></div><nav class="video-pagination" aria-label="${esc(words.list)}" data-video-pagination></nav></aside></div>
    </section>`;
  }

  function summaryFor(video, words) {
    return video.summary || words.playHint;
  }

  function featureMarkup(video, words) {
    const originalTitle = video.sourceTitle || video.originalTitle || video.title;
    const duration = formatDuration(video.durationSeconds);
    const image = `<img src="${thumb(video)}" alt="" loading="eager" width="480" height="360" data-video-poster>`;
    const playback = `<div class="video-feature-player" data-video-stage data-format="${video.format === 'short' ? 'short' : 'landscape'}"><button class="video-play-button" type="button" data-video-play="${video.id}" aria-label="${esc(words.play)}: ${esc(video.title)}">${image}<span aria-hidden="true" class="video-play-mark"></span></button><p class="video-player-fallback" data-video-fallback hidden></p></div>`;
    const tags = [video.category && categoryCopy[video.category] ? categoryCopy[video.category][video.languageIndex || 0] : ''].filter(Boolean);
    return `${playback}<div class="video-feature-copy"><div class="video-feature-meta">${tags.map(tag=>`<span>${esc(tag)}</span>`).join('')}${duration?`<span>${esc(duration)}</span>`:''}</div><h2>${esc(video.title)}</h2>${originalTitle && originalTitle !== video.title ? `<p class="video-source-title">${esc(originalTitle)}</p>`:''}<p class="video-feature-summary">${esc(summaryFor(video,words))}</p><a class="arrow-link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">${esc(words.source)} ↗</a></div>`;
  }

  function rowMarkup(video, selected, words) {
    const duration = formatDuration(video.durationSeconds);
    const formatClass = video.format === 'short' ? ' is-short' : '';
    return `<button type="button" class="video-list-item${selected?' is-selected':''}" data-video-select="${video.id}" aria-pressed="${selected?'true':'false'}"><span class="video-list-poster${formatClass}"><img src="${thumb(video)}" alt="" loading="lazy" width="480" height="360"><span>${esc(duration)}</span></span><span class="video-list-copy"><strong>${esc(video.title)}</strong><small>${esc(categoryCopy[video.category]?.[video.languageIndex || 0] || words.language)}</small></span><span class="video-list-arrow" aria-hidden="true">↗</span></button>`;
  }

  function mount(main, c) {
    const root = main.querySelector('.video-library-page');
    if (!root) return;
    activeMounts.get(root)?.();
    const language = c.language || 'en';
    const words = copy[language] || copy.en;
    const input = root.querySelector('[data-video-query]');
    const machineFilter = root.querySelector('[data-video-machine]');
    const foodFilter = root.querySelector('[data-video-food]');
    const list = root.querySelector('[data-video-list]');
    const feature = root.querySelector('[data-video-feature]');
    const count = root.querySelector('[data-video-count]');
    const pagination = root.querySelector('[data-video-pagination]');
    const categoryButtons = [...root.querySelectorAll('[data-video-category]')];
    const pageSize = 12;
    const params = new URLSearchParams(location.search);
    const state = { query: params.get('q') || '', category: englishCategories.includes(params.get('category')) ? params.get('category') : 'all', machine: params.get('machine') || '', food: params.get('food') || '', page: Math.max(1, Number(params.get('page')) || 1), selected: youtubeId(params.get('v')) };
    const all = getVideos().map(video => ({ ...normalized(video, language), languageIndex: language === 'zh' ? 1 : language === 'ms' ? 2 : 0 }));
    root.classList.toggle('is-library-empty', !all.length);
    const machineNames = [...new Set(all.flatMap(video => video.machines.map(item => typeof item === 'string' ? item : item.name).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
    const foodNames = [...new Set(all.flatMap(video => video.foods.map(item => typeof item === 'string' ? item : item.name).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
    machineFilter.innerHTML = `<option value="">${esc(words.allMachines)}</option>${machineNames.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}`;
    foodFilter.innerHTML = `<option value="">${esc(words.allFoods)}</option>${foodNames.map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}`;
    input.value = state.query;
    machineFilter.value = state.machine;
    foodFilter.value = state.food;
    state.machine = machineFilter.value;
    state.food = foodFilter.value;
    let shown = [];

    const syncUrl = () => {
      const next = new URL(location.href);
      for (const key of ['q','category','machine','food','page','v']) next.searchParams.delete(key);
      if (state.query.trim()) next.searchParams.set('q', state.query.trim());
      if (state.category !== 'all') next.searchParams.set('category', state.category);
      if (state.machine) next.searchParams.set('machine', state.machine);
      if (state.food) next.searchParams.set('food', state.food);
      if (state.page > 1) next.searchParams.set('page', String(state.page));
      if (state.selected) next.searchParams.set('v', state.selected);
      history.replaceState(history.state, '', next);
    };
    const drawFeature = () => {
      if(activeEmbed){try{activeEmbed.destroy();}catch{}activeEmbed=null;}
      const item = all.find(video => video.id === state.selected) || shown[0];
      if (!item) {
        feature.innerHTML = all.length
          ? `<div class="video-feature-empty"><strong>${esc(words.empty)}</strong><button type="button" class="video-clear-button" data-video-clear>${esc(words.clear)}</button></div>`
          : `<div class="video-feature-empty video-library-preparing"><strong>${esc(words.preparing)}</strong><p>${esc(words.preparingHint)}</p><a class="arrow-link" href="https://www.youtube.com/@lssmartmachinery/videos" target="_blank" rel="noopener noreferrer">${esc(words.available)} ↗</a></div>`;
        state.selected = '';
        return;
      }
      state.selected = item.id;
      feature.innerHTML = featureMarkup(item, words);
    };
    const draw = () => {
      const query = state.query.trim().toLocaleLowerCase();
      shown = all.filter(video => {
        const matchesCategory = state.category === 'all' || video.category === state.category;
        const machineNames = video.machines.map(item => typeof item === 'string' ? item : item.name);
        const foodNames = video.foods.map(item => typeof item === 'string' ? item : item.name);
        const matchesMachine = !state.machine || machineNames.includes(state.machine);
        const matchesFood = !state.food || foodNames.includes(state.food);
        const matchesQuery = !query || `${video.title} ${video.terms} ${machineNames.join(' ')} ${foodNames.join(' ')}`.toLocaleLowerCase().includes(query);
        return matchesCategory && matchesMachine && matchesFood && matchesQuery;
      });
      const totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
      state.page = Math.min(Math.max(1, state.page), totalPages);
      if (!shown.some(item => item.id === state.selected)) state.selected = shown[(state.page - 1) * pageSize]?.id || shown[0]?.id || '';
      count.textContent = all.length ? words.results(shown.length) : words.preparing;
      list.innerHTML = shown.length
        ? shown.slice((state.page - 1) * pageSize, state.page * pageSize).map(item => rowMarkup(item, item.id === state.selected, words)).join('')
        : all.length
          ? `<div class="video-list-empty"><p>${esc(words.empty)}</p><button type="button" class="video-clear-button" data-video-clear>${esc(words.clear)}</button></div>`
          : `<div class="video-list-empty"><p>${esc(words.preparingHint)}</p></div>`;
      pagination.innerHTML = totalPages > 1 ? `<button type="button" data-video-page="-1" ${state.page===1?'disabled':''} aria-label="${esc(words.previous)}">←</button><span aria-current="page">${esc(words.page(state.page))} / ${totalPages}</span><button type="button" data-video-page="1" ${state.page===totalPages?'disabled':''} aria-label="${esc(words.next)}">→</button>` : '';
      categoryButtons.forEach(button => { const active = button.dataset.videoCategory === state.category; button.classList.toggle('is-active', active); button.setAttribute('aria-pressed', String(active)); });
      drawFeature();
      syncUrl();
    };
    const controller = new AbortController();
    const restoreKey = `ls-video-library-return:${language}`;
    const mountedHref = `${location.pathname}${location.search}`;
    window.addEventListener('ls:navigate', () => {
      try { sessionStorage.setItem(restoreKey, JSON.stringify({ href: mountedHref, scrollY: window.scrollY, listY: list.scrollTop })); } catch {}
    }, {signal:controller.signal});
    input.addEventListener('input', () => { state.query=input.value;state.page=1;draw(); }, {signal:controller.signal});
    machineFilter.addEventListener('change', () => { state.machine=machineFilter.value;state.page=1;draw(); }, {signal:controller.signal});
    foodFilter.addEventListener('change', () => { state.food=foodFilter.value;state.page=1;draw(); }, {signal:controller.signal});
    root.addEventListener('click', event => {
      const category = event.target.closest('[data-video-category]');
      if (category) { state.category=category.dataset.videoCategory;state.page=1;draw();return; }
      const select = event.target.closest('[data-video-select]');
      if (select) { state.selected=select.dataset.videoSelect;draw();feature.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});return; }
      const step = event.target.closest('[data-video-page]');
      if (step && !step.disabled) { state.page += Number(step.dataset.videoPage);draw();list.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});return; }
      if (event.target.closest('[data-video-clear]')) { state.query='';state.category='all';state.machine='';state.food='';state.page=1;input.value='';machineFilter.value='';foodFilter.value='';draw();input.focus();return; }
      const play = event.target.closest('[data-video-play]');
      if (play) playVideo(play.dataset.videoPlay, feature, words);
    }, {signal:controller.signal});
    draw();
    try {
      const saved = JSON.parse(sessionStorage.getItem(restoreKey) || 'null');
      if (saved?.href === `${location.pathname}${location.search}`) {
        sessionStorage.removeItem(restoreKey);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          window.scrollTo({top:saved.scrollY || 0,behavior:'instant'});
          list.scrollTop = saved.listY || 0;
        }));
      }
    } catch {}
    const mounted={destroy:()=>{controller.abort();feature.querySelectorAll('iframe').forEach(frame=>{frame.src='about:blank';frame.remove();});}};
    activeMounts.set(root,mounted.destroy);
    activePlayers.add(mounted);
  }

  function playVideo(id, feature, words) {
    if(activeEmbed){try{activeEmbed.destroy();}catch{}activeEmbed=null;}
    const item = getVideos().find(video => youtubeId(video.youtubeId || video.id) === id);
    const stage = feature.querySelector('[data-video-stage]');
    if (!item || !stage) return;
    const host = document.createElement('div');
    host.id = `ls-video-player-${++nextPlayerId}`;
    host.className = 'video-api-host';
    stage.replaceChildren(host);
    stage.dataset.videoState = 'loading';
    const fallback = message => {
      if (!stage.isConnected) return;
      stage.dataset.videoState = 'failed';
      stage.innerHTML = `<div class="video-load-fallback"><p>${esc(message || words.playHint)}</p><a class="arrow-link" href="https://www.youtube.com/watch?v=${id}" target="_blank" rel="noopener noreferrer">${esc(words.source)} ↗</a></div>`;
    };
    makePlayerApi().then(YT => {
      if (!stage.isConnected) return;
      const player = new YT.Player(host.id, {
        width: '100%', height: '100%', videoId: id,
        playerVars: { autoplay: 1, controls: 1, playsinline: 1, rel: 0, origin: location.origin },
        events: {
          onReady: event => { stage.dataset.videoState='ready'; event.target.playVideo(); },
          onError: () => fallback(words.playHint),
          onStateChange: event => { if (event.data === YT.PlayerState.PLAYING) stage.dataset.videoState='playing'; }
        }
      });
      activeEmbed={destroy:()=>{try{player.destroy();}catch{}},stage};
      activePlayers.add(activeEmbed);
    }).catch(() => fallback(words.playHint));
  }

  function machineSection(c, item) {
    const route = `machine/${String(item.name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
    const rows = getVideos().map(video => ({ video, placement: (video.placements || []).find(value => value.route === route && value.matchStatus === 'exact' && ((value.reviewStatus === 'approved' && value.evidenceStatus === 'verified' && value.placementStatus === 'approved') || Boolean(value.video?.sourceUrl))) })).filter(row => row.placement);
    if (!rows.length) return '';
    const heading = c.language === 'zh' ? '设备演示与操作' : c.language === 'ms' ? 'Demonstrasi dan operasi mesin' : 'See the machine in operation';
    const intro = c.language === 'zh' ? '观看已核实与此型号相关的 LS 演示。' : c.language === 'ms' ? 'Tonton demonstrasi LS yang disahkan untuk model ini.' : 'Watch LS demonstrations verified for this model.';
    return `<section class="section-wrap section-pad machine-video-demonstrations" aria-labelledby="machine-video-title"><div class="section-heading-row"><div><span class="eyebrow">${esc(c.t('application'))}</span><h2 id="machine-video-title" class="section-title">${esc(heading)}</h2></div><p class="body-copy">${esc(intro)}</p></div><div class="machine-video-list">${rows.sort((a,b)=>(a.placement.sortOrder||0)-(b.placement.sortOrder||0)).map(({video,placement})=>{const translation=placement.translations?.[c.language]||placement.translations?.en||{};const videoTranslation=video.translations?.[c.language]||video.translations?.en||{};const title=translation.title||videoTranslation.title||video.title||video.sourceTitle;const summary=placement.summary||translation.summary||'';const id=video.youtubeId||video.id;return `<article><a class="machine-video-thumb" href="${esc(routeFor(c,`videos?v=${id}`))}" aria-label="${esc(title)}"><img class="machine-video-image" src="${esc(thumb({id}))}" alt="" loading="lazy" width="480" height="360"><span aria-hidden="true">▶</span></a><div><h3><a href="${esc(routeFor(c,`videos?v=${id}`))}">${esc(title)}</a></h3><p>${esc(summary)}</p></div></article>`;}).join('')}</div></section>`;
  }

  function applyLibrary(main, record, language) {
    const rows = record?.fields?.data?.videos;
    if (!Array.isArray(rows)) return;
    window.LS_VIDEO_LIBRARY = { videos: rows };
    const root = main?.querySelector('.video-library-page');
    if (root) mount(main, { language, routeUrl: route => window.LSRouter.url(route) });
  }

  function applyMachine(main, record, language) {
    const rows = record?.fields?.data?.videoPlacements;
    if (!Array.isArray(rows) || !main) return;
    main.querySelector('.machine-video-demonstrations')?.remove();
    const itemName = main.querySelector('.machine-subtitle')?.textContent || '';
    const item = window.LS_CATALOGUE?.categories.flatMap(category=>category.items||(category.subcategories||[]).flatMap(sub=>sub.items.map(row=>({...row,subcategory:sub.name})))).find(row=>row.name===itemName || row.name===main.querySelector('.machine-page-hero h1')?.textContent);
    if (!item) return;
    const current = getVideos();
    const merged = rows.map(placement=>{
      const video = placement.video || current.find(candidate=>(candidate.youtubeId||candidate.id)===placement.youtubeId);
      return video ? { ...video, placements:[...(video.placements||[]),{...placement,translations:placement.translations||{},video:placement.video,route:`machine/${item.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`}]} : null;
    }).filter(Boolean);
    const byId = new Map(current.map(video=>[video.youtubeId||video.id,video]));
    for (const video of merged) {
      const id=video.youtubeId||video.id;
      const existing=byId.get(id);
      byId.set(id,existing?{...existing,...video,placements:[...(existing.placements||[]),...(video.placements||[])]}:video);
    }
    window.LS_VIDEO_LIBRARY = { videos:[...byId.values()] };
    const section = machineSection({language,t:key=>key,assetImage:(src,cls,options={})=>`<img class="${esc(cls)}" src="${esc(src)}" alt="${esc(options.alt||'')}" loading="lazy" width="480" height="360">`},item);
    const anchor=main.querySelector('.product-features')?.closest('#features')||main.querySelector('#configuration')||main.querySelector('#suitability');
    if (section) anchor?.insertAdjacentHTML(anchor.id==='suitability'?'beforebegin':'afterend',section);
  }

  function cleanup() {
    for (const player of activePlayers) { try { player.destroy(); } catch {} }
    activePlayers = new Set();
    activeEmbed=null;
  }

  window.LSVideos = Object.freeze({ page, mount, machineSection, applyLibrary, applyMachine, cleanup, getVideos });
})();
