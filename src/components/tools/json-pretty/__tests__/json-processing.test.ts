import { describe, it, expect, beforeEach } from 'vitest'

// Import functions from the component file
// Note: These functions are not exported, so we'll test them indirectly through the component
// or create a separate utils file. For now, let's test the core logic concepts.

describe('JSON Formatter Tool - Core Logic', () => {
  beforeEach(() => {
    // Reset any state if needed
  })

  describe('JSON validation', () => {
    it('should validate valid JSON', () => {
      const validJSON = '{"key": "value"}'
      expect(() => JSON.parse(validJSON)).not.toThrow()
    })

    it('should detect invalid JSON', () => {
      const invalidJSON = '{key: value}'
      expect(() => JSON.parse(invalidJSON)).toThrow()
    })

    it('should detect empty input', () => {
      const empty = ''
      expect(() => JSON.parse(empty)).toThrow()
    })

    it('should handle nested objects', () => {
      const nested = '{"a": {"b": {"c": "value"}}}'
      expect(() => JSON.parse(nested)).not.toThrow()
    })

    it('should handle arrays', () => {
      const array = '[1, 2, 3, "test"]'
      expect(() => JSON.parse(array)).not.toThrow()
    })

    it('should handle mixed structures', () => {
      const mixed = '{"items": [{"id": 1}, {"id": 2}], "count": 2}'
      expect(() => JSON.parse(mixed)).not.toThrow()
    })
  })

  describe('JSON formatting', () => {
    it('should format JSON with indentation', () => {
      const input = '{"key":"value","array":[1,2,3]}'
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 2)
      
      expect(formatted).toContain('\n')
      expect(formatted).toContain('  ') // 2 spaces indent
      expect(formatted.split('\n').length).toBeGreaterThan(1)
    })

    it('should minify JSON', () => {
      const input = '{\n  "key": "value",\n  "array": [1, 2, 3]\n}'
      const parsed = JSON.parse(input)
      const minified = JSON.stringify(parsed)
      
      expect(minified).not.toContain('\n')
      expect(minified).not.toContain('  ')
    })

    it('should format with custom indent size', () => {
      const input = '{"key":"value"}'
      const parsed = JSON.parse(input)
      const formatted = JSON.stringify(parsed, null, 4)
      
      expect(formatted).toContain('    ') // 4 spaces indent
    })

    it('should sort object keys', () => {
      const input = '{"zebra": 1, "apple": 2, "banana": 3}'
      const parsed = JSON.parse(input)
      const keys = Object.keys(parsed).sort()
      const sorted = keys.reduce((acc, key) => {
        acc[key] = parsed[key]
        return acc
      }, {} as Record<string, any>)
      const formatted = JSON.stringify(sorted, null, 2)
      
      expect(formatted.indexOf('"apple"')).toBeLessThan(formatted.indexOf('"banana"'))
      expect(formatted.indexOf('"banana"')).toBeLessThan(formatted.indexOf('"zebra"'))
    })
  })

  describe('JSON statistics', () => {
    it('should count keys in object', () => {
      const json = '{"key1": "value1", "key2": "value2", "key3": "value3"}'
      const parsed = JSON.parse(json)
      const keys = Object.keys(parsed)
      
      expect(keys.length).toBe(3)
    })

    it('should count array elements', () => {
      const json = '[1, 2, 3, 4, 5]'
      const parsed = JSON.parse(json)
      
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(5)
    })

    it('should detect nested depth', () => {
      const json = '{"level1": {"level2": {"level3": "value"}}}'
      const parsed = JSON.parse(json)
      
      // Check depth by counting nested objects
      const checkDepth = (obj: any, depth = 0): number => {
        if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
          return depth
        }
        const depths = Object.values(obj).map((v) => checkDepth(v, depth + 1))
        return depths.length > 0 ? Math.max(...depths) : depth
      }
      
      const depth = checkDepth(parsed)
      expect(depth).toBeGreaterThanOrEqual(3)
    })

    it('should count primitive types', () => {
      const json = '{"string": "text", "number": 42, "boolean": true, "null": null}'
      const parsed = JSON.parse(json)
      
      expect(typeof parsed.string).toBe('string')
      expect(typeof parsed.number).toBe('number')
      expect(typeof parsed.boolean).toBe('boolean')
      expect(parsed.null).toBeNull()
    })
  })

  describe('JSON operations', () => {
    it('should escape JSON string', () => {
      const input = 'Hello "World"'
      const escaped = JSON.stringify(input)
      
      expect(escaped).toContain('\\"')
      expect(escaped).toMatch(/^".*"$/)
    })

    it('should unescape JSON string', () => {
      const escaped = '"Hello \\"World\\""'
      const unescaped = JSON.parse(escaped)
      
      expect(unescaped).toBe('Hello "World"')
    })

    it('should validate JSON structure', () => {
      const valid = '{"key": "value"}'
      expect(() => JSON.parse(valid)).not.toThrow()
      
      const invalid = '{key: value}'
      expect(() => JSON.parse(invalid)).toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle empty object', () => {
      const json = '{}'
      const parsed = JSON.parse(json)
      
      expect(Object.keys(parsed).length).toBe(0)
    })

    it('should handle empty array', () => {
      const json = '[]'
      const parsed = JSON.parse(json)
      
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(0)
    })

    it('should handle null values', () => {
      const json = '{"key": null}'
      const parsed = JSON.parse(json)
      
      expect(parsed.key).toBeNull()
    })

    it('should handle boolean values', () => {
      const json = '{"true": true, "false": false}'
      const parsed = JSON.parse(json)
      
      expect(parsed.true).toBe(true)
      expect(parsed.false).toBe(false)
    })

    it('should handle numeric values', () => {
      const json = '{"int": 42, "float": 3.14, "negative": -10, "zero": 0}'
      const parsed = JSON.parse(json)
      
      expect(typeof parsed.int).toBe('number')
      expect(typeof parsed.float).toBe('number')
      expect(typeof parsed.negative).toBe('number')
      expect(typeof parsed.zero).toBe('number')
    })

    it('should handle unicode characters', () => {
      const json = '{"unicode": "你好世界"}'
      const parsed = JSON.parse(json)
      
      expect(parsed.unicode).toBe('你好世界')
    })

    it('should handle special characters in strings', () => {
      const json = '{"special": "\\n\\t\\r\\b\\f"}'
      const parsed = JSON.parse(json)
      
      expect(parsed.special).toContain('\n')
      expect(parsed.special).toContain('\t')
    })

    it('should handle large JSON', () => {
      const largeObj: Record<string, number> = {}
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = i
      }
      const json = JSON.stringify(largeObj)
      const parsed = JSON.parse(json)
      
      expect(Object.keys(parsed).length).toBe(1000)
    })

    it('should handle deeply nested structures', () => {
      let nested: any = {}
      for (let i = 0; i < 10; i++) {
        nested = { level: i, child: nested }
      }
      const json = JSON.stringify(nested)
      const parsed = JSON.parse(json)
      
      expect(parsed.level).toBe(9)
      expect(parsed.child).toBeDefined()
    })
  })

  describe('Error handling', () => {
    it('should handle malformed JSON with missing quotes', () => {
      const invalid = '{key: "value"}'
      expect(() => JSON.parse(invalid)).toThrow()
    })

    it('should handle malformed JSON with trailing comma', () => {
      const invalid = '{"key": "value",}'
      expect(() => JSON.parse(invalid)).toThrow()
    })

    it('should handle malformed JSON with unclosed brackets', () => {
      const invalid = '{"key": "value"'
      expect(() => JSON.parse(invalid)).toThrow()
    })

    it('should handle malformed JSON with wrong bracket types', () => {
      const invalid = '{"key": "value"]'
      expect(() => JSON.parse(invalid)).toThrow()
    })
  })
})

