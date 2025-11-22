#!/usr/bin/env node

/**
 * Tool Analysis Script for Testing
 * Analyzes all tools in src/components/tools to identify testable functions
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const toolsDir = path.join(__dirname, '../src/components/tools')

// Tool categories
const toolsWithHooks = []
const toolsWithPureFunctions = []
const toolsWithTests = []
const toolsNeedingExtraction = []

// Function patterns to detect
const functionPatterns = [
  /^(const|function|export\s+(const|function))\s+(\w+)\s*[=:]/gm,
  /^export\s+(const|function)\s+(\w+)/gm,
]

// Analyze a single tool
function analyzeTool(toolName) {
  const toolDir = path.join(toolsDir, toolName)
  const indexFile = path.join(toolDir, 'index.tsx')
  const hooksFile = path.join(toolDir, 'hooks.ts')
  const testDir = path.join(toolDir, '__tests__')
  
  const hasHooks = fs.existsSync(hooksFile)
  const hasTests = fs.existsSync(testDir)
  const hasIndex = fs.existsSync(indexFile)
  
  const toolInfo = {
    name: toolName,
    hasHooks,
    hasTests,
    hasIndex,
    functions: [],
    hooksFunctions: [],
  }
  
  // Analyze hooks.ts if exists
  if (hasHooks) {
    const hooksContent = fs.readFileSync(hooksFile, 'utf-8')
    const exportedFunctions = extractExportedFunctions(hooksContent)
    toolInfo.hooksFunctions = exportedFunctions
    toolsWithHooks.push(toolName)
  }
  
  // Analyze index.tsx if exists
  if (hasIndex) {
    const indexContent = fs.readFileSync(indexFile, 'utf-8')
    const functions = extractFunctions(indexContent)
    toolInfo.functions = functions
    
    // Check if has pure functions that can be tested
    const pureFunctions = functions.filter(fn => 
      !fn.includes('use') && 
      !fn.includes('Component') &&
      !fn.includes('Core')
    )
    
    if (pureFunctions.length > 0) {
      toolsWithPureFunctions.push(toolName)
    }
    
    // Check if functions need extraction
    if (functions.length > 0 && !hasHooks) {
      toolsNeedingExtraction.push(toolName)
    }
  }
  
  if (hasTests) {
    toolsWithTests.push(toolName)
  }
  
  return toolInfo
}

// Extract exported functions from hooks.ts
function extractExportedFunctions(content) {
  const functions = []
  const exportPattern = /export\s+(const|function)\s+(\w+)/g
  let match
  
  while ((match = exportPattern.exec(content)) !== null) {
    functions.push(match[2])
  }
  
  return functions
}

// Extract function definitions from content
function extractFunctions(content) {
  const functions = []
  
  // Match function declarations and arrow functions
  const patterns = [
    /^(const|function|export\s+(const|function))\s+(\w+)\s*[=:]/gm,
    /^export\s+(const|function)\s+(\w+)/gm,
  ]
  
  patterns.forEach(pattern => {
    let match
    while ((match = pattern.exec(content)) !== null) {
      const funcName = match[3] || match[2]
      if (funcName && !functions.includes(funcName)) {
        functions.push(funcName)
      }
    }
  })
  
  return functions
}

// Main analysis
function analyzeAllTools() {
  const tools = fs.readdirSync(toolsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name)
  
  const analysis = {
    total: tools.length,
    withHooks: [],
    withPureFunctions: [],
    withTests: [],
    needingExtraction: [],
    details: {},
  }
  
  tools.forEach(toolName => {
    const toolInfo = analyzeTool(toolName)
    analysis.details[toolName] = toolInfo
    
    if (toolInfo.hasHooks) {
      analysis.withHooks.push(toolName)
    }
    
    if (toolInfo.functions.length > 0 && !toolInfo.hasHooks) {
      analysis.withPureFunctions.push(toolName)
    }
    
    if (toolInfo.hasTests) {
      analysis.withTests.push(toolName)
    }
    
    if (toolInfo.functions.length > 0 && !toolInfo.hasHooks) {
      analysis.needingExtraction.push(toolName)
    }
  })
  
  return analysis
}

// Generate report
function generateReport(analysis) {
  console.log('\n📊 Tool Testing Analysis Report\n')
  console.log('=' .repeat(60))
  
  console.log(`\n📈 Summary:`)
  console.log(`  Total tools: ${analysis.total}`)
  console.log(`  Tools with hooks: ${analysis.withHooks.length}`)
  console.log(`  Tools with pure functions: ${analysis.withPureFunctions.length}`)
  console.log(`  Tools with tests: ${analysis.withTests.length}`)
  console.log(`  Tools needing extraction: ${analysis.needingExtraction.length}`)
  
  console.log(`\n🔧 Tools with hooks (${analysis.withHooks.length}):`)
  analysis.withHooks.forEach(tool => {
    const info = analysis.details[tool]
    console.log(`  ✅ ${tool}`)
    if (info.hooksFunctions.length > 0) {
      console.log(`     Functions: ${info.hooksFunctions.join(', ')}`)
    }
  })
  
  console.log(`\n📝 Tools with tests (${analysis.withTests.length}):`)
  analysis.withTests.forEach(tool => {
    console.log(`  ✅ ${tool}`)
  })
  
  console.log(`\n🔨 Tools needing extraction (${analysis.needingExtraction.length}):`)
  analysis.needingExtraction.slice(0, 20).forEach(tool => {
    const info = analysis.details[tool]
    console.log(`  ⚠️  ${tool}`)
    if (info.functions.length > 0) {
      console.log(`     Functions: ${info.functions.slice(0, 5).join(', ')}${info.functions.length > 5 ? '...' : ''}`)
    }
  })
  
  if (analysis.needingExtraction.length > 20) {
    console.log(`  ... and ${analysis.needingExtraction.length - 20} more`)
  }
  
  console.log(`\n📋 Priority list for testing:`)
  console.log(`\n  High Priority (with hooks):`)
  analysis.withHooks.forEach(tool => {
    const hasTest = analysis.withTests.includes(tool)
    console.log(`    ${hasTest ? '✅' : '⏳'} ${tool}`)
  })
  
  console.log(`\n  Medium Priority (pure functions):`)
  analysis.withPureFunctions.slice(0, 15).forEach(tool => {
    const hasTest = analysis.withTests.includes(tool)
    console.log(`    ${hasTest ? '✅' : '⏳'} ${tool}`)
  })
  
  console.log('\n' + '='.repeat(60))
  console.log('\n💡 Next steps:')
  console.log('  1. Start with tools that have hooks (easier to test)')
  console.log('  2. Extract pure functions from component tools')
  console.log('  3. Create test files following the template')
  console.log('  4. Run: npm run test:tools')
}

// Run analysis
try {
  const analysis = analyzeAllTools()
  generateReport(analysis)
  
  // Save analysis to JSON
  const reportPath = path.join(__dirname, '../tools-analysis.json')
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2))
  console.log(`\n📄 Detailed analysis saved to: ${reportPath}`)
} catch (error) {
  console.error('Error analyzing tools:', error)
  process.exit(1)
}

