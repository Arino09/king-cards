import type { CardInstance, GameState, PlayerSide } from "./types";

export function findCardInHand(
  state: GameState,
  side: PlayerSide,
  cardId: string,
): CardInstance | undefined {
  const hand = side === "人类" ? state.human.hand : state.ai.hand;
  return hand.find((c) => c.id === cardId);
}

/** 是否允许打出：在手牌中，且不能与上一张相同实例连续出 */
export function canPlayCard(
  state: GameState,
  side: PlayerSide,
  cardId: string,
): boolean {
  const card = findCardInHand(state, side, cardId);
  if (!card) {
    return false;
  }
  if (state.lastPlayedId[side] === cardId) {
    return false;
  }
  return true;
}

export function legalCardIds(state: GameState, side: PlayerSide): string[] {
  const hand = side === "人类" ? state.human.hand : state.ai.hand;
  const last = state.lastPlayedId[side];
  return hand.filter((c) => c.id !== last).map((c) => c.id);
}
