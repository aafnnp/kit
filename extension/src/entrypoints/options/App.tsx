import { useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { ToastHost } from "@/components/toast-host"
import { Badge, Button, Card, Section, Switch } from "@/components/ui"
import { usePlugins, useSettings } from "@/hooks/use-plugins"
import { clearPluginStorage } from "@/lib/storage"
import { MANIFEST_VERSION, TARGET_BROWSER, getExtensionVersion } from "@/lib/env"
import { resolveText, tt } from "@/lib/i18n"
import { notify } from "@/lib/notify"
import type { PluginMeta } from "@/plugins/types"

export default function App() {
  const { plugins, enabledPlugins, loading, busyId, isEnabled, toggle, resetAll, issues } = usePlugins()
  const settings = useSettings()

  const basic = plugins.filter((meta) => meta.defaultEnabled)
  const advanced = plugins.filter((meta) => !meta.defaultEnabled)

  return (
    <div className="kit-options">
      <header className="kit-options__header">
        <div>
          <h1 className="kit-options__title">Kit {tt("工具箱", "Toolbox")}</h1>
          <p className="kit-options__subtitle">
            {tt(
              "启用的插件才会加载代码并按需申请权限，未启用的插件不会占用任何资源。",
              "Only enabled plugins load their code and request permissions on demand.",
            )}
          </p>
        </div>
        <div className="kit-row">
          <Badge tone="primary">
            {enabledPlugins.length}/{plugins.length} {tt("已启用", "enabled")}
          </Badge>
          <Button size="sm" onClick={() => void resetAll()}>
            {tt("恢复默认", "Reset to defaults")}
          </Button>
        </div>
      </header>

      <ErrorBoundary title={tt("插件管理出错", "Plugin manager crashed")}>
        <Section title={tt("基础插件", "Basic plugins")}>
          {loading ? null : (
            <>
              {basic.map((meta) => (
                <PluginRow
                  key={meta.id}
                  meta={meta}
                  enabled={isEnabled(meta.id)}
                  busy={busyId === meta.id}
                  onToggle={(next) => void toggle(meta.id, next)}
                />
              ))}
            </>
          )}
        </Section>

        <Section title={tt("高级插件（按需启用）", "Advanced plugins (opt-in)")}>
          {advanced.map((meta) => (
            <PluginRow
              key={meta.id}
              meta={meta}
              enabled={isEnabled(meta.id)}
              busy={busyId === meta.id}
              onToggle={(next) => void toggle(meta.id, next)}
            />
          ))}
        </Section>
      </ErrorBoundary>

      <Section title={tt("偏好设置", "Preferences")}>
        <Card>
          <SettingRow
            label={tt("插件多于 6 个时显示搜索框", "Show search when more than 6 plugins")}
            checked={settings.value.showSearch}
            onChange={(next) => void settings.setValue({ ...settings.value, showSearch: next })}
          />
          <SettingRow
            label={tt("动作执行成功后自动关闭弹窗", "Close popup after a successful action")}
            checked={settings.value.closePopupAfterAction}
            onChange={(next) => void settings.setValue({ ...settings.value, closePopupAfterAction: next })}
          />
          <SettingRow
            label={tt("后台动作用系统通知反馈", "Use system notifications for background actions")}
            checked={settings.value.systemNotifications}
            onChange={(next) => void settings.setValue({ ...settings.value, systemNotifications: next })}
          />
        </Card>
      </Section>

      {issues.length > 0 ? (
        <Section title={tt("插件问题", "Plugin issues")}>
          <Card>
            {issues.map((issue) => (
              <div key={`${issue.pluginId}-${issue.message}`} className="kit-kv">
                <span className="kit-kv__label kit-mono">{issue.pluginId}</span>
                <span className="kit-kv__value">{issue.message}</span>
              </div>
            ))}
          </Card>
        </Section>
      ) : null}

      <Section title={tt("关于", "About")}>
        <Card>
          <div className="kit-kv">
            <span className="kit-kv__label">{tt("版本", "Version")}</span>
            <span className="kit-kv__value kit-mono">{getExtensionVersion()}</span>
          </div>
          <div className="kit-kv">
            <span className="kit-kv__label">{tt("目标浏览器", "Target")}</span>
            <span className="kit-kv__value kit-mono">
              {TARGET_BROWSER} · MV{MANIFEST_VERSION}
            </span>
          </div>
          <div className="kit-kv">
            <span className="kit-kv__label">{tt("隐私", "Privacy")}</span>
            <span className="kit-kv__value">
              {tt(
                "所有处理都在本地完成，不上传任何页面内容。",
                "Everything runs locally; no page content is uploaded.",
              )}
            </span>
          </div>
        </Card>
      </Section>

      <ToastHost />
    </div>
  )
}

function PluginRow({
  meta,
  enabled,
  busy,
  onToggle,
}: {
  meta: PluginMeta
  enabled: boolean
  busy: boolean
  onToggle: (next: boolean) => void
}) {
  const [clearing, setClearing] = useState(false)

  const handleClear = async () => {
    setClearing(true)
    try {
      await clearPluginStorage(meta.id)
      notify(tt(`已清除「${resolveText(meta.name)}」的本地数据`, `Cleared local data of "${resolveText(meta.name)}"`), {
        type: "success",
      })
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="kit-plugin-row">
      <span className="kit-plugin-row__icon" aria-hidden="true">
        {meta.icon}
      </span>
      <div className="kit-plugin-row__main">
        <div className="kit-plugin-row__title">
          {resolveText(meta.name)}
          {meta.defaultEnabled ? null : <Badge>{tt("高级", "Advanced")}</Badge>}
        </div>
        <div className="kit-plugin-row__desc">{resolveText(meta.description)}</div>
        <div className="kit-plugin-row__meta">
          <span className="kit-mono">{meta.id}</span>
          <span>v{meta.version}</span>
          {(meta.permissions ?? []).map((permission) => (
            <Badge key={permission} tone={enabled ? "primary" : "neutral"}>
              {permission}
            </Badge>
          ))}
          {enabled ? (
            <button type="button" className="kit-link" onClick={() => void handleClear()} disabled={clearing}>
              {clearing ? tt("清理中…", "Clearing…") : tt("清除数据", "Clear data")}
            </button>
          ) : null}
        </div>
      </div>
      <Switch checked={enabled} disabled={busy} label={resolveText(meta.name)} onChange={onToggle} />
    </div>
  )
}

function SettingRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className="kit-setting-row">
      <span>{label}</span>
      <Switch checked={checked} label={label} onChange={onChange} />
    </div>
  )
}
