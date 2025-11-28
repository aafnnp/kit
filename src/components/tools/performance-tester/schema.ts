import { z } from "zod"

// ==================== Performance Tester Schemas ====================

/**
 * Test Type schema
 */
export const testTypeSchema = z.enum(["image-compress", "audio-convert", "video-trim", "matrix-math"])

/**
 * Data Size schema
 */
export const dataSizeSchema = z.enum(["small", "medium", "large"])

/**
 * Test Status schema
 */
export const testStatusSchema = z.enum(["completed", "failed", "running", "pending"])

/**
 * Memory Usage schema
 */
export const memoryUsageSchema = z.object({
  worker: z.number(),
  mainThread: z.number(),
})

/**
 * Throughput schema
 */
export const throughputSchema = z.object({
  worker: z.number(),
  mainThread: z.number(),
})

/**
 * Test Result schema
 */
export const testResultSchema = z.object({
  id: z.string(),
  testName: z.string(),
  testType: testTypeSchema,
  workerTime: z.number(),
  mainThreadTime: z.number(),
  improvement: z.number(),
  memoryUsage: memoryUsageSchema,
  throughput: throughputSchema,
  timestamp: z.number(),
  status: testStatusSchema,
  error: z.string().optional(),
})

/**
 * Test Config schema
 */
export const testConfigSchema = z.object({
  testType: testTypeSchema,
  iterations: z.number(),
  dataSize: dataSizeSchema,
  concurrency: z.number(),
  measureMemory: z.boolean(),
})

/**
 * Performance Metrics schema
 */
export const performanceMetricsSchema = z.object({
  time: z.number(),
  memory: z.number(),
  throughput: z.number(),
})

/**
 * Test Summary schema
 */
export const testSummarySchema = z.object({
  totalTests: z.number(),
  successfulTests: z.number(),
  failedTests: z.number(),
  averageImprovement: z.number(),
  bestImprovement: z.number(),
})

/**
 * Environment schema
 */
export const environmentSchema = z.object({
  userAgent: z.string(),
  platform: z.string(),
  cores: z.number(),
  memory: z.number(),
})

/**
 * Benchmark Result schema
 */
export const benchmarkResultSchema = z.object({
  timestamp: z.string(),
  results: z.array(testResultSchema),
  summary: testSummarySchema,
  environment: environmentSchema,
})

/**
 * Test Data schema
 */
export const testDataSchema = z.object({
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string().optional(),
  quality: z.number().optional(),
  duration: z.number().optional(),
  sampleRate: z.number().optional(),
  channels: z.number().optional(),
  resolution: z.string().optional(),
  fps: z.number().optional(),
  size: z.number().optional(),
  operation: z.string().optional(),
  density: z.number().optional(),
})

// ==================== Type Exports ====================

export type TestType = z.infer<typeof testTypeSchema>
export type DataSize = z.infer<typeof dataSizeSchema>
export type TestStatus = z.infer<typeof testStatusSchema>
export type MemoryUsage = z.infer<typeof memoryUsageSchema>
export type Throughput = z.infer<typeof throughputSchema>
export type TestResult = z.infer<typeof testResultSchema>
export type TestConfig = z.infer<typeof testConfigSchema>
export type PerformanceMetrics = z.infer<typeof performanceMetricsSchema>
export type TestSummary = z.infer<typeof testSummarySchema>
export type Environment = z.infer<typeof environmentSchema>
export type BenchmarkResult = z.infer<typeof benchmarkResultSchema>
export type TestData = z.infer<typeof testDataSchema>
