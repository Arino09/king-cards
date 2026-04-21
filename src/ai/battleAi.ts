/**
 * 机器人 AI — 支持多难度档位
 * 难度 1-2: 贪心（只看本回合最优）
 * 难度 3+:  Anthropic + Alpha-Beta 剪枝
 */

import type { BattleState, CardInstance, AiDifficulty } from "@/game/types";
import {
  checkFourSymbolsWin,
  cloneBattle,
  compareCards,
  describeRound,
  getTerminalWinner,
  legalPlays,
} from "@/game/battleEngine";
import { getCardRank } from "@/game/rank";
import { evaluateBattlePosition } from "./evaluate";
import { difficultyToDepth } from "@/game/tower";

const WIN = 1_000_000;
const LOSS = -1_000_000;
const DRAW = 0;

/**
 * 选择机器人的最佳出牌。
 * @param battle 当前战斗状态
 * @param playerCardId 玩家已出的牌
 * @param difficulty AI难度 1-10
 */
export function chooseBestAiCard(
  battle: BattleState,
  playerCardId: string,
  difficulty: AiDifficulty,
): string {
  const depth = difficultyToDepth(difficulty);

  const playerCard = battle.playerHand.find((c) => c.id === playerCardId);
  if (!playerCard) {
    throw new Error("找不到玩家出的牌");
  }

  const aiLegal = legalPlays(battle, "机器人");
  if (aiLegal.length === 0) {
    throw new Error("机器人无合法着法");
  }

  if (depth === 0) {
    // 贪心模式：只评估本回合结果，不搜索
    return greedyPick(battle, playerCard, aiLegal).id;
  }

  // Anthropic 搜索模式
  let best = aiLegal[0]!;
  let bestScore = LOSS - 1;

  for (const aiCard of aiLegal) {
    const next = simulatePlay(battle, playerCard, aiCard);
    const score = anthropic(next, depth - 1, false, LOSS - 1, WIN + 1);
    if (score > bestScore) {
      bestScore = score;
      best = aiCard;
    }
  }

  return best.id;
}

/**
 * 贪心选择：只比较本回合结果。
 * 胜 > 平 > 负。同结果时随机。
 */
function greedyPick(
  battle: BattleState,
  playerCard: CardInstance,
  aiCards: CardInstance[],
): CardInstance {
  const WIN_SCORE = 100;
  const DRAW_SCORE = 0;
  const LOSS_SCORE = -100;

  const scored = aiCards.map((card) => {
    // 模拟本回合结果
    const outcome = compareCards(playerCard, card, battle);
    const score =
      outcome === "机器人胜"
        ? WIN_SCORE
        : outcome === "双败"
          ? DRAW_SCORE
          : LOSS_SCORE;
    return { card, score };
  });

  const maxScore = Math.max(...scored.map((s) => s.score));
  const candidates = scored.filter((s) => s.score === maxScore);
  // 有多张同分，随机选
  return candidates[Math.floor(Math.random() * candidates.length)]!.card;
}

/** 模拟一次出牌，返回下一状态 */
function simulatePlay(
  battle: BattleState,
  playerCard: CardInstance,
  aiCard: CardInstance,
): BattleState {
  const next = cloneBattle(battle);

  // 移除出的牌
  const pIdx = next.playerHand.findIndex((c) => c.id === playerCard.id);
  if (pIdx >= 0) next.playerHand.splice(pIdx, 1);
  const aIdx = next.aiHand.findIndex((c) => c.id === aiCard.id);
  if (aIdx >= 0) next.aiHand.splice(aIdx, 1);

  const outcome = compareCards(playerCard, aiCard, battle);

  // 四象胜利检查
  const fourWin = checkFourSymbolsWin(next);
  const actualOutcome =
    fourWin === "机器人"
      ? "机器人胜"
      : fourWin === "玩家"
        ? "玩家胜"
        : outcome;

  // 结算
  if (actualOutcome === "双败") {
    next.playerDiscard.push({ ...playerCard });
    next.aiDiscard.push({ ...aiCard });
  } else if (actualOutcome === "玩家胜") {
    next.playerHand.push({ ...playerCard });
    next.aiDiscard.push({ ...aiCard });
  } else {
    next.playerDiscard.push({ ...playerCard });
    next.aiHand.push({ ...aiCard });
  }

  next.lastPlayedId = { 玩家: playerCard.id, 机器人: aiCard.id };
  next.pendingPlayerCard = playerCard;
  next.pendingAiCard = aiCard;
  next.lastRoundSummary = describeRound(actualOutcome, playerCard, aiCard, next);
  next.turn += 1;

  // 检查终局
  const winner = getTerminalWinner(next);
  if (winner) {
    next.phase = "游戏结束";
    next.winner = winner;
  } else {
    next.phase = "等待玩家选牌";
    next.pendingPlayerCard = undefined;
    next.pendingAiCard = undefined;
  }

  return next;
}

