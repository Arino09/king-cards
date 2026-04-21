/**
 * 游戏管理器 — 整合塔系统、战斗、商店、角色等所有子系统。
 */

import type {
  GameState,
  BattleState,
  CardInstance,
  CardKind,
  CharacterId,
  RoguelikeBuff,
  AiDifficulty,
} from "./types";
import { CHARACTERS, TOWER_FLOORS } from "./types";
import { ALL_CARD_DEFS, PLAYABLE_CARD_KINDS } from "./cardDefs";
import {
  createBattleStateFromWeather,
  canPlay,
  legalPlays,
  cloneBattle,
  compareCards,
  checkFourSymbolsWin,
  getTerminalWinner,
  describeRound,
  applyCardEffects,
  discardCard,
  returnToHand,
} from "./battleEngine";
import { chooseBestAiCard } from "@/ai/battleAi";
import { nextCardId } from "./ids";
import {
  randomWeather,
  createDailyShop,
  buyItem,
  getWorkGold,
  generateCardRewards,
  applyBuffEffect,
  getCurrentFloorConfig,
  getStayLimit,
} from "./tower";
import { getCardRank } from "./rank";

// ========== 游戏初始化 ==========

export function createNewGame(
  character: CharacterId,
  buff: RoguelikeBuff,
  initialHand: CardKind[],
): GameState {
  const char = CHARACTERS[character];
  const buffResult = applyBuffEffect(buff, 50);

  // 解锁的牌：基础7种 + 通过Buff获得
  const baseCards: CardKind[] = ["国王", "平民", "护卫", "侍女", "盗贼", "贵族", "大臣"];

  return {
    tower: {
      currentFloor: 1,
      currentDay: 1,
      gold: buffResult.gold,
      weather: randomWeather(),
      character,
      buff,
      unlockedCards: [...baseCards],
      unlockedAchievements: [],
      unlockedEndings: [],
      unlockedBios: [],
      characterDialogueFlags: {},
      defeatedBosses: [],
      floorDays: 1,
      todayWeatherSet: true,
      shopRefreshedToday: false,
      todayAction: null,
      protagonistVisitedToday: false,
    },
    shop: createDailyShop(baseCards),
    battle: null,
    activeNPC: null,
    workGold: getWorkGold(character, randomWeather()),
    eventLog: ["你进入了塔中……"],
    runOver: false,
    runWon: false,
    cardRewardOptions: [],
    forcedBossBattle: false,
  };
}

// ========== 战斗开始 ==========

export function startBattle(state: GameState): GameState {
  const floor = getCurrentFloorConfig(state.tower.currentFloor);
  const playerHand = buildPlayerHand(state);

  const bossHand = buildBossHand(
    floor.bossHandSize,
    floor.bossHiddenCount,
    floor.bossVisibleCount,
    state.tower.unlockedCards,
  );

  const swapAvailable = state.tower.buff === "换卡功能" ? 1 : 0;

  const battle = createBattleStateFromWeather(
    playerHand,
    bossHand.hand,
    bossHand.visible,
    bossHand.hidden,
    state.tower.weather,
    swapAvailable,
    "boss",
    0,
    0,
  );

  return {
    ...state,
    battle,
    forcedBossBattle: false,
    eventLog: [
      ...state.eventLog,
      `第${state.tower.currentFloor}层 - ${floor.bossName}战开始！`,
    ],
  };
}

function buildPlayerHand(state: GameState): CardInstance[] {
  // 从已解锁卡牌中构建手牌（实际从 Zustand 存储中取，这里只是兜底）
  const kinds = PLAYABLE_CARD_KINDS.filter((k) =>
    state.tower.unlockedCards.includes(k as CardKind),
  );
  const result: CardInstance[] = [];
  for (const k of kinds.slice(0, 10)) {
    result.push({ id: nextCardId(), kind: k as CardKind });
  }
  // 确保有国王和平民
  if (!result.some((c) => c.kind === "国王")) {
    result[0] = { id: nextCardId(), kind: "国王" };
  }
  if (!result.some((c) => c.kind === "平民")) {
    result[1] = { id: nextCardId(), kind: "平民" };
  }
  return result;
}

