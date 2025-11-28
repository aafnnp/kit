import { useState, useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Copy, Download, Upload, RotateCcw, Wand2 } from "lucide-react"
import { useCopyToClipboard } from "@/hooks/use-clipboard"
import { CodeFormatterState, LANGUAGE_CONFIGS, FormatOptions, LanguageConfig } from "@/components/tools/code-formatter/schema"
import { ToolBase } from "@/components/common/tool-base"

// 简化的代码格式化函数（实际项目中可以使用 prettier 等库）
const formatCode = async (code: string, options: FormatOptions): Promise<string> => {
  // 这里是一个简化的格式化实现
  // 在实际项目中，你可以集成 prettier 或其他格式化库

  if (options.parser === "json") {
    try {
      const parsed = JSON.parse(code)
      return JSON.stringify(parsed, null, options.useTabs ? "\t" : " ".repeat(options.tabWidth))
    } catch (error) {
      throw new Error("Invalid JSON format")
    }
  }

  // 简单的 JavaScript/TypeScript 格式化
  if (options.parser === "babel" || options.parser === "typescript") {
    let formatted = code
      .replace(/;/g, options.semi ? ";" : "")
      .replace(/'/g, options.singleQuote ? "'" : '"')
      .replace(/"/g, options.singleQuote ? "'" : '"')

    // 简单的缩进处理
    const lines = formatted.split("\n")
    let indentLevel = 0
    const indentStr = options.useTabs ? "\t" : " ".repeat(options.tabWidth)

    const formattedLines = lines.map((line) => {
      const trimmed = line.trim()
      if (trimmed.includes("}")) indentLevel = Math.max(0, indentLevel - 1)
      const result = indentStr.repeat(indentLevel) + trimmed
      if (trimmed.includes("{")) indentLevel++
      return result
    })

    return formattedLines.join("\n")
  }

  // 简单的 CSS 格式化
  if (options.parser === "css") {
    return code
      .replace(/\{/g, options.bracketSpacing ? " {\n" : "{\n")
      .replace(/\}/g, "\n}\n")
      .replace(/;/g, ";\n")
      .replace(/,/g, ", ")
      .split("\n")
      .map((line) => {
        const trimmed = line.trim()
        if (trimmed.endsWith("{") || trimmed.endsWith("}")) {
          return trimmed
        }
        return trimmed ? (options.useTabs ? "\t" : " ".repeat(options.tabWidth)) + trimmed : ""
      })
      .join("\n")
  }

  // 简单的 HTML 格式化
  if (options.parser === "html") {
    const indentStr = options.useTabs ? "\t" : " ".repeat(options.tabWidth)
    let indentLevel = 0

    return code
      .replace(/></g, ">\n<")
      .split("\n")
      .map((line) => {
        const trimmed = line.trim()
        if (trimmed.startsWith("</")) indentLevel = Math.max(0, indentLevel - 1)
        const result = indentStr.repeat(indentLevel) + trimmed
        if (trimmed.startsWith("<") && !trimmed.startsWith("</") && !trimmed.endsWith("/>")) indentLevel++
        return result
      })
      .join("\n")
  }

  return code
}

export function CodeFormatter() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  const [state, setState] = useState<CodeFormatterState>({
    input: "",
    output: "",
    language: "javascript",
    options: {
      tabWidth: 2,
      useTabs: false,
      semicolons: true,
      singleQuote: false,
      trailingComma: "es5",
      bracketSpacing: true,
      jsxBracketSameLine: false,
    },
    isFormatting: false,
    error: null,
  })

  const handleFormat = useCallback(async () => {
    if (!state.input.trim()) return

    setState((prev) => ({ ...prev, isFormatting: true, error: null }))

    try {
      const formatOptions: FormatOptions = {
        parser: LANGUAGE_CONFIGS[state.language].parser,
        tabWidth: state.options.tabWidth,
        useTabs: state.options.useTabs,
        semi: state.options.semicolons,
        singleQuote: state.options.singleQuote,
        trailingComma: state.options.trailingComma,
        bracketSpacing: state.options.bracketSpacing,
        jsxBracketSameLine: state.options.jsxBracketSameLine,
      }

      const formatted = await formatCode(state.input, formatOptions)
      setState((prev) => ({ ...prev, output: formatted }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Formatting failed",
      }))
    } finally {
      setState((prev) => ({ ...prev, isFormatting: false }))
    }
  }, [state.input, state.language, state.options])

  const handleLoadExample = useCallback(() => {
    const example = LANGUAGE_CONFIGS[state.language].example
    setState((prev) => ({ ...prev, input: example, output: "", error: null }))
  }, [state.language])

  const handleClear = useCallback(() => {
    setState((prev) => ({ ...prev, input: "", output: "", error: null }))
  }, [])

  const handleCopy = useCallback(() => {
    if (state.output) {
      copyToClipboard(state.output)
    }
  }, [state.output, copyToClipboard])

  const handleDownload = useCallback(() => {
    if (!state.output) return

    const extension = {
      javascript: "js",
      typescript: "ts",
      css: "css",
      html: "html",
      json: "json",
    }[state.language]

    const blob = new Blob([state.output], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `formatted.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [state.output, state.language])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setState((prev) => ({ ...prev, input: content, output: "", error: null }))
    }
    reader.readAsText(file)
  }, [])

  // 自动格式化
  useEffect(() => {
    if (state.input.trim()) {
      const timer = setTimeout(() => {
        handleFormat()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [state.input, handleFormat])

  return (
    <ToolBase
      toolName={t("tools.code-formatter.title", "Code Formatter")}
      icon={<Wand2 className="w-5 h-5" />}
      description={t("tools.code-formatter.description", "Format and beautify your code with customizable options")}
    >
      <div className="space-y-6">
        {/* 配置选项 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("tools.code-formatter.options", "Formatting Options")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 语言选择 */}
            <div className="space-y-2">
              <Label>{t("tools.code-formatter.language", "Language")}</Label>
              <Select
                value={state.language}
                onValueChange={(value: any) =>
                  setState((prev) => ({ ...prev, language: value, output: "", error: null }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_CONFIGS).map(([key, config]: [string, LanguageConfig]) => (
                    <SelectItem
                      key={key}
                      value={key}
                    >
                      {config.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 缩进设置 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  {t("tools.code-formatter.tab-width", "Tab Width")}: {state.options.tabWidth}
                </Label>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={state.options.tabWidth}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      options: { ...prev.options, tabWidth: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="use-tabs"
                  checked={state.options.useTabs}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      options: { ...prev.options, useTabs: e.target.checked },
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="use-tabs">{t("tools.code-formatter.use-tabs", "Use Tabs")}</Label>
              </div>
            </div>

            {/* JavaScript/TypeScript 特定选项 */}
            {(state.language === "javascript" || state.language === "typescript") && (
              <>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="semicolons"
                      checked={state.options.semicolons}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          options: { ...prev.options, semicolons: e.target.checked },
                        }))
                      }
                      className="rounded"
                    />
                    <Label htmlFor="semicolons">{t("tools.code-formatter.semicolons", "Semicolons")}</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="single-quote"
                      checked={state.options.singleQuote}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          options: { ...prev.options, singleQuote: e.target.checked },
                        }))
                      }
                      className="rounded"
                    />
                    <Label htmlFor="single-quote">{t("tools.code-formatter.single-quote", "Single Quotes")}</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("tools.code-formatter.trailing-comma", "Trailing Comma")}</Label>
                  <Select
                    value={state.options.trailingComma}
                    onValueChange={(value: any) =>
                      setState((prev) => ({
                        ...prev,
                        options: { ...prev.options, trailingComma: value },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="es5">ES5</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* CSS/HTML 特定选项 */}
            {(state.language === "css" || state.language === "html") && (
              <>
                <Separator />
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="bracket-spacing"
                    checked={state.options.bracketSpacing}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        options: { ...prev.options, bracketSpacing: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                  <Label htmlFor="bracket-spacing">
                    {t("tools.code-formatter.bracket-spacing", "Bracket Spacing")}
                  </Label>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={handleLoadExample}
            variant="outline"
            size="sm"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {t("tools.code-formatter.load-example", "Load Example")}
          </Button>

          <Button
            onClick={handleClear}
            variant="outline"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {t("common.clear", "Clear")}
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".js,.ts,.css,.html,.json"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button
              variant="outline"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {t("common.upload", "Upload File")}
            </Button>
          </div>
        </div>

        {/* 输入区域 */}
        <div className="space-y-2">
          <Label>{t("tools.code-formatter.input", "Input Code")}</Label>
          <Textarea
            value={state.input}
            onChange={(e) => setState((prev) => ({ ...prev, input: e.target.value }))}
            placeholder={t("tools.code-formatter.input-placeholder", "Paste your code here...")}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        {/* 格式化按钮 */}
        <div className="flex justify-center">
          <Button
            onClick={handleFormat}
            disabled={!state.input.trim() || state.isFormatting}
            size="lg"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {state.isFormatting
              ? t("tools.code-formatter.formatting", "Formatting...")
              : t("tools.code-formatter.format", "Format Code")}
          </Button>
        </div>

        {/* 错误信息 */}
        {state.error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-destructive text-sm">{state.error}</p>
          </div>
        )}

        {/* 输出区域 */}
        {state.output && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t("tools.code-formatter.output", "Formatted Code")}</Label>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {t("common.copy", "Copy")}
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t("common.download", "Download")}
                </Button>
              </div>
            </div>
            <Textarea
              value={state.output}
              readOnly
              className="min-h-[200px] font-mono text-sm bg-muted"
            />
          </div>
        )}
      </div>
    </ToolBase>
  )
}

export default CodeFormatter