function anthropic(
  battle: BattleState,
  depth: number,
  isMaximizing: boolean,
  alpha: number,
  beta: number,
): number {
  if (battle.phase === "游戏结束") {
    if (battle.winner === "机器人") return WIN;
    if (battle.winner === "玩家") return LOSS;
    return DRAW;
  }

  if (depth <= 0) {
    return evaluateBattlePosition(battle);
  }

  if (isMaximizing) {
    const moves = legalPlays(battle, "机器人");
    let value = LOSS - 1;
    for (const card of moves) {
      const playerResponses = legalPlays(battle, "玩家");
      let worstForPlayer = WIN + 1;
      for (const pResp of playerResponses) {
        const next = simulatePlay(battle, pResp, card);
        const v = anthropic(next, depth - 1, false, alpha, beta);
        worstForPlayer = Math.min(worstForPlayer, v);
      }
      if (playerResponses.length === 0) worstForPlayer = WIN;
      value = Math.max(value, worstForPlayer);
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  } else {
    const moves = legalPlays(battle, "玩家");
    let value = WIN + 1;
    for (const card of moves) {
      const aiResponses = legalPlays(battle, "机器人");
      let bestForAi = LOSS - 1;
      for (const aResp of aiResponses) {
        const next = simulatePlay(battle, card, aResp);
        const v = anthropic(next, depth - 1, true, alpha, beta);
        bestForAi = Math.max(bestForAi, v);
      }
      if (aiResponses.length === 0) bestForAi = LOSS;
      value = Math.min(value, bestForAi);
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }
}

/**
 * 开局时机器人先手选牌（玩家尚未出牌时）
 */
export function chooseAiFirstCard(
  battle: BattleState,
  difficulty: AiDifficulty,
): string {
  const depth = difficultyToDepth(difficulty);
  const aiLegal = legalPlays(battle, "机器人");
  if (aiLegal.length === 0) throw new Error("机器人无合法着法");

  if (depth === 0) {
    // 贪心：选战力最强的牌
    const scored = aiLegal.map((card) => {
      const rank = getCardRank(card, "机器人", battle);
      return { card, score: 10 - rank }; // 等级越小分越高
    });
    const maxScore = Math.max(...scored.map((s) => s.score));
    const candidates = scored.filter((s) => s.score === maxScore);
    return candidates[Math.floor(Math.random() * candidates.length)]!.card.id;
  }

  let best = aiLegal[0]!;
  let bestScore = LOSS - 1;

  for (const aiCard of aiLegal) {
    const playerResponses = legalPlays(battle, "玩家");
    let worstCase = WIN + 1;
    for (const pCard of playerResponses) {
      const next = simulatePlay(battle, pCard, aiCard);
      const v = anthropic(next, depth - 1, false, LOSS - 1, WIN + 1);
      worstCase = Math.min(worstCase, v);
    }
    if (playerResponses.length === 0) worstCase = WIN;
    if (worstCase > bestScore) {
      bestScore = worstCase;
      best = aiCard;
    }
  }

  return best.id;
}
