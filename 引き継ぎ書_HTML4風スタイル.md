# 引き継ぎ書(別冊) — HTML4風レトロスタイル レシピ

このドキュメントは、k-books `setup.html` および k-games `index.html` で採用している「**素のHTMLでサクッと読める案内ページ**」を作るためのレシピ集です。CSSフレームワーク・JSなし、ファイル1枚で配布できる軽量さを優先しています。

> 他のミニ案件(別の手順書ページ、家族向けLAN内案内、印刷用ペラ)に流用する想定で抜き出しました。本書を読みながらコピペすれば、見栄えの揃った1枚モノが作れます。

---

## 1. 採用理由(なぜCSSフレームワークを使わないか)

- **軽量・依存ゼロ**: 1ファイル(またはHTML+style内蔵)で完結。CDN落ちで死なない、`file://` でも開ける、印刷も崩れない
- **可読性**: 情報量が多くても罫線+見出し階層だけで構造が伝わる。Win9x風(98.css)はかわいいが手順書には枠が多すぎた
- **流用しやすい**: クラス設計の暗記が不要。`<table border="1">` と `<hr>` だけで作れる
- **長寿**: 最新CSSの仕様変更で崩れない。10年後に開いてもほぼ同じに見える(これは本気で大事)

逆に**避けるべき用途**: 凝ったレスポンシブ、カラフルなマーケLP、複雑なフォーム — それらは普通にCSSフレームワークを使う。

---

