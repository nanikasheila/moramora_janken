# モジュールマップ

## ディレクトリ構成

```text
moramora_janken/
├── index.html              … エントリーポイント。HTML構造 + スクリプト/スタイルのロード
├── css/
│   ├── style.css           … ベーススタイル・レイアウト・コンポーネント
│   ├── animations.css      … @keyframes 定義（bob, shake, marble-flow 等）
│   └── responsive.css      … メディアクエリ（モバイル/縦画面/アクセシビリティ）
├── js/
│   ├── config.js           … 設定層（window.MORAMORA_CONFIG: タイミング・メッセージ・画像パス）
│   ├── game-logic.js       … 純粋ロジック層（getResult, pick, pickDifferent）UMD パターン
│   └── app.js              … アプリケーション層（DOM 操作・イベント処理・ゲーム進行）
├── assets/                 … 静的リソース（キャラクター画像・手の画像）
├── docs/
│   └── architecture/       … 構造ドキュメント（本ディレクトリ）
├── tests/
│   └── game-logic.test.js  … ユニットテスト（Node.js test runner）
├── eslint.config.js        … ESLint 設定
├── package.json            … プロジェクトメタデータ・npm scripts
└── .prettierrc             … Prettier 設定
```

## レイヤー構造

```text
┌────────────────────────────────────────┐
│  アプリケーション層  app.js             │
│  DOM 操作 / イベント処理 / ゲーム進行   │
└────────────┬───────────────────────────┘
             │ 依存
┌────────────▼───────────────────────────┐
│  純粋ロジック層  game-logic.js          │
│  getResult / pick / pickDifferent      │
│  DOM 非依存・テスト可能                 │
└────────────┬───────────────────────────┘
             │ 依存
┌────────────▼───────────────────────────┐
│  設定層  config.js                      │
│  window.MORAMORA_CONFIG                 │
│  タイミング / メッセージ / 画像パス      │
└────────────────────────────────────────┘
```

## 各モジュールの責務

| ファイル | 層 | 責務 |
| --- | --- | --- |
| `css/style.css` | プレゼンテーション | ベーススタイル・レイアウト・コンポーネント定義 |
| `css/animations.css` | プレゼンテーション | アニメーション定義（bob, shake, marble-flow 等） |
| `css/responsive.css` | プレゼンテーション | レスポンシブ対応・アクセシビリティ |
| `js/config.js` | 設定 | ゲーム設定のグローバルオブジェクト定義 |
| `js/game-logic.js` | ロジック | 純粋関数によるじゃんけん判定ロジック |
| `js/app.js` | アプリケーション | DOM 操作・ユーザー入力処理・ゲームフロー制御 |

## スクリプトのロード順序

`index.html` でのロード順:

```html
<script src="js/config.js"></script>      <!-- 1. 設定を先に定義 -->
<script src="js/game-logic.js"></script>  <!-- 2. ロジックを初期化 -->
<script src="js/app.js"></script>         <!-- 3. アプリを起動 -->
```

依存方向: `config.js` → `game-logic.js` → `app.js`

`app.js` は `GameLogic`（game-logic.js が公開）と `MORAMORA_CONFIG`（config.js が公開）の両方に依存する。

## 依存関係図

```text
config.js ──────────────────────────────► app.js
                                               ▲
game-logic.js ─────────────────────────────────┤
                                           依存
```
