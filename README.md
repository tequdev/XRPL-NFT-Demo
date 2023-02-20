# XRPL NFT Demo

このリポジトリはXRP Ledgerで[Xumm](https://xumm.app/)を利用してNFTを発行するためのデモページです。

事前に[Xumm Developer Console](https://apps.xumm.dev/)からAPI Keyを取得する必要があります。

取得したAPI Keyは.env.localファイルの`REACT_APP_XUMM_API_KEY`に設定してください

## ネットワーク
**メインネットでもトランザクションへの署名が可能のため、署名する際は十分に気をつけてください。**
Xummで利用するネットワークは設定→詳細設定→ノードから選択可能です。

## Faucet
次のページからテストネット用アカウントを取得可能です。

https://xrpl.org/ja/xrp-testnet-faucet.html

https://faucet.tequ.dev/

## アプリの起動
### パッケージのインストール

`yarn add`

### アプリの起動

`yarn start`

