/**
 * 战斗引擎核心 — 处理出牌、结算、特殊卡牌效果。
 */

import { ALL_CARD_DEFS, FOUR_SYMBOLS } from "./cardDefs";
import type {
  BattleState,
  CardInstance,
  CardKind,
  PlayerSide,
  BattleResult,
  Weather,
} from "./types";
import { getCardRank, isCivilian, isKing } from "./rank";
import { nextCardId } from "./ids";

// ========== 辅助函数 ==========

export function cloneBattle(s: BattleState): BattleState {
  return {
    ...s,
    playerHand: s.playerHand.map((c) => ({ ...c })),
    playerDiscard: s.playerDiscard.map((c) => ({ ...c })),
    playerVisibleDeck: s.playerVisibleDeck.map((c) => ({ ...c })),
    playerActiveConsumables: s.playerActiveConsumables.map((c) => ({ ...c })),
    aiHand: s.aiHand.map((c) => ({ ...c })),
    aiDiscard: s.aiDiscard.map((c) => ({ ...c })),
    aiVisibleDeck: s.aiVisibleDeck.map((c) => ({ ...c })),
    aiHiddenDeck: s.aiHiddenDeck.map((c) => ({ ...c })),
    lastPlayedId: { ...s.lastPlayedId },
    rewindUsed: { ...s.rewindUsed },
    fourSymbolsWon: {
      玩家: [...s.fourSymbolsWon.玩家],
      机器人: [...s.fourSymbolsWon.机器人],
    },
    atlantisUsed: { ...s.atlantisUsed },
    continuousPlayed: { ...s.continuousPlayed },
    divinerNextWin: { ...s.divinerNextWin },
    roundModifier: { ...s.roundModifier },
    triggerMod: { ...s.triggerMod },
    exponentialActive: { ...s.exponentialActive },
    goldenNecklaceActive: { ...s.goldenNecklaceActive },
    gamblerActive: { ...s.gamblerActive },
    daydreamActive: { ...s.daydreamActive },
    swapAvailable: { ...s.swapAvailable },
    civilizationActive: { ...s.civilizationActive },
    dialogueHistory: [...s.dialogueHistory],
  };
}

/** 获取某方所有手牌 */
export function getHand(state: BattleState, side: PlayerSide): CardInstance[] {
  return side === "玩家" ? state.playerHand : state.aiHand;
}

/** 获取某方弃牌堆 */
export function getDiscard(state: BattleState, side: PlayerSide): CardInstance[] {
  return side === "玩家" ? state.playerDiscard : state.aiDiscard;
}

/** 是否可以出这张牌 */
export function canPlay(
  state: BattleState,
  side: PlayerSide,
  cardId: string,
): boolean {
  const hand = getHand(state, side);
  const card = hand.find((c) => c.id === cardId);
  if (!card) return false;
  if (state.lastPlayedId[side] === cardId) return false;
  return true;
}

/** 获取所有合法出牌 */
export function legalPlays(state: BattleState, side: PlayerSide): CardInstance[] {
  const hand = getHand(state, side);
  const last = state.lastPlayedId[side];
  return hand.filter((c) => c.id !== last);
}

// ========== 胜负判定 ==========

export type CompareOutcome = "玩家胜" | "机器人胜" | "双败";

/**
 * 比较两张牌的胜负。
 * 规则：等级小的赢；平民>国王；同等级/同牌双败。
 * 功能牌等级0，不参与等级比较，由效果决定胜负。
 */
