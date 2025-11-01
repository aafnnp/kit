/**
 * 依赖分析器组件 - 分析和优化项目依赖
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
// Alert组件暂不可用，使用Card替代
import { resourceOptimizer } from '@/lib/performance'
import { Icon } from '@/components/ui/icon-compat'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'

interface DependencyAnalysis {
  heavy: string[]
  optimizable: string[]
  light: string[]
  recommendations: string[]
}

interface OptimizationStats {
  totalDependencies: number
  heavyDependencies: number
  optimizableDependencies: number
  lightDependencies: number
  potentialSavings: string
}

export function DependencyAnalyzer() {
  const [analysis, setAnalysis] = useState<DependencyAnalysis | null>(null)
  const [stats, setStats] = useState<OptimizationStats | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'heavy' | 'optimizable' | 'light'>('heavy')
  const [auditTotals, setAuditTotals] = useState<{
    low: number
    moderate: number
    high: number
    critical: number
    total: number
  } | null>(null)
  const [auditIssuesByPkg, setAuditIssuesByPkg] = useState<
    Record<string, { highestSeverity: 'low' | 'moderate' | 'high' | 'critical'; count: number; titles: string[] }>
  >({})
  const [generatedScript, setGeneratedScript] = useState<string>('')

  useEffect(() => {
    performAnalysis()
  }, [])

  const performAnalysis = async () => {
    console.log('performAnalysis')
    setIsAnalyzing(true)
    try {
      // 模拟分析过程
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const analysisResult = resourceOptimizer.analyzeDependencies()
      console.log('analysisResult', analysisResult)
      setAnalysis(analysisResult)

      // 计算统计信息
      const totalDeps = analysisResult.heavy.length + analysisResult.optimizable.length + analysisResult.light.length
      const heavyCount = analysisResult.heavy.length
      const optimizableCount = analysisResult.optimizable.length
      const lightCount = analysisResult.light.length

      // 估算潜在节省空间
      const potentialSavings = calculatePotentialSavings(analysisResult)

      setStats({
        totalDependencies: totalDeps,
        heavyDependencies: heavyCount,
        optimizableDependencies: optimizableCount,
        lightDependencies: lightCount,
        potentialSavings,
      })

      toast.success('依赖分析完成')
    } catch (error) {
      toast.error('分析失败')
      console.error('Dependency analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const calculatePotentialSavings = (analysis: DependencyAnalysis): string => {
    // 简单的节省空间估算
    const heavySavings = analysis.heavy.length * 500 // 平均每个重量级依赖可节省500KB
    const optimizableSavings = analysis.optimizable.length * 100 // 平均每个可优化依赖可节省100KB
    const totalSavings = heavySavings + optimizableSavings

    if (totalSavings > 1000) {
      return `~${(totalSavings / 1000).toFixed(1)}MB`
    }
    return `~${totalSavings}KB`
  }

  const getDependencyList = () => {
    if (!analysis) return []
    return analysis[selectedCategory] || []
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'heavy':
        return 'destructive'
      case 'optimizable':
        return 'secondary'
      case 'light':
        return 'default'
      default:
        return 'default'
    }
  }

  const handleAuditUpload = async (file: File | null) => {
    if (!file) return
    try {
      const text = await file.text()
      const json = JSON.parse(text)
      const { issuesByPackage, totals } = resourceOptimizer.analyzeNpmAudit(json)
      setAuditIssuesByPkg(issuesByPackage)
      setAuditTotals(totals)
      toast.success('安全审计数据已导入')
    } catch (e) {
      toast.error('解析审计文件失败，请确认为 npm audit --json 输出')
    }
  }

  const severityOrder: Array<'low' | 'moderate' | 'high' | 'critical'> = ['low', 'moderate', 'high', 'critical']

  const buildReplacementPlan = () => {
    if (!analysis) return [] as Array<{ from: string; to: string; reason: string; severity?: string }>
    return resourceOptimizer
      .generateReplacementPlan({ heavy: analysis.heavy, optimizable: analysis.optimizable }, auditIssuesByPkg)
      .sort((a, b) => {
        const ai = a.severity ? severityOrder.indexOf(a.severity as any) : -1
        const bi = b.severity ? severityOrder.indexOf(b.severity as any) : -1
        return bi - ai // critical 优先
      })
  }

  const generateAndStoreScript = () => {
    const plan = buildReplacementPlan().map((p) => ({ from: p.from, to: p.to }))
    if (plan.length === 0) {
      toast.info('暂无可生成的替换计划')
      return
    }
    const script = resourceOptimizer.generateReplacementScript(plan, 'npm')
    setGeneratedScript(script)
    // 触发下载
    const blob = new Blob([script], { type: 'text/x-sh' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'apply-deps-replacements.sh'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('替换脚本已生成并下载')
  }

  const exportPlanJson = () => {
    const plan = buildReplacementPlan().map((p) => ({ from: p.from, to: p.to, reason: p.reason, severity: p.severity }))
    if (plan.length === 0) {
      toast.info('暂无可导出的替换计划')
      return
    }
    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'deps-plan.json'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    toast.success('替换计划 JSON 已导出')
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'heavy':
        return 'AlertTriangle'
      case 'optimizable':
        return 'Zap'
      case 'light':
        return 'Check'
      default:
        return 'Package'
    }
  }

  if (!analysis || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Package" className="h-5 w-5" />
            依赖分析器
          </CardTitle>
          <CardDescription>分析项目依赖并提供优化建议</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <Icon name="Loader2" className="h-4 w-4 animate-spin" />
                正在分析依赖...
              </div>
            ) : (
              <Button onClick={performAnalysis}>
                <Icon name="Play" className="h-4 w-4 mr-2" />
                开始分析
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计概览 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总依赖数</p>
                <p className="text-2xl font-bold">{stats.totalDependencies}</p>
              </div>
              <Icon name="Package" className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">重量级依赖</p>
                <p className="text-2xl font-bold text-red-600">{stats.heavyDependencies}</p>
              </div>
              <Icon name="AlertTriangle" className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">可优化依赖</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.optimizableDependencies}</p>
              </div>
              <Icon name="Zap" className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">潜在节省</p>
                <p className="text-2xl font-bold text-green-600">{stats.potentialSavings}</p>
              </div>
              <Icon name="TrendingDown" className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 详细分析 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>依赖详情</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={performAnalysis}>
                <Icon name="RefreshCw" className="h-4 w-4 mr-2" />
                重新分析
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="heavy" className="flex items-center gap-2">
                <Icon name="AlertTriangle" className="h-4 w-4" />
                重量级 ({stats.heavyDependencies})
              </TabsTrigger>
              <TabsTrigger value="optimizable" className="flex items-center gap-2">
                <Icon name="Zap" className="h-4 w-4" />
                可优化 ({stats.optimizableDependencies})
              </TabsTrigger>
              <TabsTrigger value="light" className="flex items-center gap-2">
                <Icon name="Check" className="h-4 w-4" />
                轻量级 ({stats.lightDependencies})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-4">
              <div className="space-y-2">
                {getDependencyList().map((dep, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name={getCategoryIcon(selectedCategory)} className="h-4 w-4" />
                      <span className="font-medium">{dep}</span>
                    </div>
                    <Badge variant={getCategoryColor(selectedCategory) as any}>{selectedCategory}</Badge>
                  </div>
                ))}

                {getDependencyList().length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon name="Package" className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>此类别下暂无依赖</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* 安全审计 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="ShieldAlert" className="h-5 w-5" />
            依赖安全扫描
          </CardTitle>
          <CardDescription>导入 npm audit --json 输出以显示漏洞统计并优先替换高风险依赖</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept="application/json,.json"
                onChange={(e) => handleAuditUpload(e.target.files?.[0] || null)}
              />
            </div>
            {auditTotals && (
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge variant="default">总计 {auditTotals.total}</Badge>
                <Badge variant="secondary">Low {auditTotals.low}</Badge>
                <Badge variant="secondary">Moderate {auditTotals.moderate}</Badge>
                <Badge variant="destructive">High {auditTotals.high}</Badge>
                <Badge variant="destructive">Critical {auditTotals.critical}</Badge>
              </div>
            )}
          </div>

          {/* 高风险包列表（Top 10） */}
          {auditTotals && (
            <div className="mt-4 space-y-2">
              <div className="text-sm text-muted-foreground">高风险包（按严重程度排序，最多显示10项）</div>
              {Object.entries(auditIssuesByPkg)
                .sort(
                  (a, b) => severityOrder.indexOf(b[1].highestSeverity) - severityOrder.indexOf(a[1].highestSeverity)
                )
                .slice(0, 10)
                .map(([pkg, info]) => (
                  <div key={pkg} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon name="AlertTriangle" className="h-4 w-4" />
                      <span className="font-medium">{pkg}</span>
                      <span className="text-xs text-muted-foreground">{info.titles?.[0] || ''}</span>
                    </div>
                    <Badge
                      variant={
                        info.highestSeverity === 'low'
                          ? 'default'
                          : info.highestSeverity === 'moderate'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {info.highestSeverity} × {info.count}
                    </Badge>
                  </div>
                ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={generateAndStoreScript} disabled={!analysis}>
              <Icon name="Replace" className="h-4 w-4 mr-2" />
              基于审计生成替换脚本
            </Button>
            <Button variant="outline" onClick={exportPlanJson} disabled={!analysis}>
              <Icon name="Download" className="h-4 w-4 mr-2" />
              导出替换计划 JSON
            </Button>
            {generatedScript && (
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedScript).then(
                    () => toast.success('脚本内容已复制到剪贴板'),
                    () => toast.error('复制失败')
                  )
                }}
              >
                <Icon name="Clipboard" className="h-4 w-4 mr-2" />
                复制脚本
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => {
                const cmd = 'npm run deps:apply'
                navigator.clipboard.writeText(cmd).then(
                  () => toast.success('已复制命令：npm run deps:apply'),
                  () => toast.error('复制失败')
                )
              }}
            >
              <Icon name="Terminal" className="h-4 w-4 mr-2" />
              复制应用命令
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const cmd = 'npm run deps:pr'
                navigator.clipboard.writeText(cmd).then(
                  () => toast.success('已复制命令：npm run deps:pr'),
                  () => toast.error('复制失败')
                )
              }}
            >
              <Icon name="GitPullRequest" className="h-4 w-4 mr-2" />
              复制创建 PR 命令
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 优化建议 */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Lightbulb" className="h-5 w-5" />
              优化建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20"
                >
                  <Icon name="Info" className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-800 dark:text-blue-200">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 优化进度 */}
      <Card>
        <CardHeader>
          <CardTitle>优化进度</CardTitle>
          <CardDescription>基于轻量级依赖占比计算的优化程度</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>优化程度</span>
              <span>{Math.round((stats.lightDependencies / stats.totalDependencies) * 100)}%</span>
            </div>
            <Progress value={(stats.lightDependencies / stats.totalDependencies) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {stats.lightDependencies} / {stats.totalDependencies} 个依赖已优化
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
