import { useGameStore } from "@/store/useGameStore";
import { PLAYABLE_CARD_KINDS, ALL_CARD_DEFS } from "@/game/cardDefs";
import type { CardKind } from "@/game/types";
import styles from "./ChaosSelectScreen.module.css";

export function ChaosSelectScreen() {
  const toggleChaosCard = useGameStore((s) => s.toggleChaosCard);
  const confirmChaosCards = useGameStore((s) => s.confirmChaosCards);
  const chaosSelectedKinds = useGameStore((s) => s.select.chaosSelectedKinds);
  const selected = chaosSelectedKinds;

  // 排除国王和平民（必定自带）
  const availableKinds = PLAYABLE_CARD_KINDS.filter(
    (k) => k !== "国王" && k !== "平民",
  );

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>混乱自选三张</h2>
      <p className={styles.hint}>
        选择3张卡牌（除国王和平民外），将在非Boss战斗中随机使用
      </p>
      <p className={styles.count}>已选: {selected.length} / 3</p>
      <div className={styles.grid}>
        {availableKinds.map((kind) => {
          const def = ALL_CARD_DEFS[kind as keyof typeof ALL_CARD_DEFS];
          const isSelected = selected.includes(kind as CardKind);
          return (
            <button
              key={kind}
              className={`${styles.card} ${isSelected ? styles.selected : ""}`}
              onClick={() => toggleChaosCard(kind as CardKind)}
            >
              <span className={styles.name}>{kind}</span>
              <span className={styles.rank}>
                {def ? `级${def.baseRank}` : ""}
              </span>
            </button>
          );
        })}
      </div>
      <button
        className={styles.confirmBtn}
        onClick={confirmChaosCards}
        disabled={selected.length !== 3}
      >
        确认选择（{selected.length}/3）
      </button>
    </div>
  );
}
