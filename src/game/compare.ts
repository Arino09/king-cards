import type { CardKind } from "./types";

/** 规则文档：数字小的等级胜过数字大的；同等级双败；仅平民可胜国王 */
export const RANK: Record<CardKind, number> = {
  国王: 1,
  贵族: 1.1,
  护卫: 1.5,
  大臣: 2,
  侍女: 2.5,
  平民: 3,
  盗贼: 3.5,
};

/** 等级数值的展示用字符串（与规则文档一致） */
export function formatRankValue(kind: CardKind): string {
  return String(RANK[kind]);
}

/** 牌名 + 等级，用于界面与回合说明 */
export function formatCardWithRank(kind: CardKind): string {
  return `${kind}（等级 ${formatRankValue(kind)}）`;
}

export type CompareOutcome = "先手胜" | "后手胜" | "双败";

/**
 * @param first 人类出的牌
 * @param second 机器人出的牌
 */
export function compareKinds(first: CardKind, second: CardKind): CompareOutcome {
  if (first === second) {
    return "双败";
  }
  // 平民 > 国王（其余等级 3 不能胜国王，首版仅平民为 3）
  if (first === "平民" && second === "国王") {
    return "先手胜";
  }
  if (second === "平民" && first === "国王") {
    return "后手胜";
  }
  const a = RANK[first];
  const b = RANK[second];
  if (a === b) {
    return "双败";
  }
  return a < b ? "先手胜" : "后手胜";
}
