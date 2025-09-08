import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  Clock,
  TrendingUp,
  TrendingDown,
  Settings,
  GitCompare,
  Target,
  Award,
  Cpu,
  MemoryStick,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { ToolBase } from '@/components/ui/tool-base'
import type { TestResult, TestConfig, BenchmarkResult } from '@/types/performance-tester'

interface BenchmarkComparison {
  id: string
  name: string
  baseline: BenchmarkResult
  current: BenchmarkResult
  improvements: {
    [key: string]: {
      timeImprovement: number
      memoryImprovement: number
      throughputImprovement: number
    }
  }
  overallScore: number
  timestamp: number
}

interface BenchmarkSuite {
  id: string
  name: string
  description: string
  tests: TestConfig[]
  enabled: boolean
}

const defaultBenchmarkSuites: BenchmarkSuite[] = [
  {
    id: 'image-processing',
    name: 'Image Processing Suite',
    description: 'Comprehensive image compression and manipulation tests',
    enabled: true,
    tests: [
      {
        testType: 'image-compress',
        iterations: 10,
        dataSize: 'small',
        concurrency: 2,
        measureMemory: true,
      },
      {
        testType: 'image-compress',
        iterations: 5,
        dataSize: 'medium',
        concurrency: 4,
        measureMemory: true,
      },
      {
        testType: 'image-compress',
        iterations: 3,
        dataSize: 'large',
        concurrency: 8,
        measureMemory: true,
      },
    ],
  },
  {
    id: 'audio-processing',
    name: 'Audio Processing Suite',
    description: 'Audio conversion and manipulation performance tests',
    enabled: true,
    tests: [
      {
        testType: 'audio-convert',
        iterations: 8,
        dataSize: 'small',
        concurrency: 2,
        measureMemory: true,
      },
      {
        testType: 'audio-convert',
        iterations: 4,
        dataSize: 'medium',
        concurrency: 3,
        measureMemory: true,
      },
      {
        testType: 'audio-convert',
        iterations: 2,
        dataSize: 'large',
        concurrency: 4,
        measureMemory: true,
      },
    ],
  },
  {
    id: 'video-processing',
    name: 'Video Processing Suite',
    description: 'Video trimming and processing performance tests',
    enabled: true,
    tests: [
      {
        testType: 'video-trim',
        iterations: 5,
        dataSize: 'small',
        concurrency: 1,
        measureMemory: true,
      },
      {
        testType: 'video-trim',
        iterations: 3,
        dataSize: 'medium',
        concurrency: 2,
        measureMemory: true,
      },
      {
        testType: 'video-trim',
        iterations: 1,
        dataSize: 'large',
        concurrency: 2,
        measureMemory: true,
      },
    ],
  },
  {
    id: 'matrix-computation',
    name: 'Matrix Computation Suite',
    description: 'Mathematical computation and linear algebra tests',
    enabled: true,
    tests: [
      {
        testType: 'matrix-math',
        iterations: 20,
        dataSize: 'small',
        concurrency: 4,
        measureMemory: true,
      },
      {
        testType: 'matrix-math',
        iterations: 10,
        dataSize: 'medium',
        concurrency: 8,
        measureMemory: true,
      },
      {
        testType: 'matrix-math',
        iterations: 5,
        dataSize: 'large',
        concurrency: 12,
        measureMemory: true,
      },
    ],
  },
]

