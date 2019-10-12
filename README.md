# k2party bs3-select-propagation

## インストール方法

### パッケージマネージャ（npm）でインストールする場合

npmコマンドでnpmjsからダウンロードします。

package.jsonのあるディレクトリで、下記のコマンドを実行します。

```sh
npm i @k2party/bs3-select-propagation
```

### パッケージマネージャを使わない場合

下記のファイルをWEBアプリケーションの公開ディレクトリ内に配置してください。

- [selectpicker-propagation.js](dist/selectpicker-propagation.js)

前提パッケージにjquery(v1)とbootstrap(v3)およびbootstrap-selectが必要です。
本パッケージのリソースを読み込む前にブラウザにローディングされるようにしてください。
（後述の[sample_01.html](demo/sample_01.html)などを参照してください）

