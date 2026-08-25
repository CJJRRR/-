const STORAGE_KEY = "zhan-shen-sim-save-v1";

const MODE_DATA = [
  {
    id: "play",
    title: "爽玩",
    icon: "⚡",
    desc: "信息更直给，成长更快，危险来得也更快。",
  },
  {
    id: "immersion",
    title: "沉浸",
    icon: "🌑",
    desc: "节奏更贴近原作氛围，世界会慢慢压过来。",
  },
  {
    id: "hardcore",
    title: "硬核",
    icon: "🩸",
    desc: "资源稀薄，伤势真实，误判会留下代价。",
  },
];

const PHASE_DATA = [
  {
    id: "hospital",
    title: "病院开局",
    icon: "🏥",
    desc: "从病房、走廊和护工的脚步声里醒来。",
  },
  {
    id: "nightwatch",
    title: "守夜入局",
    icon: "🗡️",
    desc: "直接站到异常事件的第一线。",
  },
  {
    id: "ruins",
    title: "废墟追查",
    icon: "🕳️",
    desc: "沿着旧案和残留神性追到禁区边缘。",
  },
  {
    id: "daily",
    title: "普通日常",
    icon: "☕",
    desc: "先把自己活明白，再决定要不要斩神。",
  },
];

const IDENTITY_DATA = [
  {
    id: "original",
    title: "原创角色",
    icon: "✍️",
    desc: "自定义名字，其余部分交给世界生成。",
  },
  {
    id: "random",
    title: "随机身份",
    icon: "🎲",
    desc: "一键生成开局身份，适合直接开跑。",
  },
  {
    id: "watcher",
    title: "守夜人预备员",
    icon: "🌙",
    desc: "默认和组织、任务、权限系统有轻度关联。",
  },
  {
    id: "civilian",
    title: "普通人",
    icon: "🫥",
    desc: "没有公开权限，但更容易接触民间线索。",
  },
];

const QUICK_ACTIONS = [
  { label: "观察四周", kind: "observe", icon: "👁️" },
  { label: "打探消息", kind: "talk", icon: "🗣️" },
  { label: "搜索线索", kind: "search", icon: "🔎" },
  { label: "联系守夜人", kind: "contact", icon: "📡" },
  { label: "休整恢复", kind: "rest", icon: "🛌" },
  { label: "潜入调查", kind: "sneak", icon: "🕶️" },
  { label: "训练斩击", kind: "train", icon: "🗡️" },
  { label: "处理交易", kind: "trade", icon: "💱" },
];

const LOCATIONS = {
  hospital: ["精神病院东楼", "医生办公室门口", "夜间走廊", "旧病房"],
  nightwatch: ["守夜人临时据点", "任务交接处", "地下演武场", "出勤车后座"],
  ruins: ["废墟边界", "塌陷地铁口", "灰雾裂缝", "封锁巷口"],
  daily: ["清晨街口", "便利店后门", "出租屋楼道", "地铁换乘层"],
};

const NPC_POOL = [
  { key: "doctor", name: "主治医师", role: "院内观察者", relation: 38, mood: "警惕" },
  { key: "nurse", name: "值班护士", role: "消息搬运者", relation: 44, mood: "克制" },
  { key: "watcher", name: "联络员", role: "任务窗口", relation: 32, mood: "务实" },
  { key: "classmate", name: "神秘同伴", role: "线索持有者", relation: 28, mood: "含糊" },
];

const WORLD_STAGES = [
  "平静表层",
  "异常渗入",
  "旧案复苏",
  "禁区开裂",
  "神性回声",
];

const state = loadState() ?? freshState();
const root = document.querySelector("#app");