export function compareCards(
  playerCard: CardInstance,
  aiCard: CardInstance,
  battle: BattleState,
): CompareOutcome {
  const pDef = ALL_CARD_DEFS[playerCard.kind];
  const aDef = ALL_CARD_DEFS[aiCard.kind];

  // 1. 刺客：强制双败（优先级最低）
  // 2. 占卜师：本回合必输（但若对手也是占卜师，都输）
  // 3. 伪神：本回合必赢
  // 4. 影子：复制对手上一张
  // 5. 功能牌等级0：不参与等级比较

  // 占卜师必输（先处理，后续覆盖）
  const pDiviner = pDef.type === "must_loss_then_win";
  const aDiviner = aDef.type === "must_loss_then_win";

  // 伪神必赢
  if (pDef.type === "must_win") {
    // 记录下回合必输
    return "玩家胜";
  }
  if (aDef.type === "must_win") {
    return "机器人胜";
  }

  // 双方都是占卜师 → 双败
  if (pDiviner && aDiviner) {
    return "双败";
  }
  // 玩家占卜师
  if (pDiviner) {
    // 若对手是伪神，已在上面处理
    return "机器人胜";
  }
  // 机器人占卜师
  if (aDiviner) {
    return "玩家胜";
  }

  // 刺客：强制双败
  if (pDef.type === "double_loss" || aDef.type === "double_loss") {
    return "双败";
  }

  // 影子：复制对手上一张
  if (pDef.type === "copy_opponent") {
    // 复制对手上一张，用对手牌的等级
    const aiPrev = battle.lastPlayedId["机器人"];
    if (aiPrev) {
      const aiPrevCard = battle.aiHand.find((c) => c.id === aiPrev) ||
        battle.aiDiscard.find((c) => c.id === aiPrev);
      if (aiPrevCard) {
        return compareWithRankOverride(
          { ...playerCard, kind: aiPrevCard.kind },
          aiCard,
          battle,
        );
      }
    }
    // 复制不到，按等级0处理（最小）→ 输
    return "机器人胜";
  }
  if (aDef.type === "copy_opponent") {
    const pPrev = battle.lastPlayedId["玩家"];
    if (pPrev) {
      const pPrevCard = battle.playerHand.find((c) => c.id === pPrev) ||
        battle.playerDiscard.find((c) => c.id === pPrev);
      if (pPrevCard) {
        return compareWithRankOverride(
          playerCard,
          { ...aiCard, kind: pPrevCard.kind },
          battle,
        );
      }
    }
    return "玩家胜";
  }

  // 四象判定：在比较等级之前，先检查四象
  if (isFourSymbols(pDef) || isFourSymbols(aDef)) {
    // 四象按等级比较，但赢时要标记
  }

  // 普通等级比较
  return compareWithRankOverride(playerCard, aiCard, battle);
}

function isFourSymbols(def: (typeof ALL_CARD_DEFS)[string]): boolean {
  return def.type === "four_symbols";
}

/** 带等级覆盖的比较（用于影子复制后） */
function compareWithRankOverride(
  playerCard: CardInstance,
  aiCard: CardInstance,
  battle: BattleState,
): CompareOutcome {
  const pRank = getCardRank(playerCard, "玩家", battle);
  const aRank = getCardRank(aiCard, "机器人", battle);

  // 同等级 → 双败
  if (pRank === aRank) return "双败";

  // 平民 > 国王（特殊克制）
  const pCivilian = isCivilian(playerCard.kind);
  const aKing = isKing(aiCard.kind);
  if (pCivilian && aKing) return "玩家胜";

  const aCivilian = isCivilian(aiCard.kind);
  const pKing = isKing(playerCard.kind);
  if (aCivilian && pKing) return "机器人胜";

  // 普通等级比较：小的赢
  return pRank < aRank ? "玩家胜" : "机器人胜";
}

// ========== 特殊卡牌触发 ==========

/**
 * 在出牌后触发特殊效果，返回更新后的战斗状态。
 */