function buildBossHand(
  handSize: number,
  hiddenCount: number,
  visibleCount: number,
  unlocked: CardKind[],
): { hand: CardInstance[]; visible: CardInstance[]; hidden: CardInstance[] } {
  const available = unlocked.length > 0 ? unlocked : PLAYABLE_CARD_KINDS;

  function randomKind(): CardKind {
    return available[Math.floor(Math.random() * available.length)] as CardKind;
  }

  const hand: CardKind[] = [];
  for (let i = 0; i < handSize; i++) hand.push(randomKind());
  if (!hand.includes("国王")) hand[0] = "国王";
  if (!hand.includes("平民")) hand[1] = "平民";

  const visible: CardKind[] = [];
  for (let i = 0; i < visibleCount; i++) visible.push(randomKind());

  const hidden: CardKind[] = [];
  for (let i = 0; i < hiddenCount; i++) hidden.push(randomKind());

  return {
    hand: hand.map((k) => ({ id: nextCardId(), kind: k })),
    visible: visible.map((k) => ({ id: nextCardId(), kind: k })),
    hidden: hidden.map((k) => ({ id: nextCardId(), kind: k })),
  };
}

// ========== 玩家出牌 ==========

export function playerSelectCard(
  battle: BattleState,
  cardId: string,
): BattleState | { error: string } {
  if (!canPlay(battle, "玩家", cardId)) {
    return { error: "无法出这张牌" };
  }
  const selected = battle.playerHand.find((c) => c.id === cardId);
  if (!selected) return { error: "牌不存在" };

  const next = cloneBattle(battle);
  next.phase = "等待玩家确认";
  next.pendingPlayerCard = selected;
  return next;
}

/** 确认出牌，触发AI响应 */
export function confirmPlay(state: GameState): GameState | { error: string } {
  const battle = state.battle;
  if (!battle) return { error: "不在战斗中" };
  if (!battle.pendingPlayerCard) return { error: "未选择牌" };

  const playerCard = battle.pendingPlayerCard;
  const difficulty = getCurrentFloorConfig(state.tower.currentFloor).difficulty;

  let aiCardId: string;
  try {
    aiCardId = chooseBestAiCard(battle, playerCard.id, difficulty);
  } catch {
    // AI没有合法着法
    aiCardId = legalPlays(battle, "机器人")[0]?.id ?? "";
  }

  const aiCard = battle.aiHand.find((c) => c.id === aiCardId);
  if (!aiCard) return { error: "AI选牌失败" };

  return resolveRound(state, playerCard.id, aiCardId);
}

/** 结算一回合 */
export function resolveRound(
  state: GameState,
  playerCardId: string,
  aiCardId: string,
): GameState {
  const battle = state.battle!;
  const playerCard = battle.playerHand.find((c) => c.id === playerCardId)!;
  const aiCard = battle.aiHand.find((c) => c.id === aiCardId)!;

  // 移除出的牌
  const next = cloneBattle(battle);
  const pIdx = next.playerHand.findIndex((c) => c.id === playerCardId);
  if (pIdx >= 0) next.playerHand.splice(pIdx, 1);
  const aIdx = next.aiHand.findIndex((c) => c.id === aiCardId);
  if (aIdx >= 0) next.aiHand.splice(aIdx, 1);

  const outcome = compareCards(playerCard, aiCard, next);

  // 特殊卡牌效果
  const withEffects = applyCardEffects(next, playerCard, aiCard, outcome);

  // 四象胜利检查
  const fourWin = checkFourSymbolsWin(withEffects);
  const finalOutcome = fourWin === "机器人"
    ? ("机器人胜" as const)
    : fourWin === "玩家"
      ? ("玩家胜" as const)
      : outcome;

  // 结算
  if (finalOutcome === "双败") {
    withEffects.playerDiscard.push({ ...playerCard });
    withEffects.aiDiscard.push({ ...aiCard });
  } else if (finalOutcome === "玩家胜") {
    withEffects.playerHand.push({ ...playerCard });
    withEffects.aiDiscard.push({ ...aiCard });
  } else {
    withEffects.playerDiscard.push({ ...playerCard });
    withEffects.aiHand.push({ ...aiCard });
  }

  withEffects.lastPlayedId = { 玩家: playerCardId, 机器人: aiCardId };
  withEffects.pendingPlayerCard = playerCard;
  withEffects.pendingAiCard = aiCard;
  withEffects.lastRoundSummary = describeRound(finalOutcome, playerCard, aiCard, withEffects);
  withEffects.turn += 1;
  withEffects.phase = "展示结算";

  // 检查终局
  const winner = getTerminalWinner(withEffects);
  if (winner) {
    withEffects.phase = "游戏结束";
    withEffects.winner = winner;

    // 构建战斗结果
    const baseGold = state.tower.currentFloor * 10;
    const goldMultiplier = CHARACTERS[state.tower.character]?.goldMultiplier ?? 1;
    const finalGold = state.tower.weather === "雨季"
      ? Math.floor(baseGold * goldMultiplier * 1.5)
      : Math.floor(baseGold * goldMultiplier);
    withEffects.result = {
      winner,
      turns: withEffects.turn - 1,
      baseGold: finalGold,
    };
  }

  return {
    ...state,
    battle: withEffects,
  };
}

