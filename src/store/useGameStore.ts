/**
 * 游戏 Store — 使用 Zustand 管理完整游戏状态。
 */

import { create } from "zustand";
import type {
  GameState,
  BattleState,
  CardKind,
  CharacterId,
  RoguelikeBuff,
  Weather,
} from "@/game/types";
import { CHARACTERS, TOWER_FLOORS } from "@/game/types";
import {
  createNewGame,
  startBattle,
  playerSelectCard,
  confirmPlay,
  continueAfterRound,
  endBattle,
  selectRewardCard,
  purchaseItem,
  doWork,
  advanceDay,
  useRewind,
  fightNpc,
} from "@/game/manager";
import {
  weatherDescription,
  getCurrentFloorConfig,
} from "@/game/tower";

// ========== 界面类型 ==========

export type Screen =
  | "开始菜单"
  | "角色选择"
  | "Buff选择"
  | "组牌"
  | "塔内"
  | "战斗"
  | "选卡奖励"
  | "游戏结束";

// ========== 临时选择状态 ==========

interface SelectState {
  selectedCharacter: CharacterId | null;
  selectedBuff: RoguelikeBuff | null;
  deckCounts: Partial<Record<CardKind, number>>;
  组牌错误: string | null;
}

interface GameStore {
  // ---------- 界面 ----------
  screen: Screen;
  setScreen: (s: Screen) => void;

  // ---------- 选择 ----------
  select: SelectState;
  setCharacter: (c: CharacterId) => void;
  setBuff: (b: RoguelikeBuff) => void;
  resetSelect: () => void;

  // ---------- 组牌 ----------
  deckCounts: Partial<Record<CardKind, number>>;
  setDeckCount: (kind: CardKind, delta: number) => void;
  getDeckTotal: () => number;
  组牌错误: string | null;

  // ---------- 实际游戏状态 ----------
  game: GameState | null;

  // ---------- 战斗中的临时状态 ----------
  selectedCardId: string | null;
  selectCard: (id: string | null) => void;

  // ---------- 主菜单操作 ----------
  startNewGame: (character: CharacterId, buff: RoguelikeBuff, deckCounts: Partial<Record<CardKind, number>>) => void;
  确认出牌: () => void;
  回合结束继续: () => void;

  // ---------- 塔内行动 ----------
  执行打工: () => void;
  执行访问NPC: () => void;
  执行挑战Boss: () => void;
  执行购买: (itemId: string) => void;
  访问主角: () => void;
  下一日: () => void;

  // ---------- 奖励 ----------
  选择奖励卡: (kind: CardKind) => void;

  // ---------- 回溯 ----------
  执行回溯: () => void;

  // ---------- 辅助 ----------
  getCurrentWeather: () => Weather;
  getWeatherDesc: () => string;
  getStayLimit: () => number;
  getGold: () => number;
  canRewind: () => boolean;
}

