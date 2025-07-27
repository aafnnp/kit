// 性能分析工具的类型定义

export interface PerformanceMetric {
  id: string
  name: string
  value: number
  unit: string
  category: 'timing' | 'memory' | 'network' | 'rendering' | 'custom'
  timestamp: number
  description?: string
}

export interface PerformanceTest {
  id: string
  name: string
  description: string
  code: string
  iterations: number
  warmupRuns: number
  results: PerformanceResult[]
  status: 'idle' | 'running' | 'completed' | 'error'
  createdAt: number
  updatedAt: number
}

export interface PerformanceResult {
  id: string
  testId: string
  runNumber: number
  executionTime: number
  memoryUsage?: number
  cpuUsage?: number
  metrics: PerformanceMetric[]
  timestamp: number
  error?: string
}

export interface PerformanceComparison {
  id: string
  name: string
  tests: PerformanceTest[]
  results: ComparisonResult[]
  createdAt: number
}

export interface ComparisonResult {
  testId: string
  testName: string
  avgTime: number
  minTime: number
  maxTime: number
  stdDev: number
  opsPerSecond: number
  relativePerformance: number
}

export interface PerformanceProfile {
  id: string
  name: string
  url?: string
  startTime: number
  endTime: number
  duration: number
  metrics: {
    fcp: number // First Contentful Paint
    lcp: number // Largest Contentful Paint
    fid: number // First Input Delay
    cls: number // Cumulative Layout Shift
    ttfb: number // Time to First Byte
    domContentLoaded: number
    loadComplete: number
  }
  resources: ResourceTiming[]
  userTiming: UserTiming[]
}

export interface ResourceTiming {
  name: string
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'fetch' | 'other'
  startTime: number
  duration: number
  size: number
  transferSize: number
  encodedBodySize: number
  decodedBodySize: number
}

export interface UserTiming {
  name: string
  type: 'mark' | 'measure'
  startTime: number
  duration?: number
}

export interface PerformanceAnalyzerState {
  tests: PerformanceTest[]
  activeTest?: PerformanceTest
  comparisons: PerformanceComparison[]
  profiles: PerformanceProfile[]
  isRunning: boolean
  currentProgress: number
  error?: string
}

// 预设的性能测试模板
export const PERFORMANCE_TEMPLATES: Partial<PerformanceTest>[] = [
  {
    name: 'Array Operations',
    description: 'Compare different array manipulation methods',
    code: `// Test array operations
const arr = Array.from({ length: 10000 }, (_, i) => i)

// Method 1: for loop
let sum1 = 0
for (let i = 0; i < arr.length; i++) {
  sum1 += arr[i]
}

// Method 2: reduce
const sum2 = arr.reduce((acc, val) => acc + val, 0)

// Method 3: forEach
let sum3 = 0
arr.forEach(val => sum3 += val)

return { sum1, sum2, sum3 }`,
    iterations: 1000,
    warmupRuns: 100
  },
  {
    name: 'String Concatenation',
    description: 'Compare string concatenation methods',
    code: `// Test string concatenation
const words = ['Hello', 'World', 'Performance', 'Test']

// Method 1: + operator
let result1 = ''
for (const word of words) {
  result1 += word + ' '
}

// Method 2: join
const result2 = words.join(' ') + ' '

// Method 3: template literals
const result3 = \`\${words.join(' ')} \`

return { result1, result2, result3 }`,
    iterations: 10000,
    warmupRuns: 1000
  },
  {
    name: 'Object Property Access',
    description: 'Compare object property access methods',
    code: `// Test object property access
const obj = { a: 1, b: 2, c: 3, d: 4, e: 5 }
const key = 'c'

// Method 1: dot notation
const value1 = obj.c

// Method 2: bracket notation
const value2 = obj[key]

// Method 3: destructuring
const { c: value3 } = obj

return { value1, value2, value3 }`,
    iterations: 100000,
    warmupRuns: 10000
  },
  {
    name: 'DOM Manipulation',
    description: 'Test DOM manipulation performance',
    code: `// Test DOM manipulation
const container = document.createElement('div')
document.body.appendChild(container)

// Method 1: innerHTML
container.innerHTML = '<div>Test</div>'.repeat(100)

// Method 2: createElement and appendChild
container.innerHTML = ''
for (let i = 0; i < 100; i++) {
  const div = document.createElement('div')
  div.textContent = 'Test'
  container.appendChild(div)
}

// Cleanup
document.body.removeChild(container)

return { elementsCreated: 100 }`,
    iterations: 100,
    warmupRuns: 10
  },
  {
    name: 'JSON Operations',
    description: 'Test JSON parsing and stringifying',
    code: `// Test JSON operations
const data = {
  users: Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: \`User \${i}\`,
    email: \`user\${i}@example.com\`,
    active: i % 2 === 0
  }))
}

// Stringify
const jsonString = JSON.stringify(data)

// Parse
const parsedData = JSON.parse(jsonString)

return { 
  originalSize: JSON.stringify(data).length,
  parsedUsers: parsedData.users.length 
}`,
    iterations: 100,
    warmupRuns: 10
  }
]

// 性能指标阈值
export const PERFORMANCE_THRESHOLDS = {
  fcp: { good: 1800, poor: 3000 }, // ms
  lcp: { good: 2500, poor: 4000 }, // ms
  fid: { good: 100, poor: 300 }, // ms
  cls: { good: 0.1, poor: 0.25 }, // score
  ttfb: { good: 800, poor: 1800 } // ms
}

// 获取性能等级
export const getPerformanceGrade = (metric: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = PERFORMANCE_THRESHOLDS[metric as keyof typeof PERFORMANCE_THRESHOLDS]
  if (!threshold) return 'good'
  
  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// 格式化性能值
export const formatPerformanceValue = (value: number, unit: string): string => {
  if (unit === 'ms') {
    if (value < 1000) return `${value.toFixed(1)}ms`
    return `${(value / 1000).toFixed(2)}s`
  }
  
  if (unit === 'bytes') {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = value
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)}${units[unitIndex]}`
  }
  
  return `${value.toFixed(2)}${unit}`
}