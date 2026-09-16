import React, { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import i18n from "@/locales"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Upload, Download, Loader2, Trash2, BarChart3 } from "lucide-react"
import { nanoid } from "nanoid"
import type { ImageToPdfFile, ImageToPdfSettings, ImageToPdfStats } from "@/components/tools/image-to-pdf/schema"

// Dynamic import for pdf-lib to reduce initial bundle size
let pdfLibModule: typeof import("pdf-lib") | null = null
const loadPdfLib = async (): Promise<typeof import("pdf-lib")> => {
  if (!pdfLibModule) {
    pdfLibModule = await import("pdf-lib")
  }
  return pdfLibModule
}

// 默认设置
const defaultSettings: ImageToPdfSettings = {
  pageSize: "A4",
  orientation: "portrait",
  margin: 10,
  quality: 0.92,
  batch: false,
}

// 生成唯一 ID

// hook: 管理图片文件
function useImageFiles() {
  const [files, setFiles] = useState<ImageToPdfFile[]>([])
  const [error, setError] = useState<string | null>(null)

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const arr = Array.from(fileList)
    const newFiles: ImageToPdfFile[] = arr.map((file) => ({
      id: nanoid(),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  return { files, setFiles, addFiles, removeFile, clearFiles, error, setError }
}

// PDF 纸张尺寸映射
const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89], // pt
  A5: [419.53, 595.28],
  Letter: [612, 792],
  Legal: [612, 1008],
}

const getPageSize = (size: string, orientation: string): [number, number] => {
  const [w, h] = PAGE_SIZES[size] || PAGE_SIZES["A4"]
  return orientation === "landscape" ? [h, w] : [w, h]
}

// PDF 生成核心逻辑
async function imagesToPdf(
  files: ImageToPdfFile[],
  settings: ImageToPdfSettings,
  onProgress?: (p: number) => void
): Promise<Uint8Array> {
  const { PDFDocument } = await loadPdfLib()
  const pdfDoc = await PDFDocument.create()
  const [pageWidth, pageHeight] = getPageSize(settings.pageSize, settings.orientation)
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const imgBytes = await file.file.arrayBuffer()
    let img
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      img = await pdfDoc.embedJpg(imgBytes)
    } else if (file.type === "image/png") {
      img = await pdfDoc.embedPng(imgBytes)
    } else {
      // 其它格式转为 PNG
      toast.warning(i18n.t("imageToPdf.format-convert-warning"))
      img = await pdfDoc.embedPng(imgBytes)
    }
    const imgDims = img.scale(1)
    // 计算图片缩放与居中
    const margin = settings.margin
    const maxW = pageWidth - margin * 2
    const maxH = pageHeight - margin * 2
    let drawW = imgDims.width,
      drawH = imgDims.height
    const ratio = Math.min(maxW / imgDims.width, maxH / imgDims.height, 1)
    drawW = imgDims.width * ratio
    drawH = imgDims.height * ratio
    const x = (pageWidth - drawW) / 2
    const y = (pageHeight - drawH) / 2
    const page = pdfDoc.addPage([pageWidth, pageHeight])
    page.drawImage(img, { x, y, width: drawW, height: drawH })
    if (onProgress) onProgress((i + 1) / files.length)
  }
  return await pdfDoc.save()
}

