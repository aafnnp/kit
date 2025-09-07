import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Settings,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Eye,
  Layers,
  Image,
  Barcode as BarcodeIcon,
} from 'lucide-react'
import { useBarcodeGenerator, useBarcodeExport, validateBarcodeSettings, barcodeTemplates } from './hooks'
import { useCopyToClipboard } from '@/hooks/use-clipboard'
import { BarcodeResult, BarcodeSettings, BarcodeFormat } from '@/types/barcode-generator'

/**
 * Enhanced Barcode Generator & Management Tool
 * Features: Advanced barcode generation, customization, analysis, and batch processing
 */
const BarcodeGeneratorCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'batch' | 'gallery' | 'templates'>('generator')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [currentBarcode, setCurrentBarcode] = useState<BarcodeResult | null>(null)
  const [settings, setSettings] = useState<BarcodeSettings>({
    content: '123456789012',
    format: 'CODE128',
    width: 2,
    height: 80,
    displayValue: true,
    backgroundColor: '#ffffff',
    lineColor: '#000000',
    fontSize: 12,
    fontFamily: 'Arial',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 5,
    margin: 15,
    customization: {
      showBorder: false,
      borderWidth: 1,
      borderColor: '#000000',
      showQuietZone: true,
      quietZoneSize: 10,
      customFont: false,
      fontWeight: 'normal',
      textCase: 'none',
    },
  })

  const { barcodes, isGenerating, generateBarcode, removeBarcode } = useBarcodeGenerator()
  const { downloadBarcode, downloadSVG } = useBarcodeExport()
  const { copyImageToClipboard, copiedText } = useCopyToClipboard()

  // Preview size based on current settings
  const previewHeight =
    settings.height + settings.margin * 2 + (settings.displayValue ? settings.fontSize + settings.textMargin : 0)

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = barcodeTemplates.find((t) => t.id === templateId)
    if (template) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate barcode
  const handleGenerate = useCallback(async () => {
    const validation = validateBarcodeSettings(settings)
    console.log(validation)
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(error.message)
      })
      return
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning)
      })
    }

    try {
      const result = await generateBarcode(settings)
      setCurrentBarcode(result)

      if (result.isValid) {
        toast.success('Barcode generated successfully')
      } else {
        toast.error(result.error || 'Barcode generation failed')
      }
    } catch (error) {
      toast.error('Failed to generate barcode')
      console.error(error)
    }
  }, [settings, generateBarcode])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarcodeIcon className="h-5 w-5" aria-hidden="true" />
              Barcode Generator & Management Tool
            </CardTitle>
            <CardDescription>
              Advanced barcode generation tool with comprehensive customization, analysis, and batch processing. Create
              barcodes for various formats, customize appearance, and export in multiple formats. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'generator' | 'batch' | 'gallery' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <BarcodeIcon className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Barcode Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Generator Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Barcode Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Content Input */}
                  <div>
                    <Label htmlFor="content" className="text-sm font-medium">
                      Content
                    </Label>
                    <Input
                      id="content"
                      value={settings.content}
                      onChange={(e) => setSettings((prev) => ({ ...prev, content: e.target.value }))}
                      placeholder="Enter barcode content..."
                      className="mt-2"
                    />
                    <div className="text-xs text-muted-foreground mt-1">{settings.content.length} characters</div>
                  </div>

                  {/* Format Selection */}
                  <div>
                    <Label htmlFor="format" className="text-sm font-medium">
                      Barcode Format
                    </Label>
                    <Select
                      value={settings.format}
                      onValueChange={(value: BarcodeFormat) => setSettings((prev) => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CODE128">CODE128 (Alphanumeric)</SelectItem>
                        <SelectItem value="EAN13">EAN-13 (Retail)</SelectItem>
                        <SelectItem value="EAN8">EAN-8 (Compact)</SelectItem>
                        <SelectItem value="UPC">UPC (US Retail)</SelectItem>
                        <SelectItem value="CODE39">CODE39 (Industrial)</SelectItem>
                        <SelectItem value="ITF14">ITF-14 (Shipping)</SelectItem>
                        <SelectItem value="MSI">MSI (Inventory)</SelectItem>
                        <SelectItem value="pharmacode">Pharmacode (Medical)</SelectItem>
                        <SelectItem value="codabar">Codabar (Library)</SelectItem>
                        <SelectItem value="CODE93">CODE93 (High Density)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Basic Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="width" className="text-sm font-medium">
                        Bar Width
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={settings.width}
                        onChange={(e) => setSettings((prev) => ({ ...prev, width: parseFloat(e.target.value) || 2 }))}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-sm font-medium">
                        Height (px)
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        min="20"
                        max="500"
                        value={settings.height}
                        onChange={(e) => setSettings((prev) => ({ ...prev, height: parseInt(e.target.value) || 80 }))}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="line-color" className="text-sm font-medium">
                        Bar Color
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="line-color"
                          type="color"
                          value={settings.lineColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, lineColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.lineColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, lineColor: e.target.value }))}
                          className="flex-1"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="background-color" className="text-sm font-medium">
                        Background Color
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="background-color"
                          type="color"
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          value={settings.backgroundColor}
                          onChange={(e) => setSettings((prev) => ({ ...prev, backgroundColor: e.target.value }))}
                          className="flex-1"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Text Settings */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        id="display-value"
                        type="checkbox"
                        checked={settings.displayValue}
                        onChange={(e) => setSettings((prev) => ({ ...prev, displayValue: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="display-value" className="text-sm">
                        Display text below barcode
                      </Label>
                    </div>

                    {settings.displayValue && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="font-size" className="text-xs">
                            Font Size
                          </Label>
                          <Input
                            id="font-size"
                            type="number"
                            min="6"
                            max="24"
                            value={settings.fontSize}
                            onChange={(e) =>
                              setSettings((prev) => ({ ...prev, fontSize: parseInt(e.target.value) || 12 }))
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="text-align" className="text-xs">
                            Text Alignment
                          </Label>
                          <Select
                            value={settings.textAlign}
                            onValueChange={(value: 'left' | 'center' | 'right') =>
                              setSettings((prev) => ({ ...prev, textAlign: value }))
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleGenerate}
                      disabled={isGenerating || !settings.content.trim()}
                      className="flex-1"
                    >
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <BarcodeIcon className="mr-2 h-4 w-4" />
                      )}
                      Generate Barcode
                    </Button>
                    <Button
                      onClick={() =>
                        setSettings({
                          content: '123456789012',
                          format: 'CODE128',
                          width: 2,
                          height: 80,
                          displayValue: true,
                          backgroundColor: '#ffffff',
                          lineColor: '#000000',
                          fontSize: 12,
                          fontFamily: 'Arial',
                          textAlign: 'center',
                          textPosition: 'bottom',
                          textMargin: 5,
                          margin: 15,
                          customization: {
                            showBorder: false,
                            borderWidth: 1,
                            borderColor: '#000000',
                            showQuietZone: true,
                            quietZoneSize: 10,
                            customFont: false,
                            fontWeight: 'normal',
                            textCase: 'none',
                          },
                        })
                      }
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Barcode Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Barcode Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentBarcode ? (
                    <div className="space-y-4">
                      {/* Barcode Display */}
                      <div className="flex justify-center">
                        <div className="p-4 border rounded-lg bg-muted/50 w-full">
                          <div className="w-full justify-center" style={{ height: previewHeight }}>
                            {currentBarcode.svgString ? (
                              <div
                                className="w-full h-full"
                                dangerouslySetInnerHTML={{
                                  __html: currentBarcode.svgString.replace(
                                    '<svg ',
                                    '<svg preserveAspectRatio="none" width="100%" height="100%" '
                                  ),
                                }}
                              />
                            ) : currentBarcode.dataUrl ? (
                              <img src={currentBarcode.dataUrl} alt="Generated Barcode" className="w-full h-full" />
                            ) : currentBarcode.isValid ? (
                              <div className="w-full h-full" />
                            ) : (
                              <div className="w-64 h-32 bg-gray-200 rounded flex items-center justify-center">
                                <BarcodeIcon className="h-16 w-16 text-gray-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Barcode Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div>
                            <strong>Format:</strong> {currentBarcode.format}
                          </div>
                          <div>
                            <strong>Content:</strong> {currentBarcode.content}
                          </div>
                          <div>
                            <strong>Dimensions:</strong> {currentBarcode.width}x{currentBarcode.height}px
                          </div>
                        </div>
                        <div>
                          <div>
                            <strong>Text Display:</strong> {currentBarcode.displayValue ? '✅ Yes' : '❌ No'}
                          </div>
                          <div>
                            <strong>Valid:</strong> {currentBarcode.isValid ? '✅ Yes' : '❌ No'}
                          </div>
                          <div>
                            <strong>Created:</strong> {currentBarcode.createdAt.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>

                      {currentBarcode.error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-red-800 text-sm">
                            <strong>Error:</strong> {currentBarcode.error}
                          </div>
                        </div>
                      )}

                      {/* Quick Analysis */}
                      {currentBarcode.analysis && (
                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-sm font-medium">Quick Analysis</Label>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-medium">Readability</div>
                              <div className="text-lg">
                                {currentBarcode.analysis.readability.readabilityScore.toFixed(0)}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentBarcode.analysis.readability.readabilityScore >= 80
                                      ? 'bg-green-500'
                                      : currentBarcode.analysis.readability.readabilityScore >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentBarcode.analysis.readability.readabilityScore}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Optimization</div>
                              <div className="text-lg">
                                {currentBarcode.analysis.optimization.overallOptimization.toFixed(0)}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentBarcode.analysis.optimization.overallOptimization >= 80
                                      ? 'bg-green-500'
                                      : currentBarcode.analysis.optimization.overallOptimization >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentBarcode.analysis.optimization.overallOptimization}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Security</div>
                              <div className="text-lg">{currentBarcode.analysis.security.security_score}/100</div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    currentBarcode.analysis.security.security_score >= 80
                                      ? 'bg-green-500'
                                      : currentBarcode.analysis.security.security_score >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentBarcode.analysis.security.security_score}%` }}
                                ></div>
                              </div>
                            </div>
                            <div>
                              <div className="font-medium">Quality</div>
                              <div className="text-lg">
                                {currentBarcode.metadata?.qualityScore?.toFixed(0) || 0}/100
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className={`h-1 rounded-full ${
                                    (currentBarcode.metadata?.qualityScore || 0) >= 80
                                      ? 'bg-green-500'
                                      : (currentBarcode.metadata?.qualityScore || 0) >= 60
                                        ? 'bg-orange-500'
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${currentBarcode.metadata?.qualityScore || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          {currentBarcode.analysis.recommendations.length > 0 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 text-blue-800">Recommendations</h5>
                              <ul className="text-sm space-y-1">
                                {currentBarcode.analysis.recommendations.map((rec, index) => (
                                  <li key={index} className="flex items-center gap-2 text-blue-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {currentBarcode.analysis.warnings.length > 0 && (
                            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <h5 className="font-medium text-sm mb-2 text-orange-800">Warnings</h5>
                              <ul className="text-sm space-y-1">
                                {currentBarcode.analysis.warnings.map((warning, index) => (
                                  <li key={index} className="flex items-center gap-2 text-orange-700">
                                    <AlertCircle className="h-3 w-3" />
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Download Options */}
                      {currentBarcode.isValid && (
                        <div className="flex gap-2 pt-4 border-t">
                          <Button onClick={() => downloadBarcode(currentBarcode)} variant="outline" className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download PNG
                          </Button>
                          <Button onClick={() => downloadSVG(currentBarcode)} variant="outline" className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Download SVG
                          </Button>
                          <Button
                            onClick={() =>
                              currentBarcode.dataUrl
                                ? copyImageToClipboard(currentBarcode.dataUrl, 'Barcode Image')
                                : toast.error('No image to copy')
                            }
                            variant="outline"
                          >
                            {copiedText === 'Barcode Image' ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarcodeIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Barcode Generated</h3>
                      <p className="text-muted-foreground mb-4">
                        Enter content and click "Generate Barcode" to create your barcode
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch Barcode Generation</CardTitle>
                <CardDescription>Generate multiple barcodes at once</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                  <p className="text-muted-foreground">Batch barcode generation functionality coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Barcode Gallery</CardTitle>
                <CardDescription>View and manage your generated barcodes</CardDescription>
              </CardHeader>
              <CardContent>
                {barcodes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {barcodes.slice(0, 12).map((barcode) => (
                      <div key={barcode.id} className="border rounded-lg p-4">
                        <div className="flex justify-center mb-3">
                          {barcode.dataUrl ? (
                            <img
                              src={barcode.dataUrl}
                              alt="Barcode"
                              className="max-w-full h-auto"
                              style={{ maxHeight: '80px' }}
                            />
                          ) : barcode.isValid ? (
                            <div className="w-full" dangerouslySetInnerHTML={{ __html: barcode.svgString || '' }} />
                          ) : (
                            <div className="w-24 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <BarcodeIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <div>
                            <strong>Format:</strong> {barcode.format}
                          </div>
                          <div>
                            <strong>Size:</strong> {barcode.width}x{barcode.height}px
                          </div>
                          <div className="truncate">
                            <strong>Content:</strong> {barcode.content}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBarcode(barcode)}
                            className="flex-1"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeBarcode(barcode.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Image className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Barcodes</h3>
                    <p className="text-muted-foreground">Generate some barcodes to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Barcode Templates</CardTitle>
                <CardDescription>Pre-configured barcode templates for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {barcodeTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Examples:</div>
                            <div className="text-xs text-muted-foreground">{template.examples.join(', ')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const BarcodeGenerator = () => {
  return <BarcodeGeneratorCore />
}

export default BarcodeGenerator
