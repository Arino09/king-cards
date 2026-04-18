import { compareKinds, formatCardWithRank } from "./compare";
import type { CardInstance, GameState, PlayerSide } from "./types";
import { canPlayCard } from "./validation";

function clonePiles(p: GameState["human"]): GameState["human"] {
  return {
    hand: p.hand.map((c) => ({ ...c })),
    discard: p.discard.map((c) => ({ ...c })),
    visibleDeck: p.visibleDeck.map((c) => ({ ...c })),
    hiddenDeck: p.hiddenDeck.map((c) => ({ ...c })),
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    ...state,
    human: clonePiles(state.human),
    ai: clonePiles(state.ai),
    lastPlayedId: { ...state.lastPlayedId },
  };
}

function removeFromHand(hand: CardInstance[], cardId: string): CardInstance | undefined {
  const i = hand.findIndex((c) => c.id === cardId);
  if (i < 0) {
    return undefined;
  }
  const [card] = hand.splice(i, 1);
  return card;
}

function describeOutcome(
  outcome: "先手胜" | "后手胜" | "双败",
  humanCard: CardInstance,
  aiCard: CardInstance,
): string {
  if (outcome === "双败") {
    return `双败：${formatCardWithRank(humanCard.kind)} 与 ${formatCardWithRank(aiCard.kind)} 同级或同牌。双方打出的牌均进入弃牌堆。`;
  }
  if (outcome === "先手胜") {
    return `你胜：${formatCardWithRank(humanCard.kind)} 胜过 ${formatCardWithRank(aiCard.kind)}。对方的牌进入弃牌堆，你的牌收回手牌。`;
  }
  return `对方胜：${formatCardWithRank(aiCard.kind)} 胜过 ${formatCardWithRank(humanCard.kind)}。你的牌进入弃牌堆，对方的牌收回。`;
}

/**
 * 人类为先手；比较函数 first=人类。
 */
export function resolvePlay(
  state: GameState,
  humanCardId: string,
  aiCardId: string,
): GameState {
  if (state.phase !== "等待人类选牌") {
    throw new Error("当前阶段不可结算");
  }
  if (!canPlayCard(state, "人类", humanCardId) || !canPlayCard(state, "机器人", aiCardId)) {
    throw new Error("出牌不合法");
  }

  const next = cloneGameState(state);
  const humanP = next.human;
  const aiP = next.ai;

  const humanCard = removeFromHand(humanP.hand, humanCardId);
  const aiCard = removeFromHand(aiP.hand, aiCardId);
  if (!humanCard || !aiCard) {
    throw new Error("找不到打出的牌");
  }

  const outcome = compareKinds(humanCard.kind, aiCard.kind);

  if (outcome === "双败") {
    humanP.discard.push(humanCard);
    aiP.discard.push(aiCard);
  } else if (outcome === "先手胜") {
    humanP.hand.push(humanCard);
    aiP.discard.push(aiCard);
  } else {
    humanP.discard.push(humanCard);
    aiP.hand.push(aiCard);
  }

  const lastRoundSummary = describeOutcome(outcome, humanCard, aiCard);

  const interim: GameState = {
    ...next,
    lastPlayedId: {
      人类: humanCardId,
      机器人: aiCardId,
    },
    phase: "展示结算",
    pendingHumanCard: humanCard,
    pendingAiCard: aiCard,
    lastRoundSummary,
  };

  const w = terminalWinner(interim);
  if (w) {
    return {
      ...interim,
      phase: "已结束",
      winner: w,
    };
  }

  return interim;
}

export function continueAfterRound(state: GameState): GameState {
  if (state.phase !== "展示结算") {
    return state;
  }
  return {
    ...state,
    phase: "等待人类选牌",
    pendingHumanCard: undefined,
    pendingAiCard: undefined,
  };
}

export function terminalWinner(state: GameState): PlayerSide | "平局" | undefined {
  const h = state.human.hand.length;
  const a = state.ai.hand.length;
  if (h === 0 && a === 0) {
    return "平局";
  }
  if (h === 0) {
    return "机器人";
  }
  if (a === 0) {
    return "人类";
  }
  return undefined;
}

export function createInitialGameState(
  humanHand: CardInstance[],
  aiHand: CardInstance[],
  aiVisible: CardInstance[],
  aiHidden: CardInstance[],
): GameState {
  return {
    human: {
      hand: humanHand.map((c) => ({ ...c })),
      discard: [],
      visibleDeck: [],
      hiddenDeck: [],
    },
    ai: {
      hand: aiHand.map((c) => ({ ...c })),
      discard: [],
      visibleDeck: aiVisible.map((c) => ({ ...c })),
      hiddenDeck: aiHidden.map((c) => ({ ...c })),
    },
    lastPlayedId: {},
    phase: "等待人类选牌",
  };
}
