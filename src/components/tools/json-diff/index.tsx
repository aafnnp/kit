import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Settings,
  BookOpen,
  Eye,
  Clock,
  Code,
  List,
  GitCompare,
  GitBranch,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  JSONDiffResult,
  JSONDifference,
  DiffSummary,
  DiffMetadata,
  DiffOptions,
  DiffTemplate,
  DiffValidation,
  ExportFormat,
} from '@/types/json-diff'
import { formatFileSize } from '@/lib/utils'

// Utility functions

// JSON diff comparison functions
const compareJSON = (left: any, right: any, options: DiffOptions): JSONDiffResult => {
  const startTime = window.performance.now()
  const id = nanoid()
  const timestamp = new Date()

  const differences: JSONDifference[] = []
  const leftText = typeof left === 'string' ? left : JSON.stringify(left, null, 2)
  const rightText = typeof right === 'string' ? right : JSON.stringify(right, null, 2)

  let leftJSON: any
  let rightJSON: any

  try {
    leftJSON = typeof left === 'string' ? JSON.parse(left) : left
    rightJSON = typeof right === 'string' ? JSON.parse(right) : right
  } catch (error) {
    throw new Error('Invalid JSON format')
  }

  // Perform deep comparison
  const visited = new Set<string>()
  compareObjects(leftJSON, rightJSON, '', differences, options, visited)

  const endTime = window.performance.now()
  const processingTime = endTime - startTime

  // Calculate summary
  const summary = calculateDiffSummary(differences, leftJSON, rightJSON)

  // Calculate metadata
  const metadata = calculateDiffMetadata(leftJSON, rightJSON, processingTime)

  return {
    id,
    leftJSON,
    rightJSON,
    leftText,
    rightText,
    differences,
    summary,
    metadata,
    timestamp,
  }
}

const compareObjects = (
  left: any,
  right: any,
  path: string,
  differences: JSONDifference[],
  options: DiffOptions,
  visited: Set<string>
): void => {
  const currentPath = path || 'root'

  // Prevent infinite recursion
  if (visited.has(currentPath) || (options.maxDepth > 0 && path.split('.').length > options.maxDepth)) {
    return
  }
  visited.add(currentPath)

  // Handle null/undefined values
  if (left === null && right === null) return
  if (left === undefined && right === undefined) return

  if (left === null || left === undefined) {
    differences.push({
      path: currentPath,
      type: 'added',
      rightValue: right,
      description: `Added value at ${currentPath}`,
      severity: 'medium',
    })
    return
  }

  if (right === null || right === undefined) {
    differences.push({
      path: currentPath,
      type: 'removed',
      leftValue: left,
      description: `Removed value at ${currentPath}`,
      severity: 'medium',
    })
    return
  }

  // Handle primitive values
  if (isPrimitive(left) || isPrimitive(right)) {
    if (!isEqual(left, right, options)) {
      differences.push({
        path: currentPath,
        type: 'modified',
        leftValue: left,
        rightValue: right,
        description: `Value changed at ${currentPath}`,
        severity: 'high',
      })
    } else if (options.showUnchanged) {
      differences.push({
        path: currentPath,
        type: 'unchanged',
        leftValue: left,
        rightValue: right,
        description: `Unchanged value at ${currentPath}`,
        severity: 'low',
      })
    }
    return
  }

  // Handle arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    compareArrays(left, right, currentPath, differences, options, visited)
    return
  }

  if (Array.isArray(left) !== Array.isArray(right)) {
    differences.push({
      path: currentPath,
      type: 'modified',
      leftValue: left,
      rightValue: right,
      description: `Type changed at ${currentPath} (${getType(left)} → ${getType(right)})`,
      severity: 'high',
    })
    return
  }

  // Handle objects
  if (typeof left === 'object' && typeof right === 'object') {
    compareObjectProperties(left, right, currentPath, differences, options, visited)
    return
  }

  // Handle type mismatches
  if (typeof left !== typeof right) {
    differences.push({
      path: currentPath,
      type: 'modified',
      leftValue: left,
      rightValue: right,
      description: `Type changed at ${currentPath} (${typeof left} → ${typeof right})`,
      severity: 'high',
    })
  }
}

