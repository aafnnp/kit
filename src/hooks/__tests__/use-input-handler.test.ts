import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInputHandler, useTextAreaHandler, useNumberInputHandler } from '../use-input-handler'
import { toast } from 'sonner'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock clipboard API
const mockClipboard = {
  readText: vi.fn(),
  writeText: vi.fn(),
}

Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
})

describe('useInputHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockClipboard.readText.mockResolvedValue('clipboard text')
    mockClipboard.writeText.mockResolvedValue(undefined)
  })

  describe('initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useInputHandler())

      expect(result.current.value).toBe('')
      expect(result.current.error).toBeNull()
      expect(result.current.isValid).toBe(true)
      expect(result.current.isFocused).toBe(false)
      expect(result.current.history).toEqual([])
    })

    it('should initialize with custom placeholder', () => {
      const { result } = renderHook(() => useInputHandler({ placeholder: 'Enter text' }))

      expect(result.current.inputProps.placeholder).toBe('Enter text')
    })
  })

  describe('updateValue', () => {
    it('should update value', () => {
      const { result } = renderHook(() => useInputHandler())

      act(() => {
        result.current.updateValue('new value')
      })

      expect(result.current.value).toBe('new value')
    })

    it('should format value when formatter is provided', () => {
      const formatter = (value: string) => value.toUpperCase()
      const { result } = renderHook(() => useInputHandler({ formatter }))

      act(() => {
        result.current.updateValue('hello')
      })

      expect(result.current.value).toBe('HELLO')
    })

    it('should handle formatter errors gracefully', () => {
      const formatter = () => {
        throw new Error('Format error')
      }
      const { result } = renderHook(() => useInputHandler({ formatter }))

      act(() => {
        result.current.updateValue('test')
      })

      // Should still update value even if formatter fails
      expect(result.current.value).toBe('test')
    })
  })

  describe('validation', () => {
    it('should validate input with custom validator', async () => {
      const validator = (value: string) => (value.length < 5 ? 'Too short' : null)
      const { result } = renderHook(() => useInputHandler({ validator, debounceMs: 50 }))

      act(() => {
        result.current.updateValue('hi')
      })

      // Wait for debounce
      await waitFor(() => {
        expect(result.current.isValid).toBe(false)
        expect(result.current.error).toBe('Too short')
      }, { timeout: 200 })

      act(() => {
        result.current.updateValue('hello')
      })

      await waitFor(() => {
        expect(result.current.isValid).toBe(true)
        expect(result.current.error).toBeNull()
      }, { timeout: 200 })
    })

    it('should skip validation when disabled', () => {
      const validator = (value: string) => 'Error'
      const { result } = renderHook(() =>
        useInputHandler({ enableValidation: false, validator })
      )

      act(() => {
        result.current.updateValue('test')
      })

      expect(result.current.isValid).toBe(true)
      expect(result.current.error).toBeNull()
    })

    it('should debounce validation', async () => {
      const validator = vi.fn((value: string) => (value.length < 5 ? 'Too short' : null))
      const { result } = renderHook(() => useInputHandler({ validator, debounceMs: 100 }))

      act(() => {
        result.current.updateValue('hi')
      })

      // Should not validate immediately
      expect(validator).not.toHaveBeenCalled()

      await waitFor(() => {
        expect(validator).toHaveBeenCalled()
      }, { timeout: 200 })
    })
  })

  describe('history', () => {
    it('should add value to history', () => {
      const { result } = renderHook(() => useInputHandler({ enableHistory: true }))

      act(() => {
        result.current.addToHistory('test value')
      })

      expect(result.current.history).toHaveLength(1)
      expect(result.current.history[0].value).toBe('test value')
    })

    it('should limit history size', () => {
      const { result } = renderHook(() =>
        useInputHandler({ enableHistory: true, maxHistorySize: 2 })
      )

      act(() => {
        result.current.addToHistory('value1')
        result.current.addToHistory('value2')
        result.current.addToHistory('value3')
      })

      expect(result.current.history).toHaveLength(2)
      expect(result.current.history[0].value).toBe('value3')
    })

    it('should remove duplicates from history', () => {
      const { result } = renderHook(() => useInputHandler({ enableHistory: true }))

      act(() => {
        result.current.addToHistory('test')
        result.current.addToHistory('test')
      })

      expect(result.current.history).toHaveLength(1)
    })

    it('should select from history', () => {
      const { result } = renderHook(() => useInputHandler({ enableHistory: true }))

      act(() => {
        result.current.addToHistory('history value')
      })

      const historyItem = result.current.history[0]

      act(() => {
        result.current.selectFromHistory(historyItem)
      })

      expect(result.current.value).toBe('history value')
    })

    it('should clear history', () => {
      const { result } = renderHook(() => useInputHandler({ enableHistory: true }))

      act(() => {
        result.current.addToHistory('test')
        result.current.clearHistory()
      })

      expect(result.current.history).toHaveLength(0)
      expect(toast.success).toHaveBeenCalledWith('History cleared')
    })

    it('should not add empty values to history', () => {
      const { result } = renderHook(() => useInputHandler({ enableHistory: true }))

      act(() => {
        result.current.addToHistory('   ')
      })

      expect(result.current.history).toHaveLength(0)
    })
  })

  describe('clipboard operations', () => {
    it('should paste from clipboard', async () => {
      const { result } = renderHook(() => useInputHandler({ enableClipboard: true }))

      await act(async () => {
        await result.current.pasteFromClipboard()
      })

      expect(mockClipboard.readText).toHaveBeenCalled()
      expect(result.current.value).toBe('clipboard text')
      expect(toast.success).toHaveBeenCalledWith('Pasted from clipboard')
    })

    it('should handle clipboard paste errors', async () => {
      mockClipboard.readText.mockRejectedValue(new Error('Clipboard error'))
      const { result } = renderHook(() => useInputHandler({ enableClipboard: true }))

      await act(async () => {
        await result.current.pasteFromClipboard()
      })

      expect(toast.error).toHaveBeenCalledWith('Failed to paste from clipboard')
    })

    it('should copy to clipboard', async () => {
      const { result } = renderHook(() => useInputHandler({ enableClipboard: true }))

      act(() => {
        result.current.updateValue('test value')
      })

      await act(async () => {
        await result.current.copyToClipboard()
      })

      expect(mockClipboard.writeText).toHaveBeenCalledWith('test value')
      expect(toast.success).toHaveBeenCalledWith('Copied to clipboard')
    })

    it('should copy custom text to clipboard', async () => {
      const { result } = renderHook(() => useInputHandler({ enableClipboard: true }))

      await act(async () => {
        await result.current.copyToClipboard('custom text')
      })

      expect(mockClipboard.writeText).toHaveBeenCalledWith('custom text')
    })

    it('should not copy empty value', async () => {
      const { result } = renderHook(() => useInputHandler({ enableClipboard: true }))

      await act(async () => {
        await result.current.copyToClipboard()
      })

      expect(toast.error).toHaveBeenCalledWith('Nothing to copy')
    })

    it('should skip clipboard operations when disabled', async () => {
      const { result } = renderHook(() => useInputHandler({ enableClipboard: false }))

      await act(async () => {
        const pasted = await result.current.pasteFromClipboard()
        expect(pasted).toBe(false)
      })

      expect(mockClipboard.readText).not.toHaveBeenCalled()
    })
  })

  describe('text operations', () => {
    it('should clear input', () => {
      const { result } = renderHook(() => useInputHandler())

      act(() => {
        result.current.updateValue('test')
        result.current.clearInput()
      })

      expect(result.current.value).toBe('')
      expect(result.current.error).toBeNull()
      expect(result.current.isValid).toBe(true)
    })

    it('should insert text at cursor position', () => {
      const { result } = renderHook(() => useInputHandler())

      act(() => {
        result.current.updateValue('hello')
      })

      // Create a mock input element
      const mockInput = document.createElement('input')
      mockInput.value = 'hello'
      mockInput.selectionStart = 5
      mockInput.selectionEnd = 5
      result.current.inputRef.current = mockInput

      act(() => {
        result.current.insertText(' world')
      })

      expect(result.current.value).toBe('hello world')
    })

    it('should replace selected text', () => {
      const { result } = renderHook(() => useInputHandler())

      act(() => {
        result.current.updateValue('hello')
      })

      // Create a mock input element
      const mockInput = document.createElement('input')
      mockInput.value = 'hello'
      mockInput.selectionStart = 2
      mockInput.selectionEnd = 5
      result.current.inputRef.current = mockInput

      act(() => {
        result.current.replaceSelectedText('xxx')
      })

      expect(result.current.value).toBe('hexxx')
    })

    it('should get selected text', () => {
      const { result } = renderHook(() => useInputHandler())

      act(() => {
        result.current.updateValue('hello world')
      })

      // The selection state is managed internally, so we test getSelectedText directly
      const mockInput = document.createElement('input')
      mockInput.value = 'hello world'
      mockInput.selectionStart = 6
      mockInput.selectionEnd = 11
      result.current.inputRef.current = mockInput

      // Manually set selection state
      act(() => {
        result.current.inputProps.onSelect({ target: mockInput } as any)
      })

      expect(result.current.getSelectedText()).toBe('world')
    })
  })

  describe('focus management', () => {
    it('should track focus state', () => {
      const { result } = renderHook(() => useInputHandler())

      expect(result.current.isFocused).toBe(false)

      act(() => {
        result.current.inputProps.onFocus({} as any)
      })

      expect(result.current.isFocused).toBe(true)

      act(() => {
        result.current.inputProps.onBlur({} as any)
      })

      expect(result.current.isFocused).toBe(false)
    })
  })

  describe('statistics', () => {
    it('should calculate statistics', () => {
      const { result } = renderHook(() => useInputHandler())

      act(() => {
        result.current.updateValue('hello world')
        result.current.addToHistory('test')
      })

      expect(result.current.stats.length).toBe(11)
      expect(result.current.stats.words).toBe(2)
      expect(result.current.stats.lines).toBe(1)
      expect(result.current.stats.historySize).toBe(1)
    })
  })

  describe('parser', () => {
    it('should parse input', () => {
      const parser = (value: string) => JSON.parse(value)
      const { result } = renderHook(() => useInputHandler({ parser }))

      const parsed = result.current.parseInput('{"key": "value"}')
      expect(parsed).toEqual({ key: 'value' })
    })

    it('should handle parser errors gracefully', () => {
      const parser = () => {
        throw new Error('Parse error')
      }
      const { result } = renderHook(() => useInputHandler({ parser }))

      const parsed = result.current.parseInput('invalid')
      expect(parsed).toBe('invalid')
    })
  })
})

