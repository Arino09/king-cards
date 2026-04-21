import { useGameStore } from "@/store/useGameStore";
import { CHARACTERS, type CharacterId } from "@/game/types";
import styles from "./CharacterSelectScreen.module.css";

export function CharacterSelectScreen() {
  const setCharacter = useGameStore((s) => s.setCharacter);
  const setScreen = useGameStore((s) => s.setScreen);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>选择角色</h2>
      <div className={styles.grid}>
        {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => {
          const char = CHARACTERS[id];
          return (
            <button
              key={id}
              className={styles.card}
              onClick={() => setCharacter(id)}
            >
              <h3 className={styles.name}>{char.name}</h3>
              <p className={styles.passive}>{char.passive}</p>
            </button>
          );
        })}
      </div>
      <button className={styles.back} onClick={() => setScreen("开始菜单")}>
        返回
      </button>
    </div>
  );
}