const compareArrays = (
  left: any[],
  right: any[],
  path: string,
  differences: JSONDifference[],
  options: DiffOptions,
  visited: Set<string>
): void => {
  if (options.ignoreArrayOrder) {
    // Compare arrays ignoring order
    const leftSorted = [...left].sort()
    const rightSorted = [...right].sort()

    for (let i = 0; i < Math.max(leftSorted.length, rightSorted.length); i++) {
      const leftItem = leftSorted[i]
      const rightItem = rightSorted[i]
      const itemPath = `${path}[${i}]`

      if (i >= leftSorted.length) {
        differences.push({
          path: itemPath,
          type: 'added',
          rightValue: rightItem,
          description: `Added array item at ${itemPath}`,
          severity: 'medium',
        })
      } else if (i >= rightSorted.length) {
        differences.push({
          path: itemPath,
          type: 'removed',
          leftValue: leftItem,
          description: `Removed array item at ${itemPath}`,
          severity: 'medium',
        })
      } else {
        compareObjects(leftItem, rightItem, itemPath, differences, options, visited)
      }
    }
  } else {
    // Compare arrays preserving order
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
      const leftItem = left[i]
      const rightItem = right[i]
      const itemPath = `${path}[${i}]`

      if (i >= left.length) {
        differences.push({
          path: itemPath,
          type: 'added',
          rightValue: rightItem,
          description: `Added array item at ${itemPath}`,
          severity: 'medium',
        })
      } else if (i >= right.length) {
        differences.push({
          path: itemPath,
          type: 'removed',
          leftValue: leftItem,
          description: `Removed array item at ${itemPath}`,
          severity: 'medium',
        })
      } else {
        compareObjects(leftItem, rightItem, itemPath, differences, options, visited)
      }
    }
  }
}

const compareObjectProperties = (
  left: Record<string, any>,
  right: Record<string, any>,
  path: string,
  differences: JSONDifference[],
  options: DiffOptions,
  visited: Set<string>
): void => {
  const leftKeys = Object.keys(left)
  const rightKeys = Object.keys(right)
  const allKeys = new Set([...leftKeys, ...rightKeys])

  for (const key of allKeys) {
    const propertyPath = path ? `${path}.${key}` : key
    const leftValue = left[key]
    const rightValue = right[key]

    if (!(key in left)) {
      if (!options.ignoreExtraKeys) {
        differences.push({
          path: propertyPath,
          type: 'added',
          rightValue: rightValue,
          description: `Added property ${key} at ${path || 'root'}`,
          severity: 'medium',
        })
      }
    } else if (!(key in right)) {
      if (!options.ignoreExtraKeys) {
        differences.push({
          path: propertyPath,
          type: 'removed',
          leftValue: leftValue,
          description: `Removed property ${key} at ${path || 'root'}`,
          severity: 'medium',
        })
      }
    } else {
      compareObjects(leftValue, rightValue, propertyPath, differences, options, visited)
    }
  }
}

// Helper functions
const isPrimitive = (value: any): boolean => {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

const getType = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

const isEqual = (left: any, right: any, options: DiffOptions): boolean => {
  if (options.customComparator) {
    return options.customComparator(left, right)
  }

  if (typeof left === 'string' && typeof right === 'string') {
    let leftStr = left
    let rightStr = right

    if (options.ignoreCase) {
      leftStr = leftStr.toLowerCase()
      rightStr = rightStr.toLowerCase()
    }

    if (options.ignoreWhitespace) {
      leftStr = leftStr.replace(/\s+/g, ' ').trim()
      rightStr = rightStr.replace(/\s+/g, ' ').trim()
    }

    return leftStr === rightStr
  }

  if (typeof left === 'number' && typeof right === 'number') {
    if (options.precision > 0) {
      return Math.abs(left - right) < Math.pow(10, -options.precision)
    }
  }

  return left === right
}

const calculateDiffSummary = (differences: JSONDifference[], left: any, right: any): DiffSummary => {
  const added = differences.filter((d) => d.type === 'added').length
  const removed = differences.filter((d) => d.type === 'removed').length
  const modified = differences.filter((d) => d.type === 'modified').length
  const moved = differences.filter((d) => d.type === 'moved').length
  const unchanged = differences.filter((d) => d.type === 'unchanged').length
  const totalDifferences = added + removed + modified + moved

  // Calculate similarity percentage
  const totalItems = countTotalItems(left) + countTotalItems(right)
  const similarity = totalItems > 0 ? ((totalItems - totalDifferences) / totalItems) * 100 : 100

  // Calculate complexity score
  const complexity = calculateComplexity(left) + calculateComplexity(right)

  return {
    totalDifferences,
    added,
    removed,
    modified,
    moved,
    unchanged,
    similarity: Math.max(0, Math.min(100, similarity)),
    complexity,
  }
}

const calculateDiffMetadata = (left: any, right: any, processingTime: number): DiffMetadata => {
  const leftText = JSON.stringify(left)
  const rightText = JSON.stringify(right)

  return {
    leftSize: leftText.length,
    rightSize: rightText.length,
    leftDepth: calculateDepth(left),
    rightDepth: calculateDepth(right),
    leftKeys: countKeys(left),
    rightKeys: countKeys(right),
    processingTime,
    memoryUsage: (leftText.length + rightText.length) * 2, // Rough estimation
  }
}

const countTotalItems = (obj: any): number => {
  if (isPrimitive(obj)) return 1
  if (Array.isArray(obj)) {
    return obj.reduce((count, item) => count + countTotalItems(item), 0)
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).reduce(
      (count: number, value: any) => count + countTotalItems(value),
      Object.keys(obj).length
    )
  }
  return 1
}