describe('useTextAreaHandler', () => {
  it('should extend useInputHandler', () => {
    const { result } = renderHook(() => useTextAreaHandler())

    expect(result.current.value).toBe('')
    expect(result.current.insertLine).toBeDefined()
    expect(result.current.indentLine).toBeDefined()
    expect(result.current.outdentLine).toBeDefined()
  })

  it('should insert new line', () => {
    const { result } = renderHook(() => useTextAreaHandler())

    act(() => {
      result.current.updateValue('line1')
    })

    const mockTextarea = document.createElement('textarea')
    mockTextarea.value = 'line1'
    mockTextarea.selectionStart = 5
    mockTextarea.selectionEnd = 5
    result.current.inputRef.current = mockTextarea

    act(() => {
      result.current.insertLine()
    })

    expect(result.current.value).toBe('line1\n')
  })

  it('should indent line', () => {
    const { result } = renderHook(() => useTextAreaHandler())

    act(() => {
      result.current.updateValue('line1')
    })

    const mockTextarea = document.createElement('textarea')
    mockTextarea.value = 'line1'
    mockTextarea.selectionStart = 5
    mockTextarea.selectionEnd = 5
    result.current.inputRef.current = mockTextarea

    act(() => {
      result.current.indentLine()
    })

    expect(result.current.value).toContain('  ')
  })

  it('should outdent line', () => {
    const { result } = renderHook(() => useTextAreaHandler())

    act(() => {
      result.current.updateValue('  line1')
    })

    const mockTextarea = document.createElement('textarea')
    mockTextarea.value = '  line1'
    mockTextarea.selectionStart = 0
    mockTextarea.selectionEnd = 0
    result.current.inputRef.current = mockTextarea

    act(() => {
      result.current.outdentLine()
    })

    expect(result.current.value).toBe('line1')
  })
})

