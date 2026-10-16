(() => {
  "use strict";

  let config = {};
  let dispose = () => {};
  let transitionNumber = 0;
  let curtain = null;
  let curtainAnimation = null;
  const journeyStorageKey = "ls-production-journey-stage-v1";
  const validJourneyStages = new Set(["appointment", "planning", "order-placement", "installation", "technology-transfer", "after-sales"]);
  function stageFromLocation() {
    const hashQuery = location.hash.includes("?") ? location.hash.slice(location.hash.indexOf("?") + 1) : "";
    const value = new URLSearchParams(hashQuery || location.search).get("journeyStage");
    return validJourneyStages.has(value) ? value : "";
  }
  function getJourneyStage() {
    const fromUrl = stageFromLocation();
    if (fromUrl) return fromUrl;
    try {
      const saved = sessionStorage.getItem(journeyStorageKey);
      return validJourneyStages.has(saved) ? saved : "";
    } catch { return ""; }
  }
  function setJourneyStage(value) {
    if (!validJourneyStages.has(value)) return;
    try { sessionStorage.setItem(journeyStorageKey, value); } catch {}
    window.dispatchEvent(new CustomEvent("ls:journey-stage", { detail: { stage: value } }));
  }
  function clearJourneyStage() {
    try { sessionStorage.removeItem(journeyStorageKey); } catch {}
    const current=new URL(location.href);
    current.searchParams.delete("journeyStage");
    if(current.hash.includes("?")){
      const [anchor,query]=current.hash.split("?",2),params=new URLSearchParams(query);
      params.delete("journeyStage");
      current.hash=anchor+(params.size?"?"+params.toString():"");
    }
    history.replaceState(history.state,"",current.pathname+current.search+current.hash);
    window.dispatchEvent(new CustomEvent("ls:journey-stage", { detail: { stage: "" } }));
  }
  function withJourneyStage(href, value = getJourneyStage()) {
    if (!value || !validJourneyStages.has(value)) return href;
    const raw = String(href || "");
    if (/^(mailto:|https?:\/\/wa\.me|whatsapp:)/i.test(raw)) return raw;
    const queryAt = raw.indexOf("?");
    const base = queryAt < 0 ? raw : raw.slice(0, queryAt);
    const params = new URLSearchParams(queryAt < 0 ? "" : raw.slice(queryAt + 1));
    params.set("journeyStage", value);
    return `${base}?${params.toString()}`;
  }
  window.LSJourney = Object.freeze({ getStage: getJourneyStage, setStage: setJourneyStage, clearStage: clearJourneyStage, withStage: withJourneyStage });
  const motionAllowed = () => typeof config.motionAllowed === "function" ? Boolean(config.motionAllowed()) : !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const text = (en, zh, ms) => config.language === "zh" ? zh : config.language === "ms" ? ms : en;

  function mount(nextConfig = {}) {
    dispose();
    config = nextConfig;
    const main = config.main || document.getElementById("main");
    if (!main) return;
    const controller = new AbortController();
    const cleanups = [];
    const listen = (element, event, handler, options = {}) => element.addEventListener(event, handler, { ...options, signal: controller.signal });
    const headerOffset = () => (document.querySelector(".site-header, #header, header")?.getBoundingClientRect().height || 72) + 24;
    dispose = () => {
      controller.abort();
      cleanups.forEach((cleanup) => cleanup());
    };

    main.querySelectorAll("[data-journey-picker]").forEach((picker) => {
      const buttons = [...picker.querySelectorAll("[data-journey-stage]")];
      const panels = [...picker.querySelectorAll("[data-journey-guidance]")];
      const empty = picker.querySelector("[data-journey-empty]");
      const status = picker.querySelector("[data-journey-status]");
      let clearButton=picker.querySelector("[data-journey-clear]");
      if(!clearButton){
        clearButton=document.createElement("button");clearButton.type="button";clearButton.className="pp-journey-clear";clearButton.dataset.journeyClear="";clearButton.textContent=text("Clear selection","清除选择","Kosongkan pilihan");clearButton.hidden=true;
        picker.querySelector(".pp-journey-steps")?.after(clearButton);
      }
      const timers = new Map();
      function reflect(value, announce = false) {
        const selected = validJourneyStages.has(value) ? value : "";
        main.querySelectorAll("[data-journey-field]").forEach((field) => { field.value = selected; });
        buttons.forEach((button) => {
          const active = button.dataset.journeyStage === selected;
          button.setAttribute("aria-pressed", String(active));
          button.classList.toggle("is-selected", active);
          const node = button.querySelector(".pp-journey-node");
          if (!node) return;
          clearTimeout(timers.get(node));
          node.classList.remove("is-just-selected");
          if (active && announce && motionAllowed()) {
            void node.offsetWidth;
            node.classList.add("is-just-selected");
            timers.set(node, setTimeout(() => node.classList.remove("is-just-selected"), 560));
          }
        });
        panels.forEach((panel) => {
          const active = panel.dataset.journeyGuidance === selected;
          panel.hidden = !active;
          panel.inert = !active;
        });
        if (empty) empty.hidden = Boolean(selected);
        if (clearButton) clearButton.hidden=!selected;
        if (status) {
          status.hidden = !selected;
          status.textContent = selected ? text(
            `Your stated need: ${buttons.find((button) => button.dataset.journeyStage === selected)?.textContent.trim() || ""}. This is not project tracking.`,
            `您陈述的需求：${buttons.find((button) => button.dataset.journeyStage === selected)?.textContent.trim() || ""}。此选择并非项目进度记录。`,
            `Keperluan yang anda nyatakan: ${buttons.find((button) => button.dataset.journeyStage === selected)?.textContent.trim() || ""}. Ini bukan status projek yang dijejaki.`
          ) : "";
        }
        picker.querySelectorAll("[data-journey-action]").forEach((link) => {
          link.dataset.journeyBase ||= link.getAttribute("href") || "#inquiry?intent=consult";
          link.href = selected ? withJourneyStage(link.dataset.journeyBase, selected) : link.dataset.journeyBase;
        });
      }
      buttons.forEach((button) => listen(button, "click", () => {
        setJourneyStage(button.dataset.journeyStage);
        reflect(button.dataset.journeyStage, true);
      }));
      if(clearButton)listen(clearButton,"click",clearJourneyStage);
      listen(window, "ls:journey-stage", (event) => reflect(event.detail?.stage || ""));
      reflect(getJourneyStage());
      cleanups.push(() => timers.forEach((timer) => clearTimeout(timer)));
    });

    main.querySelectorAll("[data-segment-picker]").forEach((picker, pickerNumber) => {
      const buttons = [...picker.querySelectorAll("button[data-segment-index]")];
      const panels = [...picker.querySelectorAll("[data-segment-panel]")];
      const photos = [...picker.querySelectorAll("[data-segment-image]")];
      function choose(value) {
        buttons.forEach((button) => {
          const active = button.dataset.segmentIndex === value;
          button.setAttribute("aria-expanded", String(active));
          button.classList.toggle("is-active", active);
          button.closest(".segment-option, .segment-item, .segment-picker-item")?.classList.toggle("is-active", active);
          const icon = button.querySelector('.circle-plus');
          if (icon) icon.textContent = active ? '−' : '+';
        });
        panels.forEach((panel) => {
          const active = panel.dataset.segmentPanel === value;
          panel.hidden = !active;
          panel.inert = !active;
          panel.classList.toggle("is-active", active);
        });
        photos.forEach((photo) => {
          const active = photo.dataset.segmentImage === value;
          // Both images stay painted so CSS can crossfade without changing layout.
          photo.classList.toggle("is-active", active);
          photo.classList.toggle("active", active);
          photo.setAttribute("aria-hidden", String(!active));
          photo.inert = !active;
        });
      }
      buttons.forEach((button, index) => {
        const panel = panels.find((item) => item.dataset.segmentPanel === button.dataset.segmentIndex);
        if (panel) {
          panel.id ||= `ls-segment-${pickerNumber}-${index}`;
          button.id ||= `ls-segment-trigger-${pickerNumber}-${index}`;
          button.setAttribute("aria-controls", panel.id);
          panel.setAttribute("aria-labelledby", button.id);
        }
        listen(button, "click", () => choose(button.dataset.segmentIndex));
        listen(button, "keydown", (event) => {
          if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const target = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[target].focus();
        });
      });
      const initial = buttons.find((button) => button.getAttribute("aria-expanded") === "true") || buttons[0];
      if (initial) choose(initial.dataset.segmentIndex);
    });

    main.querySelectorAll("[data-capability-explorer]").forEach((explorer, explorerNumber) => {
      const tabs = [...explorer.querySelectorAll("[data-capability-tab]")];
      const panels = [...explorer.querySelectorAll("[data-capability-panel]")];
      const photos = [...explorer.querySelectorAll("[data-capability-photo]")];
      function choose(value) {
        tabs.forEach((tab) => {
          const selected = tab.dataset.capabilityTab === value;
          tab.setAttribute("aria-selected", String(selected));
          tab.tabIndex = selected ? 0 : -1;
          tab.classList.toggle("is-active", selected);
        });
        panels.forEach((panel) => {
          const selected = panel.dataset.capabilityPanel === value;
          panel.hidden = !selected;
          panel.inert = !selected;
        });
        photos.forEach((photo) => {
          const selected = photo.dataset.capabilityPhoto === value;
          photo.classList.toggle("is-active", selected);
          photo.setAttribute("aria-hidden", String(!selected));
          photo.inert = !selected;
        });
      }
      tabs.forEach((tab, index) => {
        const panel = panels.find((item) => item.dataset.capabilityPanel === tab.dataset.capabilityTab);
        if (panel) {
          panel.id ||= `ls-capability-panel-${explorerNumber}-${index}`;
          tab.id ||= `ls-capability-tab-${explorerNumber}-${index}`;
          tab.setAttribute("aria-controls", panel.id);
          panel.setAttribute("aria-labelledby", tab.id);
        }
        listen(tab, "click", () => choose(tab.dataset.capabilityTab));
        listen(tab, "keydown", (event) => {
          if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const target = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
          tabs[target].focus();
          choose(tabs[target].dataset.capabilityTab);
        });
      });
      const initial = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
      if (initial) choose(initial.dataset.capabilityTab);
    });

    main.querySelectorAll("[data-process]").forEach((process, processNumber) => {
      const buttons = [...process.querySelectorAll("button[data-process-index]")];
      function choose(value) {
        buttons.forEach((button) => {
          const active = button.dataset.processIndex === value;
          const step = button.closest(".process-step");
          const content = step?.querySelector(".process-content");
          button.setAttribute("aria-expanded", String(active));
          button.classList.toggle("is-active", active);
          step?.classList.toggle("is-active", active);
          if (content) { content.hidden = !active; content.inert = !active; }
        });
      }
      buttons.forEach((button, index) => {
        const content = button.closest(".process-step")?.querySelector(".process-content");
        if (content) {
          content.id ||= `ls-process-${processNumber}-${index}`;
          button.id ||= `ls-process-trigger-${processNumber}-${index}`;
          button.setAttribute("aria-controls", content.id);
          content.setAttribute("aria-labelledby", button.id);
        }
        listen(button, "click", () => choose(button.dataset.processIndex));
        listen(button, "keydown", (event) => {
          if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const target = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[target].focus();
          choose(buttons[target].dataset.processIndex);
        });
      });
      const initial = buttons.find((button) => button.getAttribute("aria-expanded") === "true") || buttons[0];
      if (initial) choose(initial.dataset.processIndex);
    });

    main.querySelectorAll('[data-client-carousel]').forEach(carousel => {
      const viewport=carousel.querySelector('.client-strip-viewport'),track=carousel.querySelector('[data-client-track]'),items=[...(track?.children||[])];
      if(!viewport||!track||!items.length)return;
      let offset=0,frame=0,last=0,visible=false,hovered=false,step=1,loop=1;
      let copies=[];
      const draw=()=>{track.style.transform='translate3d('+(-offset)+'px,0,0)';items.forEach(item=>{item.setAttribute('aria-hidden','false');item.inert=false;});};
      const measure=()=>{
        const width=items[0].getBoundingClientRect().width,gap=parseFloat(getComputedStyle(track).gap)||0;
        step=width+gap;loop=Math.max(1,step*items.length);offset=((offset%loop)+loop)%loop;
        const groups=Math.ceil(viewport.clientWidth/loop)+1,needed=groups*items.length;
        if(copies.length!==needed){copies.forEach(copy=>copy.remove());copies=[];
          for(let index=0;index<needed;index++){const copy=items[index%items.length].cloneNode(true);copy.classList.remove('client-strip-logo');copy.classList.add('client-strip-clone');copy.setAttribute('aria-hidden','true');copy.inert=true;copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));track.append(copy);copies.push(copy);}}
        copies.forEach(copy=>{copy.style.flex='0 0 '+width+'px';copy.style.width=width+'px';});draw();
      };
      const tick=time=>{if(last)offset=(offset+Math.min(time-last,60)*.038)%loop;last=time;draw();frame=requestAnimationFrame(tick);};
      const sync=()=>{cancelAnimationFrame(frame);frame=0;last=0;const running=motionAllowed()&&!hovered&&visible&&!document.hidden&&items.length>1;carousel.dataset.running=String(running);if(running)frame=requestAnimationFrame(tick);};
      track.style.transition='none';carousel.setAttribute('aria-roledescription','carousel');
      listen(carousel,'pointerenter',()=>{hovered=true;sync();});listen(carousel,'pointerleave',()=>{hovered=false;sync();});
      listen(window,'resize',()=>{measure();sync();});listen(document,'visibilitychange',sync);listen(window,'ls:motion-change',sync);
      const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.1});observer.observe(carousel);measure();sync();cleanups.push(()=>{cancelAnimationFrame(frame);observer.disconnect();copies.forEach(copy=>copy.remove());});
    });

    const progress = main.querySelector("[data-story-progress-bar]");
    const story = main.querySelector(".history-story");
    if (progress && story) {
      let frame = 0;
      const updateProgress = () => {
        frame = 0;
        const bounds = story.getBoundingClientRect();
        const start = window.scrollY + bounds.top - headerOffset();
        const total = Math.max(1, bounds.height - innerHeight + headerOffset());
        progress.style.width = `${Math.min(1, Math.max(0, (window.scrollY - start) / total)) * 100}%`;
      };
      const queueProgress = () => { if (!frame) frame = requestAnimationFrame(updateProgress); };
      listen(window, "scroll", queueProgress, { passive: true });
      listen(window, "resize", queueProgress);
      updateProgress();
      cleanups.push(() => cancelAnimationFrame(frame));
    }

    function scrollToSection(id) {
      const section = document.getElementById(id);
      if (!section || !main.contains(section)) return;
      const heading = section.querySelector("h2") || section;
      if (!heading.hasAttribute("tabindex")) {
        heading.setAttribute("tabindex", "-1");
        listen(heading, "blur", () => heading.removeAttribute("tabindex"), { once: true });
      }
      heading.focus({ preventScroll: true });
      window.scrollTo({ top: Math.max(0, window.scrollY + section.getBoundingClientRect().top - headerOffset()), behavior: motionAllowed() ? "smooth" : "instant" });
    }

    const kind = String(config.route || "").replace(/^#/, "").split("/")[0];
    if (["machine", "food", "segment", "solution"].includes(kind)) {
      const sections = [...main.querySelectorAll("section[id]")].filter((section) => section.querySelector("h2"));
      if (sections.length) {
        const index = document.createElement("aside");
        index.className = "section-index";
        index.setAttribute("aria-label", text("On this page", "本页内容", "Pada halaman ini"));
        const title = document.createElement("span");
        title.className = "section-index-title";
        title.textContent = main.querySelector("h1")?.textContent.trim() || text("Explore", "浏览", "Terokai");
        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "section-index-toggle";
        toggle.setAttribute("aria-controls", "ls-section-index-panel");
        toggle.textContent = text("On this page", "本页内容", "Pada halaman ini");
        const panel = document.createElement("nav");
        panel.className = "section-index-panel";
        panel.id = "ls-section-index-panel";
        panel.setAttribute("aria-label", text("Page sections", "页面章节", "Bahagian halaman"));
        const links = sections.map((section) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "section-index-link";
          button.dataset.scrollTarget = section.id;
          button.textContent = section.dataset.indexLabel || section.querySelector("h2").textContent.trim();
          panel.append(button);
          return button;
        });
        index.append(title, toggle, panel);
        document.body.append(index);
        cleanups.push(() => index.remove());
        const compact = matchMedia("(max-width: 800px)");
        let expanded = false;
        function setExpanded(value) {
          expanded = value;
          toggle.setAttribute("aria-expanded", String(expanded));
          index.classList.toggle("is-expanded", expanded);
          panel.hidden = compact.matches && !expanded;
        }
        setExpanded(false);
        listen(compact, "change", () => setExpanded(false));
        listen(toggle, "click", () => setExpanded(!expanded));
        listen(index, "keydown", (event) => {
          if (event.key === "Escape" && expanded) { event.preventDefault(); setExpanded(false); toggle.focus(); }
        });
        listen(document, "click", (event) => { if (expanded && !index.contains(event.target)) setExpanded(false); });
        links.forEach((button) => listen(button, "click", () => { setExpanded(false); scrollToSection(button.dataset.scrollTarget); }));
        let frame = 0;
        function update() {
          frame = 0;
          const threshold = headerOffset() + Math.min(innerHeight * 0.22, 160);
          let active = 0;
          sections.forEach((section, number) => { if (section.getBoundingClientRect().top <= threshold) active = number; });
          links.forEach((button, number) => {
            button.classList.toggle("is-active", number === active);
            if (number === active) button.setAttribute("aria-current", "location");
            else button.removeAttribute("aria-current");
          });
          const footer = document.getElementById("footer") || document.querySelector("footer");
          const atFooter = Boolean(footer && footer.getBoundingClientRect().top < innerHeight - 24);
          index.classList.toggle("is-hidden", atFooter);
          index.inert = atFooter;
          index.setAttribute("aria-hidden", String(atFooter));
          if (atFooter) setExpanded(false);
        }
        function queueUpdate() { if (!frame) frame = requestAnimationFrame(update); }
        listen(window, "scroll", queueUpdate, { passive: true });
        listen(window, "resize", queueUpdate, { passive: true });
        const resize = typeof ResizeObserver === "function" ? new ResizeObserver(queueUpdate) : null;
        resize?.observe(main);
        cleanups.push(() => { cancelAnimationFrame(frame); resize?.disconnect(); });
        update();
      }
    }

    listen(main, "click", (event) => {
      const anchor = event.target.closest(".machine-tabs a[href^='#'], [data-scroll-to]");
      if (!anchor || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      let id;
      try { id = anchor.dataset.scrollTo || decodeURIComponent(anchor.getAttribute("href").slice(1)); } catch { return; }
      const target = document.getElementById(id);
      if (target && main.contains(target)) { event.preventDefault(); scrollToSection(id); }
    });

    main.querySelectorAll("[data-hero-cycle]").forEach((hero) => {
      const photos = [...hero.querySelectorAll("[data-hero-image], [data-hero-slide]")];
      // This fallback supports a simple image-only composition without wrapper slides.
      if (!photos.length) photos.push(...hero.querySelectorAll("img"));
      const button = hero.querySelector("button[data-hero-pause]");
      let active = Math.max(0, photos.findIndex((photo) => photo.classList.contains("is-active")));
      let userPaused = false;
      let visible = false;
      let interval = 0;
      function show() {
        photos.forEach((photo, number) => {
          photo.classList.toggle("is-active", number === active);
          photo.setAttribute("aria-hidden", String(number !== active));
          photo.inert = number !== active;
        });
        const counter = hero.querySelector('[data-hero-count]');
        if (counter) counter.textContent = `${String(active + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
      }
      function sync() {
        clearInterval(interval);
        const paused = userPaused || !motionAllowed();
        hero.classList.toggle("is-paused", paused);
        if (button) {
          button.setAttribute("aria-pressed", String(paused));
          button.setAttribute("aria-label", paused ? text("Play image sequence", "播放图片序列", "Mainkan turutan imej") : text("Pause image sequence", "暂停图片序列", "Jeda turutan imej"));
          const label = button.querySelector("[data-hero-pause-label]");
          if (label) label.textContent = paused ? text("Play", "播放", "Main") : text("Pause", "暂停", "Jeda");
          button.disabled = !motionAllowed();
          if (!label) button.textContent = paused ? '▶' : 'Ⅱ';
        }
        if (!paused && visible && !document.hidden && photos.length > 1) interval = setInterval(() => { active = (active + 1) % photos.length; show(); }, 5000);
      }
      if (button) listen(button, "click", () => { userPaused = !userPaused; sync(); });
      const observer = new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0.1 });
      observer.observe(hero);
      listen(document, "visibilitychange", sync);
      listen(window, "ls:motion-change", sync);
      show();
      sync();
      cleanups.push(() => { clearInterval(interval); observer.disconnect(); });
    });
  }

  async function transition(renderCallback) {
    const number = ++transitionNumber;
    curtainAnimation?.cancel();
    curtain?.remove();
    curtainAnimation = null;
    curtain = null;
    if (!motionAllowed() || document.hidden || typeof Element.prototype.animate !== "function") {
      renderCallback();
      return true;
    }
    const element = document.createElement("div");
    element.className = "route-curtain";
    element.setAttribute("aria-hidden", "true");
    // Inline safety defaults make transitions independent of stylesheet load order.
    Object.assign(element.style, { position: "fixed", inset: "0", zIndex: "10000", background: "var(--orange, #f05a28)", pointerEvents: "auto", transformOrigin: "bottom" });
    document.body.append(element);
    curtain = element;
    try {
      curtainAnimation = element.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 220, easing: "cubic-bezier(.3,.4,.3,1)", fill: "forwards" });
      await curtainAnimation.finished;
      if (number !== transitionNumber) return false;
      renderCallback();
      if (number !== transitionNumber) return false;
      if (motionAllowed()) {
        curtainAnimation.cancel();
        curtainAnimation = element.animate([{ transform: "translateY(0)" }, { transform: "translateY(-100%)" }], { duration: 400, easing: "cubic-bezier(.3,.4,.3,1)", fill: "forwards" });
        await curtainAnimation.finished;
      }
      return number === transitionNumber;
    } catch (error) {
      // A newer navigation cancels the older animation and its pending render.
      if (error.name !== "AbortError") throw error;
      return false;
    } finally {
      element.remove();
      if (number === transitionNumber) { curtain = null; curtainAnimation = null; }
    }
  }

  window.LSExperience = { mount, transition };
})();
