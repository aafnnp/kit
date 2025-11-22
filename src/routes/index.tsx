import { createFileRoute } from "@tanstack/react-router"
import tools from "@/lib/data"
import { useTranslation } from "react-i18next"
import { motion } from "motion/react"
import { Button } from "@/components/ui/button"
import { useState, useMemo, useEffect, useCallback } from "react"
import { SearchBar, ToolCard, CategoryManager, VirtualToolGrid } from "@/components/features"
import { AdSenseAd } from "@/components/ads"
import { useFavorites, useRecentTools, useToolSearch } from "@/hooks/use-favorites"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Clock, Grid3X3, Trash2, Settings } from "lucide-react"
import { usePreload, useSmartPreload } from "@/lib/data"
import { useResourcePreload } from "@/hooks/use-resource-optimizer"
import { resourceOptimizer } from "@/lib/performance"
import { useRoutePrefetch } from "@/lib/routing"
import { isDesktopApp } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import type { Tool, ToolCategory } from "@/schemas/tool.schema"

export const Route = createFileRoute("/")({
  component: () => {
    const { t } = useTranslation()
    const [activeTab, setActiveTab] = useState("all")

    const { favorites } = useFavorites()
    const { recentTools, clearRecent } = useRecentTools()
    const { searchQuery, setSearchQuery, filteredTools } = useToolSearch(tools)

    // 扁平化所有工具
    const allTools = useMemo(() => tools.flatMap((category) => category.tools), [])

    // 性能优化 hooks
    const { preloadTool, preloadCommonTools } = usePreload()
    const { trackToolUsage } = useSmartPreload()
    const { prefetchFavorites, prefetchRecent } = useRoutePrefetch()

    // 预取收藏和最近使用的工具路由
    useEffect(() => {
      const favoriteSlugs = Array.isArray(favorites)
        ? favorites.map((tool): string => {
            if (typeof tool === "string") return tool
            if (typeof tool === "object" && tool !== null && "slug" in tool && typeof tool.slug === "string") {
              return tool.slug
            }
            return ""
          })
        : []
      const recentSlugs = Array.isArray(recentTools)
        ? recentTools.map((tool): string => {
            if (typeof tool === "string") return tool
            if (typeof tool === "object" && tool !== null && "slug" in tool && typeof tool.slug === "string") {
              return tool.slug
            }
            return ""
          })
        : []

      prefetchFavorites(favoriteSlugs.filter(Boolean))
      prefetchRecent(recentSlugs.filter(Boolean))
    }, [favorites, recentTools, prefetchFavorites, prefetchRecent])

    // 定义预加载资源
    const resources = [{ path: "/logo.png", type: "image" as const }]
    useResourcePreload(resources)

    // 性能优化初始化
    useEffect(() => {
      // 预加载常用工具
      preloadCommonTools()
      // 拉取并挂载公共 SVG 雪碧图（若存在）
      fetch("/sprite.svg", { method: "HEAD" })
        .then((res) => {
          if (res.ok) {
            resourceOptimizer.mountSpriteFromUrl("/sprite.svg").catch(() => {})
          }
        })
        .catch(() => {})
    }, [])

    // 工具交互事件处理
    const handleToolClick = (tool: Tool) => {
      trackToolUsage(tool.slug)
      preloadTool(tool.slug)
    }

    // 使用缓存优化工具过滤
    const favoriteTools = useMemo(() => {
      // 从favorites中提取slug数组
      const favoriteSlugs = Array.isArray(favorites)
        ? favorites.map((tool): string => {
            if (typeof tool === "string") return tool
            if (typeof tool === "object" && tool !== null && "slug" in tool && typeof tool.slug === "string") {
              return tool.slug
            }
            return ""
          })
        : []

      // 过滤出收藏的工具
      return allTools.filter((tool) => favoriteSlugs.filter(Boolean).includes(tool.slug))
    }, [allTools, favorites])

    const recentToolsData = useMemo(() => {
      // 从recentTools中提取slug数组
      const recentSlugs = Array.isArray(recentTools)
        ? recentTools.map((tool): string => {
            if (typeof tool === "string") return tool
            if (typeof tool === "object" && tool !== null && "slug" in tool && typeof tool.slug === "string") {
              return tool.slug
            }
            return ""
          })
        : []

      // 过滤出最近使用的工具
      return allTools.filter((tool) => recentSlugs.filter(Boolean).includes(tool.slug))
    }, [allTools, recentTools])

    // 移除旧的分类懒加载逻辑，现在由 SmartToolGrid 处理

    const renderToolGrid = useCallback(
      (toolsToRender: ToolCategory[] | Tool[], showFavoriteButton = true) => {
        if (toolsToRender.length === 0) {
          return (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">
                {activeTab === "favorites"
                  ? t("favorites.empty")
                  : activeTab === "recent"
                    ? t("recent.empty")
                    : t("search.no-results")}
              </div>
              <div className="text-sm text-muted-foreground">
                {activeTab === "favorites"
                  ? t("favorites.add-some")
                  : activeTab === "recent"
                    ? t("recent.start-using")
                    : ""}
              </div>
            </div>
          )
        }

        // 对于收藏和最近使用的工具，使用传统网格布局（数量较少）
        if (activeTab === "favorites" || activeTab === "recent") {
          // toolsToRender 在这种情况下是 Tool[]
          const tools = toolsToRender as Tool[]
          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 grid-mobile-1 sm:grid-mobile-2 md:grid-tablet-3 lg:grid-desktop-4 xl:grid-desktop-5 2xl:grid-ultrawide-6">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.slug + index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <ToolCard
                    tool={tool}
                    showFavoriteButton={showFavoriteButton}
                    onClick={() => handleToolClick(tool)}
                  />
                </motion.div>
              ))}
            </div>
          )
        }

        // 对于所有工具和搜索结果，使用虚拟工具网格（自动优化）
        // toolsToRender 在这种情况下是 ToolCategory[]
        const categories = toolsToRender as ToolCategory[]
        return (
          <VirtualToolGrid
            categories={categories}
            showFavoriteButton={showFavoriteButton}
            onToolClick={handleToolClick}
            t={t}
            threshold={50}
          />
        )
      },
      [activeTab, handleToolClick, t]
    )

    const isDesktopAppEnv = isDesktopApp()
    const isMobile = useIsMobile()
    const isDesktop = isDesktopAppEnv || !isMobile

    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {!isDesktop && <AdSenseAd />}
        {!isDesktop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-8"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight">
              {t("app.title")}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-6 px-2 sm:px-0">
              {t("app.description")}
            </p>
          </motion.div>
        )}

        {/* Sticky search and tabs section */}
        <div
          className={`sticky z-10 bg-background/95 backdrop-blur-md border-b border-border -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-4 mb-6 ${
            isDesktop ? "top-[89px]" : "top-[57px]"
          }`}
        >
          {!isDesktop && (
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* 搜索栏 */}
              <div className="w-full max-w-md mx-auto">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={t("search.placeholder")}
                />
              </div>
            </div>
          )}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full tabs-mobile"
          >
            <TabsList
              className="grid w-full grid-cols-5 h-auto p-1"
              role="tablist"
            >
              <TabsTrigger
                value="all"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-2 sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                role="tab"
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{t("allTools")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-2 sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                role="tab"
              >
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {recentTools.length > 0 && (
                    <span className="rounded-full bg-primary/20 text-primary px-1 py-0.5 text-xs font-medium min-w-[16px] h-4 flex items-center justify-center">
                      {recentTools.length}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm">{t("app.recent")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="favorites"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-2 sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                role="tab"
              >
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  {favorites.length > 0 && (
                    <span className="rounded-full bg-primary/20 text-primary px-1 py-0.5 text-xs font-medium min-w-[16px] h-4 flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm">{t("favorites.title")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="search"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-2 sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                disabled={!searchQuery}
                role="tab"
              >
                <span className="text-xs sm:text-sm">{t("app.searchResults")}</span>
                {searchQuery && (
                  <span className="rounded-full bg-primary/20 text-primary px-1 py-0.5 text-xs font-medium min-w-[16px] h-4 flex items-center justify-center">
                    {filteredTools.reduce((acc, cat) => acc + cat.tools.length, 0)}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="categories"
                className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-1.5 px-2 sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                role="tab"
              >
                <Settings className="h-4 w-4" />
                <span className="text-xs sm:text-sm">{t("categories")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="all"
              role="tabpanel"
            >
              {renderToolGrid(tools)}
            </TabsContent>

            <TabsContent
              value="recent"
              id="tabpanel-recent"
              role="tabpanel"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t("recent.title")}</h2>
                {recentTools.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearRecent}
                    className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("recent.clear")}
                  </Button>
                )}
              </div>
              {renderToolGrid(recentToolsData, false)}
            </TabsContent>

            <TabsContent
              value="favorites"
              id="tabpanel-favorites"
              role="tabpanel"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{t("favorites.title")}</h2>
              </div>
              {renderToolGrid(favoriteTools, false)}
            </TabsContent>

            <TabsContent
              value="search"
              id="tabpanel-search"
              role="tabpanel"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {t("routes.index.search-results-title")}: "{searchQuery}"
                </h2>
              </div>
              {renderToolGrid(filteredTools)}
            </TabsContent>

            <TabsContent
              value="categories"
              id="tabpanel-categories"
              role="tabpanel"
            >
              <CategoryManager allTools={allTools} />
            </TabsContent>
          </Tabs>
        </div>

        {!isDesktop && <AdSenseAd />}
      </div>
    )
  },
})