// ========== 回合继续 ==========

export function continueAfterRound(state: GameState): GameState {
  const battle = state.battle!;
  if (battle.phase !== "展示结算") return state;

  const next = cloneBattle(battle);
  next.phase = "等待玩家选牌";
  next.pendingPlayerCard = undefined;
  next.pendingAiCard = undefined;

  return { ...state, battle: next };
}

// ========== NPC 战斗 ==========

function buildNpcHand(
  difficulty: AiDifficulty,
): { hand: CardInstance[]; visible: CardInstance[]; hidden: CardInstance[] } {
  // NPC 难度决定手牌数量：难度1-3用7张，4-6用8张，7-10用9张
  const handSize = difficulty <= 3 ? 7 : difficulty <= 6 ? 8 : 9;
  const visibleCount = Math.min(3 + Math.floor(difficulty / 3), 6);
  const hiddenCount = 1;

  const basicCards = PLAYABLE_CARD_KINDS.filter(
    (k) =>
      ALL_CARD_DEFS[k]?.cardType === "基础" ||
      ALL_CARD_DEFS[k]?.cardType === "补充",
  );

  function randomKind(): CardKind {
    return basicCards[Math.floor(Math.random() * basicCards.length)]!;
  }

  const hand: CardKind[] = [];
  for (let i = 0; i < handSize; i++) hand.push(randomKind());
  if (!hand.includes("国王")) hand[0] = "国王";
  if (!hand.includes("平民")) hand[1] = "平民";

  const visible: CardKind[] = [];
  for (let i = 0; i < visibleCount; i++) visible.push(randomKind());

  const hidden: CardKind[] = [];
  for (let i = 0; i < hiddenCount; i++) hidden.push(randomKind());

  return {
    hand: hand.map((k) => ({ id: nextCardId(), kind: k })),
    visible: visible.map((k) => ({ id: nextCardId(), kind: k })),
    hidden: hidden.map((k) => ({ id: nextCardId(), kind: k })),
  };
}

export function fightNpc(
  state: GameState,
  difficulty: AiDifficulty,
  npcPenalty: number,
): { type: "battle"; state: GameState } | { type: "event"; state: GameState } {
  const floor = getCurrentFloorConfig(state.tower.currentFloor);
  const roll = Math.random();

  // 1/7 打架；其余 6/7 均分给 3 种事件（各 2/14）
  if (roll < 1 / 14) {
    // 1/14 ≈ 7.1% 给卡
    const basicCards = PLAYABLE_CARD_KINDS.filter(
      (k) =>
        ALL_CARD_DEFS[k]?.cardType === "基础" ||
        ALL_CARD_DEFS[k]?.cardType === "补充",
    );
    const kind = basicCards[Math.floor(Math.random() * basicCards.length)]!;
    const newUnlocked = state.tower.unlockedCards.includes(kind)
      ? state.tower.unlockedCards
      : [...state.tower.unlockedCards, kind];
    return {
      type: "event",
      state: {
        ...state,
        tower: { ...state.tower, unlockedCards: newUnlocked },
        eventLog: [
          ...state.eventLog,
          `[${floor.npcName}] 送了你一张「${kind}」！`,
        ],
      },
    };
  }

  if (roll < 2 / 14) {
    // 1/14 ≈ 7.1% 给钱
    const gold = 10 + Math.floor(Math.random() * 15);
    return {
      type: "event",
      state: {
        ...state,
        tower: { ...state.tower, gold: state.tower.gold + gold },
        eventLog: [
          ...state.eventLog,
          `[${floor.npcName}] 赠予你 ${gold} 金币。`,
        ],
      },
    };
  }

  if (roll < 3 / 14) {
    // 1/14 ≈ 7.1% 无事
    const noEvents = [
      `${floor.npcName}看了你一眼，转身离开了。`,
      `${floor.npcName}似乎在沉睡，不想理会你。`,
      `今天${floor.npcName}不想说话。`,
    ];
    return {
      type: "event",
      state: {
        ...state,
        eventLog: [
          ...state.eventLog,
          `[${floor.npcName}] ${noEvents[Math.floor(Math.random() * noEvents.length)]}`,
        ],
      },
    };
  }

  // 1/7 打架
  const playerHand = buildPlayerHand(state);
  const npcHand = buildNpcHand(difficulty);
  const swapAvailable = state.tower.buff === "换卡功能" ? 1 : 0;
  const npcReward = 10 + Math.floor(difficulty * 3);

  const battle = createBattleStateFromWeather(
    playerHand,
    npcHand.hand,
    npcHand.visible,
    npcHand.hidden,
    state.tower.weather,
    swapAvailable,
    "npc",
    npcPenalty,
    npcReward,
  );

  return {
    type: "battle",
    state: {
      ...state,
      battle,
      eventLog: [
        ...state.eventLog,
        `[${floor.npcName}] 向你发起了挑战！`,
      ],
    },
  };
}

