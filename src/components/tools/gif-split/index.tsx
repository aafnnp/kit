import React, { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import i18n from "@/locales"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Upload, Download, Loader2, FileImage, Trash2, BarChart3, Image as ImageIcon, Layers } from "lucide-react"
// @ts-ignore
import { parseGIF, decompressFrames } from "gifuct-js"
import { nanoid } from "nanoid"
import type { GifFile, GifFrame, GifStats } from "@/components/tools/gif-split/schema"
import { formatFileSize } from "@/lib/utils"
import { zipSync } from "fflate"

// 工具函数

const validateGifFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.type !== "image/gif") return { isValid: false, error: i18n.t("gifSplit.file-type-error") }
  if (file.size > maxSize) return { isValid: false, error: i18n.t("gifSplit.file-too-large") }
  return { isValid: true }
}

// 自定义 hook：拖拽/文件选择
const useDragAndDrop = (onFiles: (files: File[]) => void) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }, [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "image/gif")
      if (files.length) onFiles(files)
      else toast.error(i18n.t("gifSplit.invalid-file-type"))
    },
    [onFiles]
  )
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length) onFiles(files)
      if (fileInputRef.current) fileInputRef.current.value = ""
    },
    [onFiles]
  )
  return { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput }
}

// 自定义 hook：GIF 解析与帧提取
const useGifSplit = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const processGif = useCallback(async (file: File): Promise<{ frames: GifFrame[]; stats: GifStats }> => {
    setIsProcessing(true)
    setProgress(0)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const gif = parseGIF(arrayBuffer)
      const framesRaw = decompressFrames(gif, true)
      const frames: GifFrame[] = []
      let duration = 0
      for (let i = 0; i < framesRaw.length; i++) {
        const f = framesRaw[i]
        duration += f.delay || 0
        // 渲染帧到 canvas
        const canvas = document.createElement("canvas")
        canvas.width = f.dims.width
        canvas.height = f.dims.height
        const ctx = canvas.getContext("2d")!
        const imageData = ctx.createImageData(f.dims.width, f.dims.height)
        imageData.data.set(f.patch)
        ctx.putImageData(imageData, 0, 0)
        const imageDataUrl = canvas.toDataURL("image/png")
        frames.push({
          index: i,
          imageDataUrl,
          delay: f.delay || 0,
          width: f.dims.width,
          height: f.dims.height,
          disposalType: f.disposalType,
        })
        setProgress(Math.round(((i + 1) / framesRaw.length) * 100))
      }
      setIsProcessing(false)
      setProgress(100)
      return {
        frames,
        stats: {
          frameCount: frames.length,
          duration,
          width: frames[0]?.width || 0,
          height: frames[0]?.height || 0,
          fileSize: file.size,
          avgDelay: duration / (frames.length || 1),
        },
      }
    } catch (e: any) {
      setIsProcessing(false)
      setProgress(0)
      throw new Error(e?.message || i18n.t("gifSplit.parse-failed"))
    }
  }, [])
  return { isProcessing, progress, processGif }
}

