import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Upload, Download, Loader2, FileImage, Trash2, BarChart3, Image as ImageIcon, Layers } from 'lucide-react'
// @ts-ignore
import { parseGIF, decompressFrames } from 'gifuct-js'
import { nanoid } from 'nanoid'
import type { GifFile, GifFrame, GifStats } from '@/types/gif-split'

// 工具函数

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
const validateGifFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.type !== 'image/gif') return { isValid: false, error: '仅支持 GIF 文件' }
  if (file.size > maxSize) return { isValid: false, error: '文件过大，最大 100MB' }
  return { isValid: true }
}

// 自定义 hook：拖拽/文件选择
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
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === 'image/gif')
      if (files.length) onFiles(files)
      else toast.error('请拖入 GIF 文件')
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
        const canvas = document.createElement('canvas')
        canvas.width = f.dims.width
        canvas.height = f.dims.height
        const ctx = canvas.getContext('2d')!
        const imageData = ctx.createImageData(f.dims.width, f.dims.height)
        imageData.data.set(f.patch)
        ctx.putImageData(imageData, 0, 0)
        const imageDataUrl = canvas.toDataURL('image/png')
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
      throw new Error(e?.message || 'GIF 解析失败')
    }
  }, [])
  return { isProcessing, progress, processGif }
}

// 主组件
const GifSplit = () => {
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
      newGifs.push({ id, file, name: file.name, size: file.size, type: file.type, status: 'pending' })
    }
    if (newGifs.length) setGifs((prev) => [...prev, ...newGifs])
  })

  // 批量处理
  const handleBatchSplit = async () => {
    for (const gif of gifs) {
      if (gif.status !== 'pending') continue
      setGifs((prev) => prev.map((g) => (g.id === gif.id ? { ...g, status: 'processing', error: undefined } : g)))
      try {
        const { frames, stats } = await processGif(gif.file)
        setGifs((prev) => prev.map((g) => (g.id === gif.id ? { ...g, status: 'completed', frames, stats } : g)))
        toast.success(`${gif.name} 拆分成功，共 ${frames.length} 帧`)
      } catch (e: any) {
        setGifs((prev) => prev.map((g) => (g.id === gif.id ? { ...g, status: 'error', error: e.message } : g)))
        toast.error(`${gif.name} 解析失败: ${e.message}`)
      }
    }
  }

  // 导出单帧
  const handleExportFrame = (frame: GifFrame, name: string, format: 'png' | 'jpeg') => {
    const link = document.createElement('a')
    link.href = frame.imageDataUrl.replace('image/png', `image/${format}`)
    link.download = `${name}_frame${frame.index + 1}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`已导出第${frame.index + 1}帧`)
  }

  // 导出所有帧为 zip
  const handleExportAllFrames = async (gif: GifFile, format: 'png' | 'jpeg') => {
    if (!gif.frames) return
    // 动态导入 jszip
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    gif.frames.forEach((frame) => {
      const base64 = frame.imageDataUrl.split(',')[1]
      zip.file(`${gif.name}_frame${frame.index + 1}.${format}`, base64, { base64: true })
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${gif.name}_frames.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('所有帧已打包导出')
  }

  // 移除 GIF
  const handleRemoveGif = (id: string) => {
    setGifs((prev) => prev.filter((g) => g.id !== id))
  }

  // 清空全部
  const handleClearAll = () => {
    setGifs([])
    toast.success('已清空')
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
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
              <Layers className="h-5 w-5" aria-hidden="true" />
              GIF 拆分/帧提取工具
            </CardTitle>
            <CardDescription>
              支持批量 GIF 文件拆分，帧导出，实时预览，统计分析，键盘无障碍，拖拽上传，导出 PNG/JPEG/ZIP。
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
              aria-label="拖拽 GIF 文件到此或点击选择"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">上传 GIF 文件</h3>
              <p className="text-muted-foreground mb-4">拖拽 GIF 到此，或点击选择文件，支持批量</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                <FileImage className="mr-2 h-4 w-4" />
                选择文件
              </Button>
              <p className="text-xs text-muted-foreground">仅支持 GIF • 最大 100MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/gif"
                onChange={handleFileInput}
                className="hidden"
                aria-label="选择 GIF 文件"
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
                disabled={isProcessing || gifs.every((g) => g.status !== 'pending')}
                className="min-w-32"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '批量拆分'
                )}
              </Button>
              <Button onClick={handleClearAll} variant="destructive" disabled={isProcessing}>
                {' '}
                <Trash2 className="mr-2 h-4 w-4" />
                清空全部
              </Button>
            </CardContent>
          </Card>
        )}
        {/* GIF 列表 */}
        {gifs.length > 0 &&
          gifs.map((gif) => (
            <Card key={gif.id} className="overflow-x-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  {gif.name}
                </CardTitle>
                <CardDescription>
                  大小: {formatFileSize(gif.size)}
                  {gif.stats && (
                    <>
                      {' '}
                      • 帧数: {gif.stats.frameCount} • 时长: {(gif.stats.duration / 1000).toFixed(2)}s • 分辨率:{' '}
                      {gif.stats.width}x{gif.stats.height}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 进度/状态 */}
                <div className="mb-2 flex items-center gap-4">
                  {gif.status === 'processing' && (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-blue-500" /> 进度: {progress}%
                    </>
                  )}
                  {gif.status === 'completed' && <span className="text-green-600">已完成</span>}
                  {gif.status === 'error' && <span className="text-red-600">错误: {gif.error}</span>}
                  {gif.status === 'pending' && <span className="text-blue-600">待处理</span>}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveGif(gif.id)}
                    aria-label={`移除 ${gif.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* 帧预览与导出 */}
                {gif.frames && (
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 py-2">
                      {gif.frames.map((frame) => (
                        <div key={frame.index} className="flex flex-col items-center gap-1">
                          <img
                            src={frame.imageDataUrl}
                            alt={`帧${frame.index + 1}`}
                            className="w-20 h-20 object-contain border rounded cursor-pointer"
                          />
                          <span className="text-xs text-muted-foreground">帧{frame.index + 1}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportFrame(frame, gif.name, 'png')}
                            aria-label={`导出第${frame.index + 1}帧 PNG`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleExportAllFrames(gif, 'png')}>
                        <Download className="h-4 w-4 mr-1" />
                        全部导出 PNG (ZIP)
                      </Button>
                      <Button size="sm" onClick={() => handleExportAllFrames(gif, 'jpeg')}>
                        <Download className="h-4 w-4 mr-1" />
                        全部导出 JPEG (ZIP)
                      </Button>
                    </div>
                  </div>
                )}
                {/* 统计分析 */}
                {gif.stats && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-6">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      帧数: {gif.stats.frameCount}，总时长: {(gif.stats.duration / 1000).toFixed(2)}s，平均帧间隔:{' '}
                      {gif.stats.avgDelay.toFixed(1)}ms，分辨率: {gif.stats.width}x{gif.stats.height}，文件大小:{' '}
                      {formatFileSize(gif.stats.fileSize)}
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