const calculateComplexity = (obj: any): number => {
  if (isPrimitive(obj)) return 1
  if (Array.isArray(obj)) {
    return obj.reduce((complexity, item) => complexity + calculateComplexity(item), 1)
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).reduce(
      (complexity: number, value: any) => complexity + calculateComplexity(value),
      Object.keys(obj).length
    )
  }
  return 1
}

const calculateDepth = (obj: any, currentDepth = 0): number => {
  if (isPrimitive(obj)) return currentDepth
  if (Array.isArray(obj)) {
    return Math.max(currentDepth, ...obj.map((item) => calculateDepth(item, currentDepth + 1)))
  }
  if (typeof obj === 'object' && obj !== null) {
    const depths = Object.values(obj).map((value) => calculateDepth(value, currentDepth + 1))
    return depths.length > 0 ? Math.max(currentDepth, ...depths) : currentDepth
  }
  return currentDepth
}

const countKeys = (obj: any): number => {
  if (isPrimitive(obj)) return 0
  if (Array.isArray(obj)) {
    return obj.reduce((count, item) => count + countKeys(item), 0)
  }
  if (typeof obj === 'object' && obj !== null) {
    return (
      Object.keys(obj).length + Object.values(obj).reduce((count: number, value: any) => count + countKeys(value), 0)
    )
  }
  return 0
}

// Validation functions
const validateJSONInput = (input: string): DiffValidation => {
  const validation: DiffValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  if (!input || input.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: 'JSON input cannot be empty',
      type: 'syntax',
      severity: 'error',
    })
    validation.qualityScore = 0
    return validation
  }

  try {
    const parsed = JSON.parse(input)

    // Check for potential issues
    const size = input.length
    if (size > 1000000) {
      // 1MB
      validation.warnings.push('Large JSON file may impact performance')
      validation.suggestions.push('Consider breaking down large JSON files')
      validation.qualityScore -= 10
    }

    const depth = calculateDepth(parsed)
    if (depth > 20) {
      validation.warnings.push('Very deep JSON structure detected')
      validation.suggestions.push('Deep nesting may impact comparison performance')
      validation.qualityScore -= 15
    }

    const complexity = calculateComplexity(parsed)
    if (complexity > 10000) {
      validation.warnings.push('High complexity JSON structure')
      validation.suggestions.push('Complex structures may take longer to compare')
      validation.qualityScore -= 10
    }
  } catch (error) {
    validation.isValid = false
    validation.errors.push({
      message: error instanceof Error ? error.message : 'Invalid JSON syntax',
      type: 'syntax',
      severity: 'error',
    })
    validation.qualityScore -= 50
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent JSON structure')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good JSON structure with minor issues')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('JSON structure needs improvement')
  } else {
    validation.suggestions.push('JSON structure has significant issues')
  }

  return validation
}

