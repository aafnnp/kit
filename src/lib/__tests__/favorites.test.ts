import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFavorites, useRecentTools, useToolSearch } from '@/lib/favorites'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useFavorites', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty favorites', () => {
    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toEqual([])
  })

  it('should load favorites from localStorage', () => {
    const favorites = [
      { slug: 'tool1', name: 'Tool 1', desc: 'Description 1' },
      { slug: 'tool2', name: 'Tool 2', desc: 'Description 2' },
    ]
    localStorage.setItem('kit-favorites', JSON.stringify(favorites))

    const { result } = renderHook(() => useFavorites())
    expect(result.current.favorites).toEqual(favorites)
  })

  it('should add tool to favorites', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.addToFavorites({
        slug: 'tool1',
        name: 'Tool 1',
        desc: 'Description 1',
      })
    })

    expect(result.current.favorites).toHaveLength(1)
    expect(result.current.favorites[0].slug).toBe('tool1')
    expect(localStorage.getItem('kit-favorites')).toBeTruthy()
  })

  it('should not add duplicate tool to favorites', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.addToFavorites({
        slug: 'tool1',
        name: 'Tool 1',
        desc: 'Description 1',
      })
    })

    act(() => {
      result.current.addToFavorites({
        slug: 'tool1',
        name: 'Tool 1',
        desc: 'Description 1',
      })
    })

    expect(result.current.favorites).toHaveLength(1)
  })

  it('should remove tool from favorites', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.addToFavorites({
        slug: 'tool1',
        name: 'Tool 1',
        desc: 'Description 1',
      })
    })

    act(() => {
      result.current.removeFromFavorites('tool1')
    })

    expect(result.current.favorites).toHaveLength(0)
  })

  it('should check if tool is favorite', () => {
    const { result } = renderHook(() => useFavorites())

    act(() => {
      result.current.addToFavorites({
        slug: 'tool1',
        name: 'Tool 1',
        desc: 'Description 1',
      })
    })

    expect(result.current.isFavorite('tool1')).toBe(true)
    expect(result.current.isFavorite('tool2')).toBe(false)
  })

  it('should toggle favorite status', () => {
    const { result } = renderHook(() => useFavorites())

    const tool = {
      slug: 'tool1',
      name: 'Tool 1',
      desc: 'Description 1',
    }

    act(() => {
      result.current.toggleFavorite(tool)
    })

    expect(result.current.isFavorite('tool1')).toBe(true)

    act(() => {
      result.current.toggleFavorite(tool)
    })

    expect(result.current.isFavorite('tool1')).toBe(false)
  })
})

describe('useRecentTools', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('should initialize with empty recent tools', () => {
    const { result } = renderHook(() => useRecentTools())
    expect(result.current.recentTools).toEqual([])
  })

  it('should add tool to recent', () => {
    const { result } = renderHook(() => useRecentTools())

    act(() => {
      result.current.addToRecent({
        slug: 'tool1',
        name: 'Tool 1',
        desc: 'Description 1',
      })
    })

    expect(result.current.recentTools).toHaveLength(1)
    expect(result.current.recentTools[0].slug).toBe('tool1')
    expect(result.current.recentTools[0].lastUsed).toBeGreaterThan(0)
  })

  it('should update existing tool and move to front', () => {
    const { result } = renderHook(() => useRecentTools())

    const tool = {
      slug: 'tool1',
      name: 'Tool 1',
      desc: 'Description 1',
    }

    act(() => {
      result.current.addToRecent(tool)
    })

    const firstTime = result.current.recentTools[0].lastUsed

    // Wait a bit
    vi.useFakeTimers()
    vi.advanceTimersByTime(1000)

    act(() => {
      result.current.addToRecent(tool)
    })

    const secondTime = result.current.recentTools[0].lastUsed
    expect(secondTime).toBeGreaterThan(firstTime)
    expect(result.current.recentTools).toHaveLength(1)

    vi.useRealTimers()
  })

  it('should limit recent tools to MAX_RECENT', () => {
    const { result } = renderHook(() => useRecentTools())

    // Add more than MAX_RECENT tools
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.addToRecent({
          slug: `tool${i}`,
          name: `Tool ${i}`,
          desc: `Description ${i}`,
        })
      })
    }

    expect(result.current.recentTools.length).toBeLessThanOrEqual(10)
  })

  it('should clear recent tools', () => {
    const { result } = renderHook(() => useRecentTools())

    act(() => {
      result.current.addToRecent({
        slug: 'tool1',
        name: 'Tool 1',
        desc: 'Description 1',
      })
    })

    act(() => {
      result.current.clearRecent()
    })

    expect(result.current.recentTools).toHaveLength(0)
    expect(localStorage.getItem('kit-recent')).toBeNull()
  })
})

describe('useToolSearch', () => {
  const mockTools = [
    {
      id: 'category1',
      tools: [
        { slug: 'json-formatter', name: 'JSON Formatter', desc: 'Format JSON' },
        { slug: 'base64-encode', name: 'Base64 Encode', desc: 'Encode to Base64' },
      ],
    },
    {
      id: 'category2',
      tools: [{ slug: 'color-picker', name: 'Color Picker', desc: 'Pick colors' }],
    },
  ]

  it('should initialize with all tools', () => {
    const { result } = renderHook(() => useToolSearch(mockTools))
    expect(result.current.filteredTools).toEqual(mockTools)
  })

  it('should filter tools by name', () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery('JSON')
    })

    expect(result.current.filteredTools).toHaveLength(1)
    expect(result.current.filteredTools[0].tools).toHaveLength(1)
    expect(result.current.filteredTools[0].tools[0].slug).toBe('json-formatter')
  })

  it('should filter tools by slug', () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery('base64')
    })

    expect(result.current.filteredTools).toHaveLength(1)
    expect(result.current.filteredTools[0].tools[0].slug).toBe('base64-encode')
  })

  it('should filter case-insensitively', () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery('COLOR')
    })

    expect(result.current.filteredTools).toHaveLength(1)
    expect(result.current.filteredTools[0].tools[0].slug).toBe('color-picker')
  })

  it('should return empty when no matches', () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery('nonexistent')
    })

    expect(result.current.filteredTools).toHaveLength(0)
  })

  it('should return all tools when search is cleared', () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery('JSON')
    })

    act(() => {
      result.current.setSearchQuery('')
    })

    expect(result.current.filteredTools).toEqual(mockTools)
  })
})
