import { useState, useEffect } from 'react'
import { Tool } from '@/types/tool'

interface CustomCategory {
  id: string
  name: { zh: string; en: string }
  tools: string[] // tool slugs
  order: number
  color?: string
}

interface SortOption {
  key: 'name' | 'recent' | 'favorite' | 'custom'
  direction: 'asc' | 'desc'
}

const CUSTOM_CATEGORIES_KEY = 'kit-custom-categories'
const SORT_PREFERENCE_KEY = 'kit-sort-preference'
const CATEGORY_ORDER_KEY = 'kit-category-order'

// 默认排序选项
const DEFAULT_SORT: SortOption = { key: 'custom', direction: 'asc' }

// 用户自定义分类管理
export function useCustomCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([])
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT)
  const [categoryOrder, setCategoryOrder] = useState<string[]>([])

  // 加载保存的数据
  useEffect(() => {
    const storedCategories = localStorage.getItem(CUSTOM_CATEGORIES_KEY)
    const storedSort = localStorage.getItem(SORT_PREFERENCE_KEY)
    const storedOrder = localStorage.getItem(CATEGORY_ORDER_KEY)

    if (storedCategories) {
      try {
        setCustomCategories(JSON.parse(storedCategories))
      } catch (error) {
        console.error('Failed to parse custom categories:', error)
      }
    }

    if (storedSort) {
      try {
        setSortOption(JSON.parse(storedSort))
      } catch (error) {
        console.error('Failed to parse sort preference:', error)
      }
    }

    if (storedOrder) {
      try {
        setCategoryOrder(JSON.parse(storedOrder))
      } catch (error) {
        console.error('Failed to parse category order:', error)
      }
    }
  }, [])

  // 保存自定义分类
  const saveCustomCategories = (categories: CustomCategory[]) => {
    setCustomCategories(categories)
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories))
  }

  // 保存排序偏好
  const saveSortOption = (option: SortOption) => {
    setSortOption(option)
    localStorage.setItem(SORT_PREFERENCE_KEY, JSON.stringify(option))
  }

  // 保存分类顺序
  const saveCategoryOrder = (order: string[]) => {
    setCategoryOrder(order)
    localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(order))
  }

  // 创建新分类
  const createCategory = (name: { zh: string; en: string }, color?: string) => {
    const newCategory: CustomCategory = {
      id: `custom-${Date.now()}`,
      name,
      tools: [],
      order: customCategories.length,
      color
    }
    const updatedCategories = [...customCategories, newCategory]
    saveCustomCategories(updatedCategories)
    return newCategory.id
  }

  // 删除分类
  const deleteCategory = (categoryId: string) => {
    const updatedCategories = customCategories.filter(cat => cat.id !== categoryId)
    saveCustomCategories(updatedCategories)
    
    // 同时更新分类顺序
    const updatedOrder = categoryOrder.filter(id => id !== categoryId)
    saveCategoryOrder(updatedOrder)
  }

  // 更新分类
  const updateCategory = (categoryId: string, updates: Partial<CustomCategory>) => {
    const updatedCategories = customCategories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    )
    saveCustomCategories(updatedCategories)
  }

  // 添加工具到分类
  const addToolToCategory = (categoryId: string, toolSlug: string) => {
    const updatedCategories = customCategories.map(cat => {
      if (cat.id === categoryId && !cat.tools.includes(toolSlug)) {
        return { ...cat, tools: [...cat.tools, toolSlug] }
      }
      return cat
    })
    saveCustomCategories(updatedCategories)
  }

  // 从分类中移除工具
  const removeToolFromCategory = (categoryId: string, toolSlug: string) => {
    const updatedCategories = customCategories.map(cat => {
      if (cat.id === categoryId) {
        return { ...cat, tools: cat.tools.filter(slug => slug !== toolSlug) }
      }
      return cat
    })
    saveCustomCategories(updatedCategories)
  }

  // 重新排序分类
  const reorderCategories = (newOrder: string[]) => {
    saveCategoryOrder(newOrder)
  }

  // 根据排序选项对工具进行排序
  const sortTools = (tools: any[], recentTools: string[], favorites: string[]) => {
    const sortedTools = [...tools]
    
    switch (sortOption.key) {
      case 'name':
        sortedTools.sort((a, b) => {
          const nameA = a.name.toLowerCase()
          const nameB = b.name.toLowerCase()
          return sortOption.direction === 'asc' 
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA)
        })
        break
        
      case 'recent':
        sortedTools.sort((a, b) => {
          const aIndex = recentTools.indexOf(a.slug)
          const bIndex = recentTools.indexOf(b.slug)
          const aRecent = aIndex >= 0 ? aIndex : Infinity
          const bRecent = bIndex >= 0 ? bIndex : Infinity
          
          return sortOption.direction === 'asc'
            ? aRecent - bRecent
            : bRecent - aRecent
        })
        break
        
      case 'favorite':
        sortedTools.sort((a, b) => {
          const aFav = favorites.includes(a.slug) ? 1 : 0
          const bFav = favorites.includes(b.slug) ? 1 : 0
          
          return sortOption.direction === 'asc'
            ? bFav - aFav
            : aFav - bFav
        })
        break
        
      case 'custom':
      default:
        // 保持原有顺序
        break
    }
    
    return sortedTools
  }

  // 根据分类顺序重新排列分类
  const getOrderedCategories = (originalCategories: any[]) => {
    if (categoryOrder.length === 0) {
      return originalCategories
    }
    
    const orderedCategories = []
    const categoryMap = new Map(originalCategories.map(cat => [cat.id, cat]))
    
    // 按照保存的顺序添加分类
    for (const categoryId of categoryOrder) {
      const category = categoryMap.get(categoryId)
      if (category) {
        orderedCategories.push(category)
        categoryMap.delete(categoryId)
      }
    }
    
    // 添加剩余的分类（新增的或未在顺序中的）
    orderedCategories.push(...Array.from(categoryMap.values()))
    
    return orderedCategories
  }

  return {
    customCategories,
    sortOption,
    categoryOrder,
    createCategory,
    deleteCategory,
    updateCategory,
    addToolToCategory,
    removeToolFromCategory,
    reorderCategories,
    setSortOption: saveSortOption,
    sortTools,
    getOrderedCategories
  }
}

// 排序选项配置
export const SORT_OPTIONS: { key: SortOption['key']; label: { zh: string; en: string } }[] = [
  { key: 'custom', label: { zh: '自定义顺序', en: 'Custom Order' } },
  { key: 'name', label: { zh: '按名称', en: 'By Name' } },
  { key: 'recent', label: { zh: '按使用频率', en: 'By Usage' } },
  { key: 'favorite', label: { zh: '按收藏', en: 'By Favorites' } }
]