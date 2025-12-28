// ==================== Performance Tester Types ====================

/**
 * Test Type type
 */
export type testType = "image-compress" | "audio-convert" | "video-trim" | "matrix-math"

/**
 * Data Size type
 */
export type dataSize = "small" | "medium" | "large"

/**
 * Test Status type
 */
export type testStatus = "completed" | "failed" | "running" | "pending"

/**
 * Memory Usage type
 */
export interface memoryUsage {
  worker: number,
  mainThread: number,
}

/**
 * Throughput type
 */
export interface throughput {
  worker: number,
  mainThread: number,
}

/**
 * Test Result type
 */
export interface testResult {
  id: string,
  testName: string,
  testType: testType,
  workerTime: number,
  mainThreadTime: number,
  improvement: number,
  memoryUsage: memoryUsage,
  throughput: throughput,
  timestamp: number,
  status: testStatus
  error?: string,
}

/**
 * Test Config type
 */
export interface testConfig {
  testType: testType,
  iterations: number,
  dataSize: dataSize,
  concurrency: number,
  measureMemory: boolean,
}

/**
 * Performance Metrics type
 */
export interface performanceMetrics {
  time: number,
  memory: number,
  throughput: number,
}

/**
 * Test Summary type
 */
export interface testSummary {
  totalTests: number,
  successfulTests: number,
  failedTests: number,
  averageImprovement: number,
  bestImprovement: number,
}

/**
 * Environment type
 */
export interface environment {
  userAgent: string,
  platform: string,
  cores: number,
  memory: number,
}

/**
 * Benchmark Result type
 */
export interface benchmarkResult {
  timestamp: string,
  results: testResult[],
  summary: testSummary,
  environment: environment,
}

/**
 * Test Data type
 */
export interface testData {
  width?: number,
  height?: number,
  format?: string,
  quality?: number,
  duration?: number,
  sampleRate?: number,
  channels?: number,
  resolution?: string,
  fps?: number,
  size?: number,
  operation?: string,
  density?: number,
}

// ==================== Type Exports ====================

export type TestType = testType
export type DataSize = dataSize
export type TestStatus = testStatus
export type MemoryUsage = memoryUsage
export type Throughput = throughput
export type TestResult = testResult
export type TestConfig = testConfig
export type PerformanceMetrics = performanceMetrics
export type TestSummary = testSummary
export type Environment = environment
export type BenchmarkResult = benchmarkResult
export type TestData = testData
