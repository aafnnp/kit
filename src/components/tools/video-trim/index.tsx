import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, Download, Loader2, FileVideo2, Trash2, BarChart3, Video, Scissors } from 'lucide-react'
import type { VideoFile, TrimSettings } from '@/types/video-trim'
import { formatFileSize } from '@/lib/utils'
import { useVideoTrim, validateVideoFile, generateId, downloadAsZip, getVideoStats } from './hooks'
// 工具函数

// 拖拽/文件选择 hook
const useDragAndDrop = (onFiles: (files: File[]) => void) => {
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('video/'))
      if (files.length) onFiles(files)
      else toast.error('请拖入视频文件')
    },
    [onFiles]
  )
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length) onFiles(files)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    [onFiles]
  )
  return { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput }
}

// 视频元数据分析和裁剪功能现在通过hooks提供

// 主组件
const VideoTrim = () => {
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [trimSettings, setTrimSettings] = useState<TrimSettings>({ start: 0, end: 10, format: 'mp4' })
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(async (files) => {
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
        newVideos.push({ id, file, name: file.name, size: file.size, type: file.type, status: 'pending', url, stats })
      } catch (e: any) {
        toast.error(`${file.name}: 读取元数据失败`)
      }
    }
    if (newVideos.length) setVideos((prev) => [...prev, ...newVideos])
  })
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
                status: 'completed',
                trimmedUrl: result.url,
                trimmedSize: result.size,
              }
            : v
        )
      )
    },
    (videoId, error) => {
      // 处理错误
      setVideos((prev) => prev.map((v) => (v.id === videoId ? { ...v, status: 'error', error } : v)))
      toast.error(`视频 ${videoId} 处理失败: ${error}`)
    }
  )

  // 批量裁剪
  const handleBatchTrim = async () => {
    for (const video of videos) {
      if (video.status !== 'pending') continue
      setVideos((prev) => prev.map((v) => (v.id === video.id ? { ...v, status: 'processing', error: undefined } : v)))
      try {
        await trimVideos([video], trimSettings)
      } catch (e: any) {
        // 错误已通过onError回调处理
        console.error('Trim video error:', e)
      }
    }
  }

  // 导出单个裁剪视频
  const handleExportTrimmed = (video: VideoFile) => {
    if (!video.trimmedUrl) return
    const link = document.createElement('a')
    link.href = video.trimmedUrl
    link.download = `${video.name.replace(/\.[^/.]+$/, '')}_trimmed.${trimSettings.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('已导出裁剪视频')
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
          filename: `${video.name.replace(/\.[^/.]+$/, '')}_trimmed.${trimSettings.format}`,
        })
      }
    }

    await downloadAsZip(files, 'trimmed_videos.zip')
    toast.success('所有裁剪视频已打包导出')
  }

  // 移除视频
  const handleRemoveVideo = (id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id))
  }

  // 清空全部
  const handleClearAll = () => {
    setVideos([])
    toast.success('已清空')
  }

  // 预设模板
  const presets = [
    { label: '前10秒', value: { start: 0, end: 10 } },
    { label: '10-20秒', value: { start: 10, end: 20 } },
    { label: '前30秒', value: { start: 0, end: 30 } },
    { label: '自定义', value: null },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 跳转主内容（无障碍） */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        跳转到主内容
      </a>
      <div id="main-content" className="flex flex-col gap-4">
        {/* 头部 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5" aria-hidden="true" />
              视频裁剪/分析工具
            </CardTitle>
            <CardDescription>
              支持批量视频裁剪，格式转换，实时预览，统计分析，键盘无障碍，拖拽上传，导出 MP4/WebM/ZIP。
            </CardDescription>
          </CardHeader>
        </Card>
        {/* 上传区 */}
        <Card>
          <CardContent className="pt-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              aria-label="拖拽视频文件到此或点击选择"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">上传视频文件</h3>
              <p className="text-muted-foreground mb-4">拖拽视频到此，或点击选择文件，支持批量</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                <FileVideo2 className="mr-2 h-4 w-4" />
                选择文件
              </Button>
              <p className="text-xs text-muted-foreground">支持 MP4/WebM/MOV/AVI • 最大 500MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*"
                onChange={handleFileInput}
                className="hidden"
                aria-label="选择视频文件"
              />
            </div>
          </CardContent>
        </Card>
        {/* 裁剪设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">裁剪设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <Label htmlFor="preset">预设</Label>
              <Select
                value={
                  presets.find(
                    (p) => p.value && p.value.start === trimSettings.start && p.value.end === trimSettings.end
                  )
                    ? presets.find(
                        (p) => p.value && p.value.start === trimSettings.start && p.value.end === trimSettings.end
                      )!.label
                    : '自定义'
                }
                onValueChange={(label) => {
                  const preset = presets.find((p) => p.label === label)
                  if (preset && preset.value) setTrimSettings((s) => ({ ...s, ...preset.value }))
                }}
              >
                <SelectTrigger id="preset" aria-label="选择裁剪预设">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((p) => (
                    <SelectItem key={p.label} value={p.label}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label htmlFor="start" className="ml-4">
                起始秒
              </Label>
              <Input
                id="start"
                type="number"
                min={0}
                value={trimSettings.start}
                onChange={(e) => setTrimSettings((s) => ({ ...s, start: Number(e.target.value) }))}
                className="w-24"
                aria-label="裁剪起始秒"
              />
              <Label htmlFor="end" className="ml-4">
                结束秒
              </Label>
              <Input
                id="end"
                type="number"
                min={trimSettings.start + 1}
                value={trimSettings.end}
                onChange={(e) => setTrimSettings((s) => ({ ...s, end: Number(e.target.value) }))}
                className="w-24"
                aria-label="裁剪结束秒"
              />
              <Label htmlFor="format" className="ml-4">
                导出格式
              </Label>
              <Select
                value={trimSettings.format}
                onValueChange={(f) => setTrimSettings((s) => ({ ...s, format: f as TrimSettings['format'] }))}
              >
                <SelectTrigger id="format" aria-label="选择导出格式">
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
                disabled={isProcessing || videos.every((v) => v.status !== 'pending')}
                className="min-w-32"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '批量裁剪'
                )}
              </Button>
              <Button
                onClick={handleExportAll}
                variant="outline"
                disabled={!videos.some((v) => v.status === 'completed' && v.trimmedUrl)}
              >
                <Download className="mr-2 h-4 w-4" />
                全部导出 ZIP
              </Button>
              <Button onClick={handleClearAll} variant="destructive" disabled={isProcessing}>
                {' '}
                <Trash2 className="mr-2 h-4 w-4" />
                清空全部
              </Button>
            </CardContent>
          </Card>
        )}
        {/* 视频列表 */}
        {videos.length > 0 &&
          videos.map((video) => (
            <Card key={video.id} className="overflow-x-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  {video.name}
                </CardTitle>
                <CardDescription>
                  大小: {formatFileSize(video.size)}
                  {video.stats && (
                    <>
                      {' '}
                      • 时长: {video.stats.duration.toFixed(2)}s • 分辨率: {video.stats.width}x{video.stats.height} •
                      码率: {video.stats.bitrate}bps • 格式: {video.stats.format}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 进度/状态 */}
                <div className="mb-2 flex items-center gap-4">
                  {video.status === 'processing' && (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-blue-500" /> 进度: {progress}%
                    </>
                  )}
                  {video.status === 'completed' && <span className="text-green-600">已完成</span>}
                  {video.status === 'error' && <span className="text-red-600">错误: {video.error}</span>}
                  {video.status === 'pending' && <span className="text-blue-600">待处理</span>}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveVideo(video.id)}
                    aria-label={`移除 ${video.name}`}
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
                      aria-label={`原始视频 ${video.name}`}
                    />
                    <span className="text-xs text-muted-foreground">原始</span>
                  </div>
                  {video.trimmedUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <video
                        src={video.trimmedUrl}
                        controls
                        className="w-48 h-32 border rounded"
                        aria-label={`裁剪后视频 ${video.name}`}
                      />
                      <span className="text-xs text-green-600">裁剪后</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportTrimmed(video)}
                        aria-label={`导出裁剪后视频 ${video.name}`}
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
                      时长: {video.stats.duration.toFixed(2)}s，分辨率: {video.stats.width}x{video.stats.height}，码率:{' '}
                      {video.stats.bitrate}bps，文件大小: {formatFileSize(video.stats.fileSize)}，格式:{' '}
                      {video.stats.format}
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
