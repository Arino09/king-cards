/**
 * 卡牌等级计算 — 处理所有影响等级的因素。
 * 包括：条件变牌、天气修正、四象标记、持续变化牌等。
 */

import { ALL_CARD_DEFS } from "./cardDefs";
import type { CardInstance, CardKind, BattleState, PlayerSide } from "./types";

/**
 * 获取卡牌在当前战斗状态下的实际等级。
 */
export function getCardRank(
  card: CardInstance,
  side: PlayerSide,
  battle: BattleState,
): number {
  const def = ALL_CARD_DEFS[card.kind];
  if (!def) return 999;

  let rank = def.baseRank;

  // 1. 条件变牌（弑君者/乱党/乞丐）
  if (def.type === "conditional_rank" && def.conditionalKind && def.conditionalRank !== undefined) {
    const hand = side === "玩家" ? battle.playerHand : battle.aiHand;
    const hasConditional = hand.some(
      (c) => c.kind === (def.conditionalKind as CardKind),
    );
    if (!hasConditional) {
      rank = def.conditionalRank;
    }
  }

  // 2. 永不放弃 / 奉献精神：持续变化
  if (def.type === "continuous_rank" && def.param !== undefined) {
    const played = battle.continuousPlayed[side];
    rank = def.baseRank + played * def.param;
    // 不能为负数
    if (rank < 0) rank = 0;
  }

  // 3. 天气修正：.5牌在烈日/冰雹下的修正
  if (def.rankType === "半") {
    rank += battle.weatherModifier;
    // 不能低于0
    if (rank < 0) rank = 0;
  }

  // 4. 回合内修正（暖日/雪花），只影响本方.5牌
  if (def.rankType === "半") {
    rank += battle.roundModifier[side];
    if (rank < 0) rank = 0;
  }

  // 5. 偶数/奇数形态
  if (battle.triggerMod[side]) {
    const isEven = battle.turn % 2 === 0;
    if (
      (battle.triggerMod[side] === "even" && isEven) ||
      (battle.triggerMod[side] === "odd" && !isEven)
    ) {
      rank -= 1;
      if (rank < 0) rank = 0;
    }
  }

  // 6. 指数形态
  if (battle.exponentialActive[side] && def.baseRank > 0) {
    rank = rank * rank;
  }

  // 7. 文明效果：全部变成国王（等级1）
  if (battle.civilizationActive[side]) {
    if (card.kind !== "国王") {
      rank = 1; // 变国王
    }
  }

  return rank;
}

/**
 * 检查卡牌是否为平民（用于特殊克制判断）
 */
export function isCivilian(kind: CardKind): boolean {
  return kind === "平民";
}

/**
 * 检查卡牌是否为国王
 */
export function isKing(kind: CardKind): boolean {
  return kind === "国王";
}

/**
 * 获取等级的展示用字符串
 */
export function formatRank(rank: number): string {
  if (Number.isInteger(rank)) {
    return String(rank);
  }
  return rank.toFixed(1);
}

/** 获取卡牌名的展示 */
export function formatCardName(kind: CardKind): string {
  return kind;
}
