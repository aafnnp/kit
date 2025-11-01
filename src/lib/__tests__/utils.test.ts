import { describe, it, expect } from 'vitest'
import { cn, formatFileSize, isSafari, isTauri } from '@/lib/utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should handle null and undefined', () => {
    expect(cn('foo', null, undefined, 'bar')).toBe('foo bar')
  })

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo')
  })
})

describe('formatFileSize', () => {
  it('should format bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes')
    expect(formatFileSize(1024)).toBe('1 KB')
    expect(formatFileSize(1048576)).toBe('1 MB')
    expect(formatFileSize(1073741824)).toBe('1 GB')
  })

  it('should format decimal sizes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(2621440)).toBe('2.5 MB')
  })

  it('should handle very large sizes', () => {
    expect(formatFileSize(1099511627776)).toBe('1 TB')
    expect(formatFileSize(1125899906842624)).toBe('1 PB')
  })

  it('should handle fractional bytes', () => {
    expect(formatFileSize(512)).toBe('0.5 KB')
    expect(formatFileSize(256)).toBe('0.25 KB')
  })

  it('should handle edge cases', () => {
    expect(formatFileSize(1)).toBe('1 Bytes')
    expect(formatFileSize(1023)).toBe('1 KB')
    expect(formatFileSize(1025)).toBe('1 KB')
  })
})

describe('isSafari', () => {
  beforeEach(() => {
    // Reset navigator.userAgent after each test
    delete (navigator as any).userAgent
  })

  it('should detect Safari browser', () => {
    // Mock navigator.userAgent
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
    })

    expect(isSafari()).toBe(true)
  })

  it('should return false for Chrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124',
    })

    expect(isSafari()).toBe(false)
  })

  it('should return false for Firefox', () => {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
    })

    expect(isSafari()).toBe(false)
  })

  it('should return false for Edge', () => {
    Object.defineProperty(navigator, 'userAgent', {
      writable: true,
      value:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    })

    expect(isSafari()).toBe(false)
  })
})

describe('isTauri', () => {
  beforeEach(() => {
    // Clean up after each test
    delete (window as any).__TAURI__
  })

  it('should detect Tauri environment', () => {
    // Mock Tauri global
    ;(window as any).__TAURI__ = {}
    expect(isTauri()).toBe(true)

    // Clean up
    delete (window as any).__TAURI__
  })

  it('should return false when not in Tauri', () => {
    expect(isTauri()).toBe(false)
  })

  it('should handle errors gracefully', () => {
    // Mock window to throw error
    const originalWindow = global.window
    ;(global as any).window = undefined

    expect(isTauri()).toBe(false)

    // Restore
    global.window = originalWindow
  })

  it('should handle null Tauri object', () => {
    ;(window as any).__TAURI__ = null
    expect(isTauri()).toBe(false)
  })

  it('should handle undefined Tauri object', () => {
    ;(window as any).__TAURI__ = undefined
    expect(isTauri()).toBe(false)
  })
})
