# kube-docker-shim

DevContainer が呼び出す Docker CLI の一部を、Kubernetes/OpenShift の kubectl 呼び出しへ変換する Node.js 製 CLI です。

## MVP 対応範囲
- run
- exec
- logs
- port-forward

## 前提
- Node.js 20+
- kubectl が実行可能
- kubeconfig が設定済み
- namespace は必須

## インストール

```bash
npm install
```

ローカル実行:

```bash
node src/cli.js --help
```

## Docker 実体がある環境での優先実行

このリポジトリには Docker 互換入口として scripts/docker.cmd を用意しています。
本物 Docker より先にこれを呼ばせるため、以下どちらかを使います。

1. フルパス起動

```powershell
& "D:\devs\workspace202111\kube-docker-shim\kube-docker-shim01\scripts\docker.cmd" version
```

2. セッション内で PATH を先頭に追加

```powershell
.\scripts\use-shim-path.ps1
docker version
```

## VS Code DevContainer が本物 Docker を呼ばないための対策

workspace の .vscode/settings.json で Dev Containers の dockerPath を固定しています。

- dev.containers.dockerPath
- remote.containers.dockerPath

どちらも scripts/docker.cmd を指すため、拡張機能経由でも本物 Docker を回避します。

## 使用例

namespace を環境変数で指定:

```bash
export KUBE_DOCKER_NAMESPACE=dev-ns
kube-docker run --name devpod -e NODE_ENV=development -v devpvc:/workspaces -p 3000:3000 node:20 sleep infinity
kube-docker exec -it devpod sh
kube-docker logs devpod
kube-docker port-forward devpod 3000:3000
```

namespace を引数で指定:

```bash
kube-docker --namespace dev-ns run node:20
```

docker 互換入口を使う場合:

```powershell
$env:KUBE_DOCKER_NAMESPACE = "dev-ns"
.\scripts\docker.cmd run node:20
```

## 制約 (MVP)
- Docker 完全互換ではありません
- run は主要オプションのみ対応
- -v/--volume は PVC 名マウントのみ対応
- ホスト bind mount は未対応
- inspect, cp, build は未対応

## テスト

```bash
npm test
```
