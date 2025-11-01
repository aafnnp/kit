import { describe, it, expect, beforeEach, vi } from 'vitest'
import { errorHandler, LogLevel } from '@/lib/data'

describe('ErrorHandler', () => {
  beforeEach(() => {
    errorHandler.clearReports()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should log error with context', () => {
    const error = new Error('Test error')
    const context = { component: 'TestComponent', action: 'test' }

    errorHandler.logError(error, context)

    const reports = errorHandler.getReports()
    expect(reports).toHaveLength(1)
    expect(reports[0].message).toBe('Test error')
    expect(reports[0].context).toEqual(context)
    expect(reports[0].level).toBe(LogLevel.ERROR)
  })

  it('should log warning', () => {
    errorHandler.logWarning('Test warning', { component: 'Test' })

    const reports = errorHandler.getReports()
    expect(reports).toHaveLength(1)
    expect(reports[0].message).toBe('Test warning')
    expect(reports[0].level).toBe(LogLevel.WARN)
  })

  it('should handle promise rejection', () => {
    const error = new Error('Promise rejection')
    errorHandler.handlePromiseRejection(error, { component: 'Test' })

    const reports = errorHandler.getReports()
    expect(reports).toHaveLength(1)
    expect(reports[0].message).toBe('Promise rejection')
  })

  it('should wrap async function and catch errors', async () => {
    const errorFn = async () => {
      throw new Error('Async error')
    }

    const wrappedFn = errorHandler.wrapAsync(errorFn, { component: 'Test' })

    await expect(wrappedFn()).rejects.toThrow('Async error')

    const reports = errorHandler.getReports()
    expect(reports).toHaveLength(1)
    expect(reports[0].message).toBe('Async error')
  })

  it('should limit report count', () => {
    errorHandler.setLogLevel(LogLevel.DEBUG)

    for (let i = 0; i < 150; i++) {
      errorHandler.logError(`Error ${i}`)
    }

    const reports = errorHandler.getReports()
    expect(reports.length).toBeLessThanOrEqual(100)
  })
})