export function applyCardEffects(
  battle: BattleState,
  playerCard: CardInstance,
  aiCard: CardInstance,
  outcome: CompareOutcome,
): BattleState {
  const next = cloneBattle(battle);

  const pDef = ALL_CARD_DEFS[playerCard.kind];
  const aDef = ALL_CARD_DEFS[aiCard.kind];

  // 占卜师：标记下回合必赢
  if (pDef.type === "must_loss_then_win") {
    next.divinerNextWin["玩家"] = true;
  }
  if (aDef.type === "must_loss_then_win") {
    next.divinerNextWin["机器人"] = true;
  }

  // 伪神：下回合必输（暂存，战斗结束后处理）
  // （通过 lastPlayedId 的特殊标记处理，或在下回合开始时处理）

  // 命运：交换可见牌组
  if (pDef.type === "swap_visible" || aDef.type === "swap_visible") {
    const pv = [...next.playerVisibleDeck];
    const av = [...next.aiVisibleDeck];
    next.playerVisibleDeck = av;
    next.aiVisibleDeck = pv;
    next.visibleSwapped = true;
  }

  // 文明：手牌全变国王
  if (pDef.type === "all_become_king") {
    next.civilizationActive["玩家"] = true;
  }
  if (aDef.type === "all_become_king") {
    next.civilizationActive["机器人"] = true;
  }

  // 亚特兰蒂斯：取消上限
  if (pDef.type === "none" && playerCard.kind === "亚特兰蒂斯") {
    next.noTurnLimit = true;
    next.atlantisUsed["玩家"] = true;
  }
  if (aDef.type === "none" && aiCard.kind === "亚特兰蒂斯") {
    next.noTurnLimit = true;
    next.atlantisUsed["机器人"] = true;
  }

  // 永不放弃/奉献精神：增加出牌次数
  if (pDef.type === "continuous_rank") {
    next.continuousPlayed["玩家"] += 1;
  }
  if (aDef.type === "continuous_rank") {
    next.continuousPlayed["机器人"] += 1;
  }

  // 偶数/奇数形态
  if (pDef.type === "trigger_modifier" && pDef.param !== undefined) {
    if (pDef.param === 0) next.triggerMod["玩家"] = "even";
    if (pDef.param === 1) next.triggerMod["玩家"] = "odd";
  }
  if (aDef.type === "trigger_modifier" && aDef.param !== undefined) {
    if (aDef.param === 0) next.triggerMod["机器人"] = "even";
    if (aDef.param === 1) next.triggerMod["机器人"] = "odd";
  }

  // 指数形态
  if (pDef.type === "trigger_modifier" && pDef.param === 2) {
    next.exponentialActive["玩家"] = true;
  }
  if (aDef.type === "trigger_modifier" && aDef.param === 2) {
    next.exponentialActive["机器人"] = true;
  }

  // 暖日/雪花
  if (pDef.type === "round_modifier") {
    // 暖日：.5牌-0.25
    if (playerCard.kind === "暖日") {
      next.roundModifier["玩家"] -= 0.25;
    }
    // 雪花：.5牌+0.25
    if (playerCard.kind === "雪花") {
      next.roundModifier["机器人"] += 0.25;
    }
  }
  if (aDef.type === "round_modifier") {
    if (aiCard.kind === "暖日") {
      next.roundModifier["玩家"] -= 0.25;
    }
    if (aiCard.kind === "雪花") {
      next.roundModifier["机器人"] += 0.25;
    }
  }

  // 金色项链
  if (playerCard.kind === "金色项链") {
    next.goldenNecklaceActive["玩家"] = true;
  }
  if (aiCard.kind === "金色项链") {
    next.goldenNecklaceActive["机器人"] = true;
  }

  // 孤注一掷
  if (playerCard.kind === "孤注一掷") {
    next.gamblerActive["玩家"] = true;
  }
  if (aiCard.kind === "孤注一掷") {
    next.gamblerActive["机器人"] = true;
  }

  // 白日梦
  if (playerCard.kind === "白日梦") {
    next.daydreamActive["玩家"] = true;
  }
  if (aiCard.kind === "白日梦") {
    next.daydreamActive["机器人"] = true;
  }

  // 换卡功能
  if (playerCard.kind === "换卡") {
    next.swapAvailable["玩家"] += 1;
  }

  // 四象赢过标记
  if (isFourSymbols(pDef) && outcome === "玩家胜") {
    if (!next.fourSymbolsWon["玩家"].includes(playerCard.kind)) {
      next.fourSymbolsWon["玩家"].push(playerCard.kind);
    }
  }
  if (isFourSymbols(aDef) && outcome === "机器人胜") {
    if (!next.fourSymbolsWon["机器人"].includes(aiCard.kind)) {
      next.fourSymbolsWon["机器人"].push(aiCard.kind);
    }
  }

  return next;
}

// ========== 弃牌/回手 ==========

/**
 * 将卡牌加入弃牌堆
 */
export function discardCard(card: CardInstance, battle: BattleState, side: PlayerSide): BattleState {
  const next = cloneBattle(battle);
  const hand = side === "玩家" ? next.playerHand : next.aiHand;
  const discard = side === "玩家" ? next.playerDiscard : next.aiDiscard;
  const idx = hand.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    hand.splice(idx, 1);
    discard.push({ ...card });
  }
  return next;
}

/**
 * 将卡牌返回手牌
 */
export function returnToHand(card: CardInstance, battle: BattleState, side: PlayerSide): BattleState {
  const next = cloneBattle(battle);
  const hand = side === "玩家" ? next.playerHand : next.aiHand;
  const discard = side === "玩家" ? next.playerDiscard : next.aiDiscard;
  const idx = discard.findIndex((c) => c.id === card.id);
  if (idx >= 0) {
    discard.splice(idx, 1);
    hand.push({ ...card });
  }
  return next;
}

// ========== 四象胜利检查 ==========

export function checkFourSymbolsWin(battle: BattleState): PlayerSide | null {
  for (const side of (["玩家", "机器人"] as PlayerSide[])) {
    const won = battle.fourSymbolsWon[side];
    const hasAllFour = FOUR_SYMBOLS.every((s) => won.includes(s));
    if (hasAllFour) return side;
  }
  return null;
}

// ========== 回合结束处理 ==========

/**
 * 每回合结束时调用：处理白日梦效果（随机换牌）
 */
