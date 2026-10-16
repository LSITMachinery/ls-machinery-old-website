/* Product copy recovered from published LS backup records. Sources are internal
   editorial metadata, not public outbound links. Numerical data is assigned only
   where the source explicitly identifies the catalogue model. Template artefacts,
   duplicated food lists, performance superlatives and unreviewed videos are omitted. */
(() => {
  const text = (en, zh, ms) => ({ en, zh, ms });
  const feature = (en, zh, ms, bodyEn, bodyZh, bodyMs) => ({ title: text(en, zh, ms), body: text(bodyEn, bodyZh, bodyMs) });
  const record = (intro, features, applications, source, extra = {}) => ({ intro, features, applications, specs: [], source, ...extra });
  const source = (id, slug) => `Read-only LS backup database.sql; published post ${id}; ${slug}`;
  window.LS_MACHINE_CONTENT = {
    "Mini Cookie Depositor (MCD)": record(
      text("Deposit cookie dough onto trays with the LSF-502-MCD. Recipe memory and interchangeable nozzles support a range of piped cookie shapes, from spiral and drop cookies to longer forms.", "LSF-502-MCD 将饼干面团挤注到烤盘上。配方记忆与可更换花嘴适用于螺旋饼干、挤花饼干及长条等不同造型。", "Depositkan doh kuki ke atas dulang dengan LSF-502-MCD. Memori resipi dan muncung boleh tukar menyokong pelbagai bentuk kuki, termasuk lingkaran, kuki titis dan bentuk memanjang."),
      [feature("Recipe memory", "配方记忆", "Memori resipi", "Store recipe settings for repeat production runs.", "储存配方设定，供重复生产时使用。", "Simpan tetapan resipi untuk pengeluaran berulang."), feature("Cookie shapes", "饼干造型", "Bentuk kuki", "Change nozzles to work with different deposited cookie shapes.", "更换花嘴，以制作不同挤注造型。", "Tukar muncung untuk menghasilkan bentuk kuki yang berbeza."), feature("Tabletop construction", "台式结构", "Binaan atas meja", "Food-grade stainless steel construction in a tabletop format.", "采用食品级不锈钢台式结构。", "Binaan keluli tahan karat gred makanan dalam format atas meja.")],
      ["Cookies & Biscuits"], source(3083, "mini-cookies-depositor-compact-baking-machine-machine-profile") + "; specifications: published post 5163, blog-bake-more-earn-more",
      { model: "LSF-502-MCD", specs: [
        { label: text("Model", "型号", "Model"), value: "LSF-502-MCD" },
        { label: text("Dimensions", "尺寸", "Dimensi"), value: "704 × 890 × 720 mm" },
        { label: text("Published output", "公布产量", "Output diterbitkan"), value: "90 trays/hour" },
        { label: text("Electrical supply", "电源", "Bekalan elektrik"), value: "240 V / 1 phase / 50 Hz" },
        { label: text("Weight", "重量", "Berat"), value: "150 kg" }
      ] }
    ),
    "Mini Cookie Wire Cut (MCWC)": record(
      text("The LSF-502-MCWC combines depositing and wire cutting for cookie production. It is intended for cookie recipes that are formed through a die and separated by a cutting wire.", "LSF-502-MCWC 结合挤注与钢丝切割，用于饼干生产。适用于通过模头成型，再由钢丝分切的饼干配方。", "LSF-502-MCWC menggabungkan pendepositan dan pemotongan dawai untuk pengeluaran kuki. Ia digunakan bagi resipi kuki yang dibentuk melalui acuan dan dipisahkan dengan dawai pemotong."),
      [feature("Deposit and cut", "挤注与切割", "Deposit dan potong", "Combine depositing and wire cutting in the cookie-forming stage.", "在饼干成型工序中结合挤注与钢丝切割。", "Gabungkan pendepositan dan pemotongan dawai dalam peringkat pembentukan kuki."), feature("Recipe review", "配方评估", "Semakan resipi", "Discuss the dough, inclusions and intended cookie dimensions when selecting a configuration.", "选择配置时，可讨论面团、添加物及所需饼干尺寸。", "Bincangkan doh, bahan tambahan dan dimensi kuki semasa memilih konfigurasi.")],
      ["Cookies & Biscuits"], source(7039, "mini-wire-cut-cookies-depositor-compact-baking-machine-machine-profile"), { model: "LSF-502-MCWC" }
    ),
    "Mini Cake Depositor (MCAD)": record(
      text("The Mini Cake Depositor portions soft cake batter into trays or moulds. Programmable settings and selectable nozzles support sponge cakes, cupcakes and layered desserts.", "迷你蛋糕注料机将柔软蛋糕面糊定量注入烤盘或模具。可编程设定及不同注料花嘴适用于海绵蛋糕、杯子蛋糕与分层甜品。", "Mini Cake Depositor membahagikan adunan kek lembut ke dalam dulang atau acuan. Tetapan boleh program dan pilihan muncung menyokong kek span, kek cawan dan pencuci mulut berlapis."),
      [feature("Soft-batter depositing", "柔软面糊注料", "Pendepositan adunan lembut", "Designed for cake-batter depositing rather than wire-cut cookie forming.", "用于蛋糕面糊注料，与钢丝切割饼干成型的工序不同。", "Direka untuk mendeposit adunan kek, berbeza daripada pembentukan kuki potong dawai."), feature("Portion settings", "份量设定", "Tetapan bahagian", "Programmable settings control the depositing process for the selected product.", "通过可编程设定控制所选产品的注料流程。", "Tetapan boleh program mengawal proses pendepositan untuk produk yang dipilih."), feature("Nozzle selection", "花嘴选择", "Pilihan muncung", "Select depositing nozzles around the batter and mould arrangement.", "根据面糊及模具排列选择注料花嘴。", "Pilih muncung mengikut adunan dan susunan acuan.")],
      ["Cakes"], source(6184, "mini-cake-depositor-compact-baking-machine-machine-profile") + "; published post 5288, mini-cake-depositor-mcad"
    ),
    "Planetary Mixer": record(
      text("Prepare dough, cream, batter and fillings with planetary mixing. A versatile preparation stage for cookies, cakes and other bakery products.", "以行星式搅拌准备面团、奶油、面糊与馅料，为饼干、蛋糕及其他烘焙产品提供多种搅拌应用。", "Sediakan doh, krim, adunan cair dan inti melalui pengadunan planet. Satu peringkat penyediaan serba guna untuk kuki, kek dan produk bakeri lain."),
      [feature("Different mixtures", "多种搅拌物料", "Pelbagai campuran", "Work with dough, cream, batter and fillings at the preparation stage.", "在准备工序中搅拌面团、奶油、面糊及馅料。", "Adun doh, krim, adunan cair dan inti pada peringkat penyediaan."), feature("Stainless steel construction", "不锈钢结构", "Binaan keluli tahan karat", "Stainless steel construction for food-production use.", "采用适用于食品生产的不锈钢结构。", "Binaan keluli tahan karat untuk pengeluaran makanan.")],
      ["Cookies & Biscuits", "Cakes"], source(5455, "machine-planetary-mixer")
    ),
    "Spiral Mixer": record(
      text("Develop bread, pizza and pastry dough through spiral mixing. Dual-speed control provides two mixing settings for the dough-preparation process.", "通过螺旋式搅拌准备面包、披萨及糕点面团。双速控制为面团准备流程提供两档搅拌设定。", "Sediakan doh roti, piza dan pastri melalui pengadunan lingkaran. Kawalan dua kelajuan menyediakan dua tetapan pengadunan untuk proses penyediaan doh."),
      [feature("Dough mixing", "面团搅拌", "Pengadunan doh", "Prepare bread, pizza and pastry dough.", "准备面包、披萨与糕点面团。", "Sediakan doh roti, piza dan pastri."), feature("Dual-speed control", "双速控制", "Kawalan dua kelajuan", "Select between two mixing speeds.", "在两档搅拌速度之间进行选择。", "Pilih antara dua kelajuan pengadunan.")],
      ["Bread & Buns", "Pastries & Crusted Foods"], source(5509, "machine-spiral-mixer")
    ),
    "Horizontal Mixer": record(
      text("Mix dough and fillings with a horizontal agitator, controlled drive and tilting bowl. Applications include bread, steamed buns, man tou and chapati.", "以卧式搅拌器、可控驱动及翻转搅拌缸准备面团与馅料，应用包括面包、包子、馒头及 chapati。", "Adun doh dan inti dengan pengacau mendatar, pemacu terkawal dan mangkuk boleh condong. Aplikasi termasuk roti, pau, man tou dan capati."),
      [feature("Controlled mixing", "搅拌控制", "Pengadunan terkawal", "A VFD-controlled direct drive and PLC system manage mixing and recipe settings.", "变频直驱与 PLC 系统用于管理搅拌及配方设定。", "Pemacu terus terkawal VFD dan sistem PLC mengurus pengadunan serta tetapan resipi."), feature("Bowl handling", "搅拌缸操作", "Pengendalian mangkuk", "A tilting bowl and bowl-lift system support dough transfer.", "可翻转搅拌缸及提升系统配合面团转移。", "Mangkuk boleh condong dan sistem pengangkat membantu pemindahan doh."), feature("Cooling jacket", "冷却夹套", "Jaket penyejukan", "A cooling jacket surrounds the mixing bowl.", "搅拌缸设有冷却夹套。", "Jaket penyejukan mengelilingi mangkuk pengadunan.")],
      ["Bread & Buns", "Kueh & Asian Foods", "Dim Sum"], source(7017, "horizontal-mixer-machine-profile")
    ),
    "Continuous Dough Divider Rounder": record(
      text("Combine dividing and rounding in one dough-preparation stage. Automatic feeding, volumetric portioning and a rounding drum prepare dough for bread, buns, pizza and related products.", "将面团分割与滚圆结合为一道准备工序，以自动进料、容积分割及滚圆鼓准备面包、餐包、披萨等产品的面团。", "Gabungkan pembahagian dan pembulatan dalam satu peringkat penyediaan doh. Suapan automatik, pembahagian volumetrik dan dram pembulat menyediakan doh roti, bun, piza dan produk berkaitan."),
      [feature("Automatic feeding", "自动进料", "Suapan automatik", "Feeds dough into the dividing and rounding process.", "将面团送入分割与滚圆工序。", "Menyalurkan doh ke dalam proses pembahagian dan pembulatan."), feature("Portioning and rounding", "分割与滚圆", "Pembahagian dan pembulatan", "Combine volumetric dividing with a rounding drum.", "结合容积分割与滚圆鼓。", "Gabungkan pembahagian volumetrik dengan dram pembulat.")],
      ["Bread & Buns", "Pastries & Crusted Foods", "Kueh & Asian Foods"], source(5452, "machine-continuous-dough-divider-rounder")
    ),
    "Molder": record(
      text("Shape dough for loaves and baguettes through a rolling and moulding stage. Adjust length and thickness to suit the intended bread format.", "通过滚压与成型工序将面团制成吐司及法棍等形状，并根据所需面包规格调整长度与厚度。", "Bentuk doh untuk roti buku dan baguette melalui peringkat penggelek dan pembentukan. Laraskan panjang serta ketebalan mengikut format roti yang dirancang."),
      [feature("Shape adjustment", "造型调整", "Pelarasan bentuk", "Adjust length and thickness around the intended bread format.", "根据所需面包形状调整长度与厚度。", "Laraskan panjang dan ketebalan mengikut bentuk roti yang dirancang.")],
      ["Bread & Buns"], source(5486, "machine-long-moulder")
    ),
    "Retarder Proofer": record(
      text("Bring cold holding and dough fermentation into one unit. A retarder proofer supports overnight or delayed proofing as part of a planned bakery schedule.", "将低温保存与面团发酵结合于一台设备。冷藏醒发箱可配合烘焙排程进行隔夜或延后醒发。", "Gabungkan penyimpanan sejuk dan fermentasi doh dalam satu unit. Retarder proofer menyokong pemerapan semalaman atau tertangguh sebagai sebahagian jadual bakeri."),
      [feature("Cold holding and proofing", "冷藏与醒发", "Penyimpanan sejuk dan pemerapan", "Coordinate cold storage and fermentation within one system.", "在同一系统内协调低温保存与发酵。", "Selaraskan penyimpanan sejuk dan fermentasi dalam satu sistem."), feature("Temperature control", "温度控制", "Kawalan suhu", "Temperature settings help coordinate the dough-preparation process.", "温度设定用于配合面团准备流程。", "Tetapan suhu membantu menyelaraskan proses penyediaan doh.")],
      ["Bread & Buns", "Pastries & Crusted Foods"], source(5448, "machine-retarder-proofer")
    ),
    "Proofer": record(
      text("Control temperature and humidity during dough fermentation. Digital settings help manage the proofing stage for bread, buns and pastries.", "在面团发酵期间控制温度与湿度，通过数码设定管理面包、餐包及糕点的醒发工序。", "Kawal suhu dan kelembapan semasa fermentasi doh. Tetapan digital membantu mengurus peringkat pemerapan roti, bun dan pastri."),
      [feature("Proofing conditions", "醒发条件", "Keadaan pemerapan", "Temperature and humidity controls manage the proofing environment.", "通过温湿度控制管理醒发环境。", "Kawalan suhu dan kelembapan mengurus persekitaran pemerapan.")],
      ["Bread & Buns", "Pastries & Crusted Foods"], source(5456, "machine-digital-proofer")
    ),
    "Proofer Room": record(
      text("A dedicated walk-in environment for dough proofing. Adjustable temperature and humidity support the preparation of bread, buns and pastries.", "专用的步入式面团醒发空间，通过可调温湿度配合面包、餐包与糕点的准备流程。", "Ruang masuk khusus untuk pemerapan doh. Suhu dan kelembapan boleh laras menyokong penyediaan roti, bun dan pastri."),
      [feature("Walk-in layout", "步入式布局", "Susun atur ruang masuk", "The room format places proofing within a dedicated production area.", "醒发房形式为生产提供专用醒发区域。", "Format bilik menyediakan kawasan khusus untuk pemerapan dalam pengeluaran."), feature("Environment settings", "环境设定", "Tetapan persekitaran", "Adjust temperature and humidity for the intended proofing process.", "根据所需醒发流程调整温度与湿度。", "Laraskan suhu dan kelembapan mengikut proses pemerapan yang dirancang.")],
      ["Bread & Buns", "Pastries & Crusted Foods"], source(5457, "machine-proofer-room")
    ),
    "Convection Oven (Gas/Electric Heating)": record(
      text("Bake pastries, bread and cookies with circulating hot air. Choose gas or electric heating around the production process, tray arrangement and available utilities.", "以循环热风烘烤糕点、面包及饼干，根据生产流程、烤盘安排及可用能源选择燃气或电热方式。", "Bakar pastri, roti dan kuki dengan udara panas beredar. Pilih pemanasan gas atau elektrik mengikut proses pengeluaran, susunan dulang dan utiliti yang tersedia."),
      [feature("Air circulation", "热风循环", "Peredaran udara", "Circulating airflow moves heat through the baking chamber.", "循环气流将热量带入烘烤室。", "Aliran udara beredar membawa haba melalui ruang pembakaran."), feature("Heating options", "加热选项", "Pilihan pemanasan", "Select gas or electric heating.", "可选择燃气或电热方式。", "Pilih pemanasan gas atau elektrik.")],
      ["Cookies & Biscuits", "Bread & Buns", "Pastries & Crusted Foods"], source(5474, "machine-convection-oven")
    ),
    "Rotary Oven (Gas/Electric/Diser Heating)": record(
      text("Bake bread, cakes and pastries with a rotating rack and steam injection. Rack movement forms part of the oven's heat-distribution process.", "以旋转烤架及蒸汽喷射烘烤面包、蛋糕与糕点，烤架转动配合炉内热量分布。", "Bakar roti, kek dan pastri dengan rak berputar serta suntikan wap. Pergerakan rak menjadi sebahagian proses pengagihan haba ketuhar."),
      [feature("Rotating rack", "旋转烤架", "Rak berputar", "The rack rotates during baking.", "烤架在烘烤过程中旋转。", "Rak berputar semasa pembakaran."), feature("Steam injection", "蒸汽喷射", "Suntikan wap", "Steam injection forms part of the baking process.", "蒸汽喷射配合烘烤流程。", "Suntikan wap menjadi sebahagian proses pembakaran.")],
      ["Bread & Buns", "Cakes", "Pastries & Crusted Foods"], source(5508, "machine-rotary-oven")
    ),
    "Mini Rotary Convention Oven (Gas/Electric Heating)": record(
      text("Circulating heat and a steam function support the baking of bread, cakes and pastries. Plan the heating option and baking arrangement around your product range.", "以热风循环与蒸汽功能烘烤面包、蛋糕及糕点，根据产品范围规划加热方式与烘烤安排。", "Peredaran haba dan fungsi wap menyokong pembakaran roti, kek dan pastri. Rancang pilihan pemanasan serta susunan pembakaran mengikut rangkaian produk anda."),
      [feature("Heat circulation", "热风循环", "Peredaran haba", "Circulating heat moves through the oven during baking.", "烘烤期间采用热风循环。", "Haba beredar melalui ketuhar semasa pembakaran."), feature("Steam function", "蒸汽功能", "Fungsi wap", "Apply steam as part of the baking process.", "通过蒸汽功能配合烘烤流程。", "Gunakan wap sebagai sebahagian proses pembakaran.")],
      ["Bread & Buns", "Cakes", "Pastries & Crusted Foods"], source(5478, "machine-mini-rotary-oven")
    ),
    "Hybrid Tunnel Oven (LPG/NPG/Electric Heating System)": record(
      text("Move products through a continuous baking process with adjustable baking zones and conveyor speed. Select gas, electric or hybrid heating around the planned production line.", "通过可调烘烤区及输送速度进行连续烘烤，根据生产线规划选择燃气、电热或混合加热方式。", "Gerakkan produk melalui proses pembakaran berterusan dengan zon pembakaran dan kelajuan penghantar boleh laras. Pilih pemanasan gas, elektrik atau hibrid mengikut barisan pengeluaran yang dirancang."),
      [feature("Baking zones", "烘烤区", "Zon pembakaran", "Adjust baking zones along the product travel path.", "沿产品输送路径调整烘烤区。", "Laraskan zon pembakaran sepanjang laluan produk."), feature("Conveyor speed", "输送速度", "Kelajuan penghantar", "Conveyor-speed adjustment controls travel through the oven.", "调整输送速度以控制产品通过烤炉的过程。", "Pelarasan kelajuan penghantar mengawal perjalanan melalui ketuhar.")],
      ["Cookies & Biscuits", "Bread & Buns", "Pastries & Crusted Foods"], source(5479, "machine-tunnel-oven")
    ),
    "Cake Cutter": record(
      text("Portion round, square and layered cakes with adjustable cutting sizes. Applications include cakes, Swiss rolls and kek lapis.", "以可调切割尺寸为圆形、方形及分层蛋糕分份，应用包括蛋糕、瑞士卷及千层蛋糕。", "Bahagikan kek bulat, persegi dan berlapis dengan saiz potongan boleh laras. Aplikasi termasuk kek, gulung Swiss dan kek lapis."),
      [feature("Adjustable portions", "可调份量", "Bahagian boleh laras", "Set the cutting size around the intended cake format.", "根据所需蛋糕形状设定切割尺寸。", "Tetapkan saiz potongan mengikut format kek yang dirancang.")],
      ["Cakes"], source(5467, "machine-cake-cutter")
    ),
    "Steamer": record(
      text("Steam buns, dim sum and traditional foods with temperature control and automatic water refill. Stainless steel construction forms the food-production equipment body.", "通过温度控制及自动补水蒸制包子、点心与传统食品，设备主体采用不锈钢结构。", "Kukus pau, dim sum dan makanan tradisional dengan kawalan suhu serta isian semula air automatik. Badan peralatan pengeluaran makanan menggunakan binaan keluli tahan karat."),
      [feature("Temperature control", "温度控制", "Kawalan suhu", "Set temperature for the steaming process.", "设定蒸制工序的温度。", "Tetapkan suhu untuk proses pengukusan."), feature("Automatic water refill", "自动补水", "Isian semula air automatik", "Automatic refill supplies water during operation.", "自动补水功能在运行期间供水。", "Isian semula automatik membekalkan air semasa operasi.")],
      ["Dim Sum", "Kueh & Asian Foods"], source(5451, "machine-automatic-gas-steamer")
    ),
    "Dough Encrusting Machine": record(
      text("Form dough around fillings for cookies, kueh and other filled products. Explore applications such as pineapple tarts, filled cookies, mochi, ondeh-ondeh and ang ku kueh.", "将面团包覆馅料，制作饼干、糕点及其他包馅食品，应用包括黄梨酥、夹心饼干、麻薯、ondeh-ondeh 及红龟粿。", "Bentuk doh di sekeliling inti untuk kuki, kuih dan produk berinti lain. Terokai aplikasi seperti tart nanas, kuki berinti, mochi, ondeh-ondeh dan ang ku kuih."),
      [feature("Filled products", "包馅产品", "Produk berinti", "Explore filled cookies and traditional kueh recipes.", "探索夹心饼干及传统糕点配方。", "Terokai resipi kuki berinti dan kuih tradisional."), feature("Dough and filling review", "面团与馅料评估", "Semakan doh dan inti", "Review dough, filling and intended appearance when defining the production process.", "确定生产流程时，可评估面团、馅料及所需外观。", "Semak doh, inti dan rupa produk yang dirancang semasa menentukan proses pengeluaran.")],
      ["Cookies & Biscuits", "Kueh & Asian Foods"], source(7112, "multipurpose-encrusting-machine-machine-profile")
    ),
    "Sheet Forming Encrusting & Molding Machine": record(
      text("Combine dough sheeting, filling, rolling and forming for filled bread and pastry products. Applications include pau, sweet buns, siew pau and egg-yolk pastries.", "结合面团压片、注馅、卷制与成型，制作包馅面包及糕点，应用包括包子、甜面包、烧包及蛋黄酥。", "Gabungkan pelembaraan doh, pengisian, penggulungan dan pembentukan untuk roti serta pastri berinti. Aplikasi termasuk pau, bun manis, siew pau dan pastri kuning telur."),
      [feature("Connected forming stages", "连续成型工序", "Peringkat pembentukan bersambung", "Combine sheeting, rolling and cutting around the filled product.", "结合压片、卷制及切割来制作包馅产品。", "Gabungkan pelembaraan, penggulungan dan pemotongan produk berinti."), feature("Bread and pastry applications", "面包与糕点应用", "Aplikasi roti dan pastri", "Prepare steamed buns, sweet buns and egg-yolk pastries.", "制作包子、甜面包及蛋黄酥。", "Sediakan pau, bun manis dan pastri kuning telur.")],
      ["Bread & Buns", "Pastries & Crusted Foods", "Dim Sum"], source(5442, "machine-automatic-encrusting-moulding-machine") + "; workflow: published post 6830, why-the-lsf-180l-is-a-smart-production-upgrade-blog"
    ),
    "Horizontal Pillow Pack Packaging Machine": record(
      text("Wrap and seal bakery, snack and frozen products in a horizontal pillow-packaging process. Plan product feeding and pack presentation as part of the final production stage.", "以卧式枕式包装流程包膜并封装烘焙、零食及冷冻产品，将产品进料与包装呈现纳入最终生产工序规划。", "Balut dan kedap produk bakeri, snek dan sejuk beku melalui proses pembungkusan bantal mendatar. Rancang suapan produk dan persembahan pek sebagai sebahagian peringkat akhir pengeluaran."),
      [feature("Wrapping and sealing", "包膜与封口", "Pembalutan dan pengedapan", "Bring product feeding, wrapping and sealing into the packaging-stage discussion.", "规划包装工序时，可一并讨论产品进料、包膜及封口。", "Bincangkan suapan produk, pembalutan dan pengedapan semasa merancang peringkat pembungkusan.")],
      [], source(5480, "machine-reciprocating-servo-pillow-packaging-machine")
    ),
    "Blast Freezer": record(
      text("Bring blast freezing into the production process for croissants, pizza dough and curry puffs. Coordinate product preparation, freezing and cold storage as a connected workflow.", "将急冻工序纳入牛角包、披萨面团及咖喱角等产品的生产流程，协调产品准备、急冻及冷藏储存。", "Gabungkan pembekuan pantas dalam proses pengeluaran croissant, doh piza dan karipap. Selaraskan penyediaan produk, pembekuan dan penyimpanan sejuk sebagai aliran kerja bersambung."),
      [feature("Freezing stage", "冷冻工序", "Peringkat pembekuan", "Plan the freezing stage around the product, preparation process and storage workflow.", "根据产品、准备流程及储存工作流安排冷冻工序。", "Rancang peringkat pembekuan mengikut produk, proses penyediaan dan aliran penyimpanan.")],
      ["Pastries & Crusted Foods", "Bread & Buns"], source(5512, "machine-blast-freezer")
    )
  };
})();
