import React from "react"
import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import AudioConvert from "../index"

const mockAnalyzeAudio = vi.fn()
const convertAudiosSpy = vi.fn()
let progressCb: ((id: string, progress: number) => void) | undefined
let completeCb:
  | ((
      id: string,
      result: {
        url: string
        size: number
        format: string
        duration: number
        bitrate?: number
        sampleRate?: number
        channels?: number
      }
    ) => void)
  | undefined

const createMockFile = () => new File([new Uint8Array([1, 2, 3])], "sample.mp3", { type: "audio/mpeg", lastModified: Date.now() })

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}))

vi.mock("@/hooks/use-clipboard", () => ({
  useCopyToClipboard: () => ({
    copyDataToClipboard: vi.fn(),
  }),
}))

vi.mock("@/hooks/use-keyboard-shortcuts", () => ({
  useKeyboardShortcuts: vi.fn(),
  createCommonShortcuts: (handlers: any) => handlers,
}))

vi.mock("@/hooks/use-history", () => ({
  useHistory: () => ({
    history: [],
    addToHistory: vi.fn(),
    clearHistory: vi.fn(),
  }),
}))

vi.mock("@/components/common/file-upload-area", () => ({
  FileUploadArea: ({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) => (
    <button onClick={() => onFilesSelected([createMockFile()])}>Mock Upload</button>
  ),
}))

vi.mock("../hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../hooks")>()
  return {
    ...actual,
    useAudioAnalysis: () => ({
      analyzeAudio: mockAnalyzeAudio,
      isAnalyzing: false,
    }),
    useAudioConversion: (
      onProgress?: (id: string, progress: number) => void,
      onComplete?: (id: string, result: any) => void,
      onError?: (id: string, error: string) => void
    ) => {
      progressCb = onProgress
      completeCb = onComplete
      return {
        convertAudios: convertAudiosSpy,
        isProcessing: false,
        progress: 0,
        cancelProcessing: vi.fn(),
      }
    },
  }
})

describe("AudioConvert 集成", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAnalyzeAudio.mockResolvedValue({
      duration: 1,
      bitrate: 128,
      sampleRate: 44100,
      channels: 2,
      fileSize: 1024,
      format: "mp3",
    })
    convertAudiosSpy.mockImplementation(async (audios: any[], settings: any) => {
      audios.forEach((audio) => {
        progressCb?.(audio.id, 50)
        completeCb?.(audio.id, {
          url: `blob:${audio.id}`,
          size: 512,
          format: settings.format,
          duration: 1,
        })
      })
    })
    URL.createObjectURL = vi.fn(() => "blob:mock-url")
    URL.revokeObjectURL = vi.fn()
  })

  it("上传后可批量转换并展示已转换的音频", async () => {
    const user = userEvent.setup()

    render(<AudioConvert />)

    await user.click(screen.getByRole("button", { name: "Mock Upload" }))

    await waitFor(() => expect(screen.getByText("sample.mp3")).toBeDefined())

    const convertButton = screen.getByRole("button", { name: /Convert All/i })
    await user.click(convertButton)

    await waitFor(() => expect(convertAudiosSpy).toHaveBeenCalledTimes(1))
    expect(convertAudiosSpy).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "sample.mp3" })]),
      expect.objectContaining({ format: "mp3" })
    )

    await waitFor(() => expect(screen.getByText(/Completed/i)).toBeDefined())

    expect(screen.getByRole("button", { name: /Export ZIP/i })).toBeDefined()
    expect(screen.getByRole("button", { name: /^Export$/i })).toBeDefined()
  })
})
