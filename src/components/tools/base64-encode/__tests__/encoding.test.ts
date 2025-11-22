import { describe, it, expect, beforeEach, vi } from 'vitest'
import { performEncoding, validateEncodingFile } from '@/components/tools/base64-encode/hooks'

describe('Base64 Encode Tool - performEncoding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Base64 encoding/decoding', () => {
    it('should encode text to Base64', () => {
      const result = performEncoding('Hello World', 'encode', 'text', 'base64')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('SGVsbG8gV29ybGQ=')
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0)
    })

    it('should decode Base64 to text', () => {
      const result = performEncoding('SGVsbG8gV29ybGQ=', 'decode', 'base64', 'text')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('Hello World')
    })

    it('should handle invalid Base64 input', () => {
      const result = performEncoding('Invalid Base64!', 'decode', 'base64', 'text')

      expect(result.metadata.isValid).toBe(false)
    })

    it('should handle empty input', () => {
      const result = performEncoding('', 'encode', 'text', 'base64')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('')
    })
  })

  describe('URL encoding/decoding', () => {
    it('should encode text to URL', () => {
      const result = performEncoding('Hello World!', 'encode', 'text', 'url')

      expect(result.metadata.isValid).toBe(true)
      // encodeURIComponent may not encode '!' in some implementations
      expect(result.output).toMatch(/Hello%20World[!%21]/)
    })

    it('should decode URL to text', () => {
      const result = performEncoding('Hello%20World%21', 'decode', 'url', 'text')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('Hello World!')
    })

    it('should handle invalid URL encoded input', () => {
      const result = performEncoding('%', 'decode', 'url', 'text')

      expect(result.metadata.isValid).toBe(false)
    })
  })

  describe('Hex encoding/decoding', () => {
    it('should encode text to Hex', () => {
      const result = performEncoding('Hello', 'encode', 'text', 'hex')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('48656c6c6f')
    })

    it('should decode Hex to text', () => {
      const result = performEncoding('48656c6c6f', 'decode', 'hex', 'text')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('Hello')
    })

    it('should handle hex with spaces', () => {
      const result = performEncoding('48 65 6c 6c 6f', 'decode', 'hex', 'text')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('Hello')
    })

    it('should handle invalid hex length', () => {
      const result = performEncoding('486', 'decode', 'hex', 'text')

      expect(result.metadata.isValid).toBe(false)
    })

    it('should handle invalid hex characters', () => {
      const result = performEncoding('GHIJKL', 'decode', 'hex', 'text')

      // Invalid hex characters should cause decode to fail
      expect(result.metadata.isValid).toBe(false)
      expect(result.output).toBe('')
    })
  })

  describe('Binary encoding/decoding', () => {
    it('should encode text to Binary', () => {
      const result = performEncoding('Hi', 'encode', 'text', 'binary')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('01001000 01101001')
    })

    it('should decode Binary to text', () => {
      const result = performEncoding('01001000 01101001', 'decode', 'binary', 'text')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBe('Hi')
    })

    it('should handle binary with spaces', () => {
      const result = performEncoding('01001000 01101001', 'decode', 'binary', 'text')

      expect(result.metadata.isValid).toBe(true)
    })

    it('should handle invalid binary format', () => {
      const result = performEncoding('0100100', 'decode', 'binary', 'text')

      expect(result.metadata.isValid).toBe(false)
    })

    it('should handle non-binary characters', () => {
      const result = performEncoding('01001002', 'decode', 'binary', 'text')

      expect(result.metadata.isValid).toBe(false)
    })
  })

  describe('metadata', () => {
    it('should calculate compression ratio', () => {
      const result = performEncoding('Hello World', 'encode', 'text', 'base64')

      expect(result.metadata.compressionRatio).toBeGreaterThan(0)
      expect(result.metadata.inputSize).toBeGreaterThan(0)
      expect(result.metadata.outputSize).toBeGreaterThan(0)
    })

    it('should track processing time', () => {
      const result = performEncoding('Hello World', 'encode', 'text', 'base64')

      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0)
    })

    it('should include operation type', () => {
      const encodeResult = performEncoding('Hello', 'encode', 'text', 'base64')
      const decodeResult = performEncoding('SGVsbG8=', 'decode', 'base64', 'text')

      expect(encodeResult.operation).toBe('encode')
      expect(decodeResult.operation).toBe('decode')
    })

    it('should include format information', () => {
      const result = performEncoding('Hello', 'encode', 'text', 'base64')

      expect(result.inputFormat).toBe('text')
      expect(result.outputFormat).toBe('base64')
      expect(result.metadata.encoding).toBe('base64')
    })
  })

  describe('edge cases', () => {
    it('should handle unicode characters', () => {
      const result = performEncoding('你好', 'encode', 'text', 'base64')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBeTruthy()
    })

    it('should handle special characters', () => {
      const result = performEncoding('!@#$%^&*()', 'encode', 'text', 'base64')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBeTruthy()
    })

    it('should handle newlines', () => {
      const result = performEncoding('Line1\nLine2', 'encode', 'text', 'base64')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output).toBeTruthy()
    })

    it('should handle large input', () => {
      const largeInput = 'a'.repeat(10000)
      const result = performEncoding(largeInput, 'encode', 'text', 'base64')

      expect(result.metadata.isValid).toBe(true)
      expect(result.output.length).toBeGreaterThan(0)
    })
  })
})

describe('Base64 Encode Tool - validateEncodingFile', () => {
  it('should validate file size', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' })
    const result = validateEncodingFile(largeFile)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('10MB')
  })

  it('should validate file type', () => {
    const invalidFile = new File(['content'], 'file.exe', { type: 'application/x-msdownload' })
    const result = validateEncodingFile(invalidFile)

    expect(result.isValid).toBe(false)
    expect(result.error).toContain('text-based')
  })

  it('should accept valid text files', () => {
    const validFile = new File(['content'], 'file.txt', { type: 'text/plain' })
    const result = validateEncodingFile(validFile)

    expect(result.isValid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should accept JSON files', () => {
    const jsonFile = new File(['{}'], 'data.json', { type: 'application/json' })
    const result = validateEncodingFile(jsonFile)

    expect(result.isValid).toBe(true)
  })

  it('should accept CSV files', () => {
    const csvFile = new File(['col1,col2'], 'data.csv', { type: 'text/csv' })
    const result = validateEncodingFile(csvFile)

    expect(result.isValid).toBe(true)
  })

  it('should accept HTML files', () => {
    const htmlFile = new File(['<html></html>'], 'page.html', { type: 'text/html' })
    const result = validateEncodingFile(htmlFile)

    expect(result.isValid).toBe(true)
  })

  it('should accept JS files', () => {
    const jsFile = new File(['console.log("test")'], 'script.js', { type: 'application/javascript' })
    const result = validateEncodingFile(jsFile)

    expect(result.isValid).toBe(true)
  })

  it('should accept CSS files', () => {
    const cssFile = new File(['body { color: red; }'], 'style.css', { type: 'text/css' })
    const result = validateEncodingFile(cssFile)

    expect(result.isValid).toBe(true)
  })
})
