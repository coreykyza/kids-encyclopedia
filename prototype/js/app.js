const kv = window.InnoflowKV;
const PROGRESS_KEY = "kidpedia_progress_v1";

let progress = normalizeProgress(null);

/* ===== 存档：本地存档兜底 + 平台存储同步 =====
   双击打开（file://）或离线时平台存储不可用，必须仍把进度写进浏览器本地，
   否则离开探索页再回到首页，刚拿到的徽章就会全部消失。 */
const memoryStore = {};

function safeStore() {
  try {
    const t = "__kidpedia_probe__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch (e) {
    try {
      const t = "__kidpedia_probe__";
      window.sessionStorage.setItem(t, "1");
      window.sessionStorage.removeItem(t);
      return window.sessionStorage;
    } catch (e2) { return null; }
  }
}
const store = safeStore();

function readLocalProgress() {
  if (store) {
    try {
      const raw = store.getItem(PROGRESS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* 损坏时按空档处理 */ }
    return null;
  }
  return memoryStore[PROGRESS_KEY] || null;
}

function writeLocalProgress(value) {
  const text = JSON.stringify(value);
  if (store) {
    try { store.setItem(PROGRESS_KEY, text); } catch (e) { /* 空间不足时忽略 */ }
    return;
  }
  memoryStore[PROGRESS_KEY] = text;
}

async function loadProgress() {
  const local = readLocalProgress();
  if (!kv || !kv.ready()) {
    progress = normalizeProgress(local);
    return;
  }
  let remote = null;
  try { remote = await kv.get(kv.userId(), PROGRESS_KEY); } catch (e) { remote = null; }
  progress = normalizeProgress(mergeProgress(local, remote));
  writeLocalProgress(progress);
}

async function saveProgress() {
  writeLocalProgress(progress);
  if (!kv || !kv.ready()) return;
  try {
    await kv.put(kv.userId(), PROGRESS_KEY, progress);
  } catch (e) { /* 云端失败时本地存档已生效 */ }
}

// 离开页面前冲一次存档，避免在途请求被整页跳转打断
async function flushProgress() {
  writeLocalProgress(progress);
  if (!kv || !kv.ready()) return;
  try {
    await Promise.race([
      kv.put(kv.userId(), PROGRESS_KEY, progress),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  } catch (e) { /* 本地存档已生效 */ }
}

window.addEventListener("pagehide", () => writeLocalProgress(progress));

/* ===== 语音：优先预生成真人录音，缺失时回退系统合成音 ===== */
let currentAudio = null;

function voiceFile(key) {
  return key ? `assets/voice/${key}.mp3` : null;
}

function speak(key, fallbackText) {
  if (!progress.voice) return;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  const src = voiceFile(key);
  if (src) {
    try {
      const a = new Audio(src);
      currentAudio = a;
      a.onerror = () => speakFallback(fallbackText);
      a.play().catch(() => speakFallback(fallbackText));
      return;
    } catch (e) { /* 回退 */ }
  }
  speakFallback(fallbackText);
}

function speakFallback(text) {
  if (!progress.voice || !text) return;
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-CN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch (e) { /* 忽略 */ }
}

/* ===== 首页 ===== */
function initHome() {
  const grid = document.getElementById("theme-grid");
  if (!grid) return;
  grid.innerHTML = "";
  let idx = 0;
  for (const id of THEME_ORDER) {
    const t = THEMES[id];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "theme-card";
    card.dataset.theme = id;
    // 首屏前 6 张立即加载并提高优先级，其余懒加载，避免一次性抢占带宽出现白卡
    const eager = idx < 6;
    const imgAttr = eager
      ? `loading="eager" fetchpriority="high" decoding="async"`
      : `loading="lazy" fetchpriority="low" decoding="async"`;
    idx += 1;
    card.innerHTML =
      `<img src="${t.image}" alt="${t.name}" width="860" height="484" ${imgAttr}>` +
      `<div class="card-name"><span>${t.emoji}</span><span>${t.name}</span>` +
      `<span class="card-badge${progress.badges[id] ? " got" : ""}" title="${t.badgeName}">🏅</span></div>`;
    card.addEventListener("click", () => {
      location.href = `play.html?theme=${id}`;
    });
    grid.appendChild(card);
  }

  const dexPanel = document.getElementById("dex-panel");
  const badgePanel = document.getElementById("badge-panel");
  document.getElementById("btn-dex").addEventListener("click", () => { renderDex(); dexPanel.classList.add("open"); });
  document.getElementById("btn-badges").addEventListener("click", () => { renderBadges(); badgePanel.classList.add("open"); });
  document.querySelectorAll(".panel-close").forEach((btn) => {
    btn.addEventListener("click", () => document.getElementById(btn.dataset.close).classList.remove("open"));
  });
  [dexPanel, badgePanel].forEach((mask) => {
    mask.addEventListener("click", (e) => { if (e.target === mask) mask.classList.remove("open"); });
  });
}

function renderDex() {
  const box = document.getElementById("dex-content");
  box.innerHTML = "";
  for (const id of THEME_ORDER) {
    const t = THEMES[id];
    const group = document.createElement("div");
    group.className = "dex-group";
    const entries = t.hotspots.map((h) => ({ id: h.id, emoji: h.emoji, name: h.title }));
    const unlocked = progress.dex[id];
    group.innerHTML = `<h3>${t.emoji} ${t.name}</h3>`;
    const items = document.createElement("div");
    items.className = "dex-items";
    entries.forEach((e) => {
      const got = unlocked.includes(e.id);
      const cell = document.createElement("div");
      cell.className = "dex-item" + (got ? "" : " locked");
      cell.textContent = got ? `${e.emoji} ${e.name}` : `❓ 待发现`;
      items.appendChild(cell);
    });
    group.appendChild(items);
    box.appendChild(group);
  }
}

function renderBadges() {
  const wall = document.getElementById("badge-wall");
  wall.innerHTML = "";
  for (const id of THEME_ORDER) {
    const t = THEMES[id];
    const got = progress.badges[id];
    const cell = document.createElement("div");
    cell.className = "badge-cell " + (got ? "got" : "locked");
    cell.innerHTML = `<span class="b-emoji">${t.emoji}</span><span class="b-name">${t.badgeName}</span>`;
    wall.appendChild(cell);
  }
}

/* ===== 探索页 ===== */
function initPlay() {
  const titleEl = document.getElementById("scene-title");
  if (!titleEl) return;
  const themeId = resolveThemeId(new URLSearchParams(location.search).get("theme"));
  const theme = THEMES[themeId];
  titleEl.textContent = theme.name;
  document.title = `${theme.name} · 小小百科探险家`;

  document.getElementById("btn-home").addEventListener("click", async () => { await flushProgress(); location.href = "index.html"; });

  // 声音开关
  const voiceBtn = document.getElementById("voice-toggle");
  const renderVoice = () => { voiceBtn.textContent = progress.voice ? "🔊 声音开" : "🔇 声音关"; };
  renderVoice();
  voiceBtn.addEventListener("click", async () => {
    progress.voice = !progress.voice;
    if (!progress.voice && "speechSynthesis" in window) window.speechSynthesis.cancel();
    renderVoice();
    await saveProgress();
  });

  // 标签切换
  const tabs = { explore: "tab-explore", quiz: "tab-quiz", match: "tab-match", story: "tab-story" };
  Object.entries(tabs).forEach(([pane, tabId]) => {
    document.getElementById(tabId).addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      document.getElementById(tabId).classList.add("active");
      document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
      document.getElementById("pane-" + pane).classList.add("active");
      if (pane === "quiz") startQuiz();
      if (pane === "story") startStory();
    });
  });

  /* --- 点选探索 --- */
  const wrap = document.getElementById("scene-wrap");
  document.getElementById("scene-img").src = theme.image;
  const factCard = document.getElementById("fact-card");
  let currentFact = null;
  theme.hotspots.forEach((h) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "hotspot" + (progress.dex[themeId].includes(h.id) ? " seen" : "");
    dot.dataset.id = h.id;
    dot.style.left = h.x + "%";
    dot.style.top = h.y + "%";
    dot.textContent = h.emoji;
    dot.setAttribute("aria-label", h.title);
    dot.addEventListener("click", async () => {
      currentHotspot(h, dot);
    });
    wrap.appendChild(dot);
  });
  async function currentHotspot(h, dot) {
    currentHotspot.h = h;
    document.getElementById("fact-emoji").textContent = h.emoji;
    document.getElementById("fact-name").textContent = h.title;
    document.getElementById("fact-text").textContent = h.fact;
    factCard.classList.add("open");
    speak(`${themeId}-${h.id}`, `${h.title}。${h.fact}`);
    if (!progress.dex[themeId].includes(h.id)) {
      progress = unlockDex(progress, themeId, h.id);
      dot.classList.add("seen");
      await saveProgress();
    }
  }
  document.getElementById("fact-listen").addEventListener("click", () => {
    const h = currentHotspot.h;
    if (h) speak(`${themeId}-${h.id}`, `${h.title}。${h.fact}`);
  });
  document.getElementById("fact-close").addEventListener("click", () => factCard.classList.remove("open"));

  /* --- 问答闯关（记住玩到第几关；连错3次给讲解；徽章不重复计数） --- */
  // 设计约定：同一题内正确选项始终带 data-correct="1"；连续点击时每次点击都按当前题判定。
  // 答对后立即推进到下一题（并重绘选项），三次点击落在三道不同题的正确项上即可通关。
  let quizIdx = 0;
  let wrongStreak = 0;
  let hintShown = false;
  function startQuiz() {
    quizIdx = Math.min(progress.quizProgress[themeId] || 0, theme.quiz.length - 1);
    wrongStreak = 0;
    hintShown = false;
    document.getElementById("quiz-result").classList.remove("win");
    document.getElementById("quiz-feedback").textContent = "";
    renderQuestion();
  }
  function renderQuestion() {
    const q = theme.quiz[quizIdx];
    document.getElementById("quiz-progress").textContent = `第 ${quizIdx + 1} 题 / 共 ${theme.quiz.length} 题`;
    document.getElementById("quiz-question").textContent = q.q;
    speak(`${themeId}-quiz-${quizIdx}`, q.q);
    const box = document.getElementById("quiz-options");
    box.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option" + (hintShown && opt.correct ? " hint" : "");
      btn.dataset.correct = opt.correct ? "1" : "0";
      btn.textContent = `${opt.emoji} ${opt.text}`;
      btn.addEventListener("click", () => answer(opt, btn));
      box.appendChild(btn);
    });
  }
  async function answer(opt, btn) {
    const fb = document.getElementById("quiz-feedback");
    if (checkAnswer(opt)) {
      btn.classList.add("right");
      wrongStreak = 0;
      hintShown = false;
      fb.textContent = "答对啦，你真棒！";
      fb.className = "quiz-feedback ok";
      speak("fx-right-v2", "答对啦，你真棒！");
      progress = saveQuizProgress(progress, themeId, quizIdx + 1);
      await saveProgress();
      const next = nextQuizIndex(quizIdx, theme.quiz.length, true);
      if (next === -1) {
        await winQuiz();
      } else {
        quizIdx = next;
        renderQuestion();
        document.getElementById("quiz-feedback").textContent = "答对啦，你真棒！";
        document.getElementById("quiz-feedback").className = "quiz-feedback ok";
      }
    } else {
      btn.classList.add("wrong");
      wrongStreak++;
      fb.textContent = "再想想看～";
      fb.className = "quiz-feedback no";
      speak("fx-wrong-v2", "再想想看");
      setTimeout(() => btn.classList.remove("wrong"), 700);
      if (wrongStreak >= 3 && !hintShown) {
        hintShown = true;
        const correctOpt = theme.quiz[quizIdx].options.find((o) => o.correct);
        fb.textContent = `小提示：谜底是${correctOpt.text}哦，点对发光的答案就能过关！`;
        document.querySelectorAll("#quiz-options .quiz-option").forEach((b) => {
          if (b.dataset.correct === "1") b.classList.add("hint");
        });
      }
    }
  }
  async function winQuiz() {
    const result = document.getElementById("quiz-result");
    result.querySelectorAll("span.confetti").forEach((s) => s.remove());
    const already = !!progress.badges[themeId];
    document.getElementById("quiz-result-text").textContent = already
      ? `「${theme.badgeName}」徽章你已经收集到啦！`
      : `恭喜获得「${theme.badgeName}」徽章！`;
    result_confetti();
    result.classList.add("win");
    speak(`${themeId}-badge`, already
      ? `这个徽章你已经收集到啦，真厉害！`
      : `恭喜你，答对了所有题目，获得${theme.badgeName}徽章！`);
    if (!already) {
      progress = grantBadge(progress, themeId);
      await saveProgress();
    }
  }
  function result_confetti() {
    const result = document.getElementById("quiz-result");
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.textContent = ["🎉", "⭐", "🌟", "🎈"][i % 4];
      s.style.cssText = `position:absolute;font-size:${18 + (i % 3) * 8}px;left:${5 + i * 8}%;top:-10px;animation:pop .6s ease ${i * 0.05}s both;pointer-events:none`;
      s.style.position = "absolute";
      result.style.position = "relative";
      result.appendChild(s);
      setTimeout(() => s.remove(), 1500);
    }
  }

  /* --- 拖拽配对（真拖拽：鼠标 + 触屏；点选兜底；贴纸不重复计数） --- */
  const dragRow = document.getElementById("drag-row");
  const dropRow = document.getElementById("drop-row");
  const matchDone = document.getElementById("match-done");
  let matchedCount = 0;
  let selectedCard = null;
  const alreadyMatched = progress.dex[themeId].includes("match");
  const shuffledSlots = [...theme.match].sort((a, b) => a.id.localeCompare(b.id));

  function selectCard(card) {
    if (card.classList.contains("used")) return;
    if (selectedCard) selectedCard.classList.remove("selected");
    selectedCard = selectedCard === card ? null : card;
    if (selectedCard) selectedCard.classList.add("selected");
  }
  async function tryMatch(cardId, slot) {
    if (slot.classList.contains("filled")) return;
    if (checkMatch(cardId, slot.dataset.accept)) {
      slot.classList.add("filled");
      const card = dragRow.querySelector(`.drag-card[data-match="${cardId}"]`);
      if (card) {
        card.classList.add("used");
        card.classList.remove("selected");
        slot.textContent = `${card.textContent} → ${slot.textContent}`;
      }
      if (selectedCard && selectedCard.dataset.match === cardId) selectedCard = null;
      matchedCount++;
      speak("fx-match-v2", "配对成功！");
      if (matchedCount === theme.match.length) {
        matchDone.textContent = alreadyMatched
          ? "🎉 全部配对成功！这个贴纸你已经收集到啦～"
          : "🎉 全部配对成功！奖励 1 张贴纸！";
        matchDone.classList.add("show");
        speak("fx-match-all-v2", alreadyMatched ? "全部配对成功，这个贴纸你已经收集到啦！" : "全部配对成功，奖励一张贴纸！");
        if (!alreadyMatched) {
          progress.stickers += 1;
          progress = unlockDex(progress, themeId, "match");
          await saveProgress();
        }
      }
    } else {
      speak("fx-match-wrong-v2", "再试试看");
      slot.classList.add("shake");
      setTimeout(() => slot.classList.remove("shake"), 500);
    }
  }

  theme.match.forEach((m) => {
    const card = document.createElement("div");
    card.className = "drag-card";
    card.draggable = true;
    card.dataset.match = m.id;
    card.textContent = m.card;
    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", m.id);
      e.dataTransfer.effectAllowed = "move";
      selectCard(card);
    });
    card.addEventListener("click", () => selectCard(card)); // 触屏/鼠标点选兜底
    dragRow.appendChild(card);
  });
  shuffledSlots.forEach((m) => {
    const slot = document.createElement("div");
    slot.className = "drop-slot";
    slot.dataset.accept = m.id;
    slot.textContent = m.target;
    slot.addEventListener("dragover", (e) => { e.preventDefault(); slot.classList.add("over"); });
    slot.addEventListener("dragleave", () => slot.classList.remove("over"));
    slot.addEventListener("drop", async (e) => {
      e.preventDefault();
      slot.classList.remove("over");
      const cardId = e.dataTransfer.getData("text/plain");
      await tryMatch(cardId, slot);
    });
    slot.addEventListener("click", async () => { // 点选兜底：先点卡片再点框
      if (selectedCard) await tryMatch(selectedCard.dataset.match, slot);
    });
    dropRow.appendChild(slot);
  });

  /* --- 情景小故事 --- */
  let storyIdx = 0;
  let storyFinished = false;
  function startStory() {
    storyIdx = 0;
    storyFinished = false;
    renderStory();
  }
  function renderStory() {
    const sc = theme.story[storyIdx];
    document.getElementById("story-step").textContent = `${storyIdx + 1} / ${theme.story.length}`;
    document.getElementById("story-emoji").textContent = sc.emoji;
    document.getElementById("story-text").textContent = sc.text;
    document.getElementById("story-next").textContent = storyIdx === theme.story.length - 1 ? "听完啦 ✓" : "下一幕 ➜";
    speak(`${themeId}-story-${storyIdx}`, sc.text);
  }
  document.getElementById("story-listen").addEventListener("click", () => speak(`${themeId}-story-${storyIdx}`, theme.story[storyIdx].text));
  document.getElementById("story-next").addEventListener("click", async () => {
    if (storyIdx < theme.story.length - 1) {
      storyIdx++;
      renderStory();
    } else if (!storyFinished) {
      storyFinished = true;
      document.getElementById("story-text").textContent = "故事讲完啦！你真会听故事，图鉴又点亮了一格～";
      document.getElementById("story-step").textContent = `${theme.story.length} / ${theme.story.length}`;
      speak("fx-story-done-v2", "故事讲完啦！你真会听故事！");
      progress = unlockDex(progress, themeId, "story");
      await saveProgress();
    }
  });

  startStory(); // 预置第一幕数据（切换标签时会重置）
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  document.getElementById("pane-explore").classList.add("active");
}

/* ===== 启动 ===== */
(async function boot() {
  await loadProgress();
  initHome();
  initPlay();
})();
