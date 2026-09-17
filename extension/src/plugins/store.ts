import { pluginStateItem, type PluginState } from "@/lib/storage"
import { getPluginMeta, getDefaultEnabledIds, pluginCatalog } from "./registry"

export type PluginStateMap = Record<string, PluginState>

export async function getPluginStates(): Promise<PluginStateMap> {
  return (await pluginStateItem.getValue()) ?? {}
}

function createState(enabled: boolean): PluginState {
  return { enabled, installedAt: Date.now() }
}

/**
 * 判定插件是否启用：
 * 存储里没有记录时回落到插件自身声明的 `defaultEnabled`，
 * 这样"默认提供基础功能"不需要在安装时写一遍初始状态。
 */
export function resolveEnabled(states: PluginStateMap, pluginId: string): boolean {
  const stored = states[pluginId]
  if (stored) return stored.enabled
  return getPluginMeta(pluginId)?.defaultEnabled ?? false
}

export async function isPluginEnabled(pluginId: string): Promise<boolean> {
  return resolveEnabled(await getPluginStates(), pluginId)
}

export async function getEnabledPluginIds(): Promise<string[]> {
  const states = await getPluginStates()
  return pluginCatalog.filter((meta) => resolveEnabled(states, meta.id)).map((meta) => meta.id)
}

export async function setPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
  const states = await getPluginStates()
  const previous = states[pluginId]

  states[pluginId] = {
    ...(previous ?? createState(enabled)),
    enabled,
    installedAt: previous?.installedAt ?? Date.now(),
  }

  await pluginStateItem.setValue(states)
}

export async function markPluginUsed(pluginId: string): Promise<void> {
  const states = await getPluginStates()
  const previous = states[pluginId]

  states[pluginId] = {
    enabled: previous?.enabled ?? resolveEnabled(states, pluginId),
    installedAt: previous?.installedAt ?? Date.now(),
    lastUsedAt: Date.now(),
    useCount: (previous?.useCount ?? 0) + 1,
  }

  await pluginStateItem.setValue(states)
}

/** 恢复默认：只保留声明了 defaultEnabled 的基础插件 */
export async function resetPluginStates(): Promise<void> {
  const now = Date.now()
  const states: PluginStateMap = {}
  for (const id of getDefaultEnabledIds()) {
    states[id] = { enabled: true, installedAt: now }
  }
  await pluginStateItem.setValue(states)
}

/** 订阅启用状态变化（后台用它重建右键菜单） */
export function watchPluginStates(callback: (states: PluginStateMap) => void): () => void {
  return pluginStateItem.watch((next) => callback(next ?? {}))
}
