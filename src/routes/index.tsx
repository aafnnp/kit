import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import tools from "@/lib/data"
import { useTranslation } from "react-i18next"
import { AdSenseAd } from "@/components/ads"
import { useResourcePreload } from "@/hooks/use-resource-optimizer"
import { resourceOptimizer } from "@/lib/performance"
import { isDesktopApp } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { DashboardHero, DashboardTabs } from "./components"
import { useToolDashboardState } from "./hooks/useToolDashboardState"

export const Route = createFileRoute("/")({
  component: () => {
    const { t } = useTranslation()
    const {
      activeTab,
      setActiveTab,
      searchQuery,
      setSearchQuery,
      allTools,
      filteredTools,
      favoriteTools,
      recentToolsData,
      favorites,
      recentTools,
      clearRecent,
      handleToolClick,
    } = useToolDashboardState({ tools })

    // 定义预加载资源
    const resources = [{ path: "/logo.png", type: "image" as const }]
    useResourcePreload(resources)

    // 性能优化初始化
    useEffect(() => {
      fetch("/sprite.svg", { method: "HEAD" })
        .then((res) => {
          if (res.ok) {
            resourceOptimizer.mountSpriteFromUrl("/sprite.svg").catch(() => {})
          }
        })
        .catch(() => {})
    }, [])

    const isDesktopAppEnv = isDesktopApp()
    const isMobile = useIsMobile()
    const isDesktop = isDesktopAppEnv || !isMobile

    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {!isDesktop && <AdSenseAd />}
        {!isDesktop && <DashboardHero title={t("app.title")} description={t("app.description")} />}

        <DashboardTabs
          isDesktop={isDesktop}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allTools={allTools}
          tools={tools}
          filteredTools={filteredTools}
          favoriteTools={favoriteTools}
          recentToolsData={recentToolsData}
          favoritesCount={favorites.length}
          recentCount={recentTools.length}
          clearRecent={clearRecent}
          handleToolClick={handleToolClick}
          t={t}
        />

        {!isDesktop && <AdSenseAd />}
      </div>
    )
  },
})
