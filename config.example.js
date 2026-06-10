// ============================================================
//  config.example.js  — APIキー設定テンプレート
// ============================================================
//
//  【セットアップ手順】
//  1. このファイルをコピーして「config.js」という名前で保存
//  2. YOUR_API_KEY_HERE の部分を、自分の Google Maps API キーに書き換える
//  3. config.js は .gitignore に含まれているため、
//     GitHub に誤って公開されることはありません
//
//  【APIキーの取得方法】
//  https://console.cloud.google.com/
//  → プロジェクト作成 → 「Maps JavaScript API」を有効化 → 認証情報 → APIキー作成
//
//  【推奨：キーのドメイン制限】
//  Google Cloud Console でAPIキーの「アプリケーションの制限」を
//  「HTTPリファラー（ウェブサイト）」に設定し、
//  自分のドメイン（例: https://kenken6291.github.io/streetview-reunion3/*）だけを許可することを強く推奨します。
// ============================================================

const CONFIG = {
  GOOGLE_MAPS_API_KEY: 'YOUR_API_KEY_HERE'
};