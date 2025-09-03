import React, { useCallback, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Upload, Download, Loader2, FileImage, Trash2, BarChart3, Layers, Grid, Code2 } from 'lucide-react'
// @ts-ignore
import { nanoid } from 'nanoid'
import type { IconFile, SpriteSettings, SpriteStats } from '@/types/icon-spriter'
import { formatFileSize } from '@/lib/utils'
import { zipSync } from 'fflate'

// 工具函数

const validateIconFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024 // 5MB
  const allowedTypes = ['image/svg+xml', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon']
  if (!allowedTypes.includes(file.type)) return { isValid: false, error: '仅支持 SVG/PNG/ICO' }
  if (file.size > maxSize) return { isValid: false, error: '单文件最大 5MB' }
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
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ['image/svg+xml', 'image/png', 'image/x-icon', 'image/vnd.microsoft.icon'].includes(f.type)
      )
      if (files.length) onFiles(files)
      else toast.error('请拖入 SVG/PNG/ICO 文件')
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

// 图标内容读取 hook
const useIconContent = () => {
  const getContent = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (file.type === 'image/svg+xml') resolve(reader.result as string)
        else resolve(`data:${file.type};base64,${btoa(reader.result as string)}`)
      }
      reader.onerror = () => reject(new Error('读取失败'))
      if (file.type === 'image/svg+xml') reader.readAsText(file)
      else reader.readAsBinaryString(file)
    })
  }, [])
  return { getContent }
}

// 雪碧图生成 hook
const useIconSprite = () => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  // 仅 symbol 模式，grid/png/css 可后续扩展
  const generateSprite = useCallback(
    async (icons: IconFile[], settings: SpriteSettings): Promise<{ sprite: string; stats: SpriteStats }> => {
      setIsProcessing(true)
      setProgress(0)
      // symbol 模式
      let symbols = ''
      let count = 0
      for (const icon of icons) {
        if (icon.type === 'image/svg+xml' && icon.content) {
          let id = settings.naming === 'filename' ? icon.name.replace(/\.[^/.]+$/, '') : `icon${count}`
          if (settings.naming === 'custom') id = `${settings.customPrefix}${count}`
          // 取 <svg> 内部内容
          const inner = icon.content.replace(/<svg[\s\S]*?>|<\/svg>/g, '')
          symbols += `<symbol id='${id}'>${inner}</symbol>`
          count++
        }
        setProgress(Math.round((count / icons.length) * 100))
      }
      const sprite = `<svg xmlns='http://www.w3.org/2000/svg' style='display:none'>${symbols}</svg>`
      setIsProcessing(false)
      setProgress(100)
      return {
        sprite,
        stats: {
          iconCount: count,
          totalSize: icons.reduce((s, i) => s + i.size, 0),
          formats: Array.from(new Set(icons.map((i) => i.type))),
        },
      }
    },
    []
  )
  return { isProcessing, progress, generateSprite }
}

