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
  applyConsumableEffect,
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
  chaosKinds: CardKind[] = [],
): GameState {
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
      chaosKinds,
      currentDialogue: null,
      lockedDeck: initialHand,
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

  // Buff#4 平民随机能力（3~0）、Buff#5 国王随机能力（4~0）
  const randomRank: Record<string, number> = {};
  if (state.tower.buff === "平民随机能力") {
    for (const card of playerHand) {
      if (card.kind === "平民") {
        randomRank[card.id] = Math.floor(Math.random() * 4); // 0~3
      }
    }
  }
  if (state.tower.buff === "国王随机能力") {
    for (const card of playerHand) {
      if (card.kind === "国王") {
        randomRank[card.id] = Math.floor(Math.random() * 5); // 0~4
      }
    }
  }

  battle.randomRank = randomRank;

  return {
    ...state,
    battle,
    forcedBossBattle: false,
    tower: {
      ...state.tower,
      currentDialogue: `[${floor.bossName}]：${floor.bossDialogue[Math.floor(Math.random() * floor.bossDialogue.length)] ?? ""}\n\n此处为对话，暂无`,
    },
    eventLog: [
      ...state.eventLog,
      `第${state.tower.currentFloor}层 - ${floor.bossName}战开始！`,
      `[对话] 此处为对话，暂无`,
    ],
  };
}

