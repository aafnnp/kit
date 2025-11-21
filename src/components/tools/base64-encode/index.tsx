import { useCallback, useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  FileText,
  Code,
  Upload,
  FileImage,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  Shuffle,
  RotateCcw,
  ArrowUpDown,
  Lock,
  Unlock,
} from 'lucide-react'
import {
  Base64File,
  EncodingSettings,
  EncodingTemplate,
  EncodingOperation,
  EncodingFormat,
} from '@/types/base64-encode'
import { formatFileSize } from '@/lib/utils'
import {
  useCopyToClipboard,
  useDragAndDrop,
  useEncodingExport,
  useFileProcessing,
  useRealTimeEncoding,
  encodingTemplates,
} from './hooks'

/**
 * Enhanced Base64 Encode Tool
 * Features: Real-time encoding/decoding, multiple formats, batch processing, statistics
 */
const Base64EncodeCore = () => {
  const [activeTab, setActiveTab] = useState<'encoder' | 'files'>('encoder')
  const [input, setInput] = useState('')
  const [operation, setOperation] = useState<EncodingOperation>('encode')
  const [inputFormat, setInputFormat] = useState<EncodingFormat>('text')
  const [outputFormat, setOutputFormat] = useState<EncodingFormat>('base64')
  const [files, setFiles] = useState<Base64File[]>([])
  const [_, setIsProcessing] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('text-to-base64')
  const [settings, setSettings] = useState<EncodingSettings>({
    defaultOperation: 'encode',
    defaultFormat: 'base64',
    includeMetadata: true,
    optimizeOutput: false,
    exportFormat: 'txt',
    chunkSize: 1024,
  })

  const { exportResult } = useEncodingExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  const groupedTemplates: Record<string, EncodingTemplate[]> = useMemo(() => {
    return encodingTemplates.reduce(
      (acc, template) => {
        const category = template.category || 'General'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(template)
        return acc
      },
      {} as Record<string, EncodingTemplate[]>
    )
  }, [])

  // Real-time encoding
  const encodingResult = useRealTimeEncoding(input, operation, inputFormat, outputFormat)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(async (droppedFiles: File[]) => {
      setIsProcessing(true)
      try {
        const { processBatch } = useFileProcessing()
        const processedFiles = await processBatch(droppedFiles)
        setFiles((prev) => [...processedFiles, ...prev])
        toast.success(`Added ${processedFiles.length} file(s)`)
      } catch (error) {
        toast.error('Failed to process files')
      } finally {
        setIsProcessing(false)
      }
    }, [])
  )

  // Apply template
  const applyTemplate = useCallback((template: EncodingTemplate) => {
    setOperation(template.operation)
    setInputFormat(template.inputFormat)
    setOutputFormat(template.outputFormat)
    setSelectedTemplate(template.id)
    toast.success(`Applied template: ${template.name}`)
  }, [])

  // Swap input and output
  const swapInputOutput = useCallback(() => {
    if (encodingResult.result) {
      setInput(encodingResult.result.output)
      setOperation(operation === 'encode' ? 'decode' : 'encode')
      const tempFormat = inputFormat
      setInputFormat(outputFormat)
      setOutputFormat(tempFormat)
    }
  }, [encodingResult.result, operation, inputFormat, outputFormat])

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
              <Lock className="h-5 w-5" />
              Base64 Encoder/Decoder
            </CardTitle>
            <CardDescription>
              Advanced encoding and decoding tool with support for Base64, URL encoding, Hex, Binary, and more. Includes
              batch processing, real-time conversion, and comprehensive analysis. Use keyboard navigation: Tab to move
              between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'encoder' | 'files')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="encoder" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Encoder/Decoder
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Batch Processing
            </TabsTrigger>
          </TabsList>

          {/* Encoder/Decoder Tab */}
          <TabsContent value="encoder" className="space-y-4">
            {/* Encoding Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Encoding Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(groupedTemplates).map(([category, templates]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {templates.map((template: EncodingTemplate) => (
                          <Button
                            key={template.id}
                            variant={selectedTemplate === template.id ? 'default' : 'outline'}
                            onClick={() => applyTemplate(template)}
                            className="h-auto p-3 text-left"
                          >
                            <div className="w-full">
                              <div className="font-medium text-sm">{template.name}</div>
                              <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                              <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded">{template.example}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Encoding Configuration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Input</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={operation} onValueChange={(value: EncodingOperation) => setOperation(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="encode">Encode</SelectItem>
                        <SelectItem value="decode">Decode</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={inputFormat} onValueChange={(value: EncodingFormat) => setInputFormat(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="base64">Base64</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="hex">Hex</SelectItem>
                        <SelectItem value="binary">Binary</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button size="sm" variant="outline" onClick={swapInputOutput} disabled={!encodingResult.result}>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Enter ${inputFormat} to ${operation}...`}
                    className="min-h-[200px] font-mono text-sm"
                  />

                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setInput('')}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const samples = ['Hello World!', 'Test123', 'Sample text for encoding']
                        setInput(samples[Math.floor(Math.random() * samples.length)])
                      }}
                    >
                      <Shuffle className="h-4 w-4 mr-2" />
                      Sample
                    </Button>

                    {input && (
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(input, 'input text')}>
                        {copiedText === 'input text' ? (
                          <Check className="h-4 w-4 mr-2" />
                        ) : (
                          <Copy className="h-4 w-4 mr-2" />
                        )}
                        Copy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Output
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={outputFormat} onValueChange={(value: EncodingFormat) => setOutputFormat(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="base64">Base64</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="hex">Hex</SelectItem>
                        <SelectItem value="binary">Binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {encodingResult.error ? (
                    <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <Unlock className="h-4 w-4" />
                        <span className="font-medium">Encoding Error</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{encodingResult.error}</p>
                    </div>
                  ) : encodingResult.result ? (
                    <div className="space-y-4">
                      <Textarea
                        value={encodingResult.result.output}
                        readOnly
                        className="min-h-[200px] font-mono text-sm bg-muted/30"
                      />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(encodingResult.result!.output, 'encoded result')}
                        >
                          {copiedText === 'encoded result' ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copy Result
                        </Button>

                        <Button size="sm" variant="outline" onClick={() => exportResult(encodingResult.result!, 'txt')}>
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-16 text-muted-foreground">
                      <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Enter text to see the {operation}d result</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Encoding Metadata */}
            {encodingResult.result && settings.includeMetadata && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Encoding Metadata
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Input Size</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {formatFileSize(encodingResult.result.metadata.inputSize)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Output Size</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {formatFileSize(encodingResult.result.metadata.outputSize)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Size Ratio</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {encodingResult.result.metadata.compressionRatio.toFixed(2)}x
                        </span>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Processing Time</Label>
                      <div className="mt-2 p-3 bg-muted/30 rounded">
                        <span className="font-mono text-lg">
                          {encodingResult.result.metadata.processingTime.toFixed(2)}ms
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={() => setSettings((prev) => ({ ...prev, includeMetadata: !prev.includeMetadata }))}
                    variant="outline"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {settings.includeMetadata ? 'Hide' : 'Show'} Metadata
                  </Button>

                  {encodingResult.result && (
                    <>
                      <Button onClick={() => exportResult(encodingResult.result!, 'json')} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON
                      </Button>

                      <Button onClick={() => exportResult(encodingResult.result!, 'csv')} variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Export CSV
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Batch Processing Tab */}
          <TabsContent value="files" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                >
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Upload Text Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your text files here, or click to select files for batch encoding/decoding
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="mb-2">
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports TXT, JSON, CSV, XML, HTML, JS, CSS files • Max 10MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.json,.csv,.xml,.html,.js,.css"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {files.map((file) => (
                      <div key={file.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate" title={file.name}>
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                            </div>
                            {file.status === 'completed' && file.encodingData && (
                              <div className="mt-2 text-xs">
                                {file.encodingData.statistics.totalEncodings} encoding operations processed
                              </div>
                            )}
                            {file.error && <div className="text-red-600 text-sm">Error: {file.error}</div>}
                          </div>
                          <div className="flex-shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setFiles((prev) => prev.filter((f) => f.id !== file.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Base64EncodeCore
