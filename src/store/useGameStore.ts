import { chooseBestAiCard } from "@/ai/minimax";
import {
  buildRandomEnemyPiles,
  kindsToInstances,
  validateHandKinds,
} from "@/game/deck";
import { continueAfterRound, createInitialGameState, resolvePlay } from "@/game/engine";
import { resetIdCounter } from "@/game/ids";
import type { CardKind, GameState } from "@/game/types";
import { ENABLED_CARD_KINDS } from "@/game/types";
import { create } from "zustand";

export type Screen = "组牌" | "对弈";

interface GameStore {
  界面: Screen;
  组牌计数: Record<CardKind, number>;
  对局状态: GameState | null;
  选中的己方牌: string | null;
  错误提示: string | null;
  搜索深度: number;

  设置计数: (kind: CardKind, delta: number) => void;
  开始游戏: () => void;
  选中手牌: (id: string | null) => void;
  确认出牌: () => void;
  回合结束继续: () => void;
  返回组牌: () => void;
}

function 初始计数(): Record<CardKind, number> {
  const o = {} as Record<CardKind, number>;
  for (const k of ENABLED_CARD_KINDS) {
    o[k] = 0;
  }
  o["国王"] = 1;
  o["平民"] = 1;
  o["贵族"] = 8;
  return o;
}

function 计数到手牌种类(计数: Record<CardKind, number>): CardKind[] {
  const list: CardKind[] = [];
  for (const k of ENABLED_CARD_KINDS) {
    for (let i = 0; i < (计数[k] ?? 0); i += 1) {
      list.push(k);
    }
  }
  return list;
}

export const useGameStore = create<GameStore>((set, get) => ({
  界面: "组牌",
  组牌计数: 初始计数(),
  对局状态: null,
  选中的己方牌: null,
  错误提示: null,
  搜索深度: 3,

  设置计数: (kind, delta) => {
    set((s) => {
      const next = { ...s.组牌计数, [kind]: Math.max(0, (s.组牌计数[kind] ?? 0) + delta) };
      const sum = Object.values(next).reduce((a, b) => a + b, 0);
      if (sum > 10) {
        return { 错误提示: "总数不能超过 10 张" };
      }
      return { 组牌计数: next, 错误提示: null };
    });
  },

  开始游戏: () => {
    const kinds = 计数到手牌种类(get().组牌计数);
    const err = validateHandKinds(kinds);
    if (err) {
      set({ 错误提示: err });
      return;
    }
    resetIdCounter();
    const human = kindsToInstances(kinds);
    const enemy = buildRandomEnemyPiles();
    const gs = createInitialGameState(human, enemy.hand, enemy.visible, enemy.hidden);
    set({
      对局状态: gs,
      界面: "对弈",
      选中的己方牌: null,
      错误提示: null,
    });
  },

  选中手牌: (id) => set({ 选中的己方牌: id }),

  确认出牌: () => {
    const st = get().对局状态;
    const hid = get().选中的己方牌;
    const depth = get().搜索深度;
    if (!st || st.phase !== "等待人类选牌" || !hid) {
      set({ 错误提示: "请选择一张手牌" });
      return;
    }
    const aiId = chooseBestAiCard(st, hid, depth);
    try {
      const next = resolvePlay(st, hid, aiId);
      set({ 对局状态: next, 选中的己方牌: null, 错误提示: null });
    } catch (e) {
      set({ 错误提示: e instanceof Error ? e.message : "出牌失败" });
    }
  },

  回合结束继续: () => {
    const st = get().对局状态;
    if (!st || st.phase !== "展示结算") {
      return;
    }
    set({ 对局状态: continueAfterRound(st) });
  },

  返回组牌: () => {
    resetIdCounter();
    set({
      界面: "组牌",
      对局状态: null,
      选中的己方牌: null,
      组牌计数: 初始计数(),
      错误提示: null,
    });
  },
}));
