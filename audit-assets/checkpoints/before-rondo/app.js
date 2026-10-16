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

  // Set these from verified LS contact details before publishing a live site.
  const CONTACT_SETTINGS = { email: "", walink: "" };
  const LOCAL_NAMES = {
    zh: {
      "Bakery": "烘焙设备", "Kitchen": "厨房设备", "Package": "包装设备", "Refrigeration Series": "制冷系列", "Production Line": "生产线",
      "Mixer": "搅拌机", "Depositor Series": "注料机系列", "Dough Forming": "面团成型", "Encrusting Series": "包馅系列", "Fermentation": "发酵设备", "Oven": "烤炉", "Cutting": "切割设备", "Cakes Finishing": "蛋糕装饰",
      "Cookies & Biscuits": "饼干", "Cakes": "蛋糕", "Bread & Buns": "面包与餐包", "Pastries & Crusted Foods": "酥点与酥皮食品", "Kueh & Asian Foods": "糕点与亚洲食品", "Dim Sum": "点心",
      "Micro & Startup Businesses": "微型与初创企业", "SMEs & Expanding Manufacturers": "中小型与发展中的制造商", "Large & Mega Enterprises": "大型与超大型企业",
      "Factory & Line Planning": "工厂与生产线规划", "Machinery & Automation": "机械与自动化", "Facility Fit-Out": "厂房配套工程", "Financing Support": "财务协助",
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
      "About LS": "Tentang LS", "Locations": "Lokasi", "Careers": "Kerjaya", "Food production": "Pengeluaran makanan", "Machines": "Mesin", "Solutions": "Penyelesaian", "Services & company": "Perkhidmatan & syarikat"
    }
  };
  const STORAGE = {
    language: "ls-site-language",
    motion: "ls-site-motion-paused",
    published: "ls-site-cms-published-v1",
    drafts: "ls-site-cms-drafts-v1",
    versions: "ls-site-cms-versions-v1",
    activity: "ls-site-cms-activity-v1"
  };
  const storedMotionPreference = readStore(STORAGE.motion, null);
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const WORDS = {
    en: {
      topline: "ENGINEERING THE NEXT GENERATION OF FOOD PRODUCTION", toplink: "Discover what’s possible", navFood: "Food production", navMachines: "Machines", navSolutions: "Solutions", navServices: "Services", navCompany: "Company", navInsights: "Insights", portal: "Portal", motionPause: "Pause motion", motionPlay: "Play motion", heroEyebrow: "LS Smart Machinery · Malaysia", heroTitleA: "Make room for", heroTitleB: "what’s next.", heroLead: "Thoughtful machinery and production solutions for food makers at every stage of their journey.", exploreMachines: "Explore our machines", requestConversation: "Start a conversation", currentLabel: "01 / CURRENT AT LS", whyLabel: "02 / WHY LS", foodLabel: "03 / FOOD PRODUCTION", segmentsLabel: "04 / WHO WE WORK WITH", newsLabel: "05 / INSIGHTS", storiesLabel: "06 / CUSTOMER EXPERIENCES", contactLabel: "LET’S MAKE THE NEXT STEP CLEAR", allMachines: "Explore the catalogue", allFood: "Explore food production", allSolutions: "See how we can help", allServices: "Explore our services", askForInfo: "Ask LS about this machine", contactUs: "Tell us what you’re planning", overview: "Overview", capabilities: "What LS can help with", segmentCta: "Explore this segment", viewCategory: "View category", homeLink: "Home", askForQuote: "Request a quote", consult: "Book a consultation", visit: "Arrange a visit", copyRequest: "Copy inquiry", openEmail: "Open email draft", emailReady: "Your email app should open with the draft. Review it and send it; the website has not sent it.", openWhatsApp: "Open WhatsApp", copied: "Inquiry copied. Paste it into the WhatsApp chat and send when ready.", copiedFallback: "Select and copy the inquiry summary below.", contactPending: "LS contact destinations still need to be configured. Your inquiry summary is ready to copy.", intro: "About LS", latest: "Current at LS", findMachine: "Find a machine", filter: "Filter by name or subcategory", allItems: "All equipment", suitability: "Is this machine right for you?", features: "Key features", benefits: "Designed around your process", application: "Food applications", technical: "Technical data", related: "Explore more", accessories: "Accessories", complementary: "Complementary machines", similar: "Similar machines", itemAwaiting: "Product information is being confirmed with LS. Ask our team about your process and requirements.", graphicNote: "ILLUSTRATIVE PLACEHOLDER · LS PHOTOGRAPHY TO BE ADDED", unverified: "Catalog information awaiting LS confirmation", notAvailable: "Details will be added after LS review.", country: "Country", firstName: "First name", lastName: "Last name", company: "Company", email: "Email", phone: "Telephone", message: "Message", inquiryType: "How can we help?", selectOne: "Choose an option", optional: "Optional", inquiryMachine: "Machine or page", insightsSubscribe: "I’d like LS Insights by email. Please contact me about subscribing.", spareParts: "Spare parts request", machineNumber: "Machine number", model: "Model", partNumber: "Article / part number, if known", description: "Part description", quantity: "Quantity", deliveryAddress: "Delivery address", remarks: "Remarks", spareIntro: "Share as much detail as you can so LS can identify the part and follow up efficiently.", unknownPart: "Not sure which part you need? Carry your details into a general inquiry and the LS team can follow up.", demoOnly: "Website preview · contact destinations not connected", cmsTitle: "Content studio", cmsLocal: "Private local preview · saved in this browser only", editor: "Editor", publisher: "Publisher", pageToEdit: "Page to edit", copyToEdit: "Content and translations", saveDraft: "Save draft", publish: "Publisher confirms", discard: "Discard draft", technicalReview: "Technical review", machineReview: "Technical reviewer confirms machine copy", preview: "Live private preview", history: "Activity history", mediaLibrary: "Media library", uploadMedia: "Choose an image", draftSaved: "Draft saved in this browser.", published: "Published in this browser preview.", discarded: "Draft discarded and restored to the current published version.", publisherOnly: "Switch to Publisher to release a draft.", reviewRequired: "Machine content needs technical review before publishing.", noDraft: "No saved draft for this language yet.", noActivity: "No studio activity yet.", cmsWarning: "Demonstration only: this local prototype has no login, shared storage, server-side preview or real publishing permissions.", publishConfirm: "Publish this reviewed draft to the website preview on this browser?", currentPublished: "Current published content", homeIntro: "LS Smart Machinery supports food producers with machinery, production line design, facility work and after-sales service.", historyTitle: "A history worth telling", historyText: "LS’s verified company history and milestones will be added after review.", locationTitle: "Visit LS", locationText: "Location and visit details will be added after LS confirms its address and appointment process.", careersTitle: "Build what comes next", careersText: "Recruitment links will be added after LS confirms current openings and official channels.", insightsText: "Company updates, upcoming events and relevant industry stories will appear here as LS confirms them.", experienceText: "Customer stories will be published after LS approves the experience and supporting details.", pending: "Details to be confirmed before publication", aiComing: "COMING SOON", noResults: "No matching catalogue items. Try another search.", viewAll: "View all", serviceProcess: "From the first conversation through ongoing support", finish: "Shared footer", sourceWarning: "Source names are retained as supplied; selected items need catalogue confirmation.", close: "Close"
    },
    zh: {
      topline: "为新一代食品生产提供工程方案", toplink: "探索更多可能", navFood: "食品生产", navMachines: "机器设备", navSolutions: "解决方案", navServices: "服务", navCompany: "关于 LS", navInsights: "资讯", portal: "咨询", motionPause: "暂停动画", motionPlay: "播放动画", heroEyebrow: "LS Smart Machinery · 马来西亚", heroTitleA: "为下一步", heroTitleB: "预留空间。", heroLead: "为不同发展阶段的食品生产企业提供周到的设备与生产解决方案。", exploreMachines: "探索机器设备", requestConversation: "开始交流", currentLabel: "01 / LS 动态", whyLabel: "02 / 选择 LS 的理由", foodLabel: "03 / 食品生产", segmentsLabel: "04 / 服务对象", newsLabel: "05 / 行业资讯", storiesLabel: "06 / 客户体验", contactLabel: "让下一步更清晰", allMachines: "浏览设备目录", allFood: "探索食品生产", allSolutions: "了解我们如何协助", allServices: "了解服务", viewCategory: "查看类别", askForQuote: "申请报价", consult: "预约咨询", visit: "预约到访", copyRequest: "复制咨询", openEmail: "打开邮件草稿", emailReady: "邮件应用会打开预填内容。请检查并发送；网站不会替您发送。", openWhatsApp: "打开 WhatsApp", homeLink: "首页", askForInfo: "向 LS 咨询此设备", contactUs: "告诉我们您的计划", overview: "概览", capabilities: "LS 可提供的协助", findMachine: "查找设备", filter: "按名称或子类别筛选", allItems: "所有设备", suitability: "这台设备适合您吗？", features: "主要特点", benefits: "围绕您的生产流程设计", application: "食品应用", technical: "技术资料", related: "探索更多", accessories: "配件", complementary: "可配合使用的设备", similar: "类似设备", itemAwaiting: "产品资料正在由 LS 确认。欢迎向团队咨询您的生产流程与需求。", graphicNote: "示意占位图 · 待添加经 LS 批准的图片", unverified: "目录资料待 LS 确认", notAvailable: "资料经 LS 审核后补充。", country: "国家", firstName: "名字", lastName: "姓氏", company: "公司", email: "电子邮箱", phone: "电话", message: "留言", inquiryType: "我们能如何协助？", selectOne: "请选择", optional: "选填", inquiryMachine: "设备或页面", insightsSubscribe: "我希望收到 LS 洞察资讯。请联系我以便订阅。", spareParts: "备件申请", machineNumber: "机器编号", model: "型号", partNumber: "产品 / 零件编号（如已知）", description: "零件描述", quantity: "数量", deliveryAddress: "送货地址", remarks: "备注", spareIntro: "请尽可能填写详细资料，以便 LS 确认零件并跟进。", unknownPart: "不确定所需零件？请将资料转入一般咨询，LS 团队会跟进。", demoOnly: "网站预览 · 联系方式尚未连接", cmsTitle: "内容工作室", cmsLocal: "仅限本地私密预览 · 保存在此浏览器", editor: "编辑者", publisher: "发布者", pageToEdit: "选择编辑页面", copyToEdit: "内容与翻译", saveDraft: "保存草稿", publish: "发布者确认", discard: "放弃草稿", technicalReview: "技术审核", machineReview: "技术审核人员确认机器内容", preview: "即时私密预览", history: "活动记录", mediaLibrary: "媒体库", uploadMedia: "选择图片", draftSaved: "草稿已保存在此浏览器。", published: "已发布至此浏览器预览。", discarded: "草稿已放弃并恢复至当前已发布版本。", publisherOnly: "请切换至发布者角色后发布草稿。", reviewRequired: "机器内容发布前须经过技术审核。", noDraft: "此语言尚无已保存的草稿。", noActivity: "目前没有工作室活动记录。", cmsWarning: "仅供演示：此本地原型没有登录、共享存储、服务器预览或实际发布权限。", publishConfirm: "将此审核后的草稿发布至本浏览器的网站预览？", currentPublished: "当前已发布内容", homeIntro: "LS Smart Machinery 为食品生产商提供设备、生产线设计、厂房工程及售后服务。", historyTitle: "值得讲述的发展历程", historyText: "经核实的公司历史与里程碑将在审核后补充。", locationTitle: "拜访 LS", locationText: "地址及拜访信息将在 LS 确认地址与预约流程后补充。", careersTitle: "共同创造未来", careersText: "LS 确认职位空缺及官方渠道后，将补充招聘链接。", insightsText: "LS 确认后，将在此发布公司动态、活动及相关行业资讯。", experienceText: "LS 批准相关经历和资料后，将发布客户故事。", pending: "发布前尚待确认", aiComing: "即将推出", noResults: "没有找到相符设备，请尝试其他关键词。", viewAll: "查看全部", serviceProcess: "从初次沟通到持续服务支持", close: "关闭"
    },
    ms: {
      topline: "KEJURUTERAAN UNTUK GENERASI BAHARU PENGELUARAN MAKANAN", toplink: "Terokai kemungkinan", navFood: "Pengeluaran makanan", navMachines: "Mesin", navSolutions: "Penyelesaian", navServices: "Perkhidmatan", navCompany: "Syarikat", navInsights: "Maklumat", portal: "Portal", motionPause: "Jeda gerakan", motionPlay: "Mainkan gerakan", heroEyebrow: "LS Smart Machinery · Malaysia", heroTitleA: "Sediakan ruang", heroTitleB: "untuk seterusnya.", heroLead: "Mesin dan penyelesaian pengeluaran untuk pengeluar makanan pada setiap peringkat.", exploreMachines: "Terokai mesin", requestConversation: "Mulakan perbualan", currentLabel: "01 / TERKINI DI LS", whyLabel: "02 / MENGAPA LS", foodLabel: "03 / PENGELUARAN MAKANAN", segmentsLabel: "04 / UNTUK SIAPA", newsLabel: "05 / WAWASAN", storiesLabel: "06 / PENGALAMAN PELANGGAN", contactLabel: "JELASKAN LANGKAH SETERUSNYA", allMachines: "Terokai katalog", allFood: "Terokai pengeluaran makanan", allSolutions: "Lihat cara kami membantu", allServices: "Terokai perkhidmatan", viewCategory: "Lihat kategori", askForQuote: "Minta sebut harga", consult: "Tempah konsultasi", visit: "Atur lawatan", copyRequest: "Salin pertanyaan", openEmail: "Buka draf e-mel", emailReady: "Aplikasi e-mel akan membuka draf. Semak dan hantar sendiri; laman web belum menghantarnya.", openWhatsApp: "Buka WhatsApp", homeLink: "Laman utama", askForInfo: "Tanya LS tentang mesin ini", contactUs: "Kongsikan perancangan anda", overview: "Gambaran keseluruhan", capabilities: "Cara LS boleh membantu", findMachine: "Cari mesin", filter: "Tapis mengikut nama atau subkategori", allItems: "Semua peralatan", suitability: "Adakah mesin ini sesuai untuk anda?", features: "Ciri utama", benefits: "Direka mengikut proses anda", application: "Aplikasi makanan", technical: "Data teknikal", related: "Terokai lagi", accessories: "Aksesori", complementary: "Mesin pelengkap", similar: "Mesin serupa", itemAwaiting: "Maklumat produk sedang disahkan oleh LS. Hubungi pasukan kami tentang proses dan keperluan anda.", graphicNote: "ILUSTRASI SEMENTARA · FOTO YANG DILULUSKAN LS AKAN DITAMBAH", unverified: "Maklumat katalog menunggu pengesahan LS", notAvailable: "Butiran akan ditambah selepas semakan LS.", country: "Negara", firstName: "Nama pertama", lastName: "Nama keluarga", company: "Syarikat", email: "E-mel", phone: "Telefon", message: "Mesej", inquiryType: "Bagaimanakah kami boleh membantu?", selectOne: "Pilih satu", optional: "Pilihan", inquiryMachine: "Mesin atau halaman", insightsSubscribe: "Saya berminat menerima LS Insights. Sila hubungi saya tentang langganan.", spareParts: "Permintaan alat ganti", machineNumber: "Nombor mesin", model: "Model", partNumber: "Nombor artikel / alat ganti jika diketahui", description: "Penerangan alat ganti", quantity: "Kuantiti", deliveryAddress: "Alamat penghantaran", remarks: "Catatan", spareIntro: "Berikan maklumat selengkap mungkin agar LS dapat mengenal pasti alat ganti dan membuat susulan dengan cekap.", unknownPart: "Tidak pasti alat ganti yang diperlukan? Sertakan butiran dalam pertanyaan umum dan pasukan LS akan membuat susulan.", demoOnly: "Pratonton laman · saluran hubungan belum disambungkan", cmsTitle: "Studio kandungan", cmsLocal: "Pratonton peribadi setempat · disimpan dalam pelayar ini sahaja", editor: "Penyunting", publisher: "Penerbit", pageToEdit: "Pilih halaman", copyToEdit: "Kandungan dan terjemahan", saveDraft: "Simpan draf", publish: "Penerbit mengesahkan", discard: "Buang draf", technicalReview: "Semakan teknikal", machineReview: "Penyemak teknikal mengesahkan kandungan mesin", preview: "Pratonton peribadi langsung", history: "Sejarah aktiviti", mediaLibrary: "Pustaka media", uploadMedia: "Pilih imej", draftSaved: "Draf disimpan dalam pelayar ini.", published: "Diterbitkan dalam pratonton pelayar ini.", discarded: "Draf dibuang dan versi terbitan semasa dipulihkan.", publisherOnly: "Tukar kepada Penerbit untuk menerbitkan draf.", reviewRequired: "Kandungan mesin memerlukan semakan teknikal sebelum diterbitkan.", noDraft: "Tiada draf tersimpan untuk bahasa ini.", noActivity: "Tiada aktiviti studio lagi.", cmsWarning: "Untuk demonstrasi sahaja: prototaip setempat ini tiada log masuk, storan bersama, pratonton pelayan atau kebenaran penerbitan sebenar.", publishConfirm: "Terbitkan draf yang telah disemak ini ke pratonton laman dalam pelayar ini?", currentPublished: "Kandungan terbitan semasa", homeIntro: "LS Smart Machinery menyokong pengeluar makanan dengan mesin, reka bentuk barisan pengeluaran, kerja kemudahan dan perkhidmatan selepas jualan.", historyTitle: "Sejarah untuk diceritakan", historyText: "Sejarah dan pencapaian syarikat yang disahkan akan ditambah selepas semakan.", locationTitle: "Lawati LS", locationText: "Lokasi dan maklumat lawatan akan ditambah selepas LS mengesahkan alamat dan proses janji temu.", careersTitle: "Bina masa depan bersama", careersText: "Pautan kerjaya akan ditambah selepas LS mengesahkan kekosongan dan saluran rasmi.", insightsText: "Kemas kini syarikat, acara dan cerita industri yang berkaitan akan dipaparkan selepas disahkan LS.", experienceText: "Kisah pelanggan akan diterbitkan selepas pengalaman dan butiran sokongan diluluskan LS.", pending: "Butiran perlu disahkan sebelum diterbitkan", aiComing: "AKAN DATANG", noResults: "Tiada item katalog yang sepadan. Cuba carian lain.", viewAll: "Lihat semua", serviceProcess: "Daripada perbualan pertama kepada sokongan berterusan", close: "Tutup"
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

  const DEFAULT_CONTENT = {
    en: { heroTitleA: "Make room for", heroTitleB: "what’s next.", heroLead: "Thoughtful machinery and production solutions for food makers at every stage of their journey.", homeIntro: WORDS.en.homeIntro, currentTitle: "A closer look at LS.", currentText: "Meet LS Smart Machinery in Malaysia and explore our food-production equipment.", machineIntro: "A product overview, configuration details and technical data for this machine will be added after LS confirms them.", solutionIntro: "LS brings together planning, equipment and practical production support. Share your goals to start a conversation." },
    zh: { heroTitleA: "为下一步", heroTitleB: "预留空间。", heroLead: "为不同发展阶段的食品生产企业提供周到的设备与生产解决方案。", homeIntro: WORDS.zh.homeIntro, currentTitle: "走近 LS。", currentText: "认识位于马来西亚的 LS Smart Machinery，探索我们的食品生产设备。", machineIntro: "设备介绍、配置详情与技术资料将在 LS 确认后补充。", solutionIntro: "LS 提供规划、设备及实用的生产支持。欢迎分享您的目标并开始交流。" },
    ms: { heroTitleA: "Sediakan ruang", heroTitleB: "untuk seterusnya.", heroLead: "Mesin dan penyelesaian pengeluaran untuk pengeluar makanan pada setiap peringkat.", homeIntro: WORDS.ms.homeIntro, currentTitle: "Kenali LS dengan lebih dekat.", currentText: "Kenali LS Smart Machinery di Malaysia dan terokai peralatan pengeluaran makanan kami.", machineIntro: "Pengenalan produk, konfigurasi dan data teknikal akan ditambah selepas disahkan oleh LS.", solutionIntro: "LS menggabungkan perancangan, peralatan dan sokongan pengeluaran. Kongsikan matlamat anda untuk memulakan perbualan." }
  };

  const FOOD_ICONS = ["◌", "⌂", "▱", "⌁", "◇", "✣"];
  const WHY_POINTS = [
    ["01", "Plan around your production", "Factory layout and production-line design begin with your process, space and goals."],
    ["02", "Equipment with context", "Explore machinery supply and customized solutions for the products you plan to make."],
    ["03", "More than installation", "Technology transfer, modification, maintenance and after-sales support are part of the conversation."],
    ["04", "Practical support", "Facility fit-out and financial assistance can be discussed with LS around your needs."]
  ];
  const SOLUTIONS = ["Factory & Line Planning", "Machinery & Automation", "Facility Fit-Out", "Financing Support"];
  const SERVICES = ["Support & Repairs", "Installation & Training", "Technical Documents", "Spare Parts Request", "Production Improvement"];
  const COMPANY = ["About LS", "Locations", "Careers"];
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
    cmsImage: "",
    carryMessage: "",
    query: ""
  };
  if (!WORDS[state.language]) state.language = "en";

  const main = document.getElementById("main");
  const nav = document.querySelector(".primary-nav");
  const megaPanel = document.querySelector(".mega-panel");
  const languagePicker = document.getElementById("language-picker");
  let fullscreenReturnFocus = null;
  const titleCase = (value) => String(value || "").replace(/\b\S/g, (c) => c.toUpperCase());
  const t = (key) => (WORDS[state.language] && WORDS[state.language][key]) || WORDS.en[key] || key;
  const pageText = (key) => (PAGE_COPY[state.language] && PAGE_COPY[state.language][key]) || key;
  const localName = (value) => (LOCAL_NAMES[state.language] && LOCAL_NAMES[state.language][value]) || value;
  const inquiryUrl = (context = "") => context ? `#inquiry?context=${encodeURIComponent(context)}` : "#inquiry";
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
    if (!assignment) return "";
    const note = assignment.match === "category" && assignment.label ? `<figcaption class="asset-match-note">${esc(assetText(assignment.label))}</figcaption>` : "";
    return `<figure class="catalogue-media ${assignment.match === "category" ? "is-category-reference" : "is-exact-match"} ${esc(className)}">${assetImage(assignment.image, "catalogue-photo", { sizes: "(max-width: 720px) 92vw, 30vw" })}${note}</figure>`;
  };
  const urlFor = (path) => `#${path}`;
  const categoryUrl = (category) => urlFor(`machines/${slug(category.name)}`);
  const productUrl = (name) => urlFor(`machine/${slug(name)}`);
  const itemRoute = () => location.hash.replace(/^#/, "");
  const allCatalogueItems = () => DATA.categories.flatMap((category) => {
    const items = category.items || (category.subcategories || []).flatMap((subcategory) => subcategory.items.map((item) => ({ ...item, subcategory: subcategory.name })));
    return items.map((item) => ({ ...item, category: category.name, categoryId: slug(category.name) }));
  });
  const findCategory = (name) => DATA.categories.find((category) => slug(category.name) === slug(name));
  const findProduct = (name) => allCatalogueItems().find((item) => slug(item.name) === slug(name));
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
      ? `<video class="intro-video" controls muted playsinline preload="none" poster="${esc(poster)}" data-motion-video aria-label="LS branded introduction: premises, MCD, MCWC and LS logo"><source src="${esc(video)}" type="video/mp4"><p>Video playback is unavailable. The still image remains available below.</p></video><figure class="video-static-fallback" hidden>${assetImage(posterId, "video-poster", { alt: assetText(posterRecord.alt), sizes: "(max-width: 720px) 100vw, 72vw" })}<figcaption>${esc(homeText("still"))}</figcaption></figure>`
      : `<figure class="video-poster-card">${assetImage(posterId, "video-poster", { alt: assetText(posterRecord.alt), sizes: "(max-width: 720px) 100vw, 72vw" })}<figcaption>${esc(state.language === "zh" ? "LS 厂房 · 静态视频封面" : state.language === "ms" ? "Premis LS · poster video statik" : "LS premises · static poster")}</figcaption></figure>`;
    return `<section class="home-current"><div class="intro-film section-wrap section-pad" aria-labelledby="intro-film-title"><div class="intro-film-copy"><span class="eyebrow inverse">${esc(t("currentLabel"))}</span><h2 id="intro-film-title" class="section-title">${esc(getContent().currentTitle)}</h2><p class="body-copy">${esc(getContent().currentText)}</p>${arrowLink("#company", homeText("aboutLink"))}<span class="film-duration">00:08 <span aria-hidden="true">/</span> LS SMART MACHINERY</span></div><div class="intro-film-frame">${content}<p class="film-caption">${esc(homeText("filmNote"))}</p></div></div></section>`;
  }
  const sectionHead = (eyebrow, title, action = "") => `<div class="section-heading-row"><div><span class="eyebrow">${esc(eyebrow)}</span><h2 class="section-title">${title}</h2></div>${action}</div>`;
  const arrowLink = (href, label) => `<a class="arrow-link" href="${esc(href)}">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  const buttonLink = (href, label, cls = "") => `<a class="button-link ${cls}" href="${esc(href)}">${esc(label)} <span class="button-arrow" aria-hidden="true">↗</span></a>`;
  const getContent = (language = state.language) => {
    const saved = readStore(STORAGE.published, {});
    return { ...DEFAULT_CONTENT[language], ...(saved[language] || {}) };
  };

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
  function pageFooter() {
    return `<div class="footer-inner"><div class="footer-main"><div class="footer-brand"><a class="brand" href="#home" aria-label="LS Smart Machinery home">${assetImage(sectionAsset("brand"), "brand-logo", { alt: "LS Machinery Innovation", loading: "lazy" })}<span class="brand-name">LS SMART<br>MACHINERY</span></a><p>LS Smart Machinery (M) SDN BHD<br>Malaysia</p><p class="small-note">SSM number and registration or certification wording pending LS confirmation.</p></div><div class="footer-links"><h3>Explore</h3><a href="#machines">Machines</a><a href="#food">Food production</a><a href="#solutions">Solutions</a><a href="#services">Services</a></div><div class="footer-links"><h3>Company</h3><a href="#company">About LS</a><a href="#company/history">Our history</a><a href="#company/locations">Locations</a><a href="#company/careers">Careers</a><a href="#insights">Insights</a></div><div class="footer-links"><h3>Talk to LS</h3><a href="#inquiry">Contact & inquiries</a><a href="#service/spare-parts-request">Spare parts request</a><span class="small-note">Address and contact details pending LS confirmation.</span></div></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} LS Smart Machinery (M) SDN BHD</span><span>Website preview · details marked for confirmation are not launch-ready.</span><div class="social-icons" aria-label="Social media channels">${["Facebook", "Instagram", "YouTube", "TikTok", "RedNote", "Indeed"].map((name) => `<span title="${name}">${name}</span>`).join("")}</div></div></div>`;
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
      { title: "Services & company", links: [...SERVICES.map((name) => [localName(name), `service/${slug(name)}`]), ...COMPANY.map((name) => [localName(name), `company/${slug(name)}`])] }
    ];
    megaPanel.innerHTML = groups.map((group) => `<div class="mega-group"><p>${esc(localName(group.title))}</p>${group.links.slice(0, 8).map(([name, path]) => `<a class="mega-feature" href="${urlFor(path)}">${esc(name)} <span aria-hidden="true">↗</span></a>`).join("")}</div>`).join("");
    const machineGroup = megaPanel.querySelectorAll(".mega-group")[1];
    const machineModels = ["LSF 502 MCD", "LSF 502 MCWC", "LSF 502 MCAD"];
    machineGroup.insertAdjacentHTML("beforeend", `<p class="mega-feature-label">Featured · verify model mapping</p>${machineModels.map((name) => `<a class="mega-feature" href="${productUrl(name)}">${esc(name)} <span aria-hidden="true">↗</span></a>`).join("")}`);
  }

  const HOME_COPY = {
    en: { about: "Machinery, planning and support. Together.", aboutLink: "Get to know LS", feature: "Featured machine", model: "Mini Cookies Depositor", design: "Plan your production", supply: "Find your equipment", support: "Keep moving forward", filmTitle: "A closer look at LS.", filmBody: "Meet LS Smart Machinery in Malaysia and explore our food-production equipment.", filmNote: "LS premises & machinery · 8-second introduction", still: "LS premises · Malaysia", segmentNote: "Equipment and food images are visual references. Suitability depends on your product, process and production requirements.", foodTitle: "What do you make?", segmentTitle: "Find your starting point.", next: "Your production. Your next step.", whyTitle: "Support at every stage.", whyBody: "From the first layout to ongoing service, connect your production needs with the right expertise.", why: [["Plan around your process", "Factory layout and production-line design shaped by your space, product and priorities."], ["Explore the right equipment", "Machinery supply and customized solutions, with suitability discussed around your requirements."], ["Build your team’s capability", "Installation, training and technology transfer to support your production team."], ["Keep support close", "Maintenance, repairs and after-sales service for the next stage of your operation."]] },
    zh: { about: "设备、规划与支持，环环相扣。", aboutLink: "认识 LS", feature: "精选设备", model: "迷你饼干注料机", design: "规划生产", supply: "寻找设备", support: "持续支持", filmTitle: "走近 LS。", filmBody: "认识位于马来西亚的 LS Smart Machinery，探索我们的食品生产设备。", filmNote: "LS 厂房与设备 · 8 秒简介", still: "LS 厂房 · 马来西亚", segmentNote: "设备与食品图片仅供参考。适用性取决于您的产品、流程及生产需求。", foodTitle: "您生产哪类食品？", segmentTitle: "找到适合您的起点。", next: "从您的生产需求出发。", whyTitle: "每一步，都有支持。", whyBody: "从最初的布局规划到持续服务，根据您的生产需求提供专业协助。", why: [["围绕流程进行规划", "结合厂房空间、产品及重点需求，设计工厂布局与生产线。"], ["探索合适的设备", "讨论设备供应与定制方案，并根据您的需求确认适用性。"], ["支持团队成长", "通过安装、培训与技术转移，协助您的生产团队。"], ["提供持续服务", "以维护、维修及售后服务，支持您下一阶段的运营。"]] },
    ms: { about: "Mesin, perancangan dan sokongan. Bersama.", aboutLink: "Kenali LS", feature: "Mesin pilihan", model: "Pendeposit Kuki Mini", design: "Rancang pengeluaran", supply: "Cari peralatan", support: "Sokongan berterusan", filmTitle: "Kenali LS dengan lebih dekat.", filmBody: "Kenali LS Smart Machinery di Malaysia dan terokai peralatan pengeluaran makanan kami.", filmNote: "Premis & mesin LS · Pengenalan 8 saat", still: "Premis LS · Malaysia", segmentNote: "Imej peralatan dan makanan sebagai rujukan visual. Kesesuaian bergantung pada produk, proses dan keperluan pengeluaran anda.", foodTitle: "Apakah produk anda?", segmentTitle: "Cari titik permulaan anda.", next: "Pengeluaran anda. Langkah seterusnya.", whyTitle: "Sokongan pada setiap peringkat.", whyBody: "Daripada susun atur awal hingga khidmat berterusan, padankan keperluan pengeluaran dengan kepakaran yang sesuai.", why: [["Rancang mengikut proses", "Reka bentuk susun atur kilang dan barisan pengeluaran berdasarkan ruang, produk dan keutamaan anda."], ["Terokai peralatan yang sesuai", "Bekalan mesin dan penyelesaian tersuai, dengan kesesuaian dibincangkan mengikut keperluan anda."], ["Bina keupayaan pasukan", "Pemasangan, latihan dan pemindahan teknologi untuk menyokong pasukan pengeluaran anda."], ["Sokongan yang berterusan", "Penyelenggaraan, pembaikan dan khidmat selepas jualan bagi peringkat operasi seterusnya."]] }
  };
  const homeText = (key) => HOME_COPY[state.language][key];

  function homePage() {
    const content = getContent();
    const foodCards = FOOD_GROUPS.slice(0, 6).map((food, index) => `<a class="food-card fade-in" href="${urlFor(`food/${slug(food.name)}`)}"><div class="food-photo">${assetImage(sectionAsset("foods", slug(food.name)), "food-card-image", { alt: "", sizes: "(max-width: 600px) 46vw, 30vw" })}<span class="food-num" aria-hidden="true">0${index + 1}</span></div><div class="food-card-label"><span class="food-name">${esc(localName(food.name))}</span><span class="card-arrow" aria-hidden="true">↗</span></div></a>`).join("");
    const segmentCards = SEGMENTS.slice(0, 3).map((segment, index) => `<article class="segment-card fade-in">${assetImage(sectionAsset("segments", slug(segment.name)), "segment-image", { sizes: "(max-width: 800px) 90vw, 30vw" })}<div class="segment-card-copy"><span class="segment-no">0${index + 1}</span><h3>${esc(localName(segment.name))}</h3><p>${esc(pageText(`segment0${index + 1}`))}</p>${arrowLink(urlFor(`segment/${slug(segment.name)}`), (state.language === "zh" ? "探索此企业类别" : state.language === "ms" ? "Terokai segmen ini" : t("segmentCta")))}</div></article>`).join("");
    return `<div class="home-page">
      <section class="home-hero" aria-labelledby="home-title"><div class="hero-grid">
        <div class="hero-copy"><span class="eyebrow">${esc(t("heroEyebrow"))}</span><h1 class="display-title" id="home-title">${esc(content.heroTitleA)}<br><em>${esc(content.heroTitleB)}</em></h1><p class="lede">${esc(content.heroLead)}</p><div class="hero-actions">${buttonLink("#machines", t("exploreMachines"))}${arrowLink("#inquiry", t("askForQuote"))}</div><div class="hero-kicker"><span>01 · DESIGN</span><span>02 · SUPPLY</span><span>03 · SUPPORT</span></div></div>
        <div class="hero-product">${visualArt()}<a class="hero-product-link" href="${productUrl("LSF 502 MCD")}"><span><small>${esc(homeText("feature"))}</small><strong>LSF 502 MCD</strong><span>${esc(homeText("model"))}</span></span><span class="product-arrow" aria-hidden="true">↗</span></a></div>
      </div></section>
      <nav class="home-paths section-wrap" aria-label="${esc(t("capabilities"))}">${[["solution/factory-line-planning", "design"], ["machines", "supply"], ["services", "support"]].map(([route, label], index) => `<a href="${urlFor(route)}"><span class="path-number">0${index + 1}</span><span>${esc(homeText(label))}</span><span aria-hidden="true">↗</span></a>`).join("")}</nav>
      <section class="home-about section-wrap section-pad"><div><span class="eyebrow">${esc(t("intro"))}</span><h2 class="section-title">${esc(homeText("about"))}</h2></div><div><p class="lede">${esc(content.homeIntro)}</p>${arrowLink("#company", homeText("aboutLink"))}</div></section>
      ${introMediaSection()}
      <section class="section-wrap section-pad home-why"><div class="why-section"><div class="why-copy"><span class="eyebrow">${esc(t("whyLabel"))}</span><h2 class="section-title">${esc(homeText("whyTitle"))}</h2><p class="body-copy">${esc(homeText("whyBody"))}</p>${arrowLink("#solutions", t("allSolutions"))}</div><div class="why-list">${homeText("why").map(([title, text], index) => `<article class="why-item fade-in"><span class="why-num">0${index + 1}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></article>`).join("")}</div></div></section>
      <section class="food-section section-pad" id="food"><div class="section-wrap">${sectionHead(t("foodLabel"), esc(homeText("foodTitle")), arrowLink("#food", t("allFood")))}<div class="food-grid">${foodCards}</div><p class="home-section-note">${esc(pageText("foodNote"))}</p></div></section>
      <section class="segment-section section-pad"><div class="section-wrap"><div class="home-section-intro"><div><span class="eyebrow">${esc(t("segmentsLabel"))}</span><h2 class="section-title">${esc(homeText("segmentTitle"))}</h2></div><p class="body-copy">${esc(pageText("segmentLead"))}</p></div><div class="segment-grid">${segmentCards}</div><p class="home-section-note">${esc(homeText("segmentNote"))}</p></div></section>
      ${inquirySection()}
    </div>`;
  }

  function machineIndexPage() {
    return `<section class="category-hero"><div class="section-wrap"><span class="eyebrow">MACHINES / CATALOGUE</span><h1 class="display-title">Find your <em>starting point.</em></h1><div class="tiles-grid category-index-grid">${DATA.categories.map((category) => {
      const items = category.items || (category.subcategories || []).flatMap((subcategory) => subcategory.items);
      return `<a class="info-tile category-index-card" href="${categoryUrl(category)}">${items[0] ? catalogueImage(items[0].name, category.name) : ""}<small>${items.length} SOURCE ENTRIES</small><h3>${esc(localName(category.name))} ↗</h3></a>`;
    }).join("")}</div></div></section>${inquirySection()}`;
  }

  function foodIndexPage() {
    return `<section class="category-hero"><div class="section-wrap"><span class="eyebrow">FOOD PRODUCTION</span><h1 class="display-title">Browse by <em>what you make.</em></h1><div class="food-grid">${FOOD_GROUPS.map((food, index) => `<a class="food-card fade-in" href="${urlFor(`food/${slug(food.name)}`)}"><span class="food-num">0${index + 1} / FOOD</span>${assetImage(sectionAsset("foods", slug(food.name)), "food-card-image", { sizes: "(max-width: 720px) 46vw, 25vw" })}<span class="food-name">${esc(localName(food.name))}</span><span class="card-arrow">↗</span></a>`).join("")}</div><p class="small-note">${esc(assetText(ASSETS.captions?.foods))}</p></div></section>${inquirySection()}`;
  }

  function categoryPage(categoryName) {
    const category = findCategory(categoryName);
    if (!category) return notFoundPage();
    const items = category.items || (category.subcategories || []).flatMap((sub) => sub.items.map((item) => ({ ...item, subcategory: sub.name })));
    const subcategoryOptions = category.subcategories ? `<option value="all">${esc(t("allItems"))}</option>${category.subcategories.map((sub) => `<option value="${esc(sub.name)}">${esc(localName(sub.name))}</option>`).join("")}` : "";
    return `<section class="category-hero"><div class="section-wrap"><div class="breadcrumbs"><a href="#home">Home</a><span>›</span><a href="#machines">${esc(t("navMachines"))}</a><span>›</span><span>${esc(localName(category.name))}</span></div><div class="category-heading"><div><span class="eyebrow">MACHINES / CATALOGUE</span><h1 class="display-title">${esc(localName(category.name))}<em>.</em></h1></div><div><p class="lede">Browse the machinery listed for this category. Confirm configuration, availability and technical suitability with LS.</p><span class="small-note">${items.length} source entries · ${esc(t("sourceWarning"))}</span></div></div><div class="catalogue-search"><label class="field"><span class="sr-only">${esc(t("filter"))}</span><input id="catalogue-search" type="search" placeholder="${esc(t("filter"))}" /></label>${subcategoryOptions ? `<label class="field" style="margin-top:10px"><span class="sr-only">Bakery subcategory</span><select id="subcategory-filter">${subcategoryOptions}</select></label>` : ""}</div><div class="catalogue-list" id="catalogue-list">${catalogueItems(items, category.name)}</div></div></section><section class="section-wrap section-pad"><div class="content-columns"><div><span class="eyebrow">${esc(t("overview"))}</span><h2 class="section-title">Need help narrowing things down?</h2></div><div><p class="body-copy">Share the product you make, the steps in your process and what you need to achieve. LS can help you identify which details to check before choosing machinery.</p>${buttonLink("#inquiry", "Discuss your requirements")}</div></div></section>${inquirySection()}`;
  }

  function catalogueItems(items, categoryName) {
    if (!items.length) return `<div class="empty-state">${esc(t("noResults"))}</div>`;
    return items.map((item) => `<a class="catalogue-item" href="${productUrl(item.name)}" data-item-name="${esc(item.name.toLowerCase())}" data-subcategory="${esc(item.subcategory || "")}">${catalogueImage(item.name, categoryName)}<small>${esc(localName(categoryName).toUpperCase())}${item.subcategory ? ` · ${esc(localName(item.subcategory).toUpperCase())}` : ""}</small><strong>${esc(item.name)} <span aria-hidden="true">↗</span></strong>${item.confirmWithLS ? `<span class="small-note">${esc(t("pending"))}</span>` : ""}</a>`).join("");
  }

  function localizedMachineCopy() {
    const content = {
      en: {
        suitabilityTitle: "Start with your process.", suitabilityBody: "Product information is being confirmed with LS. The right choice depends on your product, ingredients, process, intended output, available space and machine configuration.", suitabilityCta: "Ask LS about your requirements", featuresTitle: "Product information, verified first.", featuresBody: "Ask LS for current configuration details, available features, operating guidance and technical documents for this machine.", featureItems: ["Intended process and configuration — confirm with LS", "Technical specifications — available after catalogue verification", "Demonstration video — added when an approved video is available"], applicationTitle: "Tell LS what you make.", applicationBody: "The right setup can depend on product size, dough or filling, heads and expected output. Share those details with LS to confirm whether this machine is suitable.", technicalTitle: "Precise data from LS.", technicalBody: "Model specifications, sizes, heads, materials, outputs, utilities and accessories will be listed only after LS confirms the details for this machine.", technicalCta: "Request technical information", videoLabel: "MACHINE DEMONSTRATION", videoTitle: "See the machine in context.", videoBody: "An approved LS demonstration will appear here when available. Machine behavior should be shown with authentic footage.", videoPlaceholder: "APPROVED MACHINE VIDEO TO BE ADDED",
        benefitsLabel: "STRENGTHS & BENEFITS", benefitsTitle: "Evidence from the actual machine.", benefitsBody: "Add verified strengths, photos and short explanations after LS reviews the details for this model.", photoPending: "LS PHOTO TO BE ADDED",
        benefitOne: "Production application", benefitOneBody: "Add applications confirmed by LS for this specific model.", benefitTwo: "Machine details", benefitTwoBody: "Add model-specific features after catalogue and technical review.", benefitThree: "Service support", benefitThreeBody: "Add the verified support options available for this machine.",
        modelVerification: "Model mapping needs confirmation with LS.", foodNote: "These links help you explore food categories. They do not confirm that this machine is suitable for them.",
        insightsLabel: "INSPIRATION & INSIGHTS", insightsTitle: "Related stories, when verified.", insightsBody: "Approved customer stories, product applications and relevant articles can be linked here after LS confirms them.", insightsLink: "Explore LS Insights",
        accessoriesLabel: "ACCESSORIES", accessoriesTitle: "Accessories for this machine.", accessoriesBody: "Up to three verified accessories may be featured here after LS confirms compatibility and availability.",
        complementaryLabel: "COMPLEMENTARY MACHINES", complementaryTitle: "Build around your process.", complementaryBody: "Ask LS which equipment can work with this machine. Compatibility depends on the confirmed configuration.",
        similarLabel: "SIMILAR MACHINES", similarTitle: "Compare suitable alternatives.", similarBody: "LS can confirm which alternatives match your product, process and requirements.", categoryLink: "Browse the category"
      },
      zh: {
        suitabilityTitle: "从您的生产流程开始。", suitabilityBody: "设备资料仍在向 LS 确认。合适的选择取决于您的产品、原料、流程、预期产量、场地和设备配置。", suitabilityCta: "向 LS 咨询您的需求", featuresTitle: "以已核实的设备资料为准。", featuresBody: "请向 LS 了解此设备当前的配置、功能、操作指导和技术文件。", featureItems: ["适用流程与配置 — 请向 LS 确认", "技术规格 — 目录核实后提供", "演示视频 — 经确认后添加"], applicationTitle: "告诉 LS 您生产什么。", applicationBody: "合适的配置可能取决于产品尺寸、面团或馅料、机头和预期产量。请分享相关信息，并向 LS 确认设备是否适用。", technicalTitle: "技术资料以 LS 确认为准。", technicalBody: "只有在 LS 确认此机型的资料后，才会列出规格、尺寸、机头、材料、产量、公用设施和配件信息。", technicalCta: "索取技术资料", videoLabel: "设备演示", videoTitle: "了解设备的实际情况。", videoBody: "经 LS 确认的设备演示视频将在可用后添加。设备运行情况应使用真实拍摄素材展示。", videoPlaceholder: "待添加经批准的设备视频",
        benefitsLabel: "特点与优势", benefitsTitle: "以真实设备资料为准。", benefitsBody: "经 LS 核实本机型的相关资料后，再补充特点、照片和简要说明。", photoPending: "待添加 LS 设备照片",
        benefitOne: "生产应用", benefitOneBody: "仅添加 LS 确认适用于此型号的应用。", benefitTwo: "设备资料", benefitTwoBody: "完成目录和技术审核后，再补充本机型特点。", benefitThree: "服务支持", benefitThreeBody: "补充此设备可获得的已确认支持方式。",
        modelVerification: "机型与目录的对应关系仍需 LS 确认。", foodNote: "这些链接用于浏览食品类别，并不代表此设备适用于这些食品。", insightsLabel: "相关资讯", insightsTitle: "经确认后展示相关内容。", insightsBody: "LS 确认后，可在此处添加客户案例、产品应用和相关文章。", insightsLink: "浏览 LS 资讯",
        accessoriesLabel: "配件", accessoriesTitle: "适用于此设备的配件。", accessoriesBody: "LS 确认可用性与兼容性后，最多可在此展示三项配件。",
        complementaryLabel: "配套设备", complementaryTitle: "围绕您的生产流程规划。", complementaryBody: "请向 LS 确认可与此设备配套的机器。兼容性取决于最终确认的配置。",
        similarLabel: "相似设备", similarTitle: "比较合适的替代方案。", similarBody: "LS 可根据您的产品、流程和需求确认合适的替代方案。", categoryLink: "浏览设备类别"
      },
      ms: {
        suitabilityTitle: "Mulakan dengan proses anda.", suitabilityBody: "Maklumat produk sedang disahkan dengan LS. Pilihan yang sesuai bergantung pada produk, ramuan, proses, hasil yang diperlukan, ruang dan konfigurasi mesin.", suitabilityCta: "Bincang keperluan anda dengan LS", featuresTitle: "Maklumat produk selepas disahkan.", featuresBody: "Tanya LS tentang konfigurasi semasa, ciri, panduan operasi dan dokumen teknikal untuk mesin ini.", featureItems: ["Proses dan konfigurasi — sahkan dengan LS", "Spesifikasi teknikal — selepas katalog disahkan", "Video demonstrasi — ditambah selepas diluluskan"], applicationTitle: "Kongsikan produk yang anda hasilkan.", applicationBody: "Persediaan yang sesuai mungkin bergantung pada saiz produk, doh atau inti, kepala dan hasil yang dijangka. Kongsikan butiran ini dengan LS untuk mengesahkan kesesuaian mesin.", technicalTitle: "Data teknikal daripada LS.", technicalBody: "Spesifikasi, saiz, kepala, bahan, hasil, utiliti dan aksesori hanya akan disenaraikan selepas LS mengesahkan butiran mesin ini.", technicalCta: "Minta maklumat teknikal", videoLabel: "DEMONSTRASI MESIN", videoTitle: "Lihat mesin dalam konteks sebenar.", videoBody: "Video demonstrasi LS yang diluluskan akan ditambah apabila tersedia. Operasi mesin hendaklah ditunjukkan melalui rakaman sebenar.", videoPlaceholder: "VIDEO MESIN YANG DILULUSKAN AKAN DITAMBAH",
        benefitsLabel: "KEKUATAN & MANFAAT", benefitsTitle: "Maklumat daripada mesin sebenar.", benefitsBody: "Tambahkan kekuatan, foto dan penerangan ringkas selepas LS mengesahkan butiran model ini.", photoPending: "FOTO LS AKAN DITAMBAH",
        benefitOne: "Aplikasi pengeluaran", benefitOneBody: "Tambahkan aplikasi yang disahkan LS untuk model ini sahaja.", benefitTwo: "Butiran mesin", benefitTwoBody: "Tambahkan ciri khusus model selepas semakan katalog dan teknikal.", benefitThree: "Sokongan servis", benefitThreeBody: "Tambahkan pilihan sokongan yang telah disahkan untuk mesin ini.",
        modelVerification: "Pemetaan model dengan katalog perlu disahkan oleh LS.", foodNote: "Pautan ini membantu anda meneroka kategori makanan. Pautan ini tidak mengesahkan kesesuaian mesin.", insightsLabel: "ILHAM & MAKLUMAT", insightsTitle: "Kisah berkaitan selepas disahkan.", insightsBody: "Kisah pelanggan, aplikasi produk dan artikel berkaitan yang diluluskan boleh dipautkan di sini selepas pengesahan LS.", insightsLink: "Terokai Maklumat LS",
        accessoriesLabel: "AKSESORI", accessoriesTitle: "Aksesori untuk mesin ini.", accessoriesBody: "Sehingga tiga aksesori yang disahkan boleh dipaparkan selepas LS mengesahkan keserasian dan ketersediaannya.",
        complementaryLabel: "MESIN PELENGKAP", complementaryTitle: "Rancang mengikut proses anda.", complementaryBody: "Tanya LS peralatan yang boleh digunakan bersama mesin ini. Keserasian bergantung pada konfigurasi yang disahkan.",
        similarLabel: "MESIN SERUPA", similarTitle: "Bandingkan pilihan yang sesuai.", similarBody: "LS boleh mengesahkan pilihan alternatif berdasarkan produk, proses dan keperluan anda.", categoryLink: "Lihat kategori"
      }
    };
    return content[state.language] || content.en;
  }

  function machineMediaSections(copy) {
    return "";
  }

  function machineInsightsSection(copy) {
    return `<section class="section-wrap section-pad machine-content-section" id="machine-insights"><div class="content-columns"><div><span class="eyebrow">${esc(copy.insightsLabel)}</span><h2 class="section-title">${esc(copy.insightsTitle)}</h2></div><div><p class="body-copy">${esc(copy.insightsBody)}</p>${arrowLink("#insights", copy.insightsLink)}</div></div></section>`;
  }

  function machineAccessorySections(copy, category) {
    const url = categoryUrl(findCategory(category));
    return `<section class="section-wrap section-pad machine-content-section" id="complementary"><div class="content-columns"><div><span class="eyebrow">${esc(copy.complementaryLabel)}</span><h2 class="section-title">${esc(copy.complementaryTitle)}</h2></div><div><p class="body-copy">${esc(copy.complementaryBody)}</p>${arrowLink(url, copy.categoryLink)}</div></div></section><section class="section-wrap section-pad machine-content-section" id="similar"><div class="content-columns"><div><span class="eyebrow">${esc(copy.similarLabel)}</span><h2 class="section-title">${esc(copy.similarTitle)}</h2></div><div><p class="body-copy">${esc(copy.similarBody)}</p>${arrowLink(url, copy.categoryLink)}</div></div></section>`;
  }

  function productPage(productName) {
    let product = findProduct(productName);
    const requestedSlug = slug(productName);
    const modelCandidate = ["lsf-502-mcd", "lsf-502-mcwc", "lsf-502-mcad"].includes(requestedSlug);
    if (!product && !modelCandidate) return notFoundPage();
    const pageCopy = getContent();
    const copy = localizedMachineCopy();
    const title = modelCandidate ? (requestedSlug === "lsf-502-mcd" && pageCopy.machineTitle ? pageCopy.machineTitle : requestedSlug.toUpperCase().replace(/-/g, " ")) : product.name;
    const category = product ? product.category : "Bakery";
    const subcategory = product ? product.subcategory || "" : "Depositor Series";
    const verification = modelCandidate ? copy.modelVerification : t("pending");
    const currentContent = pageCopy;
    const intro = currentContent.machineIntro;
    const modelEntries = { "lsf-502-mcd": "Mini Cookie Depositor (MCD)", "lsf-502-mcwc": "Mini Cookie Wire Cut (MCWC)", "lsf-502-mcad": "Mini Cake Depositor (MCAD)" };
    const imageEntry = product?.name || modelEntries[requestedSlug];
    const assignment = imageEntry ? catalogueAssignment(imageEntry, category) : null;
    const stageImage = assignment ? assetImage(assignment.image, "machine-photo", { loading: "eager", sizes: "(max-width: 720px) 100vw, 52vw" }) : "";
    const stageLabel = assignment?.match === "category" ? `<figcaption class="machine-photo-note is-category-reference">${esc(assetText(assignment.label))}</figcaption>` : `<figcaption class="machine-photo-note">${esc(state.language === "zh" ? "LS 网站设备图片 · 请向 LS 确认技术资料" : state.language === "ms" ? "Imej mesin daripada laman LS · sahkan butiran teknikal dengan LS" : "Machine photograph from the LS website · confirm technical details with LS")}</figcaption>`;
    const foodExamples = FOOD_GROUPS.slice(0, 6).map((food) => `<a class="food-application-card" href="${urlFor(`food/${slug(food.name)}`)}">${assetImage(sectionAsset("foods", slug(food.name)), "food-application-image", { sizes: "(max-width: 720px) 42vw, 16vw" })}<span>${esc(localName(food.name))}</span></a>`).join("");
    return `<section class="section-wrap machine-page-hero"><div class="breadcrumbs"><a href="#home">${esc(t("homeLink"))}</a><span>›</span><a href="#machines">${esc(t("navMachines"))}</a><span>›</span><a href="${categoryUrl(findCategory(category))}">${esc(localName(category))}</a><span>›</span><span>${esc(title)}</span></div><div class="machine-hero-grid"><div class="machine-hero-copy"><span class="eyebrow">${esc(localName(category))}${subcategory ? ` / ${esc(localName(subcategory))}` : ""}</span><h1 class="display-title">${esc(title)}</h1><p class="lede">${esc(intro)}</p><span class="small-note">${esc(t("unverified"))} · ${esc(verification)}</span><div class="hero-actions" style="margin-top:26px">${buttonLink(inquiryUrl(title), t("askForInfo"))}</div></div><figure class="machine-stage" aria-label="LS machine product photograph"><div class="machine-image-well" data-image-key="${esc(assignment?.image || "")}">${stageImage}</div><div class="stage-controls" aria-label="Machine image controls"><button type="button" class="stage-button fullscreen-button" data-fullscreen aria-label="Open image full screen">⛶</button><button type="button" class="stage-button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" class="stage-button" data-zoom="out" aria-label="Reset image zoom">−</button></div>${stageLabel}</figure></div><nav class="machine-tabs" aria-label="On this page"><a href="#suitability">${esc(t("suitability"))}</a><a href="#features">${esc(t("features"))}</a><a href="#applications">${esc(t("application"))}</a><a href="#machine-insights">${esc(copy.insightsLabel)}</a><a href="#technical">${esc(t("technical"))}</a><a href="#complementary">${esc(copy.complementaryLabel)}</a><a href="#similar">${esc(copy.similarLabel)}</a></nav></section><section class="section-wrap section-pad" id="suitability"><div class="content-columns"><div><span class="eyebrow">${esc(t("suitability"))}</span><h2 class="section-title">${esc(copy.suitabilityTitle)}</h2></div><div><p class="body-copy">${esc(copy.suitabilityBody)}</p>${arrowLink(inquiryUrl(title), copy.suitabilityCta)}</div></div></section><section class="food-section section-pad" id="features"><div class="section-wrap"><span class="eyebrow">${esc(t("features"))}</span><h2 class="section-title">${esc(copy.featuresTitle)}</h2><p class="lede">${esc(copy.featuresBody)}</p><ul class="feature-list">${copy.featureItems.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div></section><section class="section-wrap section-pad" id="applications"><div class="content-columns"><div><span class="eyebrow">${esc(t("application"))}</span><h2 class="section-title">${esc(copy.applicationTitle)}</h2></div><div><p class="body-copy">${esc(copy.applicationBody)}</p><div class="food-application-grid">${foodExamples}</div><p class="small-note machine-application-note">${esc(copy.foodNote)} ${esc(state.language === "zh" ? "应用图片仅作浏览参考，机器兼容性须向 LS 确认。" : state.language === "ms" ? "Imej aplikasi hanya untuk rujukan; keserasian mesin perlu disahkan dengan LS." : "Application images are browsing references; confirm machine compatibility with LS.")}</p></div></div></section>${machineInsightsSection(copy)}<section class="testimonials-section section-pad" id="technical"><div class="section-wrap content-columns"><div><span class="eyebrow">${esc(t("technical"))}</span><h2 class="section-title">${esc(copy.technicalTitle)}</h2></div><div><p class="body-copy">${esc(copy.technicalBody)}</p>${buttonLink(inquiryUrl(title), copy.technicalCta)}</div></div></section>${machineAccessorySections(copy, category)}${inquirySection(title)}`;
  }

  function foodPage(foodName) {
    const food = FOOD_GROUPS.find((item) => slug(item.name) === slug(foodName));
    if (!food) return notFoundPage();
    const foodExamples = {
      "cookies-biscuits": ["Bakery", "Production Line", "Package"], "cakes": ["Bakery", "Production Line", "Package"], "bread-buns": ["Bakery", "Production Line"], "pastries-crusted-foods": ["Bakery", "Production Line"], "kueh-asian-foods": ["Kitchen", "Bakery"], "dim-sum": ["Kitchen", "Bakery", "Package"]
    };
    const relevantCategories = foodExamples[slug(food.name)] || DATA.categories.map((category) => category.name);
    const categoryTiles = relevantCategories.map((name) => {
      const category = findCategory(name);
      const items = category.items || (category.subcategories || []).flatMap((subcategory) => subcategory.items);
      return `<a class="info-tile category-index-card" href="${categoryUrl(category)}">${items[0] ? catalogueImage(items[0].name, category.name) : ""}<small>MACHINERY CATEGORY</small><h3>${esc(localName(name))}</h3><p>See the supplied catalogue list and ask LS about process suitability.</p><span class="arrow-link">${esc(t("viewCategory"))} ↗</span></a>`;
    }).join("");
    return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><div class="breadcrumbs"><a href="#home">Home</a><span>›</span><a href="#food">${esc(t("navFood"))}</a><span>›</span><span>${esc(localName(food.name))}</span></div><span class="eyebrow">FOOD PRODUCTION / APPLICATION</span><h1 class="display-title">${esc(localName(food.name))}<em>.</em></h1><p class="lede">Explore equipment categories that may be relevant to this food application. Final suitability depends on your ingredients, process and production requirements.</p></div><div class="content-info-card">${assetImage(sectionAsset("foods", slug(food.name)), "food-hero-image", { sizes: "(max-width: 720px) 90vw, 35vw" })}<p class="small-note">${esc(assetText(ASSETS.captions?.foods))}</p><span class="eyebrow">START WITH THE PROCESS</span><p class="body-copy">What product are you making? Which steps do you want to automate or improve? Share your answers with LS and confirm machine fit before planning a line.</p>${buttonLink("#inquiry", "Discuss your food production")}</div></div></section><section class="section-wrap section-pad"><div class="section-heading-row"><div><span class="eyebrow">EXPLORE EQUIPMENT</span><h2 class="section-title">Browse a place <em>to start.</em></h2></div></div><div class="tiles-grid">${categoryTiles}</div><p class="small-note">Category links are a starting point for browsing, not a verified equipment recommendation.</p></section>${inquirySection()}`;
  }

  function segmentPage(name) {
    const segment = SEGMENTS.find((item) => slug(item.name) === slug(name));
    if (!segment) return notFoundPage();
    const detail = SEGMENT_DETAILS.find((item) => item.match.test(segment.name)) || SEGMENT_DETAILS[1];
    return `<section class="segment-hero"><div class="section-wrap"><div class="breadcrumbs"><a href="#home">Home</a><span>›</span><span>${esc(localName(segment.name))}</span></div><span class="eyebrow inverse">BUSINESS SEGMENTS / ${esc(localName(segment.name).toUpperCase())}</span><h1 class="display-title">Your next step,<br><em>on your terms.</em></h1><p class="lede">${esc(detail.summary)}</p><div class="hero-actions" style="margin-top:26px">${buttonLink("#inquiry", "Discuss your production plans", "light")}${arrowLink("#machines", "Browse machines")}</div></div></section><section class="section-wrap section-pad"><div class="content-columns"><div><span class="eyebrow">A CLEAR PLACE TO START</span><h2 class="section-title">Map the next move <em>together.</em></h2></div><div><ul class="feature-list">${detail.steps.map((step) => `<li>${esc(step)}</li>`).join("")}</ul><p class="body-copy">Recommendations depend on the product, process, capacity needs, space and configuration. Segment pages help you explore; LS will confirm technical fit with you.</p></div></div><div class="segment-machine-grid">${DATA.categories.slice(0, 3).map((category, index) => {
      const items = category.items || (category.subcategories || []).flatMap((subcategory) => subcategory.items);
      return `<a class="segment-machine" href="${categoryUrl(category)}">${items[0] ? catalogueImage(items[0].name, category.name, "segment-machine-media") : ""}<small>0${index + 1} / EXPLORE</small><h3>${esc(localName(category.name))}</h3><p>Browse equipment and continue to the product details.</p></a>`;
    }).join("")}</div><p class="small-note">Category imagery is a browsing reference. Machine fit depends on confirmed production requirements, not company size alone.</p></section>${inquirySection()}`;
  }

  function genericOverviewPage(kind, name = "") {
    const pageName = name ? titleCase(name.replace(/-/g, " ")) : titleCase(kind);
    if (kind === "solutions" || kind === "solution") {
      const chosen = name ? localName(SOLUTIONS.find((item) => slug(item) === slug(name)) || pageName) : "Engineering that starts with your process";
      return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">SOLUTIONS / ${name ? "CAPABILITY" : "HOW LS CAN HELP"}</span><h1 class="display-title">${esc(chosen)}<em>.</em></h1><p class="lede">${esc(getContent().solutionIntro)}</p></div><div class="content-info-card"><span class="eyebrow">A PRACTICAL FIRST STEP</span><p class="body-copy">Talk through your product, layout and goals. LS can confirm which services and machinery are relevant.</p>${buttonLink("#inquiry", "Discuss a solution")}</div></div></section><section class="section-wrap section-pad solution-video-block"><div class="section-heading-row"><div><span class="eyebrow">SOLUTIONS / VIDEO PREVIEW</span><h2 class="section-title">See the work, when approved.</h2></div><p class="body-copy">LS solution footage will be added after review. Videos will show authentic facilities and work.</p></div><div class="video-placeholder" role="img" aria-label="LS solution video preview pending approval"><span class="video-play" aria-hidden="true">▶</span><span>APPROVED LS SOLUTION VIDEO TO BE ADDED</span></div></section><section class="section-wrap section-pad"><div class="tiles-grid">${SOLUTIONS.map((solution, index) => `<article class="info-tile fade-in"><small>CAPABILITY / 0${index + 1}</small><h3>${esc(solution)}</h3><p>${solution === "Factory & Line Planning" ? "Factory layout and production-line design." : solution === "Machinery & Automation" ? "Machinery supply, customized solutions, modification and technology transfer." : solution === "Facility Fit-Out" ? "Epoxy services and clean-room paneling." : "Financial assistance; terms and availability to be confirmed with LS."}</p></article>`).join("")}</div><article class="info-tile fade-in" style="margin-top:14px"><small>FUTURE DEVELOPMENT</small><h3>AI technology implementation</h3><p>Coming soon.</p><span class="small-note">${esc(t("aiComing"))}</span></article><div style="margin-top:38px"><span class="eyebrow">FOOD PRODUCTION</span><div class="social-links" style="margin-top:16px">${FOOD_GROUPS.map((food) => `<a href="${urlFor(`food/${slug(food.name)}`)}">${esc(localName(food.name))} ↗</a>`).join("")}</div></div></section>${inquirySection()}`;
    }
    if (kind === "services" || kind === "service") {
      if (slug(name).includes("spare-parts")) return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">SERVICES / PARTS REQUEST</span><h1 class="display-title">Spare parts <em>request.</em></h1><p class="lede">${esc(t("spareIntro"))}</p></div><div class="content-info-card"><span class="eyebrow">NOT SURE WHICH PART?</span><p class="body-copy">${esc(t("unknownPart"))}</p>${buttonLink("#inquiry?type=general", "Use the general inquiry form")}</div></div></section>${inquirySection("Spare parts request")}`;
      return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">SERVICES / SUPPORT</span><h1 class="display-title">${esc(kind === "services" ? "Stay supported." : localName(pageName))}<em>.</em></h1><p class="lede">Discuss installation, training, maintenance, technical documents, spare parts and production improvement with LS.</p></div><div class="content-info-card"><span class="eyebrow">SERVICE AVAILABILITY</span><p class="body-copy">Hotline number and actual availability will be shown once confirmed by LS.</p>${buttonLink("#inquiry", "Contact LS about service")}</div></div></section><section class="section-wrap section-pad"><span class="eyebrow">${esc(t("serviceProcess"))}</span><h2 class="section-title">A continuing <em>production partnership.</em></h2><div class="tiles-grid">${["Appointment", "Floor planning and design", "Order placement", "Machine installation", "Technology transfer", "After-sales service"].map((step, index) => `<article class="info-tile"><small>0${index + 1} / SERVICE PROCESS</small><h3>${esc(step)}</h3></article>`).join("")}</div><div class="tiles-grid">${SERVICES.map((service) => `<a class="info-tile" href="${urlFor(`service/${slug(service)}`)}"><small>SERVICE</small><h3>${esc(localName(service))} ↗</h3></a>`).join("")}</div></section>${inquirySection()}`;
    }
    if (kind === "company") {
      const sections = [
        ["About LS", "Building the future of food production", "LS Smart Machinery (M) SDN BHD is based in Malaysia. LS specializes in machinery, production solutions and after-sales service for food producers."],
        ["What LS does", "From production design to continued support", "Factory layout and production-line design · epoxy services and clean-room paneling · machinery supply and customized solutions · technology transfer and modification · maintenance and after-sales support · financial assistance."],
        ["Brand values", "Engineering that listens", "Professionalism, practical collaboration and service are central to the way LS describes its work. More detail can be added after LS approves its brand and internal values."],
        ["Locations", t("locationTitle"), t("locationText")],
        ["Careers", t("careersTitle"), t("careersText")]
      ];
      const isHistory = slug(name).includes("history");
      if (isHistory) return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">COMPANY / HISTORY</span><h1 class="display-title">${esc(t("historyTitle"))}<em>.</em></h1><p class="lede">${esc(t("historyText"))}</p></div><div class="content-info-card"><span class="eyebrow">HISTORY TIMELINE</span><p class="body-copy">Verified founding dates, milestones and company developments will appear in the timeline after LS confirms the record.</p></div></div></section><section class="section-wrap section-pad"><div class="tiles-grid">${["Company began", "Capabilities expanded", "Today"].map((step, index) => `<article class="info-tile fade-in"><small>0${index + 1} / MILESTONE · DATE TO BE CONFIRMED</small><h3>${step}</h3><p>Milestone details pending LS confirmation.</p></article>`).join("")}</div></section>${inquirySection()}`;
      if (slug(name).includes("locations")) return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">COMPANY / LOCATIONS</span><h1 class="display-title">${esc(t("locationTitle"))}<em>.</em></h1><p class="lede">${esc(t("locationText"))}</p></div><div class="content-info-card"><span class="eyebrow">PLAN A VISIT</span><p class="body-copy">Share your availability and a member of the LS team can follow up when confirmed contact options are configured.</p>${buttonLink("#inquiry", "Arrange a visit")}</div></div></section>${inquirySection()}`;
      if (slug(name).includes("careers")) return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">COMPANY / CAREERS</span><h1 class="display-title">${esc(t("careersTitle"))}<em>.</em></h1><p class="lede">${esc(t("careersText"))}</p></div><div class="content-info-card"><span class="eyebrow">RECRUITMENT CHANNELS</span><p class="body-copy">Official LinkedIn, Threads and recruitment links will be added after LS confirms them.</p></div></div></section>${inquirySection()}`;
      return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">COMPANY / ABOUT LS</span><h1 class="display-title">Food production, <em>thoughtfully engineered.</em></h1><p class="lede">LS Smart Machinery (M) SDN BHD is based in Malaysia and provides machinery, customized production solutions and after-sales support.</p></div><div class="content-info-card"><span class="eyebrow">A CLEAR INTRODUCTION</span><p class="body-copy">${esc(t("homeIntro"))}</p>${arrowLink("#company/history", "Explore the LS history")}</div></div></section><section class="section-wrap section-pad"><div class="tiles-grid">${sections.map(([eyebrow, title, text]) => `<article class="info-tile"><small>${esc(eyebrow.toUpperCase())}</small><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join("")}</div><div style="margin-top:34px">${arrowLink("#company/history", "See the history timeline")} ${arrowLink("#company/locations", "Visit LS")} ${arrowLink("#company/careers", "Careers")}</div></section>${inquirySection()}`;
    }
    if (kind === "insights") return `<section class="content-page-hero"><div class="section-wrap content-hero-grid"><div><span class="eyebrow">LS / INSIGHTS</span><h1 class="display-title">Ideas, people <em>&amp; progress.</em></h1><p class="lede">${esc(t("insightsText"))}</p></div><div class="content-info-card"><span class="eyebrow">EDITORIAL STANDARD</span><p class="body-copy">Only confirmed LS events and participation are presented as LS activities. External news will be sourced and clearly attributed.</p></div></div></section><section class="section-wrap section-pad"><div class="tiles-grid">${["Upcoming events", "LS activities", "Food manufacturing insights", "Customer stories"].map((title) => `<article class="info-tile"><small>INSIGHTS / ${esc(t("pending"))}</small><h3>${title}</h3><p>Content will be published after LS confirms details and applicable links.</p></article>`).join("")}</div></section>${inquirySection()}`;
    return notFoundPage();
  }

  function inquirySection(machine = "", forceGeneral = false) {
    const isSpareRequest = !forceGeneral && machine.toLowerCase().includes("spare");
    const preselectedType = isSpareRequest ? "Spare parts request" : "";
    return `<section class="inquiry-section section-pad" id="inquiry"><div class="section-wrap inquiry-layout"><div><span class="eyebrow">${esc(t("contactLabel"))}</span><h2 class="section-title">${esc(pageText("contactTitle"))}</h2><p class="body-copy">${esc(pageText("contactBody"))}</p><div class="content-info-card"><span class="eyebrow">${esc(t("demoOnly"))}</span><p class="small-note">The email address and Walink destination must be configured with verified LS details before these handoffs can be used.</p></div></div><div class="inquiry-card"><form class="inquiry-form" id="lead-form" data-machine="${esc(machine)}"><div class="field"><label for="inq-type">${esc(t("inquiryType"))}</label><select id="inq-type" name="inquiryType"><option value="">${esc(t("selectOne"))}</option>${[["Request a quote", t("askForQuote")], ["Book a consultation", t("consult")], ["Arrange a visit", t("visit")], ...(isSpareRequest ? [["Spare parts request", t("spareParts")]] : [])].map(([value, label]) => `<option value="${esc(value)}" ${value === preselectedType ? "selected" : ""}>${esc(label)}</option>`).join("")}</select></div><div class="field"><label for="inq-company">${esc(t("company"))}</label><input id="inq-company" name="company" autocomplete="organization"></div><div class="field"><label for="inq-first">${esc(t("firstName"))} *</label><input id="inq-first" name="firstName" autocomplete="given-name" required></div><div class="field"><label for="inq-last">${esc(t("lastName"))} *</label><input id="inq-last" name="lastName" autocomplete="family-name" required></div><div class="field"><label for="inq-email">${esc(t("email"))}</label><input id="inq-email" name="email" type="email" autocomplete="email"></div><div class="field"><label for="inq-phone">${esc(t("phone"))}</label><input id="inq-phone" name="phone" type="tel" autocomplete="tel"></div><div class="field full"><label for="inq-country">${esc(t("country"))}</label><input id="inq-country" name="country" autocomplete="country-name"></div>${isSpareRequest ? `<div class="field"><label for="part-machine">${esc(t("machineNumber"))}</label><input id="part-machine" name="machineNumber"></div><div class="field"><label for="part-model">${esc(t("model"))}</label><input id="part-model" name="partModel"></div><div class="field full"><label for="part-number">${esc(t("partNumber"))}</label><input id="part-number" name="partNumber"></div><div class="field"><label for="part-description">${esc(t("description"))}</label><input id="part-description" name="partDescription"></div><div class="field"><label for="part-quantity">${esc(t("quantity"))}</label><input id="part-quantity" name="quantity" type="number" min="1"></div><div class="field full"><label for="part-address">${esc(t("deliveryAddress"))}</label><textarea id="part-address" name="deliveryAddress"></textarea></div><div class="field full"><label for="part-remarks">${esc(t("remarks"))}</label><textarea id="part-remarks" name="remarks"></textarea></div>` : `<div class="field full"><label for="inq-message">${esc(t("message"))} *</label><textarea id="inq-message" name="message" required>${esc(state.carryMessage || "")}</textarea></div>`}<label class="checkbox-line"><input type="checkbox" name="insights"><span>${esc(t("insightsSubscribe"))}</span></label><div class="inquiry-summary" id="inquiry-summary" tabindex="0" aria-live="polite">${esc(machine ? `${t("inquiryMachine")}: ${machine}` : `${t("inquiryMachine")}: ${itemRoute() || "Home"}`)}\nFill in the form to prepare a shareable inquiry.</div><div class="form-actions"><button class="button-link" type="submit">${esc(t("openEmail"))} <span class="button-arrow">↗</span></button><button class="button-link outline" type="button" data-whatsapp>${esc(t("copyRequest"))} <span class="button-arrow">↗</span></button><button class="button-link outline" type="button" data-open-whatsapp>${esc(t("openWhatsApp"))} <span class="button-arrow">↗</span></button></div>${isSpareRequest ? `<button class="button-link outline" type="button" data-general-inquiry>I cannot identify the part · use general inquiry ↗</button>` : ""}<p class="form-status" role="status"></p></form></div></div></section>`;
  }

  function notFoundPage() {
    return `<section class="not-found section-wrap"><span class="eyebrow">LS SMART MACHINERY</span><h1 class="display-title">This page is <em>not here.</em></h1><p class="lede">The link may be incomplete. Browse the catalogue or return to the homepage.</p>${buttonLink("#home", "Return home")}</section>`;
  }

  function render() {
    const rawRoute = itemRoute();
    const route = rawRoute.split("?")[0] || "home";
    const routeParams = new URLSearchParams(rawRoute.split("?")[1] || "");
    state.route = route;
    const [kind, ...rest] = route.split("/");
    const value = rest.join("/");
    let html;
    if (kind === "home" || kind === "") html = homePage();
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
    applyLanguage();
    syncMotionControls();
    const inquiryLink = document.querySelector('[data-nav="inquiry"]');
    const machineContext = route.startsWith("machine/") ? (findProduct(route.split("/").pop())?.name || route.split("/").pop().toUpperCase().replace(/-/g, " ")) : "";
    if (inquiryLink) inquiryLink.href = inquiryUrl(machineContext);
    observeMotion();
    setupVideoMotion();
    updateNav();
    setupCatalogueSearch();
    setupInquiryForm();
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }

  function updateNav() {
    document.querySelectorAll("[data-nav]").forEach((link) => link.classList.remove("active"));
    const root = state.route.split("/")[0];
    const match = root === "food" ? "food" : root === "machine" || root === "machines" ? "machines" : root === "solution" || root === "solutions" ? "solutions" : root === "service" || root === "services" ? "services" : root === "company" ? "company" : root === "insights" ? "insights" : "";
    const link = match && document.querySelector(`[data-nav="${match}"]`);
    if (link) link.classList.add("active");
  }

  function hydratePageImages(route) {
    const [kind, ...rest] = route.split("/");
    const pageName = rest.join("/");
    const appendPhoto = (target, imageId, captionKey, className = "route-photo") => {
      if (!target || !imageId || !ASSETS.images[imageId]) return;
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
    const applyFilter = () => {
      const query = search.value.trim().toLowerCase();
      const sub = filter ? filter.value : "all";
      const filtered = items.filter((item) => `${item.name} ${item.subcategory || ""}`.toLowerCase().includes(query) && (sub === "all" || item.subcategory === sub));
      list.innerHTML = filtered.length ? catalogueItems(filtered, category.name) : `<div class="empty-state">${esc(t("noResults"))}</div>`;
    };
    search.addEventListener("input", applyFilter);
    if (filter) filter.addEventListener("change", applyFilter);
  }

  function setupInquiryForm() {
    const form = document.getElementById("lead-form");
    if (!form) return;
    const summary = document.getElementById("inquiry-summary");
    const status = form.querySelector(".form-status");
    const getValues = () => Object.fromEntries(new FormData(form).entries());
    const validateContact = () => {
      if (!form.reportValidity()) return false;
      const values = getValues();
      if (values.email || values.phone) return true;
      status.textContent = "Please provide an email address or telephone number so LS can reply.";
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
        `Name: ${values.firstName || ""} ${values.lastName || ""}`.trim(),
        `Company: ${values.company || "Not provided"}`,
        `Email: ${values.email || "Not provided"}`,
        `Telephone: ${values.phone || "Not provided"}`,
        `Country: ${values.country || "Not provided"}`
      ];
      if (values.machineNumber || values.partModel || values.partNumber || values.partDescription) {
        rows.push(`Machine number: ${values.machineNumber || "Not provided"}`, `Model: ${values.partModel || "Not provided"}`, `Part number: ${values.partNumber || "Not provided"}`, `Part description: ${values.partDescription || "Not provided"}`, `Quantity: ${values.quantity || "Not provided"}`, `Delivery address: ${values.deliveryAddress || "Not provided"}`, `Remarks: ${values.remarks || "Not provided"}`);
      }
      if (values.message) rows.push(`Message: ${values.message}`);
      if (form.querySelector('[name="insights"]')?.checked) rows.push("Insights: Interested in subscription follow-up");
      return rows.join("\n");
    };
    const updateSummary = () => { summary.textContent = formatSummary(); };
    form.addEventListener("input", updateSummary);
    form.addEventListener("change", updateSummary);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const values = getValues();
      if (!validateContact()) return;
      const message = formatSummary();
      if (CONTACT_SETTINGS.email) {
        const mailto = `mailto:${encodeURIComponent(CONTACT_SETTINGS.email)}?subject=${encodeURIComponent(`LS Smart Machinery inquiry — ${values.inquiryType || "Website request"}`)}&body=${encodeURIComponent(message)}`;
        window.location.href = mailto;
        status.textContent = t("emailReady");
      } else {
        status.textContent = t("contactPending");
        summary.textContent = message;
      }
      updateSummary();
      status.textContent = CONTACT_SETTINGS.email ? t("emailReady") : t("contactPending");
    });
    form.querySelector("[data-whatsapp]")?.addEventListener("click", async () => {
      if (!validateContact()) return;
      const message = formatSummary();
      summary.textContent = message;
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = t("copied");
      } catch {
        summary.focus?.();
        status.textContent = t("copiedFallback");
      }
    });
    form.querySelector("[data-open-whatsapp]")?.addEventListener("click", async () => {
      if (!validateContact()) return;
      const message = formatSummary();
      summary.textContent = message;
      if (!CONTACT_SETTINGS.walink) { status.textContent = t("contactPending"); return; }
      window.open(CONTACT_SETTINGS.walink, "_blank", "noopener,noreferrer");
      try {
        await navigator.clipboard.writeText(message);
        status.textContent = t("copied");
      } catch {
        summary.focus();
        status.textContent = t("copiedFallback");
      }
    });
    form.querySelector("[data-general-inquiry]")?.addEventListener("click", () => {
      state.carryMessage = `Part identification follow-up requested.\n\n${formatSummary()}`;
      location.hash = `#inquiry?type=general&context=${encodeURIComponent("Spare parts follow-up")}`;
    });
    updateSummary();
  }

  function cmsSeed(language = state.language) { return { ...DEFAULT_CONTENT[language] }; }
  function cmsFields(language = state.language) {
    const saved = readStore(STORAGE.published, {});
    const draft = readStore(STORAGE.drafts, {});
    const pageKey = state.cmsPage === "machine" ? "machine" : state.cmsPage;
    return { ...cmsSeed(language), ...(saved[language] || {}), ...(draft[language]?.[pageKey] || {}) };
  }
  function cmsOpen() {
    state.cmsOpen = true;
    state.cmsFields = cmsFields();
    state.cmsTechnicalReview = false;
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
    return `<span class="eyebrow">HOMEPAGE PREVIEW / ${esc(state.language.toUpperCase())}</span><h3>${esc(fields.heroTitleA || "")} <em>${esc(fields.heroTitleB || "")}</em></h3><p>${esc(fields.heroLead || "")}</p><span class="small-note">${esc(fields.homeIntro || "")}</span><hr><span class="eyebrow">${esc(t("currentLabel"))}</span><h3>${esc(fields.currentTitle || "")}</h3><p>${esc(fields.currentText || "")}</p>`;
  }
  function renderCms() {
    document.querySelector(".cms-overlay")?.remove();
    const fields = state.cmsFields;
    const draftMap = readStore(STORAGE.drafts, {});
    const hasDraft = !!draftMap[state.language]?.[state.cmsPage];
    const overlay = document.createElement("div");
    overlay.className = "cms-overlay";
    overlay.innerHTML = `<section class="cms-panel" role="dialog" aria-modal="true" aria-labelledby="cms-title"><div class="cms-top"><div><span class="eyebrow">LS / LOCAL PROTOTYPE</span><h2 id="cms-title">${esc(t("cmsTitle"))}</h2></div><button class="cms-close" aria-label="${esc(t("close"))}">×</button></div><div class="cms-demo-warning">${esc(t("cmsWarning"))}<br><strong>${esc(t("cmsLocal"))}</strong></div><div class="cms-toolbar"><label class="field"><span>${esc(t("pageToEdit"))}</span><select id="cms-page"><option value="home">Homepage</option><option value="machine">Featured machine</option><option value="solutions">Solutions</option></select></label><label class="field"><span>Preview role</span><select id="cms-role"><option value="editor">${esc(t("editor"))}</option><option value="publisher">${esc(t("publisher"))}</option></select></label></div><div class="cms-main"><div class="cms-form"><span class="eyebrow">${esc(t("copyToEdit"))} · ${esc(state.language.toUpperCase())}</span>${state.cmsPage === "home" ? `<div class="field"><label for="cms-title-a">Homepage title</label><input id="cms-title-a" data-cms-field="heroTitleA" value="${esc(fields.heroTitleA)}"></div><div class="field"><label for="cms-title-b">Homepage title emphasis</label><input id="cms-title-b" data-cms-field="heroTitleB" value="${esc(fields.heroTitleB)}"></div><div class="field"><label for="cms-lead">Introduction</label><textarea id="cms-lead" data-cms-field="heroLead">${esc(fields.heroLead)}</textarea></div><div class="field"><label for="cms-intro">About LS</label><textarea id="cms-intro" data-cms-field="homeIntro">${esc(fields.homeIntro)}</textarea></div><div class="field"><label for="cms-current-title">Current at LS · title</label><input id="cms-current-title" data-cms-field="currentTitle" value="${esc(fields.currentTitle)}"></div><div class="field"><label for="cms-current">Current at LS · description</label><textarea id="cms-current" data-cms-field="currentText">${esc(fields.currentText)}</textarea></div>` : state.cmsPage === "machine" ? `<div class="field"><label for="cms-machine-title">Machine title</label><input id="cms-machine-title" data-cms-field="machineTitle" value="${esc(fields.machineTitle || "LSF 502 MCD")}"></div><div class="field"><label for="cms-machine-intro">Machine introduction</label><textarea id="cms-machine-intro" data-cms-field="machineIntro">${esc(fields.machineIntro)}</textarea></div><label class="checkbox-line cms-check"><input type="checkbox" id="cms-technical-review" ${state.cmsTechnicalReview ? "checked" : ""}><span>${esc(t("machineReview"))} — confirm with the actual LS technical reviewer before launch.</span></label>` : `<div class="field"><label for="cms-solution-intro">Solutions introduction</label><textarea id="cms-solution-intro" data-cms-field="solutionIntro">${esc(fields.solutionIntro)}</textarea></div><p class="small-note">Edit existing approved copy within the fixed page layout. The live website remains unchanged until a publisher confirms.</p>`}<div class="field"><label for="cms-image">${esc(t("mediaLibrary"))} · local preview image</label><input type="file" id="cms-image" accept="image/*"><span class="small-note">Selected image previews here only; the prototype has no shared media storage.</span></div><div class="cms-actions"><button class="cms-button" data-save-draft>${esc(t("saveDraft"))}</button><button class="cms-button publish" data-publish ${state.cmsRole !== "publisher" ? "disabled" : ""}>${esc(t("publish"))}</button><button class="cms-button light" data-discard ${!hasDraft ? "disabled" : ""}>${esc(t("discard"))}</button><button class="cms-button light" data-restore ${!(readStore(STORAGE.versions, {})[state.language] || []).length ? "disabled" : ""}>Restore previous version</button></div><div class="cms-status" role="status"></div></div><aside class="cms-preview"><span class="eyebrow">${esc(t("preview"))}</span><div class="cms-preview-card" id="cms-preview-card">${cmsPreview()}</div><img class="cms-upload-preview" alt="Selected media preview" ${state.cmsImage ? `src="${state.cmsImage}"` : "hidden"}><div class="cms-history"><span class="eyebrow">${esc(t("history"))}</span><div id="cms-history-list">${cmsHistory()}</div></div></aside></div></section>`;
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");
    overlay.querySelector("#cms-page").value = state.cmsPage;
    overlay.querySelector("#cms-role").value = state.cmsRole;
    overlay.querySelector(".cms-close").addEventListener("click", cmsClose);
    overlay.addEventListener("click", (event) => { if (event.target === overlay) cmsClose(); });
    overlay.querySelector("#cms-page").addEventListener("change", (event) => { state.cmsPage = event.target.value; state.cmsFields = cmsFields(); renderCms(); });
    overlay.querySelector("#cms-role").addEventListener("change", (event) => { state.cmsRole = event.target.value; renderCms(); });
    overlay.querySelectorAll("[data-cms-field]").forEach((field) => field.addEventListener("input", () => {
      state.cmsFields[field.dataset.cmsField] = field.value;
      overlay.querySelector("#cms-preview-card").innerHTML = cmsPreview(state.cmsFields);
    }));
    overlay.querySelector("#cms-technical-review")?.addEventListener("change", (event) => {
      state.cmsTechnicalReview = event.target.checked;
      overlay.querySelector("#cms-preview-card").innerHTML = cmsPreview(state.cmsFields);
    });
    overlay.querySelector("#cms-image").addEventListener("change", (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => { state.cmsImage = String(reader.result); const image = overlay.querySelector(".cms-upload-preview"); image.src = state.cmsImage; image.hidden = false; };
      reader.readAsDataURL(file);
    });
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
    drafts[state.language][state.cmsPage] = { ...state.cmsFields, savedAt: new Date().toISOString(), technicalReview: state.cmsTechnicalReview };
    if (!writeStore(STORAGE.drafts, drafts)) return;
    recordActivity("Draft saved");
    renderCms();
    document.querySelector(".cms-status").textContent = t("draftSaved");
  }
  function discardCmsDraft() {
    const drafts = readStore(STORAGE.drafts, {});
    if (!drafts[state.language]?.[state.cmsPage]) return;
    delete drafts[state.language][state.cmsPage];
    writeStore(STORAGE.drafts, drafts);
    state.cmsFields = getContent(state.language);
    state.cmsTechnicalReview = false;
    recordActivity("Draft discarded and reset to published version");
    renderCms();
    document.querySelector(".cms-status").textContent = t("discarded");
  }
  function restoreCmsVersion() {
    const snapshot = (readStore(STORAGE.versions, {})[state.language] || [])[0];
    if (!snapshot) return;
    const restored = { ...cmsSeed(), ...snapshot };
    delete restored.publishedAt;
    const drafts = readStore(STORAGE.drafts, {});
    drafts[state.language] ||= {};
    drafts[state.language][state.cmsPage] = { ...restored, savedAt: new Date().toISOString(), technicalReview: false };
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
    const draft = drafts[state.language]?.[state.cmsPage];
    if (!draft) { document.querySelector(".cms-status").textContent = t("noDraft"); return; }
    if (state.cmsPage === "machine" && !draft.technicalReview) { document.querySelector(".cms-status").textContent = t("reviewRequired"); return; }
    if (!window.confirm(t("publishConfirm"))) return;
    const published = readStore(STORAGE.published, {});
    const versions = readStore(STORAGE.versions, {});
    published[state.language] ||= {};
    versions[state.language] ||= [];
    versions[state.language].unshift({ ...published[state.language], publishedAt: new Date().toISOString() });
    published[state.language] = { ...published[state.language], ...draft };
    if (!writeStore(STORAGE.published, published) || !writeStore(STORAGE.versions, versions)) return;
    delete drafts[state.language][state.cmsPage];
    writeStore(STORAGE.drafts, drafts);
    recordActivity("Publisher confirmed public content");
    render();
    renderCms();
    document.querySelector(".cms-status").textContent = t("published");
  }

  // Header navigation, responsive menu and catalogue mega panel.
  navMegamenu();
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".mobile-toggle");
  const setMegaMenu = (open) => {
    megaPanel.classList.toggle("is-open", open);
    megaPanel.setAttribute("aria-hidden", String(!open));
    megaPanel.inert = !open;
  };
  const closeMobileMenu = () => {
    nav.classList.remove("is-open");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "Open navigation");
  };
  matchMedia("(max-width: 800px)").addEventListener("change", () => {
    const focusWasInMenu = nav.contains(document.activeElement) || megaPanel.contains(document.activeElement);
    closeMobileMenu();
    setMegaMenu(false);
    if (focusWasInMenu) {
      if (innerWidth <= 800) menuButton.focus();
      else document.querySelector(".site-header .brand").focus();
    }
  });
  setMegaMenu(false);
  nav.addEventListener("mouseenter", () => { if (innerWidth > 800) setMegaMenu(true); });
  nav.addEventListener("focusin", () => { if (innerWidth > 800) setMegaMenu(true); });
  header.addEventListener("mouseleave", () => { if (!header.contains(document.activeElement)) setMegaMenu(false); });
  header.addEventListener("focusout", (event) => { if (!header.contains(event.relatedTarget)) setMegaMenu(false); });
  document.querySelector(".mobile-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const open = button.getAttribute("aria-expanded") !== "true";
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (event) => { if (event.target.closest("a")) { closeMobileMenu(); setMegaMenu(false); } });
  megaPanel.addEventListener("click", (event) => { if (event.target.closest("a")) setMegaMenu(false); });
  languagePicker.addEventListener("change", () => {
    state.language = languagePicker.value;
    writeStore(STORAGE.language, state.language);
    render();
  });
  window.addEventListener("hashchange", render);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cmsClose();
      if (nav.classList.contains("is-open")) { closeMobileMenu(); menuButton.focus(); }
      if (megaPanel.contains(document.activeElement)) nav.querySelector("a")?.focus();
      setMegaMenu(false);
    }
  });
  document.addEventListener("click", (event) => {
    const motionToggle = event.target.closest("[data-motion-toggle]");
    if (motionToggle) {
      state.motionPaused = !state.motionPaused;
      state.motionOptIn = matchMedia("(prefers-reduced-motion: reduce)").matches && !state.motionPaused;
      writeStore(STORAGE.motion, state.motionPaused);
      syncMotionControls();
    }
    const zoom = event.target.closest("[data-zoom]");
    if (zoom) {
      const image = zoom.closest(".machine-stage")?.querySelector(".machine-photo");
      if (!image) return;
      image.style.transform = zoom.dataset.zoom === "in" ? "scale(1.25)" : "scale(1)";
    }
    const fullscreen = event.target.closest("[data-fullscreen]");
    if (fullscreen) {
      const dialog = document.querySelector(".viewer-dialog");
      const stage = fullscreen.closest(".machine-stage");
      const key = stage?.querySelector("[data-image-key]")?.dataset.imageKey;
      const viewer = dialog.querySelector(".viewer-content");
      fullscreenReturnFocus = fullscreen;
      viewer.innerHTML = key ? assetImage(key, "viewer-image", { loading: "eager", sizes: "90vw" }) : "";
      dialog.showModal();
      dialog.querySelector(".viewer-close").focus();
    }
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
  document.body.appendChild(cmsLauncher);

  if (!location.hash) history.replaceState(null, "", "#home");
  render();
})();
