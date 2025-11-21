# Electron 开发指南

## 开发环境设置

### 启动开发环境

```bash
npm run electron:dev
```

这个命令会：

1. 编译 Electron 代码（main.ts 和 preload.ts）
2. 启动 Vite 开发服务器（端口 5173）
3. 启动 TypeScript 监听模式（自动重新编译）
4. 启动 Electron 应用

### 开发环境说明

- **Vite 开发服务器**: 运行在 `http://localhost:5173`
- **Electron 窗口**: 自动加载 Vite 开发服务器
- **热重载**: 前端代码修改会自动刷新，Electron 代码修改需要重启应用

## 构建生产版本

### 构建应用

```bash
npm run electron:build
```

这个命令会：

1. 编译前端代码（TypeScript + Vite）
2. 编译 Electron 代码
3. 使用 electron-builder 打包应用

### 构建输出

构建产物会输出到 `release/` 目录：

- **macOS**: `.dmg` 文件
- **Windows**: `.exe` 安装程序（NSIS）
- **Linux**: `.AppImage` 和 `.deb` 文件

## 功能验证清单

### 基础功能

- [x] 应用正常启动
- [x] 窗口大小和标题正确
- [x] 前端界面正常显示

### 桌面 API 功能

- [ ] 外部链接打开（`desktopApi.openExternal`）
- [ ] 应用重启（`desktopApi.relaunch`）
- [ ] 更新检查（`desktopApi.updater.check`）
- [ ] 更新下载和安装（`desktopApi.updater.downloadAndInstall`）

### 其他功能

- [ ] 广告在桌面应用中不显示
- [ ] 设置对话框中的更新功能正常
- [ ] 工具卡片的外部链接正常打开

## 故障排除

### Preload 文件未找到

如果遇到 "Preload file not found" 错误：

1. 确保已运行编译：

   ```bash
   npm run electron:compile
   ```

2. 检查文件是否存在：
   ```bash
   ls -la electron/dist-electron/preload.js
   ```

### 端口冲突

如果端口 5173 已被占用：

1. 修改 `vite.config.ts` 中的端口配置
2. 或者停止占用端口的其他进程

### 开发工具不显示

开发环境中，Electron 窗口会自动打开开发者工具。如果没有显示：

1. 检查 `electron/main.ts` 中的 `openDevTools()` 调用
2. 手动打开：`View > Toggle Developer Tools`

## 配置说明

### electron-builder.yml

主要配置项：

- `appId`: 应用标识符
- `productName`: 应用名称
- `directories.output`: 构建输出目录
- `files`: 要包含在应用包中的文件

### 图标配置

当前图标路径已注释，需要配置：

1. 准备图标文件：
   - Windows: `build/icon.ico`
   - macOS: `build/icon.icns`
   - Linux: `build/icon.png`

2. 在 `electron-builder.yml` 中取消注释相应的图标路径

## 更新机制

应用使用 `electron-updater` 进行自动更新：

- **更新源**: GitHub Releases
- **检查频率**: 手动检查（通过设置对话框）
- **更新流程**: 检查 → 下载 → 安装 → 重启

更新配置在 `electron/main.ts` 中：

```typescript
autoUpdater.setFeedURL({
  provider: 'github',
  owner: 'aafnnp',
  repo: 'kit',
})
```