function freshState() {
  return {
    stage: "mode",
    mode: null,
    phase: null,
    identity: null,
    name: "",
    trait: "",
    turn: 0,
    day: 1,
    hour: 7,
    minute: 30,
    location: "病房",
    money: 120,
    sanity: 72,
    energy: 68,
    injury: 0,
    suspicion: 18,
    spirit: 40,
    influence: 12,
    clues: 0,
    danger: 14,
    worldStage: 0,
    inventory: ["消毒绷带", "旧手机", "出入证"],
    flags: {
      doctorWatchful: false,
      watcherContacted: false,
      ruinsOpen: false,
      hiddenMemory: false,
    },
    relation: {
      doctor: 38,
      nurse: 44,
      watcher: 32,
      classmate: 28,
    },
    log: [],
    scene: [],
    suggestion: ["观察四周", "搜索线索", "打探消息"],
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...freshState(), ...parsed, relation: { ...freshState().relation, ...(parsed.relation || {}) } };
  } catch {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatTime() {
  return `D${state.day} ${String(state.hour).padStart(2, "0")}:${String(state.minute).padStart(2, "0")}`;
}

function formatSign(value) {
  return value > 0 ? `+${value}` : String(value);
}

function icon(name) {
  const svg = {
    save: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 4h10l4 4v12H5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 4v6h8V4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 20v-6h8v6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
    reset: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 8v-3h3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 8a8 8 0 1 1-1 5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M6 8l4 4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
    export: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3v12" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 9l4-4 4 4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M5 15v4h14v-4" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
    trash: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 7h16" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9 7V5h6v2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M7 7l1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
    go: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12h12" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m13 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
    spark: `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8z" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>`,
  };
  return svg[name] || "";
}

function kindLabel(kind) {
  return {
    gain: "收益",
    info: "确认",
    suspect: "疑点",
    injury: "受伤",
    relation: "关系",
    world: "世界",
  }[kind] || "记录";
}

function pushLog(kind, title, detail) {
  state.log.unshift({
    kind,
    title,
    detail,
    time: formatTime(),
  });
  state.log = state.log.slice(0, 12);
}

function addScene(paragraphs) {
  state.scene = paragraphs.slice(0, 5);
}

function advanceTime(minutes) {
  state.minute += minutes;
  while (state.minute >= 60) {
    state.minute -= 60;
    state.hour += 1;
  }
  while (state.hour >= 24) {
    state.hour -= 24;
    state.day += 1;
  }
}

function adjustStat(key, delta, min = 0, max = 100) {
  state[key] = clamp(state[key] + delta, min, max);
}

function updateWorldStage() {
  const score = state.clues + Math.floor(state.danger / 18) + Math.floor(state.influence / 25) + (state.flags.watcherContacted ? 1 : 0);
  const next = clamp(score, 0, WORLD_STAGES.length - 1);
  state.worldStage = Math.max(state.worldStage, next);
}

function getCurrentLocation() {
  const pool = LOCATIONS[state.phase] || LOCATIONS.daily;
  return pool[Math.min(state.turn % pool.length, pool.length - 1)];
}

function buildIntroScene() {
  const location = getCurrentLocation();
  const mood = {
    play: "你可以把一切都拉快一点，错一步也仍有转圜。",
    immersion: "世界会缓慢收紧，像走廊尽头那盏坏灯。",
    hardcore: "每一次试探都在消耗余地，代价会被认真记账。",
  }[state.mode];
  const phaseText = {
    hospital: "你在病院里醒来，消毒水味和锁门声在同一条线里回荡。",
    nightwatch: "你已经踩进守夜人的任务缝隙，异常像潮水一样挤过来。",
    ruins: "废墟的灰尘和神性残响混在一起，连呼吸都像在翻旧案。",
    daily: "白天像是普通日子，直到你开始听见不该出现的声音。",
  }[state.phase];
  addScene([
    `${phaseText} 此刻你站在${location}，灯光发白，空气里有一点金属味。`,
    `你能看见的规则很少，但每一条都是真的：钱会减少，伤口会疼，关系会变，线索也会把人带到更深的地方。`,
    `当前模式是「${modeTitle(state.mode)}」${mood ? `，${mood}` : ""}。你可以直接输入想做的事，也可以点下面的建议。`,
  ]);
  pushLog("world", "开局", `${modeTitle(state.mode)} · ${phaseTitle(state.phase)} · ${identityTitle(state.identity)}`);
}

function modeTitle(id) {
  return MODE_DATA.find((item) => item.id === id)?.title || "未选择";
}

function phaseTitle(id) {
  return PHASE_DATA.find((item) => item.id === id)?.title || "未选择";
}

function identityTitle(id) {
  return IDENTITY_DATA.find((item) => item.id === id)?.title || "未选择";
}

function identityDesc(id) {
  return IDENTITY_DATA.find((item) => item.id === id)?.desc || "";
}

function generateName() {
  const parts = ["沈", "林", "顾", "叶", "许", "陆", "周", "苏", "唐", "江"];
  const tails = ["临", "澈", "予安", "闻舟", "见霜", "砚秋", "长夜", "惊鸿", "未迟", "亦行"];
  return `${choice(parts)}${choice(tails)}`;
}

function buildIdentityPayload() {
  if (state.identity === "random") {
    return {
      name: generateName(),
      trait: choice(["记忆断层", "夜视过人", "格外冷静", "反应极快", "对异常敏感"]),
    };
  }
  if (state.identity === "watcher") {
    return {
      name: state.name || generateName(),
      trait: state.trait || "懂规矩，知道怎么把话说到任务里。",
    };
  }
  if (state.identity === "civilian") {
    return {
      name: state.name || generateName(),
      trait: state.trait || "表面普通，手里握着不愿公开的记忆。",
    };
  }
  return {
    name: state.name || generateName(),
    trait: state.trait || "你对自己的过去只记得一部分。",
  };
}

function initializeRun() {
  const payload = buildIdentityPayload();
  state.name = payload.name;
  state.trait = payload.trait;
  state.turn = 0;
  state.day = 1;
  state.hour = state.phase === "nightwatch" ? 20 : 7;
  state.minute = 30;
  state.location = getCurrentLocation();
  state.money = state.mode === "hardcore" ? 80 : 120;
  state.sanity = state.mode === "hardcore" ? 62 : 72;
  state.energy = 68;
  state.injury = 0;
  state.suspicion = state.identity === "watcher" ? 12 : 18;
  state.spirit = state.identity === "watcher" ? 48 : 40;
  state.influence = state.identity === "civilian" ? 14 : 18;
  state.clues = state.phase === "ruins" ? 2 : 0;
  state.danger = state.phase === "ruins" ? 24 : 14;
  state.worldStage = 0;
  state.inventory = state.identity === "watcher" ? ["守夜证件", "战术手电", "旧手机"] : ["消毒绷带", "旧手机", "出入证"];
  state.flags = {
    doctorWatchful: state.phase === "hospital",
    watcherContacted: state.identity === "watcher",
    ruinsOpen: state.phase === "ruins",
    hiddenMemory: state.identity === "original" ? false : true,
  };
  state.relation = {
    doctor: state.phase === "hospital" ? 46 : 36,
    nurse: 44,
    watcher: state.identity === "watcher" ? 48 : 32,
    classmate: state.identity === "civilian" ? 36 : 28,
  };
  state.log = [];
  state.scene = [];
  state.suggestion = defaultSuggestions();
  updateWorldStage();
  buildIntroScene();
  state.stage = "game";
  saveState();
  render();
}

function defaultSuggestions() {
  const base = ["观察四周", "搜索线索", "打探消息"];
  if (state.identity === "watcher") base.unshift("联系守夜人");
  if (state.phase === "ruins") base.unshift("潜入调查");
  if (state.sanity < 45) base.push("休整恢复");
  return base.slice(0, 4);
}

function classifyIntent(text) {
  const t = text.trim();
  if (!t) return "observe";
  if (/休|睡|歇|养|恢复/.test(t)) return "rest";
  if (/聊|问|打听|消息|对话|谈/.test(t)) return "talk";
  if (/找|搜|查|看|线索|翻/.test(t)) return "search";
  if (/联络|联系|守夜|队里|组织|电话|发消息/.test(t)) return "contact";
  if (/潜|偷|溜|潜入|躲|暗中/.test(t)) return "sneak";
  if (/打|斩|杀|战|练|训练|出手/.test(t)) return "train";
  if (/买|卖|交易|换|钱|物资/.test(t)) return "trade";
  if (/离开|去|前往|转移|跑/.test(t)) return "move";
  if (/观察|看|听|等|留意|盯/.test(t)) return "observe";
  return "observe";
}

function sceneLead(actionLabel, location, resultLead) {
  return [
    `${actionLabel}之后，你没有立刻得到答案。${location}里的声音仍在继续，像一台旧机器慢慢转动。`,
    `你沿着${choice(["地砖缝", "走廊边线", "窗沿反光", "墙角阴影"])}看过去，细节并不友好，但它们至少是真实的。`,
    `${resultLead} 你现在可以继续追问，也可以换一种更冒险的做法。`,
  ];
}

function turnSummary(kind, title, detail) {
  const icons = {
    gain: "green",
    info: "blue",
    suspect: "amber",
    injury: "red",
    relation: "purple",
    world: "gold",
  };
  return { kind, tone: icons[kind] || "blue", title, detail };
}

function executeAction(kind, text) {
  const actionLabel = text.trim() || QUICK_ACTIONS.find((item) => item.kind === kind)?.label || "行动";
  state.turn += 1;
  const location = getCurrentLocation();
  state.location = location;
  const outcomes = [];
  const baseAdvance = state.mode === "hardcore" ? rand(22, 38) : state.mode === "play" ? rand(16, 28) : rand(18, 32);
  let narrative = "";

  switch (kind) {
    case "rest": {
      advanceTime(baseAdvance);
      const gain = state.mode === "hardcore" ? 11 : 15;
      adjustStat("energy", gain);
      adjustStat("sanity", 6);
      adjustStat("injury", -1, 0, 100);
      narrative = "你把呼吸放慢，先让身体归位。";
      outcomes.push(turnSummary("gain", "休整完成", `精力 ${formatSign(gain)}，理智 ${formatSign(6)}。`));
      break;
    }
    case "talk": {
      advanceTime(baseAdvance);
      adjustStat("influence", 3);
      adjustStat("suspicion", -1, 0, 100);
      const npc = choice(NPC_POOL);
      state.relation[npc.key] = clamp(state.relation[npc.key] + rand(1, 4), 0, 100);
      const clueGain = Math.random() > 0.5 ? 1 : 0;
      state.clues += clueGain;
      narrative = `你绕着${npc.name}说话，话里藏着试探，也藏着礼貌。`;
      outcomes.push(turnSummary("relation", "关系变化", `${npc.name} 好感 ${formatSign(clueGain ? 4 : 2)}。`));
      if (clueGain) outcomes.push(turnSummary("info", "新线索", "对方提到一个被反复避开的名字。"));
      break;
    }
    case "search": {
      advanceTime(baseAdvance);
      const found = rand(0, 2);
      state.clues += found;
      const gain = found ? rand(10, 40) : 0;
      state.money += gain;
      state.suspicion += 2;
      narrative = "你把能翻的地方都翻了一遍，手指摸到的每个角落都像在回避什么。";
      outcomes.push(turnSummary(found ? "info" : "suspect", found ? "搜到东西" : "没有立刻收获", found ? `获得 ${found} 枚线索。` : "留下了些许被注意到的痕迹。"));
      if (found) outcomes.push(turnSummary("gain", "附带收益", `额外获得 ${gain} 金。`));
      break;
    }
    case "contact": {
      advanceTime(baseAdvance);
      state.flags.watcherContacted = true;
      state.relation.watcher = clamp(state.relation.watcher + rand(3, 7), 0, 100);
      state.influence += 2;
      state.danger += 4;
      narrative = "你把消息送了出去，回应来得不快，但确实来了。";
      outcomes.push(turnSummary("world", "组织回响", "守夜系统开始对你留档。"));
      outcomes.push(turnSummary("relation", "联络推进", `联络员关系 ${formatSign(rand(3, 7))}。`));
      break;
    }
    case "sneak": {
      advanceTime(baseAdvance + 8);
      const success = roll(55 + state.energy - state.suspicion / 2 + (state.mode === "play" ? 12 : 0));
      if (success) {
        state.clues += 2;
        state.danger += 6;
        state.suspicion += 1;
        narrative = "你贴着阴影走进更深的地方，没惊动谁。";
        outcomes.push(turnSummary("info", "潜入成功", "拿到两条关键线索。"));
      } else {
        state.injury += 8;
        state.suspicion += 6;
        state.danger += 10;
        narrative = "你低估了守卫和地形，衣角被刮破，身体也跟着吃了亏。";
        outcomes.push(turnSummary("injury", "潜入失败", "受伤加重，行动痕迹也更明显了。"));
      }
      break;
    }
    case "train": {
      advanceTime(baseAdvance);
      state.spirit += 6;
      state.energy -= 8;
      state.danger += 2;
      state.influence += 1;
      narrative = "你把动作拆开再合上，像是在和自己的影子过招。";
      outcomes.push(turnSummary("gain", "训练完成", "精神力量与出手熟练度都在缓慢增长。"));
      break;
    }
    case "trade": {
      advanceTime(baseAdvance);
      const cost = rand(15, 40);
      if (state.money >= cost) {
        state.money -= cost;
        state.inventory.push(choice(["压缩饼干", "备用药片", "符纸", "通讯电池"]));
        state.suspicion = clamp(state.suspicion - 1, 0, 100);
        narrative = "你用钱换来一小份确定性，代价不算低。";
        outcomes.push(turnSummary("gain", "交易完成", `花费 ${cost}，拿到一件实用物资。`));
      } else {
        state.suspicion += 3;
        narrative = "钱不够，交易被迫收口，只留下几句意义不明的暗示。";
        outcomes.push(turnSummary("suspect", "交易受阻", "资金不足，且被对方记住了。"));
      }
      break;
    }
    case "move": {
      advanceTime(baseAdvance);
      state.location = choice([].concat(...Object.values(LOCATIONS)));
      state.danger += 2;
      narrative = `你换了个位置，视野也跟着变了。${state.location}里有新的声音。`;
      outcomes.push(turnSummary("world", "位置变动", `当前地点更新为 ${state.location}。`));
      break;
    }
    case "observe":
    default: {
      advanceTime(baseAdvance);
      const find = rand(0, 2);
      state.clues += find;
      state.suspicion += 1;
      narrative = "你没有急着出手，只是站着看。很多真相都怕被看久一点。";
      outcomes.push(turnSummary(find ? "info" : "world", find ? "看见了细节" : "观察延续", find ? `发现 ${find} 条可用细节。` : "暂时没有新的突破，但气氛有了变化。"));
      break;
    }
  }

  applyWorldConsequences(kind);
  updateWorldStage();
  state.sanity = clamp(state.sanity, 0, 100);
  state.energy = clamp(state.energy, 0, 100);
  state.injury = clamp(state.injury, 0, 100);
  state.suspicion = clamp(state.suspicion, 0, 100);
  state.spirit = clamp(state.spirit, 0, 100);
  state.influence = clamp(state.influence, 0, 100);
  state.clues = Math.max(0, state.clues);
  saveState();
  addScene(sceneLead(actionLabel, location, narrative));
  outcomes.forEach((item) => pushLog(item.kind, item.title, item.detail));
  state.suggestion = suggestActions(kind);
  render();
}

function roll(chance) {
  return Math.random() * 100 < chance;
}

function applyWorldConsequences(kind) {
  if (state.worldStage >= 2 && !state.flags.hiddenMemory && state.clues >= 3) {
    state.flags.hiddenMemory = true;
    pushLog("world", "记忆回潮", "某段被遮住的记忆开始重新露头。");
    state.sanity = clamp(state.sanity - 2, 0, 100);
  }
  if (kind === "search" || kind === "sneak") {
    state.danger += 3;
    if (!state.flags.doctorWatchful && state.phase === "hospital") {
      state.flags.doctorWatchful = true;
      pushLog("suspect", "被注意到", "院内有人开始留意你的举动。");
    }
  }
  if (state.injury >= 25) {
    state.energy = clamp(state.energy - 4, 0, 100);
    pushLog("injury", "状态恶化", "伤势在持续拖慢你的行动。");
  }
  if (state.sanity <= 30) {
    state.suspicion = clamp(state.suspicion + 2, 0, 100);
  }
  if (state.clues >= 6 && !state.flags.ruinsOpen) {
    state.flags.ruinsOpen = true;
    pushLog("world", "新区域开放", "禁区边缘已经可以被直接追查。");
  }
}

function suggestActions(kind) {
  const suggestions = new Set(["观察四周", "搜索线索", "打探消息"]);
  if (state.flags.watcherContacted) suggestions.add("联系守夜人");
  if (state.flags.ruinsOpen) suggestions.add("潜入调查");
  if (state.energy < 40) suggestions.add("休整恢复");
  if (state.money < 80) suggestions.add("处理交易");
  if (state.injury > 12) suggestions.add("休整恢复");
  if (kind === "rest") suggestions.add("训练斩击");
  return [...suggestions].slice(0, 4);
}

function renderModeView() {
  const active = state.stage === "mode";
  const selected = state.mode;
  root.innerHTML = `
    <div class="view mode-view ${active ? "is-active" : ""}">
      <section class="mode-card">
        <div class="title-row">
          <div class="title-block">
            <div class="eyebrow">Life Simulator / 自由叙事</div>
            <h1 class="app-title">《我在精神病院斩神》高度自由的人生模拟器</h1>
            <p class="app-lead">先选一种节奏，再进入开局。世界会自己往前走，你负责决定要不要拦、要不要追、要不要赌一把。</p>
          </div>
          <div class="setup-meta">
            <span class="tag">可存档</span>
            <span class="tag">自由输入</span>
            <span class="tag">后果真实</span>
          </div>
        </div>
        <div class="mode-grid">
          ${MODE_DATA.map(
            (mode) => `
              <button class="mode-tile ${selected === mode.id ? "is-selected" : ""}" data-mode="${mode.id}">
                <div class="tile-top">
                  <div class="tile-icon">${mode.icon}</div>
                  <span class="tag">MODE</span>
                </div>
                <h3 class="tile-title">${mode.title}</h3>
                <p class="tile-desc">${mode.desc}</p>
              </button>
            `,
          ).join("")}
        </div>
        <div class="hint-line">
          <span class="hint-mark">提示</span>
          <span>这个屏幕只做一件事：先选模式。后面的入局、身份和行动都会接着展开。</span>
        </div>
      </section>
    </div>
  `;
  root.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.mode = button.dataset.mode;
      state.stage = "setup";
      saveState();
      render();
    });
  });
}

