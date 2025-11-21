import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw, Info, Lightbulb, Copy, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { errorHandler, ErrorSeverity } from "@/lib/utils/error-handler"
import { logger } from "@/lib/data/logger"

interface ToolErrorBoundaryProps {
  toolName: string
  children: React.ReactNode
}

interface ToolErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
  recoverySuggestions?: string[]
  errorSeverity?: ErrorSeverity
}

export class ToolErrorBoundary extends React.Component<ToolErrorBoundaryProps, ToolErrorBoundaryState> {
  constructor(props: ToolErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ToolErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 使用统一的错误处理系统
    errorHandler.logError(error, {
      component: "ToolErrorBoundary",
      action: "ComponentError",
      metadata: {
        toolName: this.props.toolName,
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
      },
    })

    logger.error(`Error in ${this.props.toolName}`, error, {
      toolName: this.props.toolName,
      componentStack: errorInfo.componentStack,
    })

    // 获取错误报告以获取恢复建议
    const latestReport = errorHandler.getLatestReport()

    this.setState({
      errorInfo,
      recoverySuggestions: latestReport?.recoverySuggestions,
      errorSeverity: latestReport?.severity,
    })

    toast.error(`An error occurred in ${this.props.toolName}`)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined, recoverySuggestions: undefined })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleCopyError = () => {
    if (!this.state.error) return

    const errorText = `Error: ${this.state.error.message}\n\nStack:\n${this.state.error.stack || "No stack trace"}`
    navigator.clipboard.writeText(errorText).then(() => {
      toast.success("Error details copied to clipboard")
    })
  }

  render() {
    if (this.state.hasError) {
      const severityColor =
        this.state.errorSeverity === ErrorSeverity.CRITICAL
          ? "text-red-600"
          : this.state.errorSeverity === ErrorSeverity.HIGH
            ? "text-orange-600"
            : "text-yellow-600"

      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${severityColor}`}>
              <AlertCircle className="h-5 w-5" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The {this.props.toolName} tool encountered an error. Don't worry, you can try to recover from this error.
            </p>

            {/* 恢复建议 */}
            {this.state.recoverySuggestions && this.state.recoverySuggestions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">Recovery Suggestions</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  {this.state.recoverySuggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 错误详情（开发环境） */}
            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="bg-muted p-4 rounded-lg">
                <summary className="cursor-pointer font-medium mb-2 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong className="text-sm">Message:</strong>
                    <pre className="text-xs overflow-auto bg-background p-2 rounded mt-1">
                      {this.state.error.message}
                    </pre>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong className="text-sm">Stack Trace:</strong>
                      <pre className="text-xs overflow-auto bg-background p-2 rounded mt-1 max-h-48">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorSeverity && (
                    <div className="text-xs text-muted-foreground">
                      Severity: <span className="font-mono">{this.state.errorSeverity}</span>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={this.handleCopyError}
                    className="mt-2"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Error Details
                  </Button>
                </div>
              </details>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1 min-w-[120px]"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleRefresh}
                className="flex-1 min-w-[120px]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
            </div>

            {/* 帮助信息 */}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              <p>
                If this error persists, please check the browser console for more details or contact support with the
                error information.
              </p>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
