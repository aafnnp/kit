import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { toast } from "sonner"

// 设置字段类型
export type SettingFieldType = "string" | "number" | "boolean" | "select" | "multiselect" | "range" | "color" | "file"

// 设置字段定义
export interface SettingField {
  key: string
  label: string
  description?: string
  type: SettingFieldType
  defaultValue: any
  options?: Array<{ value: any; label: string }>
  min?: number
  max?: number
  step?: number
  accept?: string // for file type
  validation?: (value: any) => string | null
  category?: string
  dependencies?: string[] // 依赖的其他设置字段
  visible?: (settings: any) => boolean // 动态显示/隐藏
}

// 设置分组
export interface SettingGroup {
  key: string
  label: string
  description?: string
  icon?: React.ReactNode
  fields: SettingField[]
}

// 设置管理器配置
export interface SettingsManagerConfig {
  storageKey?: string
  enableLocalStorage?: boolean
  enableValidation?: boolean
  enableReset?: boolean
  autoSave?: boolean
  debounceMs?: number
}

// 设置验证结果
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
  warnings: Record<string, string>
}

// 设置管理 Hook
export function useSettingsManager<T extends Record<string, any>>(
  settingGroups: SettingGroup[],
  config: SettingsManagerConfig = {}
) {
  const {
    storageKey = "tool-settings",
    enableLocalStorage = true,
    enableValidation = true,
    enableReset = true,
    autoSave = true,
    debounceMs = 500,
  } = config

  // 获取所有字段的默认值
  const defaultSettings = useMemo(() => {
    const defaults: Record<string, any> = {}
    settingGroups.forEach((group) => {
      group.fields.forEach((field) => {
        defaults[field.key] = field.defaultValue
      })
    })
    return defaults as T
  }, [settingGroups])

  // 从本地存储加载设置
  const loadSettings = useCallback((): T => {
    if (!enableLocalStorage) return defaultSettings

    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const parsedSettings = JSON.parse(stored)
        // 合并默认设置和存储的设置，确保新字段有默认值
        return { ...defaultSettings, ...parsedSettings }
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
    return defaultSettings
  }, [storageKey, enableLocalStorage, defaultSettings])

  const [settings, setSettings] = useState<T>(loadSettings)
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: {},
    warnings: {},
  })
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 保存设置到本地存储
  const saveSettings = useCallback(
    async (settingsToSave: T) => {
      if (!enableLocalStorage) return

      setIsSaving(true)
      try {
        // 模拟异步保存（可以替换为实际的 API 调用）
        await new Promise((resolve) => setTimeout(resolve, 100))
        localStorage.setItem(storageKey, JSON.stringify(settingsToSave))
        setIsDirty(false)
      } catch (error) {
        console.error("Failed to save settings:", error)
        toast.error("Failed to save settings")
      } finally {
        setIsSaving(false)
      }
    },
    [storageKey, enableLocalStorage]
  )

  // 防抖保存
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const debouncedSave = useCallback(
    (settingsToSave: T) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        if (autoSave) {
          saveSettings(settingsToSave)
        }
      }, debounceMs)
    },
    [saveSettings, autoSave, debounceMs]
  )

  // 验证设置
  const validateSettings = useCallback(
    (settingsToValidate: T): ValidationResult => {
      if (!enableValidation) {
        return { isValid: true, errors: {}, warnings: {} }
      }

      const errors: Record<string, string> = {}
      const warnings: Record<string, string> = {}

      settingGroups.forEach((group) => {
        group.fields.forEach((field) => {
          const value = settingsToValidate[field.key]

          // 自定义验证
          if (field.validation) {
            const error = field.validation(value)
            if (error) {
              errors[field.key] = error
            }
          }

          // 类型验证
          switch (field.type) {
            case "number":
              if (typeof value !== "number" || isNaN(value)) {
                errors[field.key] = "Must be a valid number"
              } else {
                if (field.min !== undefined && value < field.min) {
                  errors[field.key] = `Must be at least ${field.min}`
                }
                if (field.max !== undefined && value > field.max) {
                  errors[field.key] = `Must be at most ${field.max}`
                }
              }
              break
            case "string":
              if (typeof value !== "string") {
                errors[field.key] = "Must be a string"
              }
              break
            case "boolean":
              if (typeof value !== "boolean") {
                errors[field.key] = "Must be a boolean"
              }
              break
          }
        })
      })

      const isValid = Object.keys(errors).length === 0
      return { isValid, errors, warnings }
    },
    [enableValidation, settingGroups]
  )

  // 更新设置的通用逻辑
  const applySettingsUpdate = useCallback(
    (newSettings: T) => {
      setSettings(newSettings)
      setIsDirty(true)

      const validation = validateSettings(newSettings)
      setValidationResult(validation)

      if (validation.isValid) {
        debouncedSave(newSettings)
      }
    },
    [validateSettings, debouncedSave]
  )

  // 更新单个设置
  const updateSetting = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      const newSettings = { ...settings, [key]: value }
      applySettingsUpdate(newSettings)
    },
    [settings, applySettingsUpdate]
  )

  // 批量更新设置
  const updateSettings = useCallback(
    (updates: Partial<T>) => {
      const newSettings = { ...settings, ...updates }
      applySettingsUpdate(newSettings)
    },
    [settings, applySettingsUpdate]
  )

  // 重置设置
  const resetSettings = useCallback(() => {
    if (!enableReset) return

    setSettings(defaultSettings)
    setValidationResult({ isValid: true, errors: {}, warnings: {} })
    setIsDirty(true)

    if (autoSave) {
      saveSettings(defaultSettings)
    }

    toast.success("Settings reset to defaults")
  }, [enableReset, defaultSettings, autoSave, saveSettings])

  // 手动保存
  const manualSave = useCallback(async () => {
    const validation = validateSettings(settings)
    if (!validation.isValid) {
      toast.error("Please fix validation errors before saving")
      return false
    }

    await saveSettings(settings)
    toast.success("Settings saved")
    return true
  }, [settings, validateSettings, saveSettings])

  // 导出设置
  const exportSettings = useCallback(() => {
    const exportData = {
      version: "1.0",
      exportedAt: Date.now(),
      settings,
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `settings-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Settings exported")
  }, [settings])

  // 导入设置
  const importSettings = useCallback(
    (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            const importData = JSON.parse(content)

            if (!importData.settings) {
              toast.error("Invalid settings file format")
              resolve(false)
              return
            }

            const importedSettings = { ...defaultSettings, ...importData.settings }
            const validation = validateSettings(importedSettings)

            if (!validation.isValid) {
              toast.error("Imported settings contain validation errors")
              resolve(false)
              return
            }

            setSettings(importedSettings)
            setValidationResult(validation)
            setIsDirty(true)

            if (autoSave) {
              saveSettings(importedSettings)
            }

            toast.success("Settings imported successfully")
            resolve(true)
          } catch (error) {
            console.error("Failed to import settings:", error)
            toast.error("Failed to import settings")
            resolve(false)
          }
        }

        reader.onerror = () => {
          toast.error("Failed to read settings file")
          resolve(false)
        }

        reader.readAsText(file)
      })
    },
    [defaultSettings, validateSettings, autoSave, saveSettings]
  )

  // 获取字段定义
  const getFieldDefinition = useCallback(
    (key: string): SettingField | undefined => {
      for (const group of settingGroups) {
        const field = group.fields.find((f) => f.key === key)
        if (field) return field
      }
      return undefined
    },
    [settingGroups]
  )

  // 获取可见字段（考虑依赖关系）
  const getVisibleFields = useCallback(
    (group: SettingGroup): SettingField[] => {
      return group.fields.filter((field) => {
        if (field.visible) {
          return field.visible(settings)
        }
        return true
      })
    },
    [settings]
  )

  // 检查字段是否有错误
  const hasFieldError = useCallback(
    (key: string): boolean => {
      return key in validationResult.errors
    },
    [validationResult.errors]
  )

  // 获取字段错误信息
  const getFieldError = useCallback(
    (key: string): string | undefined => {
      return validationResult.errors[key]
    },
    [validationResult.errors]
  )

  // 初始验证
  useEffect(() => {
    const validation = validateSettings(settings)
    setValidationResult(validation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 只在组件挂载时运行

  // 清理防抖定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    // 设置数据
    settings,
    defaultSettings,
    settingGroups,

    // 验证状态
    validationResult,
    isValid: validationResult.isValid,
    hasErrors: Object.keys(validationResult.errors).length > 0,
    hasWarnings: Object.keys(validationResult.warnings).length > 0,

    // 状态
    isDirty,
    isSaving,

    // 设置操作
    updateSetting,
    updateSettings,
    resetSettings,
    manualSave,

    // 导入导出
    exportSettings,
    importSettings,

    // 工具函数
    getFieldDefinition,
    getVisibleFields,
    hasFieldError,
    getFieldError,
    validateSettings,
  }
}

// 设置字段组件的 props 类型
export interface SettingFieldProps {
  field: SettingField
  value: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
  className?: string
}

// 设置组组件的 props 类型
export interface SettingGroupProps {
  group: SettingGroup
  settings: Record<string, any>
  onSettingChange: (key: string, value: any) => void
  errors: Record<string, string>
  className?: string
}