function renderSetupView() {
  const selectedPhase = state.phase;
  const selectedIdentity = state.identity;
  root.innerHTML = `
    <div class="view setup-view is-active">
      <section class="setup-card">
        <div class="setup-head">
          <div>
            <h2 class="setup-title">进入世界之前，先定开局</h2>
            <p class="setup-sub">你已经选了「${modeTitle(state.mode)}」。现在只需要决定从哪一幕醒来，以及你是谁。</p>
          </div>
          <div class="setup-meta">
            <span class="tag">模式：${modeTitle(state.mode)}</span>
            <span class="tag">规则：自由行动</span>
          </div>
        </div>
        <div class="setup-grid">
          <section class="setup-section">
            <p class="section-label">入局阶段</p>
            <div class="phase-grid">
              ${PHASE_DATA.map(
                (phase) => `
                  <button class="phase-tile ${selectedPhase === phase.id ? "is-selected" : ""}" data-phase="${phase.id}">
                    <div class="tile-top">
                      <div class="tile-icon">${phase.icon}</div>
                      <span class="tag">PHASE</span>
                    </div>
                    <h3 class="tile-title">${phase.title}</h3>
                    <p class="tile-desc">${phase.desc}</p>
                  </button>
                `,
              ).join("")}
            </div>
          </section>
          <section class="setup-section">
            <p class="section-label">身份</p>
            <div class="identity-grid">
              ${IDENTITY_DATA.map(
                (identity) => `
                  <button class="identity-tile ${selectedIdentity === identity.id ? "is-selected" : ""}" data-identity="${identity.id}">
                    <div class="tile-top">
                      <div class="tile-icon">${identity.icon}</div>
                      <span class="tag">ID</span>
                    </div>
                    <h3 class="tile-title">${identity.title}</h3>
                    <p class="tile-desc">${identity.desc}</p>
                  </button>
                `,
              ).join("")}
            </div>

            <div class="field ${selectedIdentity === "original" || selectedIdentity === "random" ? "" : "hidden"}">
              <label for="name-input">名字</label>
              <input id="name-input" class="input" value="${escapeHtml(state.name)}" placeholder="可留空，系统会自动补齐" />
            </div>

            <div class="field ${selectedIdentity === "original" || selectedIdentity === "random" ? "" : "hidden"}">
              <label for="trait-input">一句人设</label>
              <input id="trait-input" class="input" value="${escapeHtml(state.trait)}" placeholder="例如：对异常特别敏感" />
            </div>

            <div class="button-row" style="margin-top: 14px;">
              <button class="ghost-btn is-primary" id="start-btn">${icon("go")}开始模拟</button>
              <button class="ghost-btn" id="random-btn">${icon("spark")}随机补全</button>
              <button class="ghost-btn is-danger" id="back-mode-btn">${icon("reset")}返回模式</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  `;

  root.querySelectorAll("[data-phase]").forEach((button) => {
    button.addEventListener("click", () => {
      state.phase = button.dataset.phase;
      state.location = getCurrentLocation();
      saveState();
      render();
    });
  });
  root.querySelectorAll("[data-identity]").forEach((button) => {
    button.addEventListener("click", () => {
      state.identity = button.dataset.identity;
      if (state.identity === "random") {
        state.name = generateName();
        state.trait = choice(["记忆里有空白", "比别人更早看见异常", "总能听见不该听见的声音"]);
      }
      saveState();
      render();
    });
  });

  const startBtn = root.querySelector("#start-btn");
  startBtn?.addEventListener("click", () => {
    const nameInput = root.querySelector("#name-input");
    const traitInput = root.querySelector("#trait-input");
    if (nameInput) state.name = nameInput.value.trim();
    if (traitInput) state.trait = traitInput.value.trim();
    if (!state.phase || !state.identity) {
      pushLog("world", "尚未完成", "你还需要先选入局阶段和身份。");
      render();
      return;
    }
    initializeRun();
  });

  root.querySelector("#random-btn")?.addEventListener("click", () => {
    state.name = generateName();
    state.trait = choice([
      "擅长从细节里找出不对劲的地方",
      "表面冷静，实际对异常很敏感",
      "在混乱里反而容易做出判断",
    ]);
    saveState();
    render();
  });

  root.querySelector("#back-mode-btn")?.addEventListener("click", () => {
    state.stage = "mode";
    state.mode = null;
    state.phase = null;
    state.identity = null;
    saveState();
    render();
  });
}

