/**
 * 核心类型定义 — 扩展版
 * 包含战斗状态、塔系统、角色、天气、商店等完整类型。
 */

import { ALL_CARD_DEFS } from "./cardDefs";

// ========== 卡牌类型 ==========

export type CardKind = keyof typeof ALL_CARD_DEFS;
export type PlayerSide = "玩家" | "机器人";

/** 单张卡牌实例 */
export interface CardInstance {
  id: string;
  kind: CardKind;
}

// ========== 天气 ==========

export type Weather =
  | "晴"
  | "雨季"     // 金钱+50%
  | "烈日"     // .5牌+0.5
  | "冰雹"     // .5牌-0.5
  | "暖风";    // 无上限回合

// ========== 角色 ==========

export type CharacterId = "男1" | "男2" | "女1" | "女2";

export interface Character {
  id: CharacterId;
  name: string;
  passive: string;
  /** 每次对弈允许"时间回溯"次数 */
  rewindCount: number;
  /** 同层可停留天数（null=无限制） */
  stayDaysOverride: number | null;
  /** 金钱获得加成（乘法因子） */
  goldMultiplier: number;
  /** 击败敌人获得额外卡牌数 */
  extraCardsOnWin: number;
}

export const CHARACTERS: Record<CharacterId, Character> = {
  男1: {
    id: "男1",
    name: "男1",
    passive: "时间回溯：每场对弈1次",
    rewindCount: 1,
    stayDaysOverride: null,
    goldMultiplier: 1,
    extraCardsOnWin: 0,
  },
  男2: {
    id: "男2",
    name: "男2",
    passive: "可同层待4天",
    rewindCount: 0,
    stayDaysOverride: 4,
    goldMultiplier: 1,
    extraCardsOnWin: 0,
  },
  女1: {
    id: "女1",
    name: "女1",
    passive: "金钱+20%",
    rewindCount: 0,
    stayDaysOverride: null,
    goldMultiplier: 1.2,
    extraCardsOnWin: 0,
  },
  女2: {
    id: "女2",
    name: "女2",
    passive: "击败敌人额外获得1张卡",
    rewindCount: 0,
    stayDaysOverride: null,
    goldMultiplier: 1,
    extraCardsOnWin: 1,
  },
};

// ========== 肉鸽 Buff ==========

export type RoguelikeBuff =
  | "对话全选项"
  | "更多初始资金"
  | "商店不卖光"
  | "平民随机能力"
  | "国王随机能力"
  | "随机卡牌数量"
  | "休息多资金"
  | "偷盗能力"
  | "换卡功能"
  | "混乱自选三张";

export const ROGUELIKE_BUFFS: RoguelikeBuff[] = [
  "对话全选项",
  "更多初始资金",
  "商店不卖光",
  "平民随机能力",
  "国王随机能力",
  "随机卡牌数量",
  "休息多资金",
  "偷盗能力",
  "换卡功能",
  "混乱自选三张",
];

export const ROGUELIKE_BUFF_DESCRIPTIONS: Record<RoguelikeBuff, string> = {
  对话全选项: "与人物对话时可尝试全部选项",
  更多初始资金: "拥有更多初始资金",
  商店不卖光: "商店商品每日刷新，空缺也会补货",
  平民随机能力: "平民卡每局能力值在3—0间随机",
  国王随机能力: "国王卡每局能力值在4—0间随机",
  随机卡牌数量: "获得卡牌时数量在0—2中随机",
  休息多资金: "休息（打工）将获得更多资金",
  偷盗能力: "拥有「偷盗」能力，但可能被暴打",
  换卡功能: "每层拥有一次「换卡」功能",
  混乱自选三张: "与Boss外战斗完全混乱，开局自选三张",
};

// ========== 塔 ==========

