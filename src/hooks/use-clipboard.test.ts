import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useCopyToClipboard } from "./use-clipboard"

describe("useCopyToClipboard", () => {
  let writeText: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("writes to the clipboard and exposes a copied label", async () => {
    const { result } = renderHook(() => useCopyToClipboard(2000))

    await act(async () => {
      await result.current.copyToClipboard("hello", "greeting")
    })

    expect(writeText).toHaveBeenCalledWith("hello")
    expect(result.current.copiedText).toBe("greeting")
  })

  it("clears the copied label after the reset delay", async () => {
    const { result } = renderHook(() => useCopyToClipboard(2000))

    await act(async () => {
      await result.current.copyToClipboard("hello", "greeting")
    })

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.copiedText).toBeNull()
  })

  it("does not let a stale timer clear a newer copy (rapid double copy)", async () => {
    const { result } = renderHook(() => useCopyToClipboard(2000))

    await act(async () => {
      await result.current.copyToClipboard("a", "first")
    })

    // 过了 1.5s 再复制第二次
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    await act(async () => {
      await result.current.copyToClipboard("b", "second")
    })

    // 此时距第一次复制已满 2s。若旧定时器没被清掉，提示会被提前清空
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.copiedText).toBe("second")

    // 第二次复制满 2s 后才应复位
    await act(async () => {
      vi.advanceTimersByTime(1500)
    })
    expect(result.current.copiedText).toBeNull()
  })

  it("clears the pending timer on unmount", async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout")
    const { result, unmount } = renderHook(() => useCopyToClipboard(2000))

    await act(async () => {
      await result.current.copyToClipboard("x", "label")
    })

    clearTimeoutSpy.mockClear()
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()

    // 卸载后定时器再触发也不应报错（React 18+ 对已卸载组件 setState 是 no-op）
    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    clearTimeoutSpy.mockRestore()
  })

  it("reports a clipboard failure without setting the copied label", async () => {
    writeText.mockRejectedValueOnce(new Error("denied"))
    const { result } = renderHook(() => useCopyToClipboard(2000))

    await act(async () => {
      await result.current.copyToClipboard("hello", "greeting")
    })

    expect(result.current.copiedText).toBeNull()
  })
})
