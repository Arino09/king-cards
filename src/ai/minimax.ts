import {
  cloneGameState,
  continueAfterRound,
  resolvePlay,
  terminalWinner,
} from "@/game/engine";
import type { GameState } from "@/game/types";
import { legalCardIds } from "@/game/validation";
import { evaluatePosition } from "./evaluate";

const WIN = 1_000_000;
const LOSS = -1_000_000;

function normalizeAfterResolve(state: GameState): GameState {
  if (state.phase === "已结束") {
    return state;
  }
  if (state.phase === "展示结算") {
    return continueAfterRound(state);
  }
  return state;
}

function terminalUtility(state: GameState): number | null {
  if (state.phase === "已结束" && state.winner) {
    if (state.winner === "机器人") {
      return WIN;
    }
    if (state.winner === "人类") {
      return LOSS;
    }
    return 0;
  }
  const w = terminalWinner(state);
  if (!w) {
    return null;
  }
  if (w === "机器人") {
    return WIN;
  }
  if (w === "人类") {
    return LOSS;
  }
  return 0;
}

function vAi(state: GameState, depth: number): number {
  const tu = terminalUtility(state);
  if (tu !== null) {
    return tu;
  }
  if (state.phase !== "等待人类选牌") {
    throw new Error("搜索状态异常");
  }
  if (depth <= 0) {
    return evaluatePosition(state);
  }

  const humanMoves = legalCardIds(state, "人类");
  const aiMoves = legalCardIds(state, "机器人");
  let minHuman = Infinity;

  for (const h of humanMoves) {
    let maxAi = -Infinity;
    for (const a of aiMoves) {
      const raw = resolvePlay(cloneGameState(state), h, a);
      const next = normalizeAfterResolve(raw);
      const val = vAi(next, depth - 1);
      maxAi = Math.max(maxAi, val);
    }
    minHuman = Math.min(minHuman, maxAi);
  }

  return minHuman;
}

export function chooseBestAiCard(
  state: GameState,
  humanCardId: string,
  searchDepth: number,
): string {
  const aiMoves = legalCardIds(state, "机器人");
  if (aiMoves.length === 0) {
    throw new Error("机器人无合法着法");
  }
  let best = aiMoves[0]!;
  let bestScore = -Infinity;
  for (const a of aiMoves) {
    const raw = resolvePlay(cloneGameState(state), humanCardId, a);
    const next = normalizeAfterResolve(raw);
    const score = vAi(next, searchDepth - 1);
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}
