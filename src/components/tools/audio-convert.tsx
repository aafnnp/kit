import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, Download, Loader2, FileAudio2, Trash2, BarChart3, Volume2, SlidersHorizontal } from 'lucide-react'
import { nanoid } from 'nanoid'
// @ts-ignore
import JSZip from 'jszip'

// 类型定义
interface AudioFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  url?: string
  convertedUrl?: string
  stats?: AudioStats
  convertResult?: ConvertResult
}

interface AudioStats {
  duration: number // 秒
  bitrate: number
  sampleRate: number
  channels: number
  fileSize: number
  format: string
}

interface ConvertSettings {
  format: 'mp3' | 'wav' | 'aac' | 'ogg' | 'flac' | 'm4a'
  bitrate: number // kbps
  sampleRate: number // Hz
}

interface ConvertResult {
  url: string
  size: number
  format: string
  duration: number
}

// 工具函数

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
const validateAudioFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 200 * 1024 * 1024 // 200MB
  const allowedTypes = [
    'audio/mpeg',
    'audio/wav',
    'audio/x-wav',
    'audio/aac',
    'audio/ogg',
    'audio/flac',
    'audio/mp4',
    'audio/x-m4a',
    'audio/x-flac',
    'audio/x-aac',
    'audio/x-ms-wma',
    'audio/webm',
    'audio/3gpp',
    'audio/3gpp2',
    'audio/x-ms-wma',
    'audio/x-ms-wax',
    'audio/x-ms-wmv',
    'audio/x-ms-asf',
  ]
  if (!allowedTypes.includes(file.type)) return { isValid: false, error: '不支持的格式' }
  if (file.size > maxSize) return { isValid: false, error: '文件过大，最大 200MB' }
  return { isValid: true }
}

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
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('audio/'))
      if (files.length) onFiles(files)
      else toast.error('请拖入音频文件')
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

// 音频元数据分析 hook
const useAudioStats = () => {
  const getStats = useCallback((file: File): Promise<AudioStats> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      audio.src = url
      audio.onloadedmetadata = () => {
        resolve({
          duration: audio.duration,
          bitrate: Math.round((file.size * 8) / audio.duration / 1000),
          sampleRate: (audio as any).sampleRate || 44100,
          channels: (audio as any).channels || 2,
          fileSize: file.size,
          format: file.type.split('/')[1] || 'unknown',
        })
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        reject(new Error('无法读取音频元数据'))
        URL.revokeObjectURL(url)
      }
    })
  }, [])
  return { getStats }
}

// 音频转换 hook（ffmpeg.wasm 动态加载）
const useAudioConvert = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const convert = useCallback(async (file: File, settings: ConvertSettings): Promise<ConvertResult> => {
    setIsProcessing(true)
    setProgress(0)
    // 动态加载 ffmpeg
    const ffmpegModule = await import('@ffmpeg/ffmpeg')
    const { createFFmpeg, fetchFile } = ffmpegModule.default as any
    const ffmpeg = createFFmpeg({ log: false, progress: ({ ratio }: any) => setProgress(Math.round(ratio * 100)) })
    if (!ffmpeg.isLoaded()) await ffmpeg.load()
    const ext = settings.format
    const inputName = `input.${file.name.split('.').pop()}`
    const outputName = `output.${ext}`
    ffmpeg.FS('writeFile', inputName, await fetchFile(file))
    await ffmpeg.run('-i', inputName, '-b:a', `${settings.bitrate}k`, '-ar', settings.sampleRate.toString(), outputName)
    const data = ffmpeg.FS('readFile', outputName)
    const blob = new Blob([data.buffer], { type: `audio/${ext}` })
    const url = URL.createObjectURL(blob)
    setIsProcessing(false)
    setProgress(100)
    return {
      url,
      size: blob.size,
      format: ext,
      duration: 0, // 可选：可用 ffprobe 获取
    }
  }, [])
  return { isProcessing, progress, convert }
}