// 主组件
const GifSplit = () => {
  const { t } = useTranslation()
  const [gifs, setGifs] = useState<GifFile[]>([])
  const { isProcessing, progress, processGif } = useGifSplit()
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(async (files) => {
    const newGifs: GifFile[] = []
    for (const file of files) {
      const valid = validateGifFile(file)
      if (!valid.isValid) {
        toast.error(`${file.name}: ${valid.error}`)
        continue
      }
      const id = nanoid()
      newGifs.push({ id, file, name: file.name, size: file.size, type: file.type, status: "pending" })
    }
    if (newGifs.length) setGifs((prev) => [...prev, ...newGifs])
  })

  // 批量处理
  const handleBatchSplit = async () => {
    for (const gif of gifs) {
      if (gif.status !== "pending") continue
      setGifs((prev) => prev.map((g) => (g.id === gif.id ? { ...g, status: "processing", error: undefined } : g)))
      try {
        const { frames, stats } = await processGif(gif.file)
        setGifs((prev) => prev.map((g) => (g.id === gif.id ? { ...g, status: "completed", frames, stats } : g)))
        toast.success(t("gifSplit.split-success", { name: gif.name, count: frames.length }))
      } catch (e: any) {
        setGifs((prev) => prev.map((g) => (g.id === gif.id ? { ...g, status: "error", error: e.message } : g)))
        toast.error(t("gifSplit.parse-error", { name: gif.name, error: e.message }))
      }
    }
  }

  // 导出单帧
  const handleExportFrame = (frame: GifFrame, name: string, format: "png" | "jpeg") => {
    const link = document.createElement("a")
    link.href = frame.imageDataUrl.replace("image/png", `image/${format}`)
    link.download = `${name}_frame${frame.index + 1}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(t("gifSplit.export-frame-success", { index: frame.index + 1 }))
  }

  // 导出所有帧为 zip
  const handleExportAllFrames = async (gif: GifFile, format: "png" | "jpeg") => {
    if (!gif.frames) return

    const zipData: Record<string, Uint8Array> = {}

    gif.frames.forEach((frame) => {
      const base64 = frame.imageDataUrl.split(",")[1]
      const binaryString = atob(base64)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
      zipData[`${gif.name}_frame${frame.index + 1}.${format}`] = bytes
    })

    const zipped = zipSync(zipData)
    // 将 Uint8Array 安全复制到新的 ArrayBuffer，确保类型为 ArrayBuffer
    const ab = new ArrayBuffer(zipped.byteLength)
    new Uint8Array(ab).set(zipped)
    const blob = new Blob([ab], { type: "application/zip" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${gif.name}_frames.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setTimeout(() => URL.revokeObjectURL(url), 60_000) // 延后释放，同步 revoke 会取消下载
    toast.success(t("gifSplit.export-all-success"))
  }

  // 移除 GIF
  const handleRemoveGif = (id: string) => {
    setGifs((prev) => prev.filter((g) => g.id !== id))
  }

  // 清空全部
  const handleClearAll = () => {
    setGifs([])
    toast.success(t("gifSplit.clear-success"))
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 跳转主内容（无障碍） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        {t("skipToContent")}
      </a>
      <div
        id="main-content"
        className="flex flex-col gap-4"
      >
        {/* 头部 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              {t("gifSplit.title")}
            </CardTitle>
            <CardDescription>
              {t("gifSplit.description")}
            </CardDescription>
          </CardHeader>
        </Card>
        {/* 上传区 */}
        <Card>
          <CardContent className="pt-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("gifSplit.upload-title")}</h3>
              <p className="text-muted-foreground mb-4">{t("gifSplit.upload-desc")}</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-2"
              >
                <FileImage className="mr-2 h-4 w-4" />
                {t("gifSplit.select-file")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("gifSplit.upload-hint")}</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/gif"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
        {/* 操作按钮 */}
        {gifs.length > 0 && (
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleBatchSplit}
                disabled={isProcessing || gifs.every((g) => g.status !== "pending")}
                className="min-w-32"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("gifSplit.processing")}
                  </>
                ) : (
                  t("gifSplit.batch-split")
                )}
              </Button>
              <Button
                onClick={handleClearAll}
                variant="destructive"
                disabled={isProcessing}
              >
                {" "}
                <Trash2 className="mr-2 h-4 w-4" />
                {t("gifSplit.clear-all")}
              </Button>
            </CardContent>
          </Card>
        )}
        {/* GIF 列表 */}
        {gifs.length > 0 &&
          gifs.map((gif) => (
            <Card
              key={gif.id}
              className="overflow-x-auto"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {gif.name}
                </CardTitle>
                <CardDescription>
                  {t("gifSplit.size")}: {formatFileSize(gif.size)}
                  {gif.stats && (
                    <>
                      {" "}
                      • {t("gifSplit.frame-count")}: {gif.stats.frameCount} • {t("gifSplit.duration")}:{" "}
                      {(gif.stats.duration / 1000).toFixed(2)}s • {t("gifSplit.resolution")}:{" "}
                      {gif.stats.width}x{gif.stats.height}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 进度/状态 */}
                <div className="mb-2 flex items-center gap-4">
                  {gif.status === "processing" && (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-blue-500" /> {t("gifSplit.progress")}: {progress}%
                    </>
                  )}
                  {gif.status === "completed" && <span className="text-green-600">{t("gifSplit.completed")}</span>}
                  {gif.status === "error" && <span className="text-red-600">{t("gifSplit.error")}: {gif.error}</span>}
                  {gif.status === "pending" && <span className="text-blue-600">{t("gifSplit.pending")}</span>}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveGif(gif.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* 帧预览与导出 */}
                {gif.frames && (
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 py-2">
                      {gif.frames.map((frame) => (
                        <div
                          key={frame.index}
                          className="flex flex-col items-center gap-1"
                        >
                          <img
                            src={frame.imageDataUrl}
                            alt={t("gifSplit.frame-alt", { index: frame.index + 1 })}
                            className="w-20 h-20 object-contain border rounded cursor-pointer"
                          />
                          <span className="text-xs text-muted-foreground">
                            {t("gifSplit.frame-alt", { index: frame.index + 1 })}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportFrame(frame, gif.name, "png")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={() => handleExportAllFrames(gif, "png")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t("gifSplit.export-png-zip")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleExportAllFrames(gif, "jpeg")}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        {t("gifSplit.export-jpeg-zip")}
                      </Button>
                    </div>
                  </div>
                )}
                {/* 统计分析 */}
                {gif.stats && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-6">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      {t("gifSplit.stats-summary", {
                        frameCount: gif.stats.frameCount,
                        duration: (gif.stats.duration / 1000).toFixed(2),
                        avgDelay: gif.stats.avgDelay.toFixed(1),
                        width: gif.stats.width,
                        height: gif.stats.height,
                        fileSize: formatFileSize(gif.stats.fileSize),
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}

export default GifSplit
