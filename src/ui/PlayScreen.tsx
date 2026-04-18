import { useState } from "react";
import { formatCardWithRank, formatRankValue } from "@/game/compare";
import type { CardKind } from "@/game/types";
import { useGameStore } from "@/store/useGameStore";
import styles from "./PlayScreen.module.css";

type 面板 =
  | null
  | "己方弃牌"
  | "对方弃牌"
  | "己方可见"
  | "对方可见"
  | "对方不可见";

function 牌列表({ 牌 }: { 牌: { id: string; kind: CardKind }[] }) {
  if (牌.length === 0) {
    return <p className={styles.empty}>暂无</p>;
  }
  return (
    <ul className={styles.cardList}>
      {牌.map((c) => (
        <li key={c.id} className={styles.cardChip}>
          {formatCardWithRank(c.kind)}
        </li>
      ))}
    </ul>
  );
}

export function PlayScreen() {
  const 对局状态 = useGameStore((s) => s.对局状态);
  const 选中 = useGameStore((s) => s.选中的己方牌);
  const 选中手牌 = useGameStore((s) => s.选中手牌);
  const 确认出牌 = useGameStore((s) => s.确认出牌);
  const 回合结束继续 = useGameStore((s) => s.回合结束继续);
  const 返回组牌 = useGameStore((s) => s.返回组牌);
  const 错误提示 = useGameStore((s) => s.错误提示);

  const [面板, set面板] = useState<面板>(null);

  if (!对局状态) {
    return null;
  }

  const { human, ai, phase, lastRoundSummary, winner } = 对局状态;
  const 机器人手牌数 = ai.hand.length;

  return (
    <div className={styles.wrap}>
      <section className={styles.zone}>
        <h2 className={styles.zoneTitle}>对方</h2>
        <p className={styles.meta}>手牌张数：{机器人手牌数}（内容对玩家隐藏）</p>
        <div className={styles.pileRow}>
          <button type="button" className={styles.linkBtn} onClick={() => set面板("对方弃牌")}>
            查看对方弃牌堆
          </button>
          <button type="button" className={styles.linkBtn} onClick={() => set面板("对方可见")}>
            查看对方可见牌组
          </button>
          <button type="button" className={styles.linkBtn} onClick={() => set面板("对方不可见")}>
            对方不可见牌组
          </button>
        </div>
      </section>

      <section className={styles.zone}>
        <h2 className={styles.zoneTitle}>己方</h2>
        <div className={styles.pileRow}>
          <button type="button" className={styles.linkBtn} onClick={() => set面板("己方弃牌")}>
            查看己方弃牌堆
          </button>
          <button type="button" className={styles.linkBtn} onClick={() => set面板("己方可见")}>
            查看己方可见牌组
          </button>
        </div>
        <p className={styles.hint}>点击一张手牌选中，再点「确认出牌」。不可连续两次出同一张牌。</p>
        <div className={styles.hand}>
          {human.hand.map((c) => {
            const 合法 =
              对局状态.phase === "等待人类选牌" &&
              对局状态.lastPlayedId["人类"] !== c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={!合法}
                className={
                  选中 === c.id ? `${styles.cardBtn} ${styles.cardSelected}` : styles.cardBtn
                }
                onClick={() => {
                  if (!合法) {
                    return;
                  }
                  选中手牌(选中 === c.id ? null : c.id);
                }}
              >
                <span className={styles.cardName}>{c.kind}</span>
                <span className={styles.cardRank}>等级 {formatRankValue(c.kind)}</span>
              </button>
            );
          })}
        </div>
        {错误提示 ? <p className={styles.err}>{错误提示}</p> : null}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primary}
            disabled={phase !== "等待人类选牌" || !选中}
            onClick={() => 确认出牌()}
          >
            确认出牌
          </button>
        </div>
      </section>

      {phase === "展示结算" && lastRoundSummary ? (
        <div className={styles.overlay} role="dialog">
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>本回合结果</h3>
            <p className={styles.dialogBody}>{lastRoundSummary}</p>
            <button type="button" className={styles.primary} onClick={() => 回合结束继续()}>
              继续
            </button>
          </div>
        </div>
      ) : null}

      {phase === "已结束" ? (
        <div className={styles.overlay} role="dialog">
          <div className={styles.dialog}>
            <h3 className={styles.dialogTitle}>对局结束</h3>
            <p className={styles.dialogBody}>
              {lastRoundSummary ? <span>{lastRoundSummary} </span> : null}
              {winner === "人类" && "对局结束：你获胜（对方手牌已耗尽）。"}
              {winner === "机器人" && "对局结束：对方获胜（你的手牌已耗尽）。"}
              {winner === "平局" && "对局结束：平局（双方同时无手牌）。"}
            </p>
            <button type="button" className={styles.primary} onClick={() => 返回组牌()}>
              开始新游戏
            </button>
          </div>
        </div>
      ) : null}

      {面板 ? (
        <div className={styles.overlay} role="dialog" onClick={() => set面板(null)}>
          <div
            className={styles.dialog}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h3 className={styles.dialogTitle}>
              {面板 === "己方弃牌" && "己方弃牌堆"}
              {面板 === "对方弃牌" && "对方弃牌堆"}
              {面板 === "己方可见" && "己方可见牌组"}
              {面板 === "对方可见" && "对方可见牌组"}
              {面板 === "对方不可见" && "对方不可见牌组"}
            </h3>
            {面板 === "对方不可见" ? (
              <p className={styles.dialogBody}>共 {ai.hiddenDeck.length} 张（内容未知）</p>
            ) : (
              <牌列表
                牌={
                  面板 === "己方弃牌"
                    ? human.discard
                    : 面板 === "对方弃牌"
                      ? ai.discard
                      : 面板 === "己方可见"
                        ? human.visibleDeck
                        : ai.visibleDeck
                }
              />
            )}
            <button type="button" className={styles.secondary} onClick={() => set面板(null)}>
              关闭
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
