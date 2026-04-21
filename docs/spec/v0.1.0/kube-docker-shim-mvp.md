# kube-docker-shim MVP 仕様 (v0.1.0)

## 概要
Docker CLI を直接使えない環境で、DevContainer が想定する主要 Docker 操作を Kubernetes/OpenShift 上に変換して実行する。

## ユースケース / 利用シナリオ
- Docker 禁止環境で VS Code DevContainer を使いたい
- Kubernetes/OpenShift クラスタは利用可能
- 外部通信なしでローカル CLI から kubeconfig 経由で実行したい

## 機能要件
- `kube-docker run`:
  - `docker run` の主要入力を解釈し Pod を作成する
  - 対応オプション: `--name`, `-e/--env`, `-v/--volume`, `-p/--publish`, `-i`, `-t`, `-d`
  - `-v` は PVC 名マウントのみ対応（ホスト bind mount は MVP 非対応）
  - `-p` が指定された場合は `kubectl port-forward` を起動可能にする
- `kube-docker exec`:
  - `docker exec -it` 相当を `kubectl exec -it` に変換
- `kube-docker logs`:
  - `docker logs` 相当を `kubectl logs` に変換
- `kube-docker port-forward`:
  - `docker run -p` の代替として `kubectl port-forward` を実行

## 非機能要件
- セキュリティ:
  - kubeconfig 依存
  - namespace 制限（`KUBE_DOCKER_NAMESPACE` 必須）
- プロキシ耐性:
  - すべて `kubectl` 経由、外部 API 呼び出しなし
- 永続化:
  - PVC マウント対応

## API / インターフェース定義
- コマンド: `kube-docker <command> [args]`
- command:
  - `run IMAGE [CMD...]`
  - `exec [-it] POD [CMD...]`
  - `logs POD`
  - `port-forward POD HOST_PORT:CONTAINER_PORT`
- エラー:
  - namespace 未指定時は終了コード 2
  - 未対応オプション指定時は終了コード 2
  - kubectl 実行失敗時は非 0 終了

## 互換性・移行計画
- Docker 完全互換は対象外
- DevContainer 主要経路（run/exec/logs/port-forward）を優先
- 将来 `cp` と `inspect`、build モジュール（kaniko/buildkit）を追加

## 受け入れ条件 (Acceptance Criteria)
- `kube-docker run node:20` で Pod マニフェストが生成され `kubectl apply` が実行される
- `kube-docker exec -it <pod> sh` が `kubectl exec -it` へ変換される
- `kube-docker logs <pod>` が `kubectl logs` を実行する
- `kube-docker port-forward <pod> 3000:3000` が `kubectl port-forward` を実行する
- namespace 未設定時に起動拒否される

## テストケース要約
- run 引数解析テスト
- port/volume/env 変換テスト
- Pod マニフェスト生成テスト
- namespace ガードテスト

## ロールアウト/リリース計画
- v0.1.0: MVP をリリース（手動インストール）
- v0.2.x: cp/inspect と DevContainer 実運用検証
- v0.3.x: build モジュール分離（kaniko/buildkit）
