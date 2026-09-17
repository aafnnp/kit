# 插件开发指南

插件是 Kit 扩展的**唯一扩展点**。扩展本体只提供外壳（popup / options / background）与插件运行时，
所有具体能力都由插件承担，因此"加功能"= "加一个目录"。

## 1. 目录结构

```
src/plugins/builtin/<plugin-id>/
├─ meta.ts      # 元数据（同步加载、零依赖、无副作用）
├─ index.tsx    # 实现（懒加载，不在首屏包体里）
└─ ...          # 该插件自己的逻辑 / 组件 / 样式
```

- `<plugin-id>` 必须与 `meta.id` 完全一致（小写字母、数字、连字符）。
- `meta.ts` 会被**同步打包**进扩展：只能放纯数据，不要 `import` React、不要做 IO。
- `index.tsx` 通过 `import.meta.glob` 懒加载，因此插件再重也只影响自己。

## 2. 最小插件

```ts
// src/plugins/builtin/hello/meta.ts
import { definePluginMeta } from "@/plugins/define"

export const meta = definePluginMeta({
  id: "hello",
  name: { "zh-CN": "打招呼", en: "Hello" },
  description: { "zh-CN": "示例插件", en: "Sample plugin" },
  icon: "👋",
  version: "1.0.0",
  order: 100,
  defaultEnabled: true,
  panel: true,
  surfaces: ["popup"],
})
```

```tsx
// src/plugins/builtin/hello/index.tsx
import { Button, Card } from "@/components/ui"
import { definePlugin } from "@/plugins/define"
import type { PluginPanelProps } from "@/plugins/types"
import { meta } from "./meta"

export default definePlugin({
  meta,

  // 可选：右键菜单 / 快捷键 / 纯动作插件点击时触发
  actions: {
    default: async (ctx) => {
      const tab = await ctx.getActiveTab()
      ctx.notify(`当前页面：${tab?.title ?? "—"}`, { type: "success" })
    },
  },

  // 可选：popup 面板
  Panel: ({ ctx, onExit }: PluginPanelProps) => (
    <Card>
      <Button size="sm" variant="primary" onClick={() => void onExit()}>
        关闭面板
      </Button>
    </Card>
  ),
})
```

保存后 `npm run dev` 即可在 popup 里看到它，**不需要修改任何注册表**。

## 3. 元数据字段

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | ✅ | 唯一 id，必须等于目录名 |
| `name` / `description` | ✅ | 双语对象，两种语言都要给 |
| `icon` | ✅ | 单个 emoji / 字符（不加载图片资源，保证列表瞬时渲染） |
| `version` | ✅ | 插件语义化版本 |
| `order` | | 排序权重，越小越靠前（内置插件用 10/20/30…） |
| `defaultEnabled` | ✅ | 默认是否启用。基础功能 `true`，需要额外权限的写 `false` |
| `panel` | | `true` 表示有 popup 面板；`false`/省略 表示"点击即执行"的纯动作插件 |
| `permissions` | | 需要的扩展 API 权限，必须在 manifest 的 `optional_permissions` 里声明过 |
| `origins` | | 需要的 host 权限，必须在 `optional_host_permissions` 里声明过 |
| `surfaces` | | 运行位置：`popup` / `background` / `options` / `page` |
| `contributes.menus` | | 右键菜单项，后台会自动注册并在停用时移除 |

## 4. 运行时上下文 `ctx`

插件**不直接 import 宿主能力**，而是通过 `ctx` 拿到（这样宿主才能统一做权限闸门、埋点、降级）。

