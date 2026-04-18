import { describe, expect, it } from "vitest";
import { createCard, kindsToInstances } from "./deck";
import type { CardKind } from "./types";
import { createInitialGameState, resolvePlay } from "./engine";

const 十张示例 = (): CardKind[] => [
  "国王",
  "平民",
  "贵族",
  "贵族",
  "贵族",
  "贵族",
  "贵族",
  "贵族",
  "贵族",
  "贵族",
];

describe("resolvePlay", () => {
  it("你胜时对方牌进弃牌", () => {
    const human = kindsToInstances(十张示例());
    const ai = kindsToInstances(["大臣", "大臣", "大臣", "大臣", "大臣", "大臣", "大臣", "大臣", "大臣", "大臣"]);
    let s = createInitialGameState(human, ai, [], []);
    const hId = s.human.hand.find((c) => c.kind === "国王")!.id;
    const aId = s.ai.hand.find((c) => c.kind === "大臣")!.id;
    s = resolvePlay(s, hId, aId);
    expect(s.human.discard.length).toBe(0);
    expect(s.ai.discard.length).toBe(1);
    expect(s.human.hand.some((c) => c.kind === "国王")).toBe(true);
  });
});

describe("createCard", () => {
  it("唯一 id", () => {
    const a = createCard("国王");
    const b = createCard("国王");
    expect(a.id).not.toBe(b.id);
  });
});
