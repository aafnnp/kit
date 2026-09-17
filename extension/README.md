# Kit 浏览器扩展

Kit 桌面工具箱的浏览器伴侣。基于 **WXT + React 19 + TypeScript**，一套代码输出 Chrome / Firefox 扩展（Safari 预留转换路径）。

核心设计：**插拔式插件系统**。扩展本体（外壳 + 插件运行时）保持极小，所有具体能力都是插件；插件可以在「管理插件」页按需启用/停用，未启用的插件代码不会被加载。

## 快速开始

扩展是**独立子项目**（有自己的 `package.json` / `node_modules`），不参与主应用的 pnpm workspace，因此不会影响桌面端与 Web 端的构建。

```bash
cd extension
npm install          # 会自动执行 wxt prepare
npm run dev          # Chrome 开发模式（自动打开 Chrome 并加载扩展）
npm run dev:firefox  # Firefox 开发模式
```

## 构建与打包

```bash
npm run build          # -> .output/chrome-mv3
npm run build:firefox  # -> .output/firefox-mv3
npm run build:all      # 两个浏览器都构建
npm run zip:all        # -> .output/*.zip（可直接上传商店）
npm run compile        # wxt prepare + tsc --noEmit
npm test               # 单元测试（插件注册表 / 文本处理）
```

CI：`.github/workflows/extension.yml`，在 `extension/**` 变化时跑类型检查 + 测试 + 双浏览器打包；
推送 `ext-v*` 标签会把两个 zip 挂到 GitHub Release。

## 文档

- [`docs/PLUGIN_API.md`](docs/PLUGIN_API.md) —— 如何新增一个插件（契约、上下文、两条硬性约束、清单）
- [`docs/ROADMAP.md`](docs/ROADMAP.md) —— 架构取舍说明、后续建议（含 Safari 转换步骤）、已知限制

## 手动加载（未打包版本）

| 浏览器 | 操作 |
| --- | --- |
| Chrome / Edge | `chrome://extensions` → 打开「开发者模式」→「加载已解压的扩展程序」→ 选择 `.output/chrome-mv3` |
| Firefox | `about:debugging#/runtime/this-firefox` →「临时加载附加组件」→ 选择 `.output/firefox-mv3/manifest.json` |

## 目录结构

```
extension/
├─ wxt.config.ts            # manifest 生成 + MV3 目标 + 权限声明
├─ src/
│  ├─ entrypoints/          # WXT 入口：background / popup / options
│  ├─ plugins/
│  │  ├─ types.ts           # 插件契约（唯一的"标准接口"）
│  │  ├─ define.ts          # 插件/Metadata 校验
│  │  ├─ registry.ts        # 插件注册表（meta 同步、实现懒加载）
│  │  ├─ store.ts           # 启用状态持久化
│  │  ├─ runtime.ts         # 授权、激活、动作执行
│  │  └─ builtin/           # 内置插件（每个插件一个目录）
│  ├─ components/           # 共用 UI
│  └─ lib/                  # browser / storage / i18n / 权限 / 剪贴板等基础层
└─ docs/
   ├─ PLUGIN_API.md         # 如何写一个插件
   └─ ROADMAP.md            # 后续规划与设计取舍
```

## 内置插件

| 插件 | 默认 | 说明 |
| --- | --- | --- |
| 页面信息 | ✅ | 提取标题/URL/OG/JSON-LD/统计，可复制为 Markdown |
| 文本工具 | ✅ | JSON、Base64、URL、时间戳、哈希、大小写、字数 |
| 二维码 | ✅ | 当前页面 / 选中文本 / 自定义内容生成二维码 |
| 取色器 | ✅ | 截屏取色（跨浏览器），或系统吸管 |
| 截图 | ✅ | 截取可见区域，复制 / 下载 / 新标签打开 |
| 标签页管理 | ⛔ | 按域名分组、导出 Markdown、关闭重复标签（启用时申请 `tabs` 权限） |

新增插件只需在 `src/plugins/builtin/` 下建目录并写 `meta.ts` + `index.tsx`，注册表会自动发现。详见 `docs/PLUGIN_API.md`。
