(() => {
  "use strict";

  const DATA = window.LS_CATALOGUE;
  if (!DATA) {
    document.getElementById("main").innerHTML = '<section class="not-found"><h1>Catalogue data unavailable</h1><p>Reload this page to try again.</p></section>';
    return;
  }
  const ASSETS = window.LS_ASSET_MANIFEST || { images: {}, catalogue: {}, sections: {} };
  const FOOD_GROUPS = DATA.foodGroups.map((food) => typeof food === "string" ? { name: food } : food);
  const SEGMENTS = (DATA.businessSegments || DATA.segments || []).map((segment, index) => typeof segment === "string" ? ({
    name: segment,
    summary: ["Explore equipment and share your early production questions with LS.", "Discuss production changes, equipment and support with LS.", "Explore production lines and share your integration needs with LS."][index] || "Share your production requirements with LS."
  }) : segment);

  // Editable later in the local CMS (Contact details). WhatsApp numbers are digits only, with country code.
  const SITE_CONTACT_DEFAULTS = {
    inquiryEmail: "marketing@lsmachinery.com.my",
    inquiryWhatsApp: "60126577922",
    careersEmail: "lshr@lsmachinery.com.my",
    careersWhatsApp: "60125779233",
    phone: "+60 12-657 7922",
    address: "20, Jalan Industri Taming Mas, Pusat Industri Taming Mas, 43300 Balakong, Selangor D.E, Malaysia",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent("20, Jalan Industri Taming Mas, Pusat Industri Taming Mas, 43300 Balakong, Selangor D.E, Malaysia"),
    jobListUrl: "https://malaysia.indeed.com/cmp/Ls-Smart-Machinery-(m)-Sdn-Bhd",
    indeedUrl: "https://malaysia.indeed.com/cmp/Ls-Smart-Machinery-(m)-Sdn-Bhd",
    // One row per weekday: ["open", "close"] in 24-hour time, or null when closed.
    hours: { sun: null, mon: null, tue: ["09:00", "18:30"], wed: ["09:00", "18:30"], thu: ["09:00", "18:30"], fri: ["09:00", "18:30"], sat: ["09:00", "18:30"] },
    hoursNote: { en: "", zh: "", ms: "" }
  };
  const LOCAL_NAMES = {
    zh: {
      "Bakery": "烘焙设备", "Kitchen": "厨房设备", "Package": "包装设备", "Refrigeration Series": "制冷系列", "Production Line": "生产线",
      "Mixer": "搅拌机", "Depositor Series": "注料机系列", "Dough Forming": "面团成型", "Encrusting Series": "包馅系列", "Fermentation": "发酵设备", "Oven": "烤炉", "Cutting": "切割设备", "Cakes Finishing": "蛋糕装饰",
      "Cookies & Biscuits": "饼干", "Cakes": "蛋糕", "Bread & Buns": "面包与餐包", "Pastries & Crusted Foods": "酥点与酥皮食品", "Kueh & Asian Foods": "糕点与亚洲食品", "Dim Sum": "点心",
      "Micro & Startup Businesses": "微型与初创企业", "SMEs & Expanding Manufacturers": "中小型与发展中的制造商", "Large & Mega Enterprises": "大型与超大型企业",
      "Factory & Line Planning": "工厂与生产线规划", "Machinery & Automation": "机械与自动化", "Facility Fit-Out": "厂房配套工程", "Financing Support": "财务协助",
      "Our History": "LS 的发展历程", "Customer Experiences": "客户体验",
      "Support & Repairs": "支持与维修", "Installation & Training": "安装与培训", "Technical Documents": "技术文件", "Spare Parts Request": "备件申请", "Production Improvement": "生产改善",
      "About LS": "关于 LS", "Locations": "地点", "Careers": "职业发展", "Food production": "食品生产", "Machines": "机器设备", "Solutions": "解决方案", "Services & company": "服务与公司"
    },
    ms: {
      "Bakery": "Peralatan Bakeri", "Kitchen": "Peralatan Dapur", "Package": "Pembungkusan", "Refrigeration Series": "Siri Penyejukan", "Production Line": "Barisan Pengeluaran",
      "Mixer": "Pengadun", "Depositor Series": "Siri Pendepositan", "Dough Forming": "Pembentukan Doh", "Encrusting Series": "Siri Pengisian", "Fermentation": "Fermentasi", "Oven": "Ketuhar", "Cutting": "Pemotongan", "Cakes Finishing": "Hiasan Kek",
      "Cookies & Biscuits": "Biskut & Kuki", "Cakes": "Kek", "Bread & Buns": "Roti & Ban", "Pastries & Crusted Foods": "Pastri & Makanan Berkulit", "Kueh & Asian Foods": "Kuih & Makanan Asia", "Dim Sum": "Dim Sum",
      "Micro & Startup Businesses": "Perniagaan Mikro & Pemula", "SMEs & Expanding Manufacturers": "PKS & Pengeluar Berkembang", "Large & Mega Enterprises": "Perusahaan Besar & Mega",
      "Factory & Line Planning": "Perancangan Kilang & Barisan", "Machinery & Automation": "Mesin & Automasi", "Facility Fit-Out": "Kerja Kemudahan", "Financing Support": "Bantuan Kewangan",
      "Support & Repairs": "Sokongan & Pembaikan", "Installation & Training": "Pemasangan & Latihan", "Technical Documents": "Dokumen Teknikal", "Spare Parts Request": "Permintaan Alat Ganti", "Production Improvement": "Penambahbaikan Pengeluaran",
      "About LS": "Tentang LS", "Our History": "Sejarah LS", "Customer Experiences": "Pengalaman Pelanggan", "Locations": "Lokasi", "Careers": "Kerjaya", "Food production": "Pengeluaran makanan", "Machines": "Mesin", "Solutions": "Penyelesaian", "Services & company": "Perkhidmatan & syarikat"
    }
  };
  const STORAGE = {
    language: "ls-site-language",
    motion: "ls-site-motion-paused",
    published: "ls-site-cms-published-v1",
    drafts: "ls-site-cms-drafts-v1",
    versions: "ls-site-cms-versions-v1",
    activity: "ls-site-cms-activity-v1",
    contact: "ls-site-contact-v1",
    contactDraft: "ls-site-contact-draft-v1"
  };
  const CATALOGUE_PAGE_SIZE = 12;
  const CATALOGUE_STATE_PREFIX = "ls-catalogue-state-v1:";
  const CATALOGUE_RETURN_KEY = "ls-catalogue-return-category-v1";
  const storedMotionPreference = readStore(STORAGE.motion, null);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const WORDS = {
    en: {
      topline: "ENGINEERING THE NEXT GENERATION OF FOOD PRODUCTION", toplink: "Discover what’s possible", navFood: "Food production", navMachines: "Machines", navSolutions: "Solutions", navServices: "Services", navCompany: "Company", navInsights: "Insights", portal: "Contact", motionPause: "Pause motion", motionPlay: "Play motion", heroEyebrow: "LS Smart Machinery · Malaysia", heroTitleA: "Make room for", heroTitleB: "what’s next.", heroLead: "Thoughtful machinery and production solutions for food makers at every stage of their journey.", exploreMachines: "Explore our machines", requestConversation: "Start a conversation", currentLabel: "01 / CURRENT AT LS", whyLabel: "02 / WHY LS", foodLabel: "03 / FOOD PRODUCTION", segmentsLabel: "04 / WHO WE WORK WITH", newsLabel: "05 / INSIGHTS", storiesLabel: "06 / CUSTOMER EXPERIENCES", contactLabel: "LET’S MAKE THE NEXT STEP CLEAR", allMachines: "Explore the catalogue", allFood: "Explore food production", allSolutions: "See how we can help", allServices: "Explore our services", askForInfo: "Ask LS about this machine", contactUs: "Tell us what you’re planning", overview: "Overview", capabilities: "What LS can help with", segmentCta: "Explore this segment", viewCategory: "View category", homeLink: "Home", askForQuote: "Request a quote", consult: "Book a consultation", visit: "Arrange a visit", openEmail: "Open email draft", emailReady: "Your email app should open with the draft. Review it and send it; the website has not sent it.", openWhatsApp: "Open WhatsApp", contactPending: "This contact option is not set up yet. Please use the other option or try again later.", intro: "About LS", latest: "Current at LS", findMachine: "Find a machine", filter: "Filter by name or subcategory", allItems: "All equipment", suitability: "Is this machine right for you?", features: "Key features", benefits: "Designed around your process", application: "Food applications", technical: "Technical data", related: "Explore more", accessories: "Accessories", complementary: "Complementary machines", similar: "Similar machines", itemAwaiting: "Product information is being confirmed with LS. Ask our team about your process and requirements.", graphicNote: "ILLUSTRATIVE PLACEHOLDER · LS PHOTOGRAPHY TO BE ADDED", unverified: "Catalog information awaiting LS confirmation", notAvailable: "Details will be added after LS review.", country: "Country", firstName: "First name", lastName: "Last name", company: "Company", email: "Email", phone: "Telephone", message: "Message", inquiryType: "How can we help?", selectOne: "Choose an option", optional: "Optional", inquiryMachine: "Machine or page", insightsSubscribe: "I’d like LS Insights by email. Please contact me about subscribing.", spareParts: "Spare parts request", machineNumber: "Machine number", model: "Model", partNumber: "Article / part number, if known", description: "Part description", quantity: "Quantity", deliveryAddress: "Delivery address", remarks: "Remarks", spareIntro: "Share as much detail as you can so LS can identify the part and follow up efficiently.", unknownPart: "Not sure which part you need? Carry your details into a general inquiry and the LS team can follow up.", cmsTitle: "Content studio", cmsLocal: "Private local preview · saved in this browser only", editor: "Editor", publisher: "Publisher", pageToEdit: "Page to edit", copyToEdit: "Content and translations", saveDraft: "Save draft", publish: "Publisher confirms", discard: "Discard draft", technicalReview: "Technical review", machineReview: "Technical reviewer confirms machine copy", preview: "Live private preview", history: "Activity history", mediaLibrary: "Media library", uploadMedia: "Choose an image", draftSaved: "Draft saved in this browser.", published: "Published in this browser preview.", discarded: "Draft discarded and restored to the current published version.", publisherOnly: "Switch to Publisher to release a draft.", reviewRequired: "Machine content needs technical review before publishing.", noDraft: "No saved draft for this language yet.", noActivity: "No studio activity yet.", cmsWarning: "Demonstration only: this local prototype has no login, shared storage, server-side preview or real publishing permissions.", publishConfirm: "Publish this reviewed draft to the website preview on this browser?", currentPublished: "Current published content", homeIntro: "LS Smart Machinery supports food producers with machinery, production line design, facility work and after-sales service.", historyTitle: "A history worth telling", historyText: "LS’s verified company history and milestones will be added after review.", locationTitle: "Visit LS", locationText: "Location and visit details will be added after LS confirms its address and appointment process.", careersTitle: "Build what comes next", careersText: "Recruitment links will be added after LS confirms current openings and official channels.", insightsText: "Company updates, upcoming events and relevant industry stories will appear here as LS confirms them.", experienceText: "Customer stories will be published after LS approves the experience and supporting details.", pending: "Details to be confirmed before publication", aiComing: "COMING SOON", noResults: "No matching catalogue items. Try another search.", viewAll: "View all", serviceProcess: "From the first conversation through ongoing support", finish: "Shared footer", sourceWarning: "Source names are retained as supplied; selected items need catalogue confirmation.", close: "Close"
    },
    zh: {
      topline: "为新一代食品生产提供工程方案", toplink: "探索更多可能", navFood: "食品生产", navMachines: "机器设备", navSolutions: "解决方案", navServices: "服务", navCompany: "关于 LS", navInsights: "资讯", portal: "咨询", motionPause: "暂停动画", motionPlay: "播放动画", heroEyebrow: "LS Smart Machinery · 马来西亚", heroTitleA: "为下一步", heroTitleB: "预留空间。", heroLead: "为不同发展阶段的食品生产企业提供周到的设备与生产解决方案。", exploreMachines: "探索机器设备", requestConversation: "开始交流", currentLabel: "01 / LS 动态", whyLabel: "02 / 选择 LS 的理由", foodLabel: "03 / 食品生产", segmentsLabel: "04 / 服务对象", newsLabel: "05 / 行业资讯", storiesLabel: "06 / 客户体验", contactLabel: "让下一步更清晰", allMachines: "浏览设备目录", allFood: "探索食品生产", allSolutions: "了解我们如何协助", allServices: "了解服务", viewCategory: "查看类别", askForQuote: "申请报价", consult: "预约咨询", visit: "预约到访", openEmail: "打开邮件草稿", emailReady: "邮件应用会打开预填内容。请检查并发送；网站不会替您发送。", openWhatsApp: "打开 WhatsApp", homeLink: "首页", askForInfo: "向 LS 咨询此设备", contactUs: "告诉我们您的计划", overview: "概览", capabilities: "LS 可提供的协助", findMachine: "查找设备", filter: "按名称或子类别筛选", allItems: "所有设备", suitability: "这台设备适合您吗？", features: "主要特点", benefits: "围绕您的生产流程设计", application: "食品应用", technical: "技术资料", related: "探索更多", accessories: "配件", complementary: "可配合使用的设备", similar: "类似设备", itemAwaiting: "产品资料正在由 LS 确认。欢迎向团队咨询您的生产流程与需求。", graphicNote: "示意占位图 · 待添加经 LS 批准的图片", unverified: "目录资料待 LS 确认", notAvailable: "资料经 LS 审核后补充。", country: "国家", firstName: "名字", lastName: "姓氏", company: "公司", email: "电子邮箱", phone: "电话", message: "留言", inquiryType: "我们能如何协助？", selectOne: "请选择", optional: "选填", inquiryMachine: "设备或页面", insightsSubscribe: "我希望收到 LS 洞察资讯。请联系我以便订阅。", spareParts: "备件申请", machineNumber: "机器编号", model: "型号", partNumber: "产品 / 零件编号（如已知）", description: "零件描述", quantity: "数量", deliveryAddress: "送货地址", remarks: "备注", spareIntro: "请尽可能填写详细资料，以便 LS 确认零件并跟进。", unknownPart: "不确定所需零件？请将资料转入一般咨询，LS 团队会跟进。", cmsTitle: "内容工作室", cmsLocal: "仅限本地私密预览 · 保存在此浏览器", editor: "编辑者", publisher: "发布者", pageToEdit: "选择编辑页面", copyToEdit: "内容与翻译", saveDraft: "保存草稿", publish: "发布者确认", discard: "放弃草稿", technicalReview: "技术审核", machineReview: "技术审核人员确认机器内容", preview: "即时私密预览", history: "活动记录", mediaLibrary: "媒体库", uploadMedia: "选择图片", draftSaved: "草稿已保存在此浏览器。", published: "已发布至此浏览器预览。", discarded: "草稿已放弃并恢复至当前已发布版本。", publisherOnly: "请切换至发布者角色后发布草稿。", reviewRequired: "机器内容发布前须经过技术审核。", noDraft: "此语言尚无已保存的草稿。", noActivity: "目前没有工作室活动记录。", cmsWarning: "仅供演示：此本地原型没有登录、共享存储、服务器预览或实际发布权限。", publishConfirm: "将此审核后的草稿发布至本浏览器的网站预览？", currentPublished: "当前已发布内容", homeIntro: "LS Smart Machinery 为食品生产商提供设备、生产线设计、厂房工程及售后服务。", historyTitle: "值得讲述的发展历程", historyText: "经核实的公司历史与里程碑将在审核后补充。", locationTitle: "拜访 LS", locationText: "地址及拜访信息将在 LS 确认地址与预约流程后补充。", careersTitle: "共同创造未来", careersText: "LS 确认职位空缺及官方渠道后，将补充招聘链接。", insightsText: "LS 确认后，将在此发布公司动态、活动及相关行业资讯。", experienceText: "LS 批准相关经历和资料后，将发布客户故事。", pending: "发布前尚待确认", aiComing: "即将推出", noResults: "没有找到相符设备，请尝试其他关键词。", viewAll: "查看全部", serviceProcess: "从初次沟通到持续服务支持", close: "关闭"
    },
    ms: {
      topline: "KEJURUTERAAN UNTUK GENERASI BAHARU PENGELUARAN MAKANAN", toplink: "Terokai kemungkinan", navFood: "Pengeluaran makanan", navMachines: "Mesin", navSolutions: "Penyelesaian", navServices: "Perkhidmatan", navCompany: "Syarikat", navInsights: "Maklumat", portal: "Contact", motionPause: "Jeda gerakan", motionPlay: "Mainkan gerakan", heroEyebrow: "LS Smart Machinery · Malaysia", heroTitleA: "Sediakan ruang", heroTitleB: "untuk seterusnya.", heroLead: "Mesin dan penyelesaian pengeluaran untuk pengeluar makanan pada setiap peringkat.", exploreMachines: "Terokai mesin", requestConversation: "Mulakan perbualan", currentLabel: "01 / TERKINI DI LS", whyLabel: "02 / MENGAPA LS", foodLabel: "03 / PENGELUARAN MAKANAN", segmentsLabel: "04 / UNTUK SIAPA", newsLabel: "05 / WAWASAN", storiesLabel: "06 / PENGALAMAN PELANGGAN", contactLabel: "JELASKAN LANGKAH SETERUSNYA", allMachines: "Terokai katalog", allFood: "Terokai pengeluaran makanan", allSolutions: "Lihat cara kami membantu", allServices: "Terokai perkhidmatan", viewCategory: "Lihat kategori", askForQuote: "Minta sebut harga", consult: "Tempah konsultasi", visit: "Atur lawatan", openEmail: "Buka draf e-mel", emailReady: "Aplikasi e-mel akan membuka draf. Semak dan hantar sendiri; laman web belum menghantarnya.", openWhatsApp: "Buka WhatsApp", homeLink: "Laman utama", askForInfo: "Tanya LS tentang mesin ini", contactUs: "Kongsikan perancangan anda", overview: "Gambaran keseluruhan", capabilities: "Cara LS boleh membantu", findMachine: "Cari mesin", filter: "Tapis mengikut nama atau subkategori", allItems: "Semua peralatan", suitability: "Adakah mesin ini sesuai untuk anda?", features: "Ciri utama", benefits: "Direka mengikut proses anda", application: "Aplikasi makanan", technical: "Data teknikal", related: "Terokai lagi", accessories: "Aksesori", complementary: "Mesin pelengkap", similar: "Mesin serupa", itemAwaiting: "Maklumat produk sedang disahkan oleh LS. Hubungi pasukan kami tentang proses dan keperluan anda.", graphicNote: "ILUSTRASI SEMENTARA · FOTO YANG DILULUSKAN LS AKAN DITAMBAH", unverified: "Maklumat katalog menunggu pengesahan LS", notAvailable: "Butiran akan ditambah selepas semakan LS.", country: "Negara", firstName: "Nama pertama", lastName: "Nama keluarga", company: "Syarikat", email: "E-mel", phone: "Telefon", message: "Mesej", inquiryType: "Bagaimanakah kami boleh membantu?", selectOne: "Pilih satu", optional: "Pilihan", inquiryMachine: "Mesin atau halaman", insightsSubscribe: "Saya berminat menerima LS Insights. Sila hubungi saya tentang langganan.", spareParts: "Permintaan alat ganti", machineNumber: "Nombor mesin", model: "Model", partNumber: "Nombor artikel / alat ganti jika diketahui", description: "Penerangan alat ganti", quantity: "Kuantiti", deliveryAddress: "Alamat penghantaran", remarks: "Catatan", spareIntro: "Berikan maklumat selengkap mungkin agar LS dapat mengenal pasti alat ganti dan membuat susulan dengan cekap.", unknownPart: "Tidak pasti alat ganti yang diperlukan? Sertakan butiran dalam pertanyaan umum dan pasukan LS akan membuat susulan.", cmsTitle: "Studio kandungan", cmsLocal: "Pratonton peribadi setempat · disimpan dalam pelayar ini sahaja", editor: "Penyunting", publisher: "Penerbit", pageToEdit: "Pilih halaman", copyToEdit: "Kandungan dan terjemahan", saveDraft: "Simpan draf", publish: "Penerbit mengesahkan", discard: "Buang draf", technicalReview: "Semakan teknikal", machineReview: "Penyemak teknikal mengesahkan kandungan mesin", preview: "Pratonton peribadi langsung", history: "Sejarah aktiviti", mediaLibrary: "Pustaka media", uploadMedia: "Pilih imej", draftSaved: "Draf disimpan dalam pelayar ini.", published: "Diterbitkan dalam pratonton pelayar ini.", discarded: "Draf dibuang dan versi terbitan semasa dipulihkan.", publisherOnly: "Tukar kepada Penerbit untuk menerbitkan draf.", reviewRequired: "Kandungan mesin memerlukan semakan teknikal sebelum diterbitkan.", noDraft: "Tiada draf tersimpan untuk bahasa ini.", noActivity: "Tiada aktiviti studio lagi.", cmsWarning: "Untuk demonstrasi sahaja: prototaip setempat ini tiada log masuk, storan bersama, pratonton pelayan atau kebenaran penerbitan sebenar.", publishConfirm: "Terbitkan draf yang telah disemak ini ke pratonton laman dalam pelayar ini?", currentPublished: "Kandungan terbitan semasa", homeIntro: "LS Smart Machinery menyokong pengeluar makanan dengan mesin, reka bentuk barisan pengeluaran, kerja kemudahan dan perkhidmatan selepas jualan.", historyTitle: "Sejarah untuk diceritakan", historyText: "Sejarah dan pencapaian syarikat yang disahkan akan ditambah selepas semakan.", locationTitle: "Lawati LS", locationText: "Lokasi dan maklumat lawatan akan ditambah selepas LS mengesahkan alamat dan proses janji temu.", careersTitle: "Bina masa depan bersama", careersText: "Pautan kerjaya akan ditambah selepas LS mengesahkan kekosongan dan saluran rasmi.", insightsText: "Kemas kini syarikat, acara dan cerita industri yang berkaitan akan dipaparkan selepas disahkan LS.", experienceText: "Kisah pelanggan akan diterbitkan selepas pengalaman dan butiran sokongan diluluskan LS.", pending: "Butiran perlu disahkan sebelum diterbitkan", aiComing: "AKAN DATANG", noResults: "Tiada item katalog yang sepadan. Cuba carian lain.", viewAll: "Lihat semua", serviceProcess: "Daripada perbualan pertama kepada sokongan berterusan", close: "Tutup"
    }
  };
  const PAGE_COPY = {
    en: {
      introTitle: "Production is personal.", introAccent: "Your machinery should be, too.", introAside: "From layout planning and machine supply to installation, technology transfer and continued service, LS helps bring production requirements into focus.", currentTitle: "Production starts with a better question.", whyTitle: "Good production begins with a good partner.", whyBody: "Bring LS your product, process and priorities. Start with a conversation, then explore the capabilities that match your requirements.", foodTitle: "Made for the foods people love.", foodNote: "Explore by food type to begin; LS can confirm machine fit for your process.", segmentTitle: "Your next step starts where you are.", segmentLead: "Different production goals bring different questions. Find a starting point, then share your requirements with LS.", newsTitle: "Ideas, people & progress.", newsFeature: "Stay close to what’s happening at LS.", newsFeatureBody: "Verified company updates, events and industry stories will be shared here.", storyTitle: "Built on real experiences.", storyQuote: "Customer experiences will be shared here after the people and details are confirmed.", socialTitle: "Keep up with LS.", socialBody: "Find LS on its official social channels once confirmed.", contactTitle: "Let’s make good things happen.", contactBody: "Tell us what you’re planning and how we can follow up. Your selected page or machine will be included in the inquiry summary.", browseNote: "Explore by food type to begin; LS can confirm machine fit for your process.", segment01: "Explore equipment and share your early production questions with LS.", segment02: "Discuss production changes, equipment and support with LS.", segment03: "Explore production lines and share your integration needs with LS."
    },
    zh: {
      topline: "为新一代食品生产提供工程方案", introTitle: "让生产更贴近您的需求。", introAccent: "设备也应如此。", introAside: "从厂房布局和机器供应，到安装、技术转移及持续服务，LS 帮助您梳理生产需求。", currentTitle: "生产，始于一个更好的问题。", whyTitle: "良好生产，始于可靠的合作。", whyBody: "告诉 LS 您的产品、流程和优先事项。先从沟通开始，再根据需求探索合适的能力。", foodTitle: "为人们喜爱的食品而设计。", foodNote: "按食品类别开始探索；设备是否适合您的流程，请向 LS 确认。", segmentTitle: "从当前阶段出发，规划下一步。", segmentLead: "不同的生产目标会带来不同的问题。先找到合适的起点，再与 LS 分享您的需求。", newsTitle: "创意、团队与进展。", newsFeature: "关注 LS 的最新动态。", newsFeatureBody: "经确认的公司动态、活动与行业资讯将在此分享。", storyTitle: "真实体验，建立信任。", storyQuote: "客户体验将在相关人员和详情确认后发布。", socialTitle: "关注 LS 动态。", socialBody: "待 LS 确认官方社交媒体账号后，您可在此关注 LS。", contactTitle: "一起规划下一步。", contactBody: "告诉我们您的计划和希望的联系方法。所选页面或机器会自动加入咨询摘要。", browseNote: "目录项目 · 名称待确认", segment01: "探索设备并向 LS 提出初期生产问题。", segment02: "与 LS 讨论生产调整、设备及支持。", segment03: "探索生产线并分享您的整合需求。"
    },
    ms: {
      topline: "KEJURUTERAAN UNTUK GENERASI BAHARU PENGELUARAN MAKANAN", introTitle: "Pengeluaran yang memahami keperluan anda.", introAccent: "Mesin juga sepatutnya begitu.", introAside: "Daripada perancangan susun atur dan bekalan mesin kepada pemasangan, pemindahan teknologi serta khidmat berterusan, LS membantu menjelaskan keperluan pengeluaran.", currentTitle: "Pengeluaran bermula dengan soalan yang lebih baik.", whyTitle: "Pengeluaran yang baik bermula dengan rakan yang sesuai.", whyBody: "Kongsikan produk, proses dan keutamaan anda dengan LS. Mulakan dengan perbualan, kemudian terokai keupayaan yang berkaitan dengan keperluan anda.", foodTitle: "Untuk makanan yang disukai ramai.", foodNote: "Mulakan carian mengikut jenis makanan; sahkan kesesuaian mesin dengan LS.", segmentTitle: "Langkah seterusnya bermula dari kedudukan anda.", segmentLead: "Matlamat pengeluaran yang berbeza membawa persoalan yang berbeza. Cari titik permulaan, kemudian kongsikan keperluan anda dengan LS.", newsTitle: "Idea, pasukan dan perkembangan.", newsFeature: "Ikuti perkembangan di LS.", newsFeatureBody: "Kemas kini syarikat, acara dan cerita industri yang disahkan akan dikongsi di sini.", storyTitle: "Berdasarkan pengalaman sebenar.", storyQuote: "Pengalaman pelanggan akan dikongsi selepas individu dan butiran disahkan.", socialTitle: "Ikuti LS.", socialBody: "Saluran media sosial rasmi akan dipautkan selepas disahkan oleh LS.", contactTitle: "Jelaskan langkah seterusnya.", contactBody: "Kongsikan perancangan dan cara untuk menghubungi anda. Halaman atau mesin pilihan akan dimasukkan secara automatik dalam ringkasan pertanyaan.", browseNote: "Item katalog · nama menunggu pengesahan", segment01: "Terokai peralatan dan kongsikan persoalan awal tentang pengeluaran.", segment02: "Bincangkan perubahan pengeluaran, mesin dan sokongan dengan LS.", segment03: "Terokai barisan pengeluaran dan kongsikan keperluan integrasi anda."
    }
  };

  const CAREER_SOURCE_CHECKED = "2026-10-15"; // Internal source date: recheck LS's official job list before publication.
  const CAREER_ROLE_DEFAULTS = window.LS_CAREER_OPPORTUNITIES.map(role=>({...role}));
  const CAREER_ROLE_LIMIT = 30;
  const HOME_HERO_MACHINES = [
    { model: "LSF 502 MCD", catalogueName: "Mini Cookie Depositor (MCD)" },
    { model: "LSF 502 MCWC", catalogueName: "Mini Cookie Wire Cut (MCWC)" },
    { model: "LSF 502 MCAD", catalogueName: "Mini Cake Depositor (MCAD)" }
  ];
  const MACHINE_MODEL_KEYS = {
    "lsf-502-mcd": "mini-cookie-depositor-mcd",
    "lsf-502-mcwc": "mini-cookie-wire-cut-mcwc",
    "lsf-502-mcad": "mini-cake-depositor-mcad"
  };
  const officialCareerUrl = (value) => {
    try { const url = new URL(value); return url.protocol === "https:" && ["malaysia.indeed.com", "www.linkedin.com", "www.facebook.com", "www.instagram.com"].includes(url.hostname); }
    catch { return false; }
  };

  const DEFAULT_CONTENT = {
    en: { heroTitleA: "Food production.", heroTitleB: "Engineered around you.", heroLead: "Machinery, production-line planning and after-sales support for food producers in Malaysia.", homeIntro: WORDS.en.homeIntro, currentTitle: "From first product idea to a line built for growth.", currentText: "LS combines machine selection, factory planning, installation, operator training, modification and after-sales support in one relationship.", homeHeroModel: "LSF 502 MCD", machineTitle: "LSF 502 MCD", machineIntro: "LS lists the Mini Cookies Depositor (MCD) for cookie production. Share your dough, product shapes and intended process so LS can review the configuration with you.", careerIntro: "Join the people behind LS’s food-production machinery. Explore opportunities through our recruitment channels or contact HR directly.", careerImage: "recruitment", solutionIntro: "LS brings together planning, equipment and practical production support. Share your goals to start a conversation." },
    zh: { heroTitleA: "食品生产。", heroTitleB: "围绕您的需求规划。", heroLead: "为马来西亚食品生产商提供设备、生产线规划及售后支持。", homeIntro: WORDS.zh.homeIntro, currentTitle: "从最初的产品构想，到支持发展的生产线。", currentText: "LS 将设备选择、厂房规划、安装、操作培训、改装及售后支持结合在同一个合作关系中。", homeHeroModel: "LSF 502 MCD", machineTitle: "LSF 502 MCD", machineIntro: "LS 将 Mini Cookies Depositor (MCD) 列于饼干生产设备。请分享面团、产品形状及生产流程，以便 LS 与您讨论配置。", careerIntro: "加入 LS 的食品生产机械团队。通过招聘平台了解机会，或直接联系人事部。", careerImage: "recruitment", solutionIntro: "LS 提供规划、设备及实用的生产支持。欢迎分享您的目标并开始交流。" },
    ms: { heroTitleA: "Pengeluaran makanan.", heroTitleB: "Mengikut keperluan anda.", heroLead: "Mesin, perancangan barisan pengeluaran dan sokongan selepas jualan untuk pengeluar makanan di Malaysia.", homeIntro: WORDS.ms.homeIntro, currentTitle: "Daripada idea produk pertama kepada barisan untuk berkembang.", currentText: "LS menggabungkan pemilihan mesin, perancangan kilang, pemasangan, latihan operator, pengubahsuaian dan sokongan selepas jualan dalam satu hubungan.", homeHeroModel: "LSF 502 MCD", machineTitle: "LSF 502 MCD", machineIntro: "LS menyenaraikan Mini Cookies Depositor (MCD) untuk pengeluaran kuki. Kongsikan doh, bentuk produk dan proses yang dirancang supaya LS boleh menyemak konfigurasi bersama anda.", careerIntro: "Sertai pasukan di sebalik mesin pengeluaran makanan LS. Terokai peluang melalui saluran pengambilan kami atau hubungi HR terus.", careerImage: "recruitment", solutionIntro: "LS menggabungkan perancangan, peralatan dan sokongan pengeluaran. Kongsikan matlamat anda untuk memulakan perbualan." }
  };

  for (const language of ['en','zh','ms']) DEFAULT_CONTENT[language].machineIntro = window.LS_MACHINE_CONTENT['Mini Cookie Depositor (MCD)'].intro[language];

  const FOOD_ICONS = ["◌", "⌂", "▱", "⌁", "◇", "✣"];
  const WHY_POINTS = [
    ["01", "Plan around your production", "Factory layout and production-line design begin with your process, space and goals."],
    ["02", "Equipment with context", "Explore machinery supply and customized solutions for the products you plan to make."],
    ["03", "More than installation", "Technology transfer, modification, maintenance and after-sales support are part of the conversation."],
    ["04", "Practical support", "Facility fit-out and financial assistance can be discussed with LS around your needs."]
  ];
  const SOLUTIONS = ["Factory & Line Planning", "Machinery & Automation", "Facility Fit-Out", "Financing Support"];
  const SERVICES = ["Support & Repairs", "Installation & Training", "Technical Documents", "Spare Parts Request", "Production Improvement"];
  const COMPANY = ["About LS", "Our History", "Customer Partnerships", "Project Process", "Locations", "Careers"];
  const SOCIAL_LINKS = [
    { name: "Facebook", href: "https://www.facebook.com/lssmartmachineryofficial/", icon: '<path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V10H7.3v3h2.8v8z"/>' },
    { name: "Instagram", href: "https://www.instagram.com/ls_smart_machinery/?hl=en", icon: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="6" r="1.2"/>' },
    { name: "YouTube", href: "https://www.youtube.com/channel/UCg47JfshoyGiWqhftKV19MQ", icon: '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19.1 4.6 12 4.6 12 4.6s-7.1 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12c0 1.6.1 3.2.5 4.8a3 3 0 0 0 2.1 2.1c1.8.5 8.9.5 8.9.5s7.1 0 8.9-.5a3 3 0 0 0 2.1-2.1c.4-1.6.5-3.2.5-4.8s-.1-3.2-.5-4.8ZM9.7 15.4V8.6l5.9 3.4-5.9 3.4Z"/>' },
    { name: "TikTok", href: "https://www.tiktok.com/@lssmartmachinery", icon: '<path d="M16.5 3c.3 2.4 1.7 3.9 4.1 4.1v3.2a9 9 0 0 1-4.1-1.3v6.7a6 6 0 1 1-6-6c.4 0 .8 0 1.2.1v3.4a2.7 2.7 0 1 0 1.5 2.4V3h3.3Z"/>' },
    { name: "RedNote", href: "https://www.xiaohongshu.com/user/profile/631845810000000015019b79", icon: '<path d="M6 2.8h8.5L19 7.3v13.9H6a2 2 0 0 1-2-2V4.8a2 2 0 0 1 2-2Zm8 1.6v3.7h3.7M8 11h8M8 14.5h8M8 18h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' },
    { name: "Indeed", href: "https://malaysia.indeed.com/cmp/Ls-Smart-Machinery-(m)-Sdn-Bhd", icon: '<circle cx="12" cy="5" r="1.7"/><path d="M9.2 8.3h5.6V20H9.2z"/>' },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/ls-smart-machinery-sdn-bhd", icon: '<path d="M5 8.5H2V21h3V8.5ZM3.5 7.2a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM8 8.5h2.9v1.7A3.8 3.8 0 0 1 14.3 8c3.2 0 3.8 2.1 3.8 4.9V21h-3v-7.2c0-1.7 0-3.8-2.3-3.8s-2.7 1.8-2.7 3.7V21H8V8.5Z"/>' }
  ];
  const SEGMENT_DETAILS = [
    { match: /micro|startup/i, summary: "Starting a food business brings many practical questions. Explore the equipment catalogue and tell LS about your product, planned process and space.", steps: ["Explore bakery, kitchen and packaging equipment", "Describe your product and intended process", "Ask LS about planning, equipment and support"] },
    { match: /sme/i, summary: "Growing production can change the way equipment, layout and support fit together. Share your current line and goals so LS can understand the context.", steps: ["Review the equipment and production-line categories", "Identify process changes and space considerations", "Discuss configuration, installation and service needs with LS"] },
    { match: /large|mega/i, summary: "For larger or more integrated requirements, start with the process, products and outcomes you have in mind. LS can discuss machinery, production lines and facility planning.", steps: ["Explore the full production-line and packaging catalogue", "Describe integration, facility and service requirements", "Request a consultation or arrange a visit with LS"] }
  ];

  const state = {
    language: readStore(STORAGE.language, "en"),
    motionPaused: storedMotionPreference ?? prefersReducedMotion,
    motionOptIn: storedMotionPreference === false && prefersReducedMotion,
    route: "home",
    cmsOpen: false,
    cmsPage: "home",
    cmsRole: "editor",
    cmsFields: {},
    cmsTechnicalReview: false,
    cmsMachineSlug: "mini-cookie-depositor-mcd",
    carryMessage: "",
    carryMessageContext: "",
    query: ""
  };
  if (!WORDS[state.language]) state.language = "en";

  const main = document.getElementById("main");
  const nav = document.querySelector(".primary-nav");
  const megaPanel = document.querySelector(".mega-panel");
  const languagePicker = document.getElementById("language-picker");
  const studioMode=new URLSearchParams(location.search).get('studio')==='1';
  languagePicker.closest('.language-picker').hidden=!studioMode&&!window.LSRouter.legacy;
  if(!studioMode&&!window.LSRouter.legacy)state.language='en';
  let fullscreenReturnFocus = null;
  const titleCase = (value) => String(value || "").replace(/\b\S/g, (c) => c.toUpperCase());
  const t = (key) => (WORDS[state.language] && WORDS[state.language][key]) || WORDS.en[key] || key;
  const pageText = (key) => (PAGE_COPY[state.language] && PAGE_COPY[state.language][key]) || key;
  LOCAL_NAMES.zh["Customer Partnerships"]="客户合作";
  LOCAL_NAMES.ms["Customer Partnerships"]="Kerjasama Pelanggan";
  const displayName = value => value === 'Industri Cookies/Cakes Depositor' ? 'Industrial Cookie/Cake Depositor' : value;
  const localName = (value) => state.language==='en'&&value==='Large & Mega Enterprises'?'Large-scale manufacturers':(LOCAL_NAMES[state.language] && LOCAL_NAMES[state.language][value]) || displayName(value);
  const inquiryUrl = (context = "", intent = "") => {
    const params = [];
    if (context) params.push(`context=${encodeURIComponent(context)}`);
    if (intent) params.push(`intent=${encodeURIComponent(intent)}`);
    return `#inquiry${params.length ? `?${params.join("&")}` : ""}`;
  };
  const slug = (value) => String(value).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  const assetText = (value) => typeof value === "string" ? value : value?.[state.language] || value?.en || "";
  const assetImage = (key, className = "", options = {}) => {
    const record = ASSETS.images[key];
    if (!record) return "";
    const alt = options.alt ?? assetText(record.alt);
    const sizes = record.sizes || {};
    const widths = Object.keys(sizes).map(Number).sort((a, b) => a - b);
    const src = sizes[800] || sizes[widths[widths.length - 1]] || sizes[widths[0]];
    const srcset = widths.map((width) => `${sizes[width]} ${width}w`).join(", ");
    return `<img class="${esc(className)}" src="${esc(src)}"${srcset ? ` srcset="${esc(srcset)}" sizes="${esc(options.sizes || '(max-width: 720px) 100vw, 50vw')}"` : ""} width="${record.width}" height="${record.height}" alt="${esc(alt)}" loading="${options.loading || "lazy"}" decoding="async"${options.priority ? ' fetchpriority="high"' : ""} />`;
  };
  const isLocalStoryImage = (value) => typeof value === "string" && value.length < 500000 && /^data:image\/(?:jpeg|png|webp);base64,/i.test(value);
  const storyImage = (customImage, assetKey, className = "", options = {}) => {
    if (isLocalStoryImage(customImage)) return `<img class="${esc(className)}" src="${esc(customImage)}" width="900" height="675" alt="${esc(options.alt || "")}" loading="${options.loading || "lazy"}" decoding="async">`;
    return assetKey ? assetImage(assetKey, className, options) : "";
  };
  const sectionAsset = (key, nestedKey = "") => {
    const value = ASSETS.sections?.[key];
    return typeof value === "string" ? value : value?.[nestedKey] || "";
  };
  const sectionPhoto = (key, className = "", captionKey = key, options = {}) => {
    const id = options.nestedKey ? sectionAsset(key, options.nestedKey) : sectionAsset(key);
    if (!id) return "";
    const caption = ASSETS.captions?.[captionKey];
    return `<figure class="photo-figure ${esc(className)}">${assetImage(id, "photo-image", options)}${caption ? `<figcaption>${esc(assetText(caption))}</figcaption>` : ""}</figure>`;
  };
  const catalogueAssignment = (name, category = "Bakery") => ASSETS.catalogue[name] || ASSETS.categoryFallbacks?.[category] || null;
  const catalogueImage = (name, category = "Bakery", className = "") => {
    const assignment = catalogueAssignment(name, category);
    if (assignment?.match !== "exact") return "";
    return `<figure class="catalogue-media is-exact-match ${esc(className)}">${assetImage(assignment.image, "catalogue-photo", { sizes: "(max-width: 720px) 92vw, 30vw" })}</figure>`;
  };
  const urlFor = (path) => window.LSRouter.url(path);
  const categoryUrl = (category) => urlFor(`machines/${slug(category.name)}`);
  const productUrl = (name) => urlFor(`machine/${slug(name)}`);
  const itemRoute = () => window.LSRouter.route();
  const allCatalogueItems = () => DATA.categories.flatMap((category) => {
    const items = category.items || (category.subcategories || []).flatMap((subcategory) => subcategory.items.map((item) => ({ ...item, subcategory: subcategory.name })));
    return items.map((item) => ({ ...item, category: category.name, categoryId: slug(category.name) }));
  });
  const findCategory = (name) => DATA.categories.find((category) => slug(category.name) === slug(name));
  const findProduct = (name) => allCatalogueItems().find((item) => slug(item.name) === slug(name));
  const machinePageKey = (value) => MACHINE_MODEL_KEYS[value] || value;
  const machineOptions = () => [...new Map(allCatalogueItems().map((item) => [slug(item.name), item])).values()];
  const machineTitleDefault = (key) => {
    const item = machineOptions().find((entry) => slug(entry.name) === key);
    return ({
      "mini-cookie-depositor-mcd": "LSF 502 MCD",
      "mini-cookie-wire-cut-mcwc": "LSF 502 MCWC",
      "mini-cake-depositor-mcad": "LSF 502 MCAD"
    })[key] || item?.name || "";
  };
  const machineIntroDefault = (key, language) => {
    const name=machineOptions().find(item=>slug(item.name)===key)?.name;
    return window.LS_MACHINE_CONTENT?.[name]?.intro?.[language] || '';
  };
  const showToast = (message) => {
    const region = document.querySelector(".toast-region");
    region.innerHTML = `<div class="toast" role="status">${esc(message)}</div>`;
    window.setTimeout(() => { if (region.firstElementChild) region.innerHTML = ""; }, 3200);
  };
  const visualArt = () => `<figure class="hero-art">${assetImage(sectionAsset("homepageHero"), "hero-machine-image", { priority: true, loading: "eager", sizes: "(max-width: 900px) 100vw, 52vw" })}<figcaption class="hero-image-caption">${esc(state.language === "zh" ? "LS 设备产品图片" : state.language === "ms" ? "Foto produk mesin LS" : "LS machinery · product image")}</figcaption></figure>`;
  function introMediaSection() {
    const posterId = sectionAsset("introPoster");
    const posterRecord = ASSETS.images[posterId];
    if (!posterRecord) return "";
    const poster = posterRecord.sizes[800] || posterRecord.sizes[Object.keys(posterRecord.sizes).map(Number).sort((a, b) => b - a)[0]];
    const video = ASSETS.media?.introVideo;
    const content = video
      ? `<video class="intro-video" controls muted playsinline preload="none" poster="${esc(poster)}" data-motion-video aria-label="LS branded introduction: premises, MCD, MCWC and LS logo"><source src="${esc(video)}" type="video/mp4"><p>Video playback is unavailable. The still image remains available below.</p></video><figure class="video-static-fallback" hidden>${assetImage(posterId, "video-poster", { alt: assetText(posterRecord.alt), sizes: "(max-width: 720px) 100vw, 72vw" })}</figure>`
      : `<figure class="video-poster-card">${assetImage(posterId, "video-poster", { alt: assetText(posterRecord.alt), sizes: "(max-width: 720px) 100vw, 72vw" })}</figure>`;
    return `<div class="intro-film section-wrap section-pad" aria-labelledby="intro-film-title"><div class="intro-film-copy"><span class="eyebrow inverse">${esc(t("currentLabel"))}</span><h2 id="intro-film-title" class="section-title">${esc(getContent().currentTitle)}</h2><p class="body-copy">${esc(getContent().currentText)}</p><p class="body-copy">${esc(getContent().homeIntro)}</p>${arrowLink("#company", homeText("aboutLink"))}</div><div class="intro-film-frame">${content}</div></div>`;
  }
  const sectionHead = (eyebrow, title, action = "") => `<div class="section-heading-row"><div><span class="eyebrow">${esc(eyebrow)}</span><h2 class="section-title">${title}</h2></div>${action}</div>`;
  const arrowLink = (href, label) => `<a class="arrow-link" href="${esc(href)}">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  const buttonLink = (href, label, cls = "") => `<a class="button-link ${cls}" href="${esc(href)}">${esc(label)} <span class="button-arrow" aria-hidden="true">↗</span></a>`;
  const getContent = (language = state.language) => {
    const saved = readStore(STORAGE.published, {});
    return { ...DEFAULT_CONTENT[language], ...(saved[language] || {}) };
  };
  function storySeed(language = state.language) {
    return {
      clients: [
        { name: "Gardenia", image: "gardenia", source: "LS published website materials" },
        { name: "TK Bakery", image: "tk-bakery", source: "LS published website materials" },
        ...Array.from({ length: 4 }, () => ({ name: "", image: "", source: "" }))
      ],
      experiences: Array.from({ length: 10 }, (_, index) => ({ title: "", body: "", image: `photo-${index + 1}`, source: `LS published gallery · Gallery image ${index + 1}` }))
    };
  }
  function publishedStories(language = state.language) {
    const stored = readStore(STORAGE.published, {})[language] || {};
    const defaults = storySeed(language);
    const clients = Array.from({length:Math.min(100,Math.max(defaults.clients.length,stored.clients?.length||0))},(_,index)=>({...defaults.clients[index],...(stored.clients?.[index]||{})}));
    const experiences = defaults.experiences.map((item, index) => ({ ...item, ...(stored.experiences?.[index] || {}) })).slice(0, 10);
    return {
      clients: clients.filter((item) => item.name && item.source && (!item.image || item.image === "gardenia" || item.image === "tk-bakery") && (!item.customImage || isLocalStoryImage(item.customImage))),
      experiences: experiences.filter((item) => (item.image && sectionAsset("customerExperiences", item.image)) || isLocalStoryImage(item.customImage))
    };
  }

  function readStore(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { showToast("Local storage is unavailable. Your changes are not saved."); return false; }
  }
  function recordActivity(action, page = state.cmsPage) {
    const log = readStore(STORAGE.activity, []);
    log.unshift({ action, page, language: state.language, time: new Date().toISOString() });
    writeStore(STORAGE.activity, log.slice(0, 30));
  }
  const tr = (en, zh, ms) => state.language === "zh" ? zh : state.language === "ms" ? ms : en;
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const DAY_NAMES = {
    en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    zh: ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    ms: ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"]
  };

  function getContact() {
    const saved = readStore(STORAGE.contact, {});
    return {
      ...SITE_CONTACT_DEFAULTS,
      ...saved,
      jobListUrl: saved.jobListUrl && !saved.jobListUrl.includes("lsmachinery.com.my") ? saved.jobListUrl : SITE_CONTACT_DEFAULTS.indeedUrl,
      hours: { ...SITE_CONTACT_DEFAULTS.hours, ...(saved.hours || {}) },
      hoursNote: { ...SITE_CONTACT_DEFAULTS.hoursNote, ...(saved.hoursNote || {}) }
    };
  }
  function formatClock(value, language) {
    const [hour, minute] = String(value).split(":").map(Number);
    const mm = String(minute || 0).padStart(2, "0");
    if (language !== "en") return `${String(hour).padStart(2, "0")}:${mm}`;
    return `${hour % 12 || 12}:${mm}${hour >= 12 ? "pm" : "am"}`;
  }
  // Groups consecutive days that share the same hours, e.g. "Tue–Sat 9:00am–6:30pm · Sun & Mon closed".
  function formatHours(contact = getContact(), language = state.language) {
    const names = DAY_NAMES[language] || DAY_NAMES.en;
    const joiner = language === "zh" ? "、" : " & ";
    const groups = [];
    DAY_KEYS.forEach((key, day) => {
      const slot = contact.hours[key];
      const id = Array.isArray(slot) && slot[0] && slot[1] ? slot.join("-") : "closed";
      const last = groups[groups.length - 1];
      if (last && last.id === id) last.days.push(day); else groups.push({ id, days: [day] });
    });
    const label = (days) => days.length === 1 ? names[days[0]] : days.length === 2 ? `${names[days[0]]}${joiner}${names[days[1]]}` : `${names[days[0]]}–${names[days[days.length - 1]]}`;
    const open = groups.filter((group) => group.id !== "closed").map((group) => {
      const [from, to] = group.id.split("-");
      return `${label(group.days)} ${formatClock(from, language)}–${formatClock(to, language)}`;
    });
    const closed = groups.filter((group) => group.id === "closed").map((group) => label(group.days));
    const closedWord = { en: "closed", zh: "休息", ms: "tutup" }[language] || "closed";
    return [...open, closed.length ? `${closed.join(joiner)} ${closedWord}` : ""].filter(Boolean).join(" · ");
  }
  function inquiryMessage({ machine = "", audience = "sales", intent = "" } = {}) {
    const careers = audience === "careers";
    const intro = careers ? tr("Hello LS HR team,", "您好，LS 人事团队：", "Helo pasukan HR LS,") : tr("Hello LS Smart Machinery,", "您好，LS Smart Machinery：", "Helo LS Smart Machinery,");
    const intentLabels = {
      quote: tr("Request a quote", "申请报价", "Minta sebut harga"),
      consult: tr("Book a consultation", "预约咨询", "Tempah konsultasi"),
      visit: tr("Arrange a visit", "安排到访", "Atur lawatan"),
      service: tr("Ask about service support", "咨询服务支持", "Tanya tentang sokongan servis")
    };
    const requestedIntent = careers ? tr("Career inquiry", "工作咨询", "Pertanyaan kerjaya") : (intentLabels[intent] || intent || tr("General inquiry", "一般咨询", "Pertanyaan umum"));
    const about = careers
      ? tr("I would like to ask about career opportunities at LS.", "我想咨询 LS 的工作机会。", "Saya ingin bertanya tentang peluang kerjaya di LS.")
      : machine
        ? tr(`I would like to ${requestedIntent.toLowerCase()} about ${machine}.`, `我想${requestedIntent}，咨询 ${machine}。`, `Saya ingin ${requestedIntent.toLowerCase()} tentang ${machine}.`)
        : tr("I would like to discuss your machinery and production solutions.", "我想讨论贵公司的设备与生产方案。", "Saya ingin berbincang tentang mesin dan penyelesaian pengeluaran anda.");
    return [intro, "", `${tr("Inquiry intent", "咨询事项", "Tujuan pertanyaan")}: ${requestedIntent}`, about, "", `${tr("Page", "页面", "Halaman")}: ${location.href}`, "", `${tr("Name", "姓名", "Nama")}:`, `${tr("Company", "公司", "Syarikat")}:`, `${tr("Phone", "电话", "Telefon")}:`].join("\n");
  }
  function inquiryLinks(ctx = {}) {
    const contact = getContact();
    const careers = ctx.audience === "careers";
    const email = careers ? contact.careersEmail : contact.inquiryEmail;
    const whatsapp = String((careers ? contact.careersWhatsApp : contact.inquiryWhatsApp) || "").replace(/\D/g, "");
    const message = ctx.message ?? inquiryMessage({ machine: ctx.machine, audience: careers ? "careers" : "sales", intent: ctx.intent });
    const subject = ctx.subject || (careers ? tr("Career inquiry", "工作咨询", "Pertanyaan kerjaya") : `LS Smart Machinery ${ctx.intent ? `${ctx.intent} · ` : ""}${tr("inquiry", "咨询", "pertanyaan")}${ctx.machine ? ` — ${ctx.machine}` : ""}`);
    return {
      email: email ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}` : "",
      whatsapp: whatsapp ? `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}` : ""
    };
  }
  // Two real links, no script needed: the email draft and the WhatsApp chat both arrive pre-filled.
  function inquiryActions(ctx = {}) {
    const links = inquiryLinks(ctx);
    const careers = ctx.audience === "careers";
    const emailLabel = careers ? tr("Email HR", "电邮人事部", "E-mel HR") : tr("Email LS", "电邮 LS", "E-mel LS");
    const whatsappLabel = careers ? tr("WhatsApp HR", "WhatsApp 人事部", "WhatsApp HR") : tr("WhatsApp LS", "WhatsApp LS", "WhatsApp LS");
    const light = ctx.variant === "light" ? "light" : "";
    return `<div class="inquiry-actions">${links.email ? `<a class="button-link ${light}" data-inquiry-email href="${esc(links.email)}">${esc(emailLabel)} <span class="button-arrow" aria-hidden="true">↗</span></a>` : ""}${links.whatsapp ? `<a class="button-link outline" data-inquiry-whatsapp href="${esc(links.whatsapp)}" target="_blank" rel="noopener noreferrer">${esc(whatsappLabel)} <span class="button-arrow" aria-hidden="true">↗</span></a>` : ""}</div>`;
  }
  const inquiryBandHtml = (context = "", audience = "sales", intent = "consult") => window.LSDesign.inquiryBand(designConfig(), context, audience, intent);
  function contactCard({ careers = false, extra = "" } = {}) {
    const contact = getContact();
    const note = contact.hoursNote[state.language] || "";
    const email = careers ? contact.careersEmail : contact.inquiryEmail;
    const phone = careers ? contact.careersWhatsApp : contact.inquiryWhatsApp;
    const phoneText = careers ? `+${String(phone).replace(/^(\d{2})(\d{2})(\d{3})(\d+)$/, "$1 $2-$3 $4")}` : contact.phone;
    const digits = String(phone || "").replace(/\D/g, "");
    const tel = digits ? `+${digits}` : "";
    const wa = digits ? `https://wa.me/${digits}` : "";
    return `<div class="content-info-card contact-card"><span class="eyebrow">${esc(tr("CONTACT LS", "联系 LS", "HUBUNGI LS"))}</span><dl class="contact-list"><div><dt>${esc(tr("Phone / WhatsApp", "电话 / WhatsApp", "Telefon / WhatsApp"))}</dt><dd><a href="tel:${esc(tel)}">${esc(phoneText)}</a>${wa ? ` · <a href="${esc(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>` : ""}</dd></div><div><dt>${esc(tr("Email", "电邮", "E-mel"))}</dt><dd><a href="mailto:${esc(email)}">${esc(email)}</a></dd></div><div><dt>${esc(tr("Address", "地址", "Alamat"))}</dt><dd>${esc(contact.address)} <a href="${esc(contact.mapUrl)}" target="_blank" rel="noopener noreferrer">${esc(tr("Map", "地图", "Peta"))} ↗</a></dd></div><div><dt>${esc(tr("Opening hours", "营业时间", "Waktu operasi"))}</dt><dd>${esc(formatHours())}${note ? `<br><span class="small-note">${esc(note)}</span>` : ""}</dd></div></dl>${extra}</div>`;
  }
  const isExactImage = (name, category = "Bakery") => catalogueAssignment(name, category)?.match === "exact";
  // Only machines with a confirmed photograph of themselves show an image; others render as clean text cards.
  const categoryImageName = (category) => {
    const items = category.items || (category.subcategories || []).flatMap((sub) => sub.items);
    return items.find((item) => isExactImage(item.name, category.name))?.name || "";
  };
  const categoryImage = (category) => {
    const name = categoryImageName(category);
    return name ? catalogueImage(name, category.name) : category.name === 'Production Line' ? '<figure class="catalogue-media is-category-context">'+assetImage(sectionAsset('currentProduction'),'catalogue-photo')+'</figure>' : "";
  };
  function catalogueCard(item, categoryName, options = {}) {
    const exact=isExactImage(item.name,categoryName),sub=item.subcategory?' · '+localName(item.subcategory):'';
    return `<a class="catalogue-item ${exact?'has-photo':'is-text-card'}" href="${productUrl(item.name)}" data-item-name="${esc(item.name.toLowerCase())}" data-subcategory="${esc(item.subcategory||'')}">${exact?catalogueImage(item.name,categoryName):''}<div class="catalogue-copy"><small>${esc(localName(categoryName)+sub)}</small><strong>${esc(displayName(item.name))} <span aria-hidden="true">↗</span></strong>${options.reason?`<span class="catalogue-reason">${esc(options.reason)}</span>`:''}</div></a>`;
  }
  const segmentPicks = (segmentName) => (DATA.segmentRecommendations?.[segmentName] || []).map((pick) => ({ product: findProduct(pick.name), pick })).filter(({ product }) => product);
  const catalogueCardByName = (name, options) => {
    const product = findProduct(name);
    return product ? catalogueCard(product, product.category, options) : "";
  };

  function locationsPage() { return window.LSIndustrial.locations(designConfig('company/locations')); }

  function careersPage() {
    const contact=getContact(),content=getContent(),currentRoles=(Array.isArray(content.careerRoles)?content.careerRoles:CAREER_ROLE_DEFAULTS).filter(role=>role?.name?.trim()&&officialCareerUrl(role.url)).slice(0,CAREER_ROLE_LIMIT);
    const roles=currentRoles.length?currentRoles:CAREER_ROLE_DEFAULTS;
    const departments=[['Engineering','工程团队','Kejuruteraan'],['Commercial','业务与营销','Komersial'],['Business support','业务支持','Sokongan perniagaan'],['Internships','实习机会','Latihan industri']];
    const prepared=roles.map(role=>({...CAREER_ROLE_DEFAULTS.find(item=>item.url===role.url),...role}));
    const card=role=>{const name=role.titles?.en===role.name?role.titles[state.language]:role.name;const description=role.description?.[state.language]||role.description?.en||'';return `<article class="career-role"><div class="career-role-description"><small>${esc(role.type==='Internship'?tr('INTERNSHIP','实习','LATIHAN INDUSTRI'):tr('MALAYSIA','马来西亚','MALAYSIA'))}</small><h4>${esc(name||role.name)}</h4>${description?`<p>${esc(description)}</p>`:''}</div><div class="career-role-actions"><a href="${esc(role.url)}" target="_blank" rel="noopener noreferrer">${esc(tr('View role on Indeed','在 Indeed 查看职位','Lihat jawatan di Indeed'))} ↗</a><a href="mailto:${esc(contact.careersEmail)}?subject=${encodeURIComponent('Application inquiry · '+role.name)}">${esc(tr('Email HR about this role','电邮人事部咨询此职位','E-mel HR tentang jawatan ini'))} ↗</a></div></article>`;};
    const groups=departments.map(([department,zh,ms])=>({department,title:tr(department,zh,ms),items:prepared.filter(role=>(role.department||'Engineering')===department)})).filter(group=>group.items.length);
    const cards=groups.map(group=>`<section class="career-department"><header><span class="eyebrow">LS CAREERS</span><h3>${esc(group.title)}</h3></header><div>${group.items.map(card).join('')}</div></section>`).join('');
    return `<section class="reference-hero careers-hero"><figure class="reference-hero-media">${assetImage(sectionAsset('careers',content.careerImage||'recruitment'),'reference-hero-image',{loading:'eager'})}</figure><div class="reference-hero-panel"><span class="eyebrow">${esc(tr('WORK AT LS','加入 LS','BEKERJA DI LS'))}</span><h1 class="display-title">${esc(tr('Build what comes next.','一起创造下一步。','Bina langkah seterusnya.'))}</h1><p class="lede">${esc(content.careerIntro)}</p></div></section><section class="section-wrap section-pad"><div class="career-landing-copy"><span class="eyebrow">${esc(tr('PEOPLE & POSSIBILITIES','团队与机会','PASUKAN & PELUANG'))}</span><h2 class="section-title">${esc(tr('A place for practical minds.','让实干与创意相遇。','Tempat untuk pemikiran praktikal.'))}</h2><p class="body-copy">${esc(tr('From machinery and automation to the way we share our work, LS brings together people with different skills. Follow our recruitment channels for current opportunities and application details.','从机械与自动化，到展示我们的工作，LS 汇集不同专长的人才。请通过招聘平台查看当前机会与申请详情。','Daripada mesin dan automasi kepada cara kami berkongsi kerja, LS menghimpunkan pelbagai kemahiran. Ikuti saluran pengambilan kami untuk peluang semasa dan butiran permohonan.'))}</p></div><div class="career-channel-grid"><article class="career-channel"><h3>Indeed</h3><p>${esc(tr('Explore LS’s employer profile and apply through the recruitment platform.','浏览 LS 雇主页面，并通过招聘平台申请。','Terokai profil majikan LS dan mohon melalui platform pengambilan.'))}</p>${arrowLink(contact.indeedUrl,tr('Explore opportunities','探索工作机会','Terokai peluang'))}</article><article class="career-channel"><h3>${esc(tr('Talk to our HR team','联系人事团队','Hubungi pasukan HR'))}</h3><p>${esc(tr('Introduce your experience and the kind of work you would like to do.','介绍您的经验，以及希望参与的工作领域。','Perkenalkan pengalaman anda dan jenis kerja yang ingin diceburi.'))}</p>${arrowLink('mailto:'+contact.careersEmail,contact.careersEmail)}</article></div><div class="section-heading-row"><h2 class="section-title">${esc(tr('Opportunities at LS','LS 工作机会','Peluang di LS'))}</h2>${arrowLink(contact.indeedUrl,tr('All opportunities on Indeed','Indeed 上的所有机会','Semua peluang di Indeed'))}</div><div class="career-role-groups">${cards}</div></section><section class="section-pad careers-team"><div class="section-wrap"><figure>${assetImage(sectionAsset('company'),'careers-team-photo')}</figure><h2 class="section-title">${esc(tr('The people behind the machinery.','设备背后的团队。','Pasukan di sebalik mesin.'))}</h2>${arrowLink('https://www.linkedin.com/company/ls-smart-machinery-sdn-bhd','LinkedIn')}</div></section>${inquiryBandHtml('','careers')}`;
  }
  function companyPage(name = "") {
    const sub = slug(name);
    if (sub === "project-process") return window.LSBuyerResources.render(designConfig("company/project-process"),"company/project-process");
    if (sub.includes("locations")) return locationsPage();
    if (sub.includes("careers")) return careersPage();
    if (sub.includes("history")) return window.LSDesign.history(designConfig("company/history"));
    if (sub.includes("customer-experiences") || sub.includes("customer-partnerships")) return window.LSDesign.customerExperiences(designConfig("company/customer-experiences"));
    return window.LSDesign.company(designConfig(`company${name ? `/${name}` : ""}`));
  }

  function pageFooter() {
    const contact = getContact();
    const socials = SOCIAL_LINKS.map(({name,href,icon}) => `<a href="${esc(href)}" target="_blank" rel="noopener noreferrer" aria-label="LS Smart Machinery on ${esc(name)}" title="${esc(name)}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icon}</svg></a>`).join("");
    const phoneDigits = String(contact.inquiryWhatsApp || "").replace(/\D/g, "");
    return `<div class="footer-inner"><div class="footer-main"><div class="footer-brand"><a class="footer-logo" href="#home" aria-label="LS Smart Machinery home">${assetImage(sectionAsset("brand"), "brand-logo", { alt: "LS Machinery Innovation", loading: "lazy" })}</a><p><strong>LS Smart Machinery (M) <span class="company-legal-suffix">SDN BHD</span></strong><br>Company Registration No. 1308318-K<br>MATRADE Registered · MOF Organization Certified<br>${esc(contact.address)}</p></div><div class="footer-links"><h3>Explore</h3><a href="#machines">Machines</a><a href="#food">Food production</a><a href="#solutions">Solutions</a><a href="#services">Services</a></div><div class="footer-links"><h3>Company</h3><a href="#company">About LS</a><a href="#company/history">Our history</a><a href="#company/customer-experiences">Customer partnerships</a><a href="#company/locations">Locations</a><a href="#company/project-process">How a project works</a><a href="#company/careers">Careers</a><a href="#insights">Insights</a></div><div class="footer-links"><h3>Talk to LS</h3><a href="#inquiry">Contact & inquiries</a><a href="#service/spare-parts-request">Spare parts request</a>${phoneDigits ? `<a href="tel:+${esc(phoneDigits)}">${esc(contact.phone)}</a>` : `<span>${esc(contact.phone)}</span>`}<a href="mailto:${esc(contact.inquiryEmail)}">${esc(contact.inquiryEmail)}</a><a href="${esc(contact.mapUrl)}" target="_blank" rel="noopener noreferrer">${esc(tr("Address and map", "地址与地图", "Alamat dan peta"))} ↗</a><span class="small-note">${esc(formatHours())}</span></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} LS Smart Machinery (M) SDN BHD · <a class="photo-credits-link" href="food-photo-credits.html" target="_blank" rel="noopener">${esc(tr("Photo credits","照片版权","Kredit foto"))}</a></span><a class="photo-credits-link" href="/privacy/">Privacy Notice</a><div class="footer-social-icons" aria-label="Social media channels">${socials}</div></div></div>`;
  }

  function applyLanguage() {
    document.documentElement.lang = state.language === "zh" ? "zh-Hans" : state.language === "ms" ? "ms" : "en";
    languagePicker.value = state.language;
    document.querySelectorAll("[data-i18n]").forEach((element) => { element.innerHTML = t(element.dataset.i18n); });
    document.title = state.language === "en" ? "LS Smart Machinery — Production, thoughtfully engineered" : `${t("navMachines")} — LS Smart Machinery`;
  }

  function navMegamenu() {
    const groups = [
      { title: "Food production", links: FOOD_GROUPS.map((food) => [localName(food.name), `food/${slug(food.name)}`]) },
      { title: "Machines", links: DATA.categories.map((category) => [localName(category.name), `machines/${slug(category.name)}`]) },
      { title: "Solutions", links: SOLUTIONS.map((name) => [localName(name), `solution/${slug(name)}`]) },
      { title: "Services & company", links: [...SERVICES.map((name) => [localName(name), `service/${slug(name)}`]), ...COMPANY.map((name) => [localName(name), `company/${name === "About LS" ? "" : name === "Our History" ? "history" : slug(name)}`])] }
    ];
    megaPanel.innerHTML = groups.map((group) => `<div class="mega-group"><p>${esc(localName(group.title))}</p>${group.links.slice(0, 8).map(([name, path]) => `<a class="mega-feature" href="${urlFor(path)}">${esc(name)} <span aria-hidden="true">↗</span></a>`).join("")}</div>`).join("");
    const machineGroup = megaPanel.querySelectorAll(".mega-group")[1];
    const machineModels = ["LSF 502 MCD", "LSF 502 MCWC", "LSF 502 MCAD"];
    machineGroup.insertAdjacentHTML("beforeend", `<p class="mega-feature-label">Featured · verify model mapping</p>${machineModels.map((name) => `<a class="mega-feature" href="${productUrl(name)}">${esc(name)} <span aria-hidden="true">↗</span></a>`).join("")}`);
  }

  const HOME_COPY = {
    en: { aboutLink: "Get to know LS", why: [["Plan around your process", "Factory layout and production-line design shaped by your space, product and priorities."], ["Explore the right equipment", "Machinery supply and customized solutions, with suitability discussed around your requirements."], ["Build your team’s capability", "Installation, training and technology transfer to support your production team."], ["Keep support close", "Maintenance, repairs and after-sales service for the next stage of your operation."]] },
    zh: { aboutLink: "认识 LS", why: [["围绕流程进行规划", "结合厂房空间、产品及重点需求，设计工厂布局与生产线。"], ["探索合适的设备", "讨论设备供应与定制方案，并根据您的需求确认适用性。"], ["支持团队成长", "通过安装、培训与技术转移，协助您的生产团队。"], ["提供持续服务", "以维护、维修及售后服务，支持您下一阶段的运营。"]] },
    ms: { aboutLink: "Kenali LS", why: [["Rancang mengikut proses", "Reka bentuk susun atur kilang dan barisan pengeluaran berdasarkan ruang, produk dan keutamaan anda."], ["Terokai peralatan yang sesuai", "Bekalan mesin dan penyelesaian tersuai, dengan kesesuaian dibincangkan mengikut keperluan anda."], ["Bina keupayaan pasukan", "Pemasangan, latihan dan pemindahan teknologi untuk menyokong pasukan pengeluaran anda."], ["Sokongan yang berterusan", "Penyelenggaraan, pembaikan dan khidmat selepas jualan bagi peringkat operasi seterusnya."]] }
  };
  const homeText = (key) => HOME_COPY[state.language][key];

  function designConfig(route = state.route) {
    return { language:state.language, route, main, t, localName, pageText, homeText, assetImage, sectionAsset, assets:ASSETS,
      content:getContent(), categories:DATA.categories, foods:FOOD_GROUPS, segments:SEGMENTS, productUrl, catalogueImage,
      buttonLink, arrowLink, introMediaSection, inquirySection, inquiryActions, getContact, formatHours, categoryImage, catalogueCardByName, segmentPicks,
      socialLinks:SOCIAL_LINKS, stories:publishedStories(), storyImage, machinePageKey, allCatalogueItems, isExactImage, inquiryUrl, inquiryBandHtml, contactCard };
  }
  function homePage() { return window.LSDesign.home(designConfig('home')); }

  function machineIndexPage() { return window.LSIndustrial.overview(designConfig('machines')); }

  function foodIndexPage() {
    return `<section class="category-hero"><div class="section-wrap"><span class="eyebrow">${esc(t("navFood").toUpperCase())}</span><h1 class="display-title">${esc(tr("Browse by", "按食品类别浏览", "Terokai mengikut"))} <em>${esc(tr("what you make.", "您的产品。", "produk anda."))}</em></h1><div class="food-grid">${FOOD_GROUPS.map((food) => `<a class="food-card fade-in" href="${urlFor(`food/${slug(food.name)}`)}">${assetImage(sectionAsset("foods", slug(food.name)), "food-card-image", { sizes: "(max-width: 720px) 46vw, 25vw" })}<span class="food-name">${esc(localName(food.name))}</span><span class="card-arrow">↗</span></a>`).join("")}</div></div></section>${inquiryBandHtml()}`;
  }

  function categoryPage(name) { return window.LSIndustrial.category(designConfig('machines/'+name), name) || notFoundPage(); }

  function catalogueItems(items, categoryName) {
    if (!items.length) return `<div class="empty-state">${esc(t("noResults"))}</div>`;
    return items.map((item) => catalogueCard(item, categoryName)).join("");
  }

  function productPage(name) { return window.LSIndustrial.product(designConfig('machine/'+name), name) || notFoundPage(); }

  function foodPage(foodName) {
    const food=FOOD_GROUPS.find(item=>slug(item.name)===slug(foodName));
    return food ? window.LSDesign.food(designConfig('food/'+slug(food.name)),food) : notFoundPage();
  }

  function segmentPage(name) {
    const segment=SEGMENTS.find(item=>slug(item.name)===slug(name));
    return segment ? window.LSDesign.segment(designConfig('segment/'+slug(segment.name)),segment) : notFoundPage();
  }

  function searchPage() {
    return `<section class="section-wrap section-pad industrial-range"><span class="eyebrow">LS MACHINERY</span><h1 class="display-title">${esc(tr('Find equipment by name or model.','按名称或型号查找设备。','Cari peralatan mengikut nama atau model.'))}</h1><form role="search" action="/search/"><label class="field"><span>${esc(tr('Machine name, model or process','设备名称、型号或工序','Nama mesin, model atau proses'))}</span><input type="search" name="q" value="${esc(new URLSearchParams(location.search).get('q')||'')}" placeholder="LSF-502, mixer, cookie" autocomplete="off"></label><button class="button-link" type="submit">${esc(tr('Search','查找','Cari'))} ↗</button></form><p data-global-search-count aria-live="polite"></p><div class="catalogue-list industrial-machine-list" data-global-search-results></div></section>`;
  }

  function setupGlobalSearch() {
    const form=main.querySelector('form[role="search"]');if(!form)return;
    const input=form.querySelector('input'),list=main.querySelector('[data-global-search-results]'),count=main.querySelector('[data-global-search-count]');if(!list||!count)return;
    const normalized=value=>String(value).toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g,'');
    const update=()=>{
      const query=normalized(input.value);
      const items=allCatalogueItems().filter(item=>!query||normalized(item.name+' '+displayName(item.name)+' '+item.category+' '+(item.subcategory||'')+' '+machineTitleDefault(slug(item.name))).includes(query));
      count.textContent=tr(`${items.length} machines`,`${items.length} 台设备`,`${items.length} mesin`);
      list.innerHTML=items.length?items.map(item=>catalogueCard(item,item.category)).join(''):`<p>${esc(t('noResults'))}</p>`;
    };
    form.addEventListener('submit',event=>{event.preventDefault();history.replaceState(null,'',urlFor('search')+'?q='+encodeURIComponent(input.value));update();});
    input.addEventListener('input',update);update();
  }

  function genericOverviewPage(kind, name = "") {
    const pageName = name ? titleCase(name.replace(/-/g, " ")) : titleCase(kind);
    if (kind === 'solutions' || kind === 'solution') return window.LSProductionPages.solutions(designConfig(kind+(name?'/'+name:'')),name);
    if (kind === "services" || kind === "service") {
      return window.LSProductionPages.services(designConfig(kind+(name?'/'+name:'')),name);
    }
    if (kind === "company") return companyPage(name);
    if (kind === 'insights') return window.LSProductionPages.insights(designConfig('insights'));
    return notFoundPage();
  }

  function inquirySection(machine = "", forceGeneral = false) {
    const isSpareRequest = !forceGeneral && machine.toLowerCase().includes("spare");
    const preselectedType = isSpareRequest ? "Spare parts request" : "";
    const carriedMessage = forceGeneral && state.carryMessageContext === machine ? state.carryMessage : "";
    const contextLabel = tr("Inquiry context", "咨询内容", "Konteks pertanyaan");
    return `<section class="inquiry-section section-pad" id="inquiry"><div class="section-wrap inquiry-layout"><div><span class="eyebrow">${esc(t("contactLabel"))}</span><h2 class="section-title">${esc(pageText("contactTitle"))}</h2><p class="body-copy">${esc(pageText("contactBody"))}</p>${contactCard()}</div><div class="inquiry-card">${machine ? `<p class="inquiry-context"><span>${esc(contextLabel)}</span><strong>${esc(machine)}</strong></p>` : ""}<form class="inquiry-form" id="lead-form" data-machine="${esc(machine)}" data-spare="${isSpareRequest}"><div class="field"><label for="inq-type">${esc(t("inquiryType"))}</label><select id="inq-type" name="inquiryType"><option value="">${esc(t("selectOne"))}</option>${[["Request a quote", t("askForQuote")], ["Book a consultation", t("consult")], ["Arrange a visit", t("visit")], ...(isSpareRequest ? [["Spare parts request", t("spareParts")]] : [])].map(([value, label]) => `<option value="${esc(value)}" ${value === preselectedType ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></div><div class="field"><label for="inq-company">${esc(t("company"))}</label><input id="inq-company" name="company" autocomplete="organization"></div><div class="field full"><label for="inq-name">${esc(tr("Name", "姓名", "Nama"))} *</label><input id="inq-name" name="name" autocomplete="name" required></div><div class="field"><label for="inq-email">${esc(t("email"))}</label><input id="inq-email" name="email" type="email" autocomplete="email"></div><div class="field"><label for="inq-phone">${esc(t("phone"))}</label><input id="inq-phone" name="phone" type="tel" autocomplete="tel"></div><div class="field full"><label for="inq-country">${esc(t("country"))}</label><input id="inq-country" name="country" autocomplete="country-name"></div>${isSpareRequest ? `<div class="field"><label for="part-machine">${esc(t("machineNumber"))}</label><input id="part-machine" name="machineNumber"></div><div class="field"><label for="part-model">${esc(t("model"))}</label><input id="part-model" name="partModel"></div><div class="field full"><label for="part-number">${esc(t("partNumber"))}</label><input id="part-number" name="partNumber"></div><div class="field"><label for="part-description">${esc(t("description"))} *</label><input id="part-description" name="partDescription" required></div><div class="field"><label for="part-quantity">${esc(t("quantity"))}</label><input id="part-quantity" name="quantity" type="number" min="1"></div><div class="field full"><label for="part-address">${esc(t("deliveryAddress"))}</label><textarea id="part-address" name="deliveryAddress"></textarea></div><div class="field full"><label for="part-remarks">${esc(t("remarks"))}</label><textarea id="part-remarks" name="remarks"></textarea></div>` : `<div class="field full"><label for="inq-message">${esc(t("message"))} *</label><textarea id="inq-message" name="message" required>${esc(carriedMessage)}</textarea></div>`}<details class="field full inquiry-production-details"><summary>${esc(tr("Production details (optional)","生产资料（选填）","Butiran pengeluaran (pilihan)"))}</summary><div class="field"><label for="inq-product">${esc(tr("What do you produce?","您生产什么食品？","Apakah produk anda?"))}</label><input id="inq-product" name="product"></div><div class="field"><label for="inq-output">${esc(tr("Approximate daily output","大约日产量","Anggaran output harian"))}</label><input id="inq-output" name="dailyOutput"></div><div class="field"><label for="inq-factory">${esc(tr("Factory location","工厂位置","Lokasi kilang"))}</label><input id="inq-factory" name="factoryLocation"></div><div class="field"><label for="inq-timeline">${esc(tr("Planned timing","计划时间","Jangka masa"))}</label><input id="inq-timeline" name="timeline"></div></details><p class="field full small-note">${esc(tr("LS uses these details to respond to your request.","LS 使用这些资料回复您的咨询。","LS menggunakan butiran ini untuk membalas pertanyaan anda."))} <a href="/privacy/">${esc(tr("Privacy Notice","隐私声明","Notis Privasi"))}</a></p><input name="website" tabindex="-1" autocomplete="off" hidden aria-hidden="true"><div class="form-actions"><button class="button-link" type="submit" data-submit-inquiry hidden>${esc(tr("Send request","发送咨询","Hantar pertanyaan"))} ↗</button><button class="button-link" type="button" data-open-email>${esc(t("openEmail"))} <span class="button-arrow">↗</span></button><button class="button-link outline" type="button" data-open-whatsapp>${esc(t("openWhatsApp"))} <span class="button-arrow">↗</span></button></div>${isSpareRequest ? `<button class="button-link outline" type="button" data-general-inquiry>I cannot identify the part · use general inquiry ↗</button>` : ""}<p class="form-status" role="status"></p></form></div></div></section>`;
  }

  function notFoundPage() {
    return `<section class="not-found section-wrap"><span class="eyebrow">LS SMART MACHINERY</span><h1 class="display-title">This page is <em>not here.</em></h1><p class="lede">The link may be incomplete. Browse the catalogue or return to the homepage.</p>${buttonLink("#home", "Return home")}</section>`;
  }

  function render() {
    const rawRoute = itemRoute();
    const route = rawRoute.split("?")[0] || "home";
    const routeParams = new URLSearchParams(rawRoute.split("?")[1] || "");
    const routeContext = routeParams.get("context") || "";
    if (state.carryMessage && state.carryMessageContext !== routeContext) { state.carryMessage = ""; state.carryMessageContext = ""; }
    state.route = route;
    const [kind, ...rest] = route.split("/");
    const value = rest.join("/");
    let html;
    if (kind === "home" || kind === "") html = homePage();
    else if (kind === "privacy") html = window.LSBuyerResources.render(designConfig(route),route);
    else if (kind === "search") html = searchPage();
    else if (kind === "machines") html = value ? categoryPage(value) : machineIndexPage();
    else if (kind === "machine") html = productPage(value);
    else if (kind === "food") html = value ? foodPage(value) : foodIndexPage();
    else if (kind === "segment") html = segmentPage(value);
    else if (kind === "solution" || kind === "solutions") html = genericOverviewPage(kind, value);
    else if (kind === "service" || kind === "services") html = genericOverviewPage(kind, value);
    else if (kind === "company") html = genericOverviewPage(kind, value);
    else if (kind === "insights") html = genericOverviewPage(kind, value);
    else if (kind === "inquiry") html = inquirySection(routeParams.get("context") || "", routeParams.get("type") === "general");
    else html = notFoundPage();
    main.innerHTML = html.replace(/<section class="section-wrap section-pad solution-video-block">[\s\S]*?<\/section>/, "");
    document.getElementById("footer").innerHTML = pageFooter();
    hydratePageImages(route);
    window.LSDesign.enhance(designConfig(route));
    if(route==='machines'){
      const hero=main.querySelector('.reference-hero-panel');
      hero?.insertAdjacentHTML('beforeend',`<form class="catalogue-global-search" role="search" action="/search/"><label class="sr-only" for="catalogue-global-q">Search all machines by name or model</label><input id="catalogue-global-q" name="q" type="search" placeholder="Search all machines · name or model"><button class="button-link" type="submit">Search ↗</button></form>`);
    }
    main.dataset.route=route;
    applyLanguage();
    window.LSNavigation.refresh();
    window.LSRouter.convertLinks();
    window.LSPageMetadata.update(route);
    syncMotionControls();
    const inquiryLink = document.querySelector('[data-nav="inquiry"]');
    const machineContext = route.startsWith("machine/") ? (findProduct(route.split("/").pop())?.name || route.split("/").pop().toUpperCase().replace(/-/g, " ")) : "";
    if (inquiryLink) inquiryLink.href = inquiryUrl(machineContext);
    const quickWhatsApp=document.querySelector('.header-whatsapp');
    const quickContext=machineContext||(route==='home'?'LS food production':document.querySelector('#main h1')?.textContent?.replace(/([.!?])(?=[A-Za-z])/g,'$1 ').replace(/[.!?]+$/,''));
    if(quickWhatsApp)quickWhatsApp.href=inquiryLinks({machine:quickContext,intent:route.startsWith('service')?'service':'consult',audience:route==='company/careers'?'careers':'sales'}).whatsapp;
    observeMotion();
    setupVideoMotion();
    updateNav();
    setupCatalogueSearch();
    setupGlobalSearch();
    setupInquiryForm();
    window.LSIndustrial.mount(designConfig(route));
    const intent = routeParams.get('intent');
    const intentNames = {quote:'Request a quote',consult:'Book a consultation',visit:'Arrange a visit',service:'Book a consultation'};
    const inquiryType = main.querySelector('#inq-type');
    if (intentNames[intent] && inquiryType) {
      inquiryType.value = intentNames[intent];
      inquiryType.dispatchEvent(new Event('change', {bubbles:true}));
    }
    main.querySelectorAll('section[id]').forEach(section => {
      const labels = {suitability:t('suitability'),features:t('features'),applications:t('application'),technical:t('technical'),complementary:t('complementary'),similar:t('similar'),inquiry:t('contactUs'),process:state.language==='zh'?'规划':state.language==='ms'?'Perancangan':'Planning',equipment:t('navMachines')};
      if (labels[section.id]) section.dataset.indexLabel = labels[section.id];
    });
    window.LSExperience.mount({main,route,language:state.language,motionAllowed:()=>!state.motionPaused});
    window.scrollTo({top:0,behavior:'instant'});
  }

  function updateNav() {
    document.querySelectorAll("[data-nav]").forEach((link) => link.classList.remove("active"));
    const root = state.route.split("/")[0];
    const match = root === "food" ? "food" : root === "machine" || root === "machines" ? "machines" : root === "solution" || root === "solutions" ? "solutions" : root === "service" || root === "services" ? "services" : root === "company" ? "company" : root === "insights" ? "insights" : "";
    const link = match && document.querySelector(`[data-nav="${match}"]`);
    if (link) link.classList.add("active");
  }

  function hydratePageImages(route) {
    if(main.querySelector(".production-page")) return;
    const [kind, ...rest] = route.split("/");
    const pageName = rest.join("/");
    const appendPhoto = (target, imageId, captionKey, className = "route-photo") => {
      if (!target || !imageId || !ASSETS.images[imageId] || target.querySelector("img")) return;
      const caption = ASSETS.captions?.[captionKey];
      target.insertAdjacentHTML("afterbegin", `<figure class="${className}">${assetImage(imageId, "photo-image", { sizes: "(max-width: 720px) 90vw, 34vw" })}${caption ? `<figcaption>${esc(assetText(caption))}</figcaption>` : ""}</figure>`);
    };

    if (kind === "solution" || kind === "solutions") {
      const key = pageName ? slug(pageName) : "machinery-automation";
      appendPhoto(main.querySelector(".content-info-card"), sectionAsset("solutions", key) || sectionAsset("solutions", "machinery-automation"), "solutions");
      main.querySelectorAll(".tiles-grid .info-tile").forEach((tile) => {
        const title = slug(tile.querySelector("h3")?.textContent || "");
        const imageId = sectionAsset("solutions", title);
        if (imageId) appendPhoto(tile, imageId, "solutions", "tile-photo");
      });
    } else if (kind === "service" || kind === "services") {
      appendPhoto(main.querySelector(".content-info-card"), sectionAsset("services"), "services");
    } else if (kind === "company") {
      const imageId = pageName.includes("location") ? sectionAsset("building") : pageName.includes("history") ? sectionAsset("building") : sectionAsset("company");
      appendPhoto(main.querySelector(".content-info-card"), imageId, pageName.includes("location") || pageName.includes("history") ? "building" : "company");
    } else if (kind === "insights" || kind === "inquiry" || main.querySelector(".not-found")) {
      appendPhoto(main.querySelector(".content-info-card") || main.querySelector(".not-found"), sectionAsset("building"), "building");
    }
  }

  function syncMotionControls() {
    document.body.classList.toggle("motion-paused", Boolean(state.motionPaused));
    document.documentElement.classList.toggle("motion-opted-in", Boolean(state.motionOptIn));
    document.querySelectorAll("[data-motion-toggle]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Boolean(state.motionPaused)));
      const label = button.querySelector("[data-motion-label]");
      if (label) label.textContent = t(state.motionPaused ? "motionPlay" : "motionPause");
      if (state.motionPaused) button.querySelector("[data-motion-icon]")?.replaceChildren(document.createTextNode("▶"));
      else button.querySelector("[data-motion-icon]")?.replaceChildren(document.createTextNode("Ⅱ"));
    });
    if (state.motionPaused) document.querySelectorAll("video").forEach((video) => video.pause());
    window.dispatchEvent(new Event("ls:motion-change"));
  }

  function setupVideoMotion() {
    const videos = document.querySelectorAll("[data-motion-video]");
    videos.forEach((video) => {
      const showPoster = () => {
        video.hidden = true;
        const fallback = video.parentElement.querySelector(".video-static-fallback");
        if (fallback) fallback.hidden = false;
      };
      video.addEventListener("error", showPoster, { once: true });
      video.querySelectorAll("source").forEach((source) => source.addEventListener("error", showPoster, { once: true }));
    });
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) entry.target.pause();
    }), { threshold: .08 });
    videos.forEach((video) => observer.observe(video));
  }

  function observeMotion() {
    const nodes = document.querySelectorAll(".fade-in");
    const reducedMotionActive = matchMedia("(prefers-reduced-motion: reduce)").matches && !state.motionOptIn;
    if (state.motionPaused || !("IntersectionObserver" in window) || reducedMotionActive) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); }
    }), { threshold: .14 });
    nodes.forEach((node) => observer.observe(node));
  }

  function setupCatalogueSearch() {
    const search = document.getElementById("catalogue-search");
    const filter = document.getElementById("subcategory-filter");
    const list = document.getElementById("catalogue-list");
    if (!search || !list) return;
    const categoryName = state.route.split("/").slice(1).join("/");
    const category = findCategory(categoryName);
    const items = category.items || (category.subcategories || []).flatMap((sub) => sub.items.map((item) => ({ ...item, subcategory: sub.name })));
    const categoryKey = slug(category.name);
    const count = document.getElementById("catalogue-count");
    const pagination = document.getElementById("catalogue-pagination");
    let currentPage = 1;
    let filteredItems = [];
    const storageKey = `${CATALOGUE_STATE_PREFIX}${categoryKey}`;
    let savedState = null;
    try {
      const returningCategory = sessionStorage.getItem(CATALOGUE_RETURN_KEY);
      if (returningCategory === categoryKey) {
        savedState = JSON.parse(sessionStorage.getItem(storageKey) || "null");
        sessionStorage.removeItem(CATALOGUE_RETURN_KEY);
      }
    } catch { /* private browsing may disable session storage */ }
    if (savedState) {
      search.value = savedState.query || "";
      if (filter) filter.value = savedState.subcategory || "all";
      currentPage = Math.max(1, Number(savedState.page) || 1);
    }
    const saveState = (scrollY = window.scrollY) => {
      try { sessionStorage.setItem(storageKey, JSON.stringify({ query: search.value, subcategory: filter?.value || "all", page: currentPage, scrollY })); }
      catch { /* state restoration is optional when session storage is unavailable */ }
    };
    const renderPage = () => {
      const query = search.value.trim().toLowerCase().replace(/[\s_-]+/g, "");
      const sub = filter ? filter.value : "all";
      filteredItems = items.filter((item) => `${item.name} ${displayName(item.name)} ${machineTitleDefault(slug(item.name))} ${item.subcategory || ""}`.toLowerCase().replace(/[\s_-]+/g, "").includes(query) && (sub === "all" || item.subcategory === sub));
      const totalPages = Math.max(1, Math.ceil(filteredItems.length / CATALOGUE_PAGE_SIZE));
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
      const start = (currentPage - 1) * CATALOGUE_PAGE_SIZE;
      list.innerHTML = filteredItems.length ? catalogueItems(filteredItems.slice(start, start + CATALOGUE_PAGE_SIZE), category.name) : `<div class="empty-state">${esc(t("noResults"))}</div>`;
      if (count) count.textContent = state.language === "zh" ? `${filteredItems.length} 台设备` : state.language === "ms" ? `${filteredItems.length} mesin` : `${filteredItems.length} ${filteredItems.length === 1 ? "machine" : "machines"}`;
      if (pagination) {
        const pageLabel = (number) => tr(`Page ${number}`, `第 ${number} 页`, `Halaman ${number}`);
        const buttons = Array.from({ length: totalPages }, (_, index) => `<button type="button" data-catalogue-page="${index + 1}" aria-label="${esc(pageLabel(index + 1))}" ${currentPage === index + 1 ? 'aria-current="page"' : ""}>${index + 1}</button>`).join("");
        pagination.innerHTML = totalPages > 1 ? `<button type="button" data-page-step="-1" aria-label="${esc(tr("Previous page", "上一页", "Halaman sebelumnya"))}" ${currentPage === 1 ? "disabled" : ""}>←</button>${buttons}<button type="button" data-page-step="1" aria-label="${esc(tr("Next page", "下一页", "Halaman seterusnya"))}" ${currentPage === totalPages ? "disabled" : ""}>→</button>` : "";
      }
      saveState();
    };
    search.addEventListener("input", () => { currentPage = 1; renderPage(); });
    if (filter) filter.addEventListener("change", () => { currentPage = 1; renderPage(); });
    pagination?.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-catalogue-page],button[data-page-step]");
      if (!button || button.disabled) return;
      currentPage = button.dataset.cataloguePage ? Number(button.dataset.cataloguePage) : currentPage + Number(button.dataset.pageStep);
      renderPage();
    });
    list.addEventListener("click", (event) => {
      const card = event.target.closest("a.catalogue-item");
      if (!card) return;
      saveState(window.scrollY);
      try { sessionStorage.setItem(CATALOGUE_RETURN_KEY, categoryKey); } catch { /* state restoration is optional */ }
    });
    renderPage();
    if (savedState && Number.isFinite(Number(savedState.scrollY))) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: Math.max(0, Number(savedState.scrollY)), behavior: "instant" })));
  }

  function setupInquiryForm() {
    const form = document.getElementById("lead-form");
    if (!form) return;
    const status = form.querySelector(".form-status");
    const getValues = () => Object.fromEntries(new FormData(form).entries());
    const draftKey='ls.inquiry-session.v1:'+form.dataset.machine+':'+form.dataset.spare;
    try{const saved=JSON.parse(sessionStorage.getItem(draftKey)||'null');if(saved)Object.entries(saved).forEach(([name,value])=>{const input=form.elements.namedItem(name);if(input&&name!=='website')input.value=value;});}catch{}
    const saveValues=()=>{try{sessionStorage.setItem(draftKey,JSON.stringify(getValues()));}catch{}};
    form.addEventListener('input',saveValues);form.addEventListener('change',saveValues);
    const webSubmit=form.querySelector('[data-submit-inquiry]');
    fetch('/api/config').then(response=>response.ok?response.json():null).then(config=>{if(webSubmit&&config?.inquiryDelivery)webSubmit.hidden=false;}).catch(()=>{});
    const validateContact = () => {
      if (!form.reportValidity()) return false;
      const values = getValues();
      if (values.name?.trim() && (form.dataset.spare === "true" ? values.partDescription?.trim() : values.message?.trim()) && (values.email || values.phone)) return true;
      status.textContent = tr("Please provide an email address or telephone number so LS can reply.", "请提供电邮或电话，以便 LS 回复您。", "Sila berikan e-mel atau nombor telefon supaya LS boleh membalas.");
      form.querySelector('[name="email"]').focus();
      return false;
    };
    const formatSummary = () => {
      const values = getValues();
      const page = form.dataset.machine || (state.route.startsWith("machine/") ? state.route.split("/").pop().replace(/-/g, " ") : state.route.replace(/\//g, " / "));
      const rows = [
        `LS SMART MACHINERY — WEBSITE INQUIRY`,
        `Inquiry type: ${values.inquiryType || "General inquiry"}`,
        `Page / machine: ${page || "Home"}`,
        `Name: ${values.name || `${values.firstName || ""} ${values.lastName || ""}`.trim()}`,
        `Company: ${values.company || "Not provided"}`,
        `Email: ${values.email || "Not provided"}`,
        `Telephone: ${values.phone || "Not provided"}`,
        `Country: ${values.country || "Not provided"}`
      ];
      if (form.dataset.spare === "true") {
        rows.push(`Machine number: ${values.machineNumber || "Not provided"}`, `Model: ${values.partModel || "Not provided"}`, `Part number: ${values.partNumber || "Not provided"}`, `Part description: ${values.partDescription || "Not provided"}`, `Quantity: ${values.quantity || "Not provided"}`, `Delivery address: ${values.deliveryAddress || "Not provided"}`, `Remarks: ${values.remarks || "Not provided"}`);
      }
      if (values.message) rows.push(`Message: ${values.message}`);
      for(const [key,label] of [['product','Product'],['dailyOutput','Approximate daily output'],['factoryLocation','Factory location'],['timeline','Planned timing']])if(values[key])rows.push(`${label}: ${values[key]}`);
      rows.push(`Source page: ${new URLSearchParams(location.search).get('from')||form.dataset.machine||state.route}`);
      return rows.join("\n");
    };
    const send = (channel) => {
      if (!validateContact()) return;
      const values = getValues();
      const links = inquiryLinks({ message: formatSummary(), machine: form.dataset.machine, subject: `LS Smart Machinery inquiry — ${values.inquiryType || "Website request"}` });
      if (!links[channel]) { status.textContent = t("contactPending"); return; }
      if (channel === "email") window.location.href = links.email;
      else window.open(links.whatsapp, "_blank", "noopener,noreferrer");
      status.textContent = channel === "email" ? t("emailReady") : tr("WhatsApp is opening with your message.", "正在打开 WhatsApp 并带入您的消息。", "WhatsApp dibuka dengan mesej anda.");
    };
    let requestKey=crypto.randomUUID(),sending=false,acceptedValues='';
    form.addEventListener('input',()=>{if(acceptedValues&&JSON.stringify(getValues())!==acceptedValues){acceptedValues='';requestKey=crypto.randomUUID();if(webSubmit)webSubmit.disabled=false;}});
    const clearButton=document.createElement('button');clearButton.type='button';clearButton.className='arrow-link';clearButton.textContent=tr('Clear form','清空表单','Kosongkan borang');form.querySelector('.form-actions')?.after(clearButton);
    clearButton.addEventListener('click',()=>{if(sending)return;form.reset();form.querySelectorAll('input,textarea').forEach(input=>input.value='');try{sessionStorage.removeItem(draftKey);}catch{}status.textContent='';acceptedValues='';requestKey=crypto.randomUUID();if(webSubmit)webSubmit.disabled=false;});
    form.addEventListener("submit", async event => {
      event.preventDefault();if(sending||!validateContact())return;saveValues();sending=true;if(webSubmit)webSubmit.disabled=true;
      status.textContent=tr('Sending your request…','正在发送您的咨询…','Menghantar pertanyaan anda…');
      try{
        const response=await fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestKey},body:JSON.stringify({...getValues(),kind:form.dataset.spare==='true'?'spare-parts':'inquiry',context:form.dataset.machine||'',sourcePage:new URLSearchParams(location.search).get('from')||state.route,language:state.language,messageText:formatSummary()}),signal:AbortSignal.timeout(20000)});
        const result=await response.json();if(!response.ok||!result.reference)throw new Error('delivery');
        status.textContent=tr(`Your request was accepted for delivery. Reference: ${result.reference}. Keep this reference for your follow-up.`,`您的咨询已获接受并安排递送。参考编号：${result.reference}。请保留此编号以便跟进。`,`Pertanyaan diterima untuk penghantaran. Rujukan: ${result.reference}. Simpan rujukan untuk susulan.`);
        acceptedValues=JSON.stringify(getValues());
        window.dispatchEvent(new CustomEvent('ls:inquiry-accepted',{detail:{reference:result.reference,kind:form.dataset.spare==='true'?'spare-parts':'inquiry'}}));
      }catch{status.textContent=tr('Your request could not be submitted. Your details are still here. Use email or WhatsApp to contact LS.','暂时无法提交。您的资料仍保留在此，请使用电邮或 WhatsApp 联系 LS。','Pertanyaan tidak dapat dihantar. Butiran anda masih ada. Gunakan e-mel atau WhatsApp untuk menghubungi LS.');}
      finally{sending=false;if(webSubmit)webSubmit.disabled=acceptedValues===JSON.stringify(getValues());}
    });
    form.querySelector('[data-open-email]')?.addEventListener('click',()=>{saveValues();send('email');});
    form.querySelector("[data-open-whatsapp]")?.addEventListener("click", () => send("whatsapp"));
    const carryPartDetails = () => {
      state.carryMessage = `Part identification follow-up requested.\n\n${formatSummary()}`;
      state.carryMessageContext = "Spare parts follow-up";
      window.LSRouter.navigate(`inquiry?type=general&context=${encodeURIComponent(state.carryMessageContext)}`);
    };
    form.querySelector("[data-general-inquiry]")?.addEventListener("click", carryPartDetails);
    main.querySelectorAll('a[href^="#inquiry?type=general"],a[href^="/inquiry/?type=general"]').forEach(link=>link.addEventListener("click",event=>{event.preventDefault();carryPartDetails();}));
  }

  function cmsSeed(language = state.language) {
    if (state.cmsPage === "stories") return storySeed(language);
    if (state.cmsPage === "careers") return { ...DEFAULT_CONTENT[language], careerRoles: CAREER_ROLE_DEFAULTS.map((role) => ({ ...role })) };
    if (state.cmsPage === "machine") return { ...DEFAULT_CONTENT[language], machineTitle: machineTitleDefault(state.cmsMachineSlug), machineIntro: machineIntroDefault(state.cmsMachineSlug, language) };
    return { ...DEFAULT_CONTENT[language] };
  }
  function cmsLanguagePicker() {
    const options = [["en", "English"], ["zh", "简体中文"], ["ms", "Bahasa Melayu"]];
    return `<label class="field"><span>Content language</span><select id="cms-language">${options.map(([code, name]) => `<option value="${code}" ${state.language === code ? "selected" : ""}>${name}</option>`).join("")}</select></label>`;
  }
  function switchCmsLanguage(language, rerenderEditor) {
    if (!WORDS[language]) return;
    state.language = language;
    languagePicker.value = language;
    writeStore(STORAGE.language, language);
    state.contactFields = null;
    state.cmsFields = cmsFields(language);
    state.cmsTechnicalReview = state.cmsPage === "machine" ? Boolean(readStore(STORAGE.drafts, {})[language]?.[cmsPageStorageKey()]?.technicalReview) : false;
    render();
    rerenderEditor();
  }
  const cmsPageStorageKey = (page = state.cmsPage) => page === "machine" ? `machine:${state.cmsMachineSlug}` : page;
  function cmsFields(language = state.language) {
    const saved = readStore(STORAGE.published, {});
    const draft = readStore(STORAGE.drafts, {});
    const pageKey = state.cmsPage === "machine" ? "machine" : state.cmsPage;
    if (state.cmsPage === "stories") {
      const seed = storySeed(language);
      const current = saved[language] || {};
      return {
        ...seed,
        clients: current.clients || seed.clients,
        experiences: current.experiences || seed.experiences,
        ...(draft[language]?.stories || {})
      };
    }
    if (state.cmsPage === "machine") {
      const machineKey = state.cmsMachineSlug;
      const legacySaved = machineKey === "mini-cookie-depositor-mcd" ? {
        ...(typeof saved[language]?.machineTitle === "string" ? { machineTitle: saved[language].machineTitle } : {}),
        ...(typeof saved[language]?.machineIntro === "string" ? { machineIntro: saved[language].machineIntro } : {})
      } : {};
      const legacyDraft = machineKey === "mini-cookie-depositor-mcd" ? draft[language]?.machine : {};
      return {
        ...cmsSeed(language),
        ...(saved[language]?.machinePages?.[machineKey] || legacySaved),
        ...(draft[language]?.[cmsPageStorageKey()] || legacyDraft || {})
      };
    }
    return { ...cmsSeed(language), ...(saved[language] || {}), ...(draft[language]?.[pageKey] || {}) };
  }
  function cmsOpen() {
    state.cmsOpen = true;
    state.cmsFields = cmsFields();
    state.cmsTechnicalReview = state.cmsPage === "machine" ? Boolean(readStore(STORAGE.drafts, {})[state.language]?.[cmsPageStorageKey()]?.technicalReview) : false;
    renderCms();
  }
  function cmsClose() {
    state.cmsOpen = false;
    document.querySelector(".cms-overlay")?.remove();
    document.body.classList.remove("modal-open");
  }
  function cmsPreview(fields = state.cmsFields) {
    if (state.cmsPage === "machine") return `<span class="eyebrow">MACHINE PREVIEW · DETAILS SUBJECT TO TECHNICAL REVIEW</span><h3>${esc(fields.machineTitle || "LSF 502 MCD")}</h3><p>${esc(fields.machineIntro || "")}</p><span class="small-note">Technical review: ${state.cmsTechnicalReview ? "Confirmed for this local preview" : "Required before publish"}</span>`;
    if (state.cmsPage === "solutions") return `<span class="eyebrow">SOLUTIONS PREVIEW</span><h3>${esc(fields.solutionIntro || "")}</h3><div class="small-note">Factory planning · Machinery · Facility fit-out · Financing support</div>`;
    if (state.cmsPage === "stories") {
      const clients = (fields.clients || []).filter((item) => item?.name && item?.source && (!item.image || ["gardenia", "tk-bakery"].includes(item.image)) && (!item.customImage || isLocalStoryImage(item.customImage))).slice(0, 100);
      const experiences = (fields.experiences || []).filter((item) => (item?.image && sectionAsset("customerExperiences", item.image)) || isLocalStoryImage(item?.customImage)).slice(0, 10);
      return `<span class="eyebrow">CLIENTS & EXPERIENCES · PRIVATE PREVIEW</span><h3>Featured clients</h3><div class="cms-story-client-preview">${clients.map((item) => `<figure>${item.image || item.customImage ? storyImage(item.customImage, sectionAsset("clients", item.image), "cms-story-client-image", { alt: item.name }) : `<strong>${esc(item.name)}</strong>`}<figcaption>${esc(item.name)}</figcaption></figure>`).join("") || "<p>No client entries selected.</p>"}</div><h3>Gallery preview</h3><div class="cms-story-gallery-preview">${experiences.map((item) => `<figure>${storyImage(item.customImage, sectionAsset("customerExperiences", item.image), "cms-story-gallery-image", { alt: item.customImage ? (item.title || item.body || "LS gallery image") : undefined })}<figcaption>${esc(item.title || item.source || "Gallery image")}</figcaption>${item.body ? `<p>${esc(item.body)}</p>` : ""}</figure>`).join("")}</div>`;
    }
    if (state.cmsPage === "careers") {
      const roles = (fields.careerRoles || []).filter((role) => role?.name?.trim() && officialCareerUrl(role.url)).slice(0, CAREER_ROLE_LIMIT);
      const imageId = sectionAsset("careers", ["recruitment", "team"].includes(fields.careerImage) ? fields.careerImage : "recruitment");
      return `<span class="eyebrow">CAREERS · PRIVATE PREVIEW</span><h3>${esc(t("careersTitle"))}</h3>${assetImage(imageId, "cms-career-preview-image", { alt: "LS careers image" })}<p>${esc(fields.careerIntro || "")}</p><ul class="cms-career-preview-list">${roles.map((role) => `<li>${esc(role.name)}</li>`).join("")}</ul><small>Official job list source checked ${CAREER_SOURCE_CHECKED}.</small>`;
    }
    if (state.cmsPage === "home") {
      const leadMachine = HOME_HERO_MACHINES.find((machine) => machine.model === fields.homeHeroModel) || HOME_HERO_MACHINES[0];
      const imageId = ASSETS.catalogue[leadMachine.catalogueName]?.image;
      return `<span class="eyebrow">HOMEPAGE PREVIEW / ${esc(state.language.toUpperCase())}</span>${assetImage(imageId, "cms-home-machine-preview", { alt: `${leadMachine.model} machine image` })}<h3>${esc(fields.heroTitleA || "")} <em>${esc(fields.heroTitleB || "")}</em></h3><p>${esc(fields.heroLead || "")}</p><span class="small-note">${esc(fields.homeIntro || "")}</span><hr><span class="eyebrow">${esc(t("currentLabel"))}</span><h3>${esc(fields.currentTitle || "")}</h3><p>${esc(fields.currentText || "")}</p>`;
    }
    return `<span class="eyebrow">HOMEPAGE PREVIEW / ${esc(state.language.toUpperCase())}</span><h3>${esc(fields.heroTitleA || "")} <em>${esc(fields.heroTitleB || "")}</em></h3><p>${esc(fields.heroLead || "")}</p><span class="small-note">${esc(fields.homeIntro || "")}</span><hr><span class="eyebrow">${esc(t("currentLabel"))}</span><h3>${esc(fields.currentTitle || "")}</h3><p>${esc(fields.currentText || "")}</p>`;
  }
  function storyCmsMarkup(fields) {
    const clients = Array.from({ length: Math.min(100,Math.max(6,fields.clients?.length||0)) }, (_, index) => ({ name: "", image: "", source: "", ...(fields.clients?.[index] || {}) }));
    const experiences = Array.from({ length: 10 }, (_, index) => ({ title: "", body: "", image: `photo-${index + 1}`, source: `LS published gallery · Gallery image ${index + 1}`, ...(fields.experiences?.[index] || {}) }));
    const clientChoices = `<option value="">Name only</option><option value="gardenia">Gardenia logo</option><option value="tk-bakery">TK Bakery logo</option>`;
    const galleryChoices = `<option value="">Hide this image</option>${Object.keys(ASSETS.sections?.customerExperiences || {}).map((key) => `<option value="${esc(key)}">${esc(key.replace(/^photo-/, "Gallery photo "))}</option>`).join("")}`;
    const clientFields = clients.map((item, index) => `<details class="cms-story-slot" ${index < 2 ? "open" : ""}><summary>Client ${String(index + 1).padStart(2, "0")}${item.name ? ` · ${esc(item.name)}` : " · empty"}</summary><div class="field"><label for="story-client-${index}-name">Name</label><input id="story-client-${index}-name" data-story-client-name="${index}" value="${esc(item.name)}" maxlength="80"></div><div class="field"><label for="story-client-${index}-image">Image from verified library</label><select id="story-client-${index}-image" data-story-client-image="${index}">${clientChoices.replace(`value="${esc(item.image)}"`, `value="${esc(item.image)}" selected`)}</select></div><div class="field"><label for="story-client-${index}-source">Source reference</label><input id="story-client-${index}-source" data-story-client-source="${index}" value="${esc(item.source || "")}" placeholder="Published LS material or approved source"></div><div class="field"><label for="story-client-${index}-upload">Replace with approved image</label><input id="story-client-${index}-upload" type="file" accept="image/jpeg,image/png,image/webp" data-story-upload="client" data-story-index="${index}"><span class="small-note">Local preview only. Images are reduced before saving to this browser.</span></div></details>`).join("");
    const experienceFields = experiences.map((item, index) => `<details class="cms-story-slot"><summary>Gallery item ${String(index + 1).padStart(2, "0")}${item.title ? ` · ${esc(item.title)}` : ""}</summary><div class="field"><label for="story-item-${index}-title">Title</label><input id="story-item-${index}-title" data-story-title="${index}" value="${esc(item.title || "")}" maxlength="100"></div><div class="field"><label for="story-item-${index}-body">Description</label><textarea id="story-item-${index}-body" data-story-body="${index}" maxlength="300">${esc(item.body || "")}</textarea></div><div class="field"><label for="story-item-${index}-image">Image from LS gallery</label><select id="story-item-${index}-image" data-story-image="${index}">${galleryChoices.replace(`value="${esc(item.image || "")}"`, `value="${esc(item.image || "")}" selected`)}</select></div><div class="field"><label for="story-item-${index}-source">Source reference</label><input id="story-item-${index}-source" data-story-experience-source="${index}" value="${esc(item.source || "")}"></div><div class="field"><label for="story-item-${index}-upload">Use another approved image</label><input id="story-item-${index}-upload" type="file" accept="image/jpeg,image/png,image/webp" data-story-upload="experience" data-story-index="${index}"><span class="small-note">Do not identify a client or machine unless the source confirms it.</span></div></details>`).join("");
    return `<p class="small-note">Edit documented client entries and ten gallery items. Add a source reference before publishing an entry. Attributed customer comments require an authentic quotation.</p><h3>Company logo strip</h3>${clientFields}<button type="button" class="cms-button light" data-add-client ${clients.length>=100?'disabled':''}>Add another company</button><h3>Customer experience gallery · up to ten</h3>${experienceFields}`;
  }
  function careersCmsMarkup(fields) {
    const roles = Array.from({ length: Math.min(CAREER_ROLE_LIMIT,Math.max(CAREER_ROLE_DEFAULTS.length+4,fields.careerRoles?.length||0)) }, (_, index) => ({ name: "", url: "", ...(fields.careerRoles?.[index] || {}) }));
    const roleFields = roles.map((role, index) => `<details class="cms-story-slot" ${index < 2 ? "open" : ""}><summary>Listed role ${String(index + 1).padStart(2, "0")}${role.name ? ` · ${esc(role.name)}` : " · empty"}</summary><div class="field"><label for="career-role-name-${index}">Role title</label><input id="career-role-name-${index}" data-career-role-name="${index}" value="${esc(role.name)}" maxlength="100"></div><div class="field"><label for="career-role-url-${index}">Verified LS recruitment link</label><input id="career-role-url-${index}" data-career-role-url="${index}" type="url" value="${esc(role.url)}" placeholder="https://malaysia.indeed.com/..."></div></details>`).join("");
    return `<div class="field"><label for="career-intro">Careers introduction · ${esc(state.language.toUpperCase())}</label><textarea id="career-intro" data-cms-field="careerIntro">${esc(fields.careerIntro || "")}</textarea></div><div class="field"><label for="career-image">Careers hero image from LS media</label><select id="career-image" data-cms-field="careerImage"><option value="recruitment" ${fields.careerImage === "recruitment" ? "selected" : ""}>Recruitment event</option><option value="team" ${fields.careerImage === "team" ? "selected" : ""}>LS colleagues</option></select></div><p class="small-note">Role links must point to a verified LS recruitment profile or listing. Source list last checked ${CAREER_SOURCE_CHECKED}.</p><h3>Official roles · up to ten</h3>${roleFields}`;
  }
  function resizeStoryUpload(file, done, fail) {
    if (!file || !/^image\/(?:jpeg|png|webp)$/i.test(file.type)) { fail("Choose a JPG, PNG or WebP image."); return; }
    const reader = new FileReader();
    reader.onerror = () => fail("This image could not be read.");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => fail("This image could not be opened.");
      image.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) { fail("Image resizing is unavailable in this browser."); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const encoded = canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.68);
        if (encoded.length > 200000) { fail("This image is still too large for the local CMS. Choose a smaller image."); return; }
        done(encoded);
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
  function renderStoriesCms() {
    document.querySelector(".cms-overlay")?.remove();
    const fields = state.cmsFields;
    const drafts = readStore(STORAGE.drafts, {});
    const versions = readStore(STORAGE.versions, {});
    const hasDraft = !!drafts[state.language]?.stories;
    const overlay = document.createElement("div");
    overlay.className = "cms-overlay";
    overlay.innerHTML = `<section class="cms-panel" role="dialog" aria-modal="true" aria-labelledby="cms-title"><div class="cms-top"><div><span class="eyebrow">LS / LOCAL PROTOTYPE</span><h2 id="cms-title">Clients & experiences</h2></div><button class="cms-close" aria-label="${esc(t("close"))}">×</button></div><div class="cms-demo-warning">${esc(t("cmsWarning"))}<br><strong>${esc(t("cmsLocal"))}</strong></div><div class="cms-toolbar"><label class="field"><span>${esc(t("pageToEdit"))}</span><select id="cms-page"><option value="home">Homepage</option><option value="machine">Machine details</option><option value="solutions">Solutions</option><option value="stories" selected>Clients & experiences</option><option value="careers">Careers</option><option value="contact">Contact details</option></select></label>${cmsLanguagePicker()}<label class="field"><span>Preview role</span><select id="cms-role"><option value="editor">${esc(t("editor"))}</option><option value="publisher">${esc(t("publisher"))}</option></select></label></div><div class="cms-main"><div class="cms-form"><span class="eyebrow">${esc(t("copyToEdit"))} · ${esc(state.language.toUpperCase())}</span>${storyCmsMarkup(fields)}<div class="cms-actions"><button class="cms-button" data-save-draft>${esc(t("saveDraft"))}</button><button class="cms-button publish" data-publish ${state.cmsRole !== "publisher" ? "disabled" : ""}>${esc(t("publish"))}</button><button class="cms-button light" data-discard ${hasDraft ? "" : "disabled"}>${esc(t("discard"))}</button><button class="cms-button light" data-restore ${!(versions[state.language] || []).length ? "disabled" : ""}>Restore previous version</button></div><div class="cms-status" role="status"></div></div><aside class="cms-preview"><span class="eyebrow">${esc(t("preview"))}</span><div class="cms-preview-card" id="cms-preview-card">${cmsPreview(fields)}</div><div class="cms-history"><span class="eyebrow">${esc(t("history"))}</span><div id="cms-history-list">${cmsHistory()}</div></div></aside></div></section>`;
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    const status = overlay.querySelector(".cms-status");
    const refresh = () => { overlay.querySelector("#cms-preview-card").innerHTML = cmsPreview(state.cmsFields); };
    overlay.querySelector("#cms-role").value = state.cmsRole;
    overlay.querySelector(".cms-close").addEventListener("click", cmsClose);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cmsClose(); });
    overlay.querySelector("#cms-page").addEventListener("change", (event) => { state.cmsPage = event.target.value; state.cmsFields = cmsFields(); state.cmsTechnicalReview = state.cmsPage === "machine" ? Boolean(readStore(STORAGE.drafts, {})[state.language]?.[cmsPageStorageKey()]?.technicalReview) : false; renderCms(); });
    overlay.querySelector("#cms-language").addEventListener("change", (event) => switchCmsLanguage(event.target.value, renderStoriesCms));
    overlay.querySelector("#cms-role").addEventListener("change", (event) => { state.cmsRole = event.target.value; renderCms(); });
    overlay.querySelector('[data-add-client]')?.addEventListener('click',()=>{fields.clients||=[];if(fields.clients.length>=100)return;const index=fields.clients.length;fields.clients.push({name:'',image:'',source:''});renderStoriesCms();const input=document.querySelector('[data-story-client-name="'+index+'"]');input?.closest('details')?.setAttribute('open','');input?.focus();});
    overlay.querySelectorAll("[data-story-client-name]").forEach((input) => input.addEventListener("input", () => { fields.clients[Number(input.dataset.storyClientName)].name = input.value; refresh(); }));
    overlay.querySelectorAll("[data-story-client-source]").forEach((input) => input.addEventListener("input", () => { fields.clients[Number(input.dataset.storyClientSource)].source = input.value; refresh(); }));
    overlay.querySelectorAll("[data-story-client-image]").forEach((select) => select.addEventListener("change", () => { const item = fields.clients[Number(select.dataset.storyClientImage)]; item.image = select.value; item.customImage = ""; refresh(); }));
    overlay.querySelectorAll("[data-story-title]").forEach((input) => input.addEventListener("input", () => { fields.experiences[Number(input.dataset.storyTitle)].title = input.value; refresh(); }));
    overlay.querySelectorAll("[data-story-body]").forEach((input) => input.addEventListener("input", () => { fields.experiences[Number(input.dataset.storyBody)].body = input.value; refresh(); }));
    overlay.querySelectorAll("[data-story-experience-source]").forEach((input) => input.addEventListener("input", () => { fields.experiences[Number(input.dataset.storyExperienceSource)].source = input.value; refresh(); }));
    overlay.querySelectorAll("[data-story-image]").forEach((select) => select.addEventListener("change", () => { const item = fields.experiences[Number(select.dataset.storyImage)]; item.image = select.value; item.customImage = ""; refresh(); }));
    overlay.querySelectorAll("[data-story-upload]").forEach((input) => input.addEventListener("change", () => {
      const index = Number(input.dataset.storyIndex);
      const collection = input.dataset.storyUpload === "client" ? fields.clients : fields.experiences;
      const item = collection[index];
      resizeStoryUpload(input.files?.[0], (encoded) => { item.customImage = encoded; item.image = ""; status.textContent = "Image added to this private draft preview."; refresh(); }, (message) => { status.textContent = message; input.value = ""; });
    }));
    overlay.querySelector("[data-save-draft]").addEventListener("click", saveCmsDraft);
    overlay.querySelector("[data-discard]").addEventListener("click", discardCmsDraft);
    overlay.querySelector("[data-restore]").addEventListener("click", restoreCmsVersion);
    overlay.querySelector("[data-publish]").addEventListener("click", publishCmsDraft);
  }
  // ---- CMS: contact details (language-independent; same editor/publisher split as the other pages) ----
  function contactWorkingCopy() {
    const base = getContact();
    const draft = readStore(STORAGE.contactDraft, null);
    if (!draft) return base;
    return { ...base, ...draft, hours: { ...base.hours, ...(draft.hours || {}) }, hoursNote: { ...base.hoursNote, ...(draft.hoursNote || {}) } };
  }
  const normalizeWhatsApp = (value) => {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.startsWith("0") && !digits.startsWith("00") ? `60${digits.slice(1)}` : digits.replace(/^00/, "");
  };
  function validateContactFields(fields) {
    const emailOk = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
    if (!emailOk(fields.inquiryEmail)) return "Enter a valid inquiry email address.";
    if (!emailOk(fields.careersEmail)) return "Enter a valid careers email address.";
    for (const key of ["inquiryWhatsApp", "careersWhatsApp"]) {
      const digits = normalizeWhatsApp(fields[key]);
      if (digits.length < 9 || digits.length > 15) return "WhatsApp numbers need a country code and 9-15 digits, e.g. 60126577922 (a leading 0 is read as Malaysia).";
    }
    for (const key of DAY_KEYS) {
      const slot = fields.hours[key];
      if (slot && !(slot[0] && slot[1] && slot[0] < slot[1])) return `Closing time must be after opening time (${DAY_NAMES.en[DAY_KEYS.indexOf(key)]}).`;
    }
    return "";
  }
  function contactPreview(fields) {
    const lines = ["en", "zh", "ms"].map((language) => `<span class="small-note">${language.toUpperCase()} · ${esc(formatHours(fields, language))}</span>`).join("<br>");
    return `<span class="eyebrow">CONTACT PREVIEW</span><h3>${esc(fields.phone)}</h3><p><strong>Sales:</strong> ${esc(fields.inquiryEmail)} · wa.me/${esc(normalizeWhatsApp(fields.inquiryWhatsApp))}<br><strong>Careers:</strong> ${esc(fields.careersEmail)} · wa.me/${esc(normalizeWhatsApp(fields.careersWhatsApp))}</p><p>${esc(fields.address)}</p>${lines}`;
  }
  function renderContactCms() {
    document.querySelector(".cms-overlay")?.remove();
    state.contactFields ||= contactWorkingCopy();
    const f = state.contactFields;
    const hasDraft = !!readStore(STORAGE.contactDraft, null);
    const field = (id, key, label, type = "text") => `<div class="field"><label for="${id}">${esc(label)}</label><input id="${id}" type="${type}" data-contact-field="${key}" value="${esc(f[key] || "")}"></div>`;
    const hourRows = DAY_KEYS.map((key, day) => {
      const slot = f.hours[key];
      return `<div class="cms-hours-row"><strong>${DAY_NAMES.en[day]}</strong><label class="checkbox-line"><input type="checkbox" data-hours-closed="${key}" ${slot ? "" : "checked"}><span>Closed</span></label><input type="time" aria-label="${DAY_NAMES.en[day]} opens" data-hours-open="${key}" value="${slot ? slot[0] : "09:00"}" ${slot ? "" : "disabled"}><input type="time" aria-label="${DAY_NAMES.en[day]} closes" data-hours-close="${key}" value="${slot ? slot[1] : "18:30"}" ${slot ? "" : "disabled"}></div>`;
    }).join("");
    const overlay = document.createElement("div");
    overlay.className = "cms-overlay";
    overlay.innerHTML = `<section class="cms-panel" role="dialog" aria-modal="true" aria-labelledby="cms-title"><div class="cms-top"><div><span class="eyebrow">LS / LOCAL PROTOTYPE</span><h2 id="cms-title">${esc(t("cmsTitle"))}</h2></div><button class="cms-close" aria-label="${esc(t("close"))}">×</button></div><div class="cms-demo-warning">${esc(t("cmsWarning"))}<br><strong>${esc(t("cmsLocal"))}</strong></div><div class="cms-toolbar"><label class="field"><span>${esc(t("pageToEdit"))}</span><select id="cms-page"><option value="home">Homepage</option><option value="machine">Machine details</option><option value="solutions">Solutions</option><option value="stories">Clients & experiences</option><option value="careers">Careers</option><option value="contact">Contact details</option></select></label>${cmsLanguagePicker()}<label class="field"><span>Preview role</span><select id="cms-role"><option value="editor">${esc(t("editor"))}</option><option value="publisher">${esc(t("publisher"))}</option></select></label></div><div class="cms-main"><div class="cms-form"><span class="eyebrow">CONTACT DETAILS · ALL LANGUAGES</span>${field("cms-c-email", "inquiryEmail", "Inquiry email (Email LS buttons)", "email")}${field("cms-c-wa", "inquiryWhatsApp", "Inquiry WhatsApp number (digits, country code)", "tel")}${field("cms-c-hr-email", "careersEmail", "Careers email (Email HR buttons)", "email")}${field("cms-c-hr-wa", "careersWhatsApp", "Careers WhatsApp number", "tel")}${field("cms-c-phone", "phone", "Phone shown on the website")}${field("cms-c-address", "address", "Address")}<fieldset class="cms-hours"><legend>Opening hours</legend>${hourRows}</fieldset>${["en", "zh", "ms"].map((language) => `<div class="field"><label for="cms-c-note-${language}">Hours note (${language.toUpperCase()}), e.g. public-holiday closures</label><input id="cms-c-note-${language}" data-contact-note="${language}" value="${esc(f.hoursNote[language] || "")}"></div>`).join("")}<div class="cms-actions"><button class="cms-button" data-contact-save>${esc(t("saveDraft"))}</button><button class="cms-button publish" data-contact-publish ${state.cmsRole !== "publisher" ? "disabled" : ""}>${esc(t("publish"))}</button><button class="cms-button light" data-contact-discard ${hasDraft ? "" : "disabled"}>Discard draft</button><button class="cms-button light" data-contact-reset>Reset to defaults</button></div><div class="cms-status" role="status">${hasDraft ? "A saved draft is loaded." : ""}</div></div><aside class="cms-preview"><span class="eyebrow">${esc(t("preview"))}</span><div class="cms-preview-card" id="cms-preview-card">${contactPreview(f)}</div></aside></div></section>`;
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    const status = overlay.querySelector(".cms-status");
    const refresh = () => { overlay.querySelector("#cms-preview-card").innerHTML = contactPreview(f); };
    overlay.querySelector("#cms-page").value = "contact";
    overlay.querySelector("#cms-role").value = state.cmsRole;
    overlay.querySelector(".cms-close").addEventListener("click", cmsClose);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cmsClose(); });
    overlay.querySelector("#cms-page").addEventListener("change", (event) => { state.cmsPage = event.target.value; state.contactFields = null; state.cmsFields = cmsFields(); state.cmsTechnicalReview = state.cmsPage === "machine" ? Boolean(readStore(STORAGE.drafts, {})[state.language]?.[cmsPageStorageKey()]?.technicalReview) : false; renderCms(); });
    overlay.querySelector("#cms-language").addEventListener("change", (event) => switchCmsLanguage(event.target.value, renderContactCms));
    overlay.querySelector("#cms-role").addEventListener("change", (event) => { state.cmsRole = event.target.value; renderContactCms(); });
    overlay.querySelectorAll("[data-contact-field]").forEach((input) => input.addEventListener("input", () => { f[input.dataset.contactField] = input.value; refresh(); }));
    overlay.querySelectorAll("[data-contact-note]").forEach((input) => input.addEventListener("input", () => { f.hoursNote[input.dataset.contactNote] = input.value; refresh(); }));
    const slotFrom = (key) => {
      const closed = overlay.querySelector(`[data-hours-closed="${key}"]`).checked;
      const open = overlay.querySelector(`[data-hours-open="${key}"]`);
      const close = overlay.querySelector(`[data-hours-close="${key}"]`);
      open.disabled = close.disabled = closed;
      f.hours[key] = closed ? null : [open.value, close.value];
      refresh();
    };
    DAY_KEYS.forEach((key) => overlay.querySelectorAll(`[data-hours-closed="${key}"],[data-hours-open="${key}"],[data-hours-close="${key}"]`).forEach((input) => input.addEventListener("input", () => slotFrom(key))));
    const clean = () => ({ ...f, inquiryWhatsApp: normalizeWhatsApp(f.inquiryWhatsApp), careersWhatsApp: normalizeWhatsApp(f.careersWhatsApp), inquiryEmail: String(f.inquiryEmail).trim(), careersEmail: String(f.careersEmail).trim() });
    overlay.querySelector("[data-contact-save]").addEventListener("click", () => {
      const problem = validateContactFields(f);
      if (problem) { status.textContent = problem; return; }
      if (!writeStore(STORAGE.contactDraft, clean())) return;
      recordActivity("Contact details draft saved", "contact");
      status.textContent = t("draftSaved");
    });
    overlay.querySelector("[data-contact-publish]").addEventListener("click", () => {
      if (state.cmsRole !== "publisher") { status.textContent = t("publisherOnly"); return; }
      const problem = validateContactFields(f);
      if (problem) { status.textContent = problem; return; }
      if (!window.confirm(t("publishConfirm"))) return;
      if (!writeStore(STORAGE.contact, clean())) return;
      try { localStorage.removeItem(STORAGE.contactDraft); } catch { /* storage unavailable */ }
      recordActivity("Contact details published", "contact");
      state.contactFields = null;
      render();
      renderContactCms();
      document.querySelector(".cms-status").textContent = t("published");
    });
    overlay.querySelector("[data-contact-discard]").addEventListener("click", () => {
      if (!window.confirm("Discard this contact draft and restore the published details in the editor?")) return;
      try { localStorage.removeItem(STORAGE.contactDraft); } catch { /* storage unavailable */ }
      state.contactFields = getContact();
      recordActivity("Contact details draft discarded", "contact");
      renderContactCms();
    });
    overlay.querySelector("[data-contact-reset]").addEventListener("click", () => {
      state.contactFields = { ...SITE_CONTACT_DEFAULTS, hours: { ...SITE_CONTACT_DEFAULTS.hours }, hoursNote: { ...SITE_CONTACT_DEFAULTS.hoursNote } };
      const resetDraft = { ...state.contactFields };
      if (!writeStore(STORAGE.contactDraft, resetDraft)) return;
      recordActivity("Built-in contact defaults prepared as a draft", "contact");
      renderContactCms();
      document.querySelector(".cms-status").textContent = "Defaults are now a private draft. A Publisher must confirm before the website preview changes.";
    });
  }

  function renderCms() {
    if (state.cmsPage === "contact") { renderContactCms(); return; }
    if (state.cmsPage === "stories") { renderStoriesCms(); return; }
    document.querySelector(".cms-overlay")?.remove();
    const fields = state.cmsFields;
    const draftMap = readStore(STORAGE.drafts, {});
    const hasDraft = !!draftMap[state.language]?.[cmsPageStorageKey()];
    const overlay = document.createElement("div");
    overlay.className = "cms-overlay";
    overlay.innerHTML = `<section class="cms-panel" role="dialog" aria-modal="true" aria-labelledby="cms-title"><div class="cms-top"><div><span class="eyebrow">LS / LOCAL PROTOTYPE</span><h2 id="cms-title">${esc(t("cmsTitle"))}</h2></div><button class="cms-close" aria-label="${esc(t("close"))}">×</button></div><div class="cms-demo-warning">${esc(t("cmsWarning"))}<br><strong>${esc(t("cmsLocal"))}</strong></div><div class="cms-toolbar"><label class="field"><span>${esc(t("pageToEdit"))}</span><select id="cms-page"><option value="home">Homepage</option><option value="machine">Machine details</option><option value="solutions">Solutions</option><option value="stories">Clients &amp; experiences</option><option value="careers">Careers</option><option value="contact">Contact details</option></select></label>${cmsLanguagePicker()}<label class="field"><span>Preview role</span><select id="cms-role"><option value="editor">${esc(t("editor"))}</option><option value="publisher">${esc(t("publisher"))}</option></select></label></div><div class="cms-main"><div class="cms-form"><span class="eyebrow">${esc(t("copyToEdit"))} · ${esc(state.language.toUpperCase())}</span>${state.cmsPage === "home" ? `<div class="field"><label for="cms-title-a">Homepage title</label><input id="cms-title-a" data-cms-field="heroTitleA" value="${esc(fields.heroTitleA)}"></div><div class="field"><label for="cms-title-b">Homepage title emphasis</label><input id="cms-title-b" data-cms-field="heroTitleB" value="${esc(fields.heroTitleB)}"></div><div class="field"><label for="cms-lead">Introduction</label><textarea id="cms-lead" data-cms-field="heroLead">${esc(fields.heroLead)}</textarea></div><div class="field"><label for="cms-intro">About LS</label><textarea id="cms-intro" data-cms-field="homeIntro">${esc(fields.homeIntro)}</textarea></div><div class="field"><label for="cms-current-title">Current at LS · title</label><input id="cms-current-title" data-cms-field="currentTitle" value="${esc(fields.currentTitle)}"></div><div class="field"><label for="cms-current">Current at LS · description</label><textarea id="cms-current" data-cms-field="currentText">${esc(fields.currentText)}</textarea></div><div class="field"><label for="cms-home-hero-machine">Homepage hero machine</label><select id="cms-home-hero-machine" data-cms-field="homeHeroModel">${HOME_HERO_MACHINES.map((machine) => `<option value="${esc(machine.model)}" ${fields.homeHeroModel === machine.model ? "selected" : ""}>${esc(machine.model)}</option>`).join("")}</select><span class="small-note">Choose among the three verified hero machine photographs.</span></div>` : state.cmsPage === "machine" ? `<div class="field"><label for="cms-machine-model">Machine page</label><select id="cms-machine-model" aria-label="Choose a machine page">${machineOptions().map((machine) => { const key = slug(machine.name); return `<option value="${esc(key)}" ${state.cmsMachineSlug === key ? "selected" : ""}>${esc(machine.name)}</option>`; }).join("")}</select></div><div class="field"><label for="cms-machine-title">Machine title</label><input id="cms-machine-title" data-cms-field="machineTitle" maxlength="100" value="${esc(fields.machineTitle || "LSF 502 MCD")}"></div><div class="field"><label for="cms-machine-intro">Machine introduction</label><textarea id="cms-machine-intro" data-cms-field="machineIntro" maxlength="1600">${esc(fields.machineIntro)}</textarea></div><label class="checkbox-line cms-check"><input type="checkbox" id="cms-technical-review" ${state.cmsTechnicalReview ? "checked" : ""}><span>${esc(t("machineReview"))} — confirm with the actual LS technical reviewer before launch.</span></label>` : state.cmsPage === "careers" ? careersCmsMarkup(fields) : `<div class="field"><label for="cms-solution-intro">Solutions introduction</label><textarea id="cms-solution-intro" data-cms-field="solutionIntro">${esc(fields.solutionIntro)}</textarea></div><p class="small-note">Edit existing approved copy within the fixed page layout. The live website remains unchanged until a publisher confirms.</p>`}<div class="cms-actions"><button class="cms-button" data-save-draft>${esc(t("saveDraft"))}</button><button class="cms-button publish" data-publish ${state.cmsRole !== "publisher" ? "disabled" : ""}>${esc(t("publish"))}</button><button class="cms-button light" data-discard ${!hasDraft ? "disabled" : ""}>${esc(t("discard"))}</button><button class="cms-button light" data-restore ${!(readStore(STORAGE.versions, {})[state.language] || []).length ? "disabled" : ""}>Restore previous version</button></div><div class="cms-status" role="status"></div></div><aside class="cms-preview"><span class="eyebrow">${esc(t("preview"))}</span><div class="cms-preview-card" id="cms-preview-card">${cmsPreview()}</div><div class="cms-history"><span class="eyebrow">${esc(t("history"))}</span><div id="cms-history-list">${cmsHistory()}</div></div></aside></div></section>`;
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    overlay.querySelector("#cms-page").value = state.cmsPage;
    overlay.querySelector("#cms-role").value = state.cmsRole;
    overlay.querySelector(".cms-close").addEventListener("click", cmsClose);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cmsClose(); });
    overlay.querySelector("#cms-page").addEventListener("change", (event) => { state.cmsPage = event.target.value; state.contactFields = null; state.cmsFields = cmsFields(); state.cmsTechnicalReview = state.cmsPage === "machine" ? Boolean(readStore(STORAGE.drafts, {})[state.language]?.[cmsPageStorageKey()]?.technicalReview) : false; renderCms(); });
    overlay.querySelector("#cms-language").addEventListener("change", (event) => switchCmsLanguage(event.target.value, renderCms));
    overlay.querySelector("#cms-machine-model")?.addEventListener("change", (event) => {
      state.cmsMachineSlug = event.target.value;
      state.cmsFields = cmsFields();
      state.cmsTechnicalReview = Boolean(readStore(STORAGE.drafts, {})[state.language]?.[cmsPageStorageKey()]?.technicalReview);
      renderCms();
    });
    overlay.querySelector("#cms-role").addEventListener("change", (event) => { state.cmsRole = event.target.value; renderCms(); });
    overlay.querySelectorAll("[data-cms-field]").forEach((field) => field.addEventListener(field.tagName === "SELECT" ? "change" : "input", () => {
      state.cmsFields[field.dataset.cmsField] = field.value;
      if (state.cmsPage === "machine") {
        state.cmsTechnicalReview = false;
        const review = overlay.querySelector("#cms-technical-review");
        if (review) review.checked = false;
      }
      overlay.querySelector("#cms-preview-card").innerHTML = cmsPreview(state.cmsFields);
    }));
    overlay.querySelector("#cms-technical-review")?.addEventListener("change", (event) => {
      state.cmsTechnicalReview = event.target.checked;
      overlay.querySelector("#cms-preview-card").innerHTML = cmsPreview(state.cmsFields);
    });
    overlay.querySelectorAll("[data-career-role-name],[data-career-role-url]").forEach((field) => field.addEventListener("input", () => {
      const index = Number(field.dataset.careerRoleName ?? field.dataset.careerRoleUrl);
      state.cmsFields.careerRoles ||= CAREER_ROLE_DEFAULTS.map((role) => ({ ...role }));
      state.cmsFields.careerRoles[index] ||= { name: "", url: "" };
      state.cmsFields.careerRoles[index][field.hasAttribute("data-career-role-name") ? "name" : "url"] = field.value;
      overlay.querySelector("#cms-preview-card").innerHTML = cmsPreview(state.cmsFields);
    }));
    overlay.querySelector("[data-save-draft]").addEventListener("click", () => saveCmsDraft());
    overlay.querySelector("[data-discard]").addEventListener("click", () => discardCmsDraft());
    overlay.querySelector("[data-restore]").addEventListener("click", () => restoreCmsVersion());
    overlay.querySelector("[data-publish]").addEventListener("click", () => publishCmsDraft());
    overlay.querySelector("#cms-history-list").innerHTML = cmsHistory();
  }
  function cmsHistory() {
    const entries = readStore(STORAGE.activity, []);
    if (!entries.length) return `<p class="small-note">${esc(t("noActivity"))}</p>`;
    return entries.slice(0, 8).map((entry) => `<p class="cms-history-entry"><strong>${esc(entry.action)}</strong><br><span>${esc(entry.page)} · ${esc(entry.language.toUpperCase())} · ${new Date(entry.time).toLocaleString()}</span></p>`).join("");
  }
  function saveCmsDraft() {
    const drafts = readStore(STORAGE.drafts, {});
    drafts[state.language] ||= {};
    const draftFields = state.cmsPage === "machine"
      ? { machineSlug: state.cmsMachineSlug, machineTitle: state.cmsFields.machineTitle, machineIntro: state.cmsFields.machineIntro }
      : state.cmsFields;
    drafts[state.language][cmsPageStorageKey()] = { ...draftFields, savedAt: new Date().toISOString(), technicalReview: state.cmsTechnicalReview };
    if (!writeStore(STORAGE.drafts, drafts)) return;
    recordActivity("Draft saved");
    renderCms();
    document.querySelector(".cms-status").textContent = t("draftSaved");
  }
  function discardCmsDraft() {
    const drafts = readStore(STORAGE.drafts, {});
    const pageKey = cmsPageStorageKey();
    if (!drafts[state.language]?.[pageKey]) return;
    delete drafts[state.language][pageKey];
    writeStore(STORAGE.drafts, drafts);
    state.cmsFields = cmsFields(state.language);
    state.cmsTechnicalReview = false;
    recordActivity("Draft discarded and reset to published version");
    renderCms();
    document.querySelector(".cms-status").textContent = t("discarded");
  }
  function restoreCmsVersion() {
    const snapshot = (readStore(STORAGE.versions, {})[state.language] || [])[0];
    if (!snapshot) return;
    let restored;
    if (state.cmsPage === "stories") {
      const seed = storySeed(state.language);
      restored = {
        clients: Array.isArray(snapshot.clients) ? snapshot.clients.slice(0, 100) : seed.clients,
        experiences: Array.isArray(snapshot.experiences) ? snapshot.experiences.slice(0, 10) : seed.experiences
      };
    } else if (state.cmsPage === "machine") {
      const machineKey = state.cmsMachineSlug;
      const legacy = machineKey === "mini-cookie-depositor-mcd" ? { machineTitle: snapshot.machineTitle, machineIntro: snapshot.machineIntro } : {};
      restored = { ...cmsSeed(), ...(snapshot.machinePages?.[machineKey] || legacy) };
    } else {
      restored = { ...cmsSeed(), ...snapshot };
      delete restored.publishedAt;
    }
    const drafts = readStore(STORAGE.drafts, {});
    drafts[state.language] ||= {};
    drafts[state.language][cmsPageStorageKey()] = { ...restored, machineSlug: state.cmsPage === "machine" ? state.cmsMachineSlug : undefined, savedAt: new Date().toISOString(), technicalReview: false };
    if (!writeStore(STORAGE.drafts, drafts)) return;
    state.cmsFields = restored;
    state.cmsTechnicalReview = false;
    recordActivity("Previous published version restored as a draft");
    renderCms();
    document.querySelector(".cms-status").textContent = "Previous content restored as a draft for review.";
  }
  function publishCmsDraft() {
    if (state.cmsRole !== "publisher") { document.querySelector(".cms-status").textContent = t("publisherOnly"); return; }
    const drafts = readStore(STORAGE.drafts, {});
    const pageKey = cmsPageStorageKey();
    const draft = drafts[state.language]?.[pageKey];
    if (!draft) { document.querySelector(".cms-status").textContent = t("noDraft"); return; }
    if (state.cmsPage === "machine" && !draft.technicalReview) { document.querySelector(".cms-status").textContent = t("reviewRequired"); return; }
    if (state.cmsPage === "machine" && !String(draft.machineTitle || "").trim()) { document.querySelector(".cms-status").textContent = "Add a machine title before publishing."; return; }
    if (state.cmsPage === "machine" && (String(draft.machineTitle).length > 100 || String(draft.machineIntro || "").length > 1600)) { document.querySelector(".cms-status").textContent = "Keep the machine title under 100 characters and introduction under 1,600 characters."; return; }
    if (state.cmsPage === "stories") {
      const clients = Array.isArray(draft.clients) ? draft.clients : [];
      const experiences = Array.isArray(draft.experiences) ? draft.experiences : [];
      if (clients.length > 100 || experiences.length > 10) { document.querySelector(".cms-status").textContent = "Keep within the supported client library and ten gallery items."; return; }
      for (const item of clients) {
        const populated = Boolean(item?.name || item?.image || item?.customImage);
        if (!populated) continue;
        if (!String(item.name || "").trim() || !String(item.source || "").trim()) { document.querySelector(".cms-status").textContent = "Add a client name and source reference before publishing."; return; }
        if (item.image && !["gardenia", "tk-bakery"].includes(item.image)) { document.querySelector(".cms-status").textContent = "Select a verified client image or use a reviewed image upload."; return; }
        if (item.customImage && !isLocalStoryImage(item.customImage)) { document.querySelector(".cms-status").textContent = "Choose a supported reviewed client image before publishing."; return; }
      }
      for (const item of experiences) {
        const hasImage = Boolean((item?.image && sectionAsset("customerExperiences", item.image)) || isLocalStoryImage(item?.customImage));
        const hasCopy = Boolean(String(item?.title || "").trim() || String(item?.body || "").trim());
        if (hasCopy && !hasImage) { document.querySelector(".cms-status").textContent = "Select an LS gallery image before publishing its caption."; return; }
        if ((hasImage || hasCopy) && !String(item?.source || "").trim()) { document.querySelector(".cms-status").textContent = "Add a source reference before publishing a gallery item."; return; }
        if (item?.customImage && !isLocalStoryImage(item.customImage)) { document.querySelector(".cms-status").textContent = "Choose a supported reviewed gallery image before publishing."; return; }
      }
    }
    if (state.cmsPage === "careers") {
      const roles = Array.isArray(draft.careerRoles) ? draft.careerRoles : [];
      if (roles.length > CAREER_ROLE_LIMIT) { document.querySelector(".cms-status").textContent = "Keep up to " + CAREER_ROLE_LIMIT + " sourced roles."; return; }
      if (!["recruitment", "team"].includes(draft.careerImage)) { document.querySelector(".cms-status").textContent = "Choose an image from the approved LS careers media."; return; }
      for (const role of roles) {
        const populated = Boolean(String(role?.name || "").trim() || String(role?.url || "").trim());
        if (!populated) continue;
        if (!String(role?.name || "").trim() || !officialCareerUrl(role?.url)) { document.querySelector(".cms-status").textContent = "Each listed role needs a title and a verified LS social or recruitment link."; return; }
      }
    }
    if (!window.confirm(t("publishConfirm"))) return;
    const published = readStore(STORAGE.published, {});
    const versions = readStore(STORAGE.versions, {});
    published[state.language] ||= {};
    versions[state.language] ||= [];
    versions[state.language].unshift({ ...published[state.language], publishedAt: new Date().toISOString() });
    const { savedAt, technicalReview, publishedAt, machineSlug, ...publishable } = draft;
    if (state.cmsPage === "machine") {
      const machineKey = state.cmsMachineSlug;
      published[state.language].machinePages ||= {};
      published[state.language].machinePages[machineKey] = { machineTitle: publishable.machineTitle, machineIntro: publishable.machineIntro };
      if (machineKey === "mini-cookie-depositor-mcd") {
        published[state.language].machineTitle = publishable.machineTitle;
        published[state.language].machineIntro = publishable.machineIntro;
      }
    } else {
      published[state.language] = { ...published[state.language], ...publishable };
    }
    if (!writeStore(STORAGE.published, published) || !writeStore(STORAGE.versions, versions)) return;
    delete drafts[state.language][pageKey];
    writeStore(STORAGE.drafts, drafts);
    recordActivity("Publisher confirmed public content");
    render();
    state.cmsFields = cmsFields(state.language);
    renderCms();
    document.querySelector(".cms-status").textContent = t("published");
  }


  window.LSNavigation.init({t,localName,urlFor,productUrl,assetImage,sectionAsset,findProduct,
    getCategories:()=>DATA.categories,getFoods:()=>FOOD_GROUPS,getSegments:()=>SEGMENTS,
    getSolutions:()=>SOLUTIONS,getServices:()=>SERVICES,getCompany:()=>COMPANY,
    isExactImage,inquiryActions});
  document.querySelector('.ls-header-utility')?.insertAdjacentHTML('afterbegin',`<a class="header-search-link" href="${urlFor('search')}" aria-label="Search machinery">${tr('Search','查找','Cari')} <span aria-hidden="true">⌕</span></a>`);
  const headerWhatsApp=document.createElement('a');headerWhatsApp.className='header-whatsapp';headerWhatsApp.target='_blank';headerWhatsApp.rel='noopener noreferrer';headerWhatsApp.setAttribute('aria-label','Contact LS on WhatsApp');headerWhatsApp.href='https://wa.me/'+String(getContact().inquiryWhatsApp).replace(/\D/g,'');headerWhatsApp.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-4.8a8.5 8.5 0 1 1 16.4-3.7Z"/><path d="M8 7.2c.4 4.4 2.4 6.4 6.8 6.8l1.3-1.8-2.6-1.1-1.1 1.1-2.7-2.7 1.1-1.1L9.7 6Z"/></svg>';
  document.querySelector('.portal-button')?.after(headerWhatsApp);
  languagePicker.addEventListener("change", () => {
    state.language = languagePicker.value;
    writeStore(STORAGE.language, state.language);
    render();
  });
  window.LSRouter.start(render);
  document.addEventListener('keydown',event=>{if(event.key==='Escape')cmsClose();});
  document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();main.focus();main.scrollIntoView();});
  document.addEventListener("click", (event) => {
    const motionToggle = event.target.closest("[data-motion-toggle]");
    if (motionToggle) {
      state.motionPaused = !state.motionPaused;
      state.motionOptIn = matchMedia("(prefers-reduced-motion: reduce)").matches && !state.motionPaused;
      writeStore(STORAGE.motion, state.motionPaused);
      syncMotionControls();
    }
    const imageControl = event.target.closest('[data-fullscreen],[data-zoom]');
    if (imageControl) window.LSIndustrial.openViewer(designConfig(), imageControl.closest('.machine-stage'), imageControl, imageControl.dataset.zoom === 'in' ? 1.7 : 1);
  });
  document.querySelector(".viewer-close").addEventListener("click", () => document.querySelector(".viewer-dialog").close());
  document.querySelector(".viewer-dialog").addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
  document.querySelector(".viewer-dialog").addEventListener("close", () => { if (fullscreenReturnFocus?.isConnected) fullscreenReturnFocus.focus(); });

  const cmsLauncher = document.createElement("button");
  cmsLauncher.type = "button";
  cmsLauncher.className = "cms-trigger";
  cmsLauncher.innerHTML = `<span></span> PREVIEW CMS`;
  cmsLauncher.setAttribute("aria-label", "Open local CMS preview");
  cmsLauncher.addEventListener("click", cmsOpen);
  if (new URLSearchParams(location.search).get("studio")==="1") document.body.appendChild(cmsLauncher);

  if (window.LSRouter.legacy && !location.hash) history.replaceState(null, "", location.pathname+location.search+"#home");
  render();
})();
