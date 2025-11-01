/**
 * 统一错误处理工具类
 * 提供统一的错误捕获、处理和上报机制
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
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
  timestamp: number
  context?: ErrorContext
  userAgent?: string
  url?: string
}

class ErrorHandler {
  private logLevel: LogLevel = LogLevel.INFO
  private errorReports: ErrorReport[] = []
  private maxReports = 100
  private errorReportingEnabled = false
  private errorReportingUrl?: string

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel) {
    this.logLevel = level
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
   * 记录错误
   */
  logError(error: Error | string, context?: ErrorContext): void {
    const message = error instanceof Error ? error.message : error
    const stack = error instanceof Error ? error.stack : undefined

    const report: ErrorReport = {
      message,
      stack,
      level: LogLevel.ERROR,
      timestamp: Date.now(),
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    }

    this.addReport(report)

    // 控制台输出
    if (this.logLevel <= LogLevel.ERROR) {
      console.error('[ErrorHandler]', message, { context, stack })
    }

    // 上报错误
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
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: ErrorContext
  ): T {
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