// 主组件
const IconSpriter = () => {
  const [icons, setIcons] = useState<IconFile[]>([])
  const [sprite, setSprite] = useState('')
  const [spriteStats, setSpriteStats] = useState<SpriteStats | null>(null)
  const [settings, setSettings] = useState<SpriteSettings>({
    layout: 'symbol',
    spacing: 0,
    naming: 'auto',
    customPrefix: 'icon',
    output: 'svg',
  })
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(async (files) => {
    const { getContent } = useIconContent()
    const newIcons: IconFile[] = []
    for (const file of files) {
      const valid = validateIconFile(file)
      if (!valid.isValid) {
        toast.error(`${file.name}: ${valid.error}`)
        continue
      }
      try {
        const content = await getContent(file)
        const id = nanoid()
        const url = URL.createObjectURL(file)
        newIcons.push({ id, file, name: file.name, size: file.size, type: file.type, status: 'pending', content, url })
      } catch (e: any) {
        toast.error(`${file.name}: 读取失败`)
      }
    }
    if (newIcons.length) setIcons((prev) => [...prev, ...newIcons])
  })
  const { isProcessing, generateSprite } = useIconSprite()

  // 生成雪碧图
  const handleGenerate = async () => {
    const svgIcons = icons.filter((i) => i.type === 'image/svg+xml')
    if (!svgIcons.length) {
      toast.error('请上传 SVG 图标')
      return
    }
    try {
      const { sprite, stats } = await generateSprite(svgIcons, settings)
      setSprite(sprite)
      setSpriteStats(stats)
      toast.success('雪碧图生成成功')
    } catch (e: any) {
      toast.error('生成失败: ' + e.message)
    }
  }

  // 导出 SVG
  const handleExportSVG = () => {
    if (!sprite) return
    const blob = new Blob([sprite], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sprite.svg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('已导出 SVG 雪碧图')
  }

  // 批量导出 ZIP
  const handleExportAll = async () => {
    const zipData: Record<string, Uint8Array> = {}

    for (const icon of icons) {
      if (icon.content) {
        if (icon.type === 'image/svg+xml') {
          zipData[icon.name] = new TextEncoder().encode(icon.content)
        } else {
          const arrayBuffer = await icon.file.arrayBuffer()
          zipData[icon.name] = new Uint8Array(arrayBuffer)
        }
      }
    }

    if (sprite) {
      zipData['sprite.svg'] = new TextEncoder().encode(sprite)
    }

    const zipped = zipSync(zipData)
    const blob = new Blob([zipped], { type: 'application/zip' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'icons_sprite.zip'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('已打包导出 ZIP')
  }

  // 移除图标
  const handleRemoveIcon = (id: string) => {
    setIcons((prev) => prev.filter((i) => i.id !== id))
  }

  // 清空全部
  const handleClearAll = () => {
    setIcons([])
    setSprite('')
    setSpriteStats(null)
    toast.success('已清空')
  }

  // 预设模板
  const presets = [
    {
      label: 'Symbol 雪碧图',
      value: { layout: 'symbol', spacing: 0, naming: 'auto', customPrefix: 'icon', output: 'svg' },
    },
    {
      label: '文件名命名',
      value: { layout: 'symbol', spacing: 0, naming: 'filename', customPrefix: 'icon', output: 'svg' },
    },
    {
      label: '自定义前缀',
      value: { layout: 'symbol', spacing: 0, naming: 'custom', customPrefix: 'myicon', output: 'svg' },
    },
    { label: '自定义', value: null },
  ]

  return (
    <div className="w-full mx-auto space-y-6">
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
              图标雪碧图生成/管理工具
            </CardTitle>
            <CardDescription>
              支持批量 SVG/PNG/ICO 拖拽上传，symbol 雪碧图生成，命名规范，实时预览，统计分析，导出 SVG/ZIP，键盘无障碍。
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
              aria-label="拖拽图标文件到此或点击选择"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  fileInputRef.current?.click()
                }
              }}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">上传图标文件</h3>
              <p className="text-muted-foreground mb-4">拖拽 SVG/PNG/ICO 到此，或点击选择文件，支持批量</p>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                <FileImage className="mr-2 h-4 w-4" />
                选择文件
              </Button>
              <p className="text-xs text-muted-foreground">支持 SVG/PNG/ICO • 单文件最大 5MB</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/svg+xml,image/png,image/x-icon,image/vnd.microsoft.icon"
                onChange={handleFileInput}
                className="hidden"
                aria-label="选择图标文件"
              />
            </div>
          </CardContent>
        </Card>
        {/* 雪碧图设置 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">雪碧图设置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <Label htmlFor="preset">预设</Label>
              <Select
                value={
                  presets.find(
                    (p) =>
                      p.value &&
                      p.value.layout === settings.layout &&
                      p.value.naming === settings.naming &&
                      p.value.customPrefix === settings.customPrefix
                  )?.label || '自定义'
                }
                onValueChange={(label) => {
                  const preset = presets.find((p) => p.label === label)
                  if (preset && preset.value)
                    setSettings((prev) => ({
                      ...prev,
                      ...preset.value,
                      layout: preset.value.layout as SpriteSettings['layout'],
                      naming: preset.value.naming as SpriteSettings['naming'],
                      output: preset.value.output as SpriteSettings['output'],
                    }))
                }}
              >
                <SelectTrigger id="preset" aria-label="选择雪碧图预设">
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
              <Label htmlFor="naming" className="ml-4">
                命名方式
              </Label>
              <Select
                value={settings.naming}
                onValueChange={(v) => setSettings((s) => ({ ...s, naming: v as SpriteSettings['naming'] }))}
              >
                <SelectTrigger id="naming" aria-label="选择命名方式">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">自动</SelectItem>
                  <SelectItem value="filename">文件名</SelectItem>
                  <SelectItem value="custom">自定义前缀</SelectItem>
                </SelectContent>
              </Select>
              {settings.naming === 'custom' && (
                <Input
                  className="w-32 ml-2"
                  value={settings.customPrefix}
                  onChange={(e) => setSettings((s) => ({ ...s, customPrefix: e.target.value }))}
                  aria-label="自定义前缀"
                />
              )}
            </div>
          </CardContent>
        </Card>
        {/* 操作按钮 */}
        {icons.length > 0 && (
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3 justify-center">
              <Button onClick={handleGenerate} disabled={isProcessing || icons.length === 0} className="min-w-32">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '生成雪碧图'
                )}
              </Button>
              <Button onClick={handleExportSVG} variant="outline" disabled={!sprite}>
                <Download className="mr-2 h-4 w-4" />
                导出 SVG
              </Button>
              <Button onClick={handleExportAll} variant="outline" disabled={icons.length === 0}>
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
        {/* 图标列表 */}
        {icons.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Grid className="h-5 w-5" />
                图标列表
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {icons.map((icon) => (
                  <div key={icon.id} className="flex flex-col items-center gap-1">
                    {icon.type === 'image/svg+xml' ? (
                      <div className="w-16 h-16 border rounded flex items-center justify-center bg-white">
                        <div dangerouslySetInnerHTML={{ __html: icon.content || '' }} />
                      </div>
                    ) : (
                      <img
                        src={icon.url}
                        alt={icon.name}
                        className="w-16 h-16 object-contain border rounded bg-white"
                      />
                    )}
                    <span className="text-xs text-muted-foreground truncate max-w-16" title={icon.name}>
                      {icon.name}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveIcon(icon.id)}
                      aria-label={`移除 ${icon.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {/* 雪碧图预览与统计 */}
        {sprite && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                SVG 雪碧图预览
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                className="w-full min-h-[80px] rounded border p-2 bg-muted text-foreground font-mono"
                value={sprite}
                readOnly
                aria-label="SVG 雪碧图代码"
              />
              <div className="flex flex-col md:flex-row gap-4 mt-4 items-center">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">可复制粘贴到 HTML 使用</span>
                  <Button size="sm" variant="outline" onClick={handleExportSVG}>
                    <Download className="h-4 w-4 mr-1" />
                    导出 SVG
                  </Button>
                </div>
                {spriteStats && (
                  <div className="flex items-center gap-2 bg-muted/30 rounded px-3 py-2">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      图标数: {spriteStats.iconCount}，总大小: {formatFileSize(spriteStats.totalSize)}，格式:{' '}
                      {spriteStats.formats.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default IconSpriter
