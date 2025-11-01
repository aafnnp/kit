import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToolState, useSimpleState, useBatchState } from '@/hooks/use-tool-state'
import { toast } from 'sonner'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('useToolState', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    expect(result.current.data).toEqual({ value: 'initial' })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.progress).toBe(0)
  })

  it('should set data', () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    act(() => {
      result.current.setData({ value: 'updated' })
    })

    expect(result.current.data).toEqual({ value: 'updated' })
    expect(result.current.error).toBeNull()
  })

  it('should set loading state', () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    act(() => {
      result.current.setLoading(true)
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should set error and show toast', () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    act(() => {
      result.current.setError('Test error')
    })

    expect(result.current.error).toBe('Test error')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isProcessing).toBe(false)
    expect(toast.error).toHaveBeenCalledWith('Test error')
  })

  it('should set processing state', () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    act(() => {
      result.current.setProcessing(true)
    })

    expect(result.current.isProcessing).toBe(true)
  })

  it('should set progress', () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    act(() => {
      result.current.setProgress(50)
    })

    expect(result.current.progress).toBe(50)
  })

  it('should reset state', () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    act(() => {
      result.current.setData({ value: 'updated' })
      result.current.setLoading(true)
      result.current.setError('Error')
      result.current.setProcessing(true)
      result.current.setProgress(50)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.progress).toBe(0)
    expect(result.current.data).toEqual({ value: 'updated' }) // Data is preserved
  })

  it('should execute async operation', async () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    const operation = vi.fn().mockResolvedValue('result')

    await act(async () => {
      const res = await result.current.executeAsync(operation)
      expect(res).toBe('result')
    })

    expect(operation).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle async operation error', async () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    const operation = vi.fn().mockRejectedValue(new Error('Async error'))

    await act(async () => {
      const res = await result.current.executeAsync(operation)
      expect(res).toBeNull()
    })

    expect(result.current.error).toBe('Async error')
    expect(result.current.isLoading).toBe(false)
  })

  it('should execute processing operation', async () => {
    const { result } = renderHook(() => useToolState({ value: 'initial' }))

    const operation = vi.fn().mockImplementation((updateProgress) => {
      updateProgress(50)
      return Promise.resolve('result')
    })

    let res: string | null = null
    await act(async () => {
      res = await result.current.executeProcessing(operation)
    })

    // 等待状态更新
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    expect(res).toBe('result')
    expect(result.current.progress).toBe(100)
    expect(result.current.isProcessing).toBe(false)
  })
})

describe('useSimpleState', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useSimpleState('initial'))

    expect(result.current.value).toBe('initial')
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should update value', () => {
    const { result } = renderHook(() => useSimpleState('initial'))

    act(() => {
      result.current.setValue('updated')
    })

    expect(result.current.value).toBe('updated')
    expect(result.current.error).toBeNull()
  })

  it('should execute with loading', async () => {
    const { result } = renderHook(() => useSimpleState('initial'))

    const operation = vi.fn().mockResolvedValue('result')

    await act(async () => {
      const res = await result.current.executeWithLoading(operation)
      expect(res).toBe('result')
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should handle operation error', async () => {
    const { result } = renderHook(() => useSimpleState('initial'))

    const operation = vi.fn().mockRejectedValue(new Error('Operation error'))

    await act(async () => {
      const res = await result.current.executeWithLoading(operation)
      expect(res).toBeNull()
    })

    expect(result.current.error).toBe('Operation error')
    expect(toast.error).toHaveBeenCalledWith('Operation error')
  })

  it('should reset to initial value', () => {
    const { result } = renderHook(() => useSimpleState('initial'))

    act(() => {
      result.current.setValue('updated')
      result.current.setError('Error')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.value).toBe('initial')
    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})

// 测试用的类型定义
interface TestItem {
  id: string
  data?: string
}

describe('useBatchState', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    expect(result.current.items).toEqual([])
    expect(result.current.processing.size).toBe(0)
    expect(result.current.completed.size).toBe(0)
    expect(result.current.failed.size).toBe(0)
    expect(result.current.progress).toBe(0)
  })

  it('should add items', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    const items: TestItem[] = [
      { id: '1', data: 'test1' },
      { id: '2', data: 'test2' },
    ]

    act(() => {
      result.current.addItems(items)
    })

    expect(result.current.items).toHaveLength(2)
    expect(result.current.totalItems).toBe(2)
  })

  it('should remove item', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    const items: TestItem[] = [
      { id: '1', data: 'test1' },
      { id: '2', data: 'test2' },
    ]

    act(() => {
      result.current.addItems(items)
      result.current.setItemProcessing('1')
      result.current.setItemCompleted('1')
      result.current.removeItem('1')
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.totalItems).toBe(1)
  })

  it('should set item processing', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    act(() => {
      result.current.addItems([{ id: '1', data: 'test' }])
      result.current.setItemProcessing('1')
    })

    expect(result.current.processing.has('1')).toBe(true)
    expect(result.current.isProcessing).toBe(true)
  })

  it('should set item completed and update progress', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    act(() => {
      result.current.addItems([
        { id: '1', data: 'test1' },
        { id: '2', data: 'test2' },
      ])
      result.current.setItemProcessing('1')
      result.current.setItemCompleted('1')
    })

    expect(result.current.completed.has('1')).toBe(true)
    expect(result.current.processing.has('1')).toBe(false)
    expect(result.current.progress).toBe(50)
    expect(result.current.completedCount).toBe(1)
  })

  it('should set item failed', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    act(() => {
      result.current.addItems([{ id: '1', data: 'test' }])
      result.current.setItemProcessing('1')
      result.current.setItemFailed('1')
    })

    expect(result.current.failed.has('1')).toBe(true)
    expect(result.current.processing.has('1')).toBe(false)
    expect(result.current.hasFailed).toBe(true)
    expect(result.current.failedCount).toBe(1)
  })

  it('should clear all items', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    act(() => {
      result.current.addItems([{ id: '1', data: 'test' }])
      result.current.setItemProcessing('1')
      result.current.clearAll()
    })

    expect(result.current.items).toHaveLength(0)
    expect(result.current.processing.size).toBe(0)
    expect(result.current.completed.size).toBe(0)
    expect(result.current.failed.size).toBe(0)
  })

  it('should reset status', () => {
    const { result } = renderHook(() => useBatchState<TestItem>())

    act(() => {
      result.current.addItems([{ id: '1', data: 'test' }])
      result.current.setItemProcessing('1')
      result.current.setItemCompleted('1')
      result.current.resetStatus()
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.processing.size).toBe(0)
    expect(result.current.completed.size).toBe(0)
    expect(result.current.failed.size).toBe(0)
    expect(result.current.progress).toBe(0)
  })
})
