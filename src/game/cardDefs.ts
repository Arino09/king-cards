/**
 * 所有卡牌的静态定义。
 * 策划案卡牌表完整实现。
 */

export type CardType = "基础" | "补充" | "功能" | "能力" | "一次性";

/** 等级类型 */
export type RankType = "整数" | "半" | "分数" | "零" | "特殊";

/** 触发时机的修饰符 */
export type TriggerMod = "odd" | "even" | null;

/** 卡牌实例可用的效果描述 */
export interface CardEffect {
  /** 触发类型 */
  type:
    | "conditional_rank"   // 条件变牌（弑君者/乱党/乞丐）
    | "double_loss"         // 刺客：强制双败
    | "must_win"            // 伪神：本回合必赢，下回合必输
    | "must_loss_then_win"  // 占卜师：本回合输，下回合赢
    | "copy_opponent"       // 影子：复制对手上一张牌
    | "swap_visible"        // 命运：交换可见牌组
    | "all_become_king"     // 文明：剩余牌全变国王
    | "setup_modifier"      // 永风/奉献：开局设置持续修正
    | "round_modifier"      // 暖日/雪花：回合内持续修正
    | "trigger_modifier"    // 偶数/奇数/指数形态：触发时修正
    | "win_gold_boost"      // 金色项链：获胜金币翻倍
    | "continuous_rank"       // 永不放弃/奉献精神：持续变化
    | "random_loss"          // 孤注一掷：每次出牌随机弃牌
    | "random_swap"          // 白日梦：每回合随机换牌
    | "recall"               // 希望：召回弃牌
    | "discard_opponent"     // 恶魔：丢弃对手随机牌
    | "four_symbols"         // 四象：全部四象赢过对方，直接胜利
    | "four_symbols_trigger" // 四象之一：标记已赢过
    | "none";                // 无特殊效果

  /** 对应 CardKind 表里的牌名 */
  name: string;

  /** 卡的类型 */
  cardType: CardType;

  /** 基础等级（数字） */
  baseRank: number;

  /** 等级类型 */
  rankType: RankType;

  /** 是否是必须包含的基础卡（国王/平民） */
  required?: boolean;

  /** 条件变牌：手中没有哪个种类时，变为何种等级 */
  conditionalKind?: string;
  conditionalRank?: number;

  /** 触发时需要参数（如永不放弃当前出牌次数） */
  param?: number;

  /** 一次性牌的消耗标记 */
  consumable?: boolean;

  /** 是否计入可见牌组 */
  inVisibleDeck?: boolean;

  /** 是否计入不可见牌组 */
  inHiddenDeck?: boolean;

  /** 效果描述文本 */
  description?: string;
}

function card<
  N extends string,
  CT extends CardType,
  RT extends RankType,
>(
  name: N,
  cardType: CT,
  baseRank: number,
  rankType: RT,
  effectType: CardEffect["type"],
  extra: Partial<Omit<CardEffect, "type" | "name" | "cardType" | "baseRank" | "rankType">> = {},
): asserts name is N {
  // noop — just a type helper
}

