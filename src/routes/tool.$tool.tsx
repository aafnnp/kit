import { createFileRoute, lazyRouteComponent, useRouter } from "@tanstack/react-router"
import { Suspense, useEffect, useMemo, useState } from "react"
import { perfBus, mark, measure } from "@/lib/performance"
import tools from "@/lib/data"
import { getToolLoaderBySlug, hasTool } from "@/lib/data"
import { ToolNotFound } from "@/components/common"
import { ToolLoading } from "@/components/ui/loading"
import { AdSenseAd } from "@/components/ads"
import { useRoutePrefetch } from "@/lib/routing"
import { useSmartPreload } from "@/lib/data"
import { QueryClient } from "@tanstack/react-query"
import type { Tool, ToolCategory } from "@/schemas/tool.schema"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"

// 类型守卫：检查是否为工具
function isTool(obj: unknown): obj is Tool {
  return (
    typeof obj === "object" && obj !== null && "slug" in obj && "name" in obj && typeof (obj as Tool).slug === "string"
  )
}

// 类型守卫：检查是否为工具分类
function isToolCategory(obj: unknown): obj is ToolCategory {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "tools" in obj &&
    Array.isArray((obj as ToolCategory).tools)
  )
}

export const Route = createFileRoute("/tool/$tool")({
  loader: async ({ context, params }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    const slug = params.tool
    // 示例：若某些工具需要公共元信息，可在此预取（占位，避免真实网络依赖）
    // 这里用一个稳定键做演示，真实项目可替换为需要的接口
    await queryClient.prefetchQuery({
      queryKey: ["tool-meta", slug],
      queryFn: async () => ({ slug, ts: Date.now() }),
      staleTime: 5 * 60 * 1000,
    })
    return null
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { tool: toolSlug } = Route.useParams()
  const { trackToolUsage } = useSmartPreload()
  const { prefetchRelated } = useRoutePrefetch()
  const router = useRouter()
  const { t } = useTranslation()

  // 查找工具信息（使用类型守卫）
  const categories = (tools as ToolCategory[]).filter((category) => isToolCategory(category))
  const toolInfo = categories.flatMap((category) => category.tools).find((t) => isTool(t) && t.slug === toolSlug)

  const activeCategory = categories.find((category) =>
    category.tools.some((tool) => isTool(tool) && tool.slug === toolSlug),
  )

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (activeCategory) return activeCategory.id
    if (categories[0]) return categories[0].id
    return ""
  })

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? activeCategory
  const [toolSearch, setToolSearch] = useState("")

  const toolsInSelectedCategory = useMemo(() => {
    const baseTools = selectedCategory?.tools.filter((tool) => isTool(tool)) ?? []
    if (!toolSearch.trim()) return baseTools
    const keyword = toolSearch.trim().toLowerCase()
    return baseTools.filter((tool) => {
      const name = tool.name.toLowerCase()
      const translated = t(`tools.${tool.slug}`, tool.name).toLowerCase()
      return name.includes(keyword) || translated.includes(keyword)
    })
  }, [selectedCategory, toolSearch, t])

  useEffect(() => {
    if (!activeCategory?.id) return
    setSelectedCategoryId(activeCategory.id)
  }, [activeCategory?.id, toolSlug])

  // 预取关联工具
  useEffect(() => {
    if (toolSlug) {
      prefetchRelated(toolSlug)
    }
  }, [toolSlug, prefetchRelated])

  // 动态导入工具组件
  const ToolComponent =
    toolInfo && hasTool(toolSlug)
      ? lazyRouteComponent(async () => {
          const loader = getToolLoaderBySlug(toolSlug)
          if (!loader) throw new Error(`Tool loader not found for ${toolSlug}`)
          const m = await loader()
          // 处理不同的导出格式
          if (m && typeof m === "object" && "default" in m) {
            return { default: m.default as React.ComponentType<{ onReady?: () => void }> }
          }
          return { default: m as React.ComponentType<{ onReady?: () => void }> }
        })
      : null

  if (!toolInfo) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  if (!ToolComponent) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  // 动态注入页面元信息
  useEffect(() => {
    if (!toolInfo) return

    const title = `${toolInfo.name} | Kit`
    const desc = `Use ${toolInfo.name} online in Kit.`

    document.title = title

    const ensureMeta = (name: string, content: string, attr: "name" | "property" = "name") => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement("meta")
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute("content", content)
    }

    ensureMeta("description", desc, "name")
    ensureMeta("og:title", title, "property")
    ensureMeta("og:description", desc, "property")
    ensureMeta("og:type", "website", "property")
    ensureMeta("og:url", window.location.href, "property")

    return () => {
      // 可保留 title，不强制回滚
    }
  }, [toolInfo])

  return (
    <div className="grid md:grid-cols-[220px_minmax(240px,280px)_minmax(0,1fr)]">
      {/* 左侧：工具大类列表 */}
      <aside
        className="border-r border-border/60 px-3 py-4 text-sm"
        aria-label={t("tools.categories", "工具大类")}
      >
        <div className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("tools.categories", "工具大类")}
        </div>
        <div className="flex flex-col gap-1">
          {categories.map((category) => {
            const isActiveCategory = category.id === selectedCategoryId
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={`flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs font-medium transition-colors ${
                  isActiveCategory
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-pressed={isActiveCategory}
              >
                <span className="truncate">{t(`tools.${category.id}`, category.id)}</span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* 中间：当前大类下的工具列表 */}
      <aside
        className="border-r border-border/60 px-3 py-4 text-sm"
        aria-label={t("tools.list", "工具列表")}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("tools.list", "工具")}
          </div>
          <Input
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            placeholder={t("tools.search-in-category", "在当前大类中搜索…")}
            className="h-7 w-32 text-xs md:w-40"
            aria-label={t("tools.search-in-category", "搜索当前大类下的工具")}
          />
        </div>
        <div className="flex max-h-[calc(100vh-260px)] flex-col gap-1 overflow-auto">
          {toolsInSelectedCategory.map((tool) => {
            if (!isTool(tool)) return null
            const isActiveTool = tool.slug === toolSlug
            return (
              <button
                key={tool.slug}
                type="button"
                onClick={() => {
                  if (tool.slug === toolSlug) return
                  router.navigate({ to: "/tool/$tool", params: { tool: tool.slug } })
                }}
                className={`flex w-full flex-col rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  isActiveTool
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                aria-current={isActiveTool ? "page" : undefined}
              >
                <span className="truncate text-sm font-medium">{t(`tools.${tool.slug}`, tool.name)}</span>
              </button>
            )
          })}
        </div>
      </aside>

      {/* 右侧：工具详情区域 */}
      <section className="min-w-0 px-3 py-4">
        <Suspense fallback={<ToolLoading toolName={toolInfo.name} />}>
          {(() => {
            const Comp = ToolComponent as React.ComponentType<{ onReady?: () => void }>
            return (
              <Comp
                onReady={() => {
                  const startMark = `tool_${toolSlug}_start`
                  mark(startMark)
                  const ms = measure(`tool_${toolSlug}_interactive`, startMark)
                  if (ms != null) {
                    perfBus.emit("tool_interactive", { slug: toolSlug, ms, ts: Date.now() })
                  }
                  trackToolUsage(toolSlug)
                }}
              />
            )
          })()}
        </Suspense>

        <div className="mt-6">
          <AdSenseAd />
        </div>
      </section>
    </div>
  )
}
