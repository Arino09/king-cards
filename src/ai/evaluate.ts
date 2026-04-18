import { RANK } from "@/game/compare";
import type { CardInstance, GameState } from "@/game/types";

/** 非终局启发式：手牌数量差 + 剩余牌「战力」差（等级数值越小越强，故用反比权重） */
export function evaluatePosition(state: GameState): number {
  const m = (hand: CardInstance[]) =>
    hand.reduce((s, c) => s + (40 - RANK[c.kind] * 10), 0);
  const diff =
    state.ai.hand.length - state.human.hand.length + (m(state.ai.hand) - m(state.human.hand)) * 0.01;
  return diff;
}