describe('useNumberInputHandler', () => {
  it('should validate number input', async () => {
    const { result } = renderHook(() => useNumberInputHandler({ min: 0, max: 100, debounceMs: 50 }))

    act(() => {
      result.current.updateValue('50')
    })

    await waitFor(() => {
      expect(result.current.isValid).toBe(true)
    }, { timeout: 200 })

    act(() => {
      result.current.updateValue('150')
    })

    await waitFor(() => {
      expect(result.current.isValid).toBe(false)
      expect(result.current.error).toContain('at most 100')
    }, { timeout: 200 })
  })

  it('should format number with precision', () => {
    const { result } = renderHook(() => useNumberInputHandler({ precision: 2 }))

    act(() => {
      result.current.updateValue('3.14159')
    })

    expect(result.current.value).toBe('3.14')
  })

  it('should increment value', () => {
    const { result } = renderHook(() => useNumberInputHandler({ step: 5 }))

    act(() => {
      result.current.updateValue('10')
    })

    act(() => {
      result.current.increment()
    })

    expect(result.current.numberValue).toBe(15)
  })

  it('should decrement value', () => {
    const { result } = renderHook(() => useNumberInputHandler({ step: 5 }))

    act(() => {
      result.current.updateValue('10')
    })

    act(() => {
      result.current.decrement()
    })

    expect(result.current.numberValue).toBe(5)
  })

  it('should clamp increment to max', () => {
    const { result } = renderHook(() => useNumberInputHandler({ max: 100, step: 50 }))

    act(() => {
      result.current.updateValue('80')
    })

    act(() => {
      result.current.increment()
    })

    expect(result.current.numberValue).toBe(100)
  })

  it('should clamp decrement to min', () => {
    const { result } = renderHook(() => useNumberInputHandler({ min: 0, step: 5 }))

    act(() => {
      result.current.updateValue('3')
    })

    act(() => {
      result.current.decrement()
    })

    expect(result.current.numberValue).toBe(0)
  })
})

