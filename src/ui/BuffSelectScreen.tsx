import { useGameStore } from "@/store/useGameStore";
import { ROGUELIKE_BUFFS, ROGUELIKE_BUFF_DESCRIPTIONS } from "@/game/types";
import styles from "./BuffSelectScreen.module.css";

export function BuffSelectScreen() {
  const setBuff = useGameStore((s) => s.setBuff);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>选择初始祝福</h2>
      <p className={styles.hint}>三选一</p>
      <div className={styles.grid}>
        {ROGUELIKE_BUFFS.map((buff) => (
          <button
            key={buff}
            className={styles.card}
            onClick={() => setBuff(buff)}
          >
            <h3 className={styles.buffName}>{buff}</h3>
            <p className={styles.desc}>
              {ROGUELIKE_BUFF_DESCRIPTIONS[buff]}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
