import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Image as ImageIcon } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { LoremImageFile, LoremImageSettings } from '@/types/lorem-image'

// 生成唯一 ID

// 默认设置
const defaultSettings: LoremImageSettings = {
  width: 200,
  height: 200,
  format: 'png',
  bgColor: '#cccccc',
  fgColor: '#222222',
  text: '',
  category: '',
  batchCount: 1,
  template: '',
}

// hook: 生成图片链接
function useLoremImageGenerator() {
  const generateUrl = useCallback((settings: LoremImageSettings) => {
    const { width, height, format, bgColor, fgColor, text, category } = settings
    let url = `https://placehold.co/${width}x${height}.${format}`
    const params = []
    if (bgColor) params.push(`bg=${bgColor.replace('#', '')}`)
    if (fgColor) params.push(`text=${encodeURIComponent(text)}`)
    if (fgColor) params.push(`fc=${fgColor.replace('#', '')}`)
    if (category) params.push(`category=${encodeURIComponent(category)}`)
    if (params.length) url += '?' + params.join('&')
    return url
  }, [])
  return { generateUrl }
}

// hook: 管理批量图片
function useBatchLoremImages(settings: LoremImageSettings) {
  const { generateUrl } = useLoremImageGenerator()
  const [images, setImages] = useState<LoremImageFile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateBatch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const batch: LoremImageFile[] = []
      for (let i = 0; i < settings.batchCount; i++) {
        const url = generateUrl(settings)
        batch.push({
          id: nanoid(),
          url,
          width: settings.width,
          height: settings.height,
          format: settings.format,
          bgColor: settings.bgColor,
          fgColor: settings.fgColor,
          text: settings.text,
          category: settings.category,
          status: 'completed',
          generatedAt: new Date(),
        })
      }
      setImages(batch)
    } catch (e: any) {
      setError(e.message || '生成失败')
      toast.error(e.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }, [settings, generateUrl])

  return { images, loading, error, generateBatch, setImages }
}

// 主组件结构（后续将逐步完善 UI、批量、导出、无障碍等功能）
const LoremImage = () => {
  const [settings, setSettings] = useState<LoremImageSettings>(defaultSettings)
  const { images, loading, error, generateBatch } = useBatchLoremImages(settings)

  // TODO: UI 设计系统组件、批量、导出、无障碍、统计、模板等
  return (
    <Card className="max-w-2xl mx-auto mt-6" aria-label="占位图生成工具">
      <CardHeader>
        <CardTitle>占位图生成器（Lorem Image）</CardTitle>
        <CardDescription>支持批量、格式、颜色、文本、主题等自定义，全面对齐其它图片工具体验</CardDescription>
      </CardHeader>
      <CardContent>
        {/* 参数设置区 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Label htmlFor="width">宽度</Label>
          <Input
            id="width"
            type="number"
            min={1}
            max={4096}
            value={settings.width}
            onChange={(e) => setSettings((s) => ({ ...s, width: Number(e.target.value) }))}
            aria-label="图片宽度"
          />
          <Label htmlFor="height">高度</Label>
          <Input
            id="height"
            type="number"
            min={1}
            max={4096}
            value={settings.height}
            onChange={(e) => setSettings((s) => ({ ...s, height: Number(e.target.value) }))}
            aria-label="图片高度"
          />
          <Label htmlFor="format">格式</Label>
          <Select value={settings.format} onValueChange={(v) => setSettings((s) => ({ ...s, format: v as any }))}>
            <SelectTrigger id="format" aria-label="图片格式">
              <SelectValue>{settings.format}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPEG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
            </SelectContent>
          </Select>
          <Label htmlFor="bgColor">背景色</Label>
          <Input
            id="bgColor"
            type="color"
            value={settings.bgColor}
            onChange={(e) => setSettings((s) => ({ ...s, bgColor: e.target.value }))}
            aria-label="背景色"
          />
          <Label htmlFor="fgColor">前景色</Label>
          <Input
            id="fgColor"
            type="color"
            value={settings.fgColor}
            onChange={(e) => setSettings((s) => ({ ...s, fgColor: e.target.value }))}
            aria-label="前景色"
          />
          <Label htmlFor="text">文本</Label>
          <Input
            id="text"
            type="text"
            value={settings.text}
            onChange={(e) => setSettings((s) => ({ ...s, text: e.target.value }))}
            aria-label="图片文本"
          />
          <Label htmlFor="batchCount">批量数量</Label>
          <Input
            id="batchCount"
            type="number"
            min={1}
            max={50}
            value={settings.batchCount}
            onChange={(e) => setSettings((s) => ({ ...s, batchCount: Number(e.target.value) }))}
            aria-label="批量数量"
          />
        </div>
        <Button onClick={generateBatch} disabled={loading} aria-busy={loading} className="w-full mb-4">
          {loading ? <Loader2 className="animate-spin mr-2" /> : <ImageIcon className="mr-2" />}生成占位图
        </Button>
        {/* 错误提示 */}
        {error && (
          <div className="text-red-600 mb-2" role="alert">
            {error}
          </div>
        )}
        {/* 批量图片预览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="flex flex-col items-center border rounded p-2"
              tabIndex={0}
              aria-label={`占位图 ${img.width}x${img.height}`}
            >
              <img
                src={img.url}
                alt={img.text || `占位图 ${img.width}x${img.height}`}
                className="w-full h-auto mb-2 border rounded"
                style={{ background: img.bgColor }}
              />
              <div className="font-mono text-xs select-all break-all">{img.url}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default LoremImage