const DEFAULT_SELECT: SelectState = {
  selectedCharacter: null,
  selectedBuff: null,
  deckCounts: {
    国王: 1,
    平民: 1,
    护卫: 2,
    侍女: 2,
    盗贼: 2,
    贵族: 2,
    大臣: 1,
  },
  组牌错误: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  // ---------- 界面 ----------
  screen: "开始菜单",
  setScreen: (s) => set({ screen: s }),

  // ---------- 选择 ----------
  select: DEFAULT_SELECT,
  setCharacter: (c) =>
    set((state) => ({
      select: { ...state.select, selectedCharacter: c },
      screen: "Buff选择",
    })),
  setBuff: (b) =>
    set((state) => ({
      select: { ...state.select, selectedBuff: b },
      screen: "组牌",
    })),
  resetSelect: () => set({ select: DEFAULT_SELECT }),

  // ---------- 组牌 ----------
  deckCounts: { ...DEFAULT_SELECT.deckCounts },
  组牌错误: null,

  setDeckCount: (kind, delta) => {
    set((state) => {
      const current = state.deckCounts[kind] ?? 0;
      const next = Math.max(0, current + delta);
      const newCounts = { ...state.deckCounts, [kind]: next };
      const total = Object.values(newCounts).reduce((a, b) => a + (b ?? 0), 0);
      if (total > 10) {
        return { deckCounts: state.deckCounts, 组牌错误: "手牌不能超过10张" };
      }
      return { deckCounts: newCounts, 组牌错误: null };
    });
  },

  getDeckTotal: () => {
    return Object.values(get().deckCounts).reduce((a, b) => a + (b ?? 0), 0);
  },

  // ---------- 游戏 ----------
  game: null,

  // ---------- 战斗选牌 ----------
  selectedCardId: null,
  selectCard: (id) => set({ selectedCardId: id }),

  // ---------- 开始游戏 ----------
  startNewGame: (character, buff, deckCounts) => {
    const hand: CardKind[] = [];
    for (const [kind, count] of Object.entries(deckCounts)) {
      for (let i = 0; i < (count ?? 0); i++) {
        hand.push(kind as CardKind);
      }
    }

    if (hand.length !== 10) {
      set({ 组牌错误: "手牌必须是10张" });
      return;
    }
    if (!hand.includes("国王") || !hand.includes("平民")) {
      set({ 组牌错误: "手牌必须包含国王和平民" });
      return;
    }

    const game = createNewGame(character, buff, hand);
    set({
      game,
      screen: "塔内",
      selectedCardId: null,
    });
  },

  // ---------- 出牌 ----------
  确认出牌: () => {
    const { game, selectedCardId } = get();
    if (!game?.battle || !selectedCardId) return;

    if (game.battle.phase === "等待玩家选牌") {
      const result = playerSelectCard(game.battle, selectedCardId);
      if ("error" in result) return;
      set((state) => ({
        game: state.game ? { ...state.game, battle: result as BattleState } : null,
      }));
      return;
    }
    const result = confirmPlay(game);
    if ("error" in result) return;
    set({ game: result as GameState, selectedCardId: null });
  },

  回合结束继续: () => {
    const { game } = get();
    if (!game?.battle) return;

    if (game.battle.phase === "展示结算") {
      const continued = continueAfterRound(game);
      set({ game: continued, selectedCardId: null });
    } else if (game.battle.phase === "游戏结束") {
      const ended = endBattle(game);
      if (ended.runOver) {
        // 战斗失败（NPC战斗输了），不游戏结束
        if (ended.runWon === false && ended.game) {
          set({
            game: ended.game as GameState,
            screen: "塔内",
            selectedCardId: null,
          });
          return;
        }
        // Boss战失败，游戏结束
        set({
          game: ended.game as GameState,
          screen: "游戏结束",
          selectedCardId: null,
        });
      } else {
        set({
          game: ended.game as GameState,
          screen: ended.cardRewardOptions.length > 0 ? "选卡奖励" : "塔内",
          selectedCardId: null,
        });
      }
    }
  },

  // ---------- 塔内行动 ----------
  执行打工: () => {
    const { game } = get();
    if (!game) return;
    if (game.tower.todayAction !== null) return;
    const updated = doWork(game);
    set({
      game: {
        ...updated,
        tower: { ...updated.tower, todayAction: "打工" },
      },
    });
  },

  执行访问NPC: () => {
    const { game } = get();
    if (!game) return;
    if (game.tower.todayAction !== null) return;

    const floor = getCurrentFloorConfig(game.tower.currentFloor);
    const result = fightNpc(game, floor.difficulty, floor.npcPenalty);

    if (result.type === "battle") {
      // 进入NPC战斗
      set({
        game: {
          ...result.state,
          tower: { ...result.state.tower, todayAction: "访问NPC" },
        },
        screen: "战斗",
        selectedCardId: null,
      });
    } else {
      // 触发特殊事件（给卡/给钱），不影响游戏结束
      set({
        game: {
          ...result.state,
          tower: { ...result.state.tower, todayAction: "访问NPC" },
        },
      });
    }
  },

  执行挑战Boss: () => {
    const { game } = get();
    if (!game) return;
    const result = startBattle(game);
    set({
      game: result,
      screen: "战斗",
      selectedCardId: null,
    });
  },

  执行购买: (itemId) => {
    const { game } = get();
    if (!game) return;
    const updated = purchaseItem(game, itemId);
    set({ game: updated });
  },

  访问主角: () => {
    const { game } = get();
    if (!game) return;
    if (game.tower.protagonistVisitedToday) return;
    const current = game.tower.characterDialogueFlags["主角"] ?? 0;
    set({
      game: {
        ...game,
        tower: {
          ...game.tower,
          protagonistVisitedToday: true,
          characterDialogueFlags: {
            ...game.tower.characterDialogueFlags,
            "主角": current + 1,
          },
        },
        eventLog: [
          ...game.eventLog,
          `[访问主角] 剧情进度 +1（当前进度：${current + 1}）`,
        ],
      },
    });
  },

  下一日: () => {
    const { game } = get();
    if (!game) return;
    const updated = advanceDay(game);
    if (updated.runWon) {
      set({ game: updated, screen: "游戏结束" });
    } else if (updated.forcedBossBattle) {
      // 超时强制 Boss 战
      const battleStarted = startBattle(updated);
      set({ game: battleStarted, screen: "战斗", selectedCardId: null });
    } else {
      set({ game: updated });
    }
  },

  // ---------- 奖励 ----------
  选择奖励卡: (kind) => {
    const { game } = get();
    if (!game) return;
    const updated = selectRewardCard(game, kind);
    if (updated.cardRewardOptions.length === 0) {
      const floor = TOWER_FLOORS[updated.tower.currentFloor - 1]!;
      if (updated.tower.defeatedBosses.includes(floor.bossName)) {
        const advanced = advanceFloor(updated);
        set({
          game: advanced,
          screen: advanced.runWon ? "游戏结束" : "塔内",
        });
      } else {
        set({ game: updated, screen: "塔内" });
      }
    } else {
      set({ game: updated });
    }
  },

  // ---------- 回溯 ----------
  执行回溯: () => {
    const { game } = get();
    if (!game) return;
    const result = useRewind(game);
    if ("error" in result) return;
    set({ game: result as GameState, selectedCardId: null });
  },

  // ---------- 辅助 ----------
  getCurrentWeather: () => {
    return get().game?.tower.weather ?? "晴";
  },
  getWeatherDesc: () => {
    return weatherDescription(get().getCurrentWeather());
  },
  getStayLimit: () => {
    const g = get().game;
    if (!g) return 3;
    return g.tower.character === "男2" ? 4 : 3;
  },
  getGold: () => get().game?.tower.gold ?? 0,
  canRewind: () => {
    const g = get().game;
    if (!g?.battle) return false;
    return g.tower.character === "男1" && !g.battle.rewindUsed["玩家"];
  },
}));
