import { createFileRoute } from '@tanstack/react-router'
import tools from '@/lib/data'
import { useTranslation } from 'react-i18next'
import { motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { useState, useMemo, useEffect } from 'react'
import { SearchBar } from '@/components/search-bar'
import { ToolCard } from '@/components/tool-card'
import { useFavorites, useRecentTools, useToolSearch } from '@/lib/favorites'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Heart, Clock, Grid3X3, Trash2, Activity } from 'lucide-react'
import { usePreload, useSmartPreload } from '@/lib/preloader'
import { useResourcePreload } from '@/lib/resource-optimizer'
import { PerformanceMonitor } from '@/components/performance-monitor'

export const Route = createFileRoute('/')({
  component: () => {
    const { t, i18n } = useTranslation()
    const locale = i18n.language.startsWith('en') ? 'en' : 'zh'
    const [activeTab, setActiveTab] = useState('all')

    const { favorites } = useFavorites()
    const { recentTools, clearRecent } = useRecentTools()
    const { searchQuery, setSearchQuery, filteredTools } = useToolSearch(tools)

    // 扁平化所有工具
    const allTools = useMemo(() => tools.flatMap(category => category.tools), [tools])
    
    // 性能优化 hooks
    const { preloadTool, preloadCommonTools } = usePreload()
    const { trackToolUsage } = useSmartPreload()
    
    // 定义预加载资源
    const resources = [
      { path: '/logo.png', type: 'image' as const },
      { path: '/tauri.svg', type: 'image' as const }
    ]
    useResourcePreload(resources)
    
    // 性能优化初始化
    useEffect(() => {
      // 预加载常用工具
      preloadCommonTools()
    }, [])
    
    // 工具交互事件处理
    const handleToolClick = (tool: any) => {
      trackToolUsage(tool.slug)
      preloadTool(tool.slug)
    }
    
    const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false)
    
    // 使用缓存优化工具过滤
    const favoriteTools = useMemo(() => {
      // 从favorites中提取slug数组
      const favoriteSlugs = Array.isArray(favorites) ? 
        favorites.map((tool: any) => typeof tool === 'string' ? tool : tool.slug) : 
        []
      
      // 过滤出收藏的工具
      return allTools.filter(tool => favoriteSlugs.includes(tool.slug))
    }, [allTools, favorites])
    
    const recentToolsData = useMemo(() => {
      // 从recentTools中提取slug数组
      const recentSlugs = Array.isArray(recentTools) ? 
        recentTools.map((tool: any) => typeof tool === 'string' ? tool : tool.slug) : 
        []
      
      // 过滤出最近使用的工具
      return allTools.filter(tool => recentSlugs.includes(tool.slug))
    }, [allTools, recentTools])

    const toggleLanguage = () => {
      const newLang = i18n.language.startsWith('en') ? 'zh' : 'en'
      i18n.changeLanguage(newLang)
    }
    const renderToolGrid = (toolsToRender: any[], showFavoriteButton = true) => {
      if (toolsToRender.length === 0) {
        return (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">
              {activeTab === 'favorites'
                ? t('favorites.empty')
                : activeTab === 'recent'
                  ? t('recent.empty')
                  : t('search.no-results')}
            </div>
            <div className="text-sm text-muted-foreground">
              {activeTab === 'favorites'
                ? t('favorites.add-some')
                : activeTab === 'recent'
                  ? t('recent.start-using')
                  : ''}
            </div>
          </div>
        )
      }

      if (activeTab === 'favorites' || activeTab === 'recent') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {toolsToRender.map((tool, index) => (
              <motion.div
                key={tool.slug}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onMouseEnter={() => preloadTool(tool.slug)}
              >
                <ToolCard tool={tool} showFavoriteButton={showFavoriteButton} onClick={() => handleToolClick(tool)} />
              </motion.div>
            ))}
          </div>
        )
      }

      return (
        <div className="space-y-8">
          {toolsToRender.map((category, categoryIndex) => (
            <motion.div
              key={category.type.zh}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-2xl font-semibold mb-4 text-foreground">{category.type[locale]}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.tools.map((tool: any, toolIndex: number) => (
                  <motion.div
                    key={tool.slug}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: categoryIndex * 0.1 + toolIndex * 0.05 }}
                    onMouseEnter={() => preloadTool(tool.slug)}
                  >
                    <ToolCard
                      tool={tool}
                      showFavoriteButton={showFavoriteButton}
                      onClick={() => handleToolClick(tool)}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('app.title')}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">{t('app.description')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder={t('search.placeholder')} />

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPerformanceMonitor(true)}
                className="shrink-0"
                title="性能监控"
              >
                <Activity className="w-4 h-4" />
              </Button>
              <div className="inline-flex items-center rounded-lg border border-border bg-background p-1">
                <Button
                  variant={locale === 'zh' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => locale !== 'zh' && toggleLanguage()}
                  className="rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                >
                  中文
                </Button>
                <Button
                  variant={locale === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => locale !== 'en' && toggleLanguage()}
                  className="rounded-md px-3 py-1.5 text-sm font-medium transition-all"
                >
                  English
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              {t('app.all-tools', '所有工具')}
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('recent.title')}
              {recentTools.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {recentTools.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              {t('favorites.title')}
              {favorites.length > 0 && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2" disabled={!searchQuery}>
              搜索结果
              {searchQuery && (
                <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                  {filteredTools.reduce((acc, cat) => acc + cat.tools.length, 0)}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">{renderToolGrid(tools)}</TabsContent>

          <TabsContent value="recent">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{t('recent.title')}</h2>
              {recentTools.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearRecent} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  {t('recent.clear')}
                </Button>
              )}
            </div>
            {renderToolGrid(recentToolsData, false)}
          </TabsContent>

          <TabsContent value="favorites">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">{t('favorites.title')}</h2>
            </div>
            {renderToolGrid(favoriteTools, false)}
          </TabsContent>

          <TabsContent value="search">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">搜索结果: "{searchQuery}"</h2>
            </div>
            {renderToolGrid(filteredTools)}
          </TabsContent>
        </Tabs>

        {showPerformanceMonitor && (
          <PerformanceMonitor isOpen={showPerformanceMonitor} onClose={() => setShowPerformanceMonitor(false)} />
        )}
      </div>
    )
  },
})
