import { useState, useCallback, useRef, useEffect } from "react"
import { toast } from "sonner"

// 输入处理配置
export interface InputHandlerConfig {
  enableClipboard?: boolean
  enableHistory?: boolean
  enableValidation?: boolean
  maxHistorySize?: number
  debounceMs?: number
  placeholder?: string
  validator?: (value: string) => string | null
  formatter?: (value: string) => string
  parser?: (value: string) => any
}

// 输入历史项
export interface InputHistoryItem {
  id: string
  value: string
  timestamp: number
  label?: string
}

// 输入处理 Hook
export function useInputHandler(config: InputHandlerConfig = {}) {
  const {
    enableClipboard = true,
    enableHistory = true,
    enableValidation = true,
    maxHistorySize = 10,
    debounceMs = 300,
    placeholder = "",
    validator,
    formatter,
    parser,
  } = config

  const [value, setValue] = useState("")
  const [history, setHistory] = useState<InputHistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isValid, setIsValid] = useState(true)
  const [isFocused, setIsFocused] = useState(false)
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 验证输入
  const validateInput = useCallback(
    (inputValue: string) => {
      if (!enableValidation || !validator) {
        setError(null)
        setIsValid(true)
        return true
      }

      const validationError = validator(inputValue)
      setError(validationError)
      setIsValid(!validationError)
      return !validationError
    },
    [enableValidation, validator]
  )

  // 格式化输入
  const formatInput = useCallback(
    (inputValue: string) => {
      if (!formatter) return inputValue
      try {
        return formatter(inputValue)
      } catch (error) {
        console.warn("Input formatting failed:", error)
        return inputValue
      }
    },
    [formatter]
  )

  // 解析输入
  const parseInput = useCallback(
    (inputValue: string) => {
      if (!parser) return inputValue
      try {
        return parser(inputValue)
      } catch (error) {
        console.warn("Input parsing failed:", error)
        return inputValue
      }
    },
    [parser]
  )

  // 防抖验证
  const debouncedValidate = useCallback(
    (inputValue: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      debounceRef.current = setTimeout(() => {
        validateInput(inputValue)
      }, debounceMs)
    },
    [validateInput, debounceMs]
  )

  // 更新值
  const updateValue = useCallback(
    (newValue: string, skipValidation = false) => {
      const formattedValue = formatInput(newValue)
      setValue(formattedValue)

      if (!skipValidation) {
        debouncedValidate(formattedValue)
      }
    },
    [formatInput, debouncedValidate]
  )

  // 添加到历史
  const addToHistory = useCallback(
    (inputValue: string, label?: string) => {
      if (!enableHistory || !inputValue.trim()) return

      const historyItem: InputHistoryItem = {
        id: Date.now().toString(),
        value: inputValue,
        timestamp: Date.now(),
        label,
      }

      setHistory((prev) => {
        // 避免重复项
        const filtered = prev.filter((item) => item.value !== inputValue)
        const newHistory = [historyItem, ...filtered]
        return newHistory.slice(0, maxHistorySize)
      })
    },
    [enableHistory, maxHistorySize]
  )

  // 从剪贴板粘贴
  const pasteFromClipboard = useCallback(async () => {
    if (!enableClipboard) return false

    try {
      const text = await navigator.clipboard.readText()
      updateValue(text)
      addToHistory(text, "Pasted from clipboard")
      toast.success("Pasted from clipboard")
      return true
    } catch (error) {
      console.error("Failed to paste from clipboard:", error)
      toast.error("Failed to paste from clipboard")
      return false
    }
  }, [enableClipboard, updateValue, addToHistory])

  // 复制到剪贴板
  const copyToClipboard = useCallback(
    async (textToCopy?: string) => {
      if (!enableClipboard) return false

      const text = textToCopy || value
      if (!text) {
        toast.error("Nothing to copy")
        return false
      }

      try {
        await navigator.clipboard.writeText(text)
        toast.success("Copied to clipboard")
        return true
      } catch (error) {
        console.error("Failed to copy to clipboard:", error)
        toast.error("Failed to copy to clipboard")
        return false
      }
    },
    [enableClipboard, value]
  )

  // 清除输入
  const clearInput = useCallback(() => {
    setValue("")
    setError(null)
    setIsValid(true)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // 从历史选择
  const selectFromHistory = useCallback(
    (historyItem: InputHistoryItem) => {
      updateValue(historyItem.value)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    },
    [updateValue]
  )

  // 清除历史
  const clearHistory = useCallback(() => {
    setHistory([])
    toast.success("History cleared")
  }, [])

  // 获取选中的文本
  const getSelectedText = useCallback(() => {
    if (!inputRef.current) return ""
    return value.substring(selectionStart, selectionEnd)
  }, [value, selectionStart, selectionEnd])

  // 插入文本到光标位置
  const insertText = useCallback(
    (textToInsert: string) => {
      if (!inputRef.current) return

      const start = inputRef.current.selectionStart || 0
      const end = inputRef.current.selectionEnd || 0
      const newValue = value.substring(0, start) + textToInsert + value.substring(end)

      updateValue(newValue)

      // 设置光标位置
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = start + textToInsert.length
          inputRef.current.setSelectionRange(newPosition, newPosition)
          inputRef.current.focus()
        }
      }, 0)
    },
    [value, updateValue]
  )

  // 替换选中的文本
  const replaceSelectedText = useCallback(
    (replacement: string) => {
      if (!inputRef.current) return

      const start = inputRef.current.selectionStart || 0
      const end = inputRef.current.selectionEnd || 0
      const newValue = value.substring(0, start) + replacement + value.substring(end)

      updateValue(newValue)

      // 设置光标位置
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = start + replacement.length
          inputRef.current.setSelectionRange(newPosition, newPosition)
          inputRef.current.focus()
        }
      }, 0)
    },
    [value, updateValue]
  )

  // 处理键盘快捷键
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const { key, ctrlKey, metaKey, shiftKey } = event
      const isModifierPressed = ctrlKey || metaKey

      switch (key) {
        case "v":
          if (isModifierPressed) {
            event.preventDefault()
            pasteFromClipboard()
          }
          break
        case "c":
          if (isModifierPressed && getSelectedText()) {
            event.preventDefault()
            copyToClipboard(getSelectedText())
          }
          break
        case "a":
          if (isModifierPressed) {
            // 全选 - 浏览器默认行为
          }
          break
        case "z":
          if (isModifierPressed && !shiftKey && history.length > 0) {
            event.preventDefault()
            selectFromHistory(history[0])
          }
          break
        case "Escape":
          if (inputRef.current) {
            inputRef.current.blur()
          }
          break
      }
    },
    [pasteFromClipboard, copyToClipboard, getSelectedText, history, selectFromHistory]
  )

  // 处理焦点事件
  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    // 在失去焦点时添加到历史
    if (value.trim()) {
      addToHistory(value)
    }
  }, [value, addToHistory])

  // 处理选择变化
  const handleSelectionChange = useCallback(() => {
    if (inputRef.current) {
      setSelectionStart(inputRef.current.selectionStart || 0)
      setSelectionEnd(inputRef.current.selectionEnd || 0)
    }
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // 输入属性
  const inputProps = {
    ref: inputRef,
    value,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateValue(e.target.value)
    },
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onSelect: handleSelectionChange,
    placeholder,
  }

  return {
    // 状态
    value,
    error,
    isValid,
    isFocused,
    history,
    selectionStart,
    selectionEnd,

    // 操作
    updateValue,
    clearInput,
    pasteFromClipboard,
    copyToClipboard,
    insertText,
    replaceSelectedText,
    getSelectedText,

    // 历史操作
    selectFromHistory,
    clearHistory,
    addToHistory,

    // 解析和格式化
    parseInput,
    formatInput,

    // 组件属性
    inputProps,
    inputRef,

    // 工具函数
    validateInput,

    // 统计信息
    stats: {
      length: value.length,
      lines: value.split("\n").length,
      words: value.trim() ? value.trim().split(/\s+/).length : 0,
      historySize: history.length,
    },
  }
}

