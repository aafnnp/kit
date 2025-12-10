import React from "react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import ApiTester from "../index"

// 简单 mock 翻译函数，直接返回回退文案
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
  }),
}))

// 只需要暴露 copyToClipboard，避免触发真实 clipboard API
const copySpy = vi.fn()
vi.mock("@/hooks/use-clipboard", () => ({
  useCopyToClipboard: () => ({
    copyToClipboard: copySpy,
  }),
}))

const fetchMock = vi.fn()

// jsdom 下缺失 AbortSignal.timeout 时提供最小兜底
const ensureAbortTimeout = () => {
  if (!(AbortSignal as any).timeout) {
    ;(AbortSignal as any).timeout = (ms: number) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), ms)
      return controller.signal
    }
  }
}

describe("ApiTester 集成", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockReset()
    globalThis.fetch = fetchMock as unknown as typeof fetch
    ensureAbortTimeout()
  })

  it("发送请求后展示响应并包含查询参数与请求头", async () => {
    const user = userEvent.setup()
    const mockBody = JSON.stringify({ ok: true }, null, 2)
    const mockResponse = new Response(mockBody, {
      status: 200,
      statusText: "OK",
      headers: {
        "content-type": "application/json",
        "x-test-header": "value",
      },
    })
    fetchMock.mockResolvedValueOnce(mockResponse)

    render(<ApiTester />)

    await user.click(screen.getByRole("button", { name: /POST Create/i }))

    const urlInput = screen.getByPlaceholderText("Enter request URL...")
    await user.clear(urlInput)
    await user.type(urlInput, "https://example.com/api")

    await user.click(screen.getByRole("button", { name: /Parameters/i }))
    await user.type(screen.getByPlaceholderText("Key"), "foo")
    await user.type(screen.getByPlaceholderText("Value"), "bar")

    await user.click(screen.getByRole("button", { name: /Headers/i }))
    await user.type(screen.getByPlaceholderText("Header name"), "X-Test")
    await user.type(screen.getByPlaceholderText("Header value"), "123")

    await user.click(screen.getByRole("button", { name: /Send/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.com/api?foo=bar",
      expect.objectContaining({
        method: "POST",
        headers: { "X-Test": "123" },
        body: expect.stringContaining("John Doe"),
      })
    )

    await waitFor(() => expect(screen.getByText(/200 OK/i)).toBeDefined())

    const responseArea = await screen.findByDisplayValue(/"ok": true/)
    expect(responseArea).toBeDefined()
  })

  it("请求失败时展示错误信息", async () => {
    const user = userEvent.setup()
    fetchMock.mockRejectedValueOnce(new Error("Request failed"))

    render(<ApiTester />)

    const urlInput = screen.getByPlaceholderText("Enter request URL...")
    await user.type(urlInput, "https://error.test")

    await user.click(screen.getByRole("button", { name: /Send/i }))

    await waitFor(() => expect(screen.getByText("Request failed")).toBeDefined())
  })
})