/** AI 难度档位 */
export type AiDifficulty = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface TowerFloor {
  floor: number;
  name: string;
  bossName: string;
  bossDialogue: string[];
  /** Boss手牌数量 */
  bossHandSize: number;
  /** Boss不可见牌数量 */
  bossHiddenCount: number;
  /** Boss可见牌数量 */
  bossVisibleCount: number;
  /** AI难度 1-10（1=纯随机，10=完美搜索） */
  difficulty: AiDifficulty;
  /** 本层NPC名字 */
  npcName: string;
  /** NPC每日提示 */
  npcHint: string;
  /** 访问NPC输了扣多少钱 */
  npcPenalty: number;
}

export const TOWER_FLOORS: TowerFloor[] = [
  {
    floor: 1,
    name: "第一层·入口",
    bossName: "守门人",
    bossDialogue: ["你就是挑战者？", "来吧，让我看看你的实力。", "不错，但你还不够格。"],
    bossHandSize: 7,
    bossHiddenCount: 1,
    bossVisibleCount: 3,
    difficulty: 1,
    npcName: "塔灵",
    npcHint: "这层的NPC……似乎在喃喃自语",
    npcPenalty: 10,
  },
  {
    floor: 2,
    name: "第二层·书库",
    bossName: "管家",
    bossDialogue: ["失礼了，这是我的职责。", "你的牌技不错。", "这一局，我赢了。"],
    bossHandSize: 8,
    bossHiddenCount: 1,
    bossVisibleCount: 4,
    difficulty: 2,
    npcName: "旧书商",
    npcHint: "这层的NPC……似乎在整理什么",
    npcPenalty: 15,
  },
  {
    floor: 3,
    name: "第三层·暗道",
    bossName: "刺客长",
    bossDialogue: ["影子的王国没有胜者。", "你的每一步我都看穿了。", "再见了。"],
    bossHandSize: 8,
    bossHiddenCount: 1,
    bossVisibleCount: 5,
    difficulty: 4,
    npcName: "流浪者",
    npcHint: "这层的NPC……看起来很危险",
    npcPenalty: 20,
  },
  {
    floor: 4,
    name: "第四层·宫殿",
    bossName: "王后",
    bossDialogue: ["皇座之下，皆为尘埃。", "你很有勇气。", "但勇气救不了你。"],
    bossHandSize: 9,
    bossHiddenCount: 2,
    bossVisibleCount: 5,
    difficulty: 5,
    npcName: "侍女长",
    npcHint: "这层的NPC……举止端庄",
    npcPenalty: 25,
  },
  {
    floor: 5,
    name: "第五层·议厅",
    bossName: "大臣",
    bossDialogue: ["王座倾覆，方显本色。", "你的策略我很欣赏。", "但这不是你的战场。"],
    bossHandSize: 9,
    bossHiddenCount: 2,
    bossVisibleCount: 6,
    difficulty: 7,
    npcName: "老祭司",
    npcHint: "这层的NPC……似乎在等待什么",
    npcPenalty: 30,
  },
  {
    floor: 6,
    name: "第六层·祭坛",
    bossName: "摄政王",
    bossDialogue: ["塔的意志，由我来执行。", "你的旅程到此为止了。", "不错的尝试。"],
    bossHandSize: 10,
    bossHiddenCount: 2,
    bossVisibleCount: 7,
    difficulty: 8,
    npcName: "术士",
    npcHint: "这层的NPC……散发着不安的气息",
    npcPenalty: 35,
  },
  {
    floor: 7,
    name: "第七层·王座",
    bossName: "塔主",
    bossDialogue: ["能走到这里，你已证明了自己。", "最后一局，我将全力以赴。", "接受命运的裁决吧。"],
    bossHandSize: 10,
    bossHiddenCount: 2,
    bossVisibleCount: 8,
    difficulty: 10,
    npcName: "影子",
    npcHint: "这层的NPC……无处不在",
    npcPenalty: 40,
  },
];

// ========== 战斗阶段 ==========

export type BattlePhase =
  | "等待玩家选牌"   // 玩家选牌
  | "等待玩家确认"   // 已选牌，等待点确认
  | "展示结算"       // 显示本回合结果
  | "使用一次性卡牌"  // 玩家可以打一次性卡牌
  | "游戏结束"       // 战斗结束
  | "选卡奖励";      // 选卡阶段

