import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFavorites, useRecentTools, useToolSearch } from "@/hooks/use-favorites"

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

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("Integration: Favorites and Recent Tools", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("should work together - add to favorites and recent", () => {
    const { result: favoritesResult } = renderHook(() => useFavorites())
    const { result: recentResult } = renderHook(() => useRecentTools())

    const tool = {
      slug: "json-pretty",
      name: "JSON Formatter",
      desc: "Format JSON",
    }

    act(() => {
      favoritesResult.current.addToFavorites(tool)
      recentResult.current.addToRecent(tool)
    })

    expect(favoritesResult.current.isFavorite("json-pretty")).toBe(true)
    expect(recentResult.current.recentTools).toHaveLength(1)
    expect(recentResult.current.recentTools[0].slug).toBe("json-pretty")
  })

  it("should maintain consistency between favorites and recent", () => {
    const { result: favoritesResult } = renderHook(() => useFavorites())
    const { result: recentResult } = renderHook(() => useRecentTools())

    const tool = {
      slug: "base64-encode",
      name: "Base64 Encode",
      desc: "Encode to Base64",
    }

    act(() => {
      favoritesResult.current.addToFavorites(tool)
      recentResult.current.addToRecent(tool)
    })

    // Remove from favorites
    act(() => {
      favoritesResult.current.removeFromFavorites("base64-encode")
    })

    // Recent should still exist
    expect(recentResult.current.recentTools).toHaveLength(1)
    expect(favoritesResult.current.isFavorite("base64-encode")).toBe(false)
  })
})

describe("Integration: Tool Search and Filtering", () => {
  const mockTools = [
    {
      id: "format",
      name: "Format",
      tools: [
        { slug: "json-pretty", name: "JSON Formatter", desc: "Format JSON" },
        { slug: "base64-encode", name: "Base64 Encode", desc: "Encode to Base64" },
      ],
    },
    {
      id: "convert",
      name: "Convert",
      tools: [
        { slug: "color-picker", name: "Color Picker", desc: "Pick colors" },
        { slug: "qr-generator", name: "QR Generator", desc: "Generate QR codes" },
      ],
    },
  ]

  it("should filter tools across multiple categories", () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery("json")
    })

    expect(result.current.filteredTools).toHaveLength(1)
    expect(result.current.filteredTools[0].id).toBe("format")
    expect(result.current.filteredTools[0].tools).toHaveLength(1)
  })

  it("should filter tools by partial match", () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery("64")
    })

    expect(result.current.filteredTools).toHaveLength(1)
    expect(result.current.filteredTools[0].tools[0].slug).toBe("base64-encode")
  })

  it("should handle empty search query", () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery("")
    })

    expect(result.current.filteredTools).toEqual(mockTools)
    expect(result.current.searchQuery).toBe("")
  })

  it("should filter out empty categories", () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery("nonexistent-tool")
    })

    expect(result.current.filteredTools).toHaveLength(0)
  })

  it("should be case-insensitive", () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery("JSON")
    })

    expect(result.current.filteredTools).toHaveLength(1)
    expect(result.current.filteredTools[0].tools[0].slug).toBe("json-pretty")
  })

  it("should update search query", () => {
    const { result } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      result.current.setSearchQuery("json")
    })

    expect(result.current.searchQuery).toBe("json")

    act(() => {
      result.current.setSearchQuery("color")
    })

    expect(result.current.searchQuery).toBe("color")
    expect(result.current.filteredTools[0].tools[0].slug).toBe("color-picker")
  })
})

describe("Integration: Search with Favorites and Recent", () => {
  const mockTools = [
    {
      id: "format",
      name: "Format",
      tools: [
        { slug: "json-pretty", name: "JSON Formatter", desc: "Format JSON" },
        { slug: "base64-encode", name: "Base64 Encode", desc: "Encode to Base64" },
      ],
    },
  ]

  it("should search across favorites", () => {
    const { result: favoritesResult } = renderHook(() => useFavorites())
    const { result: searchResult } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      favoritesResult.current.addToFavorites({
        slug: "json-pretty",
        name: "JSON Formatter",
        desc: "Format JSON",
      })
    })

    act(() => {
      searchResult.current.setSearchQuery("json")
    })

    expect(searchResult.current.filteredTools).toHaveLength(1)
    expect(favoritesResult.current.isFavorite("json-pretty")).toBe(true)
  })

  it("should search across recent tools", () => {
    const { result: recentResult } = renderHook(() => useRecentTools())
    const { result: searchResult } = renderHook(() => useToolSearch(mockTools))

    act(() => {
      recentResult.current.addToRecent({
        slug: "base64-encode",
        name: "Base64 Encode",
        desc: "Encode to Base64",
      })
    })

    act(() => {
      searchResult.current.setSearchQuery("base64")
    })

    expect(searchResult.current.filteredTools).toHaveLength(1)
    expect(recentResult.current.recentTools).toHaveLength(1)
  })
})
