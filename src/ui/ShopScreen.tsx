import { useGameStore } from "@/store/useGameStore";
import { ALL_CARD_DEFS } from "@/game/cardDefs";
import styles from "./ShopScreen.module.css";

export function ShopScreen() {
  const game = useGameStore((s) => s.game);
  const setScreen = useGameStore((s) => s.setScreen);
  const 执行购买 = useGameStore((s) => s.执行购买);

  if (!game) return null;

  const { shop, tower } = game;

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>商店</h2>
      <div className={styles.gold}>💰 {tower.gold} 金币</div>
      <div className={styles.grid}>
        {shop.map((item) => {
          const def = ALL_CARD_DEFS[item.kind as keyof typeof ALL_CARD_DEFS];
          const canBuy = !item.sold && tower.gold >= item.price;
          return (
            <div key={item.id} className={`${styles.item} ${item.sold ? styles.soldOut : ""}`}>
              <div className={styles.itemName}>{item.kind}</div>
              <div className={styles.itemType}>{item.type}</div>
              <div className={styles.itemRank}>
                {def ? `等级 ${def.baseRank}` : ""}
              </div>
              <div className={styles.itemPrice}>
                {item.sold ? "已售出" : `${item.price}金币`}
              </div>
              {!item.sold && (
                <button
                  className={styles.buyBtn}
                  disabled={!canBuy}
                  onClick={() => 执行购买(item.id)}
                >
                  {canBuy ? "购买" : "资金不足"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <button className={styles.back} onClick={() => setScreen("塔内")}>
        返回
      </button>
    </div>
  );
}
