// Initial catalogue data transcribed from the user-provided machinery extract.
// Names marked confirmWithLS should be checked before they appear publicly.
window.LS_CATALOGUE = {
  source: "User-provided LS Smart Machinery machinery list extract",
  categories: [
    {
      name: "Bakery",
      featuredCandidates: [
        "Mini Cookie Depositor (MCD)",
        "Mini Cookie Wire Cut (MCWC)",
        "Mini Cake Depositor (MCAD)",
        "Dough Sheeter (Freeway)",
        "Dough Encrusting Machine"
      ],
      subcategories: [
        {
          name: "Mixer",
          items: [
            { name: "Planetary Mixer" },
            { name: "Spiral Mixer" },
            { name: "Horizontal Mixer" }
          ]
        },
        {
          name: "Depositor Series",
          items: [
            { name: "Mini Cookie Depositor (MCD)" },
            { name: "Mini Cookie Wire Cut (MCWC)" },
            { name: "Mini Cake Depositor (MCAD)" },
            {
              name: "Industri Cookies/Cakes Depositor",
              confirmWithLS: "Confirm the supplied spelling and product name."
            }
          ]
        },
        {
          name: "Dough Forming",
          items: [
            { name: "Dough Sheeter (Freeway)" },
            { name: "Donuts Maker (Krono)" },
            { name: "Dough Divider" },
            { name: "Dough Rounder" },
            { name: "Continuous Dough Divider Rounder" },
            { name: "Molder" }
          ]
        },
        {
          name: "Encrusting Series",
          items: [
            { name: "Dough Encrusting Machine" },
            { name: "Sheet Forming Encrusting & Molding Machine" },
            { name: "Trays Arranger Machine" },
            { name: "Rounding Machine" }
          ]
        },
        {
          name: "Fermentation",
          items: [
            { name: "Proofer" },
            { name: "Retarder Proofer" },
            { name: "Roll-In Proofer" },
            { name: "Proofer Room" }
          ]
        },
        {
          name: "Oven",
          items: [
            { name: "Hybrid Tunnel Oven (LPG/NPG/Electric Heating System)" },
            { name: "Deck Oven (Gas/Electric Heating)" },
            { name: "Convection Oven (Gas/Electric Heating)" },
            {
              name: "Rotary Oven (Gas/Electric/Diser Heating)",
              confirmWithLS: "Confirm the supplied term 'Diser Heating'."
            },
            {
              name: "Mini Rotary Convention Oven (Gas/Electric Heating)",
              confirmWithLS: "Confirm the supplied oven name, including 'Convention'."
            }
          ]
        },
        {
          name: "Cutting",
          items: [
            { name: "Horizontal Cutter" },
            { name: "Cake Cutter" },
            {
              name: "Ultrasound SoundCake Cutter",
              confirmWithLS: "Confirm the supplied product name."
            }
          ]
        },
        {
          name: "Cakes Finishing",
          items: [
            { name: "Cakes Cream Coating" },
            { name: "Cream Puffs Injector" },
            { name: "Chocolate Coating" }
          ]
        }
      ]
    },
    {
      name: "Kitchen",
      featuredCandidates: [
        "Combi Oven (Laynox)",
        "Heavy Duty Robot Cooker Machine",
        "Steamer",
        "Deep Fryer System",
        "Dim Sum Maker"
      ],
      items: [
        {
          name: "Combi Oven (Laynox)",
          confirmWithLS: "Confirm the supplied brand spelling 'Laynox'."
        },
        { name: "Heavy Duty Robot Cooker Machine" },
        { name: "Cooker Mixer" },
        { name: "Steamer" },
        { name: "Deep Fryer System" },
        { name: "Emulsifier" },
        { name: "Vegetable Cutter Machine" },
        { name: "Meat Cutter" },
        { name: "Bowl Cutter" },
        { name: "Fish Ball/Cakes Maker" },
        { name: "Dim Sum Maker" }
      ]
    },
    {
      name: "Package",
      featuredCandidates: [
        "Horizontal Pillow Pack Packaging Machine",
        "Horizontal Pillow Pack Box Motion Packaging Machine",
        "Vertical Box Motion Packaging Machine",
        "Sauces/Filling Package Machine",
        "Vacuum Packaging Machines"
      ],
      items: [
        { name: "Horizontal Pillow Pack Packaging Machine" },
        { name: "Horizontal Pillow Pack Box Motion Packaging Machine" },
        { name: "Vertical Box Motion Packaging Machine" },
        { name: "Powder Vertical Packaging Machine" },
        { name: "Sauces/Filling Package Machine" },
        { name: "Computerized Multihead Weigher of Packing Machine with Plain Surface" },
        { name: "Vacuum Packaging Machines" }
      ]
    },
    {
      name: "Refrigeration Series",
      featuredCandidates: [
        "Blast Freezer",
        "Tunnel Blast Freezer",
        "Nitrogen Blast Freezer System",
        "Upright Freezer/Chiller",
        "Counter Freezer/Chiller"
      ],
      items: [
        { name: "Blast Freezer" },
        { name: "Tunnel Blast Freezer" },
        { name: "Nitrogen Blast Freezer System" },
        { name: "Upright Freezer/Chiller" },
        { name: "Counter Freezer/Chiller" }
      ]
    },
    {
      name: "Production Line",
      featuredCandidates: [
        "Puff Pastry Make-Up Line (Freeway)",
        "Pizza Base Make-Up Line (Freeway)",
        "Toast/Burger Buns Production Line",
        "Cookies/Cream Crackers Production Line",
        "Cakes Production Line"
      ],
      items: [
        { name: "Puff Pastry Make-Up Line (Freeway)" },
        { name: "Pizza Base Make-Up Line (Freeway)" },
        { name: "Toast/Burger Buns Production Line" },
        { name: "Cookies/Cream Crackers Production Line" },
        { name: "Cakes Production Line" },
        {
          name: "Breadcrumbs",
          confirmWithLS: "Confirm whether this entry names a production line or a product."
        }
      ]
    }
  ],
  foodGroups: [
    "Cookies & Biscuits",
    "Cakes",
    "Bread & Buns",
    "Pastries & Crusted Foods",
    "Kueh & Asian Foods",
    "Dim Sum"
  ],
  // Starting points for discussion; LS confirms suitability. Names must match catalogue entries.
  segmentRecommendations: {
    "Micro & Startup Businesses": [
      { name: "Planetary Mixer", reason: { en: "If mixing is part of your plan, compare the ingredients, batch size and available space with LS.", zh: "若计划包含搅拌工序，可与 LS 讨论原料、批量及可用空间。", ms: "Jika proses anda memerlukan pengadunan, bincangkan ramuan, saiz kelompok dan ruang dengan LS." } },
      { name: "Mini Cookie Depositor (MCD)", reason: { en: "For a cookie range, discuss dough, product size and the MCD configuration with LS.", zh: "若计划生产饼干，可与 LS 讨论面团、产品尺寸及 MCD 配置。", ms: "Untuk rangkaian kuki, bincangkan doh, saiz produk dan konfigurasi MCD dengan LS." } },
      { name: "Mini Cookie Wire Cut (MCWC)", reason: { en: "For wire-cut cookies, share your dough and product dimensions so LS can review the model fit.", zh: "若计划制作钢丝切割成型饼干，请提供面团与产品尺寸，供 LS 评估型号适用性。", ms: "Untuk kuki potong dawai, kongsikan doh dan dimensi produk supaya LS boleh menyemak kesesuaian model." } },
      { name: "Convection Oven (Gas/Electric Heating)", reason: { en: "If baking is part of your process, confirm the oven size, heating option and utilities with LS.", zh: "若流程包含烘烤，请与 LS 确认烤炉尺寸、加热方式及公用设施。", ms: "Jika proses anda merangkumi pembakaran, sahkan saiz ketuhar, pilihan pemanasan dan utiliti dengan LS." } }
    ],
    "SMEs & Expanding Manufacturers": [
      { name: "Spiral Mixer", reason: { en: "If mixing is a bottleneck, compare your current batches and dough requirements with LS.", zh: "若搅拌是生产瓶颈，可与 LS 对照现有批量及面团需求。", ms: "Jika pengadunan menjadi kesesakan proses, bandingkan kelompok semasa dan keperluan doh dengan LS." } },
      { name: "Dough Divider", reason: { en: "Review portioning as one step in the current line and identify the handoff that needs attention.", zh: "将面团分割作为现有生产线的一环进行评估，并找出需要改善的衔接步骤。", ms: "Nilai pembahagian doh sebagai satu langkah dalam barisan semasa dan kenal pasti serahan proses yang perlu diberi perhatian." } },
      { name: "Retarder Proofer", reason: { en: "Discuss how proofing fits your schedule, recipe and production workflow.", zh: "讨论醒发流程如何配合您的排程、配方及生产工作流。", ms: "Bincangkan cara pemerapan menepati jadual, resipi dan aliran kerja pengeluaran anda." } },
      { name: "Cookies/Cream Crackers Production Line", reason: { en: "For a line review, map the product stages, existing equipment and integration points with LS.", zh: "若要评估生产线，可与 LS 梳理产品工序、现有设备及整合节点。", ms: "Untuk semakan barisan, petakan peringkat produk, peralatan sedia ada dan titik integrasi bersama LS." } }
    ],
    "Large & Mega Enterprises": [
      { name: "Continuous Dough Divider Rounder", reason: { en: "Review interfaces, recipe changes and downstream equipment across the dividing and rounding process.", zh: "评估分割与滚圆流程中的设备接口、配方切换及下游设备。", ms: "Semak antara muka, perubahan resipi dan peralatan hiliran dalam proses membahagi dan membulatkan doh." } },
      { name: "Horizontal Mixer", reason: { en: "Bring batch requirements, recipe range and line connections into the integration discussion.", zh: "在整合讨论中纳入批量需求、配方范围及生产线连接。", ms: "Bawa keperluan kelompok, julat resipi dan sambungan barisan ke dalam perbincangan integrasi." } },
      { name: "Cookies/Cream Crackers Production Line", reason: { en: "Map the full process and interfaces with upstream preparation, packaging and site services.", zh: "梳理完整流程，以及与前段准备、包装和厂务的接口。", ms: "Petakan keseluruhan proses dan antara muka dengan penyediaan huluan, pembungkusan dan perkhidmatan tapak." } },
      { name: "Horizontal Pillow Pack Packaging Machine", reason: { en: "Discuss product presentation, pack requirements and links to the surrounding line.", zh: "讨论产品呈现方式、包装要求及与周边生产线的衔接。", ms: "Bincangkan persembahan produk, keperluan pek dan sambungan dengan barisan sekeliling." } }
    ]
  },
  businessSegments: [
    "Micro & Startup Businesses",
    "SMEs & Expanding Manufacturers",
    "Large & Mega Enterprises"
  ]
};
