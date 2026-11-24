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
// 播放序号：每次 speak 递增。被后一次 speak 主动打断的旧音频，其 error/catch
// 不得再触发系统合成音回退，否则答对音效会被下一题配音打断后念出「答对啦，你真棒！」
let audioSeq = 0;

function voiceFile(key) {
  return key ? `assets/voice/${key}.mp3` : null;
}

// onEnded 只在本次播放结束且仍是最新一次时回调，用于串行播下一句。
// 音频源的 ended 事件在无头浏览器 / 部分 WebView 不可靠，故加超时兜底：
// 取 ended 与定时器中先到者，保证串联不会断。endGapMs 可按文案长度调整。
function speak(key, fallbackText, onEnded, endGapMs) {
  const seq = ++audioSeq;
  if (!progress.voice) { if (onEnded) onEnded(); return; }
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  if (currentAudio) {
    try { currentAudio.pause(); } catch (e) { /* 忽略 */ }
    currentAudio = null;
  }
  let settled = false;
  let guardTimer = null;
  const finish = (useFallback) => {
    if (guardTimer) { clearTimeout(guardTimer); guardTimer = null; }
    if (settled || seq !== audioSeq) return;
    settled = true;
    if (useFallback) speakFallback(fallbackText);
    if (onEnded) onEnded();
  };
  const src = voiceFile(key);
  if (src) {
    try {
      const a = new Audio(src);
      currentAudio = a;
      a.onended = () => finish(false);
      a.onerror = () => finish(true);
      a.play().catch(() => finish(true));
      if (onEnded) {
        // 默认 3.2s：覆盖 fx-right-v2(约2.6s) 等短句；长句调用方可传更大值。
        guardTimer = setTimeout(() => finish(false), endGapMs || 3200);
      }
      return;
    } catch (e) { /* 回退 */ }
  }
  finish(true);
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

// 每个主题的图鉴＝4 热点 + 配对 + 故事，共 6 条。
// 旧版只渲染 hotspots，导致玩配对/故事解锁的 match、story 条目获得了却看不见。
function dexEntries(t) {
  return [
    ...t.hotspots.map((h) => ({ id: h.id, emoji: h.emoji, name: h.title })),
    { id: "match", emoji: "🧩", name: "配对达人" },
    { id: "story", emoji: "📖", name: "听完故事" },
  ];
}

function renderDex() {
  const box = document.getElementById("dex-content");
  box.innerHTML = "";
  let gotTotal = 0;
  let allTotal = 0;
  // 已解锁的主题排前面，让孩子第一眼就看到自己的收获
  const ordered = [...THEME_ORDER].sort((a, b) => {
    const ga = progress.dex[a].length > 0 ? 1 : 0;
    const gb = progress.dex[b].length > 0 ? 1 : 0;
    return gb - ga;
  });
  for (const id of ordered) {
    const t = THEMES[id];
    const unlocked = progress.dex[id];
    const entries = dexEntries(t);
    allTotal += entries.length;
    gotTotal += entries.filter((e) => unlocked.includes(e.id)).length;
    const group = document.createElement("div");
    group.className = "dex-group";
    group.innerHTML = `<h3>${t.emoji} ${t.name}</h3>`;
    const items = document.createElement("div");
    items.className = "dex-items";
    // 已解锁的条目排前面
    const sorted = [...entries].sort((a, b) => {
      const ha = unlocked.includes(a.id) ? 1 : 0;
      const hb = unlocked.includes(b.id) ? 1 : 0;
      return hb - ha;
    });
    sorted.forEach((e) => {
      const got = unlocked.includes(e.id);
      const cell = document.createElement("div");
      cell.className = "dex-item" + (got ? " got" : " locked");
      cell.innerHTML = got
        ? `<span class="dex-emoji">${e.emoji}</span><span>${e.name}</span>`
        : `<span class="dex-emoji">❓</span><span>待发现</span>`;
      items.appendChild(cell);
    });
    group.appendChild(items);
    box.appendChild(group);
  }
  const count = document.getElementById("dex-count");
  if (count) count.textContent = `已点亮 ${gotTotal} / ${allTotal} 张`;
}

function renderBadges() {
  const wall = document.getElementById("badge-wall");
  wall.innerHTML = "";
  let gotTotal = 0;
  // 已获得的排前面
  const ordered = [...THEME_ORDER].sort((a, b) => {
    const ga = progress.badges[a] ? 1 : 0;
    const gb = progress.badges[b] ? 1 : 0;
    return gb - ga;
  });
  for (const id of ordered) {
    const t = THEMES[id];
    const got = progress.badges[id];
    if (got) gotTotal += 1;
    const cell = document.createElement("div");
    cell.className = "badge-cell " + (got ? "got" : "locked");
    cell.innerHTML = `<span class="b-emoji">${t.emoji}</span><span class="b-name">${t.badgeName}</span>`;
    wall.appendChild(cell);
  }
  const count = document.getElementById("badge-count");
  if (count) count.textContent = `已获得 ${gotTotal} / ${THEME_ORDER.length} 枚`;
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

  // 标签切换：统一入口，切换时停掉上一个玩法的配音、关掉知识卡、取消待办的自动跳转。
  const tabs = { explore: "tab-explore", quiz: "tab-quiz", match: "tab-match", story: "tab-story" };
  let autoAdvanceTimer = null;
  function cancelAutoAdvance() {
    if (autoAdvanceTimer) { clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
  }
  function scheduleAdvance(pane, delayMs) {
    cancelAutoAdvance();
    autoAdvanceTimer = setTimeout(() => { autoAdvanceTimer = null; switchTab(pane); }, delayMs);
  }
  function stopVoice() {
    audioSeq++; // 让在途音频的回调失效，避免切走后还在念上一屏的台词
    if (currentAudio) { try { currentAudio.pause(); } catch (e) {} currentAudio = null; }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }
  function switchTab(pane) {
    cancelAutoAdvance();
    stopVoice();
    document.getElementById("fact-card").classList.remove("open"); // 关掉知识卡，避免盖在别的玩法上
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.getElementById(tabs[pane]).classList.add("active");
    document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
    document.getElementById("pane-" + pane).classList.add("active");
    if (pane === "quiz") startQuiz();
    if (pane === "story") showStory(); // 故事每次进入从头播（不保存中途进度，符合需求）
    if (pane === "match") refreshMatch();
  }
  Object.entries(tabs).forEach(([pane, tabId]) => {
    document.getElementById(tabId).addEventListener("click", () => switchTab(pane));
  });

  // 问答通关后的"去玩配对 / 再玩一次"
  document.getElementById("quiz-next").addEventListener("click", () => switchTab("match"));
  document.getElementById("quiz-replay").addEventListener("click", () => {
    cancelAutoAdvance();
    progress = saveQuizProgress(progress, themeId, 0);
    saveProgress();
    startQuiz();
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
    wrongStreak = 0;
    hintShown = false;
    document.getElementById("quiz-feedback").textContent = "";
    // 已通关：直接显示通关画面（可重玩、可去下一关），不再把孩子拉回最后一题重答。
    // 这正是「答对后切回问答却像没通关」的根因修复。
    if ((progress.quizProgress[themeId] || 0) >= theme.quiz.length) {
      quizIdx = theme.quiz.length - 1;
      showQuizWin();
      return;
    }
    quizIdx = progress.quizProgress[themeId] || 0;
    document.getElementById("quiz-result").classList.remove("win");
    renderQuestion();
  }
  function renderQuestion(skipSpeak) {
    const q = theme.quiz[quizIdx];
    document.getElementById("quiz-progress").textContent = `第 ${quizIdx + 1} 题 / 共 ${theme.quiz.length} 题`;
    document.getElementById("quiz-question").textContent = q.q;
    if (!skipSpeak) speak(`${themeId}-quiz-${quizIdx}`, q.q);
    const box = document.getElementById("quiz-options");
    box.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-option" + (hintShown && opt.correct ? " hint" : "");
      btn.dataset.correct = opt.correct ? "1" : "0";
      // 图为主、文字为辅：5-7 岁识字有限，放大 emoji 让孩子看图就能选。
      btn.innerHTML = `<span class="opt-emoji">${opt.emoji}</span><span class="opt-text">${opt.text}</span>`;
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
      // UI 立即推进（保持连点三次可通关）。题干配音延后到鼓励语播完再播，
      // 否则下一题的 speak 会打断 fx-right-v2，其 catch 被误判为加载失败，
      // 回退到系统合成音念出「答对啦，你真棒！」——那不是晓伊的音色。
      const answered = quizIdx;
      const next = nextQuizIndex(answered, theme.quiz.length, true);
      const wasAlready = !!progress.badges[themeId];
      progress = saveQuizProgress(progress, themeId, answered + 1);
      saveProgress();
      if (next === -1) {
        winQuiz(); // UI 与存档立即完成，徽章配音由鼓励语回调串联
      } else {
        quizIdx = next;
        renderQuestion(true); // 只重绘选项，不播题干
        document.getElementById("quiz-feedback").textContent = "答对啦，你真棒！";
        document.getElementById("quiz-feedback").className = "quiz-feedback ok";
      }
      speak("fx-right-v2", "答对啦，你真棒！", () => {
        // 用户在鼓励语播放期间又答了题：答题已推进，不播过时的题干或徽章音。
        if (quizIdx !== next) return;
        if (next === -1) speakBadge(wasAlready);
        else speak(`${themeId}-quiz-${next}`, theme.quiz[next].q);
      });
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
  function speakBadge(already, onEnded) {
    const had = already === undefined ? !!progress.badges[themeId] : already;
    speak(`${themeId}-badge`, had
      ? `这个徽章你已经收集到啦，真厉害！`
      : `恭喜你，答对了所有题目，获得${theme.badgeName}徽章！`, onEnded);
  }
  // 显示通关画面（可重复调用：切回已通关主题时也走这里）
  function showQuizWin() {
    const result = document.getElementById("quiz-result");
    result.querySelectorAll("span.confetti").forEach((s) => s.remove());
    const already = !!progress.badges[themeId];
    document.getElementById("quiz-result-text").textContent = already
      ? `「${theme.badgeName}」徽章你已经收集到啦！`
      : `恭喜获得「${theme.badgeName}」徽章！`;
    result_confetti();
    result.classList.add("win");
    // 切回已通关主题时不再自动跳，让孩子自由选择去配对还是重玩
    document.getElementById("quiz-next").textContent = "🧩 去玩配对 ➜";
  }
  function winQuiz() {
    showQuizWin();
    if (!progress.badges[themeId]) {
      progress = grantBadge(progress, themeId);
      saveProgress();
    }
    // 自动进下一关用独立计时，不绑配音回调——配音链路（加载/回退/超时）变化不该影响流程推进。
    // 3.5 秒足够孩子看完徽章庆祝；想早走可点「去玩配对」，手动切标签会取消这个计时。
    scheduleAdvance("match", 3500);
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
  let alreadyMatched = progress.dex[themeId].includes("match");
  const shuffledSlots = [...theme.match].sort((a, b) => a.id.localeCompare(b.id));

  // "🐒 小猴子" → 大 emoji 一行 + 文字一行。用 Array.from 正确处理 emoji 代理对。
  function emojiMarkup(text) {
    const parts = String(text).split(/\s+/);
    if (parts.length < 2) return `<span class="pair-emoji">${text}</span>`;
    const emoji = parts.shift();
    return `<span class="pair-emoji">${emoji}</span><span class="pair-text">${parts.join(" ")}</span>`;
  }

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
      }
      // 配对成功后框里回显卡片内容；用 dataset 保留的原文，避免 innerHTML 结构被拼坏
      slot.innerHTML = `<span class="pair-emoji">${slot.dataset.emoji || ""}</span><span class="pair-text">${slot.dataset.text || ""}</span><span class="pair-check">✓</span>`;
      if (selectedCard && selectedCard.dataset.match === cardId) selectedCard = null;
      matchedCount++;
      speak("fx-match-v2", "配对成功！");
      if (matchedCount === theme.match.length) {
        document.getElementById("match-done-text").textContent = alreadyMatched
          ? "🎉 全部配对成功！这个贴纸你已经收集到啦～"
          : "🎉 全部配对成功！奖励 1 张贴纸！";
        matchDone.classList.add("show");
        speak("fx-match-all-v2", alreadyMatched
          ? "全部配对成功，这个贴纸你已经收集到啦！"
          : "全部配对成功，奖励一张贴纸！");
        // 独立计时自动进故事，与配音解耦
        scheduleAdvance("story", 3500);
        if (!alreadyMatched) {
          progress.stickers += 1;
          progress = unlockDex(progress, themeId, "match");
          alreadyMatched = true;
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
    card.innerHTML = emojiMarkup(m.card);
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
    // 记住原文，配对成功时回填用（此时 card 已 used，textContent 会被 innerHTML 结构污染）
    const sp = String(m.target).split(/\s+/);
    slot.dataset.emoji = sp.length >= 2 ? sp.shift() : "";
    slot.dataset.text = sp.join(" ");
    slot.innerHTML = emojiMarkup(m.target);
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

  // 切回配对标签：保留 DOM 现状（中途进度不落盘，但同页切走切回不打断孩子）
  function refreshMatch() { /* DOM 状态自然保留，无需重绘 */ }
  function resetMatch() {
    cancelAutoAdvance();
    matchedCount = 0;
    selectedCard = null;
    matchDone.classList.remove("show");
    dragRow.querySelectorAll(".drag-card").forEach((c) => c.classList.remove("used", "selected"));
    dropRow.querySelectorAll(".drop-slot").forEach((s) => {
      s.classList.remove("filled", "over");
      s.innerHTML = `<span class="pair-emoji">${s.dataset.emoji || ""}</span><span class="pair-text">${s.dataset.text || ""}</span>`;
    });
  }
  document.getElementById("match-next").addEventListener("click", () => switchTab("story"));
  document.getElementById("match-replay").addEventListener("click", resetMatch);

  /* --- 情景小故事 --- */
  let storyIdx = 0;
  let storyFinished = false;
  const storyActions = document.getElementById("story-actions");
  const storyDoneActions = document.getElementById("story-done-actions");
  function showStoryDone() {
    document.getElementById("story-text").textContent = "故事讲完啦！你真会听故事，图鉴又点亮了一格～";
    document.getElementById("story-step").textContent = `${theme.story.length} / ${theme.story.length}`;
    storyActions.style.display = "none";
    storyDoneActions.classList.add("show");
  }
  // 进入故事标签：从头播（故事不保存中途进度，符合需求）
  function showStory() {
    storyIdx = 0;
    storyFinished = false;
    storyActions.style.display = "flex";
    storyDoneActions.classList.remove("show");
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
      showStoryDone();
      speak("fx-story-done-v2", "故事讲完啦！你真会听故事！");
      progress = unlockDex(progress, themeId, "story");
      await saveProgress();
    }
  });
  document.getElementById("story-replay").addEventListener("click", () => { cancelAutoAdvance(); showStory(); });
  document.getElementById("story-home").addEventListener("click", async () => { await flushProgress(); location.href = "index.html"; });

  showStory(); // 预置第一幕数据（切换标签时会重置）
  document.querySelectorAll(".tab-pane").forEach((p) => p.classList.remove("active"));
  document.getElementById("pane-explore").classList.add("active");
}

/* ===== 启动 ===== */
(async function boot() {
  await loadProgress();
  initHome();
  initPlay();
})();
