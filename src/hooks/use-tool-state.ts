import { useState, useCallback, useReducer } from "react"
import { toast } from "sonner"

// 通用工具状态接口
export interface ToolState<T = any> {
  data: T
  isLoading: boolean
  error: string | null
  isProcessing: boolean
  progress: number
}

// 状态操作类型
type ToolStateAction<T> =
  | { type: "SET_DATA"; payload: T }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_PROCESSING"; payload: boolean }
  | { type: "SET_PROGRESS"; payload: number }
  | { type: "RESET" }

// 状态 reducer
function toolStateReducer<T>(state: ToolState<T>, action: ToolStateAction<T>): ToolState<T> {
  switch (action.type) {
    case "SET_DATA":
      return { ...state, data: action.payload, error: null }
    case "SET_LOADING":
      return { ...state, isLoading: action.payload }
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false, isProcessing: false }
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.payload }
    case "SET_PROGRESS":
      return { ...state, progress: action.payload }
    case "RESET":
      return {
        data: state.data,
        isLoading: false,
        error: null,
        isProcessing: false,
        progress: 0,
      }
    default:
      return state
  }
}

// 通用工具状态管理 Hook
export function useToolState<T>(initialData: T) {
  const [state, dispatch] = useReducer(toolStateReducer<T>, {
    data: initialData,
    isLoading: false,
    error: null,
    isProcessing: false,
    progress: 0,
  })

  const setData = useCallback((data: T) => {
    dispatch({ type: "SET_DATA", payload: data })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading })
  }, [])

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error })
    if (error) {
      toast.error(error)
    }
  }, [])

  const setProcessing = useCallback((processing: boolean) => {
    dispatch({ type: "SET_PROCESSING", payload: processing })
  }, [])

  const setProgress = useCallback((progress: number) => {
    dispatch({ type: "SET_PROGRESS", payload: progress })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: "RESET" })
  }, [])

  // 异步操作包装器
  const executeAsync = useCallback(
    async <R>(operation: () => Promise<R>): Promise<R | null> => {
      setLoading(true)
      setError(null)
      try {
        const result = await operation()
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
        setError(errorMessage)
        return null
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError]
  )

  // 处理操作包装器
  const executeProcessing = useCallback(
    async <R>(operation: (updateProgress: (progress: number) => void) => Promise<R>): Promise<R | null> => {
      setProcessing(true)
      setError(null)
      setProgress(0)
      try {
        const result = await operation(setProgress)
        setProgress(100)
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Processing failed"
        setError(errorMessage)
        setProgress(0)
        return null
      } finally {
        setProcessing(false)
        // 保持最终进度，不重置为 0（成功时显示 100%）
      }
    },
    [setProcessing, setError, setProgress]
  )

  return {
    ...state,
    setData,
    setLoading,
    setError,
    setProcessing,
    setProgress,
    reset,
    executeAsync,
    executeProcessing,
  }
}

// 简化的状态管理 Hook（适用于简单场景）
export function useSimpleState<T>(initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateValue = useCallback((newValue: T) => {
    setValue(newValue)
    setError(null)
  }, [])

  const executeWithLoading = useCallback(async <R>(operation: () => Promise<R>): Promise<R | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await operation()
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Operation failed"
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setValue(initialValue)
    setIsLoading(false)
    setError(null)
  }, [initialValue])

  return {
    value,
    isLoading,
    error,
    setValue: updateValue,
    setIsLoading,
    setError,
    executeWithLoading,
    reset,
  }
}

// 批处理状态管理 Hook
export interface BatchState<T> {
  items: T[]
  processing: Set<string>
  completed: Set<string>
  failed: Set<string>
  progress: number
}

export function useBatchState<T extends { id: string }>(initialItems: T[] = []) {
  const [state, setState] = useState<BatchState<T>>({
    items: initialItems,
    processing: new Set(),
    completed: new Set(),
    failed: new Set(),
    progress: 0,
  })

  const addItems = useCallback((newItems: T[]) => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, ...newItems],
    }))
  }, [])

  const removeItem = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
      processing: new Set([...prev.processing].filter((pid) => pid !== id)),
      completed: new Set([...prev.completed].filter((pid) => pid !== id)),
      failed: new Set([...prev.failed].filter((pid) => pid !== id)),
    }))
  }, [])

  // 更新项目状态的通用逻辑
  const updateItemStatus = useCallback(
    (id: string, status: "processing" | "completed" | "failed", calculateProgress = false) => {
      setState((prev) => {
        const newProcessing = new Set(prev.processing)
        const newCompleted = new Set(prev.completed)
        const newFailed = new Set(prev.failed)

        // 清除所有状态
        newProcessing.delete(id)
        newCompleted.delete(id)
        newFailed.delete(id)

        // 设置新状态
        if (status === "processing") {
          newProcessing.add(id)
        } else if (status === "completed") {
          newCompleted.add(id)
        } else if (status === "failed") {
          newFailed.add(id)
        }

        const progress =
          calculateProgress && prev.items.length > 0 ? (newCompleted.size / prev.items.length) * 100 : prev.progress

        return {
          ...prev,
          processing: newProcessing,
          completed: newCompleted,
          failed: newFailed,
          progress,
        }
      })
    },
    []
  )

  const setItemProcessing = useCallback(
    (id: string) => {
      updateItemStatus(id, "processing")
    },
    [updateItemStatus]
  )

  const setItemCompleted = useCallback(
    (id: string) => {
      updateItemStatus(id, "completed", true)
    },
    [updateItemStatus]
  )

  const setItemFailed = useCallback(
    (id: string) => {
      updateItemStatus(id, "failed")
    },
    [updateItemStatus]
  )

  const clearAll = useCallback(() => {
    setState({
      items: [],
      processing: new Set(),
      completed: new Set(),
      failed: new Set(),
      progress: 0,
    })
  }, [])

  const resetStatus = useCallback(() => {
    setState((prev) => ({
      ...prev,
      processing: new Set(),
      completed: new Set(),
      failed: new Set(),
      progress: 0,
    }))
  }, [])

  return {
    ...state,
    addItems,
    removeItem,
    setItemProcessing,
    setItemCompleted,
    setItemFailed,
    clearAll,
    resetStatus,
    isProcessing: state.processing.size > 0,
    hasCompleted: state.completed.size > 0,
    hasFailed: state.failed.size > 0,
    totalItems: state.items.length,
    completedCount: state.completed.size,
    failedCount: state.failed.size,
    processingCount: state.processing.size,
  }
}
