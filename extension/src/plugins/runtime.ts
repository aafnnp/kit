import { createLogger } from "@/lib/log"
import { copyImage, copyText } from "@/lib/clipboard"
import { resolveText, tt } from "@/lib/i18n"
import { notify } from "@/lib/notify"
import { ensurePermissions, hasPermissions, type PermissionRequest } from "@/lib/permissions"
import { createPluginStorage } from "@/lib/storage"
import {
  captureVisibleTab,
  executeInTab,
  getActiveTab,
  isRestrictedUrl,
  listTabs,
  openExtensionPage,
} from "@/lib/tabs"
import { getPluginMeta, loadPlugin } from "./registry"
import { getEnabledPluginIds, isPluginEnabled, markPluginUsed } from "./store"
import { DEFAULT_ACTION, type PluginContext, type PluginMeta } from "./types"

const log = createLogger("runtime")

/** 把插件声明的权限翻译成 permissions API 需要的结构 */
export function toPermissionRequest(meta: PluginMeta): PermissionRequest {
  return { permissions: meta.permissions ?? [], origins: meta.origins ?? [] }
}

export function createPluginContext(meta: PluginMeta): PluginContext {
  const request = toPermissionRequest(meta)

  return {
    meta,
    log: createLogger(`plugin:${meta.id}`),
    storage: createPluginStorage(meta.id),
    notify,
    copyText,
    copyImage,
    getActiveTab,
    listTabs,
    captureVisibleTab,
    hasPermissions: () => hasPermissions(request),
    ensurePermissions: () => ensurePermissions(request),
    injectPage: async <Args extends unknown[], Result>(func: (...args: Args) => Result, args?: Args) => {
      const tab = await getActiveTab()
      if (!tab) return undefined
      return executeInTab(tab.id, func, args)
    },
    canInject: async () => {
      const tab = await getActiveTab()
      return Boolean(tab) && !isRestrictedUrl(tab?.url)
    },
    openOptions: () => openExtensionPage("/options.html"),
  }
}

export interface RunActionResult {
  ok: boolean
  error?: string
}

/**
 * 执行插件动作前的统一闸门：
 * 启用状态 → 权限完整性 → 实现加载。
 *
 * 把这段收敛在一处，右键菜单 / 快捷键 / popup 三条入口的失败行为就完全一致。
 */
export async function runPluginAction(
  pluginId: string,
  action: string = DEFAULT_ACTION,
): Promise<RunActionResult> {
  const meta = getPluginMeta(pluginId)
  if (!meta) return { ok: false, error: tt("插件不存在", "Plugin not found") }

  const name = resolveText(meta.name)

  if (!(await isPluginEnabled(pluginId))) {
    const error = tt(`插件「${name}」未启用`, `Plugin "${name}" is disabled`)
    notify(error, { type: "error" })
    return { ok: false, error }
  }

  if (!(await hasPermissions(toPermissionRequest(meta)))) {
    const error = tt(
      `插件「${name}」缺少权限，请在「管理插件」中重新启用`,
      `Plugin "${name}" is missing permissions, re-enable it in settings`,
    )
    notify(error, { type: "error" })
    return { ok: false, error }
  }

  const plugin = await loadPlugin(pluginId)
  if (!plugin) return { ok: false, error: tt("插件加载失败", "Failed to load plugin") }

  const handler = plugin.actions?.[action]
  if (!handler) {
    return { ok: false, error: tt(`插件未实现动作「${action}」`, `Plugin has no action "${action}"`) }
  }

  const ctx = createPluginContext(meta)

  try {
    await handler(ctx)
    await markPluginUsed(pluginId)
    return { ok: true }
  } catch (error) {
    const message = (error as Error)?.message ?? String(error)
    log.error(`插件 ${pluginId} 动作 ${action} 执行失败`, error)
    notify(tt(`「${name}」执行失败：${message}`, `"${name}" failed: ${message}`), { type: "error" })
    return { ok: false, error: message }
  }
}

/** 调用插件的 activate 生命周期，返回清理函数（未启用 / 无实现时是空函数） */
export async function activatePlugin(pluginId: string): Promise<() => void> {
  if (!(await isPluginEnabled(pluginId))) return () => {}

  const meta = getPluginMeta(pluginId)
  if (!meta) return () => {}

  const plugin = await loadPlugin(pluginId)
  if (!plugin?.activate) return () => {}

  try {
    const dispose = await plugin.activate(createPluginContext(meta))
    return typeof dispose === "function" ? dispose : () => {}
  } catch (error) {
    log.error(`插件 ${pluginId} 激活失败`, error)
    return () => {}
  }
}

/** 激活全部已启用的插件（后台启动 / popup 打开时调用），返回统一清理函数 */
export async function activateEnabledPlugins(): Promise<() => void> {
  const pluginIds = await getEnabledPluginIds()
  const disposers = await Promise.all(pluginIds.map((id) => activatePlugin(id)))

  return () => {
    for (const dispose of disposers) {
      try {
        dispose()
      } catch (error) {
        log.warn("插件清理失败", error)
      }
    }
  }
}
