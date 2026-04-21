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
    | "continuous_rank"      // 永不放弃/奉献精神：持续变化
    | "random_loss"         // 孤注一掷：每次出牌随机弃牌
    | "random_swap"         // 白日梦：每回合随机换牌
    | "recall"              // 希望：召回弃牌
    | "discard_opponent"    // 恶魔：丢弃对手随机牌
    | "four_symbols"        // 四象：全部四象赢过则直接胜利
    | "four_symbols_trigger" // 四象之一：标记已赢过
    | "none";               // 无特殊效果

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
  },
  大臣: {
    type: "none",
    name: "大臣",
    cardType: "基础",
    baseRank: 2,
    rankType: "整数",
  },
  平民: {
    type: "none",
    name: "平民",
    cardType: "基础",
    baseRank: 3,
    rankType: "整数",
    required: true,
  },

  // ========== 补充基础卡 ==========
  护卫: {
    type: "none",
    name: "护卫",
    cardType: "补充",
    baseRank: 1.5,
    rankType: "半",
    inVisibleDeck: true,
  },
  侍女: {
    type: "none",
    name: "侍女",
    cardType: "补充",
    baseRank: 2.5,
    rankType: "半",
    inVisibleDeck: true,
  },
  盗贼: {
    type: "none",
    name: "盗贼",
    cardType: "补充",
    baseRank: 3.5,
    rankType: "半",
    inVisibleDeck: true,
  },
  贵族: {
    type: "none",
    name: "贵族",
    cardType: "补充",
    baseRank: 1.1,
    rankType: "分数",
    inVisibleDeck: true,
  },
  王后: {
    type: "none",
    name: "王后",
    cardType: "补充",
    baseRank: 1.1,
    rankType: "分数",
    inVisibleDeck: true,
  },
  弑君者: {
    type: "conditional_rank",
    name: "弑君者",
    cardType: "补充",
    baseRank: 3, // 原本等级3
    rankType: "分数",
    conditionalKind: "国王",
    conditionalRank: 1,
    inVisibleDeck: true,
  },
  乱党: {
    type: "conditional_rank",
    name: "乱党",
    cardType: "补充",
    baseRank: 2, // 原本等级2
    rankType: "分数",
    conditionalKind: "大臣",
    conditionalRank: 2,
    inVisibleDeck: true,
  },
  乞丐: {
    type: "conditional_rank",
    name: "乞丐",
    cardType: "补充",
    baseRank: 3, // 原本等级3
    rankType: "分数",
    conditionalKind: "平民",
    conditionalRank: 3,
    inVisibleDeck: true,
  },

  // ========== 功能卡 ==========
  刺客: {
    type: "double_loss",
    name: "刺客",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  伪神: {
    type: "must_win",
    name: "伪神",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  占卜师: {
    type: "must_loss_then_win",
    name: "占卜师",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  影子: {
    type: "copy_opponent",
    name: "影子",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  命运: {
    type: "swap_visible",
    name: "命运",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  文明: {
    type: "all_become_king",
    name: "文明",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  希望: {
    type: "recall",
    name: "希望",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  恶魔: {
    type: "discard_opponent",
    name: "恶魔",
    cardType: "功能",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },

  // ========== 能力卡（必输） ==========
  暖日: {
    type: "round_modifier",
    name: "暖日",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 0.25, // .5牌-0.25（修正值）
    inVisibleDeck: true,
  },
  雪花: {
    type: "round_modifier",
    name: "雪花",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 0.25, // .5牌+0.25（修正值）
    inVisibleDeck: true,
  },
  亚特兰蒂斯: {
    type: "none", // 取消上限回合数限制，由战斗系统处理
    name: "亚特兰蒂斯",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  偶数形态: {
    type: "trigger_modifier",
    name: "偶数形态",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 0, // triggerMod = "even"
    inVisibleDeck: true,
  },
  奇数形态: {
    type: "trigger_modifier",
    name: "奇数形态",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 1, // triggerMod = "odd"
    inVisibleDeck: true,
  },
  指数形态: {
    type: "trigger_modifier",
    name: "指数形态",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    param: 2, // special: 等级^2 + 额外弃一张
    inVisibleDeck: true,
  },
  金色项链: {
    type: "win_gold_boost",
    name: "金色项链",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  永不放弃: {
    type: "continuous_rank",
    name: "永不放弃",
    cardType: "功能",
    baseRank: 4,
    rankType: "特殊",
    param: -0.1, // 每次-0.1
    inVisibleDeck: true,
  },
  奉献精神: {
    type: "continuous_rank",
    name: "奉献精神",
    cardType: "功能",
    baseRank: 1,
    rankType: "特殊",
    param: 0.1, // 每次+0.1
    inVisibleDeck: true,
  },
  孤注一掷: {
    type: "random_loss",
    name: "孤注一掷",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },
  白日梦: {
    type: "random_swap",
    name: "白日梦",
    cardType: "能力",
    baseRank: 0,
    rankType: "零",
    inVisibleDeck: true,
  },

  // ========== 四象 ==========
  "四象—青龙": {
    type: "four_symbols",
    name: "四象—青龙",
    cardType: "功能",
    baseRank: 1.6,
    rankType: "分数",
    inVisibleDeck: true,
  },
  "四象—白虎": {
    type: "four_symbols",
    name: "四象—白虎",
    cardType: "功能",
    baseRank: 2,
    rankType: "整数",
    inVisibleDeck: true,
  },
  "四象—朱雀": {
    type: "four_symbols",
    name: "四象—朱雀",
    cardType: "功能",
    baseRank: 2.1,
    rankType: "分数",
    inVisibleDeck: true,
  },
  "四象—玄武": {
    type: "four_symbols",
    name: "四象—玄武",
    cardType: "功能",
    baseRank: 2.6,
    rankType: "分数",
    inVisibleDeck: true,
  },

  // ========== 一次性卡 ==========
  预见牌: {
    type: "none",
    name: "预见牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  后悔牌: {
    type: "none",
    name: "后悔牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  "减0.5牌": {
    type: "none",
    name: "减0.5牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  "减1牌": {
    type: "none",
    name: "减1牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  "加0.5牌": {
    type: "none",
    name: "加0.5牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  "加1牌": {
    type: "none",
    name: "加1牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  功能失效牌: {
    type: "none",
    name: "功能失效牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  能力失效牌: {
    type: "none",
    name: "能力失效牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
  },
  续命牌: {
    type: "none",
    name: "续命牌",
    cardType: "一次性",
    baseRank: 0,
    rankType: "零",
    consumable: true,
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
