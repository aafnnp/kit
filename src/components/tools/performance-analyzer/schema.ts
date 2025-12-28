// ==================== Performance Analyzer Types ====================

/**
 * Metric Category type
 */
export type metricCategory = "timing" | "memory" | "network" | "rendering" | "custom"

/**
 * Test Status type
 */
export type testStatus = "idle" | "running" | "completed" | "error"

/**
 * Resource Type type
 */
export type resourceType = "script" | "stylesheet" | "image" | "font" | "fetch" | "other"

/**
 * User Timing Type type
 */
export type userTimingType = "mark" | "measure"

/**
 * Performance Metric type
 */
export interface performanceMetric {
  id: string,
  name: string,
  value: number,
  unit: string,
  category: metricCategory,
  timestamp: number
  description?: string,
}

/**
 * Performance Result type
 */
export interface performanceResult {
  id: string,
  testId: string,
  runNumber: number,
  executionTime: number
  memoryUsage?: number,
  cpuUsage?: number,
  metrics: performanceMetric[],
  timestamp: number
  error?: string,
}

/**
 * Performance Test type
 */
export interface performanceTest {
  id: string,
  name: string,
  description: string,
  code: string,
  iterations: number,
  warmupRuns: number,
  results: performanceResult[],
  status: testStatus,
  createdAt: number,
  updatedAt: number,
}

/**
 * Comparison Result type
 */
export interface comparisonResult {
  testId: string,
  testName: string,
  avgTime: number,
  minTime: number,
  maxTime: number,
  stdDev: number,
  opsPerSecond: number,
  relativePerformance: number,
}

/**
 * Performance Comparison type
 */
export interface performanceComparison {
  id: string,
  name: string,
  tests: performanceTest[],
  results: comparisonResult[],
  createdAt: number,
}

/**
 * Performance Metrics type
 */
export interface performanceMetrics {
  fcp: number,
  lcp: number,
  fid: number,
  cls: number,
  ttfb: number,
  domContentLoaded: number,
  loadComplete: number,
}

/**
 * Resource Timing type
 */
export interface resourceTiming {
  name: string,
  type: resourceType,
  startTime: number,
  duration: number,
  size: number,
  transferSize: number,
  encodedBodySize: number,
  decodedBodySize: number,
}

/**
 * User Timing type
 */
export interface userTiming {
  name: string,
  type: userTimingType,
  startTime: number
  duration?: number,
}

/**
 * Performance Profile type
 */
export interface performanceProfile {
  id: string,
  name: string
  url?: string,
  startTime: number,
  endTime: number,
  duration: number,
  metrics: performanceMetrics,
  resources: resourceTiming[],
  userTiming: userTiming[],
}

/**
 * Performance Analyzer State type
 */
export interface performanceAnalyzerState {
  tests: performanceTest[]
  activeTest?: performanceTest,
  comparisons: performanceComparison[],
  profiles: performanceProfile[],
  isRunning: boolean,
  currentProgress: number
  error?: string,
}

// ==================== Type Exports ====================

export type MetricCategory = metricCategory
export type TestStatus = testStatus
export type ResourceType = resourceType
export type UserTimingType = userTimingType
export type PerformanceMetric = performanceMetric
export type PerformanceResult = performanceResult
export type PerformanceTest = performanceTest
export type ComparisonResult = comparisonResult
export type PerformanceComparison = performanceComparison
export type PerformanceMetrics = performanceMetrics
export type ResourceTiming = resourceTiming
export type UserTiming = userTiming
export type PerformanceProfile = performanceProfile
export type PerformanceAnalyzerState = performanceAnalyzerState

// ==================== Constants and Utility Functions ====================

/**
 * Performance test templates
 */
export const PERFORMANCE_TEMPLATES: Array<Partial<PerformanceTest>> = [
  {
    name: "Page Load",
    description: "Measure page load performance",
    iterations: 5,
    warmupRuns: 1,
    code: "// Page load test code",
  },
  {
    name: "User Interaction",
    description: "Measure user interaction performance",
    iterations: 10,
    warmupRuns: 2,
    code: "// User interaction test code",
  },
  {
    name: "Resource Loading",
    description: "Measure resource loading performance",
    iterations: 3,
    warmupRuns: 1,
    code: "// Resource loading test code",
  },
]

/**
 * Format performance value with unit
 */
export function formatPerformanceValue(value: number, unit: string): string {
  if (value < 1) {
    return `${(value * 1000).toFixed(2)} ${unit.replace("ms", "μs")}`
  }
  if (value < 1000) {
    return `${value.toFixed(2)} ${unit}`
  }
  return `${(value / 1000).toFixed(2)} ${unit.replace("ms", "s")}`
}
