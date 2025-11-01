/**
 * 统一错误处理工具类
 * 提供统一的错误捕获、处理和上报机制
 * 支持 Sentry 集成（可选，通过环境变量配置）
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  RUNTIME = 'runtime',
  SECURITY = 'security',
  UNKNOWN = 'unknown',
}

export interface ErrorContext {
  component?: string
  action?: string
  userId?: string
  metadata?: Record<string, unknown>
}

export interface ErrorReport {
  message: string
  stack?: string
  level: LogLevel
  severity: ErrorSeverity
  category: ErrorCategory
  timestamp: number
  context?: ErrorContext
  userAgent?: string
  url?: string
  recoverySuggestions?: string[]
}

export interface SentryConfig {
  dsn?: string
  environment?: string
  release?: string
  enabled?: boolean
}

class ErrorHandler {
  private logLevel: LogLevel = LogLevel.INFO
  private errorReports: ErrorReport[] = []
  private maxReports = 100
  private errorReportingEnabled = false
  private errorReportingUrl?: string
  private sentryConfig?: SentryConfig
  private sentryInitialized = false

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel) {
    this.logLevel = level
  }

  /**
   * 配置 Sentry（可选）
   */
  configureSentry(config: SentryConfig) {
    this.sentryConfig = config
    if (config.enabled && config.dsn) {
      this.initSentry(config)
    }
  }

  /**
   * 初始化 Sentry（动态导入，避免在生产环境增加 bundle 大小）
   */
  private async initSentry(config: SentryConfig) {
    if (this.sentryInitialized) {
      return
    }

    try {
      // 使用字符串字面量动态导入，避免 Vite 静态分析
      const sentryModuleName = '@sentry/react'
      // @ts-ignore - Sentry 是可选的，可能未安装
      const Sentry = await import(/* @vite-ignore */ sentryModuleName).catch(() => null)
      if (Sentry && config.dsn) {
        // @ts-ignore - Sentry 类型可能不存在
        Sentry.init({
          dsn: config.dsn,
          environment: config.environment || import.meta.env.MODE,
          release: config.release,
          integrations: [
            // @ts-ignore
            Sentry.browserTracingIntegration(),
            // @ts-ignore
            Sentry.replayIntegration({
              maskAllText: true,
              blockAllMedia: true,
            }),
          ],
          tracesSampleRate: 1.0,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0,
        })
        this.sentryInitialized = true
      }
    } catch (error) {
      console.warn('[ErrorHandler] Sentry not available:', error)
    }
  }

  /**
   * 上报错误到 Sentry
   */
  private reportToSentry(error: Error, context?: ErrorContext) {
    if (!this.sentryInitialized || !this.sentryConfig?.enabled) {
      return
    }

    // 使用字符串字面量动态导入，避免 Vite 静态分析
    const sentryModuleName = '@sentry/react'
    // @ts-ignore - Sentry 是可选的，可能未安装
    import(/* @vite-ignore */ sentryModuleName)
      .then((Sentry: any) => {
        // @ts-ignore - Sentry 类型可能不存在
        Sentry.captureException(error, {
          tags: {
            component: context?.component || 'Unknown',
            action: context?.action || 'Unknown',
          },
          extra: context?.metadata,
        })
      })
      .catch(() => {
        // Sentry 未安装，静默失败
      })
  }

  /**
   * 启用错误上报
   */
  enableErrorReporting(url?: string) {
    this.errorReportingEnabled = true
    this.errorReportingUrl = url
  }

  /**
   * 禁用错误上报
   */
  disableErrorReporting() {
    this.errorReportingEnabled = false
  }

  /**
   * 分析错误并生成恢复建议
   */
  private generateRecoverySuggestions(error: Error, category: ErrorCategory): string[] {
    const suggestions: string[] = []

    switch (category) {
      case ErrorCategory.NETWORK:
        suggestions.push('检查网络连接')
        suggestions.push('稍后重试')
        suggestions.push('检查防火墙设置')
        break
      case ErrorCategory.VALIDATION:
        suggestions.push('检查输入数据格式')
        suggestions.push('确保所有必填字段已填写')
        suggestions.push('参考工具使用说明')
        break
      case ErrorCategory.RUNTIME:
        suggestions.push('刷新页面重试')
        suggestions.push('清除浏览器缓存')
        suggestions.push('检查浏览器控制台获取更多信息')
        break
      case ErrorCategory.SECURITY:
        suggestions.push('检查权限设置')
        suggestions.push('确认操作权限')
        break
      default:
        suggestions.push('刷新页面重试')
        suggestions.push('如果问题持续，请联系技术支持')
    }

    // 根据错误消息添加特定建议
    if (error.message.includes('timeout')) {
      suggestions.push('操作超时，请重试')
    } else if (error.message.includes('memory')) {
      suggestions.push('数据量过大，尝试分批处理')
    } else if (error.message.includes('permission')) {
      suggestions.push('检查文件或操作权限')
    }

    return suggestions
  }

  /**
   * 分类错误
   */
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase()
    const stack = error.stack?.toLowerCase() || ''

    if (message.includes('network') || message.includes('fetch') || message.includes('request')) {
      return ErrorCategory.NETWORK
    }
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return ErrorCategory.VALIDATION
    }
    if (message.includes('security') || message.includes('permission') || message.includes('unauthorized')) {
      return ErrorCategory.SECURITY
    }
    if (stack.includes('typeerror') || stack.includes('referenceerror') || stack.includes('syntaxerror')) {
      return ErrorCategory.RUNTIME
    }

    return ErrorCategory.UNKNOWN
  }

  /**
   * 评估错误严重程度
   */
  private assessSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    const message = error.message.toLowerCase()

    // 关键错误
    if (
      category === ErrorCategory.SECURITY ||
      message.includes('critical') ||
      message.includes('fatal') ||
      message.includes('corrupt')
    ) {
      return ErrorSeverity.CRITICAL
    }

    // 高严重性错误
    if (
      category === ErrorCategory.RUNTIME ||
      message.includes('error') ||
      message.includes('failed') ||
      message.includes('exception')
    ) {
      return ErrorSeverity.HIGH
    }

    // 中等严重性错误
    if (category === ErrorCategory.NETWORK || message.includes('timeout') || message.includes('retry')) {
      return ErrorSeverity.MEDIUM
    }

    // 低严重性错误
    return ErrorSeverity.LOW
  }

  /**
   * 记录错误
   */
  logError(error: Error | string, context?: ErrorContext): void {
    const errorObj = error instanceof Error ? error : new Error(error)
    const message = errorObj.message
    const stack = errorObj.stack

    // 分类和评估错误
    const category = this.categorizeError(errorObj)
    const severity = this.assessSeverity(errorObj, category)
    const recoverySuggestions = this.generateRecoverySuggestions(errorObj, category)

    const report: ErrorReport = {
      message,
      stack,
      level: LogLevel.ERROR,
      severity,
      category,
      timestamp: Date.now(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      recoverySuggestions,
    }

    this.addReport(report)

    // 控制台输出
    if (this.logLevel <= LogLevel.ERROR) {
      console.error('[ErrorHandler]', message, {
        category,
        severity,
        context,
        stack,
        recoverySuggestions,
      })
    }

    // 上报到 Sentry
    this.reportToSentry(errorObj, context)

    // 上报到自定义服务器
    if (this.errorReportingEnabled) {
      this.reportError(report)
    }
  }

  /**
   * 记录警告
   */
  logWarning(message: string, context?: ErrorContext): void {
    const report: ErrorReport = {
      message,
      level: LogLevel.WARN,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.UNKNOWN,
      timestamp: Date.now(),
      context,
    }

    this.addReport(report)

    if (this.logLevel <= LogLevel.WARN) {
      console.warn('[ErrorHandler]', message, { context })
    }
  }

  /**
   * 记录信息
   */
  logInfo(message: string, context?: ErrorContext): void {
    if (this.logLevel <= LogLevel.INFO) {
      console.info('[ErrorHandler]', message, { context })
    }
  }

  /**
   * 记录调试信息
   */
  logDebug(message: string, context?: ErrorContext): void {
    if (this.logLevel <= LogLevel.DEBUG) {
      console.debug('[ErrorHandler]', message, { context })
    }
  }

  /**
   * 获取错误报告
   */
  getReports(): ErrorReport[] {
    return [...this.errorReports]
  }

  /**
   * 获取最新的错误报告
   */
  getLatestReport(): ErrorReport | null {
    return this.errorReports.length > 0 ? this.errorReports[this.errorReports.length - 1] : null
  }

  /**
   * 根据严重程度获取错误报告
   */
  getReportsBySeverity(severity: ErrorSeverity): ErrorReport[] {
    return this.errorReports.filter((report) => report.severity === severity)
  }

  /**
   * 根据分类获取错误报告
   */
  getReportsByCategory(category: ErrorCategory): ErrorReport[] {
    return this.errorReports.filter((report) => report.category === category)
  }

  /**
   * 清除错误报告
   */
  clearReports(): void {
    this.errorReports = []
  }

  /**
   * 处理 Promise 错误
   */
  handlePromiseRejection(error: unknown, context?: ErrorContext): void {
    if (error instanceof Error) {
      this.logError(error, context)
    } else {
      this.logError(String(error), context)
    }
  }

  /**
   * 包装异步函数，自动捕获错误
   */
  wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context?: ErrorContext): T {
    return ((...args: Parameters<T>) => {
      return fn(...args).catch((error) => {
        this.handlePromiseRejection(error, context)
        throw error
      })
    }) as T
  }

  /**
   * 添加错误报告
   */
  private addReport(report: ErrorReport): void {
    this.errorReports.push(report)
    if (this.errorReports.length > this.maxReports) {
      this.errorReports.shift()
    }
  }

  /**
   * 上报错误到服务器
   */
  private async reportError(report: ErrorReport): Promise<void> {
    if (!this.errorReportingUrl) {
      return
    }

    try {
      await fetch(this.errorReportingUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      })
    } catch (error) {
      // 静默失败，避免错误上报本身导致错误
      console.warn('[ErrorHandler] Failed to report error:', error)
    }
  }
}

// 单例实例
export const errorHandler = new ErrorHandler()

// 开发环境默认启用 DEBUG 级别
if (import.meta.env.DEV) {
  errorHandler.setLogLevel(LogLevel.DEBUG)
} else {
  errorHandler.setLogLevel(LogLevel.WARN)
}

// 配置 Sentry（如果环境变量中有配置）
if (typeof window !== 'undefined' && import.meta.env.VITE_SENTRY_DSN) {
  errorHandler.configureSentry({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    enabled: import.meta.env.PROD, // 仅在生产环境启用
  })
}

// 全局错误处理
if (typeof window !== 'undefined') {
  // 捕获未处理的错误
  window.addEventListener('error', (event) => {
    errorHandler.logError(event.error || event.message, {
      component: 'Global',
      action: 'UnhandledError',
    })
  })

  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handlePromiseRejection(event.reason, {
      component: 'Global',
      action: 'UnhandledRejection',
    })
  })
}

export default errorHandler
