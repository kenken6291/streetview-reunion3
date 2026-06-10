# 🗺️ あの場所の今 — ストリートビュー同窓会

昔住んでいた場所、母校、新婚旅行の地…  
住所やキーワードを入力するだけで、**現在のストリートビュー**をすぐに確認できるシンプルなWebアプリです。

---

## ファイル構成

```
streetview-reunion3/
├── index.html          # メインHTML
├── style.css           # スタイルシート
├── app.js              # アプリケーションロジック
├── config.example.js   # APIキー設定テンプレート（GitHub公開OK）
├── config.js           # ★実際のAPIキーを記入（.gitignoreで除外済み）
├── .gitignore          # Gitの除外設定
└── README.md           # このファイル
```

> **⚠️ `config.js` は `.gitignore` で除外されています。**  
> GitHubには `config.example.js` のみ公開されます。

---

## セットアップ手順

### 1. Google Maps API キーの取得

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを作成（または既存のものを選択）
3. 「APIとサービス」→「ライブラリ」から以下を **有効化**：
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API**
   - **Street View Static API**
4. 「認証情報」→「認証情報を作成」→「APIキー」でキーを発行

### 2. APIキーのセキュリティ制限（必須）

Google Cloud Console でAPIキーに **HTTPリファラー制限** を設定してください。

```
アプリケーションの制限 → HTTPリファラー（ウェブサイト）
許可するウェブサイト：
  https://あなたのユーザー名.github.io/*
  http://localhost/*  （ローカル開発用）
```

これにより、キーが他者に見られても悪用されません。

### 3. config.js の作成

```bash
# config.example.js をコピー
cp config.example.js config.js
```

`config.js` をテキストエディタで開き、`YOUR_API_KEY_HERE` を取得したAPIキーに書き換えます：

```js
const CONFIG = {
  GOOGLE_MAPS_API_KEY: 'AIzaSy...'  // ← ここに貼り付け
};
```

### 4. ローカルで動作確認

ブラウザで `index.html` を直接開くか、簡易サーバーで確認します：

```bash
# Python 3 の場合
python -m http.server 8000
# → ブラウザで http://localhost:8000 を開く

# Node.js の場合（npx が使える場合）
npx serve .
```

---

## GitHubへのデプロイ手順

### Step 1: Gitの初期化（初回のみ）

```bash
# プロジェクトフォルダに移動
cd streetview-reunion3

# Gitリポジトリを初期化
git init

# .gitignore が正しく機能しているか確認（config.js が表示されないこと）
git status
```

### Step 2: ファイルをステージング（追跡対象に追加）

```bash
# 全ファイルを追加（config.js は .gitignore で自動除外される）
git add .

# 追加されたファイルを確認（config.js が含まれていないことを必ず確認！）
git status
```

### Step 3: コミット（変更を記録）

```bash
git commit -m "🎉 初回コミット：あの場所の今アプリ"
```

### Step 4: GitHubにリポジトリを作成

1. [github.com](https://github.com) にログイン
2. 右上「+」→「New repository」をクリック
3. Repository name: `streetview-reunion3`
4. **Public** を選択
5. 「Create repository」をクリック

### Step 5: GitHubに接続してプッシュ

```bash
# メインブランチに名前をつける（必要な場合）
git branch -M main

# リモートリポジトリを登録
git remote add origin https://github.com/kenken6291/streetview-reunion3.git

# GitHubにプッシュ
git push -u origin main
```

### Step 6: GitHub Pages で公開

1. GitHubのリポジトリページを開く
2. 「Settings」→「Pages」を選択
3. Source: **Deploy from a branch**
4. Branch: **main** / **/ (root)** を選択して「Save」
5. しばらく待つと `https://kenken6291.github.io/streetview-reunion3/` で公開されます

---

## よく使うGitコマンド

```bash
# 変更をコミット（更新のたびに実行）
git add .
git commit -m "変更内容のメモ"
git push

# 現在の状態を確認
git status

# コミット履歴を確認
git log --oneline
```

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| 🔍 場所検索 | 住所・施設名・キーワードで検索（オートコンプリート対応） |
| 🔭 ストリートビュー表示 | 現在の様子をリアルタイムで表示 |
| 🗺️ ミニマップ | 検索した場所をマップで確認 |
| 💭 思い出メモ | 西暦とエピソードを記録 |
| 💛 お気に入り保存 | 訪れた場所をリストに保存（ブラウザローカルに保存） |
| 📱 レスポンシブ対応 | スマートフォンでも使用可能 |

---

## 技術スタック

- **HTML / CSS / JavaScript**（フロントエンド完結・ビルドツール不要）
- **Google Maps JavaScript API**
- **Google Places API**（住所オートコンプリート）
- **LocalStorage**（お気に入りの永続化）

---

## ライセンス

MIT License