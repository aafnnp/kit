import { describe, it, expect, beforeEach, vi } from 'vitest'
import { logger, LogLevel } from '@/lib/logger'

describe('Logger', () => {
  beforeEach(() => {
    logger.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should log info message', () => {
    logger.info('Test info', { key: 'value' })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('Test info')
    expect(logs[0].level).toBe(LogLevel.INFO)
    expect(logs[0].context).toEqual({ key: 'value' })
  })

  it('should log error with Error object', () => {
    const error = new Error('Test error')
    logger.error('Error occurred', error, { component: 'Test' })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].message).toBe('Error occurred')
    expect(logs[0].level).toBe(LogLevel.ERROR)
    expect(logs[0].context).toMatchObject({
      component: 'Test',
      errorMessage: 'Test error',
    })
  })

  it('should respect log level', () => {
    logger.setLogLevel(LogLevel.WARN)

    logger.debug('Debug message')
    logger.info('Info message')
    logger.warn('Warn message')
    logger.error('Error message')

    const logs = logger.getLogs()
    expect(logs).toHaveLength(2) // Only WARN and ERROR
    expect(logs.every((log) => log.level >= LogLevel.WARN)).toBe(true)
  })

  it('should log performance metrics', () => {
    logger.setLogLevel(LogLevel.INFO) // Ensure INFO level is set
    logger.performance('Test operation', 123.45, { component: 'Test' })

    const logs = logger.getLogs()
    expect(logs).toHaveLength(1)
    expect(logs[0].context).toMatchObject({
      duration: 123.45,
      unit: 'ms',
    })
  })

  it('should export logs as JSON', () => {
    logger.info('Test')
    const exported = logger.export()
    expect(() => JSON.parse(exported)).not.toThrow()
  })
})