// JSON Diff Templates
const diffTemplates: DiffTemplate[] = [
  {
    id: 'user-profile',
    name: 'User Profile Update',
    description: 'Compare user profile before and after updates',
    category: 'User Data',
    leftJSON: `{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "preferences": {
    "theme": "dark",
    "notifications": true
  },
  "roles": ["user"]
}`,
    rightJSON: `{
  "id": 123,
  "name": "John Smith",
  "email": "john.smith@example.com",
  "age": 31,
  "preferences": {
    "theme": "light",
    "notifications": true,
    "language": "en"
  },
  "roles": ["user", "admin"]
}`,
    useCase: ['User management', 'Profile updates', 'Data migration'],
    expectedDifferences: 5,
  },
  {
    id: 'api-response',
    name: 'API Response Comparison',
    description: 'Compare API responses between versions',
    category: 'API',
    leftJSON: `{
  "status": "success",
  "data": {
    "users": [
      {"id": 1, "name": "Alice"},
      {"id": 2, "name": "Bob"}
    ],
    "total": 2
  },
  "meta": {
    "version": "1.0",
    "timestamp": "2023-01-01T00:00:00Z"
  }
}`,
    rightJSON: `{
  "status": "success",
  "data": {
    "users": [
      {"id": 1, "name": "Alice", "active": true},
      {"id": 2, "name": "Bob", "active": false},
      {"id": 3, "name": "Charlie", "active": true}
    ],
    "total": 3,
    "page": 1
  },
  "meta": {
    "version": "2.0",
    "timestamp": "2023-06-01T00:00:00Z",
    "deprecated": false
  }
}`,
    useCase: ['API testing', 'Version comparison', 'Response validation'],
    expectedDifferences: 8,
  },
  {
    id: 'config-changes',
    name: 'Configuration Changes',
    description: 'Compare application configuration files',
    category: 'Configuration',
    leftJSON: `{
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp"
  },
  "cache": {
    "enabled": true,
    "ttl": 3600
  },
  "features": {
    "newUI": false,
    "analytics": true
  }
}`,
    rightJSON: `{
  "database": {
    "host": "prod-db.example.com",
    "port": 5432,
    "name": "myapp_prod",
    "ssl": true
  },
  "cache": {
    "enabled": true,
    "ttl": 7200,
    "redis": {
      "host": "redis.example.com",
      "port": 6379
    }
  },
  "features": {
    "newUI": true,
    "analytics": true,
    "monitoring": true
  }
}`,
    useCase: ['Configuration management', 'Environment comparison', 'Deployment validation'],
    expectedDifferences: 7,
  },
  {
    id: 'array-comparison',
    name: 'Array Data Comparison',
    description: 'Compare arrays with different ordering and content',
    category: 'Data Structures',
    leftJSON: `{
  "products": [
    {"id": 1, "name": "Laptop", "price": 999},
    {"id": 2, "name": "Mouse", "price": 25},
    {"id": 3, "name": "Keyboard", "price": 75}
  ],
  "categories": ["Electronics", "Computers"],
  "tags": ["tech", "office", "productivity"]
}`,
    rightJSON: `{
  "products": [
    {"id": 1, "name": "Laptop", "price": 899, "discount": 10},
    {"id": 3, "name": "Keyboard", "price": 75},
    {"id": 4, "name": "Monitor", "price": 299}
  ],
  "categories": ["Electronics", "Computers", "Accessories"],
  "tags": ["tech", "office", "productivity", "sale"]
}`,
    useCase: ['Product catalog', 'Inventory management', 'Price comparison'],
    expectedDifferences: 6,
  },
]

// Default diff options
const createDefaultOptions = (): DiffOptions => ({
  ignoreCase: false,
  ignoreWhitespace: false,
  ignoreArrayOrder: false,
  ignoreExtraKeys: false,
  showUnchanged: false,
  maxDepth: 0,
  precision: 0,
})

