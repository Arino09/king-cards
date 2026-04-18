import { nextCardId } from "./ids";
import type { CardInstance, CardKind } from "./types";
import { ENABLED_CARD_KINDS } from "./types";

export function createCard(kind: CardKind): CardInstance {
  return { id: nextCardId(), kind };
}

function randomKind(): CardKind {
  const i = Math.floor(Math.random() * ENABLED_CARD_KINDS.length);
  return ENABLED_CARD_KINDS[i]!;
}

/** 生成指定张数的随机牌组，保证至少一张国王与一张平民 */
export function randomHandWithConstraints(count: number): CardInstance[] {
  if (count < 2) {
    throw new Error("手牌至少 2 张才能同时包含国王与平民");
  }
  const kinds: CardKind[] = [];
  for (let i = 0; i < count; i += 1) {
    kinds.push(randomKind());
  }
  if (!kinds.includes("国王")) {
    kinds[0] = "国王";
  }
  if (!kinds.includes("平民")) {
    kinds[1] = "平民";
  }
  return kinds.map((k) => createCard(k));
}

export function validateHandKinds(kinds: CardKind[]): string | null {
  if (kinds.length !== 10) {
    return "手牌必须为 10 张";
  }
  if (!kinds.includes("国王")) {
    return "必须包含国王";
  }
  if (!kinds.includes("平民")) {
    return "必须包含平民";
  }
  const allowed = new Set<string>(ENABLED_CARD_KINDS);
  for (const k of kinds) {
    if (!allowed.has(k)) {
      return `包含未开放的牌种：${k}`;
    }
  }
  return null;
}

export function kindsToInstances(kinds: CardKind[]): CardInstance[] {
  return kinds.map((k) => createCard(k));
}

/** 随机生成敌方：10 张手牌 + 可见牌组（4～7）+ 不可见（1～2） */
export function buildRandomEnemyPiles(): {
  hand: CardInstance[];
  visible: CardInstance[];
  hidden: CardInstance[];
} {
  const visCount = 4 + Math.floor(Math.random() * 4);
  const hidCount = 1 + Math.floor(Math.random() * 2);
  return {
    hand: randomHandWithConstraints(10),
    visible: Array.from({ length: visCount }, () => createCard(randomKind())),
    hidden: Array.from({ length: hidCount }, () => createCard(randomKind())),
  };
}
