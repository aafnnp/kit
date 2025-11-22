#!/usr/bin/env node

/**
 * Test Template Generator
 * Generates test file template for a tool
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const toolName = process.argv[2]

if (!toolName) {
  console.error('Usage: node generate-test-template.mjs <tool-name>')
  process.exit(1)
}

const toolsDir = path.join(__dirname, '../src/components/tools')
const toolDir = path.join(toolsDir, toolName)
const hooksFile = path.join(toolDir, 'hooks.ts')
const indexFile = path.join(toolDir, 'index.tsx')
const testDir = path.join(toolDir, '__tests__')

if (!fs.existsSync(toolDir)) {
  console.error(`Tool directory not found: ${toolDir}`)
  process.exit(1)
}

// Create __tests__ directory if it doesn't exist
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true })
}

// Check if hooks.ts exists
const hasHooks = fs.existsSync(hooksFile)
const testFileName = hasHooks ? 'hooks.test.ts' : `${toolName}.test.ts`
const testFilePath = path.join(testDir, testFileName)

if (fs.existsSync(testFilePath)) {
  console.error(`Test file already exists: ${testFilePath}`)
  process.exit(1)
}

// Generate test template
let template = `import { describe, it, expect, beforeEach, vi } from 'vitest'
`

if (hasHooks) {
  template += `import { 
  // TODO: Import functions from hooks.ts
} from '../hooks'
`
} else {
  template += `// TODO: Extract core functions from index.tsx for testing
// Example:
// const coreFunction = (input: string): string => {
//   // Core logic here
// }
`
}

template += `
describe('${toolName}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic functionality', () => {
    it('should handle normal input', () => {
      // TODO: Write test
      expect(true).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle empty input', () => {
      // TODO: Write test
      expect(true).toBe(true)
    })

    it('should handle invalid input', () => {
      // TODO: Write test
      expect(true).toBe(true)
    })
  })

  describe('Validation', () => {
    it('should validate correct input', () => {
      // TODO: Write test
      expect(true).toBe(true)
    })

    it('should reject invalid input', () => {
      // TODO: Write test
      expect(true).toBe(true)
    })
  })

  describe('Error handling', () => {
    it('should handle errors gracefully', () => {
      // TODO: Write test
      expect(true).toBe(true)
    })
  })
})
`

fs.writeFileSync(testFilePath, template)
console.log(`✅ Test template created: ${testFilePath}`)
console.log(`\n📝 Next steps:`)
console.log(`   1. Review the generated test file`)
if (hasHooks) {
  console.log(`   2. Import functions from hooks.ts`)
} else {
  console.log(`   2. Extract core functions from index.tsx`)
}
console.log(`   3. Write test cases for each function`)
console.log(`   4. Run: npm run test:tools`)