## 2. 最小骨格(コピペ用テンプレ)

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>ページタイトル</title>
<link rel="icon" href="./favicon.ico">
<style>
  body {
    background: #ffffff;
    color: #222222;
    font-family: "MS UI Gothic", "ＭＳ ＵＩ Ｇｏｔｈｉｃ", "MSUIGothic",
                 "Hiragino Kaku Gothic ProN", sans-serif;
    max-width: 900px;
    margin: 0 auto;
    padding: 16px;
  }
  h1, h2, h3, h4, p, td, th, li, small, b, i, tt, code, kbd, samp {
    font-family: "MS UI Gothic", "ＭＳ ＵＩ Ｇｏｔｈｉｃ", "MSUIGothic",
                 "Hiragino Kaku Gothic ProN", sans-serif;
  }
  h1 { font-size: 32px; font-weight: normal; }
  h2 { font-size: 26px; font-weight: normal; }
  a:link    { color: #0033cc; }
  a:visited { color: #660099; }
</style>
</head>
<body>
<a name="top"></a>

<br>
<h1 align="center">★ ページタイトル ★</h1>
<p align="center">このページについて1〜2行のリード文。</p>

<p align="center">
[ <a href="#sec1">セクション1</a> ]
&nbsp;[ <a href="#sec2">セクション2</a> ]
</p>

<hr width="80%">

<a name="sec1"></a>
<h2 align="center">★ セクション1 ★<br>サブタイトル</h2>

<p>本文の説明段落は <code>align</code> を付けず左揃えのまま。<br>
こうすると <br> 改行が綺麗に左に揃います。</p>

<table border="1" cellpadding="8" align="center" width="90%">
  <tr><th width="30%">項目</th><th>値</th></tr>
  <tr><td align="center">A</td><td>説明</td></tr>
</table>

<br>
<hr width="80%">

<p align="center">
[ <a href="#top">▲ ページ先頭へ</a> ]
&nbsp;[ <a href="./index.html">トップへ戻る</a> ]
</p>

<p align="center"><small>&copy; サイト名 &middot; <a href="https://github.com/...">source</a></small></p>

</body>
</html>
```

これを土台に、テーブルと `<hr>` で増やすだけ。

---

## 3. 構成パーツの使い方

### 3.1 中央寄せ(初手で間違えやすいポイント)
- **NG**: `<center>...</center>` で全体を包む
  - 一見手早くキレイに見えるが、`<br>` を含む説明段落の各行が個別にセンタリングされて読みにくくなる(段落の左端が揃わずジグザグになる)
- **推奨**: `body { max-width: 900px; margin: 0 auto; padding: 16px; }` で**ブロックとして中央寄せ**し、テキストは左揃えのまま
- 中央配置したい個別要素(タイトル h1/h2、ナビ、フッター)には `align="center"` 属性を直接付ける
- テーブルは元から `<table align="center">` で個別に中央寄せしているので body 側の影響を受けない
- この変更は setup.html で実体験あり: 全体 `<center>` だと「PWA で使う場合の注意」のような複数行段落がジグザグして読み流せなかった

### 3.2 テーブル
```html
<table border="1" cellpadding="8" align="center" width="90%">
  <tr><th>...</th><th>...</th></tr>
  <tr><td>...</td><td>...</td></tr>
</table>
```
- `border="1"` の単線で十分。**二重線・3D枠は使わない**(レトロを狙いすぎると今度は読みにくい)
- `cellpadding="8"` は読みやすさの肝。詰めると窮屈
- `width="90%"` で画面幅に追従。固定px幅にするとスマホで崩れる
- セクション見出し行は `<tr><td colspan="2" align="center"><b>― 見出し ―</b></td></tr>` で挿入

### 3.3 見出し
- `<h1 align="center">★ タイトル ★</h1>` / `<h2 align="center">★ サブタイトル ★</h2>` の星囲み
- 星の代わりに `■` `◆` `≪≫` でも可。サイト全体で1種類に統一する
- font-size は h1=32px / h2=26px が目安(後述のフォント問題対策で `font-weight: normal` 必須)
- **長いサブタイトル付きの見出しは `<br>` で2行に分ける**:
  ```html
  <h2 align="center">★ STEP 1 ★<br>fine-grained PAT を発行</h2>
  ```
  ステップ番号と内容を視覚的に分離でき、スマホで折返したときの見た目も安定する

### 3.4 区切り
- セクション間は `<hr width="80%">` 一択
- 二重線にしたければ `<hr><hr>` を続けて2本(CSSは使わない)

### 3.5 ナビゲーション
- ヘッダー直下に `[ <a href="#sec1">...</a> ] &nbsp;[ ... ]` 形式の目次
- 各セクション直前に `<a name="sec1"></a>` アンカー
- フッターに `[ <a href="#top">▲ ページ先頭へ</a> ]` を必ず付ける(長いページで地味に効く)
- `id="..."` ではなく `name="..."` を使うのは古いブラウザ互換のため(現行はどちらでも動く)

---

## 4. ハマりどころ(全部踏んだ)

### 4.0 全体 `<center>` で `<br>` 段落がジグザグになる(初手で踏んだ)
- 全体を `<center>...</center>` で囲むと、`text-align: center` が継承されて段落内の各 `<br>` 区切りで個別に中央揃えになる
- 結果、左端が揃わずジグザグになり、複数行の説明が読み流せない
- **対策**: 3.1 で書いた通り、body の `max-width` + `margin: 0 auto` で**ブロック中央寄せ**にして、テキストは左揃えのまま。中央配置したい個別要素にだけ `align="center"` を付ける
- 補足: `body` に `p { text-align: left; }` の CSS ルールを足すと `<p align="center">` が効かなくなる(CSS のセレクタ特異度が `align` 属性のヒントより強い)。CSS では一律指定せず、属性側に任せる方が事故が少ない

### 4.1 `<tt>` / `<code>` がブラウザ既定で等幅フォント
- 何もしないと `<tt>k-books-write</tt>` だけ Liberation Mono 等になり浮く
- **対策**: 上の最小骨格にある通り、CSSで `tt, code` も含めた要素全部に明示的に `font-family` を当てる。`font-family: inherit` でもよいが、明示の方が事故が少ない

### 4.2 `<h1>` の太字が別フォント字体に化ける(Linux で顕著)
- `<h1>` はデフォルト `font-weight: bold`
- Linux で `MS UI Gothic` が無く `sans-serif` にフォールバックすると、Regular は Noto Sans CJK JP / Bold は別の太字フォントに行くことがあり、本文と見出しで字体が違って見える
- **対策**: `h1, h2 { font-weight: normal; }` を明示
- 「太字で見せたい」場合は `font-weight: 600` にして同一ファミリー内のセミボールドに留める手もあるが、normal が一番安全

### 4.3 `★` 記号のフォントフォールバック
- `★`(U+2605)が日本語フォントに含まれていない場合、Noto Sans Symbols 等の別フォントが当たって浮いて見える
- **対策**: 浮いて見えるなら `■` `◆` `▼` `≫` `≪` 等の和文フォントが必ず持つ記号に置換
- もしくは `font-family` の最後に `"Noto Sans Symbols 2"` を足す

### 4.4 リンク色
- 既定のリンク色(青紫)は意外と派手。落ち着かせるため明示
- 推奨: `a:link { color: #0033cc; } a:visited { color: #660099; }`(k-games・k-books準拠)
- コントラストを取るなら `#0000ee` / `#551a8b` (古典的Mosaic色) でも可

### 4.5 印刷対応
- body `max-width: 900px` + テーブル `width="90%"` の組合せで A4印刷もそのまま読める
- 余白は body の `padding` で確保。`margin: 0` にするとプリンタの不可印刷領域とぶつかる
- 黒背景・反転表示はトナー食いするので絶対NG。`background: #ffffff` 固定

### 4.6 キャッシュ対策
- meta タグの `Cache-Control: no-cache` だけだと古いブラウザは無視する
- 大きな改訂時はファイル名 or URLパラメータを変える(`setup.html?v=2`)
- ただし HTML 自体は本書スタイルだと外部依存ゼロなので、画像・QR以外はキャッシュ問題が起きにくい

### 4.7 Linux でローカル確認すると見た目が違う
- 開発機(Linux)に MS UI Gothic は通常無い
- `sudo apt install fonts-ipafont` で IPAGothic を入れるか、Wine等経由で MS UI Gothic を導入する手はあるが面倒
- 実機(Win/Mac/iOS/Android)でしか正しい見た目は確認できないと割り切る
- どうしても Linux で確認したい場合: フォントスタックに `"IPAGothic", "VL Gothic"` を足すと近づく

---

## 5. やってはいけないこと

| アンチパターン | 理由 |
|---|---|
| `<font color="...">` で本文中の単語を色分け | HTML5で非推奨、印刷でも見にくい。注意点は `<small>※ ...</small>` で十分 |
| `<table>` を入れ子にしてレイアウトを作る | 90年代の手筋だが現在のブラウザは入れ子で印刷崩れしやすい。1枚モノに留める |
| `<marquee>` `<blink>` | ブラウザ非対応。レトロ感を出したいなら `★` の数を増やす方向で |
| 画像で見出しを作る | 検索性ゼロ。テキストのまま |
| CSSで `border-style: double` | 太い・滲む。`border="1"` 単線が一番素直 |
| 全体を `<center>...</center>` で囲む | 段落の `<br>` 改行が個別に中央揃えされてジグザグになる。`body { max-width; margin: 0 auto }` でブロック中央寄せにして、要素単位で `align="center"` を付ける方式が正解 |
| `p { text-align: left; }` を CSS に書く | `<p align="center">` が効かなくなる(CSS の方が優先される)。属性側に任せて CSS は触らない |

---

## 6. チェックリスト(公開前)

- [ ] DOCTYPEを書いた(`<!DOCTYPE html>` で十分、HTML4 Transitional でも可)
- [ ] charset=UTF-8 を `<head>` 先頭付近に
- [ ] `<meta name="viewport">` でモバイル幅対応
- [ ] フォント・リンク色・h1/h2 サイズの CSS が入っている
- [ ] body に `max-width: 900px; margin: 0 auto; padding: 16px;` で**ブロック中央寄せ**(`<center>` 全体包みは禁止)
- [ ] 中央配置したい要素(h1/h2/ナビ/フッター)に `align="center"` 属性を個別付与
- [ ] 全テーブルが `border="1" cellpadding="8" align="center" width="90%"`
- [ ] 長い見出しは `★ STEP 1 ★<br>サブタイトル` のように2行に分けた
- [ ] ヘッダーに目次、フッターに「▲ ページ先頭へ」
- [ ] 主要セクションに `<a name="...">` アンカー
- [ ] 説明段落の `<br>` 改行が**左揃えで自然に流れる**ことを確認した(全体センタリング再発防止)
- [ ] スマホ実機で開いて崩れない
- [ ] A4印刷プレビューで切れない
- [ ] `★` が和文フォントで描画されている(浮いていない)

---

## 7. 参考リンク

- k-games(同スタイルの先行例): https://github.com/windom21-cpu/k-games
- k-books `setup.html`(本スタイルの実例): https://github.com/windom21-cpu/k-books/blob/main/setup.html
- HTML 4.01 仕様(レトロ要素の意味確認用): https://www.w3.org/TR/html401/

---

## 8. ライセンス・流用

このスタイルガイド自体は自由に流用してOK。`★` の使い方や色値含めてk-books/k-games準拠で書いていますが、別案件で使う際は適宜カスタマイズしてください。

