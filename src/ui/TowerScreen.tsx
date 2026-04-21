import { useGameStore } from "@/store/useGameStore";
import { TOWER_FLOORS, CHARACTERS } from "@/game/types";
import { weatherDescription } from "@/game/tower";
import styles from "./TowerScreen.module.css";

export function TowerScreen() {
  const game = useGameStore((s) => s.game);
  const 执行打工 = useGameStore((s) => s.执行打工);
  const 执行访问NPC = useGameStore((s) => s.执行访问NPC);
  const 执行挑战Boss = useGameStore((s) => s.执行挑战Boss);
  const 访问主角 = useGameStore((s) => s.访问主角);
  const setScreen = useGameStore((s) => s.setScreen);
  const 下一日 = useGameStore((s) => s.下一日);

  if (!game) return null;

  const { tower, eventLog } = game;
  const floor = TOWER_FLOORS[tower.currentFloor - 1];
  const stayLimit = tower.character === "男2" ? 4 : 3;
  const char = CHARACTERS[tower.character];
  const alreadyActed = tower.todayAction !== null;
  const protagonistVisited = tower.protagonistVisitedToday;

  return (
    <div className={styles.wrap}>
      {/* 顶部状态栏 */}
      <div className={styles.statusBar}>
        <div className={styles.statusItem}>
          <span className={styles.label}>层</span>
          <span className={styles.value}>{floor?.name}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.label}>金币</span>
          <span className={styles.value}>{tower.gold}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.label}>天气</span>
          <span className={styles.value}>{tower.weather}</span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.label}>第</span>
          <span className={styles.value}>
            {tower.floorDays}/{stayLimit}天
          </span>
        </div>
        <div className={styles.statusItem}>
          <span className={styles.label}>角色</span>
          <span className={styles.value}>{char.name}</span>
        </div>
      </div>

      {/* NPC 信息 */}
      <div className={styles.npcBanner}>
        <span className={styles.npcName}>{floor?.npcName}</span>
        <span className={styles.npcHint}>{floor?.npcHint}</span>
      </div>

      {/* 每日行动（打工/访问NPC 二选一） */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>每日行动</h3>
        {alreadyActed ? (
          <p className={styles.actedHint}>
            今日已行动：<strong>{tower.todayAction}</strong>，点击「下一天」继续
          </p>
        ) : (
          <p className={styles.hint}>打工或访问NPC，二选一</p>
        )}
        <div className={styles.actionGrid}>
          <button
            className={styles.actionBtn}
            onClick={执行打工}
            disabled={alreadyActed}
          >
            <span className={styles.actionEmoji}>💼</span>
            <span>打工</span>
            <span className={styles.fee}>+{tower.weather === "雨季" ? 22 : 15}金币</span>
          </button>

          <button
            className={styles.actionBtn}
            onClick={执行访问NPC}
            disabled={alreadyActed}
          >
            <span className={styles.actionEmoji}>💬</span>
            <span>访问NPC</span>
            <span className={styles.fee}>输了扣{floor?.npcPenalty ?? 0}金</span>
          </button>
        </div>
      </div>

      {/* 自由行动（不消耗每日行动） */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>自由行动</h3>
        <div className={styles.actionGrid}>
          <button className={styles.actionBtn} onClick={执行挑战Boss}>
            <span className={styles.actionEmoji}>⚔️</span>
            <span>挑战{floor?.bossName}</span>
          </button>

          <button className={styles.actionBtn} onClick={() => setScreen("商店")}>
            <span className={styles.actionEmoji}>🛒</span>
            <span>商店</span>
          </button>

          <button className={styles.actionBtn} onClick={访问主角} disabled={protagonistVisited}>
            <span className={styles.actionEmoji}>📖</span>
            <span>访问主角</span>
            {protagonistVisited && <span className={styles.fee}>今日已完成</span>}
          </button>

          <button className={styles.actionBtn} onClick={下一日}>
            <span className={styles.actionEmoji}>➡️</span>
            <span>下一天</span>
          </button>
        </div>
      </div>

      {/* 已击败Boss */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>已击败</h3>
        <div className={styles.bossList}>
          {tower.defeatedBosses.length === 0 ? (
            <span className={styles.muted}>尚无</span>
          ) : (
            tower.defeatedBosses.map((b) => (
              <span key={b} className={styles.bossChip}>{b}</span>
            ))
          )}
        </div>
      </div>

      {/* 天气效果 */}
      {tower.weather !== "晴" && (
        <div className={styles.weatherBanner}>
          {weatherDescription(tower.weather)}
        </div>
      )}

      {/* 事件日志 */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>事件</h3>
        <div className={styles.log}>
          {eventLog.slice(-6).map((msg, i) => (
            <p key={i} className={styles.logItem}>{msg}</p>
          ))}
        </div>
      </div>

      {/* 选卡奖励 */}
      {game.cardRewardOptions.length > 0 && (
        <div className={styles.rewardBanner}>
          <p>选择一张奖励卡牌：</p>
          <div className={styles.rewardGrid}>
            {game.cardRewardOptions.map((kind) => (
              <button
                key={kind}
                className={styles.rewardBtn}
                onClick={() => useGameStore.getState().选择奖励卡(kind)}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
