import { useGameStore } from "@/store/useGameStore";
import { ALL_CARD_DEFS } from "@/game/cardDefs";
import { getCardRank, formatRank } from "@/game/rank";
import { canPlay } from "@/game/battleEngine";
import styles from "./BattleScreen.module.css";

function CardChip({
  id,
  kind,
  isSelected,
  disabled,
  onClick,
  side,
}: {
  id: string;
  kind: string;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
  side: "player" | "opponent";
}) {
  const def = ALL_CARD_DEFS[kind as keyof typeof ALL_CARD_DEFS];
  const isConsumable = def?.cardType === "一次性";

  return (
    <button
      className={`${styles.card} ${isSelected ? styles.selected : ""} ${disabled ? styles.disabled : ""} ${styles[`card${side}`]}`}
      disabled={disabled}
      onClick={onClick}
      title={kind}
    >
      <span className={styles.cardName}>{kind}</span>
      {def && !isConsumable && (
        <span className={styles.cardRank}>级{def.baseRank}</span>
      )}
    </button>
  );
}

export function BattleScreen() {
  const game = useGameStore((s) => s.game);
  const selectedCardId = useGameStore((s) => s.selectedCardId);
  const selectCard = useGameStore((s) => s.selectCard);
  const 确认出牌 = useGameStore((s) => s.确认出牌);
  const 回合结束继续 = useGameStore((s) => s.回合结束继续);
  const 执行回溯 = useGameStore((s) => s.执行回溯);
  const setScreen = useGameStore((s) => s.setScreen);
  const canRewind = useGameStore((s) => s.canRewind);

  if (!game?.battle) return null;

  const battle = game.battle;
  const { playerHand, aiHand, aiVisibleDeck, aiHiddenDeck, playerDiscard, aiDiscard, phase } = battle;
  const floor = game.tower.currentFloor;

  const currentPhase = battle.phase;

  // 确定可以出的牌
  const playableIds = playerHand
    .filter((c) => canPlay(battle, "玩家", c.id))
    .map((c) => c.id);

  return (
    <div className={styles.wrap}>
      {/* 顶部信息 */}
      <div className={styles.topBar}>
        <div className={styles.info}>
          <span>第{battle.turn}回合</span>
          {!battle.noTurnLimit && <span>/{battle.maxTurns}上限</span>}
          {battle.noTurnLimit && <span className={styles.unlimited}>无上限</span>}
        </div>
        <div className={styles.hands}>
          <span className={styles.myCards}>我方手牌: {playerHand.length}</span>
          <span className={styles.aiCards}>敌方手牌: {aiHand.length}</span>
        </div>
        {battle.weatherModifier !== 0 && (
          <div className={styles.weather}>
            {battle.weatherModifier > 0 ? "烈日" : "冰雹"}
            {battle.weatherModifier > 0 ? "+0.5" : "-0.5"}
          </div>
        )}
      </div>

      {/* 敌方区域 */}
      <div className={styles.opponentZone}>
        <div className={styles.opponentHand}>
          {aiHand.map((c) => (
            <div key={c.id} className={styles.faceDown}>
              <span>🎴</span>
            </div>
          ))}
        </div>

        {/* 展示区：已出的牌 */}
        {(battle.pendingPlayerCard || battle.pendingAiCard) && (
          <div className={styles.table}>
            <div className={styles.tableCards}>
              {battle.pendingPlayerCard && (
                <div className={styles.tableCard}>
                  <span>{battle.pendingPlayerCard.kind}</span>
                  <span className={styles.tableRank}>
                    {formatRank(getCardRank(battle.pendingPlayerCard, "玩家", battle))}
                  </span>
                </div>
              )}
              {battle.pendingAiCard && (
                <div className={styles.tableCard}>
                  <span>{battle.pendingAiCard.kind}</span>
                  <span className={styles.tableRank}>
                    {formatRank(getCardRank(battle.pendingAiCard, "机器人", battle))}
                  </span>
                </div>
              )}
            </div>
            {battle.lastRoundSummary && (
              <p className={styles.summary}>{battle.lastRoundSummary}</p>
            )}
          </div>
        )}

        {/* 敌方情报 */}
        <div className={styles.opponentInfo}>
          <span>敌方可见牌: {aiVisibleDeck.length}张</span>
          <span>敌方未知牌: {aiHiddenDeck.length}张</span>
          <span>敌方弃牌: {aiDiscard.length}张</span>
        </div>
        <div className={styles.opponentPiles}>
          <div className={styles.pileSection}>
            <span className={styles.pileLabel}>对方可见</span>
            <div className={styles.pileCards}>
              {aiVisibleDeck.map((c) => (
                <div key={c.id} className={styles.pileChip}>
                  {c.kind}({ALL_CARD_DEFS[c.kind]?.baseRank ?? "?"})
                </div>
              ))}
            </div>
          </div>
          <div className={styles.pileSection}>
            <span className={styles.pileLabel}>对方弃牌</span>
            <div className={styles.pileCards}>
              {aiDiscard.map((c) => (
                <div key={c.id} className={styles.pileChip}>
                  {c.kind}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 玩家手牌 */}
      <div className={styles.playerZone}>
        <div className={styles.hand}>
          {playerHand.map((c) => {
            const can = canPlay(battle, "玩家", c.id);
            return (
              <div
                key={c.id}
                className={`${styles.cardSlot} ${selectedCardId === c.id ? styles.selectedSlot : ""}`}
                onClick={() => can && selectCard(selectedCardId === c.id ? null : c.id)}
              >
                <span className={styles.slotName}>{c.kind}</span>
                <span className={styles.slotRank}>
                  {formatRank(getCardRank(c, "玩家", battle))}
                </span>
                {!can && <span className={styles.slotBanned}>不可出</span>}
              </div>
            );
          })}
        </div>

        {/* 弃牌堆 */}
        <div className={styles.discardInfo}>
          弃牌: {playerDiscard.length}张
        </div>

        {/* 操作按钮 */}
        <div className={styles.actions}>
          {currentPhase === "等待玩家选牌" && (
            <button
              className={styles.primaryBtn}
              disabled={!selectedCardId || playableIds.length === 0}
              onClick={确认出牌}
            >
              出牌
            </button>
          )}
          {currentPhase === "等待玩家确认" && (
            <button
              className={styles.primaryBtn}
              onClick={确认出牌}
            >
              确认出牌
            </button>
          )}
          {currentPhase === "展示结算" && (
            <button className={styles.primaryBtn} onClick={回合结束继续}>
              继续
            </button>
          )}
          {currentPhase === "游戏结束" && (
            <button className={styles.primaryBtn} onClick={回合结束继续}>
              结束
            </button>
          )}
          {canRewind() && (
            <button className={styles.rewindBtn} onClick={执行回溯}>
              时间回溯
            </button>
          )}
        </div>
      </div>

      {/* 游戏结束弹窗 */}
      {currentPhase === "游戏结束" && battle.winner && (
        <div className={styles.overlay}>
          <div className={styles.endDialog}>
            <h2>
              {battle.winner === "玩家"
                ? "🎉 胜利！"
                : battle.winner === "机器人"
                  ? "💀 失败"
                  : "⚖️ 平局"}
            </h2>
            <p>回合数: {battle.turn - 1}</p>
            {battle.result && battle.winner === "玩家" && (
              <p>获得金币: {battle.result.baseGold}</p>
            )}
            <button className={styles.primaryBtn} onClick={回合结束继续}>
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