// 主组件
const AudioConvert = () => {
  const [audios, setAudios] = useState<AudioFile[]>([])
  const [convertSettings, setConvertSettings] = useState<ConvertSettings>({
    format: 'mp3',
    bitrate: 192,
    sampleRate: 44100,
  })
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(async (files) => {
    const { getStats } = useAudioStats()
    const newAudios: AudioFile[] = []
    for (const file of files) {
      const valid = validateAudioFile(file)
      if (!valid.isValid) {
        toast.error(`${file.name}: ${valid.error}`)
        continue
      }
      try {
        const stats = await getStats(file)
        const id = nanoid()
        const url = URL.createObjectURL(file)
        newAudios.push({ id, file, name: file.name, size: file.size, type: file.type, status: 'pending', url, stats })
      } catch (e: any) {
        toast.error(`${file.name}: 读取元数据失败`)
      }
    }
    if (newAudios.length) setAudios((prev) => [...prev, ...newAudios])
  })
  const { isProcessing, progress, convert } = useAudioConvert()

  // 批量转换
  const handleBatchConvert = async () => {
    for (const audio of audios) {
      if (audio.status !== 'pending') continue
      setAudios((prev) => prev.map((a) => (a.id === audio.id ? { ...a, status: 'processing', error: undefined } : a)))
      try {
        const result = await convert(audio.file, convertSettings)
        setAudios((prev) =>
          prev.map((a) =>
            a.id === audio.id ? { ...a, status: 'completed', convertedUrl: result.url, convertResult: result } : a
          )
        )
        toast.success(`${audio.name} 转换成功`)
      } catch (e: any) {
        setAudios((prev) => prev.map((a) => (a.id === audio.id ? { ...a, status: 'error', error: e.message } : a)))
        toast.error(`${audio.name} 转换失败: ${e.message}`)
      }
    }
  }

  // 导出单个转换音频
  const handleExportConverted = (audio: AudioFile) => {
    if (!audio.convertedUrl) return
    const link = document.createElement('a')
    link.href = audio.convertedUrl
    link.download = `${audio.name.replace(/\.[^/.]+$/, '')}_converted.${convertSettings.format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('已导出转换音频')
  }

  // 批量导出 zip
  const handleExportAll = async () => {
    const zip = new JSZip()
    audios.forEach((audio) => {
      if (audio.convertedUrl) {
        zip.file(
          `${audio.name.replace(/\.[^/.]+$/, '')}_converted.${convertSettings.format}`,
          fetch(audio.convertedUrl).then((r) => r.arrayBuffer())
        )
      }
    })
    const blob = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'converted_audios.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('所有转换音频已打包导出')
  }

  // 移除音频
  const handleRemoveAudio = (id: string) => {
    setAudios((prev) => prev.filter((a) => a.id !== id))
  }

  // 清空全部
  const handleClearAll = () => {
    setAudios([])
    toast.success('已清空')
  }

  // 预设模板
  const presets = [
    { label: '高品质 MP3', value: { format: 'mp3', bitrate: 320, sampleRate: 44100 } },
    { label: '标准 MP3', value: { format: 'mp3', bitrate: 192, sampleRate: 44100 } },
    { label: '高品质 AAC', value: { format: 'aac', bitrate: 256, sampleRate: 44100 } },
    { label: '高品质 OGG', value: { format: 'ogg', bitrate: 256, sampleRate: 48000 } },
    { label: '无损 FLAC', value: { format: 'flac', bitrate: 0, sampleRate: 44100 } },
    { label: '自定义', value: null },
  ]

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
              <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
              音频格式转换/分析工具
            </CardTitle>
            <CardDescription>
              支持批量音频格式转换，参数设置，实时预览，统计分析，键盘无障碍，拖拽上传，导出 MP3/WAV/FLAC/ZIP。
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
              aria-label="拖拽音频文件到此或点击选择"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">上传音频文件</h3>
              <p className="text-muted-foreground mb-4">拖拽音频到此，或点击选择文件，支持批量</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                <FileAudio2 className="mr-2 h-4 w-4" />
                选择文件
              </Button>
              <p className="text-xs text-muted-foreground">支持 MP3/WAV/FLAC/AAC/OGG/M4A • 最大 200MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileInput}
                className="hidden"
                aria-label="选择音频文件"
              />
            </div>
          </CardContent>
        </Card>
        {/* 转换设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">转换设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <Label htmlFor="preset">预设</Label>
              <Select
                value={
                  presets.find(
                    (p) =>
                      p.value &&
                      p.value.format === convertSettings.format &&
                      p.value.bitrate === convertSettings.bitrate &&
                      p.value.sampleRate === convertSettings.sampleRate
                  )
                    ? presets.find(
                        (p) =>
                          p.value &&
                          p.value.format === convertSettings.format &&
                          p.value.bitrate === convertSettings.bitrate &&
                          p.value.sampleRate === convertSettings.sampleRate
                      )!.label
                    : '自定义'
                }
                onValueChange={(label) => {
                  const preset = presets.find((p) => p.label === label)
                  if (preset && preset.value)
                    setConvertSettings((s) => ({
                      ...s,
                      ...preset.value,
                      format: preset.value.format as ConvertSettings['format'],
                    }))
                }}
              >
                <SelectTrigger id="preset" aria-label="选择转换预设">
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
              <Label htmlFor="format" className="ml-4">
                导出格式
              </Label>
              <Select
                value={convertSettings.format}
                onValueChange={(f) => setConvertSettings((s) => ({ ...s, format: f as ConvertSettings['format'] }))}
              >
                <SelectTrigger id="format" aria-label="选择导出格式">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="aac">AAC</SelectItem>
                  <SelectItem value="ogg">OGG</SelectItem>
                  <SelectItem value="flac">FLAC</SelectItem>
                  <SelectItem value="m4a">M4A</SelectItem>
                </SelectContent>
              </Select>
              <Label htmlFor="bitrate" className="ml-4">
                比特率(kbps)
              </Label>
              <Input
                id="bitrate"
                type="number"
                min={32}
                max={320}
                step={16}
                value={convertSettings.bitrate}
                onChange={(e) => setConvertSettings((s) => ({ ...s, bitrate: Number(e.target.value) }))}
                className="w-24"
                aria-label="比特率"
              />
              <Label htmlFor="sampleRate" className="ml-4">
                采样率(Hz)
              </Label>
              <Input
                id="sampleRate"
                type="number"
                min={8000}
                max={96000}
                step={1000}
                value={convertSettings.sampleRate}
                onChange={(e) => setConvertSettings((s) => ({ ...s, sampleRate: Number(e.target.value) }))}
                className="w-24"
                aria-label="采样率"
              />
            </div>
          </CardContent>
        </Card>
        {/* 操作按钮 */}
        {audios.length > 0 && (
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleBatchConvert}
                disabled={isProcessing || audios.every((a) => a.status !== 'pending')}
                className="min-w-32"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '批量转换'
                )}
              </Button>
              <Button
                onClick={handleExportAll}
                variant="outline"
                disabled={!audios.some((a) => a.status === 'completed' && a.convertedUrl)}
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
        {/* 音频列表 */}
        {audios.length > 0 &&
          audios.map((audio) => (
            <Card key={audio.id} className="overflow-x-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  {audio.name}
                </CardTitle>
                <CardDescription>
                  大小: {formatFileSize(audio.size)}
                  {audio.stats && (
                    <>
                      {' '}
                      • 时长: {audio.stats.duration.toFixed(2)}s • 码率: {audio.stats.bitrate}kbps • 采样率:{' '}
                      {audio.stats.sampleRate}Hz • 格式: {audio.stats.format}
                    </>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* 进度/状态 */}
                <div className="mb-2 flex items-center gap-4">
                  {audio.status === 'processing' && (
                    <>
                      <Loader2 className="animate-spin h-5 w-5 text-blue-500" /> 进度: {progress}%
                    </>
                  )}
                  {audio.status === 'completed' && <span className="text-green-600">已完成</span>}
                  {audio.status === 'error' && <span className="text-red-600">错误: {audio.error}</span>}
                  {audio.status === 'pending' && <span className="text-blue-600">待处理</span>}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveAudio(audio.id)}
                    aria-label={`移除 ${audio.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {/* 音频预览与导出 */}
                <div className="flex gap-6 items-start">
                  <div className="flex flex-col items-center gap-2">
                    <audio
                      src={audio.url}
                      controls
                      className="w-64 border rounded"
                      aria-label={`原始音频 ${audio.name}`}
                    />
                    <span className="text-xs text-muted-foreground">原始</span>
                  </div>
                  {audio.convertedUrl && (
                    <div className="flex flex-col items-center gap-2">
                      <audio
                        src={audio.convertedUrl}
                        controls
                        className="w-64 border rounded"
                        aria-label={`转换后音频 ${audio.name}`}
                      />
                      <span className="text-xs text-green-600">转换后</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportConverted(audio)}
                        aria-label={`导出转换后音频 ${audio.name}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {/* 统计分析 */}
                {audio.stats && (
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-center gap-6">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground">
                      时长: {audio.stats.duration.toFixed(2)}s，码率: {audio.stats.bitrate}kbps，采样率:{' '}
                      {audio.stats.sampleRate}Hz，文件大小: {formatFileSize(audio.stats.fileSize)}，格式:{' '}
                      {audio.stats.format}
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

export default AudioConvert
