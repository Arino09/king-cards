import { formatRankValue } from "@/game/compare";
import { useGameStore } from "@/store/useGameStore";
import { ENABLED_CARD_KINDS } from "@/game/types";
import styles from "./SetupScreen.module.css";

export function SetupScreen() {
  const 组牌计数 = useGameStore((s) => s.组牌计数);
  const 设置计数 = useGameStore((s) => s.设置计数);
  const 开始游戏 = useGameStore((s) => s.开始游戏);
  const 错误提示 = useGameStore((s) => s.错误提示);

  const 总数 = Object.values(组牌计数).reduce((a, b) => a + b, 0);

  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>组牌（共 10 张，须含国王与平民）</h2>
      <p className={styles.hint}>当前已选：{总数} / 10</p>
      <ul className={styles.list}>
        {ENABLED_CARD_KINDS.map((kind) => (
          <li key={kind} className={styles.row}>
            <span className={styles.name}>
              {kind}
              <span className={styles.rank}>（等级 {formatRankValue(kind)}）</span>
            </span>
            <div className={styles.stepper}>
              <button
                type="button"
                className={styles.btn}
                onClick={() => 设置计数(kind, -1)}
                disabled={组牌计数[kind] <= 0}
              >
                −
              </button>
              <span className={styles.num}>{组牌计数[kind]}</span>
              <button type="button" className={styles.btn} onClick={() => 设置计数(kind, 1)}>
                +
              </button>
            </div>
          </li>
        ))}
      </ul>
      {错误提示 ? <p className={styles.err}>{错误提示}</p> : null}
      <button
        type="button"
        className={styles.primary}
        onClick={() => 开始游戏()}
        disabled={总数 !== 10}
      >
        开始游戏（敌方随机牌组）
      </button>
    </section>
  );
}
