import { useState, useEffect, useCallback } from 'react'
import { Tool } from '@/types/tool'

// 数据持久化相关的类型定义
interface ToolHistory {
  id: string
  toolSlug: string
  toolName: string
  timestamp: number
  inputData?: any
  outputData?: any
  duration?: number
  success: boolean
}

interface ToolConfig {
  toolSlug: string
  settings: Record<string, any>
  lastModified: number
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en'
  autoSave: boolean
  historyLimit: number
  showTips: boolean
  compactMode: boolean
  notifications: boolean
  lastModified: number
}

interface AppData {
  version: string
  exportDate: number
  history: ToolHistory[]
  configs: ToolConfig[]
  preferences: UserPreferences
  favorites: Tool[]
  customCategories: any[]
  recentTools: any[]
}

// 存储键名常量
const STORAGE_KEYS = {
  TOOL_HISTORY: 'kit-tool-history',
  TOOL_CONFIGS: 'kit-tool-configs',
  USER_PREFERENCES: 'kit-user-preferences',
  DATA_VERSION: 'kit-data-version'
} as const

// 当前数据版本
const CURRENT_DATA_VERSION = '1.0.0'

// 默认用户偏好设置
const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  language: 'zh',
  autoSave: true,
  historyLimit: 100,
  showTips: true,
  compactMode: false,
  notifications: true,
  lastModified: Date.now()
}

// 工具历史记录管理
export function useToolHistory() {
  const [history, setHistory] = useState<ToolHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载历史记录
  useEffect(() => {
    const loadHistory = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.TOOL_HISTORY)
        if (stored) {
          const parsedHistory = JSON.parse(stored)
          setHistory(parsedHistory)
        }
      } catch (error) {
        console.error('Failed to load tool history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHistory()
  }, [])

  // 保存历史记录
  const saveHistory = useCallback((newHistory: ToolHistory[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOOL_HISTORY, JSON.stringify(newHistory))
      setHistory(newHistory)
    } catch (error) {
      console.error('Failed to save tool history:', error)
    }
  }, [])

  // 添加历史记录
  const addHistoryEntry = useCallback((entry: Omit<ToolHistory, 'id' | 'timestamp'>) => {
    const newEntry: ToolHistory = {
      ...entry,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    const newHistory = [newEntry, ...history].slice(0, 100) // 限制最多100条记录
    saveHistory(newHistory)
  }, [history, saveHistory])

  // 删除历史记录
  const removeHistoryEntry = useCallback((id: string) => {
    const newHistory = history.filter(entry => entry.id !== id)
    saveHistory(newHistory)
  }, [history, saveHistory])

  // 清空历史记录
  const clearHistory = useCallback(() => {
    saveHistory([])
  }, [saveHistory])

  // 按工具获取历史记录
  const getHistoryByTool = useCallback((toolSlug: string) => {
    return history.filter(entry => entry.toolSlug === toolSlug)
  }, [history])

  // 获取最近使用的工具
  const getRecentTools = useCallback((limit: number = 10) => {
    const toolMap = new Map<string, ToolHistory>()
    
    // 获取每个工具的最新记录
    history.forEach(entry => {
      if (!toolMap.has(entry.toolSlug) || 
          toolMap.get(entry.toolSlug)!.timestamp < entry.timestamp) {
        toolMap.set(entry.toolSlug, entry)
      }
    })

    return Array.from(toolMap.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }, [history])

  return {
    history,
    isLoading,
    addHistoryEntry,
    removeHistoryEntry,
    clearHistory,
    getHistoryByTool,
    getRecentTools
  }
}

// 工具配置管理
export function useToolConfigs() {
  const [configs, setConfigs] = useState<ToolConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载配置
  useEffect(() => {
    const loadConfigs = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.TOOL_CONFIGS)
        if (stored) {
          const parsedConfigs = JSON.parse(stored)
          setConfigs(parsedConfigs)
        }
      } catch (error) {
        console.error('Failed to load tool configs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConfigs()
  }, [])

  // 保存配置
  const saveConfigs = useCallback((newConfigs: ToolConfig[]) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOOL_CONFIGS, JSON.stringify(newConfigs))
      setConfigs(newConfigs)
    } catch (error) {
      console.error('Failed to save tool configs:', error)
    }
  }, [])

  // 获取工具配置
  const getToolConfig = useCallback((toolSlug: string) => {
    return configs.find(config => config.toolSlug === toolSlug)
  }, [configs])

  // 更新工具配置
  const updateToolConfig = useCallback((toolSlug: string, settings: Record<string, any>) => {
    const existingIndex = configs.findIndex(config => config.toolSlug === toolSlug)
    const newConfig: ToolConfig = {
      toolSlug,
      settings,
      lastModified: Date.now()
    }

    let newConfigs: ToolConfig[]
    if (existingIndex >= 0) {
      newConfigs = [...configs]
      newConfigs[existingIndex] = newConfig
    } else {
      newConfigs = [...configs, newConfig]
    }

    saveConfigs(newConfigs)
  }, [configs, saveConfigs])

  // 删除工具配置
  const removeToolConfig = useCallback((toolSlug: string) => {
    const newConfigs = configs.filter(config => config.toolSlug !== toolSlug)
    saveConfigs(newConfigs)
  }, [configs, saveConfigs])

  return {
    configs,
    isLoading,
    getToolConfig,
    updateToolConfig,
    removeToolConfig
  }
}

