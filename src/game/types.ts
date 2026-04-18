/** 首版开放的七种基础牌（与计划 3.1 一致） */
export const ENABLED_CARD_KINDS = [
  "国王",
  "大臣",
  "平民",
  "贵族",
  "护卫",
  "侍女",
  "盗贼",
] as const;

export type CardKind = (typeof ENABLED_CARD_KINDS)[number];

export type PlayerSide = "人类" | "机器人";

export interface CardInstance {
  /** 全局唯一，用于「不可连续出同一张牌」 */
  id: string;
  kind: CardKind;
}

export interface PlayerPiles {
  hand: CardInstance[];
  /** 弃牌：本局已失败打出、不可再用的牌 */
  discard: CardInstance[];
  /** 可见牌组（对手可见具体内容；己方全可见） */
  visibleDeck: CardInstance[];
  /** 不可见牌组（仅己方与程序知晓；对人类对手只显示数量） */
  hiddenDeck: CardInstance[];
}

export interface GameState {
  human: PlayerPiles;
  ai: PlayerPiles;
  /** 上一回合各方打出的实例 id，用于禁止连续重复 */
  lastPlayedId: { 人类?: string; 机器人?: string };
  /** 当前回合是否已双方出牌（用于 UI 步骤） */
  phase: "等待人类选牌" | "展示结算" | "已结束";
  /** 本回合暂存，结算后清空 */
  pendingHumanCard?: CardInstance;
  pendingAiCard?: CardInstance;
  lastRoundSummary?: string;
  winner?: PlayerSide | "平局";
}
