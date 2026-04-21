import { useGameStore } from "@/store/useGameStore";
import styles from "./StartScreen.module.css";

export function StartScreen() {
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>七层之塔</h1>
      <p className={styles.subtitle}>Tower of Cards</p>
      <div className={styles.menu}>
        <button
          className={styles.btn}
          onClick={() => setScreen("角色选择")}
        >
          开始游戏
        </button>
        <button className={styles.btnSecondary}>继续游戏</button>
        <button className={styles.btnSecondary}>成就</button>
        <button className={styles.btnSecondary}>卡牌图鉴</button>
      </div>
    </div>
  );
}
