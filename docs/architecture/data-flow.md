# データフロー

## ゲーム進行フロー

```text
1. ページロード
   └─► startShuffle()
         └─► setInterval() で NPC の手をランダムに切り替え開始
               └─► currentHand が毎インターバルで更新される

2. ユーザーがボタンクリック
   └─► handleUserChoice(hand)
         ├─► isLocked チェック（多重クリック防止）
         └─► isLocked = true でロック

3. シャッフル停止
   └─► clearInterval() でタイマー停止
         └─► pickDifferent(currentHand) で NPC の最終手を決定

4. VS 演出
   └─► ブラックアウトオーバーレイ表示
         └─► ページ全体の揺れアニメーション（shake）
               └─► 中央に大きな「VS」を表示

5. setTimeout(revealDelayMs) 後
   └─► announceResult(userHand, npcHand)

6. 結果発表
   └─► getResult(userHand, npcHand) で判定
         ├─► DOM 更新: キャラクター表情の切り替え
         ├─► DOM 更新: リザルトバーへ勝敗表示
         └─► DOM 更新: ステータスピルの更新

7. 「もう一度あそぶ」ボタン押下
   └─► isLocked = false でロック解除
         └─► startShuffle() → 1 に戻る
```

## Source of Truth

| データ | 定義場所 | 更新タイミング |
| --- | --- | --- |
| ゲーム設定（タイミング・メッセージ・画像パス） | `window.MORAMORA_CONFIG`（config.js） | ページロード時に一度だけ定義（不変） |
| 現在の NPC の手 | `currentHand`（app.js 内クロージャ変数） | setInterval ごとに更新、選択確定時に停止 |
| ロック状態 | `isLocked`（app.js 内クロージャ変数） | ユーザー選択時に `true`、再プレイ時に `false` |

## 主要関数のデータ変換

| 関数 | 入力 | 出力 | 定義場所 |
| --- | --- | --- | --- |
| `getResult(userHand, npcHand)` | 2 つの手（文字列） | 勝敗文字列（`"win"` / `"lose"` / `"draw"`） | game-logic.js |
| `pick(hands)` | 手の配列 | ランダムに選んだ 1 つの手 | game-logic.js |
| `pickDifferent(current)` | 現在の手（文字列） | 現在と異なる手 | game-logic.js |
| `handleUserChoice(hand)` | ユーザーが選んだ手 | なし（副作用: DOM 更新・ゲーム進行） | app.js |
| `announceResult(userHand, npcHand)` | 確定した両者の手 | なし（副作用: DOM 更新） | app.js |

## 設定オブジェクト（MORAMORA_CONFIG）の構造

```javascript
window.MORAMORA_CONFIG = {
  shuffleIntervalMs: Number,  // 手のシャッフル速度（ms）
  revealDelayMs:     Number,  // 演出後に結果を表示するまでの待ち時間（ms）
  shakeDurationMs:   Number,  // 揺れ演出の長さ（ms）
  messages: {
    win:  string[],           // 勝利時のセリフ配列
    lose: string[],           // 敗北時のセリフ配列
    draw: string[],           // あいこ時のセリフ配列
  },
  expressions: string[],      // 表情画像パスの配列
};
```
