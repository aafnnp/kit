# Kit 桌面端自动更新（Tauri Updater）启用指南

前端（`src/components/features/settings-dialog.tsx`）与 Rust 侧（`src-tauri/src/main.rs`）的更新命令已就绪，但 `tauri.conf.json` 中 `pubkey` 目前是占位符。启用前需要生成签名密钥并配置发布端点。

## 1. 生成签名密钥对

Tauri 使用 Ed25519 对更新文件签名，私钥必须保密（仅用于 CI 签名），公钥写入应用配置。

```bash
# 生成密钥对（保存在 ~/.tauri/myapp.key，并打印公钥）
npx @tauri-apps/cli signer generate -w ~/.tauri/kit.key
```

将输出的**公钥**填入 `src-tauri/tauri.conf.json`：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "<上面生成的一长串 base64 公钥>",
      "endpoints": ["https://github.com/aafnnp/kit/releases/latest/download/latest.json"],
      "windows": { "installMode": "passive" }
    }
  }
}
```

> ⚠️ 私钥（`~/.tauri/kit.key`）**绝不能提交进仓库**，应作为 GitHub Actions 的 Secret（如 `TAURI_SIGNING_PRIVATE_KEY`）注入 CI。

## 2. 发布流程（GitHub Releases）

Tauri 的 `tauri build` 会自动生成 `latest.json` 清单与签名（`*.sig`）。只需保证发布时：

1. 构建产物包含 `latest.json`、安装包及 `.sig` 签名文件；
2. 将它们上传到 GitHub Release 的 **latest** 版本附件；
3. `endpoints` 指向 `releases/latest/download/latest.json`（与配置一致）。

## 3. 在 CI 中签名

`.github/workflows/release.yml` 中构建桌面端时需注入签名密钥：

```bash
TAURI_SIGNING_PRIVATE_KEY=${{ secrets.TAURI_SIGNING_PRIVATE_KEY }} \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD=${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }} \
npm run tauri build
```

若私钥设了密码，还需在仓库 Settings → Secrets 中配置 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。

## 4. 验证

- 本地：`cargo tauri build` 后检查 `src-tauri/target/release/bundle/` 下是否生成 `latest.json` 与 `*.sig`。
- 运行应用后点击「检查更新」，应能拉取远端版本并提示更新。
- 若公钥/端点无效，设置面板会提示更新失败（不会崩溃），可据此排查。

## 参考

- [Tauri Updater 官方文档](https://tauri.app/plugin/updater/)
- [Tauri Signer](https://tauri.app/distribution/sign/)
