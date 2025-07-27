import { useState, useEffect } from 'react'

interface Tool {
  slug: string
  name: string
  desc: string
  icon?: string
  href?: string
}

interface RecentTool extends Tool {
  lastUsed: number
}

const FAVORITES_KEY = 'kit-favorites'
const RECENT_KEY = 'kit-recent'
const MAX_RECENT = 10

// 收藏功能
export function useFavorites() {
  const [favorites, setFavorites] = useState<Tool[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(FAVORITES_KEY)
    if (stored) {
      try {
        setFavorites(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse favorites:', error)
      }
    }
  }, [])

  const addToFavorites = (tool: Tool) => {
    const newFavorites = [...favorites, tool]
    setFavorites(newFavorites)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
  }

  const removeFromFavorites = (slug: string) => {
    const newFavorites = favorites.filter((tool) => tool.slug !== slug)
    setFavorites(newFavorites)
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
  }

  const isFavorite = (slug: string) => {
    return favorites.some((tool) => tool.slug === slug)
  }

  const toggleFavorite = (tool: Tool) => {
    if (isFavorite(tool.slug)) {
      removeFromFavorites(tool.slug)
    } else {
      addToFavorites(tool)
    }
  }

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    toggleFavorite,
  }
}

// 最近使用功能
export function useRecentTools() {
  const [recentTools, setRecentTools] = useState<RecentTool[]>([])

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_KEY)
    if (stored) {
      try {
        setRecentTools(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to parse recent tools:', error)
      }
    }
  }, [])

  const addToRecent = (tool: Tool) => {
    const now = Date.now()
    const existingIndex = recentTools.findIndex((t) => t.slug === tool.slug)

    let newRecentTools: RecentTool[]

    if (existingIndex >= 0) {
      // 如果已存在，更新时间并移到最前面
      newRecentTools = [...recentTools]
      newRecentTools[existingIndex].lastUsed = now
      newRecentTools.sort((a, b) => b.lastUsed - a.lastUsed)
    } else {
      // 如果不存在，添加到最前面
      const recentTool: RecentTool = { ...tool, lastUsed: now }
      newRecentTools = [recentTool, ...recentTools].slice(0, MAX_RECENT)
    }

    setRecentTools(newRecentTools)
    localStorage.setItem(RECENT_KEY, JSON.stringify(newRecentTools))
  }

  const clearRecent = () => {
    setRecentTools([])
    localStorage.removeItem(RECENT_KEY)
  }

  return {
    recentTools,
    addToRecent,
    clearRecent,
  }
}

// 搜索功能
export function useToolSearch(tools: any[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredTools, setFilteredTools] = useState(tools)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTools(tools)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = tools
      .map((category) => ({
        ...category,
        tools: category.tools.filter(
          (tool: Tool) =>
            tool.name.toLowerCase().includes(query) ||
            tool.desc.toLowerCase().includes(query) ||
            tool.slug.toLowerCase().includes(query)
        ),
      }))
      .filter((category) => category.tools.length > 0)

    setFilteredTools(filtered)
  }, [searchQuery, tools])

  return {
    searchQuery,
    setSearchQuery,
    filteredTools,
  }
}
