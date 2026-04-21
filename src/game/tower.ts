/**
 * 塔系统 — 天气、商店、难度映射等工具。
 */

import type { Weather, TowerFloor, ShopItem, CardKind, RoguelikeBuff, AiDifficulty } from "./types";
import { TOWER_FLOORS } from "./types";
import { ALL_CARD_DEFS, PLAYABLE_CARD_KINDS } from "./cardDefs";

// ========== AI 难度 ==========

export function difficultyToDepth(difficulty: AiDifficulty): number {
  if (difficulty <= 2) return 0;
  if (difficulty <= 3) return 1;
  if (difficulty <= 5) return 2;
  if (difficulty <= 7) return 3;
  if (difficulty <= 8) return 4;
  return 5;
}

export function difficultyDescription(d: AiDifficulty): string {
  if (d <= 2) return "弱";
  if (d <= 5) return "中等";
  if (d <= 8) return "强";
  return "极强";
}

// ========== 天气系统 ==========

const WEATHER_LIST: Weather[] = ["晴", "雨季", "烈日", "冰雹", "暖风"];

export function randomWeather(): Weather {
  return WEATHER_LIST[Math.floor(Math.random() * WEATHER_LIST.length)]!;
}

export function weatherDescription(w: Weather): string {
  switch (w) {
    case "晴": return "天气晴朗";
    case "雨季": return "雨季：金钱+50%";
    case "烈日": return "烈日：.5牌+0.5";
    case "冰雹": return "冰雹：.5牌-0.5";
    case "暖风": return "暖风：本场无上限回合";
  }
}

// ========== 商店系统 ==========

export function createDailyShop(unlockedCards: CardKind[]): ShopItem[] {
  const items: ShopItem[] = [];
  let id = 0;

  const basicCards = PLAYABLE_CARD_KINDS.filter(
    (k) =>
      ALL_CARD_DEFS[k]?.cardType === "基础" ||
      ALL_CARD_DEFS[k]?.cardType === "补充",
  );
  const funcCards = PLAYABLE_CARD_KINDS.filter(
    (k) =>
      ALL_CARD_DEFS[k]?.cardType === "功能" ||
      ALL_CARD_DEFS[k]?.cardType === "能力",
  );
  const consumableKinds = Object.entries(ALL_CARD_DEFS)
    .filter(([, def]) => def.consumable)
    .map(([name]) => name);

  if (funcCards.length > 0) {
    const kind = funcCards[Math.floor(Math.random() * funcCards.length)]!;
    items.push({ id: `shop-${id++}`, kind, price: 50, sold: false, type: "能力卡牌" });
  }

  for (let i = 0; i < 2; i++) {
    if (funcCards.length > 0) {
      const kind = funcCards[Math.floor(Math.random() * funcCards.length)]!;
      items.push({ id: `shop-${id++}`, kind, price: 30, sold: false, type: "功能卡牌" });
    }
  }

  for (let i = 0; i < 3 && basicCards.length > 0; i++) {
    const kind = basicCards[Math.floor(Math.random() * basicCards.length)]!;
    items.push({ id: `shop-${id++}`, kind, price: 10, sold: false, type: "基础卡牌" });
  }

  if (consumableKinds.length > 0) {
    const kind = consumableKinds[Math.floor(Math.random() * consumableKinds.length)]! as CardKind;
    items.push({ id: `shop-${id++}`, kind, price: 20, sold: false, type: "一次性卡牌" });
  }

  return items;
}

export function buyItem(
  shop: ShopItem[],
  itemId: string,
  gold: number,
): { shop: ShopItem[]; card?: CardKind; newGold: number; error?: string } {
  const item = shop.find((i) => i.id === itemId);
  if (!item) return { shop, newGold: gold, error: "物品不存在" };
  if (item.sold) return { shop, newGold: gold, error: "物品已售出" };
  if (gold < item.price) return { shop, newGold: gold, error: "资金不足" };
  const newShop = shop.map((i) => (i.id === itemId ? { ...i, sold: true } : i));
  return { shop: newShop, card: item.kind, newGold: gold - item.price };
}

// ========== 打工系统 ==========

export function getWorkGold(character: string, weather: Weather): number {
  let base = 15;
  if (weather === "雨季") base = Math.floor(base * 1.5);
  return base;
}

// ========== 奖励卡牌系统 ==========

export function generateCardRewards(defeatedKinds: CardKind[], count: number): CardKind[] {
  const available = defeatedKinds.filter((k) => k !== "国王" && k !== "平民");
  const result: CardKind[] = [];
  for (let i = 0; i < count && i < available.length; i++) {
    const idx = Math.floor(Math.random() * available.length);
    result.push(available[idx]!);
    available.splice(idx, 1);
  }
  return result;
}

// ========== 肉鸽Buff应用 ==========

export function applyBuffEffect(buff: RoguelikeBuff, gold: number): { gold: number; swapAvailable: number } {
  switch (buff) {
    case "更多初始资金": return { gold: gold + 30, swapAvailable: 0 };
    case "换卡功能": return { gold, swapAvailable: 1 };
    default: return { gold, swapAvailable: 0 };
  }
}

// ========== 楼层工具 ==========

export function getCurrentFloorConfig(floor: number): TowerFloor {
  return TOWER_FLOORS[floor - 1]!;
}

export function getStayLimit(characterId: string): number {
  if (characterId === "男2") return 4;
  return 3;
}