export interface BattleResult {
  winner: PlayerSide | "平局";
  /** 战斗持续回合数 */
  turns: number;
  /** 玩家获得的金币（未计算其他加成） */
  baseGold: number;
}

// ========== 商店 ==========

export type ShopItemType = "能力卡牌" | "功能卡牌" | "基础卡牌" | "一次性卡牌";

export interface ShopItem {
  id: string;
  kind: CardKind;
  price: number;
  /** 是否已售出 */
  sold: boolean;
  type: ShopItemType;
}

// ========== 每日行动 ==========

export type DailyAction = "挑战Boss" | "商店" | "交谈" | "打工" | "休息" | null;

// ========== 游戏主状态 ==========

export interface TowerRunState {
  /** 当前层 1-7 */
  currentFloor: number;
  /** 当前是第几天 */
  currentDay: number;
  /** 资金 */
  gold: number;
  /** 天气 */
  weather: Weather;
  /** 当前选中的角色 */
  character: CharacterId;
  /** 肉鸽buff */
  buff: RoguelikeBuff | null;
  /** 已解锁的卡牌列表 */
  unlockedCards: CardKind[];
  /** 已解锁的成就 */
  unlockedAchievements: string[];
  /** 已解锁的结局 */
  unlockedEndings: string[];
  /** 已解锁的角色传记 */
  unlockedBios: string[];
  /** 角色传记对话进度 */
  characterDialogueFlags: Record<string, number>;
  /** 已击败的Boss */
  defeatedBosses: string[];
  /** 本层停留天数 */
  floorDays: number;
  /** 今日天气是否已生成 */
  todayWeatherSet: boolean;
  /** 今日是否已刷新商店（每日刷新，但买了的空缺不补） */
  shopRefreshedToday: boolean;
  /** 今日行动（打工/访问NPC/挑战Boss/商店），下一天重置 */
  todayAction: "打工" | "访问NPC" | "挑战Boss" | "商店" | null;
  /** 今日是否已访问主角，下一天重置 */
  protagonistVisitedToday: boolean;
  /** Buff#10 混乱自选三张：自选的3张卡（仅此buff生效） */
  chaosKinds: CardKind[];
  /** 当前对话内容（展示用，对话结束后清空） */
  currentDialogue: string | null;
  /** 玩家锁定的初始卡组（用于展示） */
  lockedDeck: CardKind[];
}

export interface BattleState {
  /** 玩家手牌 */
  playerHand: CardInstance[];
  /** 玩家弃牌堆 */
  playerDiscard: CardInstance[];
  /** 玩家可见牌组 */
  playerVisibleDeck: CardInstance[];
  /** 玩家一次性卡牌（独立存储） */
  playerConsumables: CardInstance[];

  /** 机器人手牌 */
  aiHand: CardInstance[];
  /** 机器人弃牌堆 */
  aiDiscard: CardInstance[];
  /** 机器人可见牌组 */
  aiVisibleDeck: CardInstance[];
  /** 机器人不可见牌组 */
  aiHiddenDeck: CardInstance[];

  /** 玩家使用的一次性卡牌（剩余） */
  playerActiveConsumables: CardInstance[];

  /** 本回合出牌前使用的一次性卡牌效果，结算时应用 */
  pendingRankAdjust: { 玩家: number; 机器人: number }; // 加减等级（正数加，负数减）
  pendingConsumeRecall: { 玩家: boolean; 机器人: boolean };   // 续命：本次输牌不进弃牌堆
  pendingConsumeCancelFunc: { 玩家: boolean; 机器人: boolean }; // 功能失效：本回合功能牌无效
  pendingConsumeCancelAbility: { 玩家: boolean; 机器人: boolean }; // 能力失效：本回合能力牌无效
  pendingRegretCard: { 玩家: CardInstance | null; 机器人: CardInstance | null }; // 后悔牌：待重出的牌
  pendingPeekCard: { 玩家: CardInstance | null; 机器人: CardInstance | null };   // 预见牌：暂存对手牌