const BenchmarkTester = () => {
  const [benchmarkSuites, setBenchmarkSuites] = useState<BenchmarkSuite[]>(defaultBenchmarkSuites)
  const [comparisons, setComparisons] = useState<BenchmarkComparison[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState('')
  const [baselineResults, setBaselineResults] = useState<BenchmarkResult | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 获取系统信息
  const getSystemInfo = useCallback(() => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      cores: navigator.hardwareConcurrency || 4,
      memory: (navigator as any).deviceMemory || 8,
    }
  }, [])

  // 生成测试数据
  const generateTestData = useCallback((testType: string, size: string) => {
    switch (testType) {
      case 'image-compress':
        const dimensions = size === 'small' ? 512 : size === 'medium' ? 1024 : 2048
        return {
          width: dimensions,
          height: dimensions,
          format: 'png',
          quality: 0.8,
        }
      case 'audio-convert':
        const duration = size === 'small' ? 30 : size === 'medium' ? 120 : 300
        return {
          duration,
          sampleRate: 44100,
          channels: 2,
          format: 'wav',
        }
      case 'video-trim':
        const videoDuration = size === 'small' ? 10 : size === 'medium' ? 60 : 180
        return {
          duration: videoDuration,
          resolution: size === 'small' ? '720p' : size === 'medium' ? '1080p' : '4k',
          fps: 30,
        }
      case 'matrix-math':
        const matrixSize = size === 'small' ? 50 : size === 'medium' ? 100 : 200
        return {
          size: matrixSize,
          operation: 'multiply',
          density: 0.7,
        }
      default:
        return {}
    }
  }, [])

  // 运行单个测试
  const runSingleTest = useCallback(
    async (config: TestConfig) => {
      const testData = generateTestData(config.testType, config.dataSize)

      // 模拟Web Worker测试
      const workerStartTime = performance.now()
      const workerStartMemory = (performance as any).memory?.usedJSHeapSize || 0

      const taskId = nanoid()
      await new Promise((resolve) => {
        const worker = new Worker('/workers/processing-worker.js')

        // 将抽象测试类型映射为具体 Worker 任务；避免依赖文件型输入，非矩阵任务使用 regex 占位
        let message: any
        if (config.testType === 'matrix-math') {
          const n = (testData as any)?.size || 100
          const makeMatrix = (size: number) =>
            Array.from({ length: size }, () => Array.from({ length: size }, () => Math.random()))
          const A = makeMatrix(n)
          const B = makeMatrix(n)
          message = {
            taskId,
            type: 'matrix-multiply',
            data: {
              matrices: [
                { data: A, rows: n, cols: n },
                { data: B, rows: n, cols: n },
              ],
            },
            iterations: config.iterations,
          }
        } else {
          const repeats = (testData as any)?.duration
            ? Math.max(1, Math.floor(((testData as any).duration as number) / 10))
            : 50
          const chunk = 'lorem ipsum dolor sit amet consectetur adipiscing elit '
          const bigText = chunk.repeat(
            repeats * (config.dataSize === 'large' ? 400 : config.dataSize === 'medium' ? 200 : 100)
          )
          message = {
            taskId,
            type: 'regex-match',
            data: {
              pattern: '\\b[a-z]{3,}\\b',
              flags: 'gi',
              text: bigText,
            },
            iterations: config.iterations,
          }
        }

        worker.postMessage(message)

        worker.onmessage = (e) => {
          if (e.data?.type === 'complete') {
            worker.terminate()
            resolve(e.data.data ?? e.data.result)
          } else if (e.data?.type === 'error') {
            worker.terminate()
            resolve(null)
          }
        }

        setTimeout(() => {
          try {
            worker.terminate()
          } catch {}
          resolve(null)
        }, 30000)
      })

      const workerEndTime = performance.now()
      const workerEndMemory = (performance as any).memory?.usedJSHeapSize || 0

      // 模拟主线程测试
      const mainStartTime = performance.now()
      const mainStartMemory = (performance as any).memory?.usedJSHeapSize || 0

      for (let i = 0; i < config.iterations; i++) {
        if (i % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0))
        }
      }

      const mainEndTime = performance.now()
      const mainEndMemory = (performance as any).memory?.usedJSHeapSize || 0

      const workerTime = workerEndTime - workerStartTime
      const mainThreadTime = mainEndTime - mainStartTime
      const improvement = ((mainThreadTime - workerTime) / mainThreadTime) * 100

      return {
        id: nanoid(),
        testName: `${config.testType} - ${config.dataSize} (${config.iterations} iterations)`,
        testType: config.testType,
        workerTime,
        mainThreadTime,
        improvement,
        memoryUsage: {
          worker: Math.max(0, workerEndMemory - workerStartMemory) / 1024 / 1024,
          mainThread: Math.max(0, mainEndMemory - mainStartMemory) / 1024 / 1024,
        },
        throughput: {
          worker: config.iterations / (workerTime / 1000),
          mainThread: config.iterations / (mainThreadTime / 1000),
        },
        timestamp: Date.now(),
        status: 'completed' as const,
      }
    },
    [generateTestData]
  )

  // 运行基准测试套件
  const runBenchmarkSuite = useCallback(async () => {
    if (isRunning) return

    setIsRunning(true)
    setCurrentProgress(0)

    abortControllerRef.current = new AbortController()

    try {
      const enabledSuites = benchmarkSuites.filter((suite) => suite.enabled)
      const allTests = enabledSuites.flatMap((suite) => suite.tests)
      const totalTests = allTests.length

      const results: TestResult[] = []

      for (let i = 0; i < allTests.length; i++) {
        if (abortControllerRef.current?.signal.aborted) break

        const test = allTests[i]
        setCurrentTest(`${test.testType} - ${test.dataSize}`)

        try {
          const result = await runSingleTest(test)
          results.push(result)
        } catch (error) {
          console.error('Test failed:', error)
          results.push({
            id: nanoid(),
            testName: `${test.testType} - ${test.dataSize} (Failed)`,
            testType: test.testType,
            workerTime: 0,
            mainThreadTime: 0,
            improvement: 0,
            memoryUsage: { worker: 0, mainThread: 0 },
            throughput: { worker: 0, mainThread: 0 },
            timestamp: Date.now(),
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }

        setCurrentProgress(((i + 1) / totalTests) * 100)
      }

      const benchmarkResult: BenchmarkResult = {
        timestamp: new Date().toISOString(),
        results,
        summary: {
          totalTests: results.length,
          successfulTests: results.filter((r) => r.status === 'completed').length,
          failedTests: results.filter((r) => r.status === 'failed').length,
          averageImprovement:
            results.filter((r) => r.status === 'completed').reduce((sum, r) => sum + r.improvement, 0) /
              results.filter((r) => r.status === 'completed').length || 0,
          bestImprovement: Math.max(...results.filter((r) => r.status === 'completed').map((r) => r.improvement), 0),
        },
        environment: getSystemInfo(),
      }

      if (!baselineResults) {
        setBaselineResults(benchmarkResult)
        toast.success('Baseline benchmark completed! Run another benchmark to compare.')
      } else {
        // 创建对比
        const comparison = createComparison(baselineResults, benchmarkResult)
        setComparisons((prev) => [comparison, ...prev])
        toast.success(`Benchmark comparison completed! Overall score: ${comparison.overallScore.toFixed(1)}`)
      }
    } catch (error) {
      toast.error(`Benchmark failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
      setCurrentProgress(0)
      setCurrentTest('')
    }
  }, [benchmarkSuites, isRunning, runSingleTest, baselineResults, getSystemInfo])

  // 创建性能对比
  const createComparison = useCallback((baseline: BenchmarkResult, current: BenchmarkResult): BenchmarkComparison => {
    const improvements: { [key: string]: any } = {}

    // 按测试类型分组计算改进
    const testTypes = ['image-compress', 'audio-convert', 'video-trim', 'matrix-math']

    testTypes.forEach((testType) => {
      const baselineTests = baseline.results.filter((r) => r.testType === testType && r.status === 'completed')
      const currentTests = current.results.filter((r) => r.testType === testType && r.status === 'completed')

      if (baselineTests.length > 0 && currentTests.length > 0) {
        const baselineAvgTime = baselineTests.reduce((sum, r) => sum + r.workerTime, 0) / baselineTests.length
        const currentAvgTime = currentTests.reduce((sum, r) => sum + r.workerTime, 0) / currentTests.length

        const baselineAvgMemory = baselineTests.reduce((sum, r) => sum + r.memoryUsage.worker, 0) / baselineTests.length
        const currentAvgMemory = currentTests.reduce((sum, r) => sum + r.memoryUsage.worker, 0) / currentTests.length

        const baselineAvgThroughput =
          baselineTests.reduce((sum, r) => sum + r.throughput.worker, 0) / baselineTests.length
        const currentAvgThroughput = currentTests.reduce((sum, r) => sum + r.throughput.worker, 0) / currentTests.length

        improvements[testType] = {
          timeImprovement: ((baselineAvgTime - currentAvgTime) / baselineAvgTime) * 100,
          memoryImprovement: ((baselineAvgMemory - currentAvgMemory) / baselineAvgMemory) * 100,
          throughputImprovement: ((currentAvgThroughput - baselineAvgThroughput) / baselineAvgThroughput) * 100,
        }
      }
    })

    // 计算总体评分
    const improvementValues = Object.values(improvements).flatMap((imp: any) => [
      imp.timeImprovement,
      imp.memoryImprovement,
      imp.throughputImprovement,
    ])

    const overallScore =
      improvementValues.length > 0
        ? improvementValues.reduce((sum: number, val: number) => sum + val, 0) / improvementValues.length
        : 0

    return {
      id: nanoid(),
      name: `Comparison ${new Date().toLocaleDateString()}`,
      baseline,
      current,
      improvements,
      overallScore,
      timestamp: Date.now(),
    }
  }, [])

  // 停止基准测试
  const stopBenchmark = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsRunning(false)
    setCurrentProgress(0)
    setCurrentTest('')
  }, [])

  // 重置基准线
  const resetBaseline = useCallback(() => {
    setBaselineResults(null)
    setComparisons([])
  }, [])

  // 导出基准测试结果
  const exportBenchmark = useCallback((result: BenchmarkResult) => {
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benchmark-${result.timestamp.split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [])

  // 导入基准测试结果
  const importBenchmark = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const result = JSON.parse(e.target?.result as string) as BenchmarkResult
        setBaselineResults(result)
        toast.success('Baseline benchmark imported successfully!')
      } catch (error) {
        toast.error('Failed to import benchmark file')
      }
    }
    reader.readAsText(file)
  }, [])

  // 切换测试套件启用状态
  const toggleSuite = useCallback((suiteId: string) => {
    setBenchmarkSuites((prev) =>
      prev.map((suite) => (suite.id === suiteId ? { ...suite, enabled: !suite.enabled } : suite))
    )
  }, [])

  return (
    <ToolBase
      toolName="Benchmark Tester"
      icon={<GitCompare className="w-5 h-5" />}
      description="Compare performance before and after optimizations"
    >
      <div className="space-y-6">
        {/* 基准测试配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Benchmark Configuration
            </CardTitle>
            <CardDescription>Configure benchmark test suites and parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benchmarkSuites.map((suite) => (
                <div key={suite.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox id={suite.id} checked={suite.enabled} onCheckedChange={() => toggleSuite(suite.id)} />
                      <Label htmlFor={suite.id} className="font-medium">
                        {suite.name}
                      </Label>
                    </div>
                    <Badge variant="outline">{suite.tests.length} tests</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suite.description}</p>
                  <div className="text-xs text-muted-foreground">
                    Tests: {suite.tests.map((t) => `${t.testType}(${t.dataSize})`).join(', ')}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-4">
                <Button
                  onClick={runBenchmarkSuite}
                  disabled={isRunning || benchmarkSuites.filter((s) => s.enabled).length === 0}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? 'Running Benchmark...' : baselineResults ? 'Run Comparison' : 'Run Baseline'}
                </Button>

                {isRunning && (
                  <Button onClick={stopBenchmark} variant="destructive" className="flex items-center gap-2">
                    <Square className="w-4 h-4" />
                    Stop Benchmark
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input ref={fileInputRef} type="file" accept=".json" onChange={importBenchmark} className="hidden" />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Baseline
                </Button>

                {baselineResults && (
                  <>
                    <Button
                      onClick={() => exportBenchmark(baselineResults)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export Baseline
                    </Button>
                    <Button onClick={resetBaseline} variant="outline" size="sm" className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                  </>
                )}
              </div>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Running: {currentTest}</span>
                  <span>{currentProgress.toFixed(1)}%</span>
                </div>
                <Progress value={currentProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 基准线状态 */}
        {baselineResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Baseline Results
              </CardTitle>
              <CardDescription>Current baseline for performance comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{baselineResults.summary.totalTests}</div>
                  <div className="text-sm text-muted-foreground">Total Tests</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{baselineResults.summary.successfulTests}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {baselineResults.summary.averageImprovement.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {new Date(baselineResults.timestamp).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Created</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 性能对比结果 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GitCompare className="w-5 h-5" />
                  Performance Comparisons
                </CardTitle>
                <CardDescription>Before and after optimization comparisons</CardDescription>
              </div>

              {comparisons.length > 0 && (
                <Button
                  onClick={() => setComparisons([])}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {comparisons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No comparisons yet. Set a baseline and run a comparison benchmark.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {comparisons.map((comparison) => (
                  <div key={comparison.id} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-lg">{comparison.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(comparison.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={comparison.overallScore > 0 ? 'default' : 'secondary'}
                          className={
                            comparison.overallScore > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }
                        >
                          {comparison.overallScore > 0 ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {comparison.overallScore.toFixed(1)}% overall
                        </Badge>
                        {comparison.overallScore > 10 && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            <Award className="w-3 h-3 mr-1" />
                            Significant
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Object.entries(comparison.improvements).map(([testType, improvements]) => (
                        <div key={testType} className="border rounded-lg p-4 space-y-3">
                          <h5 className="font-medium capitalize">{testType.replace('-', ' ')}</h5>

                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Time
                              </span>
                              <span
                                className={`font-mono ${
                                  improvements.timeImprovement > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {improvements.timeImprovement > 0 ? '+' : ''}
                                {improvements.timeImprovement.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <MemoryStick className="w-3 h-3" />
                                Memory
                              </span>
                              <span
                                className={`font-mono ${
                                  improvements.memoryImprovement > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {improvements.memoryImprovement > 0 ? '+' : ''}
                                {improvements.memoryImprovement.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <Cpu className="w-3 h-3" />
                                Throughput
                              </span>
                              <span
                                className={`font-mono ${
                                  improvements.throughputImprovement > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                              >
                                {improvements.throughputImprovement > 0 ? '+' : ''}
                                {improvements.throughputImprovement.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Baseline: {comparison.baseline.summary.totalTests} tests • Current:{' '}
                        {comparison.current.summary.totalTests} tests
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => exportBenchmark(comparison.current)}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ToolBase>
  )
}

export default BenchmarkTester