export const ALL_CARD_DEFS: Record<string, CardEffect> = {
  // ========== 基础卡 ==========
  国王: {
    type: "none",
    name: "国王",
    cardType: "基础",
    baseRank: 1,
    rankType: "整数",
    required: true,
    description: "等级1。平民能战胜国王（平民>国王）。",
  },
  大臣: {
    type: "none",
    name: "大臣",
    cardType: "基础",
    baseRank: 2,
    rankType: "整数",
    description: "等级2。等级低的卡胜等级高的卡。",
  },
  平民: {
    type: "none",
    name: "平民",
    cardType: "基础",
    baseRank: 3,
    rankType: "整数",
    required: true,
    description: "等级3。平民能战胜国王（平民>国王）。",
  },

  // ========== 补充基础卡 ==========
  护卫: {
    type: "none",
    name: "护卫",
    cardType: "补充",
    baseRank: 1.5,
    rankType: "半",
    inVisibleDeck: true,
    description: "等级1.5。烈日+0.5，冰雹-0.5。",
  },
  侍女: {
    type: "none",
    name: "侍女",
    cardType: "补充",
    baseRank: 2.5,
    rankType: "半",
    inVisibleDeck: true,
    description: "等级2.5。烈日+0.5，冰雹-0.5。",
  },
  盗贼: {
    type: "none",
    name: "盗贼",
    cardType: "补充",
    baseRank: 3.5,
    rankType: "半",
    inVisibleDeck: true,
    description: "等级3.5。烈日+0.5，冰雹-0.5。",
  },
  贵族: {
    type: "none",
    name: "贵族",
    cardType: "补充",
    baseRank: 1.1,
    rankType: "分数",
    inVisibleDeck: true,
    description: "等级1.1。",
  },
  王后: {
    type: "none",
    name: "王后",
    cardType: "补充",
    baseRank: 1.1,
    rankType: "分数",
    inVisibleDeck: true,
    description: "等级1.1。",
  },
  弑君者: {
    type: "conditional_rank",
    name: "弑君者",
    cardType: "补充",
    baseRank: 3,
    rankType: "分数",
    conditionalKind: "国王",
    conditionalRank: 1,
    inVisibleDeck: true,
    description: "手中没有国王时，等级变为1；有国王时等级为3。",
  },
  乱党: {
    type: "conditional_rank",
    name: "乱党",
    cardType: "补充",
    baseRank: 2,
    rankType: "分数",
    conditionalKind: "大臣",
    conditionalRank: 2,
    inVisibleDeck: true,
    description: "手中没有大臣时，等级变为2。",
  },
  乞丐: {
    type: "conditional_rank",
    name: "乞丐",
    cardType: "补充",
    baseRank: 3,
    rankType: "分数",
    conditionalKind: "平民",
    conditionalRank: 3,
    inVisibleDeck: true,
    description: "手中没有平民时，等级变为3。",
  },

  // ========== 功能卡 ==========
  刺客: {
    type: "double_loss",
    name: "刺客",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "本回合强制双败（双方牌都入弃牌堆）。",
  },
  伪神: {
    type: "must_win",
    name: "伪神",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "本回合必赢，但下回合直接输掉本次对局。",
  },
  占卜师: {
    type: "must_loss_then_win",
    name: "占卜师",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "本回合必输，下回合必赢。",
  },
  影子: {
    type: "copy_opponent",
    name: "影子",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "复制对手上一张出的牌，用对手牌的等级比较。",
  },
  命运: {
    type: "swap_visible",
    name: "命运",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "本局临时交换两边的可见牌组。",
  },
  文明: {
    type: "all_become_king",
    name: "文明",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "本局你剩下的卡全部成为国王（等级1）。",
  },
  希望: {
    type: "recall",
    name: "希望",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "将你一张随机牌从弃牌堆召回到手牌。",
  },
  恶魔: {
    type: "discard_opponent",
    name: "恶魔",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "将对方的一张随机牌放入弃牌堆。",
  },

  // ========== 能力卡（必输） ==========
  暖日: {
    type: "round_modifier",
    name: "暖日",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 0.25,
    inVisibleDeck: true,
    description: "本局对弈你的全部0.5牌等级-0.25。",
  },
  雪花: {
    type: "round_modifier",
    name: "雪花",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 0.25,
    inVisibleDeck: true,
    description: "本局对弈敌人的全部0.5牌等级+0.25。",
  },
  亚特兰蒂斯: {
    type: "none",
    name: "亚特兰蒂斯",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "本局对弈无视回合数上限限制。",
  },
  偶数形态: {
    type: "trigger_modifier",
    name: "偶数形态",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 0,
    inVisibleDeck: true,
    description: "本局对弈你的偶数回合等级-1。",
  },
  奇数形态: {
    type: "trigger_modifier",
    name: "奇数形态",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 1,
    inVisibleDeck: true,
    description: "本局对弈你的奇数回合等级-1。",
  },
  指数形态: {
    type: "trigger_modifier",
    name: "指数形态",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 2,
    inVisibleDeck: true,
    description: "本局对弈等级^2，每次出牌额外失去一张可见牌组的牌。",
  },
  金色项链: {
    type: "win_gold_boost",
    name: "金色项链",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "本场获胜后获得金币×2。",
  },
  永不放弃: {
    type: "continuous_rank",
    name: "永不放弃",
    cardType: "功能",
    baseRank: 4,
    rankType: "特殊",
    param: -0.1,
    inVisibleDeck: true,
    description: "本局初始4，每次出牌-0.1，最低为0。",
  },
  奉献精神: {
    type: "continuous_rank",
    name: "奉献精神",
    cardType: "功能",
    baseRank: 1,
    rankType: "特殊",
    param: 0.1,
    inVisibleDeck: true,
    description: "本局初始1，每次出牌+0.1。",
  },
  孤注一掷: {
    type: "random_loss",
    name: "孤注一掷",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "每次出牌后随机失去自己一张可见牌组的牌（等级/2）。",
  },
  白日梦: {
    type: "random_swap",
    name: "白日梦",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
    description: "每一回合你的可见牌组中的一张牌被换成一张随机的牌。",
  },

  // ========== 四象 ==========
  "四象—青龙": {
    type: "four_symbols",
    name: "四象—青龙",
    cardType: "功能",
    baseRank: 1.6,
    rankType: "分数",
    inVisibleDeck: true,
    description: "四象之一。全部四象都赢过对方，直接胜利。",
  },
  "四象—白虎": {
    type: "four_symbols",
    name: "四象—白虎",
    cardType: "功能",
    baseRank: 2,
    rankType: "整数",
    inVisibleDeck: true,
    description: "四象之一。全部四象都赢过对方，直接胜利。",
  },
  "四象—朱雀": {
    type: "four_symbols",
    name: "四象—朱雀",
    cardType: "功能",
    baseRank: 2.1,
    rankType: "分数",
    inVisibleDeck: true,
    description: "四象之一。全部四象都赢过对方，直接胜利。",
  },
  "四象—玄武": {
    type: "four_symbols",
    name: "四象—玄武",
    cardType: "功能",
    baseRank: 2.6,
    rankType: "分数",
    inVisibleDeck: true,
    description: "四象之一。全部四象都赢过对方，直接胜利。",
  },

  // ========== 一次性卡 ==========
  预见牌: {
    type: "none",
    name: "预见牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "未开牌时看穿对方出的牌。",
  },
  后悔牌: {
    type: "none",
    name: "后悔牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "重新出本次自己已出的牌。",
  },
  "减0.5牌": {
    type: "none",
    name: "减0.5牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "本次结果自己的牌等级-0.5。",
  },
  "减1牌": {
    type: "none",
    name: "减1牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "本次结果自己的牌等级-1。",
  },
  "加0.5牌": {
    type: "none",
    name: "加0.5牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "本次结果对方的牌等级+0.5。",
  },
  "加1牌": {
    type: "none",
    name: "加1牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "本次结果对方的牌等级+1。",
  },
  功能失效牌: {
    type: "none",
    name: "功能失效牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "对手本回合的功能牌失效。",
  },
  能力失效牌: {
    type: "none",
    name: "能力失效牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "对手本回合的能力牌失效。",
  },
  续命牌: {
    type: "none",
    name: "续命牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
    description: "本回合自己输的牌不放入弃牌堆。",
  },
};

/** 允许玩家组牌时选择的卡种 */
export const PLAYABLE_CARD_KINDS = Object.entries(ALL_CARD_DEFS)
  .filter(([, def]) => def.cardType !== "一次性")
  .map(([name]) => name);

export const FUNCTION_CARD_KINDS = Object.entries(ALL_CARD_DEFS)
  .filter(([, def]) => def.cardType === "功能" || def.cardType === "能力")
  .map(([name]) => name);

export const FOUR_SYMBOLS = ["四象—青龙", "四象—白虎", "四象—朱雀", "四象—玄武"] as const;