| API | 说明 |
| --- | --- |
| `ctx.meta` | 自己的元数据 |
| `ctx.log` | 带作用域前缀的日志（生产构建自动静默 debug） |
| `ctx.storage.get/set/remove/watch` | 插件私有存储，自动按 `local:plugin:<id>:` 隔离 |
| `ctx.notify(msg, opts)` | 统一提示：popup 里是内联 toast，后台是系统通知 |
| `ctx.copyText(text, label?)` | 复制文本（含降级实现） |
| `ctx.copyImage(blob, label?)` | 复制图片 |
| `ctx.getActiveTab()` | 当前标签页（`{ id, url, title, … }`） |
| `ctx.listTabs()` | 全部标签页（需要 `tabs` 权限） |
| `ctx.captureVisibleTab()` | 截取可见区域，返回 dataURL |
| `ctx.injectPage(fn, args?)` | 在当前页面执行一次自包含函数 |
| `ctx.canInject()` | 当前页面是否可注入（浏览器内部页 / 商店页不可以） |
| `ctx.hasPermissions()` / `ctx.ensurePermissions()` | 检查 / 申请本插件声明的权限 |
| `ctx.openOptions()` | 打开「管理插件」页 |

## 5. 两条硬性约束（踩坑高发区）

### 5.1 注入页面的函数必须自包含

`ctx.injectPage(fn)` 最终走 `browser.scripting.executeScript({ func })`，
浏览器拿到的是**函数的字符串**，在页面里重新求值：

```ts
// ✅ 正确：只依赖参数和页面自身的 API
export function collectTitle(): string {
  return document.title
}

// ❌ 错误：引用了模块作用域的东西，页面里会是 undefined
import { helper } from "./helper"
export function broken(): string {
  return helper(document.title)
}
```

返回值必须是可结构化克隆的普通数据（对象 / 数组 / 基本类型），不能返回 DOM 节点或函数。

### 5.2 MV3 不能执行远程代码

所有插件代码必须在打包时就在扩展里（本项目的 `import.meta.glob` 保证了这一点）。
"在线安装新插件"只能做成以下三种形式，不能是"下载 JS 并 eval"：

1. 运行期开关（内置插件启用 / 停用）
2. 声明式能力开关（在「管理插件」里开关某个插件，宿主按需申请权限）
3. 发布新版本（用户从商店更新）

## 6. 权限与"插拔式安装"

插件在启用时才申请权限，这是本项目的核心设计之一：

```ts
// meta.ts
export const meta = definePluginMeta({
  // ...
  defaultEnabled: false,
  permissions: ["tabs"], // 必须已在 wxt.config.ts 的 optional_permissions 里声明
})
```

用户在「管理插件」页打开开关时，`usePlugins().toggle()` 会**先**调用
`browser.permissions.request()`（必须在用户手势里，所以不要在它之前插入其它 await），
被拒绝则不写入启用状态。

新增权限时记得同步修改 `wxt.config.ts`：

```ts
optional_permissions: ["tabs", "downloads", /* 新增 */],
optional_host_permissions: ["<all_urls>"],
```

## 7. 右键菜单

```ts
contributes: {
  menus: [
    {
      id: "copy-markdown",
      title: { "zh-CN": "Kit：复制页面信息", en: "Kit: copy page info" },
      contexts: ["page", "selection"],   // 非空元组，类型与浏览器 API 一致
      action: "copy-markdown",           // 对应 actions 里的键，省略则走 default
    },
  ],
}
```

后台会在插件启用状态变化时自动 `removeAll()` + 重建菜单，插件无需关心。

## 8. 国际化与样式

- 文案：`tt("中文", "English")` 就地写，不维护中央词典；元数据用 `{ "zh-CN", en }` 对象。
- 样式：复用 `src/assets/theme.css` 的 token 与类（`kit-card`、`kit-btn`、`kit-kv`、`kit-list`…），
  插件不要引入新的 UI 框架，避免包体膨胀。
- 公共组件在 `src/components/ui.tsx`（Button / Card / Switch / Field / EmptyState / KeyValue …）。

## 9. 测试

插件被 vitest 直接导入，因此纯逻辑可以按仓库惯例放在同名 `*.test.ts` 里：

```bash
npm test
```

## 10. 提交前检查清单

- [ ] `npm run compile`（wxt prepare + tsc）无错误
- [ ] `npm run build:all` 两个浏览器都能构建
- [ ] `meta.id` 与目录名一致、`order` 合理、双语文案齐全
- [ ] 新增权限已同步到 `wxt.config.ts` 的 `optional_*`
- [ ] 默认启用的插件不申请任何 host 权限（保持零权限安装体验）
