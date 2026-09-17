# 架构说明与后续建议

## 1. 这一版做了什么

- 新建 `extension/` 子项目：**WXT 0.21 + React 19 + TypeScript**，一套代码同时产出 Chrome / Firefox 的 MV3 扩展。
- 插件系统：元数据与实现分离的"双 glob"注册表 + 运行期启用开关 + 权限闸门。
- 6 个内置插件：页面信息、文本工具、二维码、取色器、截图、标签页管理（默认关闭，用于演示权限申请流程）。
- popup 插件启动器 + options 插件管理页 + 后台（右键菜单 / 快捷键 / 安装引导）。
- 版本号取自仓库根 `package.json`，与桌面端、Web 端天然一致，无需额外同步脚本。

## 2. 关键取舍（以及为什么）

| 决策 | 理由 |
| --- | --- |
| **WXT** 而不是手写 Vite + manifest | 跨浏览器差异（Firefox MV3 的 `background.scripts`、`browser_specific_settings`、`theme_icons`）全部由框架处理；开发期 HMR、`wxt zip` 打包开箱可用。手写方案要把这些差异维护一遍。 |
| 扩展作为**独立子项目**（自带 `package.json`，不加入根 pnpm workspace） | 桌面端/Web 端的依赖、锁文件、CI 完全不受影响；扩展升级 WXT/Vite 时不会牵动主应用。代价是需要在 `extension/` 里单独 `npm install`。 |
| **不常驻 content script**，改为 `activeTab + scripting.executeScript` 按需注入 | 安装时零 host 权限、零常驻内存。用户点开插件那一刻才注入，事后不残留。代价是每次动作多一次注入开销（毫秒级）。 |
| 元数据（`meta.ts`）同步加载、实现（`index.tsx`）懒加载 | popup 首屏只需要元数据就能渲染插件列表，不必下载任何插件实现；禁用/未打开的插件不进内存。构建产物里每个插件是独立 chunk（4~26 KB）。 |
| 文案用 `tt("中", "En")` 就地写，不做中央词典 | 插件目录自带完整文案，可以整体复制/删除；插件作者不会"忘记加词条"。代价是翻译分散，靠 review 保证完整。 |
| 插件通过 `ctx` 拿能力，而不是直接 import | 宿主能统一做权限检查、日志、降级（例如后台没有 DOM 时通知自动变系统通知），也给未来的插件审计留了收口点。 |
| `panel: false` 的"纯动作插件" | 截图、二维码这类不需要 UI，绑到右键菜单和快捷键时不必打开 popup，包体里也不需要对应 UI 代码。 |

## 3. 建议（按优先级）

### P0 — 上线前必须补齐

1. **`_locales` manifest 本地化**
   目前 UI 已双语，但 `name` / `description` / 菜单标题是中文写死的。
   做法：`public/_locales/{zh_CN,en}/messages.json` + `wxt.config.ts` 里 `default_locale` 与 `__MSG_extName__`。
2. **商店素材与隐私政策**
   Chrome Web Store 要求：1280×800 截图、隐私政策页（即使不收集数据也要声明）。
   AMO 要求：`browser_specific_settings.gecko.data_collection_permissions`（**已声明为 `none`**）。
3. **CI 打包**（本仓库已加 `.github/workflows/extension.yml`）
   一个插件市场包只需要 `npm run zip:all`；注意 Chrome 与 Firefox 的包**不能混用**。
4. **权限最小化的回归检查**
   新加插件时容易顺手加 `host_permissions`。约定：默认启用的插件一律不允许申请 host 权限，
   需要页面访问的一律走 `activeTab`。

### P1 — 体验与工程化

5. **Safari 支持（当前已预留）**
   ```bash
   npm run build                       # 先产出 .output/chrome-mv3
   xcrun safari-web-extension-converter .output/chrome-mv3 \
     --project-location safari --app-name "Kit" --bundle-identifier dev.aafnnp.kit
   ```
   代码层已避免 Chrome 独有 API（`browser.*` 统一走 polyfill；`captureVisibleTab` / `scripting` / `permissions` 三家都有实现）。
   注意点：Safari 的 `browser.action` 与 popup 尺寸行为有差异；用 Xcode 签名后才能真机测试；
   转换出的 Xcode 工程需要单独维护，建议作为独立步骤而不是并入主构建。