// ========== 战斗结束 ==========

export function endBattle(state: GameState): { game: GameState; runOver: boolean; runWon: boolean } {
  const battle = state.battle!;
  const winner = battle.winner ?? "平局";
  const result = battle.result;
  const isNpc = battle.battleType === "npc";

  let newState = { ...state, battle: null };

  if (winner === "玩家") {
    if (isNpc) {
      // NPC战获胜
      const reward = battle.npcReward;
      newState = {
        ...newState,
        tower: {
          ...newState.tower,
          gold: newState.tower.gold + reward,
        },
        eventLog: [
          ...newState.eventLog,
          `你战胜了${getCurrentFloorConfig(state.tower.currentFloor).npcName}！获得${reward}金币。`,
        ],
      };
    } else {
      // Boss战获胜
      const floor = getCurrentFloorConfig(state.tower.currentFloor);
      const earned = result?.baseGold ?? state.tower.currentFloor * 10;
      const char = CHARACTERS[state.tower.character];
      const extraCards = char.extraCardsOnWin;
      const defeatedKinds: CardKind[] = [
        ...battle.aiHand.map((c) => c.kind),
        ...battle.aiDiscard.map((c) => c.kind),
        ...battle.aiVisibleDeck.map((c) => c.kind),
        ...battle.aiHiddenDeck.map((c) => c.kind),
      ].filter((k): k is CardKind => k !== undefined);

      const options = generateCardRewards(defeatedKinds, 1 + extraCards);
      newState = {
        ...newState,
        tower: {
          ...newState.tower,
          gold: newState.tower.gold + earned,
          defeatedBosses: [...newState.tower.defeatedBosses, floor.bossName],
        },
        cardRewardOptions: options,
        eventLog: [
          ...newState.eventLog,
          `你击败了${floor.bossName}！获得${earned}金币。`,
          ...(options.length > 0 ? ["选择一张卡牌作为奖励。"] : []),
        ],
      };
    }
  } else {
    // 战斗失败
    if (isNpc) {
      // NPC战失败，扣钱
      const penalty = battle.npcPenalty;
      const floor = getCurrentFloorConfig(state.tower.currentFloor);
      const lostGold = Math.min(penalty, newState.tower.gold);
      newState = {
        ...newState,
        tower: {
          ...newState.tower,
          gold: newState.tower.gold - lostGold,
        },
        eventLog: [
          ...newState.eventLog,
          `你输给了${floor.npcName}……被夺走${lostGold}金币。`,
        ],
      };
      // NPC失败不游戏结束，但资金归零则游戏失败
      if (newState.tower.gold <= 0) {
        return { game: { ...newState, forcedBossBattle: false }, runOver: true, runWon: false };
      }
    } else {
      // Boss战失败，游戏结束
      const floor = getCurrentFloorConfig(state.tower.currentFloor);
      newState = {
        ...newState,
        forcedBossBattle: false,
        runOver: true,
        runWon: false,
        eventLog: [
          ...newState.eventLog,
          `你败给了${floor.bossName}……塔之旅到此结束。`,
        ],
      };
    }
  }

  return { game: { ...newState, forcedBossBattle: false }, runOver: false, runWon: false };
}

/** 选择奖励卡牌 */
export function selectRewardCard(state: GameState, kind: CardKind): GameState {
  if (!state.cardRewardOptions.includes(kind)) {
    return state;
  }
  const unlocked = state.tower.unlockedCards.includes(kind)
    ? state.tower.unlockedCards
    : [...state.tower.unlockedCards, kind];

  return {
    ...state,
    tower: {
      ...state.tower,
      unlockedCards: unlocked,
    },
    cardRewardOptions: state.cardRewardOptions.filter((k) => k !== kind),
    eventLog: [...state.eventLog, `获得卡牌：${kind}`],
  };
}

