import { useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { ROGUELIKE_BUFFS, ROGUELIKE_BUFF_DESCRIPTIONS } from "@/game/types";
import styles from "./BuffSelectScreen.module.css";

// 从全部buff中随机抽取3个不重复的（每次进入此界面重新随机）
function pickThreeRandom<T>(arr: T[]): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < 3 && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]!);
  }
  return result;
}

export function BuffSelectScreen() {
  const setBuff = useGameStore((s) => s.setBuff);
  const [threeOptions] = useState(() => pickThreeRandom(ROGUELIKE_BUFFS));

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>选择初始祝福</h2>
      <p className={styles.hint}>三选一</p>
      <div className={styles.grid}>
        {threeOptions.map((buff) => (
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
