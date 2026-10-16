(() => {
  "use strict";
  const groups = { food: "navFood", machines: "navMachines", solutions: "navSolutions", services: "navServices", company: "navCompany" };
  const slug = (value) => String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const nameOf = (entry) => typeof entry === "string" ? entry : entry.name;
  let config, header, nav, panel, toggle, backdrop, contactDialog, portal, active = null, drawerOpen = false, initialized = false, menuPinned = false, machineCategory = "";
  const exitTimers = new WeakMap();
  const reducedMotion = () => document.body.classList.contains("motion-paused") || (matchMedia("(prefers-reduced-motion: reduce)").matches && !document.documentElement.classList.contains("motion-opted-in"));
  function exitAnimation(element) {
    if (!element || reducedMotion() || !element.getClientRects().length) return;
    clearTimeout(exitTimers.get(element));
    element.classList.add("ls-is-closing");
    exitTimers.set(element, setTimeout(() => element.classList.remove("ls-is-closing"), 300));
  }
  function cancelExit(element) {
    clearTimeout(exitTimers.get(element));
    element.classList.remove("ls-is-closing");
  }
  const mobile = matchMedia("(max-width: 1000px)");
  const translate = (en, zh, ms) => document.documentElement.lang.startsWith("zh") ? zh : document.documentElement.lang === "ms" ? ms : en;
  const href = (route) => escape(config.urlFor(route));
  const label = (name) => escape(config.localName(name));
  const link = (name, route, className = "") => `<a class="${className}" href="${href(route)}">${label(name)}<span aria-hidden="true">↗</span></a>`;
  const groupTitle = (key) => escape(config.t(groups[key]));
  const machineCategories = () => config.getCategories().slice(0, 5);
  const categoryKey = (category) => slug(nameOf(category));
  function machineCategoryPanel(category,context="desktop") {
    const key = categoryKey(category),prefix=context==="mobile"?"ls-mobile-machine":"ls-machine";
    const items = [...(category.items || []), ...(category.subcategories || []).flatMap((sub) => sub.items || [])];
    const candidates = category.featuredCandidates?.filter((name) => items.some((item) => nameOf(item) === name)) || [];
    const photographed = items.map(nameOf).filter((name) => config.isExactImage(name, category.name));
    const featured = [...new Set([...candidates, ...photographed, ...items.map(nameOf)])].slice(0, 3);
    return `<section class="ls-machine-category-panel" ${key!==machineCategory?'hidden inert':''} role="tabpanel" id="${prefix}-panel-${key}" aria-labelledby="${prefix}-tab-${key}" data-machine-category-panel="${key}"><h3>${link(nameOf(category), `machines/${key}`)}</h3><ul class="ls-machine-featured">${featured.map((name) => `<li><a href="${escape(config.productUrl(name))}">${escape(name)}</a></li>`).join("")}</ul><a class="ls-menu-all" href="${href(`machines/${key}`)}">${escape(config.t("viewAll"))} ${label(nameOf(category))}<span aria-hidden="true">→</span></a></section>`;
  }
  function machineMenu(context="desktop") {
    const categories=machineCategories(),prefix=context==="mobile"?"ls-mobile-machine":"ls-machine";
    return `<div class="ls-machine-menu" data-machine-navigation><div class="ls-machine-category-tabs" role="tablist" aria-orientation="vertical" aria-label="${translate('Choose a machine category','选择机器类别','Pilih kategori mesin')}">${categories.map((cat,index)=>{const key=categoryKey(cat),selected=key===machineCategory;return `<button type="button" role="tab" id="${prefix}-tab-${key}" aria-controls="${prefix}-panel-${key}" aria-selected="${selected}" tabindex="${selected||(!machineCategory&&index===0)?0:-1}" class="ls-machine-category-tab${selected?' is-selected':''}" data-machine-category="${key}">${label(nameOf(cat))}</button>`;}).join('')}</div><div class="ls-machine-panels">${categories.map(cat=>machineCategoryPanel(cat,context)).join('')}</div></div>`;
  }
  function selectMachineCategory(key) {
    if(key&&!machineCategories().some(cat=>categoryKey(cat)===key))return;
    machineCategory=key;
    document.querySelectorAll('[data-machine-navigation]').forEach(root=>{
      root.querySelectorAll('[data-machine-category]').forEach((tab,index)=>{const selected=tab.dataset.machineCategory===key;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected||(!key&&index===0)?0:-1;tab.classList.toggle('is-selected',selected);});
      root.querySelectorAll('[data-machine-category-panel]').forEach(item=>{item.hidden=item.dataset.machineCategoryPanel!==key;item.inert=item.hidden;});
    });
  }
  function contents(key,context="desktop") {
    if (key === "machines") {
      return machineMenu(context);
    }
    if (key === "food") {
      return `<div class="ls-menu-grid ls-menu-foods">${config.getFoods().slice(0, 6).map((food) => {
        const name = nameOf(food);
        return `<a class="ls-menu-food" href="${href(`food/${slug(name)}`)}">${config.assetImage(config.sectionAsset("foods", slug(name)), "ls-menu-food-image", { alt: "", sizes: "(max-width: 1000px) 42vw, 15vw", loading: "lazy" })}<span>${label(name)}</span><span aria-hidden="true">↗</span></a>`;
      }).join("")}</div>`;
    }
    if (key === "solutions") {
      return `<div class="ls-menu-grid ls-menu-solutions"><section class="ls-menu-column"><h3>${escape(config.t("capabilities"))}</h3><ul>${config.getSolutions().map((entry) => `<li>${link(nameOf(entry), `solution/${slug(nameOf(entry))}`)}</li>`).join("")}</ul></section><section class="ls-menu-column ls-menu-segments"><h3>${translate("Your production journey", "您的生产之旅", "Perjalanan pengeluaran anda")}</h3><ul>${config.getSegments().slice(0, 3).map((entry) => `<li>${link(nameOf(entry), `segment/${slug(nameOf(entry))}`)}</li>`).join("")}</ul></section></div>`;
    }
    const entries = key === "services" ? config.getServices() : config.getCompany();
    const prefix = key === "services" ? "service" : "company";
    return `<div class="ls-menu-grid ls-menu-simple ${key === "services" ? "ls-menu-services" : ""}">${entries.map((entry) => {
      const name = nameOf(entry);
      const route = key === "company" ? (name === "About LS" ? "company" : name === "Our History" ? "company/history" : `${prefix}/${slug(name)}`) : `${prefix}/${slug(name)}`;
      return `<div class="ls-menu-column"><h3>${link(name, route)}</h3></div>`;
    }).join("")}</div>`;
  }
  function panelMarkup(key) {
    return `<div class="ls-menu-inner"><div class="ls-menu-heading"><a class="ls-menu-overview" href="${href(key)}">${groupTitle(key)}<span>${escape(config.t("overview"))} <span aria-hidden="true">→</span></span></a><button class="ls-menu-close" type="button" aria-label="${escape(config.t("close"))}"><span aria-hidden="true">×</span></button></div>${contents(key)}</div>`;
  }
  function lockPage(locked) {
    document.body.classList.toggle("ls-navigation-open", locked || Boolean(contactDialog?.open));
    // The mobile drawer is modal; the desktop disclosure retains ordinary tab order.
    for (const element of document.querySelectorAll("#main, #footer")) element.inert = locked && mobile.matches;
  }
  function sync() {
    const open = mobile.matches ? drawerOpen : Boolean(active);
    header.classList.toggle("ls-menu-open", open);
    header.classList.toggle("ls-drawer-open", drawerOpen && mobile.matches);
    backdrop.hidden = !open;
    if (open) cancelExit(backdrop);
    toggle.setAttribute("aria-expanded", String(drawerOpen && mobile.matches));
    toggle.setAttribute("aria-label", drawerOpen ? translate("Close navigation", "关闭导航", "Tutup navigasi") : translate("Open navigation", "打开导航", "Buka navigasi"));
    nav.querySelectorAll(".ls-nav-trigger").forEach((button) => {
      const selected = button.dataset.menu === active && (!mobile.matches || drawerOpen);
      button.setAttribute("aria-expanded", String(selected));
      button.setAttribute("aria-controls", mobile.matches ? `ls-mobile-${button.dataset.menu}` : "ls-desktop-menu");
    });
    panel.classList.toggle("is-open", Boolean(active) && !mobile.matches);
    if (active && !mobile.matches) cancelExit(panel);
    panel.setAttribute("aria-hidden", String(!active || mobile.matches));
    panel.inert = !active || mobile.matches;
    nav.querySelectorAll(".ls-mobile-panel").forEach((element) => {
      const selected = mobile.matches && drawerOpen && element.dataset.group === active;
      if (selected) cancelExit(element);
      else if (!element.hidden && drawerOpen) exitAnimation(element);
      element.hidden = !selected;
      element.inert = !selected;
    });
    nav.inert = mobile.matches && !drawerOpen;
    if (drawerOpen) cancelExit(nav);
    lockPage(open);
  }
  function close(returnFocus = false) {
    const previous = active;
    const wasDrawer = drawerOpen;
    if (active && !mobile.matches) exitAnimation(panel);
    if (drawerOpen && mobile.matches) exitAnimation(nav);
    if (active || drawerOpen) exitAnimation(backdrop);
    active = null;
    drawerOpen = false;
    menuPinned = false;

    selectMachineCategory("");
    sync();
    if (returnFocus) (wasDrawer && mobile.matches ? toggle : nav.querySelector(`.ls-nav-trigger[data-menu="${previous}"]`))?.focus();
  }
  function openGroup(key, pin = true) {
    if (pin && active === key && menuPinned && !mobile.matches) { close(); return; }
    if (pin) menuPinned = true;
    else if (menuPinned) return;
    const changedGroup=active!==key;
    active = key;
    if (key === "machines" && changedGroup) machineCategory = "";
    if (active && !mobile.matches) panel.innerHTML = panelMarkup(active);
    sync();
  }
  function contactMarkup() {
    const destination = portal.getAttribute("href") || "#inquiry";
    const query = new URLSearchParams(destination.split("?")[1] || "");
    const context = query.get("context") || "";
    const choices = [["quote", "askForQuote", translate("Discuss equipment and your production requirements.", "讨论设备与您的生产需求。", "Bincangkan peralatan dan keperluan pengeluaran anda.")], ["consult", "consult", translate("Talk through your process, space and next steps.", "讨论您的流程、空间与下一步计划。", "Bincangkan proses, ruang dan langkah seterusnya.")], ["visit", "visit", translate("Prepare a request to meet the LS team.", "准备与 LS 团队会面的申请。", "Sediakan permintaan untuk bertemu pasukan LS.")]];
    return `<div class="ls-contact-top"><span>LS SMART MACHINERY</span><button class="ls-contact-close ls-menu-close" type="button" aria-label="${escape(config.t("close"))}"><span aria-hidden="true">×</span></button></div><h2 id="ls-contact-title">${translate("Let’s talk about your production.", "聊聊您的生产计划。", "Mari bincangkan pengeluaran anda.")}</h2><p class="ls-contact-intro">${translate("Choose how you would like to connect with LS.", "选择您希望联系 LS 的方式。", "Pilih cara anda ingin menghubungi LS.")}</p>${context ? `<div class="ls-contact-context"><span>${escape(config.t("inquiryMachine"))}</span><strong>${escape(context)}</strong></div>` : ""}${config.inquiryActions({ machine: context, variant: "light" })}<div class="ls-contact-choices">${choices.map(([intent, key, description], index) => { const params = new URLSearchParams(query); params.set("intent", intent); return `<a href="#inquiry?${escape(params.toString())}"><span class="ls-contact-number">0${index + 1}</span><span><strong>${escape(config.t(key))}</strong><small>${description}</small></span><span aria-hidden="true">↗</span></a>`; }).join("")}</div><div class="ls-contact-service"><p>${translate("Need support with your equipment?", "需要设备支持？", "Perlukan sokongan peralatan?")}</p><a href="${href("service/spare-parts-request")}">${escape(config.t("spareParts"))} <span aria-hidden="true">↗</span></a><a href="${href("services")}">${escape(config.t("allServices"))} <span aria-hidden="true">↗</span></a></div>`;
  }
  function closeContact(returnFocus = true) {
    if (!contactDialog.open || contactDialog.classList.contains("ls-contact-closing")) return;
    const finish = () => { contactDialog.close(); contactDialog.classList.remove("ls-contact-closing"); sync(); if (returnFocus) portal.focus(); };
    if (reducedMotion()) finish();
    else {
      contactDialog.classList.add("ls-contact-closing");
      setTimeout(finish, 300);
    }
  }
  function openContact() {
    close();
    contactDialog.innerHTML = contactMarkup();
    contactDialog.showModal();
    contactDialog.scrollTop = 0;
    document.body.classList.add("ls-navigation-open");
    contactDialog.querySelector("button").focus();
  }
  function refresh() {
    if (!initialized) return;
    // Language changes replace the content without altering an open menu's state.
    nav.querySelectorAll(".ls-nav-trigger").forEach((button) => {
      const key = button.dataset.menu;
      nav.querySelector(`.ls-nav-link[data-nav="${key}"]`).innerHTML = groupTitle(key);
      button.innerHTML = '<span class="ls-nav-chevron" aria-hidden="true"></span>';
      button.setAttribute('aria-label', translate(`Toggle ${config.t(groups[key])} menu`, `展开或关闭${config.t(groups[key])}菜单`, `Buka atau tutup menu ${config.t(groups[key])}`));
      const section = nav.querySelector(`#ls-mobile-${key}`);
      section.innerHTML = `<a class="ls-menu-all ls-mobile-overview" href="${href(key)}">${escape(config.t("overview"))}<span aria-hidden="true">→</span></a>${contents(key,"mobile")}`;
    });
    if (active) panel.innerHTML = panelMarkup(active);
    sync();
  }
  function init(options) {
    config = options;
    if (initialized) { refresh(); return; }
    header = document.querySelector(".site-header");
    nav = header.querySelector(".primary-nav");
    panel = header.querySelector(".mega-panel");
    toggle = header.querySelector(".mobile-toggle");
    header.classList.add("ls-header");
    panel.id = "ls-desktop-menu";
    panel.classList.add("ls-desktop-menu");
    panel.setAttribute("aria-label", translate("Explore LS", "探索 LS", "Terokai LS"));
    const actions = header.querySelector(".header-actions");
    actions.classList.add("ls-header-utility");
    const mainRow = document.createElement("div");
    mainRow.className = "ls-header-main";
    portal = actions.querySelector(".portal-button");
    const motionControl = actions.querySelector("[data-motion-toggle]");
    mainRow.append(header.querySelector(".brand"), nav);
    if (portal) mainRow.append(portal);
    if (motionControl) mainRow.append(motionControl);
    mainRow.append(toggle);
    header.prepend(actions, mainRow);
    nav.querySelectorAll("a[data-nav]").forEach((anchor) => {
      const key = anchor.dataset.nav;
      if (!groups[key]) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ls-nav-trigger";
      button.dataset.menu = key;
      button.setAttribute("aria-expanded", "false");
      const item = document.createElement('div');
      item.className = 'ls-nav-item';
      anchor.before(item);
      anchor.className = 'ls-nav-link';
      anchor.removeAttribute('data-i18n');
      item.append(anchor, button);
      const section = document.createElement("div");
      section.className = "ls-mobile-panel";
      section.id = `ls-mobile-${key}`;
      section.dataset.group = key;
      section.hidden = true;
      item.after(section);
    });
    backdrop = document.createElement("div");
    backdrop.className = "ls-navigation-backdrop";
    backdrop.hidden = true;
    backdrop.setAttribute("aria-hidden", "true");
    document.body.append(backdrop);
    contactDialog = document.createElement("dialog");
    contactDialog.className = "ls-contact-drawer";
    contactDialog.id = "ls-contact-drawer";
    contactDialog.setAttribute("aria-labelledby", "ls-contact-title");
    document.body.append(contactDialog);
    if (portal) {
      portal.setAttribute("aria-haspopup", "dialog");
      portal.setAttribute("aria-controls", contactDialog.id);
      portal.addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        openContact();
      });
    }
    contactDialog.addEventListener("cancel", (event) => { event.preventDefault(); closeContact(); });
    contactDialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const items = [...contactDialog.querySelectorAll("a,button")].filter((element) => element.getClientRects().length && !element.disabled);
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    contactDialog.addEventListener("click", (event) => {
      if (event.target.closest(".ls-contact-close")) closeContact();
      else if (event.target.closest("a")) closeContact(false);
      else if (event.target === contactDialog) {
        const bounds = contactDialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeContact();
      }
    });
    backdrop.addEventListener("click", () => close(true));
    toggle.addEventListener("click", () => {
      if (drawerOpen) close(true);
      else { drawerOpen = true; active = null; sync(); nav.querySelector("button")?.focus(); }
    });
    nav.addEventListener("click", (event) => {
      const machineTab = event.target.closest("[data-machine-category]");
      if (machineTab) { selectMachineCategory(machineTab.dataset.machineCategory); return; }
      const button = event.target.closest(".ls-nav-trigger");
      if (button) openGroup(button.dataset.menu);
      // Let native link activation finish before making its ancestors inert.
      else if (event.target.closest("a")) setTimeout(() => close(), 0);
    });
    panel.addEventListener("click", (event) => {
      const machineTab = event.target.closest("[data-machine-category]");
      if (machineTab) { selectMachineCategory(machineTab.dataset.machineCategory, true); return; }
      if (event.target.closest(".ls-menu-close")) close(true);
      else if (event.target.closest("a")) setTimeout(() => close(), 0);
    });
    const previewMachineCategory = (event) => {
      const tab = event.target.closest?.("[data-machine-category]");
      if (!tab) return;
      selectMachineCategory(tab.dataset.machineCategory, false);
    };
    panel.addEventListener("pointerover", (event) => { if (!mobile.matches) previewMachineCategory(event); });
    panel.addEventListener("focusin", previewMachineCategory);
    nav.addEventListener("pointerover", (event) => { if (!mobile.matches) previewMachineCategory(event); });
    nav.addEventListener("focusin", previewMachineCategory);
    const machineTabKeys = (event) => {
      const tab = event.target.closest?.("[data-machine-category]");
      if (!tab || !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
      const tabs = [...(tab.closest("[data-machine-navigation]")?.querySelectorAll("[data-machine-category]") || [])];
      const currentIndex = tabs.indexOf(tab);
      const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (currentIndex + (["ArrowRight","ArrowDown"].includes(event.key) ? 1 : -1) + tabs.length) % tabs.length;
      event.preventDefault();
      tabs[nextIndex]?.focus();
    };
    panel.addEventListener("keydown", machineTabKeys);
    nav.addEventListener("keydown", machineTabKeys);
    panel.addEventListener("pointerleave", () => {
      if (!mobile.matches) selectMachineCategory("");
    });
    header.addEventListener("pointerover", (event) => {
      if (mobile.matches || menuPinned) return;
      const item = event.target.closest(".ls-nav-item");
      const key = item?.querySelector(".ls-nav-trigger")?.dataset.menu;
      if (key) openGroup(key, false);
    });
    header.addEventListener("pointerleave", () => { if (!mobile.matches && active && !menuPinned) close(); });
    header.addEventListener("click", (event) => {
      if (event.target.closest(".brand,.insights-link")) close();
    });
    header.addEventListener("focusout", (event) => {
      if (header.contains(event.relatedTarget)) return;
      // Focus is briefly on body during the transfer; check after it settles.
      setTimeout(() => { if (!mobile.matches && active && !header.contains(document.activeElement)) close(); }, 0);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && (active || drawerOpen)) { event.preventDefault(); close(true); }
      if (event.key !== "Tab" || !mobile.matches || !drawerOpen) return;
      const focusables = [...header.querySelectorAll("a,button,select")].filter((element) => !element.closest("[inert]") && element.getClientRects().length && !element.disabled);
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });
    mobile.addEventListener("change", () => {
      const focusWasInside = nav.contains(document.activeElement) || panel.contains(document.activeElement);
      close();
      if (focusWasInside) (mobile.matches ? toggle : nav.querySelector("button"))?.focus();
    });
    window.addEventListener("hashchange", () => close());
    window.addEventListener("ls:navigate", () => close());
    let scrollPending = false;
    const compactHeader = () => { header.classList.toggle("ls-header-compact", window.scrollY > 40); scrollPending = false; };
    window.addEventListener("scroll", () => { if (!scrollPending) { scrollPending = true; requestAnimationFrame(compactHeader); } }, { passive: true });
    initialized = true;
    compactHeader();
    refresh();
  }
  window.LSNavigation = { init, refresh };
})();