6. **插件设置能力的通用化**
   现在插件要自己写设置 UI。可以给 `PluginMeta` 加 `settings: FieldSchema[]`，
   由 options 页统一渲染表单并把值写进 `ctx.storage`，插件只读配置。能显著降低新插件成本。
7. **快捷键可视化**
   `commands` 里已声明两个快捷键，但用户看不到。在 options 里展示 + 提供
   `chrome://extensions/shortcuts` 跳转（Firefox 是 `about:addons`）。
8. **侧边栏 / Side Panel**
   Chrome `side_panel` 与 Firefox `sidebar_action` 都能放同一套插件面板，
   WXT 用 `entrypoints/sidepanel.html` 即可（manifest 里 WXT 会自动加 `sidepanel` 权限）。
   适合"取色 / 标签页管理"这类需要长时间停留的面板。
9. **插件间通信与依赖**
   目前插件之间彼此隔离（这是优点）。若某个插件需要复用另一个的能力，
   建议走宿主提供的 `ctx.call("plugin-id", "action", payload)`，而不是直接 import 对方实现，
   否则会破坏懒加载。
10. **错误上报**
    目前出错只在 `pluginIssues` 与控制台可见。可选接入轻量错误收集（注意隐私声明要同步更新）。

### P2 — 长期

11. **与 Web 版工具箱联动**：omnibox（`k` + 关键词）直接跳 `kit` Web 版的对应工具页。
    需要先确定稳定域名，并把工具 slug 表注入扩展（可以构建期生成，避免运行期请求）。
12. **插件分发**：在 MV3 下不能远程执行代码，"插件市场"只能是
    "新版本扩展带新插件" + 运行期开关。若要做成真正可增量安装，唯一合规路径是
    `chrome.runtime.getURL` 加载**已随包分发**的模块，本质仍是发版。
13. **大文件工具（FFmpeg / PDF / 图片批量）**：不建议搬进扩展。
    这类重依赖（主应用的 `@ffmpeg/core` 等）会让包体从 400 KB 涨到数十 MB，
    也超出 MV3 单一用途的合理范围，更适合让扩展**唤起 Web 版**处理。

## 4. 已知限制

- Chrome MV3 的 Service Worker 会被回收：后台只在消息/菜单/命令触发时唤醒，
  插件不要假设后台常驻（`activate()` 里的监听器要可重复注册）。
- `browser.notifications` 在缺少权限时静默失败（已 try/catch）。
- 复制**图片**到剪贴板依赖 `ClipboardItem`，Firefox 支持较晚；失败时会自动降级为下载。
- `tabs` 权限未授予时 `listTabs()` 拿不到 `url`/`title`，标签页管理插件会显示授权引导。
- 浏览器内部页面（`chrome://`、`about:`、扩展商店页）无法注入，插件会给出明确提示。

## 5. 与主应用的关系

| 共享 | 不共享 |
| --- | --- |
| 版本号（读根 `package.json`） | 依赖树、构建配置、锁文件 |
| 视觉 token（oklch 配色、圆角/间距节奏） | UI 组件库（扩展用 `src/components/ui.tsx`，不引入 Radix/Tailwind） |
| 部分纯逻辑的实现思路（如 `downloadBlob` 的延后 revoke） | 主应用的 `src/lib` 代码（避免耦合到桌面端运行时） |

如果后续出现两边都要改的纯函数（例如 `escapeCsvCell`），再考虑抽 `packages/shared`，
现在提前抽包只会增加构建复杂度。

## 6. 关于旧的 `origin/extension` 分支

旧分支（2025-09，基于 v0.1.3）是一个"把整个 Web 应用塞进 popup"的方案，
它改动了 `src/lib/persistence.ts`、`favorites.ts` 等核心文件，且落后 master 117 个提交。
本分支从 v0.5.0 重新出发，采用插件化外壳 + 按需加载，**未复用**旧分支代码，仅参考了其 `manifest.json` 与打包脚本思路。
