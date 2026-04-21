import { useGameStore } from "@/store/useGameStore";
import styles from "./GameOverScreen.module.css";

export function GameOverScreen() {
  const game = useGameStore((s) => s.game);
  const setScreen = useGameStore((s) => s.setScreen);
  const resetSelect = useGameStore((s) => s.resetSelect);

  if (!game) return null;

  const won = game.runWon;
  const { tower } = game;

  function handleRestart() {
    resetSelect();
    setScreen("开始菜单");
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>
        {won ? "🏆 恭喜通关！" : "💀 游戏结束"}
      </h1>
      <div className={styles.stats}>
        <p>到达层数: {tower.currentFloor}/7</p>
        <p>最终金币: {tower.gold}</p>
        <p>已击败Boss: {tower.defeatedBosses.length}</p>
        <p>解锁卡牌: {tower.unlockedCards.length}种</p>
      </div>
      <button className={styles.btn} onClick={handleRestart}>
        重新开始
      </button>
    </div>
  );
}
