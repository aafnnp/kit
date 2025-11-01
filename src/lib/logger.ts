/**
 * 日志系统
 * 提供分级日志记录功能
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

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private logLevel: LogLevel = LogLevel.INFO
  private enabled = true

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
   * 导出日志
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 内部日志方法
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>, stack?: string): void {
    if (!this.enabled || level < this.logLevel) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
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

    if (context || stack) {
      consoleMethod(prefix, message, { context, stack })
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

// 生产环境隐藏敏感信息
if (import.meta.env.PROD) {
  // 可以在这里添加敏感信息过滤逻辑
}

export default logger
