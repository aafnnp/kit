import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'

// 剪贴板项类型
export interface ClipboardItem {
  id: string
  content: string
  type: 'text' | 'json' | 'html' | 'url' | 'code' | 'other'
  timestamp: number
  size: number
  label?: string
  metadata?: Record<string, any>
}

// 剪贴板配置
export interface ClipboardConfig {
  maxHistorySize?: number
  enableHistory?: boolean
  enableNotifications?: boolean
  autoDetectType?: boolean
  persistHistory?: boolean
  storageKey?: string
}

// 剪贴板统计
export interface ClipboardStats {
  totalCopies: number
  totalPastes: number
  historySize: number
  totalSize: number
  averageSize: number
  mostUsedType: string
  typeCounts: Record<string, number>
}

// 剪贴板管理器 Hook
export function useClipboardManager(config: ClipboardConfig = {}) {
  const {
    maxHistorySize = 50,
    enableHistory = true,
    enableNotifications = true,
    autoDetectType = true,
    persistHistory = true,
    storageKey = 'clipboard-history'
  } = config

  const [history, setHistory] = useState<ClipboardItem[]>([])
  const [isSupported, setIsSupported] = useState(false)
  const [stats, setStats] = useState<ClipboardStats>({
    totalCopies: 0,
    totalPastes: 0,
    historySize: 0,
    totalSize: 0,
    averageSize: 0,
    mostUsedType: 'text',
    typeCounts: {}
  })

  const lastCopiedRef = useRef<string>('')
  const statsRef = useRef(stats)

  // 检查剪贴板 API 支持
  useEffect(() => {
    setIsSupported(
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      typeof navigator.clipboard.writeText === 'function' &&
      typeof navigator.clipboard.readText === 'function'
    )
  }, [])

  // 从本地存储加载历史
  useEffect(() => {
    if (persistHistory && typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          const parsed = JSON.parse(saved)
          setHistory(parsed.history || [])
          setStats(parsed.stats || stats)
        }
      } catch (error) {
        console.warn('Failed to load clipboard history from localStorage:', error)
      }
    }
  }, [persistHistory, storageKey])

  // 保存到本地存储
  const saveToStorage = useCallback((newHistory: ClipboardItem[], newStats: ClipboardStats) => {
    if (persistHistory && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          history: newHistory,
          stats: newStats
        }))
      } catch (error) {
        console.warn('Failed to save clipboard history to localStorage:', error)
      }
    }
  }, [persistHistory, storageKey])

  // 检测内容类型
  const detectContentType = useCallback((content: string): ClipboardItem['type'] => {
    if (!autoDetectType) return 'text'

    // JSON 检测
    try {
      JSON.parse(content)
      return 'json'
    } catch {}

    // URL 检测
    try {
      new URL(content)
      return 'url'
    } catch {}

    // HTML 检测
    if (content.includes('<') && content.includes('>')) {
      return 'html'
    }

    // 代码检测（简单启发式）
    const codePatterns = [
      /function\s+\w+\s*\(/,
      /class\s+\w+/,
      /import\s+.+from/,
      /const\s+\w+\s*=/,
      /let\s+\w+\s*=/,
      /var\s+\w+\s*=/,
      /<\?php/,
      /def\s+\w+\s*\(/,
      /public\s+class/
    ]

    if (codePatterns.some(pattern => pattern.test(content))) {
      return 'code'
    }

    return 'text'
  }, [autoDetectType])

  // 创建剪贴板项
  const createClipboardItem = useCallback((content: string, label?: string): ClipboardItem => {
    return {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      type: detectContentType(content),
      timestamp: Date.now(),
      size: new Blob([content]).size,
      label,
      metadata: {
        lines: content.split('\n').length,
        words: content.trim() ? content.trim().split(/\s+/).length : 0,
        characters: content.length
      }
    }
  }, [detectContentType])

  // 更新统计
  const updateStats = useCallback((action: 'copy' | 'paste', item?: ClipboardItem) => {
    setStats(prev => {
      const newStats = {
        ...prev,
        totalCopies: action === 'copy' ? prev.totalCopies + 1 : prev.totalCopies,
        totalPastes: action === 'paste' ? prev.totalPastes + 1 : prev.totalPastes,
        historySize: history.length
      }

      if (item) {
        newStats.totalSize = history.reduce((sum, h) => sum + h.size, 0) + item.size
        newStats.averageSize = newStats.totalSize / (history.length + 1)
        
        // 更新类型计数
        newStats.typeCounts = {
          ...prev.typeCounts,
          [item.type]: (prev.typeCounts[item.type] || 0) + 1
        }
        
        // 更新最常用类型
        const maxCount = Math.max(...Object.values(newStats.typeCounts))
        newStats.mostUsedType = Object.entries(newStats.typeCounts)
          .find(([, count]) => count === maxCount)?.[0] || 'text'
      }

      statsRef.current = newStats
      return newStats
    })
  }, [history])

  // 添加到历史
  const addToHistory = useCallback((item: ClipboardItem) => {
    if (!enableHistory) return

    setHistory(prev => {
      // 避免重复项
      const filtered = prev.filter(h => h.content !== item.content)
      const newHistory = [item, ...filtered].slice(0, maxHistorySize)
      
      // 保存到本地存储
      saveToStorage(newHistory, statsRef.current)
      
      return newHistory
    })
  }, [enableHistory, maxHistorySize, saveToStorage])

  // 复制到剪贴板
  const copyToClipboard = useCallback(async (content: string, label?: string): Promise<boolean> => {
    if (!isSupported) {
      if (enableNotifications) {
        toast.error('Clipboard API not supported')
      }
      return false
    }

    if (!content) {
      if (enableNotifications) {
        toast.error('Nothing to copy')
      }
      return false
    }

    try {
      await navigator.clipboard.writeText(content)
      
      const item = createClipboardItem(content, label)
      addToHistory(item)
      updateStats('copy', item)
      
      lastCopiedRef.current = content
      
      if (enableNotifications) {
        const preview = content.length > 50 ? content.substring(0, 50) + '...' : content
        toast.success(`Copied: ${preview}`)
      }
      
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      if (enableNotifications) {
        toast.error('Failed to copy to clipboard')
      }
      return false
    }
  }, [isSupported, enableNotifications, createClipboardItem, addToHistory, updateStats])

  // 从剪贴板粘贴
  const pasteFromClipboard = useCallback(async (): Promise<string | null> => {
    if (!isSupported) {
      if (enableNotifications) {
        toast.error('Clipboard API not supported')
      }
      return null
    }

    try {
      const content = await navigator.clipboard.readText()
      
      if (content) {
        updateStats('paste')
        
        if (enableNotifications) {
          const preview = content.length > 50 ? content.substring(0, 50) + '...' : content
          toast.success(`Pasted: ${preview}`)
        }
      }
      
      return content
    } catch (error) {
      console.error('Failed to paste from clipboard:', error)
      if (enableNotifications) {
        toast.error('Failed to paste from clipboard')
      }
      return null
    }
  }, [isSupported, enableNotifications, updateStats])

  // 从历史复制
  const copyFromHistory = useCallback(async (itemId: string): Promise<boolean> => {
    const item = history.find(h => h.id === itemId)
    if (!item) {
      if (enableNotifications) {
        toast.error('Item not found in history')
      }
      return false
    }

    return await copyToClipboard(item.content, item.label)
  }, [history, copyToClipboard, enableNotifications])

  // 删除历史项
  const removeFromHistory = useCallback((itemId: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(h => h.id !== itemId)
      saveToStorage(newHistory, statsRef.current)
      return newHistory
    })
    
    if (enableNotifications) {
      toast.success('Item removed from history')
    }
  }, [saveToStorage, enableNotifications])

  // 清除历史
  const clearHistory = useCallback(() => {
    setHistory([])
    setStats(prev => ({
      ...prev,
      historySize: 0,
      totalSize: 0,
      averageSize: 0,
      typeCounts: {}
    }))
    
    if (persistHistory && typeof localStorage !== 'undefined') {
      localStorage.removeItem(storageKey)
    }
    
    if (enableNotifications) {
      toast.success('History cleared')
    }
  }, [persistHistory, storageKey, enableNotifications])

  // 搜索历史
  const searchHistory = useCallback((query: string): ClipboardItem[] => {
    if (!query.trim()) return history
    
    const lowercaseQuery = query.toLowerCase()
    return history.filter(item => 
      item.content.toLowerCase().includes(lowercaseQuery) ||
      item.label?.toLowerCase().includes(lowercaseQuery) ||
      item.type.toLowerCase().includes(lowercaseQuery)
    )
  }, [history])

  // 按类型过滤历史
  const filterHistoryByType = useCallback((type: ClipboardItem['type']): ClipboardItem[] => {
    return history.filter(item => item.type === type)
  }, [history])

  // 获取最近的项
  const getRecentItems = useCallback((count: number = 10): ClipboardItem[] => {
    return history.slice(0, count)
  }, [history])

  // 获取最大的项
  const getLargestItems = useCallback((count: number = 5): ClipboardItem[] => {
    return [...history]
      .sort((a, b) => b.size - a.size)
      .slice(0, count)
  }, [history])

  // 导出历史
  const exportHistory = useCallback((format: 'json' | 'csv' | 'txt' = 'json'): string => {
    switch (format) {
      case 'json':
        return JSON.stringify({ history, stats }, null, 2)
      
      case 'csv':
        const csvHeader = 'ID,Content,Type,Timestamp,Size,Label\n'
        const csvRows = history.map(item => 
          `"${item.id}","${item.content.replace(/"/g, '""')}","${item.type}","${new Date(item.timestamp).toISOString()}","${item.size}","${item.label || ''}"`
        ).join('\n')
        return csvHeader + csvRows
      
      case 'txt':
        return history.map(item => 
          `[${new Date(item.timestamp).toLocaleString()}] (${item.type}) ${item.label ? `${item.label}: ` : ''}${item.content}`
        ).join('\n\n')
      
      default:
        return JSON.stringify(history, null, 2)
    }
  }, [history, stats])

  // 导入历史
  const importHistory = useCallback((data: string, format: 'json' | 'csv' = 'json'): boolean => {
    try {
      let importedItems: ClipboardItem[] = []
      
      if (format === 'json') {
        const parsed = JSON.parse(data)
        importedItems = parsed.history || parsed
      } else if (format === 'csv') {
        const lines = data.split('\n').slice(1) // Skip header
        importedItems = lines.map(line => {
          const [id, content, type, timestamp, size, label] = line.split(',')
          return {
            id: id.replace(/"/g, ''),
            content: content.replace(/"/g, ''),
            type: type.replace(/"/g, '') as ClipboardItem['type'],
            timestamp: new Date(timestamp.replace(/"/g, '')).getTime(),
            size: parseInt(size.replace(/"/g, '')),
            label: label?.replace(/"/g, '') || undefined
          }
        })
      }
      
      // 验证导入的数据
      const validItems = importedItems.filter(item => 
        item.id && item.content && item.type && item.timestamp
      )
      
      setHistory(prev => {
        const combined = [...validItems, ...prev]
        const unique = combined.filter((item, index, arr) => 
          arr.findIndex(i => i.content === item.content) === index
        )
        const limited = unique.slice(0, maxHistorySize)
        
        saveToStorage(limited, statsRef.current)
        return limited
      })
      
      if (enableNotifications) {
        toast.success(`Imported ${validItems.length} items`)
      }
      
      return true
    } catch (error) {
      console.error('Failed to import history:', error)
      if (enableNotifications) {
        toast.error('Failed to import history')
      }
      return false
    }
  }, [maxHistorySize, saveToStorage, enableNotifications])

  // 格式化文件大小
  const formatSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }, [])

  // 格式化时间
  const formatTime = useCallback((timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(timestamp).toLocaleDateString()
  }, [])

  return {
    // 状态
    history,
    isSupported,
    stats,
    
    // 操作
    copyToClipboard,
    pasteFromClipboard,
    copyFromHistory,
    removeFromHistory,
    clearHistory,
    
    // 搜索和过滤
    searchHistory,
    filterHistoryByType,
    getRecentItems,
    getLargestItems,
    
    // 导入导出
    exportHistory,
    importHistory,
    
    // 工具函数
    formatSize,
    formatTime,
    detectContentType,
    
    // 配置
    config: {
      maxHistorySize,
      enableHistory,
      enableNotifications,
      autoDetectType,
      persistHistory
    }
  }
}

// 简化的剪贴板 Hook
export function useSimpleClipboard() {
  const [isSupported, setIsSupported] = useState(false)
  
  useEffect(() => {
    setIsSupported(
      typeof navigator !== 'undefined' &&
      'clipboard' in navigator &&
      typeof navigator.clipboard.writeText === 'function'
    )
  }, [])
  
  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!isSupported) return false
    
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
      return true
    } catch (error) {
      toast.error('Failed to copy')
      return false
    }
  }, [isSupported])
  
  const paste = useCallback(async (): Promise<string | null> => {
    if (!isSupported) return null
    
    try {
      return await navigator.clipboard.readText()
    } catch (error) {
      toast.error('Failed to paste')
      return null
    }
  }, [isSupported])
  
  return { copy, paste, isSupported }
}