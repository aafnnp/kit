/**
 * 日志系统
 * 提供分级日志记录功能
 * 支持生产环境敏感信息过滤和性能监控集成
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  context?: Record<string, unknown>
  stack?: string
}

// 敏感信息关键词列表（用于过滤）
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /api[_-]?key/i,
  /token/i,
  /auth/i,
  /credential/i,
  /bearer/i,
  /authorization/i,
  /cookie/i,
  /session/i,
]

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private logLevel: LogLevel = LogLevel.INFO
  private enabled = true
  private isProduction = import.meta.env.PROD

  /**
   * 设置日志级别
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  /**
   * 启用/禁用日志
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 过滤敏感信息
   */
  private sanitizeData(data: unknown): unknown {
    if (!this.isProduction) {
      return data // 开发环境不过滤
    }

    if (typeof data === 'string') {
      // 检查是否包含敏感关键词
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(data)) {
          return '[REDACTED]'
        }
      }
      return data
    }

    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        return data.map((item) => this.sanitizeData(item))
      }

      const sanitized: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(data)) {
        // 检查键名是否包含敏感关键词
        const isSensitiveKey = SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))
        if (isSensitiveKey) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitizeData(value)
        }
      }
      return sanitized
    }

    return data
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context)
  }

  /**
   * 记录信息
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context)
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context)
  }

  /**
   * 记录错误
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const errorContext = {
      ...context,
      ...(error instanceof Error
        ? {
            errorMessage: error.message,
            errorStack: error.stack,
            errorName: error.name,
          }
        : { error: String(error) }),
    }

    this.log(LogLevel.ERROR, message, errorContext, error instanceof Error ? error.stack : undefined)
  }

  /**
   * 记录性能指标
   */
  performance(label: string, duration: number, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, `Performance: ${label}`, {
      ...context,
      duration,
      unit: 'ms',
    })

    // 如果性能指标超过阈值，记录警告
    if (duration > 1000) {
      this.warn(`Slow performance detected: ${label} took ${duration}ms`, context)
    }
  }

  /**
   * 记录 Web Vitals 指标（与性能监控集成）
   */
  webVitals(metric: {
    name: string
    value: number
    rating?: 'good' | 'needs-improvement' | 'poor'
    id?: string
  }): void {
    const context: Record<string, unknown> = {
      value: metric.value,
      id: metric.id,
    }

    if (metric.rating) {
      context.rating = metric.rating
      if (metric.rating !== 'good') {
        this.warn(`Web Vital ${metric.name} is ${metric.rating}`, context)
      } else {
        this.info(`Web Vital ${metric.name}`, context)
      }
    } else {
      this.info(`Web Vital ${metric.name}`, context)
    }
  }

  /**
   * 获取日志
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter((log) => log.level >= level)
    }
    return [...this.logs]
  }

  /**
   * 清除日志
   */
  clear(): void {
    this.logs = []
  }

  /**
   * 导出日志（已过滤敏感信息）
   */
  export(): string {
    const sanitizedLogs = this.logs.map((log) => ({
      ...log,
      context: this.sanitizeData(log.context) as Record<string, unknown>,
    }))
    return JSON.stringify(sanitizedLogs, null, 2)
  }

  /**
   * 内部日志方法
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, stack?: string): void {
    if (!this.enabled || level < this.logLevel) {
      return
    }

    // 生产环境过滤敏感信息
    const sanitizedContext = this.isProduction ? this.sanitizeData(context) : context

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context: sanitizedContext as Record<string, unknown>,
      stack,
    }

    this.logs.push(entry)

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // 控制台输出
    const levelName = LogLevel[level]
    const consoleMethod = this.getConsoleMethod(level)
    const prefix = `[Logger:${levelName}]`

    if (sanitizedContext || stack) {
      consoleMethod(prefix, message, { context: sanitizedContext, stack })
    } else {
      consoleMethod(prefix, message)
    }
  }

  /**
   * 获取控制台方法
   */
  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug.bind(console)
      case LogLevel.INFO:
        return console.info.bind(console)
      case LogLevel.WARN:
        return console.warn.bind(console)
      case LogLevel.ERROR:
        return console.error.bind(console)
      default:
        return console.log.bind(console)
    }
  }
}

// 单例实例
export const logger = new Logger()

// 根据环境设置日志级别
if (import.meta.env.DEV) {
  logger.setLogLevel(LogLevel.DEBUG)
} else {
  logger.setLogLevel(LogLevel.WARN)
}

// 集成 Web Vitals（如果可用）
if (typeof window !== 'undefined') {
  try {
    import('web-vitals')
      .then((webVitals: any) => {
        // web-vitals v4 使用不同的 API
        // 检查是否有 onCLS 等函数，如果没有则使用默认导出
        const { onCLS, onLCP, onINP } = webVitals.default || webVitals

        if (onCLS) {
          onCLS((metric: any) =>
            logger.webVitals({
              name: 'CLS',
              value: metric.value,
              rating: metric.rating,
              id: metric.id,
            })
          )
        }

        if (onLCP) {
          onLCP((metric: any) =>
            logger.webVitals({
              name: 'LCP',
              value: metric.value,
              rating: metric.rating,
              id: metric.id,
            })
          )
        }

        if (onINP) {
          onINP((metric: any) =>
            logger.webVitals({
              name: 'INP',
              value: metric.value,
              rating: metric.rating,
              id: metric.id,
            })
          )
        }

        // 尝试使用其他指标（如果可用）
        const { onFCP, onTTFB } = webVitals.default || webVitals
        if (onFCP) {
          onFCP((metric: any) =>
            logger.webVitals({
              name: 'FCP',
              value: metric.value,
              rating: metric.rating,
              id: metric.id,
            })
          )
        }

        if (onTTFB) {
          onTTFB((metric: any) =>
            logger.webVitals({
              name: 'TTFB',
              value: metric.value,
              rating: metric.rating,
              id: metric.id,
            })
          )
        }
      })
      .catch(() => {
        // web-vitals 未安装，静默失败
      })
  } catch {
    // 忽略错误
  }
}

export default logger
