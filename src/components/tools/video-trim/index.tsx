import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Upload, Download, Loader2, FileVideo2, Trash2, BarChart3, Video, Scissors } from "lucide-react"
import type { VideoFile, TrimSettings } from "@/components/tools/video-trim/schema"
import { formatFileSize } from "@/lib/utils"
import { useVideoTrim, validateVideoFile, generateId, downloadAsZip, getVideoStats } from "./hooks"
import { useDragAndDrop } from "@/hooks/use-drag-drop"

// 视频元数据分析和裁剪功能现在通过hooks提供

// 主组件
const VideoTrim = () => {
  const { t } = useTranslation()
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({ start: 0, end: 10, format: "mp4" })
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    async (files) => {
      const newVideos: VideoFile[] = []
      for (const file of files) {
        const valid = validateVideoFile(file)
        if (!valid.isValid) {
          toast.error(`${file.name}: ${valid.error}`)
          continue
        }
        try {
          const stats = await getVideoStats(file)
          const id = generateId()
          const url = URL.createObjectURL(file)
          newVideos.push({ id, file, name: file.name, size: file.size, type: file.type, status: "pending", url, stats })
        } catch (e: any) {
          toast.error(t("videoTrim.metadata-read-failed-name", { name: file.name }))
        }
      }
      if (newVideos.length) setVideos((prev) => [...prev, ...newVideos])
    },
    {
      accept: "video/*",
      multiple: true,
    }
  )
  const { trimVideos, isProcessing, progress } = useVideoTrim(
    (videoId, progress) => {
      // 更新单个视频的进度
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, progress } : v)))
    },
    (videoId, result) => {
      // 视频处理完成
      setVideos((prev) =>
        prev.map((v) =>
          v.id === videoId
            ? {
                ...v,
                status: "completed",
                trimmedUrl: result.url,
                trimmedSize: result.size,
              }
            : v
        )
      )
    },
    (videoId, error) => {
      // 处理错误
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: "error", error } : v)))
      toast.error(t("videoTrim.process-failed", { id: videoId, error }))
    }
  )

  // 批量裁剪
  const handleBatchTrim = async () => {
    for (const video of videos) {
      if (video.status !== "pending") continue
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, status: "processing", error: undefined } : v)))
      try {
        await trimVideos([video], trimSettings)
      } catch (e: any) {
        // 错误已通过onError回调处理
        console.error("Trim video error:", e)
      }
    }
  }

  // 导出单个裁剪视频
  const handleExportTrimmed = (video: VideoFile) => {
    if (!video.trimmedUrl) return
    const link = document.createElement("a")
    link.href = video.trimmedUrl
    link.download = `${video.name.replace(/\.[^/.]+$/, "")}_trimmed.${trimSettings.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(t("videoTrim.export-success"))
  }

  // 批量导出 zip
  const handleExportAll = async () => {
    const files: { blob: Blob; filename: string }[] = []

    for (const video of videos) {
      if (video.trimmedUrl) {
        const response = await fetch(video.trimmedUrl)
        const blob = await response.blob()
        files.push({
          blob,
          filename: `${video.name.replace(/\.[^/.]+$/, "")}_trimmed.${trimSettings.format}`,
        })
      }
    }

    await downloadAsZip(files, "trimmed_videos.zip")
    toast.success(t("videoTrim.export-all-success"))
  }

  // 移除视频
  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  // 清空全部
  const handleClearAll = () => {
    setVideos([])
    toast.success(t("videoTrim.clear-success"))
  }

  // 预设模板
  const presets = [
    { label: t("videoTrim.preset-10s"), value: { start: 0, end: 10 } },
    { label: t("videoTrim.preset-10-20s"), value: { start: 10, end: 20 } },
    { label: t("videoTrim.preset-30s"), value: { start: 0, end: 30 } },
    { label: t("videoTrim.preset-custom"), value: null },
  ]

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
              <Scissors className="h-5 w-5" />
              {t("videoTrim.title")}
            </CardTitle>
            <CardDescription>
              {t("videoTrim.description")}
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
              <h3 className="text-lg font-semibold mb-2">{t("videoTrim.upload-title")}</h3>
              <p className="text-muted-foreground mb-4">{t("videoTrim.upload-desc")}</p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mb-2"
              >
                <FileVideo2 className="mr-2 h-4 w-4" />
                {t("videoTrim.select-file")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("videoTrim.upload-hint")}</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>
        {/* 裁剪设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("videoTrim.trim-settings")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <Label htmlFor="preset">{t("videoTrim.preset")}</Label>
              <Select
                value={
                  presets.find(
                    (p) => p.value && p.value.start === trimSettings.start && p.value.end === trimSettings.end
                  )
                    ? presets.find(
                        (p) => p.value && p.value.start === trimSettings.start && p.value.end === trimSettings.end
                      )!.label
                    : t("videoTrim.preset-custom")
                }
                onValueChange={(label) => {
                  const preset = presets.find((p) => p.label === label)
                  if (preset && preset.value) setTrimSettings((s) => ({ ...s, ...preset.value }))
                }}
              >
                <SelectTrigger id="preset">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem
                      key={p.label}
                      value={p.label}
                    >
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label
                htmlFor="start"
                className="ml-4"
              >
                {t("videoTrim.start-seconds")}
              </Label>
              <Input
                id="start"
                type="number"
                min={0}
                value={trimSettings.start}
                onChange={(e) => setTrimSettings((s) => ({ ...s, start: Number(e.target.value) }))}
                className="w-24"
              />
              <Label
                htmlFor="end"
                className="ml-4"
              >
                {t("videoTrim.end-seconds")}
              </Label>
              <Input
                id="end"
                type="number"
                min={trimSettings.start + 1}
                value={trimSettings.end}
                onChange={(e) => setTrimSettings((s) => ({ ...s, end: Number(e.target.value) }))}
                className="w-24"
              />
              <Label
                htmlFor="format"
                className="ml-4"
              >
                {t("videoTrim.export-format")}
              </Label>
              <Select
                value={trimSettings.format}
                onValueChange={(f) => setTrimSettings((s) => ({ ...s, format: f as TrimSettings["format"] }))}
              >
                <SelectTrigger id="format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="webm">WebM</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        {/* 操作按钮 */}
        {videos.length > 0 && (
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleBatchTrim}
                disabled={isProcessing || videos.every((v) => v.status !== "pending")}
                className="min-w-32"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("videoTrim.processing")}
                  </>
                ) : (
                  t("videoTrim.batch-trim")
                )}
              </Button>
              <Button
                onClick={handleExportAll}
                variant="outline"
                disabled={!videos.some((v) => v.status === "completed" && v.trimmedUrl)}
              >
                <Download className="mr-2 h-4 w-4" />
                {t("videoTrim.export-all-zip")}
              </Button>
              <Button
                onClick={handleClearAll}
                variant="destructive"
                disabled={isProcessing}
              >
                {" "}
                <Trash2 className="mr-2 h-4 w-4" />
                {t("videoTrim.clear-all")}
              </Button>
            </CardContent>
          </Card>
        )}
        {/* 视频列表 */}
        {videos.length > 0 &&
          videos.map((video) => (
            <Card
              key={video.id}
              className="overflow-x-auto"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {video.name}
                </CardTitle>
                <CardDescription>
                  {t("videoTrim.size")}: {formatFileSize(video.size)}
                  {video.stats && (
                    <>
                      {" "}
                      • {t("videoTrim.duration")}: {video.stats.duration.toFixed(2)}s • {t("videoTrim.resolution")}:{" "}
                      {video.stats.width}x{video.stats.height} • {t("videoTrim.bitrate")}: {video.stats.bitrate}bps •{" "}
                      {t("videoTrim.format")}: {video.stats.format}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 进度/状态 */}
                <div className="mb-2 flex items-center gap-4">
                  {video.status === "processing" && (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-blue-500" /> {t("videoTrim.progress")}: {progress}%
                    </>
                  )}
                  {video.status === "completed" && <span className="text-green-600">{t("videoTrim.completed")}</span>}
                  {video.status === "error" && <span className="text-red-600">{t("videoTrim.error")}: {video.error}</span>}
                  {video.status === "pending" && <span className="text-blue-600">{t("videoTrim.pending")}</span>}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveVideo(video.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* 视频预览与导出 */}
                <div className="flex gap-6 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <video
                      src={video.url}
                      controls
                      className="w-48 h-32 border rounded"
                    />
                    <span className="text-xs text-muted-foreground">{t("videoTrim.original")}</span>
                  </div>
                  {video.trimmedUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <video
                        src={video.trimmedUrl}
                        controls
                        className="w-48 h-32 border rounded"
                      />
                      <span className="text-xs text-green-600">{t("videoTrim.trimmed")}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportTrimmed(video)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* 统计分析 */}
                {video.stats && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-6">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      {t("videoTrim.stats-summary", {
                        duration: video.stats.duration.toFixed(2),
                        width: video.stats.width,
                        height: video.stats.height,
                        bitrate: video.stats.bitrate,
                        fileSize: formatFileSize(video.stats.fileSize),
                        format: video.stats.format,
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

export default VideoTrim
