/**
 * 资产与数据一致性回归（无需构建，Node 18+）
 * 用法：node tools/verify-assets.cjs   （在仓库任意目录执行均可）
 *
 * 检查：
 *  1. THEME_ORDER 20 个主题、每主题 4 热点 / 3 题 / 4 配对 / 3 故事
 *  2. 热点 id 必须为 h1~h4（配音文件名依赖）
 *  3. 每题有且仅有一个正确选项
 *  4. 20 张封面齐全且单张 <= 70 KB
 *  5. 226 个配音键（20×11 + 6 音效）全部有对应 mp3
 *  6. js/logic.js 与 js/logic.mjs 除 export 关键字外保持一致
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const ctx = vm.createContext({});
vm.runInContext(read('js/logic.js'), ctx);
const order = vm.runInContext('THEME_ORDER', ctx);
const themes = vm.runInContext('THEMES', ctx);
const errs = [];
const fail = (m) => errs.push(m);

if (order.length !== 20) fail('THEME_ORDER 数量 ' + order.length);
for (const id of order) {
  const t = themes[id];
  if (!t) { fail('缺主题 ' + id); continue; }
  if (t.id !== id) fail(id + ' id 不一致');
  const cnt = [t.hotspots?.length, t.quiz?.length, t.match?.length, t.story?.length].join('/');
  if (cnt !== '4/3/4/3') fail(`${id} 结构应为 4/3/4/3，实际 ${cnt}`);
  if (!fs.existsSync(path.join(ROOT, t.image))) fail(id + ' 缺封面 ' + t.image);
  const hs = (t.hotspots || []).map((h) => h.id).join(',');
  if (hs !== 'h1,h2,h3,h4') fail(id + ' 热点 id: ' + hs);
  for (const q of t.quiz || []) {
    if ((q.options || []).filter((o) => o.correct === true).length !== 1) {
      fail(id + ' 题目正确答案数异常: ' + q.q);
    }
  }
}

const need = new Set();
for (const id of order) {
  const t = themes[id];
  t.hotspots.forEach((h) => need.add(`${id}-${h.id}`));
  t.quiz.forEach((_, i) => need.add(`${id}-quiz-${i}`));
  t.story.forEach((_, i) => need.add(`${id}-story-${i}`));
  need.add(`${id}-badge`);
}
['fx-right-v2', 'fx-wrong-v2', 'fx-match-v2', 'fx-match-wrong-v2', 'fx-match-all-v2', 'fx-story-done-v2']
  .forEach((k) => need.add(k));
const missingAudio = [...need].filter((k) => !fs.existsSync(path.join(ROOT, 'assets/voice', k + '.mp3')));
if (missingAudio.length) fail('缺配音 ' + missingAudio.length + ' 条: ' + missingAudio.slice(0, 8).join(', '));

const imgs = fs.readdirSync(path.join(ROOT, 'assets')).filter((f) => /^theme-.*\.jpg$/.test(f));
if (imgs.length !== 20) fail('封面数 ' + imgs.length + '（应为 20）');
const big = imgs.filter((f) => fs.statSync(path.join(ROOT, 'assets', f)).size > 70 * 1024);
if (big.length) fail('超 70KB 封面: ' + big.join(', '));

const a = read('js/logic.js');
const b = read('js/logic.mjs');
const stripped = b.replace(/^export /gm, '');
if (a !== stripped) fail('js/logic.js 与 js/logic.mjs 不同步');

console.log(`主题 ${order.length} 个 | 配音键 ${need.size} 个 | 缺失 ${missingAudio.length} | 封面 ${imgs.length} 张 | 错误 ${errs.length}`);
if (errs.length) { errs.forEach((e) => console.log('  ERR', e)); process.exit(1); }
console.log('verify-assets ok');