function renderGameView() {
  const sanityWidth = clamp(state.sanity, 0, 100);
  const energyWidth = clamp(state.energy, 0, 100);
  const worldWidth = ((state.worldStage + 1) / WORLD_STAGES.length) * 100;
  const relationList = Object.entries(state.relation).map(([key, value]) => {
    const npc = NPC_POOL.find((item) => item.key === key);
    return {
      ...npc,
      value,
    };
  });

  root.innerHTML = `
    <div class="view game-view is-active">
      <div class="shell">
        <header class="shell-top">
          <div class="shell-brand">
            <strong>${escapeHtml(state.name || "未命名主角")} · ${identityTitle(state.identity)}</strong>
            <span>${phaseTitle(state.phase)} · ${modeTitle(state.mode)} · ${formatTime()}</span>
          </div>
          <div class="shell-actions">
            <span class="state-pill">世界阶段：${WORLD_STAGES[state.worldStage]}</span>
            <button class="panel-icon-btn" data-save title="存档">${icon("save")}</button>
            <button class="panel-icon-btn" data-export title="导出">${icon("export")}</button>
            <button class="panel-icon-btn" data-reset title="重开">${icon("trash")}</button>
          </div>
        </header>

        <div class="layout">
          <main class="story-panel">
            <div class="story-top">
              <div>
                <h2 class="story-title">${state.location}</h2>
                <p class="story-sub">${identityDesc(state.identity)} 你的任务不是选对答案，而是承受得住后果。</p>
              </div>
              <span class="state-pill">当前行动可自由输入</span>
            </div>

            <div class="scene-band" id="scene-band">
              ${state.scene.length
                ? state.scene.map((line) => `<p>${escapeHtml(line)}</p>`).join("")
                : `<p>世界在等你出手。</p><p>输入一句话，或者点一个动作，故事就会自己往前走。</p><p>你看到的内容会变，没看到的内容也会变。</p>`}
            </div>

            <div class="suggestions">
              ${state.suggestion.map((item) => `<button class="chip ${chipClass(item)}" data-quick="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("")}
            </div>

            <div class="composer">
              <textarea id="action-input" class="textarea" placeholder="直接输入你的行动，例如：去找主治医师确认昨晚那道脚步声。"></textarea>
              <div class="composer-row">
                <button class="action-btn is-primary" id="submit-btn">${icon("go")}执行行动</button>
                <button class="action-btn" id="hint-btn">${icon("spark")}世界自转</button>
              </div>
            </div>
          </main>

          <aside class="sidebar-panel">
            <section>
              <h3 class="sidebar-title">状态</h3>
              <div class="status-grid">
                ${metric("金钱", state.money, "amber", "元")}
                ${metric("理智", state.sanity, "blue", "%")}
                ${metric("体力", state.energy, "green", "%")}
                ${metric("伤势", state.injury, "red", "%")}
                ${metric("线索", state.clues, "gold", "条")}
                ${metric("疑心", state.suspicion, "purple", "%")}
              </div>
            </section>
            <section>
              <h3 class="sidebar-title">资源条</h3>
              <div class="metric">
                <span>理智</span>
                <strong>${state.sanity}/100</strong>
                <div class="meter blue"><i style="width:${sanityWidth}%"></i></div>
              </div>
              <div class="metric" style="margin-top:10px;">
                <span>体力</span>
                <strong>${state.energy}/100</strong>
                <div class="meter"><i style="width:${energyWidth}%"></i></div>
              </div>
              <div class="metric" style="margin-top:10px;">
                <span>伤势</span>
                <strong>${state.injury}/100</strong>
                <div class="meter red"><i style="width:${clamp(state.injury, 0, 100)}%"></i></div>
              </div>
              <div class="metric" style="margin-top:10px;">
                <span>世界推进</span>
                <strong>${WORLD_STAGES[state.worldStage]}</strong>
                <div class="meter gold"><i style="width:${worldWidth}%"></i></div>
              </div>
            </section>

            <section>
              <h3 class="sidebar-title">关系</h3>
              <div class="list">
                ${relationList
                  .map(
                    (npc) => `
                      <div class="row-item">
                        <header>
                          <strong>${npc.name}</strong>
                          <span class="tag">${npc.mood}</span>
                        </header>
                        <p>${npc.role}</p>
                        <div class="meter purple"><i style="width:${npc.value}%"></i></div>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </section>

            <section>
              <h3 class="sidebar-title">物品</h3>
              <div class="list">
                ${state.inventory.length ? state.inventory.map((item) => `<div class="row-item"><p>${escapeHtml(item)}</p></div>`).join("") : `<div class="empty">背包为空。可以通过交易、搜索或任务推进拿到新东西。</div>`}
              </div>
            </section>
          </aside>
        </div>

        <div class="layout" style="margin-top: 16px;">
          <section class="story-panel">
            <div class="story-top">
              <div>
                <h2 class="story-title">最近记录</h2>
                <p class="story-sub">绿色是收益，蓝色是确认，橙色是疑点，红色是伤势，紫色是关系，金色是世界阶段。</p>
              </div>
            </div>
            <div class="log">
              ${state.log.length
                ? state.log.map((item) => logMarkup(item)).join("")
                : `<div class="empty">还没有记录。执行一次行动，世界就会开始留下痕迹。</div>`}
            </div>
          </section>
          <aside class="sidebar-panel">
            <section>
              <h3 class="sidebar-title">快速动作</h3>
              <div class="action-stack">
                ${QUICK_ACTIONS.map(
                  (action) => `
                    <button class="action-btn" data-action="${action.kind}">
                      <span>${action.icon}</span>
                      <span>${action.label}</span>
                    </button>
                  `,
                ).join("")}
              </div>
            </section>
            <section>
              <h3 class="sidebar-title">世界提示</h3>
              <div class="row-item">
                <header>
                  <strong>定位</strong>
                  <span class="tag">${state.phase === "hospital" ? "封闭" : state.phase === "ruins" ? "高危" : "开放"}</span>
                </header>
                <p>${locationHint(state.phase)}</p>
              </div>
              <div class="row-item" style="margin-top:10px;">
                <header>
                  <strong>下一步</strong>
                  <span class="tag">建议</span>
                </header>
                <p>${state.suggestion.join(" / ")}</p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  `;

  root.querySelectorAll("[data-quick]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = classifyIntent(button.dataset.quick || "");
      executeAction(kind, button.dataset.quick || "");
    });
  });

  root.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.action || "observe";
      const label = QUICK_ACTIONS.find((item) => item.kind === kind)?.label || "行动";
      executeAction(kind, label);
    });
  });

  root.querySelector("#submit-btn")?.addEventListener("click", () => {
    const input = root.querySelector("#action-input");
    const text = input?.value || "";
    executeAction(classifyIntent(text), text);
    if (input) input.value = "";
  });

  root.querySelector("#hint-btn")?.addEventListener("click", () => {
    executeAction("observe", choice(["站着听风声", "检查窗外", "盯着走廊尽头", "先不说话"])) ;
  });

  root.querySelector("#action-input")?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      root.querySelector("#submit-btn")?.dispatchEvent(new Event("click"));
    }
  });

  root.querySelector("[data-save]")?.addEventListener("click", () => {
    saveState();
    toast("已自动存档");
  });
  root.querySelector("[data-export]")?.addEventListener("click", exportSave);
  root.querySelector("[data-reset]")?.addEventListener("click", resetGame);
}

