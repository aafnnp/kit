import { useCallback, useEffect, useMemo, useState } from "react"
import { browser } from "wxt/browser"
import { Button, Card, EmptyState, Spinner } from "@/components/ui"
import { tt } from "@/lib/i18n"
import type { TabInfo } from "@/lib/tabs"
import { definePlugin } from "@/plugins/define"
import type { PluginPanelProps } from "@/plugins/types"
import { meta } from "./meta"

interface TabGroup {
  host: string
  tabs: TabInfo[]
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname || tt("其它", "Others")
  } catch {
    return tt("其它", "Others")
  }
}

/**
 * 需要 `tabs` 权限（读取非活动标签页的 URL / 标题）。
 * 这是"插拔式权限"的样板：权限在**启用插件时**才申请，而不是安装时全量索要。
 */
export default definePlugin({
  meta,
  Panel: TabManagerPanel,
})

function TabManagerPanel({ ctx }: PluginPanelProps) {
  const [tabs, setTabs] = useState<TabInfo[] | null>(null)
  const [granted, setGranted] = useState(true)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setGranted(await ctx.hasPermissions())
      setTabs(await ctx.listTabs())
    } finally {
      setLoading(false)
    }
  }, [ctx])

  useEffect(() => {
    void load()
  }, [load])

  const groups = useMemo<TabGroup[]>(() => {
    const map = new Map<string, TabInfo[]>()

    for (const tab of tabs ?? []) {
      const host = hostOf(tab.url)
      const bucket = map.get(host)
      if (bucket) bucket.push(tab)
      else map.set(host, [tab])
    }

    return [...map.entries()]
      .map(([host, items]) => ({ host, tabs: items }))
      .sort((a, b) => b.tabs.length - a.tabs.length || a.host.localeCompare(b.host))
  }, [tabs])

  const duplicates = useMemo(() => {
    const byUrl = new Map<string, TabInfo[]>()
    for (const tab of tabs ?? []) {
      if (!tab.url) continue
      const bucket = byUrl.get(tab.url)
      if (bucket) bucket.push(tab)
      else byUrl.set(tab.url, [tab])
    }
    return [...byUrl.entries()].filter(([, items]) => items.length > 1)
  }, [tabs])

  const toMarkdown = () =>
    groups
      .map((group) => {
        const lines = group.tabs.map((tab) => `- [${tab.title || tab.url}](${tab.url})`)
        return `## ${group.host} (${group.tabs.length})\n\n${lines.join("\n")}`
      })
      .join("\n\n")

  const closeDuplicates = async () => {
    const removable = duplicates.flatMap(([, items]) => {
      // 保留活动标签页（其次保留第一个），其余关闭
      const keep = items.find((tab) => tab.active) ?? items[0]
      return items.filter((tab) => tab.id !== keep?.id).map((tab) => tab.id)
    })

    if (removable.length === 0) return

    try {
      await browser.tabs.remove(removable)
      ctx.notify(tt(`已关闭 ${removable.length} 个重复标签页`, `Closed ${removable.length} duplicate tabs`), {
        type: "success",
      })
      await load()
    } catch (cause) {
      ctx.notify((cause as Error).message, { type: "error" })
    }
  }

  if (!granted) {
    return (
      <EmptyState
        icon="🔒"
        title={tt("需要标签页权限", "Tab permission required")}
        hint={tt(
          "读取标签页标题与地址需要 tabs 权限，仅在你点击授权后生效。",
          "Reading tab titles and URLs requires the tabs permission.",
        )}
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              void (async () => {
                await ctx.ensurePermissions()
                await load()
              })()
            }}
          >
            {tt("授权并读取", "Grant and load")}
          </Button>
        }
      />
    )
  }

  if (!tabs && loading) {
    return (
      <div className="kit-empty">
        <Spinner size={18} />
      </div>
    )
  }

  return (
    <>
      <Card>
        <div className="kit-row">
          <span style={{ flex: 1, color: "var(--kit-muted)" }}>
            {tabs?.length ?? 0} {tt("个标签页", "tabs")} · {groups.length} {tt("个域名", "domains")}
          </span>
          <Button size="sm" loading={loading} onClick={() => void load()}>
            {tt("刷新", "Refresh")}
          </Button>
        </div>
      </Card>

      <Card>
        <div className="kit-row">
          <Button
            size="sm"
            variant="primary"
            disabled={groups.length === 0}
            onClick={() => void ctx.copyText(toMarkdown(), tt("标签页已复制", "Tabs copied"))}
          >
            {tt("复制为 Markdown", "Copy as Markdown")}
          </Button>
          <Button size="sm" disabled={duplicates.length === 0} onClick={() => void closeDuplicates()}>
            {tt("关闭重复", "Close duplicates")}
            {duplicates.length > 0 ? ` (${duplicates.reduce((sum, [, items]) => sum + items.length - 1, 0)})` : ""}
          </Button>
        </div>
      </Card>

      <Card>
        <ul className="kit-list">
          {groups.map((group) => (
            <li key={group.host} style={{ alignItems: "flex-start" }}>
              <span className="kit-badge kit-badge--primary">{group.tabs.length}</span>
              <span style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{group.host}</div>
                <div style={{ color: "var(--kit-muted)", fontSize: 11 }}>
                  {group.tabs
                    .slice(0, 3)
                    .map((tab) => tab.title || tab.url)
                    .join(" · ")}
                  {group.tabs.length > 3 ? ` … +${group.tabs.length - 3}` : ""}
                </div>
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