// ========== 商店操作 ==========

export function purchaseItem(
  state: GameState,
  itemId: string,
): GameState {
  const result = buyItem(state.shop, itemId, state.tower.gold);
  if (result.error || !result.card) {
    return state;
  }

  const unlocked = state.tower.unlockedCards.includes(result.card)
    ? state.tower.unlockedCards
    : [...state.tower.unlockedCards, result.card];

  return {
    ...state,
    tower: {
      ...state.tower,
      gold: result.newGold,
      unlockedCards: unlocked,
    },
    shop: result.shop,
    eventLog: [...state.eventLog, `购买：${result.card}（-${result.shop.find((i) => i.id === itemId)?.price}金币）`],
  };
}

// ========== 每日行动 ==========

export function doWork(state: GameState): GameState {
  const gold = getWorkGold(state.tower.character, state.tower.weather);
  return {
    ...state,
    tower: {
      ...state.tower,
      gold: state.tower.gold + gold,
    },
    eventLog: [...state.eventLog, `打工获得${gold}金币。`],
  };
}

export function rest(state: GameState): GameState {
  const bonus = state.tower.buff === "休息多资金" ? 15 : 5;
  return {
    ...state,
    tower: {
      ...state.tower,
      gold: state.tower.gold + bonus,
    },
    eventLog: [...state.eventLog, `休息恢复，获得${bonus}金币。`],
  };
}

/** 进入下一层 */
export function advanceFloor(state: GameState): GameState {
  const nextFloor = Math.min(state.tower.currentFloor + 1, 7);
  const allFloors = TOWER_FLOORS.map((f) => f.floor);

  if (nextFloor > 7) {
    // 通关
    return {
      ...state,
      runOver: true,
      runWon: true,
      forcedBossBattle: false,
      tower: {
        ...state.tower,
        currentFloor: 7,
      },
      eventLog: [...state.eventLog, "恭喜你通关了七层塔！"],
    };
  }

  const floor = getCurrentFloorConfig(nextFloor);
  return {
    ...state,
    forcedBossBattle: false,
    tower: {
      ...state.tower,
      currentFloor: nextFloor,
      currentDay: 1,
      floorDays: 1,
      todayWeatherSet: false,
      shopRefreshedToday: false,
      todayAction: null,
      protagonistVisitedToday: false,
      weather: randomWeather(),
    },
    shop: createDailyShop(state.tower.unlockedCards),
    eventLog: [
      ...state.eventLog,
      `进入${floor.name}——${floor.bossName}在等待着……`,
    ],
  };
}

/** 结算一天结束 */
export function advanceDay(state: GameState): GameState {
  const limit = getStayLimit(state.tower.character);
  const newFloorDays = state.tower.floorDays + 1;

  if (newFloorDays > limit) {
    // 超时惩罚：强制 Boss 战（输了游戏结束）
    return {
      ...state,
      forcedBossBattle: true,
      eventLog: [
        ...state.eventLog,
        `在${getCurrentFloorConfig(state.tower.currentFloor).name}停留过久，强制进入 Boss 战！`,
      ],
    };
  }

  return {
    ...state,
    tower: {
      ...state.tower,
      currentDay: state.tower.currentDay + 1,
      floorDays: newFloorDays,
      todayWeatherSet: false,
      shopRefreshedToday: false,
      todayAction: null,
      protagonistVisitedToday: false,
      weather: randomWeather(),
    },
    shop: createDailyShop(state.tower.unlockedCards),
    eventLog: [...state.eventLog, `第${state.tower.currentDay + 1}天开始了。`],
  };
}

// ========== 时间回溯（男1技能）==========

export function useRewind(state: GameState): GameState | { error: string } {
  const battle = state.battle;
  if (!battle) return { error: "不在战斗中" };
  if (battle.rewindUsed["玩家"]) return { error: "已使用过时间回溯" };
  if (battle.turn <= 1) return { error: "无法回溯" };

  const next = cloneBattle(battle);
  next.rewindUsed["玩家"] = true;
  next.phase = "等待玩家选牌";
  next.pendingPlayerCard = undefined;
  next.pendingAiCard = undefined;

  return { ...state, battle: next, eventLog: [...state.eventLog, "使用了时间回溯！"] };
}
