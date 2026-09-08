import { createFileRoute, lazyRouteComponent, useRouter } from "@tanstack/react-router"
import { Suspense, useEffect, useMemo, useState } from "react"
import { perfBus, mark, measure } from "@/lib/performance"
import tools, { findToolLocation, getToolLoaderBySlug, hasTool, useSmartPreload } from "@/lib/data"
import { ToolNotFound } from "@/components/common"
import { ToolLoading } from "@/components/ui/loading"
import { AdSenseAd } from "@/components/ads"
import { useRoutePrefetch } from "@/lib/routing"
import { QueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { CATEGORY_EMOJIS } from "@/lib/data"
import { ChevronRight, Search, Wrench } from "lucide-react"

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

  const categories = tools
  const toolLocation = findToolLocation(categories, toolSlug)
  const toolInfo = toolLocation?.tool
  const activeCategory = toolLocation?.category

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() => {
    if (activeCategory) return activeCategory.id
    if (categories[0]) return categories[0].id
    return ""
  })

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? activeCategory
  const [toolSearch, setToolSearch] = useState("")

  const toolsInSelectedCategory = useMemo(() => {
    const baseTools = selectedCategory?.tools ?? []
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
    <div className="min-h-[calc(100vh-var(--header-height))] bg-background/20">
      <div className="mx-auto grid w-full max-w-[1600px] gap-0 md:grid-cols-[220px_minmax(240px,280px)_minmax(0,1fr)]">
        <aside
          className="border-b border-border/70 px-4 py-4 md:sticky md:top-[var(--header-height)] md:h-[calc(100vh-var(--header-height))] md:overflow-y-auto md:border-b-0 md:border-r md:px-4 md:py-6"
          aria-label={t("tools.categories", "工具大类")}
        >
          <div className="mb-4 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <Wrench className="size-3.5 text-primary" />
            {t("tools.categories", "工具大类")}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {categories.map((category) => {
              const isActiveCategory = category.id === selectedCategoryId
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(category.id)}
                  className={`flex min-w-max items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors md:w-full ${
                    isActiveCategory
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-pressed={isActiveCategory}
                >
                  <span aria-hidden="true">{CATEGORY_EMOJIS[category.id] ?? "🗂️"}</span>
                  <span className="truncate">{t(`tools.${category.id}`, category.id)}</span>
                  <span className={`ml-auto text-[10px] ${isActiveCategory ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
                    {category.tools.length}
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        <aside
          className="border-b border-border/70 px-4 py-5 md:sticky md:top-[var(--header-height)] md:h-[calc(100vh-var(--header-height))] md:overflow-y-auto md:border-b-0 md:border-r md:px-5 md:py-6"
          aria-label={t("tools.list", "工具列表")}
        >
          <div className="mb-4">
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("tools.list", "工具")}
            </div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="truncate text-base font-semibold">
                {t(`tools.${selectedCategory?.id ?? ""}`, selectedCategory?.id ?? "")}
              </h2>
              <span className="text-xs text-muted-foreground">{toolsInSelectedCategory.length}</span>
            </div>
          </div>
          <label className="relative mb-4 block">
            <span className="sr-only">{t("tools.search-in-category", "在当前大类中搜索")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder={t("tools.search-in-category", "在当前大类中搜索…")}
              className="h-9 rounded-lg bg-background/70 pl-9 text-xs"
              aria-label={t("tools.search-in-category", "搜索当前大类下的工具")}
            />
          </label>
          <div className="flex max-h-[calc(100vh-250px)] flex-col gap-1 overflow-auto">
            {toolsInSelectedCategory.map((tool) => {
              const isActiveTool = tool.slug === toolSlug
              return (
                <button
                  key={tool.slug}
                  type="button"
                  onClick={() => {
                    if (tool.slug === toolSlug) return
                    router.navigate({ to: "/tool/$tool", params: { tool: tool.slug } })
                  }}
                  className={`group flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs transition-colors ${
                    isActiveTool
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={isActiveTool ? "page" : undefined}
                >
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{t(`tools.${tool.slug}`, tool.name)}</span>
                  <ChevronRight className={`size-3 shrink-0 transition-transform ${isActiveTool ? "translate-x-0.5" : "opacity-0 group-hover:opacity-60"}`} />
                </button>
              )
            })}
          </div>
        </aside>

        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-start justify-between gap-4 border-b border-border/70 pb-5">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{t(`tools.${activeCategory?.id ?? ""}`, activeCategory?.id ?? "")}</span>
                  <ChevronRight className="size-3" />
                  <span className="truncate text-foreground/80">{t(`tools.${toolInfo.slug}`, toolInfo.name)}</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t(`tools.${toolInfo.slug}`, toolInfo.name)}</h1>
              </div>
              <div className="hidden rounded-full border border-border/70 bg-background/60 px-3 py-1 text-[11px] text-muted-foreground sm:block">
                {t("tools.local-processing", "Local processing")}
              </div>
            </div>
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
            <div className="mt-8">
              <AdSenseAd />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
