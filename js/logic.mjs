// 小小百科探险家 · 共享数据与纯逻辑
// 页面与冒烟测试复用本模块；不包含 DOM 操作。

export const THEME_ORDER = ["animals", "body", "science", "life", "culture"];

export const THEMES = {
  animals: {
    id: "animals",
    name: "自然与动物",
    emoji: "🦁",
    image: "assets/theme-animals.jpg",
    badgeName: "动物小博士",
    hotspots: [
      { id: "h1", x: 22, y: 40, title: "大象", emoji: "🐘", fact: "大象用长鼻子喝水、卷食物，还会用鼻子跟朋友打招呼呢。大象的耳朵像大扇子，热了就扇一扇凉快凉快。" },
      { id: "h2", x: 52, y: 28, title: "长颈鹿", emoji: "🦒", fact: "长颈鹿的脖子长长的，能吃到高高的树叶。它的舌头有半个胳膊那么长，还是蓝紫色的哦！" },
      { id: "h3", x: 72, y: 55, title: "狮子", emoji: "🦁", fact: "狮子被称为草原之王。雄狮有蓬松的大鬃毛，看起来威风极了。狮子喜欢和家人一起生活。" },
      { id: "h4", x: 40, y: 68, title: "小猴子", emoji: "🐒", fact: "小猴子喜欢在树上荡来荡去，尾巴能帮忙保持平衡。它们还会互相捉虱子，这是在表达友好呢。" }
    ],
    quiz: [
      { q: "哪种动物用长鼻子喝水？", options: [{ emoji: "🐘", text: "大象", correct: true }, { emoji: "🐒", text: "猴子", correct: false }, { emoji: "🦁", text: "狮子", correct: false }] },
      { q: "谁的脖子最长，能吃到高高的树叶？", options: [{ emoji: "🐯", text: "老虎", correct: false }, { emoji: "🦒", text: "长颈鹿", correct: true }, { emoji: "🐷", text: "小猪", correct: false }] },
      { q: "被称为「草原之王」的是谁？", options: [{ emoji: "🐰", text: "兔子", correct: false }, { emoji: "🐢", text: "乌龟", correct: false }, { emoji: "🦁", text: "狮子", correct: true }] }
    ],
    match: [
      { id: "banana", card: "🐒 小猴子", target: "🍌 香蕉" },
      { id: "leaf", card: "🦒 长颈鹿", target: "🌿 树叶" },
      { id: "meat", card: "🦁 狮子", target: "🍖 肉肉" },
      { id: "peanut", card: "🐘 大象", target: "🥜 花生" }
    ],
    story: [
      { emoji: "🐣", text: "小鸭子嘎嘎破壳啦！它睁开眼睛，看到的第一个就是鸭妈妈，把妈妈当成了最亲的人。" },
      { emoji: "🌊", text: "鸭妈妈带着嘎嘎来到小河边。嘎嘎扑通跳下水，咦？它天生就会游泳，脚丫像小桨一样划呀划。" },
      { emoji: "🦆", text: "日子一天天过去，嘎嘎长出了漂亮的羽毛。它跟着妈妈学会了捉小鱼，变成了一只真正的大鸭子！" }
    ]
  },
  body: {
    id: "body",
    name: "人体与健康",
    emoji: "💪",
    image: "assets/theme-body.jpg",
    badgeName: "健康小卫士",
    hotspots: [
      { id: "h1", x: 30, y: 35, title: "心脏", emoji: "❤️", fact: "心脏像一个勤劳的小水泵，每天扑通扑通跳个不停，把血液送到全身每一个角落。" },
      { id: "h2", x: 58, y: 30, title: "牙齿", emoji: "🦷", fact: "牙齿帮我们咬碎食物。早晚刷牙、少吃糖，牙齿才不会长虫牙。乳牙掉了还会长出恒牙哦。" },
      { id: "h3", x: 70, y: 58, title: "眼睛", emoji: "👀", fact: "眼睛是心灵的窗户。看书写字要坐端正，看一会儿远处让眼睛休息，少看发光的屏幕。" },
      { id: "h4", x: 40, y: 65, title: "小手", emoji: "🖐️", fact: "小手能做很多事情：画画、写字、搭积木。饭前便后要洗手，把细菌小怪兽冲走！" }
    ],
    quiz: [
      { q: "哪个器官像小水泵一样不停跳动？", options: [{ emoji: "🧠", text: "大脑", correct: false }, { emoji: "❤️", text: "心脏", correct: true }, { emoji: "🦴", text: "骨头", correct: false }] },
      { q: "怎样保护牙齿？", options: [{ emoji: "🪥", text: "早晚刷牙", correct: true }, { emoji: "🍬", text: "多吃糖果", correct: false }, { emoji: "🥤", text: "多喝汽水", correct: false }] },
      { q: "饭前便后要做什么？", options: [{ emoji: "📺", text: "看电视", correct: false }, { emoji: "🧼", text: "认真洗手", correct: true }, { emoji: "😴", text: "睡大觉", correct: false }] }
    ],
    match: [
      { id: "eye", card: "👀 眼睛", target: "📖 看书看世界" },
      { id: "ear", card: "👂 耳朵", target: "🎵 听声音" },
      { id: "nose", card: "👃 鼻子", target: "🌸 闻花香" },
      { id: "mouth", card: "👄 嘴巴", target: "🍎 尝味道" }
    ],
    story: [
      { emoji: "🦠", text: "细菌小怪兽偷偷爬上了小明的小手，想跟着面包溜进肚子里捣乱。" },
      { emoji: "🧼", text: "吃饭前，妈妈提醒小明洗手。肥皂泡泡搓呀搓，冲走了细菌小怪兽，小手变得干干净净。" },
      { emoji: "💪", text: "小明每天都认真洗手、刷牙、早睡早起。身体棒棒的他，成了真正的健康小卫士！" }
    ]
  },
  science: {
    id: "science",
    name: "科学现象",
    emoji: "🌈",
    image: "assets/theme-science.jpg",
    badgeName: "科学小达人",
    hotspots: [
      { id: "h1", x: 25, y: 35, title: "彩虹", emoji: "🌈", fact: "下过雨出太阳的时候，阳光穿过小水滴，就会变成七种颜色的彩虹，像天空的滑梯。" },
      { id: "h2", x: 55, y: 25, title: "闪电", emoji: "⚡", fact: "雷雨云里藏着好多电荷，电荷跑来跑去就会放出闪电。先看到闪电，后听到雷声，因为光比声音跑得快！" },
      { id: "h3", x: 75, y: 50, title: "磁铁", emoji: "🧲", fact: "磁铁有看不见的魔力，能吸住铁做的东西。两块磁铁有时候抱抱，有时候互相推开，真有趣。" },
      { id: "h4", x: 42, y: 62, title: "太阳", emoji: "☀️", fact: "太阳是一颗好大好大的恒星，给我们带来光和温暖。没有太阳，地球就会又黑又冷。" }
    ],
    quiz: [
      { q: "什么时候最容易看到彩虹？", options: [{ emoji: "❄️", text: "下雪天", correct: false }, { emoji: "🌦️", text: "雨后出太阳", correct: true }, { emoji: "🌙", text: "半夜", correct: false }] },
      { q: "打雷时我们先看到什么？", options: [{ emoji: "⚡", text: "闪电", correct: true }, { emoji: "🔊", text: "先听到雷声", correct: false }, { emoji: "🌧️", text: "大雨", correct: false }] },
      { q: "磁铁能吸住什么？", options: [{ emoji: "🧸", text: "布娃娃", correct: false }, { emoji: "📄", text: "纸", correct: false }, { emoji: "🔩", text: "铁钉", correct: true }] }
    ],
    match: [
      { id: "rainbow", card: "🌈 彩虹", target: "🌦️ 雨后阳光" },
      { id: "lightning", card: "⚡ 闪电", target: "⛈️ 雷雨云" },
      { id: "magnet", card: "🧲 磁铁", target: "🔩 铁钉" },
      { id: "sun", card: "☀️ 太阳", target: "🌻 向日葵" }
    ],
    story: [
      { emoji: "💧", text: "小水滴住在小河里。太阳晒呀晒，它变得轻飘飘的，变成水汽飞上了天。" },
      { emoji: "☁️", text: "天上好冷呀，小水滴和好多小伙伴抱在一起，变成了一朵白白胖胖的云。" },
      { emoji: "🌧️", text: "云越来越重，小水滴变成雨点落回大地，流进小河，又开始了新的旅行。这就是水循环！" }
    ]
  },
  life: {
    id: "life",
    name: "日常生活",
    emoji: "🏠",
    image: "assets/theme-life.jpg",
    badgeName: "生活小能手",
    hotspots: [
      { id: "h1", x: 28, y: 38, title: "时钟", emoji: "🕐", fact: "时钟有时针和分针，短短的时针走得慢，长长的分针走得快。认识时钟，就不会迟到啦。" },
      { id: "h2", x: 55, y: 30, title: "书包", emoji: "🎒", fact: "书包是上学的好伙伴，里面装着课本、铅笔盒和水壶。每天自己整理书包，是个好习惯。" },
      { id: "h3", x: 72, y: 55, title: "红绿灯", emoji: "🚦", fact: "红灯停，绿灯行，黄灯亮了等一等。过马路要走斑马线，牵好大人的手。" },
      { id: "h4", x: 42, y: 65, title: "小厨房", emoji: "🍳", fact: "厨房里能做出香喷喷的饭菜。但是炉火和刀子很危险，小朋友不能自己碰哦。" }
    ],
    quiz: [
      { q: "过马路时红灯亮了怎么办？", options: [{ emoji: "🏃", text: "快点跑过去", correct: false }, { emoji: "✋", text: "停下来等一等", correct: true }, { emoji: "🙈", text: "闭着眼走", correct: false }] },
      { q: "上学前要整理什么？", options: [{ emoji: "🎒", text: "小书包", correct: true }, { emoji: "📺", text: "电视机", correct: false }, { emoji: "🛏️", text: "大棉被", correct: false }] },
      { q: "厨房里什么东西小朋友不能碰？", options: [{ emoji: "🍎", text: "苹果", correct: false }, { emoji: "🔪", text: "刀子", correct: true }, { emoji: "🥣", text: "小碗", correct: false }] }
    ],
    match: [
      { id: "clock", card: "🕐 时钟", target: "⏰ 看时间" },
      { id: "bag", card: "🎒 书包", target: "📚 装课本" },
      { id: "light", card: "🚦 红绿灯", target: "🚸 过马路" },
      { id: "brush", card: "🪥 牙刷", target: "🦷 刷牙齿" }
    ],
    story: [
      { emoji: "🌅", text: "太阳公公出来啦！朵朵自己穿衣服、叠被子，虽然叠得像个小花卷，妈妈还是夸了她。" },
      { emoji: "🪥", text: "朵朵挤上牙膏，上刷刷、下刷刷，刷够三分钟。镜子里的小白牙亮晶晶！" },
      { emoji: "🎒", text: "出门前，朵朵自己检查书包：课本、水壶、铅笔盒，一样都不少。她真是生活小能手！" }
    ]
  },
  culture: {
    id: "culture",
    name: "社会人文",
    emoji: "🏮",
    image: "assets/theme-culture.jpg",
    badgeName: "文化小使者",
    hotspots: [
      { id: "h1", x: 26, y: 40, title: "医生", emoji: "👨‍⚕️", fact: "医生帮我们看病，让身体快快好起来。打针有一点点疼，但是能打败病毒小怪兽。" },
      { id: "h2", x: 52, y: 28, title: "消防员", emoji: "🧑‍🚒", fact: "消防员叔叔最勇敢，哪里有火灾就冲向哪里。着火要打 119，还要用湿毛巾捂住口鼻。" },
      { id: "h3", x: 74, y: 52, title: "春节", emoji: "🏮", fact: "春节是中国的传统新年，家家户户贴春联、挂灯笼、吃饺子，小朋友还能收到压岁钱。" },
      { id: "h4", x: 42, y: 66, title: "地球村", emoji: "🌍", fact: "地球上住着好多国家的人，说着不同的语言，有不同的节日和美食。世界真大真有趣！" }
    ],
    quiz: [
      { q: "着火了要打什么电话？", options: [{ emoji: "📞", text: "119", correct: true }, { emoji: "📞", text: "110", correct: false }, { emoji: "📞", text: "120", correct: false }] },
      { q: "谁帮我们看病，让身体好起来？", options: [{ emoji: "👨‍🍳", text: "厨师", correct: false }, { emoji: "👨‍⚕️", text: "医生", correct: true }, { emoji: "👨‍🏫", text: "老师", correct: false }] },
      { q: "春节的时候大家会做什么？", options: [{ emoji: "🎃", text: "做南瓜灯", correct: false }, { emoji: "🥚", text: "找彩蛋", correct: false }, { emoji: "🏮", text: "挂灯笼贴春联", correct: true }] }
    ],
    match: [
      { id: "doctor", card: "👨‍⚕️ 医生", target: "💊 治病救人" },
      { id: "fireman", card: "🧑‍🚒 消防员", target: "🚒 灭火救援" },
      { id: "teacher", card: "👨‍🏫 老师", target: "📖 教知识" },
      { id: "cook", card: "👨‍🍳 厨师", target: "🍜 做美食" }
    ],
    story: [
      { emoji: "🏮", text: "快过年啦！奶奶带着圆圆贴春联，红红的纸上写着祝福的话，门口一下子变得喜气洋洋。" },
      { emoji: "🥟", text: "除夕夜，全家人围在一起包饺子。圆圆包的饺子歪歪扭扭，像个睡着的小元宝，大家都笑了。" },
      { emoji: "🧧", text: "新年钟声敲响，圆圆给爷爷奶奶拜年，收到了大红包。她知道了：团圆就是春节最好的礼物。" }
    ]
  }
};

