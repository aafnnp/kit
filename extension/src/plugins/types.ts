import type { ComponentType } from "react"
import type { LocalizedText } from "@/lib/i18n"
import type { Logger } from "@/lib/log"
import type { TabInfo } from "@/lib/tabs"

/** 插件可以运行的位置。扩展当前只使用 popup 与 background 两个 surface */
export type PluginSurface = "popup" | "options" | "background" | "page"

export type MenuContext =
  | "all"
  | "page"
  | "frame"
  | "selection"
  | "link"
  | "editable"
  | "image"
  | "video"
  | "audio"
  | "launcher"
  | "browser_action"
  | "page_action"
  | "action"
  | "tab"

/** 右键菜单贡献：会被后台自动注册，点击后触发同名动作 */
export interface PluginMenuItem {
  id: string
  title: LocalizedText
  /** 非空元组，直接对应 browser.contextMenus 的类型要求 */
  contexts: [MenuContext, ...MenuContext[]]
  /** 需要与 `actions` 中的键对应，省略时触发 default */
  action?: string
}

export interface PluginContributes {
  menus?: PluginMenuItem[]
}

/**
 * 插件元数据。
 *
 * 这是唯一需要"提前知道"的信息：popup 只凭元数据就能渲染插件列表，
 * 而不用下载任何插件实现代码。所以元数据必须保持极小、无副作用、无依赖。
 */
export interface PluginMeta {
  /** 唯一 id，必须与目录名一致 */
  id: string
  name: LocalizedText
  description: LocalizedText
  /** 列表图标：单个 emoji 或字符即可（不额外加载图片资源） */
  icon: string
  version: string
  /** 排序权重，越小越靠前 */
  order?: number
  /** 默认是否启用。基础功能 true；需要额外权限或联网的高级功能 false */
  defaultEnabled: boolean
  /** popup 中是否有面板。false 表示"点击即执行"的纯动作插件 */
  panel?: boolean
  /** 运行期申请的扩展 API 权限（需在 manifest 的 optional_permissions 里声明） */
  permissions?: string[]
  /** 运行期申请的 host 权限（需在 manifest 的 optional_host_permissions 里声明） */
  origins?: string[]
  surfaces?: PluginSurface[]
  contributes?: PluginContributes
}

/** 插件私有的命名空间存储 */
export interface PluginStorage {
  get<T>(key: string, fallback: T): Promise<T>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
  watch<T>(key: string, callback: (value: T | null, oldValue: T | null) => void): () => void
}

/**
 * 插件运行时上下文。
 *
 * 通过注入而不是 import：插件拿到的都是宿主能力（权限、标签页、剪贴板），
 * 宿主可以在运行前统一做权限闸门与埋点。
 */
export interface PluginContext {
  readonly meta: PluginMeta
  readonly log: Logger
  readonly storage: PluginStorage
  /** 统一提示：有 UI 时是内联 toast，在后台是系统通知 */
  notify(message: string, options?: { type?: "info" | "success" | "error"; timeout?: number }): void
  copyText(text: string, label?: string): Promise<boolean>
  copyImage(blob: Blob, label?: string): Promise<boolean>
  getActiveTab(): Promise<TabInfo | null>
  listTabs(): Promise<TabInfo[]>
  /** 截取当前窗口可见区域，返回 dataURL（需要 activeTab） */
  captureVisibleTab(): Promise<string | null>
  hasPermissions(): Promise<boolean>
  /** 申请插件声明的权限（记得在用户手势里调用） */
  ensurePermissions(): Promise<boolean>
  /**
   * 在当前活动标签页里执行一次自包含函数（按需注入，不常驻）。
   * ⚠️ func 会被序列化成字符串在页面里执行，不能引用任何模块作用域的变量。
   */
  injectPage<Args extends unknown[], Result>(
    func: (...args: Args) => Result,
    args?: Args,
  ): Promise<Result | undefined>
  /** 当前页面是否允许注入（浏览器内部页面 / 扩展商店页面不允许） */
  canInject(): Promise<boolean>
  openOptions(): Promise<void>
}

export interface PluginPanelProps {
  meta: PluginMeta
  ctx: PluginContext
  /** 关闭面板，回到插件列表 */
  onExit: () => void
}

/** 动作名：`actions.default` 是点击插件图标的默认行为 */
export const DEFAULT_ACTION = "default"

/**
 * 插件实现。`meta.ts` 提供元数据，`index.tsx` 提供实现，
 * 实现里再 import 同目录的 meta，保证元数据只有一份。
 */
export interface KitPlugin {
  meta: PluginMeta
  /** 插件被激活时调用（返回的函数用于清理）。popup 打开 / 后台启动时触发 */
  activate?(ctx: PluginContext): void | Promise<void> | (() => void) | Promise<() => void>
  /** 可被右键菜单、快捷键、插件列表触发的命名动作 */
  actions?: Record<string, (ctx: PluginContext) => void | Promise<void>>
  /** popup 面板（懒加载，未打开时不会进入内存） */
  Panel?: ComponentType<PluginPanelProps>
}

export type KitPluginModule = { default: KitPlugin }
