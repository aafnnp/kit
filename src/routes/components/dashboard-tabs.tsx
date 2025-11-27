import { useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchBar, CategoryManager, ToolCard, VirtualToolGrid } from "@/components/features"
import { Button } from "@/components/ui/button"
import { motion } from "motion/react"
import { Heart, Clock, Grid3X3, Trash2, Settings } from "lucide-react"
import type { TFunction } from "i18next"
import type { Tool, ToolCategory } from "@/schemas/tool.schema"

interface DashboardTabsProps {
  isDesktop: boolean
  activeTab: string
  onTabChange: (value: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
  allTools: Tool[]
  tools: ToolCategory[]
  filteredTools: ToolCategory[]
  favoriteTools: Tool[]
  recentToolsData: Tool[]
  favoritesCount: number
  recentCount: number
  clearRecent: () => void
  handleToolClick: (tool: Tool) => void
  t: TFunction
}

export function DashboardTabs({
  isDesktop,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  allTools,
  tools,
  filteredTools,
  favoriteTools,
  recentToolsData,
  favoritesCount,
  recentCount,
  clearRecent,
  handleToolClick,
  t,
}: DashboardTabsProps) {
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

      if (activeTab === "favorites" || activeTab === "recent") {
        const list = toolsToRender as Tool[]
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 grid-mobile-1 sm:grid-mobile-2 md:grid-tablet-3 lg:grid-desktop-4 xl:grid-desktop-5 2xl:grid-ultrawide-6">
            {list.map((tool, index) => (
              <motion.div
                key={tool.slug + index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ToolCard tool={tool} showFavoriteButton={showFavoriteButton} onClick={() => handleToolClick(tool)} />
              </motion.div>
            ))}
          </div>
        )
      }

      return (
        <VirtualToolGrid
          categories={toolsToRender as ToolCategory[]}
          showFavoriteButton={showFavoriteButton}
          onToolClick={handleToolClick}
          t={t}
          threshold={50}
        />
      )
    },
    [activeTab, handleToolClick, t]
  )

  const searchResultCount = filteredTools.reduce((acc, cat) => acc + cat.tools.length, 0)

  return (
    <div
      className={`sticky z-10 bg-background/95 backdrop-blur-md border-b border-border -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-4 mb-6 ${
        isDesktop ? "top-[89px]" : "top-[57px]"
      }`}
    >
      {!isDesktop && (
        <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="w-full max-w-md mx-auto">
            <SearchBar value={searchQuery} onChange={onSearchChange} placeholder={t("search.placeholder")} />
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full tabs-mobile">
        <TabsList className="grid w-full grid-cols-5 h-auto p-1" role="tablist">
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
              {recentCount > 0 && (
                <span className="rounded-full bg-primary/20 text-primary px-1 py-0.5 text-xs font-medium min-w-[16px] h-4 flex items-center justify-center">
                  {recentCount}
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
              {favoritesCount > 0 && (
                <span className="rounded-full bg-primary/20 text-primary px-1 py-0.5 text-xs font-medium min-w-[16px] h-4 flex items-center justify-center">
                  {favoritesCount}
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
                {searchResultCount}
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

        <TabsContent value="all" role="tabpanel">
          {renderToolGrid(tools)}
        </TabsContent>

        <TabsContent value="recent" role="tabpanel">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">{t("recent.title")}</h2>
            {recentCount > 0 && (
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

        <TabsContent value="favorites" role="tabpanel">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">{t("favorites.title")}</h2>
          </div>
          {renderToolGrid(favoriteTools, false)}
        </TabsContent>

        <TabsContent value="search" role="tabpanel">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              {t("routes.index.search-results-title")}: "{searchQuery}"
            </h2>
          </div>
          {renderToolGrid(filteredTools)}
        </TabsContent>

        <TabsContent value="categories" role="tabpanel">
          <CategoryManager allTools={allTools} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

