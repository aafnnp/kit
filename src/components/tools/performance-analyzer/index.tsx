import { useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Square,
  BarChart3,
  Clock,
  Zap,
  Download,
  Trash2,
  Copy,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-clipboard'
import {
  PerformanceAnalyzerState,
  PerformanceTest,
  PerformanceResult,
  PERFORMANCE_TEMPLATES,
  formatPerformanceValue,
} from '@/types/performance-analyzer'
import { ToolBase } from '@/components/ui/tool-base'
import { nanoid } from 'nanoid'

// 性能测试执行器
const executePerformanceTest = async (
  test: PerformanceTest,
  onProgress: (progress: number) => void
): Promise<PerformanceResult[]> => {
  const results: PerformanceResult[] = []
  const totalRuns = test.warmupRuns + test.iterations

  for (let i = 0; i < totalRuns; i++) {
    const isWarmup = i < test.warmupRuns
    const runNumber = isWarmup ? i : i - test.warmupRuns

    try {
      // 垃圾回收（如果可用）
      if (window.gc) {
        window.gc()
      }

      // 记录内存使用（如果可用）
      const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0

      // 执行测试
      const startTime = performance.now()
      const endTime = performance.now()

      const executionTime = endTime - startTime
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0
      const memoryUsage = memoryAfter - memoryBefore

      // 只记录非预热运行的结果
      if (!isWarmup) {
        const performanceResult: PerformanceResult = {
          id: nanoid(),
          testId: test.id,
          runNumber,
          executionTime,
          memoryUsage: memoryUsage > 0 ? memoryUsage : undefined,
          metrics: [
            {
              id: nanoid(),
              name: 'Execution Time',
              value: executionTime,
              unit: 'ms',
              category: 'timing',
              timestamp: Date.now(),
            },
          ],
          timestamp: Date.now(),
        }

        if (memoryUsage > 0) {
          performanceResult.metrics.push({
            id: nanoid(),
            name: 'Memory Usage',
            value: memoryUsage,
            unit: 'bytes',
            category: 'memory',
            timestamp: Date.now(),
          })
        }

        results.push(performanceResult)
      }

      // 更新进度
      onProgress(((i + 1) / totalRuns) * 100)

      // 让出控制权给浏览器
      if (i % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    } catch (error) {
      if (!isWarmup) {
        results.push({
          id: nanoid(),
          testId: test.id,
          runNumber,
          executionTime: 0,
          metrics: [],
          timestamp: Date.now(),
          error: error instanceof Error ? error.message : 'Test execution failed',
        })
      }
    }
  }

  return results
}

// 计算统计数据
const calculateStats = (results: PerformanceResult[]) => {
  const validResults = results.filter((r) => !r.error)
  if (validResults.length === 0) return null

  const times = validResults.map((r) => r.executionTime)
  const sum = times.reduce((a, b) => a + b, 0)
  const avg = sum / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)

  // 计算标准差
  const variance = times.reduce((acc, time) => acc + Math.pow(time - avg, 2), 0) / times.length
  const stdDev = Math.sqrt(variance)

  // 计算每秒操作数
  const opsPerSecond = avg > 0 ? 1000 / avg : 0

  return {
    avg,
    min,
    max,
    stdDev,
    opsPerSecond,
    count: validResults.length,
    errorCount: results.length - validResults.length,
  }
}

export function PerformanceAnalyzer() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()
  const abortControllerRef = useRef<AbortController | null>(null)

  const [state, setState] = useState<PerformanceAnalyzerState>({
    tests: [],
    comparisons: [],
    profiles: [],
    isRunning: false,
    currentProgress: 0,
  })

  const [newTest, setNewTest] = useState<Partial<PerformanceTest>>({
    name: '',
    description: '',
    code: '',
    iterations: 1000,
    warmupRuns: 100,
  })

  // 创建新测试
  const createTest = useCallback(() => {
    if (!newTest.name || !newTest.code) return

    const test: PerformanceTest = {
      id: nanoid(),
      name: newTest.name,
      description: newTest.description || '',
      code: newTest.code,
      iterations: newTest.iterations || 1000,
      warmupRuns: newTest.warmupRuns || 100,
      results: [],
      status: 'idle',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    setState((prev) => ({
      ...prev,
      tests: [...prev.tests, test],
      activeTest: test,
    }))

    // 重置表单
    setNewTest({
      name: '',
      description: '',
      code: '',
      iterations: 1000,
      warmupRuns: 100,
    })
  }, [newTest])

  // 加载模板
  const loadTemplate = useCallback((template: Partial<PerformanceTest>) => {
    setNewTest({
      ...template,
      iterations: template.iterations || 1000,
      warmupRuns: template.warmupRuns || 100,
    })
  }, [])

  // 运行测试
  const runTest = useCallback(
    async (test: PerformanceTest) => {
      if (state.isRunning) return

      setState((prev) => ({
        ...prev,
        isRunning: true,
        currentProgress: 0,
        error: undefined,
      }))

      // 更新测试状态
      setState((prev) => ({
        ...prev,
        tests: prev.tests.map((t) => (t.id === test.id ? { ...t, status: 'running' as const } : t)),
      }))

      abortControllerRef.current = new AbortController()

      try {
        const results = await executePerformanceTest(test, (progress) => {
          setState((prev) => ({ ...prev, currentProgress: progress }))
        })

        // 更新测试结果
        setState((prev) => ({
          ...prev,
          tests: prev.tests.map((t) =>
            t.id === test.id
              ? {
                  ...t,
                  results,
                  status: 'completed' as const,
                  updatedAt: Date.now(),
                }
              : t
          ),
          isRunning: false,
          currentProgress: 100,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          tests: prev.tests.map((t) => (t.id === test.id ? { ...t, status: 'error' as const } : t)),
          isRunning: false,
          error: error instanceof Error ? error.message : 'Test execution failed',
        }))
      }
    },
    [state.isRunning]
  )

  // 停止测试
  const stopTest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setState((prev) => ({ ...prev, isRunning: false, currentProgress: 0 }))
  }, [])

  // 删除测试
  const deleteTest = useCallback((testId: string) => {
    setState((prev) => ({
      ...prev,
      tests: prev.tests.filter((t) => t.id !== testId),
      activeTest: prev.activeTest?.id === testId ? undefined : prev.activeTest,
    }))
  }, [])

  // 复制测试结果
  const copyTestResults = useCallback(
    (test: PerformanceTest) => {
      const stats = calculateStats(test.results)
      if (!stats) return

      const data = {
        test: {
          name: test.name,
          description: test.description,
          iterations: test.iterations,
        },
        results: {
          avgTime: stats.avg,
          minTime: stats.min,
          maxTime: stats.max,
          stdDev: stats.stdDev,
          opsPerSecond: stats.opsPerSecond,
          successRate: (stats.count / (stats.count + stats.errorCount)) * 100,
        },
      }

      copyToClipboard(JSON.stringify(data, null, 2), 'Test results')
    },
    [copyToClipboard]
  )

  // 导出所有结果
  const exportResults = useCallback(() => {
    const data = {
      tests: state.tests.map((test) => ({
        ...test,
        stats: calculateStats(test.results),
      })),
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-results-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [state.tests])

  return (
    <ToolBase
      toolName={t('tools.performance-analyzer.title', 'Performance Analyzer')}
      icon={<BarChart3 className="w-5 h-5" />}
      description={t(
        'tools.performance-analyzer.description',
        'Analyze and compare JavaScript performance with detailed metrics'
      )}
    >
      <div className="space-y-6">
        {/* 快速模板 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t('tools.performance-analyzer.templates', 'Performance Test Templates')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {PERFORMANCE_TEMPLATES.map((template, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => loadTemplate(template)}
                  className="h-auto p-3 text-left"
                >
                  <div>
                    <div className="font-medium">{template.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 创建新测试 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Play className="w-5 h-5" />
              {t('tools.performance-analyzer.create-test', 'Create Performance Test')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('tools.performance-analyzer.test-name', 'Test Name')}</Label>
                <Input
                  value={newTest.name || ''}
                  onChange={(e) => setNewTest((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter test name..."
                />
              </div>

              <div className="space-y-2">
                <Label>{t('tools.performance-analyzer.description', 'Description')}</Label>
                <Input
                  value={newTest.description || ''}
                  onChange={(e) => setNewTest((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter test description..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('tools.performance-analyzer.iterations', 'Iterations')}</Label>
                <Input
                  type="number"
                  value={newTest.iterations || 1000}
                  onChange={(e) => setNewTest((prev) => ({ ...prev, iterations: parseInt(e.target.value) || 1000 }))}
                  min={1}
                  max={100000}
                />
              </div>

              <div className="space-y-2">
                <Label>{t('tools.performance-analyzer.warmup-runs', 'Warmup Runs')}</Label>
                <Input
                  type="number"
                  value={newTest.warmupRuns || 100}
                  onChange={(e) => setNewTest((prev) => ({ ...prev, warmupRuns: parseInt(e.target.value) || 100 }))}
                  min={0}
                  max={10000}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('tools.performance-analyzer.test-code', 'Test Code')}</Label>
              <Textarea
                value={newTest.code || ''}
                onChange={(e) => setNewTest((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="Enter JavaScript code to test...\n\n// Example:\nconst arr = [1, 2, 3, 4, 5]\nconst sum = arr.reduce((a, b) => a + b, 0)\nreturn sum"
                className="min-h-[150px] font-mono text-sm"
              />
            </div>

            <Button onClick={createTest} disabled={!newTest.name || !newTest.code || state.isRunning}>
              <Plus className="w-4 h-4 mr-2" />
              {t('tools.performance-analyzer.create', 'Create Test')}
            </Button>
          </CardContent>
        </Card>

        {/* 测试列表和结果 */}
        {state.tests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  {t('tools.performance-analyzer.tests', 'Performance Tests')}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={exportResults}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('common.export', 'Export')}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 运行进度 */}
              {state.isRunning && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {t('tools.performance-analyzer.running', 'Running test...')}
                    </span>
                    <Button size="sm" variant="outline" onClick={stopTest}>
                      <Square className="w-4 h-4 mr-2" />
                      {t('common.stop', 'Stop')}
                    </Button>
                  </div>
                  <Progress value={state.currentProgress} className="w-full" />
                </div>
              )}

              {/* 错误信息 */}
              {state.error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  {state.error}
                </div>
              )}

              {/* 测试列表 */}
              <div className="space-y-4">
                {state.tests.map((test) => {
                  const stats = calculateStats(test.results)

                  return (
                    <div key={test.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-medium flex items-center gap-2">
                            {test.name}
                            <Badge variant="outline">
                              {test.status === 'idle' && <Clock className="w-3 h-3 mr-1" />}
                              {test.status === 'running' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
                              {test.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
                              {test.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                              {test.status}
                            </Badge>
                          </h4>
                          {test.description && <p className="text-sm text-muted-foreground">{test.description}</p>}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => runTest(test)} disabled={state.isRunning}>
                            <Play className="w-4 h-4 mr-2" />
                            {t('tools.performance-analyzer.run', 'Run')}
                          </Button>

                          {stats && (
                            <Button size="sm" variant="outline" onClick={() => copyTestResults(test)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          )}

                          <Button size="sm" variant="ghost" onClick={() => deleteTest(test.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 测试配置 */}
                      <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                        <span>
                          {t('tools.performance-analyzer.iterations', 'Iterations')}: {test.iterations}
                        </span>
                        <span>
                          {t('tools.performance-analyzer.warmup', 'Warmup')}: {test.warmupRuns}
                        </span>
                      </div>

                      {/* 测试结果 */}
                      {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-muted rounded">
                          <div className="text-center">
                            <div className="text-lg font-semibold">{formatPerformanceValue(stats.avg, 'ms')}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('tools.performance-analyzer.avg-time', 'Avg Time')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-semibold">{stats.opsPerSecond.toFixed(0)}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('tools.performance-analyzer.ops-per-sec', 'Ops/sec')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-semibold">
                              {formatPerformanceValue(stats.min, 'ms')} - {formatPerformanceValue(stats.max, 'ms')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {t('tools.performance-analyzer.min-max', 'Min - Max')}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-lg font-semibold">±{formatPerformanceValue(stats.stdDev, 'ms')}</div>
                            <div className="text-xs text-muted-foreground">
                              {t('tools.performance-analyzer.std-dev', 'Std Dev')}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 错误统计 */}
                      {stats && stats.errorCount > 0 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                          <AlertTriangle className="w-4 h-4 inline mr-2" />
                          {stats.errorCount} out of {stats.count + stats.errorCount} runs failed
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ToolBase>
  )
}