// 主组件结构
const ImageToPdf = () => {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<ImageToPdfSettings>(defaultSettings)
  const { files, addFiles, removeFile, clearFiles, error, setError } = useImageFiles()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<ImageToPdfStats | null>(null)

  // 拖拽上传
  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files)
      }
    },
    [addFiles]
  )

  // 文件选择
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files)
      }
    },
    [addFiles]
  )

  // PDF 生成与导出
  const handleExport = useCallback(async () => {
    if (files.length === 0) return
    setLoading(true)
    setProgress(0)
    setError(null)
    try {
      const t0 = performance.now()
      const pdfBytes = await imagesToPdf(files, settings, setProgress)
      const t1 = performance.now()
      // 将 Uint8Array 安全复制到新的 ArrayBuffer，确保类型为 ArrayBuffer
      const ab = new ArrayBuffer(pdfBytes.byteLength)
      new Uint8Array(ab).set(pdfBytes)
      const blob = new Blob([ab], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "images.pdf"
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 60_000) // 延后释放，同步 revoke 会取消下载
      setStats({
        totalImages: files.length,
        totalSize: files.reduce((s, f) => s + f.size, 0),
        pdfSize: blob.size,
        pageCount: files.length,
      })
      toast.success(t("imageToPdf.export-success-msg", { count: files.length, ms: (t1 - t0).toFixed(0) }))
    } catch (e: any) {
      setError(e.message || t("imageToPdf.generate-failed"))
      toast.error(e.message || t("imageToPdf.generate-failed"))
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }, [files, settings, setError, t])

  return (
    <Card className="max-w-2xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>{t("imageToPdf.title")}</CardTitle>
        <CardDescription>{t("imageToPdf.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 参数设置区 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Label htmlFor="pageSize">{t("imageToPdf.paper-size")}</Label>
          <Select
            value={settings.pageSize}
            onValueChange={(v) => setSettings((s) => ({ ...s, pageSize: v as any }))}
          >
            <SelectTrigger id="pageSize">
              <SelectValue>{settings.pageSize}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A4">A4</SelectItem>
              <SelectItem value="A5">A5</SelectItem>
              <SelectItem value="Letter">Letter</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="orientation">{t("imageToPdf.orientation")}</Label>
          <Select
            value={settings.orientation}
            onValueChange={(v) => setSettings((s) => ({ ...s, orientation: v as any }))}
          >
            <SelectTrigger id="orientation">
              <SelectValue>{settings.orientation}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait">{t("imageToPdf.portrait")}</SelectItem>
              <SelectItem value="landscape">{t("imageToPdf.landscape")}</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="margin">{t("imageToPdf.margin")} (px)</Label>
          <Input
            id="margin"
            type="number"
            min={0}
            max={100}
            value={settings.margin}
            onChange={(e) => setSettings((s) => ({ ...s, margin: Number(e.target.value) }))}
          />
          <Label htmlFor="quality">{t("imageToPdf.image-quality")}</Label>
          <Input
            id="quality"
            type="number"
            min={0.1}
            max={1}
            step={0.01}
            value={settings.quality}
            onChange={(e) => setSettings((s) => ({ ...s, quality: Number(e.target.value) }))}
          />
        </div>
        {/* 拖拽上传区 */}
        <div
          className="border-2 border-dashed rounded p-6 text-center mb-4 cursor-pointer hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          tabIndex={0}
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          <Upload className="mx-auto mb-2" />
          {t("imageToPdf.upload-area-label")}
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileChange}
          />
        </div>
        {/* 文件列表 */}
        {files.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>{t("imageToPdf.selected-images", { count: files.length })}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFiles}
              >
                <Trash2 className="mr-1" />
                {t("imageToPdf.clear-images")}
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col items-center border rounded p-2"
                  tabIndex={0}
                >
                  <img
                    src={f.url}
                    alt={f.name}
                    className="w-full h-auto mb-2 border rounded"
                  />
                  <div className="font-mono text-xs select-all break-all mb-1">{f.name}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(f.id)}
                  >
                    <Trash2 className="mr-1" />
                    {t("common.remove")}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* 错误提示 */}
        {error && <div className="text-red-600 mb-2">{error}</div>}
        {/* 进度条 */}
        {loading && (
          <div className="w-full bg-gray-200 rounded h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
        )}
        {/* 统计信息 */}
        {stats && (
          <div className="mb-2 text-sm text-muted-foreground flex items-center gap-4">
            <BarChart3 className="mr-1" />
            <span>{t("imageToPdf.image-count", { count: stats.totalImages })}</span>
            <span>{t("imageToPdf.pdf-pages", { count: stats.pageCount })}</span>
            <span>{t("imageToPdf.pdf-size", { size: (stats.pdfSize! / 1024).toFixed(1) })}</span>
          </div>
        )}
        {/* 生成 PDF 按钮 */}
        <Button
          disabled={files.length === 0 || loading}
          className="w-full"
          onClick={handleExport}
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : <Download className="mr-2" />}
          {t("imageToPdf.generate-pdf")}
        </Button>
      </CardContent>
    </Card>
  )
}

export default ImageToPdf