  /** 上一回合各方出过的实例 id */
  lastPlayedId: { 玩家?: string; 机器人?: string };

  /** 战斗阶段 */
  phase: BattlePhase;

  /** 本回合暂存，结算后清空 */
  pendingPlayerCard?: CardInstance;
  pendingAiCard?: CardInstance;

  /** 本回合结果描述 */
  lastRoundSummary?: string;

  /** 胜者 */
  winner?: PlayerSide | "平局";

  /** 当前回合数 */
  turn: number;
  /** 本次战斗上限回合数 */
  maxTurns: number;

  /** 是否已使用时间回溯（本场战斗） */
  rewindUsed: { 玩家: boolean; 机器人: boolean };

  /** 四象标记：各方已"赢过"的四象列表 */
  fourSymbolsWon: { 玩家: string[]; 机器人: string[] };

  /** 本次战斗天气修正（战斗开始时固定） */
  weatherModifier: number; // +0.5(烈日) / -0.5(冰雹) / 0

  /** 是否取消上限回合（暖风） */
  noTurnLimit: boolean;

  /** 命运效果：是否已交换可见牌组 */
  visibleSwapped: boolean;

  /** 亚特兰蒂斯：某方已出亚特兰蒂斯，取消上限 */
  atlantisUsed: { 玩家: boolean; 机器人: boolean };

  /** 永不放弃/奉献精神的出牌次数 */
  continuousPlayed: { 玩家: number; 机器人: number };

  /** 占卜师效果：标记各方下回合必赢 */
  divinerNextWin: { 玩家: boolean; 机器人: boolean };

  /** 暖日/雪花效果：.5牌的修正值 */
  roundModifier: { 玩家: number; 机器人: number }; // +0.25或-0.25

  /** 偶数/奇数形态效果：当前生效的触发修正 */
  triggerMod: { 玩家: "odd" | "even" | null; 机器人: "odd" | "even" | null };

  /** 指数形态效果：是否激活 */
  exponentialActive: { 玩家: boolean; 机器人: boolean };

  /** 金色项链：是否携带 */
  goldenNecklaceActive: { 玩家: boolean; 机器人: boolean };

  /** 孤注一掷：是否携带 */
  gamblerActive: { 玩家: boolean; 机器人: boolean };

  /** 白日梦：是否携带（每回合换一张） */
  daydreamActive: { 玩家: boolean; 机器人: boolean };

  /** 换卡功能（本层可用次数） */
  swapAvailable: { 玩家: number; 机器人: number };

  /** 文明效果：是否已发动（手牌全变国王） */
  civilizationActive: { 玩家: boolean; 机器人: boolean };

  /** 对话历史（用于AI预判） */
  dialogueHistory: string[];

  /** 战斗结果（战斗结束后记录） */
  result?: BattleResult;
  /** 战斗类型 */
  battleType: "boss" | "npc";
  /** NPC战输了扣多少钱 */
  npcPenalty: number;
  /** NPC战赢了得多少钱 */
  npcReward: number;

  /** 随机等级覆盖（Buff#4/#5：平民/国王随机能力）{ cardId: rank } */
  randomRank: Record<string, number>;
}

export interface GameState {
  /** 塔的状态 */
  tower: TowerRunState;
  /** 商店状态 */
  shop: ShopItem[];
  /** 当前战斗状态 */
  battle: BattleState | null;
  /** 当前进行的对话 NPC */
  activeNPC: string | null;
  /** 每日打工获得的资金 */
  workGold: number;
  /** 剧情/对话记录 */
  eventLog: string[];
  /** 游戏是否已结束（胜利/失败） */
  runOver: boolean;
  /** 塔通关（7层Boss击败） */
  runWon: boolean;
  /** 选卡奖励时可选的卡牌列表 */
  cardRewardOptions: CardKind[];
  /** 超时强制Boss战（下一天时设置，store检测后自动开启战斗） */
  forcedBossBattle: boolean;
}