// 专用的文本区域输入处理 Hook
export function useTextAreaHandler(config: InputHandlerConfig = {}) {
  const inputHandler = useInputHandler(config)

  // 文本区域特有的操作
  const insertLine = useCallback(() => {
    inputHandler.insertText("\n")
  }, [inputHandler])

  const indentLine = useCallback(() => {
    inputHandler.insertText("  ") // 2 spaces
  }, [inputHandler])

  const outdentLine = useCallback(() => {
    const { value, selectionStart } = inputHandler
    const lines = value.split("\n")
    const currentLineIndex = value.substring(0, selectionStart).split("\n").length - 1
    const currentLine = lines[currentLineIndex]

    if (currentLine.startsWith("  ")) {
      lines[currentLineIndex] = currentLine.substring(2)
      const newValue = lines.join("\n")
      inputHandler.updateValue(newValue)
    }
  }, [inputHandler])

  return {
    ...inputHandler,
    insertLine,
    indentLine,
    outdentLine,
  }
}

// 专用的数字输入处理 Hook
export function useNumberInputHandler(
  config: InputHandlerConfig & {
    min?: number
    max?: number
    step?: number
    precision?: number
  } = {}
) {
  const { min, max, step = 1, precision } = config

  const numberValidator = useCallback(
    (value: string) => {
      if (!value.trim()) return null

      const num = parseFloat(value)
      if (isNaN(num)) return "Must be a valid number"

      if (min !== undefined && num < min) return `Must be at least ${min}`
      if (max !== undefined && num > max) return `Must be at most ${max}`

      return null
    },
    [min, max]
  )

  const numberFormatter = useCallback(
    (value: string) => {
      if (!value.trim()) return value

      const num = parseFloat(value)
      if (isNaN(num)) return value

      if (precision !== undefined) {
        return num.toFixed(precision)
      }

      return value
    },
    [precision]
  )

  const inputHandler = useInputHandler({
    ...config,
    validator: numberValidator,
    formatter: numberFormatter,
  })

  const increment = useCallback(() => {
    const current = parseFloat(inputHandler.value) || 0
    const newValue = current + step
    const clampedValue = max !== undefined ? Math.min(newValue, max) : newValue
    inputHandler.updateValue(clampedValue.toString())
  }, [inputHandler, step, max])

  const decrement = useCallback(() => {
    const current = parseFloat(inputHandler.value) || 0
    const newValue = current - step
    const clampedValue = min !== undefined ? Math.max(newValue, min) : newValue
    inputHandler.updateValue(clampedValue.toString())
  }, [inputHandler, step, min])

  return {
    ...inputHandler,
    increment,
    decrement,
    numberValue: parseFloat(inputHandler.value) || 0,
  }
}
