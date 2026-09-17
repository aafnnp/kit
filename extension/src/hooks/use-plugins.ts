import { useCallback, useEffect, useMemo, useState } from "react"
import { useStorageItem } from "@/hooks/use-storage-item"
import { resolveText, tt } from "@/lib/i18n"
import { notify } from "@/lib/notify"
import { ensurePermissions } from "@/lib/permissions"
import { DEFAULT_SETTINGS, pluginStateItem, settingsItem, type ExtensionSettings, type PluginState } from "@/lib/storage"
import { getPluginMeta, loadPlugin, pluginCatalog, pluginIssues, type PluginIssue } from "@/plugins/registry"
import { resetPluginStates, resolveEnabled, type PluginStateMap } from "@/plugins/store"
import type { KitPlugin, PluginMeta } from "@/plugins/types"

export interface UsePluginsResult {
  /** 全部插件（含未启用） */
  plugins: readonly PluginMeta[]
  /** 已启用插件 */
  enabledPlugins: PluginMeta[]
  /** 已启用的插件 id */
  enabledIds: string[]
  issues: PluginIssue[]
  states: PluginStateMap
  loading: boolean
  /** 正在切换启用状态的插件 id */
  busyId: string | null
  isEnabled: (id: string) => boolean
  /** 切换启用状态；启用时会先申请权限（必须在用户手势里调用） */
  toggle: (id: string, next: boolean) => Promise<boolean>
  resetAll: () => Promise<void>
}

export function usePlugins(): UsePluginsResult {
  const { value: states, loading, setValue } = useStorageItem<PluginStateMap>(pluginStateItem, {})
  const [busyId, setBusyId] = useState<string | null>(null)

  const isEnabled = useCallback((id: string) => resolveEnabled(states, id), [states])

  const enabledPlugins = useMemo(
    () => pluginCatalog.filter((meta) => resolveEnabled(states, meta.id)),
    [states],
  )

  const toggle = useCallback(
    async (id: string, next: boolean): Promise<boolean> => {
      const meta = getPluginMeta(id)
      if (!meta) return false

      setBusyId(id)
      try {
        if (next) {
          // 权限申请必须发生在用户手势内：这里不能插入其它 await
          const granted = await ensurePermissions({
            permissions: meta.permissions ?? [],
            origins: meta.origins ?? [],
          })
          if (!granted) {
            notify(
              tt(
                `「${resolveText(meta.name)}」需要权限才能启用`,
                `"${resolveText(meta.name)}" needs permission to be enabled`,
              ),
              { type: "error" },
            )
            return false
          }
        }

        const previous: PluginState | undefined = states[id]
        const nextStates: PluginStateMap = {
          ...states,
          [id]: {
            enabled: next,
            installedAt: previous?.installedAt ?? Date.now(),
            lastUsedAt: previous?.lastUsedAt,
            useCount: previous?.useCount,
          },
        }

        await setValue(nextStates)
        return true
      } finally {
        setBusyId(null)
      }
    },
    [states, setValue],
  )

  const resetAll = useCallback(async () => {
    await resetPluginStates()
    notify(tt("已恢复默认插件", "Plugins reset to defaults"), { type: "success" })
  }, [])

  return {
    plugins: pluginCatalog,
    enabledPlugins,
    enabledIds: enabledPlugins.map((meta) => meta.id),
    issues: pluginIssues,
    states,
    loading,
    busyId,
    isEnabled,
    toggle,
    resetAll,
  }
}

export interface UsePluginModuleResult {
  plugin: KitPlugin | null
  status: "idle" | "loading" | "ready" | "error"
  error: string | null
}

/** 懒加载单个插件实现（打开面板时才调用） */
export function usePluginModule(pluginId: string | null): UsePluginModuleResult {
  const [plugin, setPlugin] = useState<KitPlugin | null>(null)
  const [status, setStatus] = useState<UsePluginModuleResult["status"]>("idle")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pluginId) {
      setPlugin(null)
      setStatus("idle")
      setError(null)
      return
    }

    let alive = true
    setPlugin(null)
    setStatus("loading")
    setError(null)

    loadPlugin(pluginId)
      .then((loaded) => {
        if (!alive) return
        if (!loaded) {
          setStatus("error")
          setError(tt("插件加载失败", "Failed to load plugin"))
          return
        }
        setPlugin(loaded)
        setStatus("ready")
      })
      .catch((cause: unknown) => {
        if (!alive) return
        setStatus("error")
        setError((cause as Error)?.message ?? String(cause))
      })

    return () => {
      alive = false
    }
  }, [pluginId])

  return { plugin, status, error }
}

export function useSettings() {
  return useStorageItem<ExtensionSettings>(settingsItem, DEFAULT_SETTINGS)
}
