import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'

// 通用模板接口
export interface BaseTemplate {
  id: string
  name: string
  description: string
  category?: string
  tags?: string[]
  isBuiltIn?: boolean
  createdAt?: number
  updatedAt?: number
}

// 模板管理器配置
export interface TemplateManagerConfig {
  storageKey?: string
  enableLocalStorage?: boolean
  maxCustomTemplates?: number
}

// 模板管理 Hook
export function useTemplateManager<T extends BaseTemplate>(
  builtInTemplates: T[],
  config: TemplateManagerConfig = {}
) {
  const {
    storageKey = 'custom-templates',
    enableLocalStorage = true,
    maxCustomTemplates = 50
  } = config

  // 从本地存储加载自定义模板
  const loadCustomTemplates = useCallback((): T[] => {
    if (!enableLocalStorage) return []
    
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to load custom templates:', error)
      return []
    }
  }, [storageKey, enableLocalStorage])

  const [customTemplates, setCustomTemplates] = useState<T[]>(loadCustomTemplates)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // 保存自定义模板到本地存储
  const saveCustomTemplates = useCallback((templates: T[]) => {
    if (!enableLocalStorage) return
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(templates))
    } catch (error) {
      console.error('Failed to save custom templates:', error)
      toast.error('Failed to save templates')
    }
  }, [storageKey, enableLocalStorage])

  // 所有模板（内置 + 自定义）
  const allTemplates = useMemo(() => {
    const builtin = builtInTemplates.map(t => ({ ...t, isBuiltIn: true }))
    return [...builtin, ...customTemplates]
  }, [builtInTemplates, customTemplates])

  // 获取所有分类
  const categories = useMemo(() => {
    const categorySet = new Set<string>()
    allTemplates.forEach(template => {
      if (template.category) {
        categorySet.add(template.category)
      }
    })
    return Array.from(categorySet).sort()
  }, [allTemplates])

  // 过滤和搜索模板
  const filteredTemplates = useMemo(() => {
    let filtered = allTemplates

    // 按分类过滤
    if (selectedCategory && selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // 按搜索查询过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [allTemplates, selectedCategory, searchQuery])

  // 按分类分组的模板
  const groupedTemplates = useMemo(() => {
    const groups: Record<string, T[]> = {}
    
    filteredTemplates.forEach(template => {
      const category = template.category || 'General'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(template)
    })

    return groups
  }, [filteredTemplates])

  // 根据 ID 获取模板
  const getTemplate = useCallback((id: string): T | undefined => {
    return allTemplates.find(template => template.id === id)
  }, [allTemplates])

  // 添加自定义模板
  const addCustomTemplate = useCallback((templateData: Omit<T, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'>) => {
    if (customTemplates.length >= maxCustomTemplates) {
      toast.error(`Maximum ${maxCustomTemplates} custom templates allowed`)
      return false
    }

    const newTemplate: T = {
      ...templateData,
      id: nanoid(),
      isBuiltIn: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as T

    const updatedTemplates = [...customTemplates, newTemplate]
    setCustomTemplates(updatedTemplates)
    saveCustomTemplates(updatedTemplates)
    
    toast.success(`Template "${newTemplate.name}" added`)
    return true
  }, [customTemplates, maxCustomTemplates, saveCustomTemplates])

  // 更新自定义模板
  const updateCustomTemplate = useCallback((id: string, updates: Partial<T>) => {
    const template = customTemplates.find(t => t.id === id)
    if (!template) {
      toast.error('Template not found')
      return false
    }

    if (template.isBuiltIn) {
      toast.error('Cannot modify built-in templates')
      return false
    }

    const updatedTemplates = customTemplates.map(t => 
      t.id === id 
        ? { ...t, ...updates, updatedAt: Date.now() }
        : t
    )

    setCustomTemplates(updatedTemplates)
    saveCustomTemplates(updatedTemplates)
    
    toast.success('Template updated')
    return true
  }, [customTemplates, saveCustomTemplates])

  // 删除自定义模板
  const deleteCustomTemplate = useCallback((id: string) => {
    const template = customTemplates.find(t => t.id === id)
    if (!template) {
      toast.error('Template not found')
      return false
    }

    if (template.isBuiltIn) {
      toast.error('Cannot delete built-in templates')
      return false
    }

    const updatedTemplates = customTemplates.filter(t => t.id !== id)
    setCustomTemplates(updatedTemplates)
    saveCustomTemplates(updatedTemplates)
    
    // 如果删除的是当前选中的模板，清除选择
    if (selectedTemplate === id) {
      setSelectedTemplate('')
    }
    
    toast.success('Template deleted')
    return true
  }, [customTemplates, selectedTemplate, saveCustomTemplates])

  // 复制模板（创建副本）
  const duplicateTemplate = useCallback((id: string) => {
    const template = getTemplate(id)
    if (!template) {
      toast.error('Template not found')
      return false
    }

    const duplicatedTemplate = {
      ...template,
      name: `${template.name} (Copy)`,
      isBuiltIn: false
    }

    // 移除 id 以便创建新的
    const { id: _, isBuiltIn: __, createdAt: ___, updatedAt: ____, ...templateData } = duplicatedTemplate
    
    return addCustomTemplate(templateData as Omit<T, 'id' | 'isBuiltIn' | 'createdAt' | 'updatedAt'>)
  }, [getTemplate, addCustomTemplate])

  // 导出模板
  const exportTemplates = useCallback((templateIds?: string[]) => {
    const templatesToExport = templateIds 
      ? allTemplates.filter(t => templateIds.includes(t.id))
      : customTemplates

    const exportData = {
      version: '1.0',
      exportedAt: Date.now(),
      templates: templatesToExport
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `templates-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success(`Exported ${templatesToExport.length} template(s)`)
  }, [allTemplates, customTemplates])

  // 导入模板
  const importTemplates = useCallback((file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const importData = JSON.parse(content)
          
          if (!importData.templates || !Array.isArray(importData.templates)) {
            toast.error('Invalid template file format')
            resolve(false)
            return
          }

          const importedTemplates = importData.templates.map((template: any) => ({
            ...template,
            id: nanoid(), // 生成新的 ID 避免冲突
            isBuiltIn: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }))

          const updatedTemplates = [...customTemplates, ...importedTemplates]
          setCustomTemplates(updatedTemplates)
          saveCustomTemplates(updatedTemplates)
          
          toast.success(`Imported ${importedTemplates.length} template(s)`)
          resolve(true)
        } catch (error) {
          console.error('Failed to import templates:', error)
          toast.error('Failed to import templates')
          resolve(false)
        }
      }

      reader.onerror = () => {
        toast.error('Failed to read template file')
        resolve(false)
      }

      reader.readAsText(file)
    })
  }, [customTemplates, saveCustomTemplates])

  // 清除所有自定义模板
  const clearCustomTemplates = useCallback(() => {
    setCustomTemplates([])
    saveCustomTemplates([])
    setSelectedTemplate('')
    toast.success('All custom templates cleared')
  }, [saveCustomTemplates])

  // 应用模板
  const applyTemplate = useCallback((id: string, onApply?: (template: T) => void) => {
    const template = getTemplate(id)
    if (!template) {
      toast.error('Template not found')
      return false
    }

    setSelectedTemplate(id)
    onApply?.(template)
    toast.success(`Applied template: ${template.name}`)
    return true
  }, [getTemplate])

  return {
    // 模板数据
    allTemplates,
    customTemplates,
    builtInTemplates,
    filteredTemplates,
    groupedTemplates,
    categories,
    
    // 状态
    selectedTemplate,
    searchQuery,
    selectedCategory,
    
    // 状态更新
    setSelectedTemplate,
    setSearchQuery,
    setSelectedCategory,
    
    // 模板操作
    getTemplate,
    addCustomTemplate,
    updateCustomTemplate,
    deleteCustomTemplate,
    duplicateTemplate,
    applyTemplate,
    
    // 批量操作
    exportTemplates,
    importTemplates,
    clearCustomTemplates,
    
    // 统计信息
    stats: {
      total: allTemplates.length,
      builtin: builtInTemplates.length,
      custom: customTemplates.length,
      filtered: filteredTemplates.length,
      categories: categories.length
    }
  }
}

// 模板选择器组件的 props 类型
export interface TemplatePickerProps<T extends BaseTemplate> {
  templates: T[]
  selectedTemplate: string
  onTemplateSelect: (template: T) => void
  groupByCategory?: boolean
  showSearch?: boolean
  showCategories?: boolean
  className?: string
}