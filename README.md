# Notion UI Capture Integration (PoC)

Webアプリケーション上の独自にスタイリングされたUI要素（DOM）を画像化し、そのままNotionのページへ自動保存する検証用プロジェクトです。

フロントエンドでDOMを画像化し、FastAPI（バックエンド）とngrokを経由することで、Notion APIのスタイル制限を回避し、完全な見た目のままNotionへ連携します。

## 構成技術

- **Frontend:** React (Vite), TypeScript, `html2canvas` (または `html-to-image`)
- **Backend:** Python (FastAPI), `uv`
- **External:** Notion API, ngrok

---

## 🚀 セットアップ手順

このプロジェクトは `frontend` と `backend` のモノレポ構成になっています。それぞれでセットアップが必要です。

### 0. 事前準備 (Prerequisites)

以下のツールがインストールされていることを確認してください。

- [Node.js](https://nodejs.org/) (フロントエンド用)
- [uv](https://github.com/astral-sh/uv) (Pythonパッケージ管理用)
- [ngrok](https://ngrok.com/) (ローカルサーバーの外部公開用)
- Notionのインテグレーショントークン（シークレットキー）

### 1. バックエンド (FastAPI) の準備

1. `backend` ディレクトリに移動します。
   ```bash
   cd backend
   ```
2. 環境変数ファイル .env を作成します。
   ```bash
   touch .env
   ```
3. 作成した .env ファイルに以下の情報を記載します。

   ```コードスニペット
   # Notionのインテグレーショントークン
   NOTION_API_KEY="ntn_あなたのトークンをここに記載"

   # ngrokの公開URL（※起動ごとに変わるため、後で書き換えます）
   BASE_PUBLIC_URL="[https://xxxx-xx-xx-xx.ngrok-free.app](https://xxxx-xx-xx-xx.ngrok-free.app)"
   ```

4. 依存パッケージのインストール
   ```bash
   uv sync
   ```

### 2. フロントエンド (React) の準備

1. frontendディレクトリへ移動します
   ```bach
   cd frontend
   ```
2. 依存パッケージのインストール
   ```bash
   npm install
   ```
3. src/App.tsx を開き、送信先の NotionページID を書き換えます。
   ```TypeScript
   // App.tsx内の送信処理部分
   body: JSON.stringify({
   page_id: "あなたのNotionページID（32桁の英数字）", // ← ここを変更
   image_url: imageUrl
   }),
   ```

---

# 起動と動作確認

システムを動かすには、以下の3つのプロセス（ターミナル）を同時に立ち上げる必要があります。

1. ngrokの起動
   FASTAPIのポート（8000番）を一時的に公開する

   ```bash
   ngrok http 8000

   起動後、画面に表示される Forwarding のURL（https://...）をコピーし、backend/.env の BASE_PUBLIC_URL に貼り付けて上書き保存してください。
   ```

2. バックエンドの起動
   ```bash
   cd backend
   uv run uvicorn main:app --reload
   ```
3. フロントエンドの起動

   ```bash
   cd frontend
   npm run dev

   起動後、ブラウザで http://localhost:5173 にアクセスし、「Notionへ送る」ボタンをクリックすると、UIがキャプチャされて指定したNotionページに画像として追加されます。
   ```

---

# 仕様とTips

- 画像のキャッシュ対策: Notion側で古い画像が表示され続けるのを防ぐため、バックエンドへ画像を送信する際、ファイル名にタイムスタンプ（Date.now()）を付与して毎回ユニークなURLを生成しています。

- 背景色の透過/白飛び: キャプチャ時の背景色は、フロントエンドのキャプチャライブラリのオプション（backgroundColor）で明示的に制御しています。
