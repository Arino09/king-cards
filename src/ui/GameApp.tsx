import { useGameStore } from "@/store/useGameStore";
import { StartScreen } from "./StartScreen";
import { CharacterSelectScreen } from "./CharacterSelectScreen";
import { BuffSelectScreen } from "./BuffSelectScreen";
import { DeckSetupScreen } from "./DeckSetupScreen";
import { TowerScreen } from "./TowerScreen";
import { BattleScreen } from "./BattleScreen";
import { ShopScreen } from "./ShopScreen";
import { GameOverScreen } from "./GameOverScreen";
import styles from "./GameApp.module.css";

export function GameApp() {
  const screen = useGameStore((s) => s.screen);

  return (
    <div className={styles.root}>
      <main className={styles.main}>
        {screen === "开始菜单" && <StartScreen />}
        {screen === "角色选择" && <CharacterSelectScreen />}
        {screen === "Buff选择" && <BuffSelectScreen />}
        {screen === "组牌" && <DeckSetupScreen />}
        {screen === "塔内" && <TowerScreen />}
        {screen === "战斗" && <BattleScreen />}
        {screen === "商店" && <ShopScreen />}
        {screen === "游戏结束" && <GameOverScreen />}
      </main>
    </div>
  );
}
