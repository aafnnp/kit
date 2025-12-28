import type { benchmarkResult, testConfig } from "@/components/tools/performance-tester/schema"

/**
 * Benchmark improvement metrics type
 */
export interface improvementMetrics {
  timeImprovement: number,
  memoryImprovement: number,
  throughputImprovement: number,
}

/**
 * Benchmark comparison type
 */
export interface benchmarkComparison {
  id: string,
  name: string,
  baseline: benchmarkResult,
  current: benchmarkResult,
  improvements: Record<string, improvementMetrics>,
  overallScore: number,
  timestamp: number,
}

/**
 * Benchmark suite type
 */
export interface benchmarkSuite {
  id: string,
  name: string,
  description: string,
  tests: testConfig[],
  enabled: boolean,
}

/**
 * Benchmark tester state type
 */
export interface benchmarkTesterState {
  suites: benchmarkSuite[],
  comparisons: benchmarkComparison[],
  isRunning: boolean,
  currentProgress: number,
  currentTest: string,
  baselineResults?: benchmarkResult
}

/**
 * Benchmark tester export helpers
 */
export type ImprovementMetrics = improvementMetrics
export type BenchmarkComparison = benchmarkComparison
export type BenchmarkSuite = benchmarkSuite
export type BenchmarkTesterState = benchmarkTesterState

// ==================== Type Exports ====================

