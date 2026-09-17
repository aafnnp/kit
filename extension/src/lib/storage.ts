import { storage } from "wxt/utils/storage"
import type { PluginStorage } from "@/plugins/types"

export interface PluginState {
  enabled: boolean
  /** 首次启用时间 */
  installedAt: number
  /** 最近一次使用时间 */
  lastUsedAt?: number
  /** 使用次数，用于"最近使用"排序 */
  useCount?: number
}

export interface ExtensionSettings {
  /** popup 里是否显示插件搜索框 */
  showSearch: boolean
  /** 动作执行成功后是否自动关闭 popup */
  closePopupAfterAction: boolean
  /** 是否发送系统通知（后台动作的反馈） */
  systemNotifications: boolean
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  showSearch: true,
  closePopupAfterAction: false,
  systemNotifications: true,
}

export const settingsItem = storage.defineItem<ExtensionSettings>("local:settings", {
  fallback: DEFAULT_SETTINGS,
})

export const pluginStateItem = storage.defineItem<Record<string, PluginState>>("local:plugin-state", {
  fallback: {},
})

export const installInfoItem = storage.defineItem<{ firstInstalledAt: number; lastVersion: string }>(
  "local:install-info",
  { fallback: { firstInstalledAt: 0, lastVersion: "" } },
)

/**
 * 插件私有存储：按 `local:plugin:<id>:<key>` 命名空间隔离，
 * 插件之间不会互相污染，卸载（停用）时也能整体清理。
 */
export function createPluginStorage(pluginId: string): PluginStorage {
  const key = (name: string) => `local:plugin:${pluginId}:${name}` as `local:${string}`

  return {
    async get<T>(name: string, fallback: T): Promise<T> {
      const value = await storage.getItem<T>(key(name))
      return value ?? fallback
    },
    async set<T>(name: string, value: T): Promise<void> {
      await storage.setItem(key(name), value)
    },
    async remove(name: string): Promise<void> {
      await storage.removeItem(key(name))
    },
    watch<T>(name: string, callback: (value: T | null, oldValue: T | null) => void): () => void {
      return storage.watch<T>(key(name), callback)
    },
  }
}

/** 清空某个插件的全部数据 */
export async function clearPluginStorage(pluginId: string): Promise<void> {
  const prefix = `local:plugin:${pluginId}:`
  const snapshot = await storage.snapshot("local")
  const keys = Object.keys(snapshot).filter((key) => key.startsWith(prefix))
  await Promise.all(keys.map((key) => storage.removeItem(`local:${key}`)))
}