function metric(label, value, accent, suffix) {
  return `
    <div class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}${suffix ? `<small style="color:var(--muted);font-size:0.72rem;">${escapeHtml(suffix)}</small>` : ""}</strong>
      <div class="meter ${accent}"><i style="width:${clamp(Number(value) * (label === "线索" ? 14 : 1), 0, 100)}%"></i></div>
    </div>
  `;
}

function chipClass(label) {
  if (/联系|守夜/.test(label)) return "is-purple";
  if (/搜索|观察|打探/.test(label)) return "is-blue";
  if (/休整|训练/.test(label)) return "is-gold";
  if (/潜入|交易/.test(label)) return "is-red";
  return "";
}

function logMarkup(item) {
  return `
    <article class="log-item kind-${item.kind}">
      <div class="log-top">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.time)}</span>
      </div>
      <p><span class="tag">${kindLabel(item.kind)}</span> ${escapeHtml(item.detail)}</p>
    </article>
  `;
}

function locationHint(phase) {
  return {
    hospital: "这里的流程、门禁和记录本都是真规则。只要你看得够久，就会发现谁在故意漏掉什么。",
    nightwatch: "守夜系统里每条命令都有代价，权限能开路，也能把人写进名单。",
    ruins: "废墟里不缺痕迹，缺的是敢把痕迹连成线的人。",
    daily: "普通日常最危险的地方，是它总想让你以为一切没变。",
  }[phase];
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function exportSave() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "zhan-shen-sim-save.json";
  a.click();
  URL.revokeObjectURL(url);
  toast("已导出存档");
}

function resetGame() {
  if (!confirm("重开会清空当前存档，确定吗？")) return;
  localStorage.removeItem(STORAGE_KEY);
  Object.assign(state, freshState());
  render();
}

function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("is-visible");
  clearTimeout(toast._timer);
  toast._timer = window.setTimeout(() => el.classList.remove("is-visible"), 1600);
}

function render() {
  if (state.stage === "mode") {
    renderModeView();
  } else if (state.stage === "setup") {
    renderSetupView();
  } else {
    renderGameView();
  }
}

render();

window.addEventListener("beforeunload", saveState);
