import { useCallback, useEffect, useRef, useState } from "react"

/**
 * 与 `storage.defineItem()` 返回值结构兼容的最小接口。
 * 用结构化类型而不是 import 具体类型，避免耦合 @wxt-dev/storage 的类型导出。
 */
export interface StorageItemLike<T> {
  getValue(): Promise<T | null>
  setValue(value: T): Promise<void>
  removeValue(): Promise<void>
  watch(callback: (newValue: T | null, oldValue: T | null) => void): () => void
}

export interface UseStorageItemResult<T> {
  value: T
  loading: boolean
  setValue: (next: T) => Promise<void>
  reset: () => Promise<void>
}

/**
 * 读取一个 WXT storage item，并订阅其变化（跨 popup / options / 后台实时同步）。
 *
 * fallback 用 ref 持有：调用方通常传对象字面量，如果进依赖数组会导致无限重渲染。
 */
export function useStorageItem<T>(item: StorageItemLike<T>, fallback: T): UseStorageItemResult<T> {
  const fallbackRef = useRef(fallback)
  fallbackRef.current = fallback

  const [value, setValue] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true

    item
      .getValue()
      .then((stored) => {
        if (!alive) return
        setValue(stored ?? fallbackRef.current)
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false)
      })

    const unwatch = item.watch((next) => {
      setValue(next ?? fallbackRef.current)
    })

    return () => {
      alive = false
      unwatch()
    }
  }, [item])

  const update = useCallback(
    async (next: T) => {
      setValue(next)
      await item.setValue(next)
    },
    [item],
  )

  const reset = useCallback(async () => {
    await item.removeValue()
    setValue(fallbackRef.current)
  }, [item])

  return { value, loading, setValue: update, reset }
}
