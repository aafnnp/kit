import { z } from "zod"

import { benchmarkResultSchema, testConfigSchema } from "@/components/tools/performance-tester/schema"

/**
 * Benchmark improvement metrics schema
 */
export const improvementMetricsSchema = z.object({
  timeImprovement: z.number(),
  memoryImprovement: z.number(),
  throughputImprovement: z.number(),
})

/**
 * Benchmark comparison schema
 */
export const benchmarkComparisonSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseline: benchmarkResultSchema,
  current: benchmarkResultSchema,
  improvements: z.record(z.string(), improvementMetricsSchema),
  overallScore: z.number(),
  timestamp: z.number(),
})

/**
 * Benchmark suite schema
 */
export const benchmarkSuiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  tests: z.array(testConfigSchema),
  enabled: z.boolean(),
})

/**
 * Benchmark tester state schema
 */
export const benchmarkTesterStateSchema = z.object({
  suites: z.array(benchmarkSuiteSchema),
  comparisons: z.array(benchmarkComparisonSchema),
  isRunning: z.boolean(),
  currentProgress: z.number(),
  currentTest: z.string(),
  baselineResults: benchmarkResultSchema.nullable(),
})

/**
 * Benchmark tester export helpers
 */
export type ImprovementMetrics = z.infer<typeof improvementMetricsSchema>
export type BenchmarkComparison = z.infer<typeof benchmarkComparisonSchema>
export type BenchmarkSuite = z.infer<typeof benchmarkSuiteSchema>
export type BenchmarkTesterState = z.infer<typeof benchmarkTesterStateSchema>
