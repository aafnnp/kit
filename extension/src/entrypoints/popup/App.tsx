import { useCallback, useMemo, useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { ToastHost } from "@/components/toast-host"
import { Badge, Button, EmptyState, IconButton, Input, Spinner } from "@/components/ui"
import { usePluginModule, usePlugins, useSettings } from "@/hooks/use-plugins"
import { resolveText, tt } from "@/lib/i18n"
import { openExtensionPage } from "@/lib/tabs"
import { createPluginContext, runPluginAction } from "@/plugins/runtime"
import { DEFAULT_ACTION, type PluginMeta } from "@/plugins/types"

type View = { kind: "grid" } | { kind: "panel"; id: string }

export default function App() {
  const { enabledPlugins, enabledIds, loading, issues } = usePlugins()
  const settings = useSettings()
  const [view, setView] = useState<View>({ kind: "grid" })
  const [query, setQuery] = useState("")

  const showSearch = settings.value.showSearch && enabledPlugins.length > 6

  const visiblePlugins = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return enabledPlugins
    return enabledPlugins.filter((meta) =>
      [meta.id, resolveText(meta.name), resolveText(meta.description), meta.name.en]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    )
  }, [enabledPlugins, query])

  const openPlugin = useCallback(
    async (meta: PluginMeta) => {
      // 有面板的插件：懒加载面板；纯动作插件：直接执行默认动作
      if (meta.panel) {
        setView({ kind: "panel", id: meta.id })
        return
      }

      const result = await runPluginAction(meta.id, DEFAULT_ACTION)
      if (result.ok && settings.value.closePopupAfterAction) {
        globalThis.close()
      }
    },
    [settings],
  )

  if (view.kind === "panel") {
    const meta = enabledPlugins.find((item) => item.id === view.id)
    if (!meta) {
      setView({ kind: "grid" })
      return null
    }
    return (
      <div className="kit-app">
        <PluginPanelView meta={meta} onExit={() => setView({ kind: "grid" })} />
        <ToastHost />
      </div>
    )
  }

  return (
    <div className="kit-app">
      <header className="kit-header">
        <span className="kit-header__logo" aria-hidden="true">
          🧰
        </span>
        <h1 className="kit-header__title">Kit {tt("工具箱", "Toolbox")}</h1>
        {issues.length > 0 ? <Badge tone="danger">{issues.length}</Badge> : null}
        <IconButton label={tt("管理插件", "Manage plugins")} onClick={() => void openExtensionPage("/options.html")}>
          ⚙
        </IconButton>
      </header>

      <div className="kit-body">
        {showSearch ? (
          <div className="kit-toolbar">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tt("搜索已启用的插件", "Search enabled plugins")}
              aria-label={tt("搜索插件", "Search plugins")}
            />
          </div>
        ) : null}

        {loading ? (
          <div className="kit-empty">
            <Spinner size={18} />
          </div>
        ) : enabledPlugins.length === 0 ? (
          <EmptyState
            icon="🧩"
            title={tt("还没有启用任何插件", "No plugins enabled yet")}
            hint={tt("到「管理插件」里挑选需要的功能", "Pick the features you need in Manage plugins")}
            action={
              <Button variant="primary" size="sm" onClick={() => void openExtensionPage("/options.html")}>
                {tt("管理插件", "Manage plugins")}
              </Button>
            }
          />
        ) : visiblePlugins.length === 0 ? (
          <EmptyState icon="🔍" title={tt("没有匹配的插件", "No matching plugin")} />
        ) : (
          <div className="kit-grid">
            {visiblePlugins.map((meta) => (
              <button
                key={meta.id}
                type="button"
                className="kit-plugin-item"
                onClick={() => void openPlugin(meta)}
                title={resolveText(meta.description)}
              >
                <span className="kit-plugin-item__icon" aria-hidden="true">
                  {meta.icon}
                </span>
                <span className="kit-plugin-item__name">{resolveText(meta.name)}</span>
                <span className="kit-plugin-item__desc">{resolveText(meta.description)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <footer className="kit-footer">
        <span style={{ flex: 1, color: "var(--kit-muted)", fontSize: 11 }}>
          {enabledIds.length} {tt("个插件已启用", "plugins enabled")}
        </span>
        <Button size="sm" onClick={() => void openExtensionPage("/options.html")}>
          {tt("管理插件", "Manage")}
        </Button>
      </footer>

      <ToastHost />
    </div>
  )
}

function PluginPanelView({ meta, onExit }: { meta: PluginMeta; onExit: () => void }) {
  const { plugin, status, error } = usePluginModule(meta.id)
  const ctx = useMemo(() => createPluginContext(meta), [meta])
  const Panel = plugin?.Panel

  return (
    <>
      <header className="kit-header">
        <IconButton label={tt("返回", "Back")} onClick={onExit}>
          ←
        </IconButton>
        <h1 className="kit-header__title">
          {meta.icon} {resolveText(meta.name)}
        </h1>
      </header>

      <div className="kit-body">
        <ErrorBoundary title={tt("插件渲染出错", "Plugin crashed")} onReset={onExit}>
          {status === "loading" || status === "idle" ? (
            <div className="kit-empty">
              <Spinner size={18} />
            </div>
          ) : status === "error" || !Panel ? (
            <EmptyState
              icon="⚠️"
              title={tt("插件加载失败", "Failed to load plugin")}
              hint={error ?? undefined}
              action={
                <Button size="sm" onClick={onExit}>
                  {tt("返回", "Back")}
                </Button>
              }
            />
          ) : (
            <Panel meta={meta} ctx={ctx} onExit={onExit} />
          )}
        </ErrorBoundary>
      </div>
    </>
  )
}