function buildPlayerHand(state: GameState): CardInstance[] {
  // Buff#10 混乱自选三张：完全混乱（随机使用自选3张+国王+平民的随机子集）
  // 非Boss战斗时使用混乱手牌；Boss战用正常逻辑
  if (state.tower.buff === "混乱自选三张" && state.tower.chaosKinds.length === 3) {
    const result: CardInstance[] = [];
    result.push({ id: nextCardId(), kind: "国王" });
    result.push({ id: nextCardId(), kind: "平民" });
    // 从自选3张中随机选0~3张
    const shuffled = [...state.tower.chaosKinds].sort(() => Math.random() - 0.5);
    const extraCount = Math.floor(Math.random() * 4); // 0~3
    for (let i = 0; i < extraCount; i++) {
      result.push({ id: nextCardId(), kind: shuffled[i] as CardKind });
    }
    return result;
  }

  // 正常手牌构建：恰好有一张国王和一张平民，其余随机补满至10张
  const kinds = PLAYABLE_CARD_KINDS.filter((k) =>
    state.tower.unlockedCards.includes(k as CardKind),
  );
  const result: CardInstance[] = [];

  result.push({ id: nextCardId(), kind: "国王" });
  result.push({ id: nextCardId(), kind: "平民" });

  const shuffled = [...kinds]
    .filter((k) => k !== "国王" && k !== "平民")
    .sort(() => Math.random() - 0.5);
  for (const k of shuffled) {
    if (result.length >= 10) break;
    result.push({ id: nextCardId(), kind: k as CardKind });
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
  // 可选池：排除国王和平民（各只放1张）
  const pool = available.filter((k) => k !== "国王" && k !== "平民") as CardKind[];

  function randomKind(): CardKind {
    return pool[Math.floor(Math.random() * pool.length)] as CardKind;
  }

  const hand: CardKind[] = [];
  for (let i = 0; i < handSize; i++) hand.push(randomKind());
  // 确保恰好各1张国王和平民
  hand[0] = "国王";
  hand[1] = "平民";

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

  // 清空本回合一次性卡牌效果
  next.pendingRankAdjust = { 玩家: 0, 机器人: 0 };
  next.pendingConsumeRecall = { 玩家: false, 机器人: false };
  next.pendingConsumeCancelFunc = { 玩家: false, 机器人: false };
  next.pendingConsumeCancelAbility = { 玩家: false, 机器人: false };
  next.pendingPeekCard = { 玩家: null, 机器人: null };

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

  // 结算（考虑续命效果：续命方本次输牌不进弃牌堆）
  if (finalOutcome === "双败") {
    if (!withEffects.pendingConsumeRecall["玩家"]) {
      withEffects.playerDiscard.push({ ...playerCard });
    }
    if (!withEffects.pendingConsumeRecall["机器人"]) {
      withEffects.aiDiscard.push({ ...aiCard });
    }
  } else if (finalOutcome === "玩家胜") {
    withEffects.playerHand.push({ ...playerCard });
    if (!withEffects.pendingConsumeRecall["机器人"]) {
      withEffects.aiDiscard.push({ ...aiCard });
    }
  } else {
    if (!withEffects.pendingConsumeRecall["玩家"]) {
      withEffects.playerDiscard.push({ ...playerCard });
    }
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

  // 再次检查终局：某方手牌已空则直接结束
  const winner = getTerminalWinner(battle);
  if (winner) {
    const next = cloneBattle(battle);
    next.phase = "游戏结束";
    next.winner = winner;
    const baseGold = state.tower.currentFloor * 10;
    const goldMultiplier = CHARACTERS[state.tower.character]?.goldMultiplier ?? 1;
    const finalGold = state.tower.weather === "雨季"
      ? Math.floor(baseGold * goldMultiplier * 1.5)
      : Math.floor(baseGold * goldMultiplier);
    next.result = {
      winner,
      turns: next.turn - 1,
      baseGold: finalGold,
    };
    return { ...state, battle: next };
  }

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
  // 可选池：排除国王和平民（各只放1张）
  const pool = basicCards.filter((k) => k !== "国王" && k !== "平民") as CardKind[];

  function randomKind(): CardKind {
    return pool[Math.floor(Math.random() * pool.length)] as CardKind;
  }

  const hand: CardKind[] = [];
  for (let i = 0; i < handSize; i++) hand.push(randomKind());
  // 确保恰好各1张国王和平民
  hand[0] = "国王";
  hand[1] = "平民";

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
    // Buff#6 随机卡牌数量（0~2）
    const actuallyGain = state.tower.buff === "随机卡牌数量"
      ? Math.floor(Math.random() * 3) > 0 // 2/3概率得卡
      : true;
    if (!actuallyGain) {
      return {
        type: "event",
        state: {
          ...state,
          eventLog: [
            ...state.eventLog,
            `[${floor.npcName}] 送了你一张「${kind}」，但随机效果让你失去了它！`,
          ],
        },
      };
    }
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
        tower: {
          ...state.tower,
          currentDialogue: `[${floor.npcName}]：${noEvents[Math.floor(Math.random() * noEvents.length)]}\n\n此处为对话，暂无`,
        },
        eventLog: [
          ...state.eventLog,
          `[${floor.npcName}] ${noEvents[Math.floor(Math.random() * noEvents.length)]}`,
          `[对话] 此处为对话，暂无`,
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

  // Buff#4 平民随机能力（3~0）、Buff#5 国王随机能力（4~0）
  const randomRank: Record<string, number> = {};
  if (state.tower.buff === "平民随机能力") {
    for (const card of playerHand) {
      if (card.kind === "平民") {
        randomRank[card.id] = Math.floor(Math.random() * 4);
      }
    }
  }
  if (state.tower.buff === "国王随机能力") {
    for (const card of playerHand) {
      if (card.kind === "国王") {
        randomRank[card.id] = Math.floor(Math.random() * 5);
      }
    }
  }
  battle.randomRank = randomRank;

  return {
    type: "battle",
    state: {
      ...state,
      battle,
      tower: {
        ...state.tower,
        currentDialogue: `[${floor.npcName}]：\n\n此处为对话，暂无`,
      },
      eventLog: [
        ...state.eventLog,
        `[${floor.npcName}] 向你发起了挑战！`,
        `[对话] 此处为对话，暂无`,
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
      // 收集敌人所有卡牌，去重，排除国王和平民（不可获得）
      const allDefeatedKinds = new Set<CardKind>();
      for (const c of battle.aiHand) allDefeatedKinds.add(c.kind);
      for (const c of battle.aiDiscard) allDefeatedKinds.add(c.kind);
      for (const c of battle.aiVisibleDeck) allDefeatedKinds.add(c.kind);
      for (const c of battle.aiHiddenDeck) allDefeatedKinds.add(c.kind);
      allDefeatedKinds.delete("国王");
      allDefeatedKinds.delete("平民");

      // 策划：获胜后自行选择获得一张敌人卡牌（除国王和平民外）
      // 女2额外获得1张（自动获得，不需选择）
      const selectableKinds = Array.from(allDefeatedKinds) as CardKind[];

      // 女2额外卡：直接解锁（随机1张，不放入选项）
      let newUnlocked = newState.tower.unlockedCards;
      const shuffled = selectableKinds.sort(() => Math.random() - 0.5);
      const autoBonus = shuffled.slice(0, extraCards);
      for (const kind of autoBonus) {
        if (!newUnlocked.includes(kind)) {
          newUnlocked = [...newUnlocked, kind];
        }
      }

      // 玩家从所有敌人卡牌中自选一张
      const options = selectableKinds;
      newState = {
        ...newState,
        tower: {
          ...newState.tower,
          gold: newState.tower.gold + earned,
          defeatedBosses: [...newState.tower.defeatedBosses, floor.bossName],
          unlockedCards: newUnlocked,
        },
        cardRewardOptions: options,
        eventLog: [
          ...newState.eventLog,
          `你击败了${floor.bossName}！获得${earned}金币。`,
          ...(autoBonus.length > 0 ? [`女2被动：额外获得「${autoBonus[0]}」！`] : []),
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
  // Buff#6 随机卡牌数量（0~2）
  if (state.tower.buff === "随机卡牌数量" && Math.floor(Math.random() * 3) === 0) {
    // 1/3概率得0张
    return {
      ...state,
      cardRewardOptions: state.cardRewardOptions.filter((k) => k !== kind),
      eventLog: [...state.eventLog, `「${kind}」被随机效果吞没了……`],
    };
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
