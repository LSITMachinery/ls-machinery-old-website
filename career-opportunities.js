/* Recruitment source check: 15 October 2026. Indexed listings are not a live availability feed. */
(() => {
  const employer = 'https://malaysia.indeed.com/cmp/Ls-Smart-Machinery-%28m%29-Sdn-Bhd';
  const checkedAt = '2026-10-15';
  const role = (id, name, zh, ms, department, type, url, status, description) => ({
    id, name, titles: { en: name, zh, ms }, department, type, url,
    source: { publisher: 'LS Smart Machinery employer listings on Indeed', url: employer, listing: url },
    checkedAt, verificationStatus: status,
    ...(description ? { description } : {})
  });
  const listed = id => `${employer}/jobs?jk=${id}`;
  window.LS_CAREER_OPPORTUNITIES = [
    role('automation-engineer', 'Automation Engineer', '自动化工程师', 'Jurutera Automasi', 'Engineering', 'Full-time',
      'https://malaysia.indeed.com/viewjob?jk=3c7cc6d24dbbe026', 'indexed-listing-read', {
        en: 'Work with PLC programming, machine interfaces and electrical systems.',
        zh: '参与 PLC 编程、设备界面与电气系统工作。',
        ms: 'Terlibat dalam pengaturcaraan PLC, antara muka mesin dan sistem elektrik.'
      }),
    role('mechanical-engineer', 'Mechanical Engineer', '机械工程师', 'Jurutera Mekanikal', 'Engineering', 'Full-time',
      'https://malaysia.indeed.com/viewjob?jk=114b8ed588ccb0c8', 'indexed-listing-read', {
        en: 'Develop mechanical designs from CAD and prototypes through assembly and documentation.',
        zh: '从 CAD 与原型开始，参与机械设计、装配及技术文件工作。',
        ms: 'Bangunkan reka bentuk mekanikal daripada CAD dan prototaip hingga pemasangan dan dokumentasi.'
      }),
    role('engineering-coordinator', 'Engineering Coordinator', '工程协调员', 'Penyelaras Kejuruteraan', 'Engineering', 'Full-time',
      listed('12795283d01143e0'), 'employer-profile-link-read'),
    role('sales-executive', 'Sales Executive', '销售执行员', 'Eksekutif Jualan', 'Commercial', 'Full-time',
      'https://malaysia.indeed.com/viewjob?jk=954e4544fb340497', 'indexed-listing-read', {
        en: 'Develop machinery enquiries through production discussions, demonstrations and client relationships.',
        zh: '通过生产需求讨论、设备演示及客户关系，推动机械业务咨询。',
        ms: 'Bangunkan pertanyaan mesin melalui perbincangan pengeluaran, demonstrasi dan hubungan pelanggan.'
      }),
    role('sales-development-executive', 'Sales Development Executive', '销售拓展执行员', 'Eksekutif Pembangunan Jualan', 'Commercial', 'Full-time',
      listed('8d999080541d4a32'), 'employer-profile-link-read'),
    role('food-beverage-consultant', 'F&B Consultant', '餐饮顾问', 'Perunding Makanan dan Minuman', 'Commercial', 'Full-time',
      'https://malaysia.indeed.com/viewjob?jk=3fadd47e57f630c3', 'indexed-listing-read', {
        en: 'Discuss food-production needs and support customers with machinery and planning proposals.',
        zh: '了解食品生产需求，为客户提供机械与生产规划建议。',
        ms: 'Bincangkan keperluan pengeluaran makanan dan bantu pelanggan dengan cadangan mesin serta perancangan.'
      }),
    role('marketing-content-executive', 'Marketing Content Executive', '营销内容执行员', 'Eksekutif Kandungan Pemasaran', 'Commercial', 'Full-time',
      'https://malaysia.indeed.com/viewjob?jk=70824d2aedefcae5', 'indexed-listing-read', {
        en: 'Create digital content and support marketing for industrial machinery.',
        zh: '创作数字内容，支持工业机械的市场推广。',
        ms: 'Hasilkan kandungan digital dan sokong pemasaran mesin industri.'
      }),
    role('account-assistant', 'Account Assistant', '会计助理', 'Pembantu Akaun', 'Business support', 'Full-time',
      listed('25e1c67dc8ef489b'), 'employer-profile-link-read'),
    role('human-resources-administration', 'Human Resources Assistant & Administration', '人力资源与行政助理', 'Pembantu Sumber Manusia dan Pentadbiran', 'Business support', 'Full-time',
      'https://malaysia.indeed.com/viewjob?jk=1ae35f63da58d6fd', 'indexed-listing-read', {
        en: 'Support recruitment, employee records, onboarding and day-to-day administration.',
        zh: '协助招聘、员工档案、入职安排及日常行政工作。',
        ms: 'Sokong pengambilan pekerja, rekod kakitangan, orientasi dan pentadbiran harian.'
      }),
    role('automation-internship', 'Automation Engineer — Internship', '自动化工程实习', 'Latihan Industri Kejuruteraan Automasi', 'Internships', 'Internship',
      listed('294ee5ba2f54e6bc'), 'employer-profile-link-read'),
    role('mechanical-internship', 'Mechanical Engineer — Internship', '机械工程实习', 'Latihan Industri Kejuruteraan Mekanikal', 'Internships', 'Internship',
      listed('780b9a50bd5a171b'), 'employer-profile-link-read'),
    role('software-internship', 'Software Engineering — Internship', '软件工程实习', 'Latihan Industri Kejuruteraan Perisian', 'Internships', 'Internship',
      'https://malaysia.indeed.com/viewjob?jk=194b73bb087ef755', 'indexed-listing-read', {
        en: 'Support internal web systems, databases, testing and practical business workflows.',
        zh: '参与内部网站系统、数据库、测试及实际业务流程工作。',
        ms: 'Sokong sistem web dalaman, pangkalan data, ujian dan aliran kerja perniagaan.'
      }),
    role('ai-internship', 'Artificial Intelligence (AI) Engineer — Internship', '人工智能工程实习', 'Latihan Industri Kejuruteraan Kecerdasan Buatan', 'Internships', 'Internship',
      listed('f1439892b6955f60'), 'employer-profile-link-read'),
    role('human-resource-internship', 'Human Resource — Internship', '人力资源实习', 'Latihan Industri Sumber Manusia', 'Internships', 'Internship',
      'https://malaysia.indeed.com/viewjob?jk=ac4568fd64590d6c', 'indexed-listing-read', {
        en: 'Support recruitment content, candidate engagement and interview coordination.',
        zh: '协助招聘内容、候选人沟通及面试安排。',
        ms: 'Sokong kandungan pengambilan pekerja, komunikasi calon dan penyelarasan temu duga.'
      })
  ];
})();
