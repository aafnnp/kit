export interface TestResult {
  id: string
  testName: string
  testType: 'image-compress' | 'audio-convert' | 'video-trim' | 'matrix-math'
  workerTime: number
  mainThreadTime: number
  improvement: number
  memoryUsage: {
    worker: number
    mainThread: number
  }
  throughput: {
    worker: number
    mainThread: number
  }
  timestamp: number
  status: 'completed' | 'failed' | 'running'
  error?: string
}

export interface TestConfig {
  testType: 'image-compress' | 'audio-convert' | 'video-trim' | 'matrix-math'
  iterations: number
  dataSize: 'small' | 'medium' | 'large'
  concurrency: number
  measureMemory: boolean
}

export interface PerformanceMetrics {
  time: number
  memory: number
  throughput: number
}

export interface TestSummary {
  totalTests: number
  successfulTests: number
  failedTests: number
  averageImprovement: number
  bestImprovement: number
}

export interface BenchmarkResult {
  timestamp: string
  results: TestResult[]
  summary: TestSummary
  environment: {
    userAgent: string
    platform: string
    cores: number
    memory: number
  }
}

export interface TestData {
  // Image compression test data
  width?: number
  height?: number
  format?: string
  quality?: number
  
  // Audio conversion test data
  duration?: number
  sampleRate?: number
  channels?: number
  
  // Video trim test data
  resolution?: string
  fps?: number
  
  // Matrix math test data
  size?: number
  operation?: string
  density?: number
}

export type TestType = 'image-compress' | 'audio-convert' | 'video-trim' | 'matrix-math'
export type DataSize = 'small' | 'medium' | 'large'
export type TestStatus = 'completed' | 'failed' | 'running' | 'pending'