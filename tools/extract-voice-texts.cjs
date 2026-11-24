/**
 * 从 js/logic.js 提取 226 条配音的朗读文本，生成 /tmp/voice_texts.json。
 * 文本来源与 js/app.js 的 speak() 调用保持一致：
 *   热点 = "标题。文案"；题目 = 题干；故事 = 逐幕文案；徽章 = 恭喜语
 *   6 条通用音效文本取自 app.js 的 fallbackText
 * 用法：node tools/extract-voice-texts.cjs
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.resolve(__dirname, '..');
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root, 'js/logic.js'), 'utf8'), ctx);
const order = vm.runInContext('THEME_ORDER', ctx);
const themes = vm.runInContext('THEMES', ctx);

const map = {};
for (const id of order) {
  const t = themes[id];
  t.hotspots.forEach((h) => { map[`${id}-${h.id}`] = `${h.title}。${h.fact}`; });
  t.quiz.forEach((q, i) => { map[`${id}-quiz-${i}`] = q.q; });
  t.story.forEach((s, i) => { map[`${id}-story-${i}`] = s.text; });
  map[`${id}-badge`] = `恭喜你，答对了所有题目，获得${t.badgeName}徽章！`;
}
Object.assign(map, {
  'fx-right-v2': '答对啦，你真棒！',
  'fx-wrong-v2': '再想想看～',
  'fx-match-v2': '配对成功！',
  'fx-match-wrong-v2': '再试试看',
  'fx-match-all-v2': '全部配对成功，奖励一张贴纸！',
  'fx-story-done-v2': '故事讲完啦！你真会听故事！',
});
fs.writeFileSync('/tmp/voice_texts.json', JSON.stringify(map, null, 2));
console.log('已导出', Object.keys(map).length, '条配音文本 → /tmp/voice_texts.json');