export function applyDaydreamEffect(battle: BattleState): BattleState {
  const next = cloneBattle(battle);

  for (const side of (["玩家", "机器人"] as PlayerSide[])) {
    if (battle.daydreamActive[side]) {
      const hand = side === "玩家" ? next.playerHand : next.aiHand;
      if (hand.length > 0) {
        const idx = Math.floor(Math.random() * hand.length);
        const randomKind = getRandomPlayableKind();
        hand[idx] = { id: nextCardId(), kind: randomKind };
      }
    }
  }

  return next;
}

/** 随机获取一张可出牌 */
function getRandomPlayableKind(): CardKind {
  const kinds = Object.keys(ALL_CARD_DEFS).filter(
    (k) => ALL_CARD_DEFS[k]!.cardType !== "一次性",
  );
  return kinds[Math.floor(Math.random() * kinds.length)] as CardKind;
}

// ========== 终局判定 ==========

export function getTerminalWinner(battle: BattleState): PlayerSide | "平局" | undefined {
  // 1. 任一方手牌耗尽
  if (battle.playerHand.length === 0 && battle.aiHand.length === 0) {
    return "平局";
  }
  if (battle.playerHand.length === 0) return "机器人";
  if (battle.aiHand.length === 0) return "玩家";

  // 2. 达到上限回合（且不是暖风/亚特兰蒂斯）
  if (!battle.noTurnLimit && battle.turn >= battle.maxTurns) {
    // 计算剩余总等级
    const pTotal = battle.playerHand.reduce((s, c) => s + getCardRank(c, "玩家", battle), 0);
    const aTotal = battle.aiHand.reduce((s, c) => s + getCardRank(c, "机器人", battle), 0);
    if (pTotal < aTotal) return "玩家胜";
    if (aTotal < pTotal) return "机器人胜";
    return "平局";
  }

  return undefined;
}

/** 构建回合结算文字 */
export function describeRound(
  outcome: CompareOutcome,
  playerCard: CardInstance,
  aiCard: CardInstance,
  battle: BattleState,
): string {
  const pRank = getCardRank(playerCard, "玩家", battle);
  const aRank = getCardRank(aiCard, "机器人", battle);
  const pName = playerCard.kind;
  const aName = aiCard.kind;

  if (outcome === "双败") {
    return `双败：${pName}(${pRank}) vs ${aName}(${aRank})。双方牌进入弃牌堆。`;
  }
  if (outcome === "玩家胜") {
    return `你胜：${pName}(${pRank}) 胜 ${aName}(${aRank})。对方牌进入弃牌堆。`;
  }
  return `对方胜：${aName}(${aRank}) 胜 ${pName}(${pRank})。你的牌进入弃牌堆。`;
}

/** 根据天气生成初始战斗状态 */
export function createBattleStateFromWeather(
  playerHand: CardInstance[],
  aiHand: CardInstance[],
  aiVisible: CardInstance[],
  aiHidden: CardInstance[],
  weather: Weather,
  swapAvailable: number,
  battleType: "boss" | "npc" = "boss",
  npcPenalty: number = 0,
  npcReward: number = 0,
): BattleState {
  let weatherModifier = 0;
  if (weather === "烈日") weatherModifier = 0.5;
  if (weather === "冰雹") weatherModifier = -0.5;

  const noTurnLimit = weather === "暖风";

  return {
    playerHand: playerHand.map((c) => ({ ...c })),
    playerDiscard: [],
    playerVisibleDeck: [],
    playerActiveConsumables: [],
    aiHand: aiHand.map((c) => ({ ...c })),
    aiDiscard: [],
    aiVisibleDeck: aiVisible.map((c) => ({ ...c })),
    aiHiddenDeck: aiHidden.map((c) => ({ ...c })),
    lastPlayedId: {},
    phase: "等待玩家选牌",
    pendingPlayerCard: undefined,
    pendingAiCard: undefined,
    turn: 1,
    maxTurns: 10,
    rewindUsed: { 玩家: false, 机器人: false },
    fourSymbolsWon: { 玩家: [], 机器人: [] },
    weatherModifier,
    noTurnLimit,
    visibleSwapped: false,
    atlantisUsed: { 玩家: false, 机器人: false },
    continuousPlayed: { 玩家: 0, 机器人: 0 },
    divinerNextWin: { 玩家: false, 机器人: false },
    roundModifier: { 玩家: 0, 机器人: 0 },
    triggerMod: { 玩家: null, 机器人: null },
    exponentialActive: { 玩家: false, 机器人: false },
    goldenNecklaceActive: { 玩家: false, 机器人: false },
    gamblerActive: { 玩家: false, 机器人: false },
    daydreamActive: { 玩家: false, 机器人: false },
    swapAvailable: { 玩家: swapAvailable, 机器人: 0 },
    civilizationActive: { 玩家: false, 机器人: false },
    dialogueHistory: [],
    battleType,
    npcPenalty,
    npcReward,
  };
}