// 用户偏好设置管理
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)

  // 加载偏好设置
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
        if (stored) {
          const parsedPreferences = JSON.parse(stored)
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences })
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPreferences()
  }, [])

  // 保存偏好设置
  const savePreferences = useCallback((newPreferences: UserPreferences) => {
    try {
      const updatedPreferences = {
        ...newPreferences,
        lastModified: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updatedPreferences))
      setPreferences(updatedPreferences)
    } catch (error) {
      console.error('Failed to save user preferences:', error)
    }
  }, [])

  // 更新单个偏好设置
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    const newPreferences = {
      ...preferences,
      [key]: value
    }
    savePreferences(newPreferences)
  }, [preferences, savePreferences])

  // 重置偏好设置
  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES)
  }, [savePreferences])

  return {
    preferences,
    isLoading,
    updatePreference,
    savePreferences,
    resetPreferences
  }
}

// 数据导出/导入功能
export function useDataExportImport() {
  // 导出所有数据
  const exportData = useCallback(async (): Promise<string> => {
    try {
      const appData: AppData = {
        version: CURRENT_DATA_VERSION,
        exportDate: Date.now(),
        history: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOL_HISTORY) || '[]'),
        configs: JSON.parse(localStorage.getItem(STORAGE_KEYS.TOOL_CONFIGS) || '[]'),
        preferences: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES) || JSON.stringify(DEFAULT_PREFERENCES)),
        favorites: JSON.parse(localStorage.getItem('kit-favorites') || '[]'),
        customCategories: JSON.parse(localStorage.getItem('kit-custom-categories') || '[]'),
        recentTools: JSON.parse(localStorage.getItem('kit-recent') || '[]')
      }

      return JSON.stringify(appData, null, 2)
    } catch (error) {
      console.error('Failed to export data:', error)
      throw new Error('导出数据失败')
    }
  }, [])

  // 导入数据
  const importData = useCallback(async (jsonData: string): Promise<void> => {
    try {
      const appData: AppData = JSON.parse(jsonData)

      // 验证数据格式
      if (!appData.version || !appData.exportDate) {
        throw new Error('无效的数据格式')
      }

      // 备份当前数据
      const backup = await exportData()
      localStorage.setItem('kit-data-backup', backup)

      // 导入数据
      if (appData.history) {
        localStorage.setItem(STORAGE_KEYS.TOOL_HISTORY, JSON.stringify(appData.history))
      }
      if (appData.configs) {
        localStorage.setItem(STORAGE_KEYS.TOOL_CONFIGS, JSON.stringify(appData.configs))
      }
      if (appData.preferences) {
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(appData.preferences))
      }
      if (appData.favorites) {
        localStorage.setItem('kit-favorites', JSON.stringify(appData.favorites))
      }
      if (appData.customCategories) {
        localStorage.setItem('kit-custom-categories', JSON.stringify(appData.customCategories))
      }
      if (appData.recentTools) {
        localStorage.setItem('kit-recent', JSON.stringify(appData.recentTools))
      }

      // 更新数据版本
      localStorage.setItem(STORAGE_KEYS.DATA_VERSION, appData.version)

      // 刷新页面以应用新数据
      window.location.reload()
    } catch (error) {
      console.error('Failed to import data:', error)
      throw new Error('导入数据失败：' + (error as Error).message)
    }
  }, [exportData])

  // 下载数据文件
  const downloadData = useCallback(async () => {
    try {
      const data = await exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `kit-data-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download data:', error)
      throw error
    }
  }, [exportData])

  // 清空所有数据
  const clearAllData = useCallback(() => {
    const keys = [
      STORAGE_KEYS.TOOL_HISTORY,
      STORAGE_KEYS.TOOL_CONFIGS,
      STORAGE_KEYS.USER_PREFERENCES,
      'kit-favorites',
      'kit-custom-categories',
      'kit-recent',
      'kit-sort-preference',
      'kit-category-order'
    ]

    keys.forEach(key => localStorage.removeItem(key))
    
    // 刷新页面
    window.location.reload()
  }, [])

  return {
    exportData,
    importData,
    downloadData,
    clearAllData
  }
}

// 数据迁移和版本管理
export function useDataMigration() {
  const migrateData = useCallback(() => {
    const currentVersion = localStorage.getItem(STORAGE_KEYS.DATA_VERSION)
    
    if (!currentVersion || currentVersion !== CURRENT_DATA_VERSION) {
      // 执行数据迁移逻辑
      console.log('Migrating data from version', currentVersion, 'to', CURRENT_DATA_VERSION)
      
      // 这里可以添加具体的迁移逻辑
      // 例如：格式转换、字段重命名等
      
      localStorage.setItem(STORAGE_KEYS.DATA_VERSION, CURRENT_DATA_VERSION)
    }
  }, [])

  useEffect(() => {
    migrateData()
  }, [])

  return { migrateData }
}

// 统一的数据持久化 Hook
export function usePersistence() {
  const history = useToolHistory()
  const configs = useToolConfigs()
  const preferences = useUserPreferences()
  const exportImport = useDataExportImport()
  const migration = useDataMigration()

  return {
    history,
    configs,
    preferences,
    exportImport,
    migration
  }
}

export type {
  ToolHistory,
  ToolConfig,
  UserPreferences,
  AppData
}