// Custom hooks
const useJSONDiff = () => {
  const [results, setResults] = useState<JSONDiffResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const performDiff = useCallback(
    async (leftJSON: string, rightJSON: string, options: DiffOptions): Promise<JSONDiffResult> => {
      setIsProcessing(true)
      try {
        const result = compareJSON(leftJSON, rightJSON, options)
        setResults((prev) => [result, ...prev.slice(0, 99)]) // Keep last 100 results
        return result
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  const removeResult = useCallback((id: string) => {
    setResults((prev) => prev.filter((result) => result.id !== id))
  }, [])

  return {
    results,
    isProcessing,
    performDiff,
    clearResults,
    removeResult,
  }
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useJSONDiffExport = () => {
  const exportResult = useCallback((result: JSONDiffResult, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(result, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromResult(result)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'txt':
        content = generateTextFromResult(result)
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'xml':
        content = generateXMLFromResult(result)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'yaml':
        content = generateYAMLFromResult(result)
        mimeType = 'text/yaml'
        extension = '.yaml'
        break
      case 'html':
        content = generateHTMLFromResult(result)
        mimeType = 'text/html'
        extension = '.html'
        break
      default:
        content = generateTextFromResult(result)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `json-diff-${result.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResult }
}

// Helper functions for export formats
const generateCSVFromResult = (result: JSONDiffResult): string => {
  const headers = ['Path', 'Type', 'Left Value', 'Right Value', 'Description', 'Severity']
  const rows = result.differences.map((diff) => [
    diff.path,
    diff.type,
    JSON.stringify(diff.leftValue),
    JSON.stringify(diff.rightValue),
    diff.description,
    diff.severity,
  ])

  return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell || ''}"`).join(','))].join('\n')
}

const generateTextFromResult = (result: JSONDiffResult): string => {
  return `JSON Diff Report - ${result.timestamp.toLocaleString()}

=== SUMMARY ===
Total Differences: ${result.summary.totalDifferences}
Added: ${result.summary.added}
Removed: ${result.summary.removed}
Modified: ${result.summary.modified}
Similarity: ${result.summary.similarity.toFixed(1)}%

=== METADATA ===
Left JSON Size: ${formatFileSize(result.metadata.leftSize)}
Right JSON Size: ${formatFileSize(result.metadata.rightSize)}
Left Depth: ${result.metadata.leftDepth}
Right Depth: ${result.metadata.rightDepth}
Processing Time: ${result.metadata.processingTime.toFixed(2)}ms

=== DIFFERENCES ===
${result.differences
  .map(
    (diff) => `
Path: ${diff.path}
Type: ${diff.type.toUpperCase()}
${diff.leftValue !== undefined ? `Left: ${JSON.stringify(diff.leftValue)}` : ''}
${diff.rightValue !== undefined ? `Right: ${JSON.stringify(diff.rightValue)}` : ''}
Description: ${diff.description}
Severity: ${diff.severity}
`
  )
  .join('\n---\n')}`
}

const generateXMLFromResult = (result: JSONDiffResult): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jsonDiff id="${result.id}" timestamp="${result.timestamp.toISOString()}">
  <summary>
    <totalDifferences>${result.summary.totalDifferences}</totalDifferences>
    <added>${result.summary.added}</added>
    <removed>${result.summary.removed}</removed>
    <modified>${result.summary.modified}</modified>
    <similarity>${result.summary.similarity}</similarity>
  </summary>
  <metadata>
    <leftSize>${result.metadata.leftSize}</leftSize>
    <rightSize>${result.metadata.rightSize}</rightSize>
    <leftDepth>${result.metadata.leftDepth}</leftDepth>
    <rightDepth>${result.metadata.rightDepth}</rightDepth>
    <processingTime>${result.metadata.processingTime}</processingTime>
  </metadata>
  <differences>
${result.differences
  .map(
    (diff) => `    <difference>
      <path>${diff.path}</path>
      <type>${diff.type}</type>
      <leftValue>${diff.leftValue !== undefined ? JSON.stringify(diff.leftValue) : ''}</leftValue>
      <rightValue>${diff.rightValue !== undefined ? JSON.stringify(diff.rightValue) : ''}</rightValue>
      <description>${diff.description}</description>
      <severity>${diff.severity}</severity>
    </difference>`
  )
  .join('\n')}
  </differences>
</jsonDiff>`
}

const generateYAMLFromResult = (result: JSONDiffResult): string => {
  return `id: ${result.id}
timestamp: ${result.timestamp.toISOString()}
summary:
  totalDifferences: ${result.summary.totalDifferences}
  added: ${result.summary.added}
  removed: ${result.summary.removed}
  modified: ${result.summary.modified}
  similarity: ${result.summary.similarity}
metadata:
  leftSize: ${result.metadata.leftSize}
  rightSize: ${result.metadata.rightSize}
  leftDepth: ${result.metadata.leftDepth}
  rightDepth: ${result.metadata.rightDepth}
  processingTime: ${result.metadata.processingTime}
differences:
${result.differences
  .map(
    (diff) => `  - path: ${diff.path}
    type: ${diff.type}
    leftValue: ${JSON.stringify(diff.leftValue)}
    rightValue: ${JSON.stringify(diff.rightValue)}
    description: ${diff.description}
    severity: ${diff.severity}`
  )
  .join('\n')}`
}

const generateHTMLFromResult = (result: JSONDiffResult): string => {
  return `<!DOCTYPE html>
<html>
<head>
  <title>JSON Diff Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .diff { border: 1px solid #ddd; margin: 10px 0; padding: 10px; border-radius: 5px; }
    .added { background: #e8f5e8; border-color: #4caf50; }
    .removed { background: #ffeaea; border-color: #f44336; }
    .modified { background: #fff3e0; border-color: #ff9800; }
    .path { font-weight: bold; color: #333; }
    .value { font-family: monospace; background: #f9f9f9; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>JSON Diff Report</h1>
  <p>Generated on: ${result.timestamp.toLocaleString()}</p>

  <div class="summary">
    <h2>Summary</h2>
    <p>Total Differences: ${result.summary.totalDifferences}</p>
    <p>Added: ${result.summary.added} | Removed: ${result.summary.removed} | Modified: ${result.summary.modified}</p>
    <p>Similarity: ${result.summary.similarity.toFixed(1)}%</p>
  </div>

  <h2>Differences</h2>
  ${result.differences
    .map(
      (diff) => `
  <div class="diff ${diff.type}">
    <div class="path">${diff.path}</div>
    <div>Type: ${diff.type.toUpperCase()}</div>
    ${diff.leftValue !== undefined ? `<div>Left: <span class="value">${JSON.stringify(diff.leftValue)}</span></div>` : ''}
    ${diff.rightValue !== undefined ? `<div>Right: <span class="value">${JSON.stringify(diff.rightValue)}</span></div>` : ''}
    <div>${diff.description}</div>
  </div>`
    )
    .join('')}
</body>
</html>`
}

/**
 * Enhanced JSON Diff & Comparison Tool
 * Features: Advanced JSON comparison, visual diff display, deep comparison, and multiple comparison modes
 */
const JSONDiffCore = () => {
  const [activeTab, setActiveTab] = useState<'diff' | 'history' | 'templates' | 'settings'>('diff')
  const [leftJSON, setLeftJSON] = useState('')
  const [rightJSON, setRightJSON] = useState('')
  const [options, setOptions] = useState<DiffOptions>(createDefaultOptions())
  const [currentResult, setCurrentResult] = useState<JSONDiffResult | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  const { results, isProcessing, performDiff, clearResults, removeResult } = useJSONDiff()
  const { exportResult } = useJSONDiffExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = diffTemplates.find((t) => t.id === templateId)
    if (template) {
      setLeftJSON(template.leftJSON)
      setRightJSON(template.rightJSON)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Perform JSON diff
  const handleDiff = useCallback(async () => {
    if (!leftJSON.trim()) {
      toast.error('Please enter the left JSON')
      return
    }

    if (!rightJSON.trim()) {
      toast.error('Please enter the right JSON')
      return
    }

    const leftValidation = validateJSONInput(leftJSON)
    const rightValidation = validateJSONInput(rightJSON)

    if (!leftValidation.isValid) {
      toast.error(`Left JSON error: ${leftValidation.errors[0]?.message}`)
      return
    }

    if (!rightValidation.isValid) {
      toast.error(`Right JSON error: ${rightValidation.errors[0]?.message}`)
      return
    }

    try {
      const result = await performDiff(leftJSON, rightJSON, options)
      setCurrentResult(result)
      toast.success(`Comparison completed: ${result.summary.totalDifferences} differences found`)
    } catch (error) {
      toast.error('Failed to compare JSON')
      console.error(error)
    }
  }, [leftJSON, rightJSON, options, performDiff])

  // Auto-diff when inputs change (debounced)
  useEffect(() => {
    if (leftJSON.trim() && rightJSON.trim()) {
      const timer = setTimeout(() => {
        handleDiff()
      }, 1000)

      return () => clearTimeout(timer)
    } else {
      setCurrentResult(null)
    }
  }, [leftJSON, rightJSON, options, handleDiff])

  return (
    <div className="w-full mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" aria-hidden="true" />
              JSON Diff & Comparison Tool
            </CardTitle>
            <CardDescription>
              Advanced JSON comparison and analysis tool with visual diff display, deep comparison, and multiple
              comparison modes. Compare JSON objects with detailed analysis, performance metrics, and comprehensive
              export options. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'diff' | 'history' | 'templates' | 'settings')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="diff" className="flex items-center gap-2">
              <GitCompare className="h-4 w-4" />
              Diff
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* JSON Diff Tab */}
          <TabsContent value="diff" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* JSON Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    JSON Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="left-json" className="text-sm font-medium">
                      Left JSON (Original)
                    </Label>
                    <Textarea
                      id="left-json"
                      value={leftJSON}
                      onChange={(e) => setLeftJSON(e.target.value)}
                      placeholder="Enter your original JSON here..."
                      className="mt-2 font-mono text-xs"
                      rows={12}
                    />
                  </div>

                  <div>
                    <Label htmlFor="right-json" className="text-sm font-medium">
                      Right JSON (Modified)
                    </Label>
                    <Textarea
                      id="right-json"
                      value={rightJSON}
                      onChange={(e) => setRightJSON(e.target.value)}
                      placeholder="Enter your modified JSON here..."
                      className="mt-2 font-mono text-xs"
                      rows={12}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleDiff}
                      disabled={isProcessing || !leftJSON.trim() || !rightJSON.trim()}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <GitCompare className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? 'Comparing...' : 'Compare JSON'}
                    </Button>
                    <Button
                      onClick={() => {
                        setLeftJSON('')
                        setRightJSON('')
                        setCurrentResult(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {/* Quick Options */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-medium">Quick Options</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="ignore-case"
                          type="checkbox"
                          checked={options.ignoreCase}
                          onChange={(e) => setOptions((prev) => ({ ...prev, ignoreCase: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="ignore-case" className="text-xs">
                          Ignore case
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="ignore-array-order"
                          type="checkbox"
                          checked={options.ignoreArrayOrder}
                          onChange={(e) => setOptions((prev) => ({ ...prev, ignoreArrayOrder: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="ignore-array-order" className="text-xs">
                          Ignore array order
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="show-unchanged"
                          type="checkbox"
                          checked={options.showUnchanged}
                          onChange={(e) => setOptions((prev) => ({ ...prev, showUnchanged: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="show-unchanged" className="text-xs">
                          Show unchanged
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          id="ignore-extra-keys"
                          type="checkbox"
                          checked={options.ignoreExtraKeys}
                          onChange={(e) => setOptions((prev) => ({ ...prev, ignoreExtraKeys: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="ignore-extra-keys" className="text-xs">
                          Ignore extra keys
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diff Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GitBranch className="h-5 w-5" />
                    Comparison Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentResult ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {currentResult.summary.totalDifferences}
                          </div>
                          <div className="text-xs text-muted-foreground">Total Differences</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{currentResult.summary.added}</div>
                          <div className="text-xs text-muted-foreground">Added</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{currentResult.summary.removed}</div>
                          <div className="text-xs text-muted-foreground">Removed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{currentResult.summary.modified}</div>
                          <div className="text-xs text-muted-foreground">Modified</div>
                        </div>
                      </div>

                      {/* Similarity */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Similarity</span>
                          <span className="text-sm font-medium">{currentResult.summary.similarity.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-green-500"
                            style={{ width: `${currentResult.summary.similarity}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="font-medium">Left JSON</div>
                          <div className="text-muted-foreground">
                            Size: {formatFileSize(currentResult.metadata.leftSize)}
                            <br />
                            Depth: {currentResult.metadata.leftDepth}
                            <br />
                            Keys: {currentResult.metadata.leftKeys}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium">Right JSON</div>
                          <div className="text-muted-foreground">
                            Size: {formatFileSize(currentResult.metadata.rightSize)}
                            <br />
                            Depth: {currentResult.metadata.rightDepth}
                            <br />
                            Keys: {currentResult.metadata.rightKeys}
                          </div>
                        </div>
                      </div>

                      {/* Processing Info */}
                      <div className="text-xs text-muted-foreground">
                        Processing time: {currentResult.metadata.processingTime.toFixed(2)}ms
                      </div>

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => exportResult(currentResult, 'json')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button onClick={() => exportResult(currentResult, 'html')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          HTML
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(JSON.stringify(currentResult.differences, null, 2), 'Differences')
                          }
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === 'Differences' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <GitCompare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Comparison</h3>
                      <p className="text-muted-foreground">
                        Enter JSON data in both fields to see the comparison results
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Differences */}
            {currentResult && currentResult.differences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Detailed Differences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentResult.differences.map((diff, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          diff.type === 'added'
                            ? 'bg-green-50 border-green-200'
                            : diff.type === 'removed'
                              ? 'bg-red-50 border-red-200'
                              : diff.type === 'modified'
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono bg-white px-2 py-1 rounded">{diff.path}</code>
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              diff.type === 'added'
                                ? 'bg-green-100 text-green-800'
                                : diff.type === 'removed'
                                  ? 'bg-red-100 text-red-800'
                                  : diff.type === 'modified'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {diff.type.toUpperCase()}
                          </span>
                        </div>

                        <div className="text-sm text-muted-foreground mb-2">{diff.description}</div>

                        {(diff.leftValue !== undefined || diff.rightValue !== undefined) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {diff.leftValue !== undefined && (
                              <div>
                                <div className="font-medium text-red-600 mb-1">Left (Original):</div>
                                <code className="block bg-white p-2 rounded border">
                                  {JSON.stringify(diff.leftValue, null, 2)}
                                </code>
                              </div>
                            )}
                            {diff.rightValue !== undefined && (
                              <div>
                                <div className="font-medium text-green-600 mb-1">Right (Modified):</div>
                                <code className="block bg-white p-2 rounded border">
                                  {JSON.stringify(diff.rightValue, null, 2)}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparison History</CardTitle>
                <CardDescription>View and manage your JSON comparison history</CardDescription>
              </CardHeader>
              <CardContent>
                {results.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {results.length} comparison{results.length !== 1 ? 's' : ''} in history
                      </span>
                      <Button onClick={clearResults} variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {results.map((result) => (
                      <div key={result.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">{result.timestamp.toLocaleString()}</div>
                          <Button size="sm" variant="ghost" onClick={() => removeResult(result.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{result.summary.totalDifferences}</div>
                              <div className="text-muted-foreground">Differences</div>
                            </div>
                            <div>
                              <div className="font-medium">{result.summary.similarity.toFixed(1)}%</div>
                              <div className="text-muted-foreground">Similarity</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatFileSize(result.metadata.leftSize)}</div>
                              <div className="text-muted-foreground">Left Size</div>
                            </div>
                            <div>
                              <div className="font-medium">{formatFileSize(result.metadata.rightSize)}</div>
                              <div className="text-muted-foreground">Right Size</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setLeftJSON(result.leftText)
                              setRightJSON(result.rightText)
                              setCurrentResult(result)
                              setActiveTab('diff')
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportResult(result, 'json')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(JSON.stringify(result.differences, null, 2), 'Differences')}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Perform some JSON comparisons to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparison Templates</CardTitle>
                <CardDescription>Pre-configured JSON examples for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diffTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Expected Differences:</div>
                            <div className="text-xs text-muted-foreground">{template.expectedDifferences} changes</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparison Settings</CardTitle>
                <CardDescription>Configure how JSON comparison is performed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* String Comparison */}
                <div className="space-y-4">
                  <h4 className="font-medium">String Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-ignore-case"
                        type="checkbox"
                        checked={options.ignoreCase}
                        onChange={(e) => setOptions((prev) => ({ ...prev, ignoreCase: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-ignore-case" className="text-sm">
                        Ignore case differences
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-ignore-whitespace"
                        type="checkbox"
                        checked={options.ignoreWhitespace}
                        onChange={(e) => setOptions((prev) => ({ ...prev, ignoreWhitespace: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-ignore-whitespace" className="text-sm">
                        Ignore whitespace differences
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Array Comparison */}
                <div className="space-y-4">
                  <h4 className="font-medium">Array Comparison</h4>
                  <div className="flex items-center space-x-2">
                    <input
                      id="settings-ignore-array-order"
                      type="checkbox"
                      checked={options.ignoreArrayOrder}
                      onChange={(e) => setOptions((prev) => ({ ...prev, ignoreArrayOrder: e.target.checked }))}
                      className="rounded border-input"
                    />
                    <Label htmlFor="settings-ignore-array-order" className="text-sm">
                      Ignore array element order
                    </Label>
                  </div>
                </div>

                {/* Object Comparison */}
                <div className="space-y-4">
                  <h4 className="font-medium">Object Comparison</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-ignore-extra-keys"
                        type="checkbox"
                        checked={options.ignoreExtraKeys}
                        onChange={(e) => setOptions((prev) => ({ ...prev, ignoreExtraKeys: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-ignore-extra-keys" className="text-sm">
                        Ignore extra object keys
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="settings-show-unchanged"
                        type="checkbox"
                        checked={options.showUnchanged}
                        onChange={(e) => setOptions((prev) => ({ ...prev, showUnchanged: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="settings-show-unchanged" className="text-sm">
                        Show unchanged values
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Performance Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-depth" className="text-sm">
                        Maximum depth (0 = unlimited)
                      </Label>
                      <Input
                        id="max-depth"
                        type="number"
                        min="0"
                        max="50"
                        value={options.maxDepth}
                        onChange={(e) => setOptions((prev) => ({ ...prev, maxDepth: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="precision" className="text-sm">
                        Number precision (decimal places)
                      </Label>
                      <Input
                        id="precision"
                        type="number"
                        min="0"
                        max="10"
                        value={options.precision}
                        onChange={(e) => setOptions((prev) => ({ ...prev, precision: parseInt(e.target.value) || 0 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Settings */}
                <div className="pt-4 border-t">
                  <Button onClick={() => setOptions(createDefaultOptions())} variant="outline">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset to Defaults
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const JsonDiff = () => {
  return <JSONDiffCore />
}

export default JsonDiff
