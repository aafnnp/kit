import { useCallback, useEffect, useMemo, useState } from "react"
import { useFavorites, useRecentTools, useToolSearch } from "@/hooks/use-favorites"
import { usePreload, useSmartPreload } from "@/lib/data"
import { useRoutePrefetch } from "@/lib/routing"
import type { Tool, ToolCategory } from "@/schemas/tool.schema"

interface UseToolDashboardStateOptions {
  tools: ToolCategory[]
}

export function useToolDashboardState({ tools }: UseToolDashboardStateOptions) {
  const { favorites } = useFavorites()
  const { recentTools, clearRecent } = useRecentTools()
  const { searchQuery, setSearchQuery, filteredTools } = useToolSearch(tools)
  const [activeTab, setActiveTab] = useState("all")

  const { preloadTool, preloadCommonTools } = usePreload()
  const { trackToolUsage } = useSmartPreload()
  const { prefetchFavorites, prefetchRecent } = useRoutePrefetch()

  const allTools = useMemo(() => tools.flatMap((category) => category.tools), [tools])

  useEffect(() => {
    const favoriteSlugs = Array.isArray(favorites)
      ? favorites.map((tool) => (typeof tool === "string" ? tool : tool?.slug ?? ""))
      : []
    const recentSlugs = Array.isArray(recentTools)
      ? recentTools.map((tool) => (typeof tool === "string" ? tool : tool?.slug ?? ""))
      : []

    prefetchFavorites(favoriteSlugs.filter(Boolean))
    prefetchRecent(recentSlugs.filter(Boolean))
  }, [favorites, recentTools, prefetchFavorites, prefetchRecent])

  useEffect(() => {
    preloadCommonTools()
  }, [preloadCommonTools])

  const handleToolClick = useCallback(
    (tool: Tool) => {
      trackToolUsage(tool.slug)
      preloadTool(tool.slug)
    },
    [preloadTool, trackToolUsage]
  )

  const favoriteTools = useMemo(() => {
    const slugs = Array.isArray(favorites)
      ? favorites.map((tool) => (typeof tool === "string" ? tool : tool?.slug ?? "")).filter(Boolean)
      : []
    return allTools.filter((tool) => slugs.includes(tool.slug))
  }, [allTools, favorites])

  const recentToolsData = useMemo(() => {
    const slugs = Array.isArray(recentTools)
      ? recentTools.map((tool) => (typeof tool === "string" ? tool : tool?.slug ?? "")).filter(Boolean)
      : []
    return allTools.filter((tool) => slugs.includes(tool.slug))
  }, [allTools, recentTools])

  return {
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
  }
}

