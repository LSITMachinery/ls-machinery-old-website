const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..", "cms", "public");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "cms.js"), "utf8");
assert.match(html, /<html lang="en">/);
assert.match(html, /<select id="ui-language" aria-label="Interface language">/);
for (const label of ["界面语言", "Bahasa antara muka", "员工登录", "Log masuk kakitangan", "工作邮箱", "E-mel kerja", "密码短语", "Frasa laluan"]) {
  assert.ok(script.includes(label), `CMS interface translation should include ${label}`);
}
console.log("PASS: CMS interface labels and sign-in terms are present in English, Simplified Chinese and Malaysian Malay.");