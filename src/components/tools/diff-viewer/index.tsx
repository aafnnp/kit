import { useCallback, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  GitCompare,
  Code,
  Upload,
  FileImage,
  Trash2,
  Settings,
  Copy,
  Check,
  BarChart3,
  Split,
  Eye,
  ArrowLeftRight,
  Columns,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  DiffFile,
  DiffPair,
  DiffSettings,
  DiffAlgorithm,
  DiffFormat,
  DiffViewMode,
} from "@/components/tools/diff-viewer/schema"
import { formatFileSize } from "@/lib/utils"
import {
  useDiffProcessing,
  useRealTimeDiff,
  useFileProcessing,
  useDiffExport,
  useCopyToClipboard,
  useDragAndDrop,
} from "@/components/tools/diff-viewer/hooks"

/**
 * 文本 Diff 工具主组件。
 */
const DiffViewerCore = () => {
  const [activeTab, setActiveTab] = useState<"diff" | "files">("diff")
  const [leftText, setLeftText] = useState("Hello World\nThis is line 2\nThis is line 3")
  const [rightText, setRightText] = useState("Hello Universe\nThis is line 2\nThis is line 4\nThis is a new line")
  const [files, setFiles] = useState<DiffFile[]>([])
  const [pairs, setPairs] = useState<DiffPair[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [settings, setSettings] = useState<DiffSettings>({
    algorithm: "myers",
    format: "side-by-side",
    viewMode: "full",
    showLineNumbers: true,
    showWhitespace: false,
    ignoreWhitespace: false,
    ignoreCase: false,
    contextLines: 3,
    wordLevelDiff: true,
    syntaxHighlighting: false,
    wrapLines: true,
  })

  const { processBatch } = useDiffProcessing()
  const { exportUnifiedDiff, exportHTML, exportBatch, exportCSV } = useDiffExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // 顶层调用
  const { processBatch: processFileBatch } = useFileProcessing()

  // Real-time diff processing
  const realtimeDiff = useRealTimeDiff(leftText, rightText, settings)

  // File drag and drop
  const { dragActive, fileInputRef, handleDrag, handleDrop, handleFileInput } = useDragAndDrop(
    useCallback(
      async (droppedFiles: File[]) => {
        try {
          setIsProcessing(true)
          const processedFiles = await processFileBatch(droppedFiles)
          setFiles((prev) => [...processedFiles, ...prev])
          toast.success(`Added ${processedFiles.length} file(s)`)
        } catch (error) {
          toast.error("Failed to process files")
        } finally {
          setIsProcessing(false)
        }
      },
      [processFileBatch],
    ),
  )

  // Create file pairs for comparison
  const createPair = useCallback((leftFile: DiffFile, rightFile: DiffFile) => {
    const newPair: DiffPair = {
      id: nanoid(),
      leftFile: { ...leftFile, pairedWith: rightFile.id },
      rightFile: { ...rightFile, pairedWith: leftFile.id },
      status: "pending",
    }
    setPairs((prev) => [...prev, newPair])
    toast.success(`Created pair: ${leftFile.name} vs ${rightFile.name}`)
  }, [])

  // Process all pending pairs
  const processPairs = useCallback(async () => {
    const pendingPairs = pairs.filter((p) => p.status === "pending")
    if (pendingPairs.length === 0) {
      toast.error("No pairs to process")
      return
    }

    setIsProcessing(true)
    try {
      const updatedPairs = await processBatch(pendingPairs, settings)
      setPairs((prev) =>
        prev.map((pair) => {
          const updated = updatedPairs.find((u) => u.id === pair.id)
          return updated || pair
        }),
      )
      toast.success("Pairs processed successfully!")
    } catch (error) {
      toast.error("Failed to process pairs")
    } finally {
      setIsProcessing(false)
    }
  }, [pairs, settings, processBatch])

  // Clear all files and pairs
  const clearAll = useCallback(() => {
    setFiles([])
    setPairs([])
    toast.success("All files and pairs cleared")
  }, [])

  // Remove specific file
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
    // Also remove any pairs involving this file
    setPairs((prev) => prev.filter((pair) => pair.leftFile.id !== id && pair.rightFile.id !== id))
  }, [])

  // Remove specific pair
  const removePair = useCallback((id: string) => {
    setPairs((prev) => prev.filter((pair) => pair.id !== id))
  }, [])

  // Statistics calculation for all pairs
  const totalStats = useMemo(() => {
    const completedPairs = pairs.filter((p) => p.result)
    if (completedPairs.length === 0) return null

    return {
      totalPairs: completedPairs.length,
      totalAddedLines: completedPairs.reduce((sum, p) => sum + p.result!.statistics.addedLines, 0),
      totalRemovedLines: completedPairs.reduce((sum, p) => sum + p.result!.statistics.removedLines, 0),
      totalModifiedLines: completedPairs.reduce((sum, p) => sum + p.result!.statistics.modifiedLines, 0),
      averageSimilarity:
        completedPairs.reduce((sum, p) => sum + p.result!.statistics.similarity, 0) / completedPairs.length,
      averageExecutionTime:
        completedPairs.reduce((sum, p) => sum + p.result!.statistics.executionTime, 0) / completedPairs.length,
    }
  }, [pairs])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div
        id="main-content"
        className="flex flex-col gap-4"
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Diff Viewer
            </CardTitle>
            <CardDescription>
              Compare text files with advanced diff algorithms, multiple viewing modes, and export capabilities. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "diff" | "files")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger
              value="diff"
              className="flex items-center gap-2"
            >
              <Code className="h-4 w-4" />
              Text Diff
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              File Comparison
            </TabsTrigger>
          </TabsList>

          {/* Text Diff Tab */}
          <TabsContent
            value="diff"
            className="space-y-4"
          >
            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Diff Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="algorithm">Algorithm</Label>
                    <Select
                      value={settings.algorithm}
                      onValueChange={(value: DiffAlgorithm) => setSettings((prev) => ({ ...prev, algorithm: value }))}
                    >
                      <SelectTrigger id="algorithm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="myers">Myers</SelectItem>
                        <SelectItem value="patience">Patience</SelectItem>
                        <SelectItem value="histogram">Histogram</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select
                      value={settings.format}
                      onValueChange={(value: DiffFormat) => setSettings((prev) => ({ ...prev, format: value }))}
                    >
                      <SelectTrigger id="format">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="side-by-side">Side by Side</SelectItem>
                        <SelectItem value="unified">Unified</SelectItem>
                        <SelectItem value="split">Split View</SelectItem>
                        <SelectItem value="inline">Inline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="viewMode">View Mode</Label>
                    <Select
                      value={settings.viewMode}
                      onValueChange={(value: DiffViewMode) => setSettings((prev) => ({ ...prev, viewMode: value }))}
                    >
                      <SelectTrigger id="viewMode">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full</SelectItem>
                        <SelectItem value="changes-only">Changes Only</SelectItem>
                        <SelectItem value="context">Context</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contextLines">Context Lines</Label>
                    <Input
                      id="contextLines"
                      type="number"
                      min="0"
                      max="20"
                      value={settings.contextLines}
                      onChange={(e) => setSettings((prev) => ({ ...prev, contextLines: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      id="showLineNumbers"
                      type="checkbox"
                      checked={settings.showLineNumbers}
                      onChange={(e) => setSettings((prev) => ({ ...prev, showLineNumbers: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="showLineNumbers"
                      className="text-sm"
                    >
                      Line Numbers
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="wordLevelDiff"
                      type="checkbox"
                      checked={settings.wordLevelDiff}
                      onChange={(e) => setSettings((prev) => ({ ...prev, wordLevelDiff: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="wordLevelDiff"
                      className="text-sm"
                    >
                      Word-level Diff
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="ignoreWhitespace"
                      type="checkbox"
                      checked={settings.ignoreWhitespace}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ignoreWhitespace: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="ignoreWhitespace"
                      className="text-sm"
                    >
                      Ignore Whitespace
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="ignoreCase"
                      type="checkbox"
                      checked={settings.ignoreCase}
                      onChange={(e) => setSettings((prev) => ({ ...prev, ignoreCase: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label
                      htmlFor="ignoreCase"
                      className="text-sm"
                    >
                      Ignore Case
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Text Input */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Left Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="left-text">Original Text</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(leftText, "left text")}
                        disabled={!leftText}
                      >
                        {copiedText === "left text" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="left-text"
                      value={leftText}
                      onChange={(e) => setLeftText(e.target.value)}
                      placeholder="Enter original text..."
                      className="min-h-[200px] font-mono"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Right Text</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="right-text">Modified Text</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(rightText, "right text")}
                        disabled={!rightText}
                      >
                        {copiedText === "right text" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Textarea
                      id="right-text"
                      value={rightText}
                      onChange={(e) => setRightText(e.target.value)}
                      placeholder="Enter modified text..."
                      className="min-h-[200px] font-mono"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Diff Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded">
                    <div className="text-lg font-bold text-green-600">{realtimeDiff.statistics.addedLines}</div>
                    <div className="text-xs text-muted-foreground">Added Lines</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded">
                    <div className="text-lg font-bold text-red-600">{realtimeDiff.statistics.removedLines}</div>
                    <div className="text-xs text-muted-foreground">Removed Lines</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded">
                    <div className="text-lg font-bold text-yellow-600">{realtimeDiff.statistics.modifiedLines}</div>
                    <div className="text-xs text-muted-foreground">Modified Lines</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded">
                    <div className="text-lg font-bold text-blue-600">
                      {realtimeDiff.statistics.similarity.toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Similarity</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">{realtimeDiff.statistics.totalLines}</div>
                    <div className="text-xs text-muted-foreground">Total Lines</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">{realtimeDiff.statistics.unchangedLines}</div>
                    <div className="text-xs text-muted-foreground">Unchanged Lines</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">
                      {realtimeDiff.statistics.addedWords + realtimeDiff.statistics.removedWords}
                    </div>
                    <div className="text-xs text-muted-foreground">Word Changes</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <div className="text-lg font-bold">{realtimeDiff.statistics.executionTime.toFixed(2)}ms</div>
                    <div className="text-xs text-muted-foreground">Execution Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Diff Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Diff Results
                  <div className="ml-auto flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const diffText = realtimeDiff.lines
                          .map((line) => {
                            switch (line.type) {
                              case "added":
                                return `+${line.content}`
                              case "removed":
                                return `-${line.content}`
                              case "unchanged":
                                return ` ${line.content}`
                              case "modified":
                                return `~${line.leftContent} -> ${line.rightContent}`
                              default:
                                return line.content
                            }
                          })
                          .join("\n")
                        copyToClipboard(diffText, "diff result")
                      }}
                      disabled={realtimeDiff.lines.length === 0}
                    >
                      {copiedText === "diff result" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {realtimeDiff.lines.length > 0 ? (
                  <div className="space-y-2">
                    {/* View Mode Selector */}
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        size="sm"
                        variant={settings.format === "side-by-side" ? "default" : "outline"}
                        onClick={() => setSettings((prev) => ({ ...prev, format: "side-by-side" }))}
                      >
                        <Columns className="h-4 w-4 mr-2" />
                        Side by Side
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.format === "unified" ? "default" : "outline"}
                        onClick={() => setSettings((prev) => ({ ...prev, format: "unified" }))}
                      >
                        <Split className="h-4 w-4 mr-2" />
                        Unified
                      </Button>
                      <Button
                        size="sm"
                        variant={settings.format === "inline" ? "default" : "outline"}
                        onClick={() => setSettings((prev) => ({ ...prev, format: "inline" }))}
                      >
                        <ArrowLeftRight className="h-4 w-4 mr-2" />
                        Inline
                      </Button>
                    </div>

                    {/* Diff Display */}
                    <div className="border rounded-lg overflow-hidden">
                      {settings.format === "side-by-side" ? (
                        <div className="grid grid-cols-2 divide-x">
                          <div className="p-4 bg-red-50/30 dark:bg-red-950/10">
                            <h4 className="font-medium mb-2 text-red-700 dark:text-red-400">Original</h4>
                            <div className="font-mono text-sm space-y-1">
                              {realtimeDiff.lines.map((line, index) => (
                                <div
                                  key={index}
                                  className={`flex ${
                                    line.type === "removed"
                                      ? "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300"
                                      : line.type === "modified"
                                        ? "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300"
                                        : line.type === "unchanged"
                                          ? "text-muted-foreground"
                                          : "opacity-50"
                                  }`}
                                >
                                  {settings.showLineNumbers && (
                                    <span className="w-8 text-right mr-2 text-xs text-muted-foreground">
                                      {line.leftLineNumber || ""}
                                    </span>
                                  )}
                                  <span className="flex-1 whitespace-pre-wrap">
                                    {line.type === "added" ? "" : line.leftContent || line.content}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="p-4 bg-green-50/30 dark:bg-green-950/10">
                            <h4 className="font-medium mb-2 text-green-700 dark:text-green-400">Modified</h4>
                            <div className="font-mono text-sm space-y-1">
                              {realtimeDiff.lines.map((line, index) => (
                                <div
                                  key={index}
                                  className={`flex ${
                                    line.type === "added"
                                      ? "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300"
                                      : line.type === "modified"
                                        ? "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300"
                                        : line.type === "unchanged"
                                          ? "text-muted-foreground"
                                          : "opacity-50"
                                  }`}
                                >
                                  {settings.showLineNumbers && (
                                    <span className="w-8 text-right mr-2 text-xs text-muted-foreground">
                                      {line.rightLineNumber || ""}
                                    </span>
                                  )}
                                  <span className="flex-1 whitespace-pre-wrap">
                                    {line.type === "removed" ? "" : line.rightContent || line.content}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="font-mono text-sm space-y-1">
                            {realtimeDiff.lines.map((line, index) => (
                              <div
                                key={index}
                                className={`flex ${
                                  line.type === "added"
                                    ? "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300"
                                    : line.type === "removed"
                                      ? "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300"
                                      : line.type === "modified"
                                        ? "bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300"
                                        : "text-muted-foreground"
                                }`}
                              >
                                <span className="w-4 text-center mr-2">
                                  {line.type === "added"
                                    ? "+"
                                    : line.type === "removed"
                                      ? "-"
                                      : line.type === "modified"
                                        ? "~"
                                        : " "}
                                </span>
                                {settings.showLineNumbers && (
                                  <span className="w-8 text-right mr-2 text-xs text-muted-foreground">
                                    {line.leftLineNumber || line.rightLineNumber || ""}
                                  </span>
                                )}
                                <span className="flex-1 whitespace-pre-wrap">{line.content}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <GitCompare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter text in both fields to see the diff</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-3 justify-center">
                  <Button
                    onClick={() => exportUnifiedDiff(realtimeDiff, "left.txt", "right.txt")}
                    variant="outline"
                    disabled={realtimeDiff.lines.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Patch
                  </Button>

                  <Button
                    onClick={() => exportHTML(realtimeDiff, "left.txt", "right.txt")}
                    variant="outline"
                    disabled={realtimeDiff.lines.length === 0}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Export HTML
                  </Button>

                  <Button
                    onClick={() => {
                      const diffText = realtimeDiff.lines
                        .map((line) => {
                          switch (line.type) {
                            case "added":
                              return `+${line.content}`
                            case "removed":
                              return `-${line.content}`
                            case "unchanged":
                              return ` ${line.content}`
                            case "modified":
                              return `~${line.leftContent} -> ${line.rightContent}`
                            default:
                              return line.content
                          }
                        })
                        .join("\n")
                      copyToClipboard(diffText, "diff text")
                    }}
                    variant="outline"
                    disabled={realtimeDiff.lines.length === 0}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Diff
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* File Comparison Tab */}
          <TabsContent
            value="files"
            className="space-y-4"
          >
            {/* File Upload */}
            <Card>
              <CardContent className="pt-6">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
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
                  <h3 className="text-lg font-semibold mb-2">Upload Text Files</h3>
                  <p className="text-muted-foreground mb-4">
                    Drag and drop your text files here, or click to select files
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="mb-2"
                  >
                    <FileImage className="mr-2 h-4 w-4" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports TXT, LOG, CSV, JSON, MD, JS, TS, PY and other text files • Max 50MB per file
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".txt,.log,.csv,.json,.md,.markdown,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.c,.h,.css,.html,.xml,.yaml,.yml"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            {totalStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Batch Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{totalStats.totalPairs}</div>
                      <div className="text-sm text-muted-foreground">Pairs Processed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{totalStats.totalAddedLines}</div>
                      <div className="text-sm text-muted-foreground">Total Added Lines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{totalStats.totalRemovedLines}</div>
                      <div className="text-sm text-muted-foreground">Total Removed Lines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{totalStats.totalModifiedLines}</div>
                      <div className="text-sm text-muted-foreground">Total Modified Lines</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{totalStats.averageSimilarity.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Avg Similarity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {totalStats.averageExecutionTime.toFixed(2)}ms
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Execution Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {(files.length > 0 || pairs.length > 0) && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button
                      onClick={processPairs}
                      disabled={isProcessing || pairs.every((p) => p.status !== "pending")}
                      className="min-w-32"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Process Pairs
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={() => exportBatch(pairs)}
                      variant="outline"
                      disabled={!pairs.some((p) => p.status === "completed")}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Results
                    </Button>

                    <Button
                      onClick={() => exportCSV(pairs)}
                      variant="outline"
                      disabled={!pairs.some((p) => p.result)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Export Stats
                    </Button>

                    <Button
                      onClick={clearAll}
                      variant="destructive"
                      disabled={isProcessing}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* File List */}
            {files.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Files ({files.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="h-6 w-6 text-muted-foreground shrink-0 mt-1" />
                          <div className="flex-1 min-w-0">
                            <h4
                              className="font-medium truncate"
                              title={file.name}
                            >
                              {file.name}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)} • {file.type}
                            </div>
                            {file.error && <div className="text-red-600 text-sm mt-1">Error: {file.error}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(file.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Pairing Options */}
                        <div className="mt-3 pt-3 border-t">
                          <Label className="text-xs font-medium">Pair with:</Label>
                          <div className="mt-1 space-y-1">
                            {files
                              .filter((f) => f.id !== file.id && !f.pairedWith)
                              .slice(0, 3)
                              .map((otherFile) => (
                                <Button
                                  key={otherFile.id}
                                  size="sm"
                                  variant="outline"
                                  onClick={() => createPair(file, otherFile)}
                                  className="w-full text-xs"
                                >
                                  vs {otherFile.name}
                                </Button>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pairs List */}
            {pairs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comparison Pairs ({pairs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pairs.map((pair) => (
                      <div
                        key={pair.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">
                                {pair.leftFile.name} vs {pair.rightFile.name}
                              </h4>
                              <div
                                className={`px-2 py-1 rounded text-xs ${
                                  pair.status === "completed"
                                    ? "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-300"
                                    : pair.status === "processing"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                                      : pair.status === "error"
                                        ? "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-300"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-950/30 dark:text-gray-300"
                                }`}
                              >
                                {pair.status}
                              </div>
                            </div>

                            {pair.result && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                  <span className="font-medium text-green-600">
                                    +{pair.result.statistics.addedLines}
                                  </span>
                                  <span className="text-muted-foreground"> added</span>
                                </div>
                                <div>
                                  <span className="font-medium text-red-600">
                                    -{pair.result.statistics.removedLines}
                                  </span>
                                  <span className="text-muted-foreground"> removed</span>
                                </div>
                                <div>
                                  <span className="font-medium text-yellow-600">
                                    ~{pair.result.statistics.modifiedLines}
                                  </span>
                                  <span className="text-muted-foreground"> modified</span>
                                </div>
                                <div>
                                  <span className="font-medium text-blue-600">
                                    {pair.result.statistics.similarity.toFixed(1)}%
                                  </span>
                                  <span className="text-muted-foreground"> similar</span>
                                </div>
                              </div>
                            )}

                            {pair.error && <div className="text-red-600 text-sm">Error: {pair.error}</div>}
                          </div>

                          <div className="flex items-center gap-2">
                            {pair.result && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    exportUnifiedDiff(pair.result!, pair.leftFile.name, pair.rightFile.name)
                                  }
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const diffText = pair
                                      .result!.lines.map((line) => {
                                        switch (line.type) {
                                          case "added":
                                            return `+${line.content}`
                                          case "removed":
                                            return `-${line.content}`
                                          case "unchanged":
                                            return ` ${line.content}`
                                          case "modified":
                                            return `~${line.leftContent} -> ${line.rightContent}`
                                          default:
                                            return line.content
                                        }
                                      })
                                      .join("\n")
                                    copyToClipboard(diffText, pair.id)
                                  }}
                                >
                                  {copiedText === pair.id ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removePair(pair.id)}
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

// Main component with error boundary
const DiffViewer = () => {
  return <DiffViewerCore />
}

export default DiffViewer
