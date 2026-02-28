# moramora_janken

モラモラはとこちゃんとじゃんけんが遊べる静的ページです（GitHub Pages でそのまま公開可能）。

## 画面と挙動

- キャラクターはバストアップで大きく表示し、手と表情は差し替えレイヤーで表現します（`assets/base.png` は常時表示）。
- 手札はユーザークリック時に確定し、その後キャラクターの手がランダムで決定します（連続で同じ手は避けます）。
- シャッフル中は表情固定、結果時のみ表情が変わります（キャラクター勝利時は `assets/base.png` に固定）。
- 判定中に全画面ブラックアウト＋ VS 表示 → フェードアウトで結果表示。ページ全体が揺れ、中央に大きな「VS」が出ます。
- 勝敗に応じてリザルトバーとユーザーの手ボタンがカラーで強調されます（勝ち/負け/あいこ）。
- 「もう一度あそぶ」でシャッフルを再開し、手ボタンの結果色もリセットされます。
- マスコット（`assets/usa.png`）はキャラクターと同位置・サイズで別レイヤーに配置し、上下左右に非同期で揺れます。

## プロジェクト構成

```text
moramora_janken/
├── index.html              … エントリーポイント
├── css/
│   ├── style.css           … ベーススタイル・レイアウト・コンポーネント
│   ├── animations.css      … アニメーション定義（bob, shake, marble-flow 等）
│   └── responsive.css      … レスポンシブ対応・アクセシビリティ
├── js/
│   ├── config.js           … ゲーム設定（MORAMORA_CONFIG）
│   ├── game-logic.js       … 純粋ロジック層（getResult, pick, pickDifferent）
│   └── app.js              … アプリケーション層（DOM 操作・ゲーム進行）
├── assets/                 … 画像リソース
│   ├── base.png            … キャラクターベース画像（常時表示）
│   ├── expression_*.png    … 表情差分画像
│   ├── Scissors.png        … チョキの手画像
│   ├── Paper.png           … パーの手画像
│   └── usa.png             … マスコット画像
├── tests/
│   └── game-logic.test.js  … ユニットテスト
├── docs/
│   └── architecture/       … 構造ドキュメント
├── eslint.config.js        … ESLint 設定
├── package.json            … プロジェクトメタデータ・npm scripts
└── .prettierrc             … Prettier 設定
```

## 設定 (`js/config.js`)

- `shuffleIntervalMs`: 手のシャッフル速度（ms）
- `revealDelayMs`: 判定演出後に結果を出すまでの待ち時間（ms）
- `shakeDurationMs`: 揺れ演出の長さ（ms）
- `messages.win / lose / draw`: 勝敗ごとのセリフ配列
- `expressions`: 表情画像パスの配列（結果表示時に使用）

## 遊び方

1. `index.html` をブラウザで開く。
2. 手ボタン（グー/チョキ/パー）をクリック。
3. ブラックアウト →VS→ 結果表示。リザルトと手ボタンの色で勝敗を確認。
4. 「もう一度あそぶ」で再プレイ。

## 開発環境セットアップ

```bash
npm install    # 開発依存のインストール
npx serve .    # ローカルサーバー起動（http://localhost:3000）
```

> **注意**: `npx serve .` は `serve` パッケージを使います。初回は自動でダウンロードされます。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `npm test` | ユニットテスト実行 |
| `npm run lint` | ESLint によるコード検査 |
| `npm run lint:fix` | ESLint の自動修正 |
| `npm run format` | Prettier でフォーマット |
| `npm run format:check` | フォーマットチェック（CI 用） |

## テスト

```bash
npm test
```

- Node.js 組み込みテストランナー（`node:test`）を使用
- `tests/` ディレクトリにテストファイルを配置
- `js/game-logic.js` の純粋ロジック関数（`getResult`, `pick`, `pickDifferent`）をテスト
- DOM に依存しないため、ブラウザなしで実行可能

## クレジット

- 制作: @nanika_sheila
- キャラクター権利: モラモラはとこちゃん (@MolaToko)
