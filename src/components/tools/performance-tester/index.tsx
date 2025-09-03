import { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Play,
  Square,
  RotateCcw,
  Download,
  Trash2,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  BarChart3,
  Settings,
  FileText,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import { ToolBase } from '@/components/ui/tool-base'
import { useTranslation } from 'react-i18next'

interface TestResult {
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

interface TestConfig {
  testType: 'image-compress' | 'audio-convert' | 'video-trim' | 'matrix-math'
  iterations: number
  dataSize: 'small' | 'medium' | 'large'
  concurrency: number
  measureMemory: boolean
}

const defaultTestConfigs: Record<string, TestConfig> = {
  'image-compress': {
    testType: 'image-compress',
    iterations: 10,
    dataSize: 'medium',
    concurrency: 4,
    measureMemory: true,
  },
  'audio-convert': {
    testType: 'audio-convert',
    iterations: 5,
    dataSize: 'medium',
    concurrency: 2,
    measureMemory: true,
  },
  'video-trim': {
    testType: 'video-trim',
    iterations: 3,
    dataSize: 'small',
    concurrency: 1,
    measureMemory: true,
  },
  'matrix-math': {
    testType: 'matrix-math',
    iterations: 20,
    dataSize: 'large',
    concurrency: 8,
    measureMemory: true,
  },
}

const PerformanceTester = () => {
  const { t } = useTranslation()
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState<string>('')
  const [testConfig, setTestConfig] = useState<TestConfig>(defaultTestConfigs['image-compress'])
  const abortControllerRef = useRef<AbortController | null>(null)

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

  // 执行Web Worker测试
  const runWorkerTest = useCallback(async (config: TestConfig, testData: any) => {
    const startTime = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0

    const taskId = nanoid()

    // 使用通用处理 Worker 执行实际计算任务
    await new Promise(resolve => {
      const worker = new Worker('/workers/processing-worker.js')

      // 将抽象的测试类型映射为具体的 Worker 任务类型与数据
      let message: any
      if (config.testType === 'matrix-math') {
        const n = (testData?.size as number) || 100
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
        // 对于非矩阵类任务，使用 regex-match 作为通用的计算密集型占位测试
        const repeats = testData?.duration ? Math.max(1, Math.floor((testData.duration as number) / 10)) : 50
        const chunk = 'lorem ipsum dolor sit amet consectetur adipiscing elit '
        const bigText = chunk.repeat(repeats * (config.dataSize === 'large' ? 400 : config.dataSize === 'medium' ? 200 : 100))
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

      // 超时处理
      setTimeout(() => {
        try { worker.terminate() } catch {}
        resolve(null)
      }, 30000)
    })

    const endTime = performance.now()
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0

    return {
      time: endTime - startTime,
      memory: Math.max(0, endMemory - startMemory) / 1024 / 1024, // MB
      throughput: config.iterations / ((endTime - startTime) / 1000), // ops/sec
    }
  }, [])

  // 执行主线程测试
  const runMainThreadTest = useCallback(async (config: TestConfig, testData: any) => {
    const startTime = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0

    // 模拟主线程处理（阻塞式）
    for (let i = 0; i < config.iterations; i++) {
      // 模拟计算密集型任务
      const matrix = Array(testData.size || 100).fill(0).map(() => 
        Array(testData.size || 100).fill(0).map(() => Math.random())
      )
      
      // 简单矩阵乘法
      const result = matrix.map(row => 
        row.map((_, j) => 
          row.reduce((sum, val, k) => sum + val * matrix[k][j], 0)
        )
      )
      
      // 让出控制权，避免完全阻塞UI
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0))
      }
    }

    const endTime = performance.now()
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0

    return {
      time: endTime - startTime,
      memory: Math.max(0, endMemory - startMemory) / 1024 / 1024, // MB
      throughput: config.iterations / ((endTime - startTime) / 1000), // ops/sec
    }
  }, [])

  // 运行性能测试
  const runPerformanceTest = useCallback(async () => {
    if (isRunning) return

    setIsRunning(true)
    setCurrentProgress(0)
    setCurrentTest(testConfig.testType)
    
    abortControllerRef.current = new AbortController()

    try {
      const testData = generateTestData(testConfig.testType, testConfig.dataSize)
      
      // 运行Web Worker测试
      setCurrentProgress(25)
      const workerResult = await runWorkerTest(testConfig, testData)
      
      if (abortControllerRef.current?.signal.aborted) return
      
      // 运行主线程测试
      setCurrentProgress(75)
      const mainThreadResult = await runMainThreadTest(testConfig, testData)
      
      if (abortControllerRef.current?.signal.aborted) return
      
      // 计算性能提升
      const improvement = ((mainThreadResult.time - workerResult.time) / mainThreadResult.time) * 100
      
      const result: TestResult = {
        id: nanoid(),
        testName: `${testConfig.testType} - ${testConfig.dataSize} (${testConfig.iterations} iterations)`,
        testType: testConfig.testType,
        workerTime: workerResult.time,
        mainThreadTime: mainThreadResult.time,
        improvement,
        memoryUsage: {
          worker: workerResult.memory,
          mainThread: mainThreadResult.memory,
        },
        throughput: {
          worker: workerResult.throughput,
          mainThread: mainThreadResult.throughput,
        },
        timestamp: Date.now(),
        status: 'completed',
      }
      
      setResults(prev => [result, ...prev])
      setCurrentProgress(100)
      
      toast.success(`Performance test completed! ${improvement > 0 ? `${improvement.toFixed(1)}% improvement` : 'No improvement'} with Web Workers`)
      
    } catch (error) {
      const failedResult: TestResult = {
        id: nanoid(),
        testName: `${testConfig.testType} - ${testConfig.dataSize} (Failed)`,
        testType: testConfig.testType,
        workerTime: 0,
        mainThreadTime: 0,
        improvement: 0,
        memoryUsage: { worker: 0, mainThread: 0 },
        throughput: { worker: 0, mainThread: 0 },
        timestamp: Date.now(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      
      setResults(prev => [failedResult, ...prev])
      toast.error(`Performance test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsRunning(false)
      setCurrentProgress(0)
      setCurrentTest('')
    }
  }, [testConfig, isRunning, generateTestData, runWorkerTest, runMainThreadTest])

  // 停止测试
  const stopTest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsRunning(false)
    setCurrentProgress(0)
    setCurrentTest('')
  }, [])

  // 清除结果
  const clearResults = useCallback(() => {
    setResults([])
  }, [])

  // 导出结果
  const exportResults = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalTests: results.length,
        successfulTests: results.filter(r => r.status === 'completed').length,
        averageImprovement: results
          .filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + r.improvement, 0) / results.filter(r => r.status === 'completed').length || 0,
      },
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-test-results-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [results])

  // 计算统计数据
  const stats = {
    totalTests: results.length,
    successfulTests: results.filter(r => r.status === 'completed').length,
    failedTests: results.filter(r => r.status === 'failed').length,
    averageImprovement: results
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + r.improvement, 0) / results.filter(r => r.status === 'completed').length || 0,
    bestImprovement: Math.max(...results.filter(r => r.status === 'completed').map(r => r.improvement), 0),
  }

  return (
    <ToolBase
      toolName="Performance Tester"
      icon={<Activity className="w-5 h-5" />}
      description="Test and compare Web Worker performance optimizations"
    >
      <div className="space-y-6">
        {/* 测试配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure performance test parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-type">Test Type</Label>
                <Select
                  value={testConfig.testType}
                  onValueChange={(value: any) => setTestConfig(prev => ({ ...prev, testType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image-compress">Image Compression</SelectItem>
                    <SelectItem value="audio-convert">Audio Conversion</SelectItem>
                    <SelectItem value="video-trim">Video Trimming</SelectItem>
                    <SelectItem value="matrix-math">Matrix Math</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data-size">Data Size</Label>
                <Select
                  value={testConfig.dataSize}
                  onValueChange={(value: any) => setTestConfig(prev => ({ ...prev, dataSize: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="iterations">Iterations</Label>
                <Input
                  id="iterations"
                  type="number"
                  min="1"
                  max="100"
                  value={testConfig.iterations}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, iterations: parseInt(e.target.value) || 1 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="concurrency">Concurrency</Label>
                <Input
                  id="concurrency"
                  type="number"
                  min="1"
                  max="16"
                  value={testConfig.concurrency}
                  onChange={(e) => setTestConfig(prev => ({ ...prev, concurrency: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  onClick={runPerformanceTest}
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {isRunning ? 'Running Test...' : 'Run Performance Test'}
                </Button>
                
                {isRunning && (
                  <Button
                    onClick={stopTest}
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop Test
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setTestConfig(defaultTestConfigs[testConfig.testType])}
                  variant="outline"
                  size="sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>
            
            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Testing: {currentTest}</span>
                  <span>{currentProgress}%</span>
                </div>
                <Progress value={currentProgress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 统计概览 */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tests</p>
                    <p className="text-2xl font-bold">{stats.totalTests}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successfulTests}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failedTests}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Improvement</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.averageImprovement.toFixed(1)}%
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Best Result</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.bestImprovement.toFixed(1)}%
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 测试结果 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Test Results
                </CardTitle>
                <CardDescription>
                  Performance comparison between Web Workers and main thread
                </CardDescription>
              </div>
              
              {results.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={exportResults}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                  <Button
                    onClick={clearResults}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {results.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No test results yet. Run a performance test to see results.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{result.testName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(result.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={result.status === 'completed' ? 'default' : 'destructive'}
                        >
                          {result.status}
                        </Badge>
                        {result.status === 'completed' && (
                          <Badge
                            variant={result.improvement > 0 ? 'default' : 'secondary'}
                            className={result.improvement > 0 ? 'bg-green-100 text-green-800' : ''}
                          >
                            {result.improvement > 0 ? '+' : ''}{result.improvement.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {result.status === 'completed' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="space-y-2">
                          <h5 className="font-medium flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Execution Time
                          </h5>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Web Worker:</span>
                              <span className="font-mono">{result.workerTime.toFixed(2)}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Main Thread:</span>
                              <span className="font-mono">{result.mainThreadTime.toFixed(2)}ms</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Memory Usage
                          </h5>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Web Worker:</span>
                              <span className="font-mono">{result.memoryUsage.worker.toFixed(2)}MB</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Main Thread:</span>
                              <span className="font-mono">{result.memoryUsage.mainThread.toFixed(2)}MB</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h5 className="font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Throughput
                          </h5>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Web Worker:</span>
                              <span className="font-mono">{result.throughput.worker.toFixed(2)} ops/s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Main Thread:</span>
                              <span className="font-mono">{result.throughput.mainThread.toFixed(2)} ops/s</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-600 text-sm">
                        <AlertTriangle className="w-4 h-4 inline mr-2" />
                        {result.error || 'Test failed'}
                      </div>
                    )}
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

export default PerformanceTester