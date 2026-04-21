import { useGameStore } from "@/store/useGameStore";
import { PLAYABLE_CARD_KINDS } from "@/game/cardDefs";
import { ALL_CARD_DEFS } from "@/game/cardDefs";
import type { CardKind } from "@/game/types";
import styles from "./DeckSetupScreen.module.css";

export function DeckSetupScreen() {
  const deckCounts = useGameStore((s) => s.deckCounts);
  const setDeckCount = useGameStore((s) => s.setDeckCount);
  const 组牌错误 = useGameStore((s) => s.组牌错误);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const select = useGameStore((s) => s.select);

  const total = Object.values(deckCounts).reduce((a, b) => a + (b ?? 0), 0);

  function handleStart() {
    if (!select.selectedCharacter || !select.selectedBuff) return;
    startNewGame(select.selectedCharacter, select.selectedBuff, deckCounts);
  }

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>组牌（10张）</h2>
      <p className={styles.hint}>
        当前: {total} / 10 — 必须包含国王与平民
      </p>
      {组牌错误 && <p className={styles.error}>{组牌错误}</p>}
      <div className={styles.grid}>
        {PLAYABLE_CARD_KINDS.map((kind) => {
          const def = ALL_CARD_DEFS[kind as keyof typeof ALL_CARD_DEFS];
          const count = deckCounts[kind as CardKind] ?? 0;
          const isRequired = kind === "国王" || kind === "平民";
          return (
            <div key={kind} className={styles.row}>
              <span className={styles.kindName}>
                {kind}
                {isRequired && <span className={styles.star}>★</span>}
              </span>
              <span className={styles.rank}>
                {def ? `级${def.baseRank}` : ""}
              </span>
              <div className={styles.stepper}>
                <button
                  className={styles.stepBtn}
                  onClick={() => setDeckCount(kind as CardKind, -1)}
                  disabled={count <= 0}
                >
                  −
                </button>
                <span className={styles.count}>{count}</span>
                <button
                  className={styles.stepBtn}
                  onClick={() => setDeckCount(kind as CardKind, 1)}
                  disabled={total >= 10}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        className={styles.startBtn}
        onClick={handleStart}
        disabled={total !== 10 || 组牌错误 !== null}
      >
        开始塔之旅
      </button>
    </div>
  );
}
