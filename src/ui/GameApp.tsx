import { useGameStore } from "@/store/useGameStore";
import { PlayScreen } from "./PlayScreen";
import { SetupScreen } from "./SetupScreen";
import styles from "./GameApp.module.css";

export function GameApp() {
  const 界面 = useGameStore((s) => s.界面);

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>卡牌对弈（单机）</h1>
        <p className={styles.sub}>基于《卡牌游戏规则》· 首版仅基础牌</p>
      </header>
      <main className={styles.main}>{界面 === "组牌" ? <SetupScreen /> : <PlayScreen />}</main>
    </div>
  );
}
