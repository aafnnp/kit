import { useState, useEffect } from 'react'
import { extensionStorage } from '../extension/storage'
import { isExtension } from './utils'

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
    const loadFavorites = async () => {
      try {
        if (isExtension()) {
          const favoritesList = await extensionStorage.favorites.getFavorites()
          // 将slug列表转换为Tool对象（这里需要从工具数据中查找）
          // 暂时使用简单格式，后续可能需要调整
          const toolObjects = favoritesList.map((slug) => ({ slug, name: slug, desc: '' }))
          setFavorites(toolObjects)
        } else {
          const stored = localStorage.getItem(FAVORITES_KEY)
          if (stored) {
            setFavorites(JSON.parse(stored))
          }
        }
      } catch (error) {
        console.error('Failed to load favorites:', error)
      }
    }

    loadFavorites()
  }, [])

  const addToFavorites = async (tool: Tool) => {
    const exists = favorites.some((t) => t.slug === tool.slug)
    const newFavorites = exists ? favorites : [...favorites, tool]
    setFavorites(newFavorites)

    try {
      if (isExtension()) {
        await extensionStorage.favorites.addFavorite(tool.slug)
      } else {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
      }
    } catch (error) {
      console.error('Failed to save favorite:', error)
    }
  }

  const removeFromFavorites = async (slug: string) => {
    const newFavorites = favorites.filter((tool) => tool.slug !== slug)
    setFavorites(newFavorites)

    try {
      if (isExtension()) {
        await extensionStorage.favorites.removeFavorite(slug)
      } else {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites))
      }
    } catch (error) {
      console.error('Failed to remove favorite:', error)
    }
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
    const loadRecentTools = async () => {
      try {
        if (isExtension()) {
          const recentList = await extensionStorage.recentTools.getRecentTools()
          // 将slug列表转换为RecentTool对象
          const toolObjects = recentList.map((slug) => ({
            slug,
            name: slug,
            desc: '',
            lastUsed: Date.now(),
          }))
          setRecentTools(toolObjects)
        } else {
          const stored = localStorage.getItem(RECENT_KEY)
          if (stored) {
            setRecentTools(JSON.parse(stored))
          }
        }
      } catch (error) {
        console.error('Failed to load recent tools:', error)
      }
    }

    loadRecentTools()
  }, [])

  const addToRecent = async (tool: Tool) => {
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

    try {
      if (isExtension()) {
        await extensionStorage.recentTools.addRecentTool(tool.slug)
      } else {
        localStorage.setItem(RECENT_KEY, JSON.stringify(newRecentTools))
      }
    } catch (error) {
      console.error('Failed to save recent tool:', error)
    }
  }

  const clearRecent = async () => {
    setRecentTools([])

    try {
      if (isExtension()) {
        await extensionStorage.recentTools.clearRecentTools()
      } else {
        localStorage.removeItem(RECENT_KEY)
      }
    } catch (error) {
      console.error('Failed to clear recent tools:', error)
    }
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
        tools: category.tools.filter((tool: Tool) => {
          return tool.name.toLowerCase().includes(query) || tool.slug.toLowerCase().includes(query)
        }),
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