// 默认主题（无参数时进入）
export function resolveThemeId(param) {
  return Object.prototype.hasOwnProperty.call(THEMES, param) ? param : "animals";
}

// 配对判断：卡片 id 与目标框接受值一致则配对成功
export function checkMatch(cardId, slotAccept) {
  return cardId === slotAccept;
}

// 答题判定：返回选项是否正确
export function checkAnswer(option) {
  return option && option.correct === true;
}

// 答题推进：答对进入下一题，返回新索引；全部答对返回 -1 表示通关
export function nextQuizIndex(currentIndex, total, isCorrect) {
  if (!isCorrect) return currentIndex;
  const next = currentIndex + 1;
  return next >= total ? -1 : next;
}

// 空进度档案
export function emptyProgress() {
  const badges = {};
  const dex = {};
  for (const id of THEME_ORDER) {
    badges[id] = false;
    dex[id] = [];
  }
  return { badges, dex, stickers: 0, voice: true, quizProgress: {} };
}

// 合并读到的进度，缺字段时补默认
export function normalizeProgress(raw) {
  const base = emptyProgress();
  if (!raw || typeof raw !== "object") return base;
  const quizProgress = {};
  for (const id of THEME_ORDER) {
    quizProgress[id] = Number.isFinite(raw.quizProgress?.[id]) ? raw.quizProgress[id] : 0;
  }
  return {
    badges: { ...base.badges, ...(raw.badges || {}) },
    dex: Object.fromEntries(THEME_ORDER.map((id) => [id, Array.isArray(raw.dex?.[id]) ? raw.dex[id] : []])),
    stickers: Number.isFinite(raw.stickers) ? raw.stickers : 0,
    voice: raw.voice !== false,
    quizProgress
  };
}

// 保存问答已通过的题数（玩到第几关），返回新进度对象
export function saveQuizProgress(progress, themeId, passedCount) {
  const next = normalizeProgress(progress);
  next.quizProgress[themeId] = passedCount;
  return next;
}

// 解锁图鉴条目（去重），返回新进度对象
export function unlockDex(progress, themeId, entryId) {
  const next = normalizeProgress(progress);
  if (!next.dex[themeId].includes(entryId)) {
    next.dex[themeId] = [...next.dex[themeId], entryId];
  }
  return next;
}

// 授予徽章，返回新进度对象
export function grantBadge(progress, themeId) {
  const next = normalizeProgress(progress);
  next.badges[themeId] = true;
  return next;
}

// 已获得徽章数量
export function countBadges(progress) {
  const p = normalizeProgress(progress);
  return THEME_ORDER.filter((id) => p.badges[id]).length;
}
