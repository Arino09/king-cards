/**
 * 战斗局势启发式评估。
 * 非终局时，给出局势的估值（正值=AI优势，负值=玩家优势）。
 */

import type { BattleState } from "@/game/types";
import { ALL_CARD_DEFS } from "@/game/cardDefs";
import { getCardRank } from "@/game/rank";

/**
 * 评估当前战斗局势。
 * 综合考虑：手牌数量、剩余总战力、可预见牌组、特殊牌价值等。
 */
export function evaluateBattlePosition(battle: BattleState): number {
  // 1. 手牌数量差（核心权重）
  const handDiff = battle.aiHand.length - battle.playerHand.length;

  // 2. 剩余总战力（等级越小越强）
  const aiPower = battle.aiHand.reduce(
    (s, c) => s + powerScore(c, "机器人", battle),
    0,
  );
  const playerPower = battle.playerHand.reduce(
    (s, c) => s + powerScore(c, "玩家", battle),
    0,
  );
  const powerDiff = (aiPower - playerPower) * 0.5;

  // 3. 可见牌组的战略价值
  const aiVisibleValue = battle.aiVisibleDeck.reduce((s, c) => {
    const rank = ALL_CARD_DEFS[c.kind]?.baseRank ?? 999;
    return s + (10 - rank) * 0.3;
  }, 0);
  const playerVisibleValue = battle.playerVisibleDeck.reduce((s, c) => {
    const rank = ALL_CARD_DEFS[c.kind]?.baseRank ?? 999;
    return s + (10 - rank) * 0.3;
  }, 0);

  // 4. 特殊功能牌的存在（刺客、伪神等）
  const aiFunctional = countFunctionalCards(battle.aiHand, "机器人", battle);
  const playerFunctional = countFunctionalCards(battle.playerHand, "玩家", battle);
  const functionalDiff = (aiFunctional - playerFunctional) * 2;

  // 5. 四象进度
  const fourProgress = (k: string[]) =>
    FOUR_SYMBOLS.filter((s) => k.includes(s)).length;
  const fourDiff =
    (fourProgress(battle.fourSymbolsWon.机器人) -
      fourProgress(battle.fourSymbolsWon.玩家)) *
    5;

  // 6. 回合压力：接近上限回合时，等级小的牌更有价值
  const turnPressure =
    battle.turn > battle.maxTurns * 0.7
      ? ((battle.maxTurns - battle.turn) / battle.maxTurns) *
        (playerPower - aiPower) *
        0.3
      : 0;

  return (
    handDiff * 1.5 +
    powerDiff +
    (aiVisibleValue - playerVisibleValue) +
    functionalDiff +
    fourDiff +
    turnPressure
  );
}

const FOUR_SYMBOLS = ["四象—青龙", "四象—白虎", "四象—朱雀", "四象—玄武"];

function powerScore(card: { kind: string }, side: "玩家" | "机器人", battle: BattleState): number {
  const def = ALL_CARD_DEFS[card.kind];
  if (!def) return 0;

  // 功能牌/能力牌：给予一定基础价值
  if (def.cardType === "功能" || def.cardType === "能力") {
    // 刺客/伪神等高价值
    return 3;
  }

  const rank = getCardRank(card as Parameters<typeof getCardRank>[0], side, battle);
  // 等级越小分越高
  return Math.max(0, 10 - rank);
}

function countFunctionalCards(
  hand: { kind: string }[],
  side: "玩家" | "机器人",
  battle: BattleState,
): number {
  let count = 0;
  for (const card of hand) {
    const def = ALL_CARD_DEFS[card.kind];
    if (!def) continue;
    if (
      def.cardType === "功能" ||
      def.cardType === "能力" ||
      def.type === "conditional_rank"
    ) {
      count += 1;
    }
  }
  return count;
}
