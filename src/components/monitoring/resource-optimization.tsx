import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { DependencyAnalyzer } from './dependency-analyzer'
import { Icon } from '@/components/ui/icon-compat'
import { resourceOptimizer } from '@/lib/performance'
import { useTranslation } from 'react-i18next'

interface OptimizationStats {
  iconsLoaded: number
  iconsCached: number
  resourcesPreloaded: number
  dependenciesAnalyzed: number
  potentialSavings: string
  optimizationScore: number
}

export function ResourceOptimization() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<OptimizationStats>({
    iconsLoaded: 0,
    iconsCached: 0,
    resourcesPreloaded: 0,
    dependenciesAnalyzed: 0,
    potentialSavings: '0 KB',
    optimizationScore: 0,
  })
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const resourceStats = resourceOptimizer.getStats()
      const totalDeps =
        resourceStats.dependencyAnalysis.heavy +
        resourceStats.dependencyAnalysis.optimizable +
        resourceStats.dependencyAnalysis.light
      setStats({
        iconsLoaded: resourceStats.loadedResources,
        iconsCached: resourceStats.cachedIcons,
        resourcesPreloaded: resourceStats.cachedResources,
        dependenciesAnalyzed: totalDeps,
        potentialSavings: `${resourceStats.dependencyAnalysis.optimizable * 50}KB`,
        optimizationScore: Math.round((resourceStats.cachedIcons / Math.max(resourceStats.loadedResources, 1)) * 100),
      })
    } catch (error) {
      console.error('Failed to load optimization stats:', error)
    }
  }

  const runOptimization = async () => {
    setIsOptimizing(true)
    setOptimizationProgress(0)

    try {
      // 模拟优化过程
      const steps = [
        { name: t('settings.resourceOptimization.preloadIcons'), progress: 20 },
        { name: t('settings.resourceOptimization.analyzeDeps'), progress: 40 },
        { name: t('settings.resourceOptimization.optimizeResources'), progress: 60 },
        { name: t('settings.resourceOptimization.clearCache'), progress: 80 },
        { name: t('settings.resourceOptimization.finishOptimize'), progress: 100 },
      ]

      for (const step of steps) {
        await new Promise((resolve) => setTimeout(resolve, 800))
        setOptimizationProgress(step.progress)
      }

      // 执行实际优化
      resourceOptimizer.preloadIcons(['Home', 'Settings', 'User', 'Search', 'Heart'])
      await resourceOptimizer.lazyLoadResource('/static/js/common.js', 'script').catch(() => {})
      await resourceOptimizer.lazyLoadResource('/static/css/common.css', 'style').catch(() => {})

      await loadStats()
    } catch (error) {
      console.error('Optimization failed:', error)
    } finally {
      setIsOptimizing(false)
      setOptimizationProgress(0)
    }
  }

  const clearCache = async () => {
    try {
      resourceOptimizer.clearCache()
      await loadStats()
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      {/* 优化概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Zap" className="h-5 w-5" />
            {t('settings.resourceOptimization.subTitle')}
          </CardTitle>
          <CardDescription>{t('settings.resourceOptimization.subTitleDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.iconsLoaded}</div>
              <div className="text-sm text-muted-foreground">{t('settings.resourceOptimization.loadedIcons')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.iconsCached}</div>
              <div className="text-sm text-muted-foreground">{t('settings.resourceOptimization.cachedIcons')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.resourcesPreloaded}</div>
              <div className="text-sm text-muted-foreground">{t('settings.resourceOptimization.preloadResources')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.dependenciesAnalyzed}</div>
              <div className="text-sm text-muted-foreground">{t('settings.resourceOptimization.analyzeDeps')}</div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{t('settings.resourceOptimization.optimizeScore')}:</span>
              <Badge variant={getScoreBadgeVariant(stats.optimizationScore)}>
                <span className={getScoreColor(stats.optimizationScore)}>{stats.optimizationScore}%</span>
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('settings.resourceOptimization.potentialSavings')}:{' '}
              <span className="font-medium text-green-600">{stats.potentialSavings}</span>
            </div>
          </div>

          {isOptimizing && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{t('settings.resourceOptimization.optimizeProgress')}</span>
                <span className="text-sm text-muted-foreground">{optimizationProgress}%</span>
              </div>
              <Progress value={optimizationProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={runOptimization} disabled={isOptimizing} className="flex items-center gap-2">
              <Icon name="Play" className="h-4 w-4" />
              {isOptimizing
                ? t('settings.resourceOptimization.optimizing')
                : t('settings.resourceOptimization.startOptimize')}
            </Button>
            <Button variant="outline" onClick={clearCache} className="flex items-center gap-2">
              <Icon name="Trash2" className="h-4 w-4" />
              {t('settings.resourceOptimization.clearCache')}
            </Button>
            <Button variant="outline" onClick={loadStats} className="flex items-center gap-2">
              <Icon name="RefreshCw" className="h-4 w-4" />
              {t('settings.resourceOptimization.refreshStats')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 详细分析 - production 不展示以下内容 */}
      {process.env.NODE_ENV !== 'production' && (
        <Tabs defaultValue="dependencies" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dependencies">{t('settings.resourceOptimization.analyzeDeps')}</TabsTrigger>
            <TabsTrigger value="icons">{t('settings.resourceOptimization.optimizeIcons')}</TabsTrigger>
            <TabsTrigger value="resources">{t('settings.resourceOptimization.optimizeResources')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dependencies" className="space-y-4">
            <DependencyAnalyzer />
          </TabsContent>

          <TabsContent value="icons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.resourceOptimization.optimizeIcons')}</CardTitle>
                <CardDescription>{t('settings.resourceOptimization.optimizeIconsDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Icon name="Package" className="h-4 w-4" />
                        {t('settings.resourceOptimization.iconLibraryUniform')}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('settings.resourceOptimization.iconLibraryUniformDesc')}
                      </p>
                      <Badge variant="outline">{t('settings.resourceOptimization.iconLibraryUniformStatus')}</Badge>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Icon name="Zap" className="h-4 w-4" />
                        {t('settings.resourceOptimization.smartPreload')}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('settings.resourceOptimization.smartPreloadDesc')}
                      </p>
                      <Badge variant="outline">{t('settings.resourceOptimization.smartPreloadStatus')}</Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">{t('settings.resourceOptimization.optimizeEffect')}</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• {t('settings.resourceOptimization.optimizeEffectDesc1')}</li>
                      <li>• {t('settings.resourceOptimization.optimizeEffectDesc2')}</li>
                      <li>• {t('settings.resourceOptimization.optimizeEffectDesc3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.resourceOptimization.resourceManagement')}</CardTitle>
                <CardDescription>{t('settings.resourceOptimization.resourceManagementDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Icon name="Download" className="h-4 w-4" />
                        {t('settings.resourceOptimization.lazyLoad')}
                      </h4>
                      <p className="text-sm text-muted-foreground">{t('settings.resourceOptimization.lazyLoadDesc')}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Icon name="Clock" className="h-4 w-4" />
                        {t('settings.resourceOptimization.smartPreload')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.resourceOptimization.smartPreloadDesc')}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Icon name="Database" className="h-4 w-4" />
                        {t('settings.resourceOptimization.cacheStrategy')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.resourceOptimization.cacheStrategyDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">
                      {t('settings.resourceOptimization.resourceOptimizationStrategy')}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium mb-1">
                          {t('settings.resourceOptimization.lightweightReplacement')}
                        </h5>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• {t('settings.resourceOptimization.lightweightReplacementDesc1')}</li>
                          <li>• {t('settings.resourceOptimization.lightweightReplacementDesc2')}</li>
                          <li>• {t('settings.resourceOptimization.lightweightReplacementDesc3')}</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">{t('settings.resourceOptimization.loadOptimization')}</h5>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• {t('settings.resourceOptimization.loadOptimizationDesc1')}</li>
                          <li>• {t('settings.resourceOptimization.loadOptimizationDesc2')}</li>
                          <li>• {t('settings.resourceOptimization.loadOptimizationDesc3')}</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
