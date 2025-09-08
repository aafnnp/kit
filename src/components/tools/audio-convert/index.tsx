import { useCallback, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Loader2,
  FileAudio2,
  Trash2,
  BarChart3,
  Volume2,
  SlidersHorizontal,
  Settings,
  Clock,
  BookOpen,
  Layers,
  CheckCircle2,
  Eye,
  EyeOff,
  Zap,
  AlertCircle,
  Grid,
  List,
  Music,
  RotateCcw,
} from 'lucide-react'

// 导入通用组件和 hooks
import { FileUploadArea } from '@/components/common/file-upload-area'

import { useCopyToClipboard } from '@/hooks/use-clipboard'
import { useKeyboardShortcuts, createCommonShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useHistory } from '@/hooks/use-history'

// 导入工具函数
import { formatFileSize } from '@/lib/utils'

// 导入类型
import { AudioFile, ConvertSettings, AudioConversionStats, AudioHistoryEntry } from '@/types/audio-convert'
import {
  audioFormats,
  audioTemplates,
  useAudioAnalysis,
  useAudioConversion,
  validateAudioFile,
  generateId,
  downloadAsZip,
} from './hooks'

// 主组件
const AudioConvert = () => {
  // 状态管理
  const [audios, setAudios] = useState<AudioFile[]>([])
  const [convertSettings, setConvertSettings] = useState<ConvertSettings>({
    format: 'mp3',
    bitrate: 192,
    sampleRate: 44100,
    preserveMetadata: true,
    normalizeAudio: false,
  })
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [activeTab, setActiveTab] = useState('convert')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Hooks
  const { analyzeAudio, isAnalyzing } = useAudioAnalysis()
  const { convertAudios, isProcessing, progress } = useAudioConversion(
    (audioId, progress, message) => {
      // 更新单个音频的进度
      setAudios((prev) => prev.map((a) => (a.id === audioId ? { ...a, progress, progressMessage: message } : a)))
    },
    (audioId, result) => {
      // 音频转换完成
      setAudios((prev) =>
        prev.map((a) =>
          a.id === audioId
            ? {
                ...a,
                status: 'completed',
                convertedUrl: result.url,
                convertResult: result,
                processingTime: Date.now() - (a.processingTime || Date.now()),
              }
            : a
        )
      )
    },
    (audioId, error) => {
      // 音频转换出错
      setAudios((prev) => prev.map((a) => (a.id === audioId ? { ...a, status: 'error', error } : a)))
      toast.error(`转换失败: ${error}`)
    }
  )
  const { copyDataToClipboard } = useCopyToClipboard()
  const { history, addToHistory, clearHistory } = useHistory<AudioHistoryEntry>(20)

  // 文件处理
  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const newAudios: AudioFile[] = []

      for (const file of files) {
        const validation = validateAudioFile(file)
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error}`)
          continue
        }

        if (validation.warnings) {
          validation.warnings.forEach((warning) => toast.warning(`${file.name}: ${warning}`))
        }

        try {
          const stats = await analyzeAudio(file)
          const id = generateId()
          const url = URL.createObjectURL(file)

          const audioFile: AudioFile = {
            id,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'pending',
            timestamp: Date.now(),
            url,
            stats,
            originalFormat: stats.format,
          }

          newAudios.push(audioFile)
        } catch (error) {
          toast.error(`${file.name}: Failed to analyze audio metadata`)
          console.error('Audio analysis error:', error)
        }
      }

      if (newAudios.length > 0) {
        setAudios((prev) => [...prev, ...newAudios])
        toast.success(`Added ${newAudios.length} audio file(s)`)
      }
    },
    [analyzeAudio]
  )

  // 转换处理
  const handleBatchConvert = useCallback(async () => {
    const pendingAudios = audios.filter((audio) => audio.status === 'pending')
    if (pendingAudios.length === 0) {
      toast.warning('No files to convert')
      return
    }

    const startTime = Date.now()

    try {
      // 更新所有待处理音频的状态
      setAudios((prev) =>
        prev.map((a) =>
          pendingAudios.some((pa) => pa.id === a.id)
            ? { ...a, status: 'processing', error: undefined, processingTime: Date.now() }
            : a
        )
      )

      try {
        // 使用批量转换API
        await convertAudios(pendingAudios, convertSettings)
      } catch (error) {
        toast.error('Batch conversion failed')
        console.error('Batch conversion error:', error)
      }

      // 添加到历史记录
      const totalTime = Date.now() - startTime
      const stats = calculateConversionStats(audios, totalTime)

      addToHistory({
        id: generateId(),
        timestamp: Date.now(),
        description: `Converted ${pendingAudios.length} files to ${convertSettings.format}`,
        settings: convertSettings,
        stats,
        fileCount: pendingAudios.length,
        totalSavings: stats.totalSavings,
      })
    } catch (error) {
      toast.error('Batch conversion failed')
      console.error('Batch conversion error:', error)
    }
  }, [audios, convertSettings, convertAudios, addToHistory])

  // 导出处理
  const handleExportSingle = useCallback(
    (audio: AudioFile) => {
      if (!audio.convertedUrl) {
        toast.error('No converted file to export')
        return
      }

      const filename = `${audio.name.replace(/\.[^/.]+$/, '')}_converted.${convertSettings.format}`

      // 从URL创建下载链接
      const link = document.createElement('a')
      link.href = audio.convertedUrl!
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Exported ${filename}`)
    },
    [convertSettings.format]
  )

  const handleExportAll = useCallback(async () => {
    const convertedAudios = audios.filter((audio) => audio.convertedUrl)

    if (convertedAudios.length === 0) {
      toast.error('No converted files to export')
      return
    }

    try {
      const files = await Promise.all(
        convertedAudios.map(async (audio) => {
          const response = await fetch(audio.convertedUrl!)
          const blob = await response.blob()
          return {
            blob,
            filename: `${audio.name.replace(/\.[^/.]+$/, '')}_converted.${convertSettings.format}`,
          }
        })
      )

      await downloadAsZip(files, 'converted_audios.zip')
      toast.success(`Exported ${convertedAudios.length} files as ZIP`)
    } catch (error) {
      toast.error('Failed to create ZIP file')
      console.error('Export error:', error)
    }
  }, [audios, convertSettings.format])

  // 文件管理
  const handleRemoveAudio = useCallback((id: string) => {
    setAudios((prev) => {
      const audio = prev.find((a) => a.id === id)
      if (audio?.url) {
        URL.revokeObjectURL(audio.url)
      }
      if (audio?.convertedUrl) {
        URL.revokeObjectURL(audio.convertedUrl)
      }
      return prev.filter((a) => a.id !== id)
    })
    toast.success('File removed')
  }, [])

  const handleClearAll = useCallback(() => {
    // 清理所有 URL 对象
    audios.forEach((audio) => {
      if (audio.url) URL.revokeObjectURL(audio.url)
      if (audio.convertedUrl) URL.revokeObjectURL(audio.convertedUrl)
    })

    setAudios([])
    toast.success('All files cleared')
  }, [audios])

  // 模板处理
  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = audioTemplates.find((t) => t.id === templateId)
    if (template) {
      setConvertSettings(template.settings)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // 设置处理
  const handleSettingsChange = useCallback((updates: Partial<ConvertSettings>) => {
    setConvertSettings((prev) => ({ ...prev, ...updates }))
    setSelectedTemplate('') // 清除模板选择
  }, [])

  const calculateConversionStats = (files: AudioFile[], totalTime: number): AudioConversionStats => {
    const completedFiles = files.filter((f) => f.status === 'completed')
    const totalOriginalSize = completedFiles.reduce((sum, f) => sum + f.size, 0)
    const totalConvertedSize = completedFiles.reduce((sum, f) => sum + (f.convertResult?.size || 0), 0)

    return {
      totalFiles: completedFiles.length,
      processingTime: totalTime,
      averageProcessingTime: totalTime / completedFiles.length,
      totalSize: totalOriginalSize,
      averageSize: totalOriginalSize / completedFiles.length,
      totalOriginalSize,
      totalConvertedSize,
      totalSavings: totalOriginalSize - totalConvertedSize,
      averageSizeReduction: ((totalOriginalSize - totalConvertedSize) / totalOriginalSize) * 100,
      averageBitrateReduction: 0, // 简化实现
      formatDistribution: {},
      qualityMetrics: {
        averageQuality: 85,
        compressionEfficiency: 90,
        formatOptimization: 88,
      },
    }
  }

  // 键盘快捷键
  const shortcuts = useMemo(
    () =>
      createCommonShortcuts({
        onProcess: () => !isProcessing && handleBatchConvert(),
        onClear: () => !isProcessing && handleClearAll(),
        onExport: () => handleExportAll(),
        onSave: () => {
          const data = {
            settings: convertSettings,
            files: audios.map((a) => ({
              name: a.name,
              size: a.size,
              status: a.status,
              stats: a.stats,
            })),
          }
          copyDataToClipboard(data, 'json', 'Audio conversion data')
        },
      }),
    [isProcessing, handleBatchConvert, handleClearAll, handleExportAll, convertSettings, audios, copyDataToClipboard]
  )

  useKeyboardShortcuts(shortcuts)

  // 统计数据
  const stats = useMemo(() => {
    const total = audios.length
    const pending = audios.filter((a) => a.status === 'pending').length
    const processing = audios.filter((a) => a.status === 'processing').length
    const completed = audios.filter((a) => a.status === 'completed').length
    const failed = audios.filter((a) => a.status === 'error').length

    return { total, pending, processing, completed, failed }
  }, [audios])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Format Converter
            </CardTitle>
            <CardDescription>
              Convert audio files between different formats with advanced settings, batch processing, and quality
              analysis. Supports MP3, WAV, FLAC, AAC, OGG, and more.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="convert" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Convert
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="help" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Help
            </TabsTrigger>
          </TabsList>

          {/* Convert Tab */}
          <TabsContent value="convert" className="space-y-6">
            {/* File Upload Area */}
            <FileUploadArea
              onFilesSelected={handleFilesSelected}
              isProcessing={isAnalyzing || isProcessing}
              accept="audio/*"
              multiple={true}
              title="Upload Audio Files"
              description="Drag and drop your audio files here, or click to select files"
              buttonText="Choose Audio Files"
              supportedFormatsText="Supports MP3, WAV, FLAC, AAC, OGG, M4A, WMA • Max 200MB per file"
              config={{
                accept: ['audio/*'],
                maxSize: 200 * 1024 * 1024,
                maxFiles: 50,
                multiple: true,
              }}
              icon={<FileAudio2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />}
            />

            {/* Conversion Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Conversion Settings
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                    {showAdvanced ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAdvanced ? 'Hide' : 'Show'} Advanced
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Template</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {audioTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Output Format</Label>
                    <Select
                      value={convertSettings.format}
                      onValueChange={(value) => handleSettingsChange({ format: value as ConvertSettings['format'] })}
                    >
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="wav">WAV</SelectItem>
                        <SelectItem value="flac">FLAC</SelectItem>
                        <SelectItem value="aac">AAC</SelectItem>
                        <SelectItem value="ogg">OGG Vorbis</SelectItem>
                        <SelectItem value="m4a">M4A</SelectItem>
                        <SelectItem value="wma">WMA</SelectItem>
                        <SelectItem value="webm">WebM Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bitrate">Bitrate (kbps)</Label>
                    <Input
                      id="bitrate"
                      type="number"
                      min={32}
                      max={320}
                      step={16}
                      value={convertSettings.bitrate}
                      onChange={(e) => handleSettingsChange({ bitrate: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="sampleRate">Sample Rate (Hz)</Label>
                      <Select
                        value={convertSettings.sampleRate.toString()}
                        onValueChange={(value) => handleSettingsChange({ sampleRate: Number(value) })}
                      >
                        <SelectTrigger id="sampleRate">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8000">8,000 Hz</SelectItem>
                          <SelectItem value="16000">16,000 Hz</SelectItem>
                          <SelectItem value="22050">22,050 Hz</SelectItem>
                          <SelectItem value="44100">44,100 Hz</SelectItem>
                          <SelectItem value="48000">48,000 Hz</SelectItem>
                          <SelectItem value="96000">96,000 Hz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="channels">Channels</Label>
                      <Select
                        value={convertSettings.channels?.toString() || 'auto'}
                        onValueChange={(value) =>
                          handleSettingsChange({
                            channels: value === 'auto' ? undefined : Number(value),
                          })
                        }
                      >
                        <SelectTrigger id="channels">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="1">Mono (1)</SelectItem>
                          <SelectItem value="2">Stereo (2)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quality">Quality</Label>
                      <Input
                        id="quality"
                        type="number"
                        min={0}
                        max={100}
                        value={convertSettings.quality || 85}
                        onChange={(e) => handleSettingsChange({ quality: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {audios.length > 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={handleBatchConvert}
                      disabled={isProcessing || stats.pending === 0}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Converting... ({Math.round(progress)}%)
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Convert All ({stats.pending})
                        </>
                      )}
                    </Button>

                    <Button onClick={handleExportAll} variant="outline" disabled={stats.completed === 0}>
                      <Download className="mr-2 h-4 w-4" />
                      Export ZIP ({stats.completed})
                    </Button>

                    <Button onClick={handleClearAll} variant="destructive" disabled={isProcessing}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Files List */}
            {audios.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <FileAudio2 className="h-5 w-5" />
                      Audio Files ({audios.length})
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                      >
                        {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                    {audios.map((audio) => (
                      <Card key={audio.id} className="relative">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 truncate">
                              <Music className="h-4 w-4 flex-shrink-0" />
                              {audio.name}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAudio(audio.id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </CardTitle>
                          <div className="text-xs text-muted-foreground">
                            {formatFileSize(audio.size)}
                            {audio.stats && (
                              <>
                                {' • '}
                                {audio.stats.duration.toFixed(1)}s{' • '}
                                {audio.stats.bitrate}kbps
                                {' • '}
                                {audio.stats.format.toUpperCase()}
                              </>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {/* Status */}
                          <div className="flex items-center gap-2 mb-3">
                            {audio.status === 'pending' && (
                              <div className="flex items-center gap-2 text-blue-600">
                                <Clock className="h-4 w-4" />
                                <span className="text-sm">Pending</span>
                              </div>
                            )}
                            {audio.status === 'processing' && (
                              <div className="flex items-center gap-2 text-orange-600">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Processing...</span>
                              </div>
                            )}
                            {audio.status === 'completed' && (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="h-4 w-4" />
                                <span className="text-sm">Completed</span>
                              </div>
                            )}
                            {audio.status === 'error' && (
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm">Error: {audio.error}</span>
                              </div>
                            )}
                          </div>

                          {/* Audio Players */}
                          <div className="space-y-3">
                            <div>
                              <div className="text-xs text-muted-foreground mb-1">Original</div>
                              <audio src={audio.url} controls className="w-full h-8" preload="metadata" />
                            </div>

                            {audio.convertedUrl && (
                              <div>
                                <div className="text-xs text-green-600 mb-1">Converted</div>
                                <audio src={audio.convertedUrl} controls className="w-full h-8" preload="metadata" />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleExportSingle(audio)}
                                  className="w-full mt-2"
                                >
                                  <Download className="h-3 w-3 mr-1" />
                                  Export
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs would be implemented here */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Templates</CardTitle>
                <CardDescription>Pre-configured settings for common audio conversion scenarios</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {audioTemplates.map((template) => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>Format: {template.settings.format.toUpperCase()}</div>
                          <div>Bitrate: {template.settings.bitrate} kbps</div>
                          <div>Sample Rate: {template.settings.sampleRate} Hz</div>
                          <div className="text-xs text-muted-foreground mt-2">{template.useCase}</div>
                        </div>
                        <Button
                          onClick={() => handleTemplateSelect(template.id)}
                          className="w-full mt-3"
                          variant={selectedTemplate === template.id ? 'default' : 'outline'}
                        >
                          {selectedTemplate === template.id ? 'Applied' : 'Apply Template'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card>
              <CardHeader>
                <CardTitle>Conversion Analysis</CardTitle>
                <CardDescription>Statistics and insights about your audio conversions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                    <div className="text-sm text-muted-foreground">Total Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-sm text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>

                {audios.length === 0 && (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Data Yet</h3>
                    <p className="text-muted-foreground">
                      Upload and convert some audio files to see analysis data here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Conversion History</span>
                  {history.length > 0 && (
                    <Button variant="outline" size="sm" onClick={clearHistory}>
                      Clear History
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>Previous conversion sessions and settings</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                    <p className="text-muted-foreground">
                      Your conversion history will appear here after you process some files.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-medium mb-1">{entry.description}</div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {new Date(entry.timestamp).toLocaleString()}
                              </div>
                              <div className="text-sm">
                                Format: {entry.settings.format.toUpperCase()} • Bitrate: {entry.settings.bitrate}kbps •
                                Files: {entry.fileCount}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setConvertSettings(entry.settings)
                                toast.success('Settings restored from history')
                              }}
                            >
                              <RotateCcw className="h-4 w-4 mr-1" />
                              Restore
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Help & Information</CardTitle>
                <CardDescription>Learn about audio formats and conversion settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Supported Formats</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(audioFormats).map(([key, format]) => (
                        <Card key={key}>
                          <CardContent className="pt-4">
                            <div className="font-medium mb-2">{format.name}</div>
                            <div className="text-sm text-muted-foreground mb-2">{format.description}</div>
                            <div className="text-xs">
                              <div className="mb-1">Use case: {format.useCase}</div>
                              <div className="text-green-600">Pros: {format.pros.join(', ')}</div>
                              <div className="text-red-600">Cons: {format.cons.join(', ')}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Convert All:</span>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Enter</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Clear All:</span>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+Delete</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Export:</span>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+E</kbd>
                      </div>
                      <div className="flex justify-between">
                        <span>Save Data:</span>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl+S</kbd>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default AudioConvert
