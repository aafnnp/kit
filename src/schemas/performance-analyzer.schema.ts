import { z } from "zod"

// ==================== Performance Analyzer Schemas ====================

/**
 * Metric Category schema
 */
export const metricCategorySchema = z.enum(["timing", "memory", "network", "rendering", "custom"])

/**
 * Test Status schema
 */
export const testStatusSchema = z.enum(["idle", "running", "completed", "error"])

/**
 * Resource Type schema
 */
export const resourceTypeSchema = z.enum(["script", "stylesheet", "image", "font", "fetch", "other"])

/**
 * User Timing Type schema
 */
export const userTimingTypeSchema = z.enum(["mark", "measure"])

/**
 * Performance Metric schema
 */
export const performanceMetricSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  unit: z.string(),
  category: metricCategorySchema,
  timestamp: z.number(),
  description: z.string().optional(),
})

/**
 * Performance Result schema
 */
export const performanceResultSchema = z.object({
  id: z.string(),
  testId: z.string(),
  runNumber: z.number(),
  executionTime: z.number(),
  memoryUsage: z.number().optional(),
  cpuUsage: z.number().optional(),
  metrics: z.array(performanceMetricSchema),
  timestamp: z.number(),
  error: z.string().optional(),
})

/**
 * Performance Test schema
 */
export const performanceTestSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  code: z.string(),
  iterations: z.number(),
  warmupRuns: z.number(),
  results: z.array(performanceResultSchema),
  status: testStatusSchema,
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * Comparison Result schema
 */
export const comparisonResultSchema = z.object({
  testId: z.string(),
  testName: z.string(),
  avgTime: z.number(),
  minTime: z.number(),
  maxTime: z.number(),
  stdDev: z.number(),
  opsPerSecond: z.number(),
  relativePerformance: z.number(),
})

/**
 * Performance Comparison schema
 */
export const performanceComparisonSchema = z.object({
  id: z.string(),
  name: z.string(),
  tests: z.array(performanceTestSchema),
  results: z.array(comparisonResultSchema),
  createdAt: z.number(),
})

/**
 * Performance Metrics schema
 */
export const performanceMetricsSchema = z.object({
  fcp: z.number(),
  lcp: z.number(),
  fid: z.number(),
  cls: z.number(),
  ttfb: z.number(),
  domContentLoaded: z.number(),
  loadComplete: z.number(),
})

/**
 * Resource Timing schema
 */
export const resourceTimingSchema = z.object({
  name: z.string(),
  type: resourceTypeSchema,
  startTime: z.number(),
  duration: z.number(),
  size: z.number(),
  transferSize: z.number(),
  encodedBodySize: z.number(),
  decodedBodySize: z.number(),
})

/**
 * User Timing schema
 */
export const userTimingSchema = z.object({
  name: z.string(),
  type: userTimingTypeSchema,
  startTime: z.number(),
  duration: z.number().optional(),
})

/**
 * Performance Profile schema
 */
export const performanceProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().optional(),
  startTime: z.number(),
  endTime: z.number(),
  duration: z.number(),
  metrics: performanceMetricsSchema,
  resources: z.array(resourceTimingSchema),
  userTiming: z.array(userTimingSchema),
})

/**
 * Performance Analyzer State schema
 */
export const performanceAnalyzerStateSchema = z.object({
  tests: z.array(performanceTestSchema),
  activeTest: performanceTestSchema.optional(),
  comparisons: z.array(performanceComparisonSchema),
  profiles: z.array(performanceProfileSchema),
  isRunning: z.boolean(),
  currentProgress: z.number(),
  error: z.string().optional(),
})

// ==================== Type Exports ====================

export type MetricCategory = z.infer<typeof metricCategorySchema>
export type TestStatus = z.infer<typeof testStatusSchema>
export type ResourceType = z.infer<typeof resourceTypeSchema>
export type UserTimingType = z.infer<typeof userTimingTypeSchema>
export type PerformanceMetric = z.infer<typeof performanceMetricSchema>
export type PerformanceResult = z.infer<typeof performanceResultSchema>
export type PerformanceTest = z.infer<typeof performanceTestSchema>
export type ComparisonResult = z.infer<typeof comparisonResultSchema>
export type PerformanceComparison = z.infer<typeof performanceComparisonSchema>
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>
export type ResourceTiming = z.infer<typeof resourceTimingSchema>
export type UserTiming = z.infer<typeof userTimingSchema>
export type PerformanceProfile = z.infer<typeof performanceProfileSchema>
export type PerformanceAnalyzerState = z.infer<typeof performanceAnalyzerStateSchema>

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
