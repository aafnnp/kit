import React, { useMemo, useRef, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'motion/react'
import { ToolCard } from '@/components/tool-card'
import { TFunction } from 'i18next'
import { useRoutePrefetch } from '@/lib/route-prefetch'
import type { Tool, ToolCategory } from '@/types/tool'

interface VirtualToolGridProps {
  categories: ToolCategory[]
  showFavoriteButton?: boolean
  onToolClick: (tool: Tool) => void
  t: TFunction
  className?: string
  /**
   * 触发虚拟滚动的工具数量阈值
   * @default 50
   */
  threshold?: number
}

/**
 * 虚拟滚动工具网格组件
 * 当工具数量超过阈值时自动启用虚拟滚动，优化渲染性能
 */
export const VirtualToolGrid: React.FC<VirtualToolGridProps> = ({
  categories,
  showFavoriteButton = true,
  onToolClick,
  t,
  className = '',
  threshold = 50,
}) => {
  const { prefetchOnHover } = useRoutePrefetch()
  const parentRef = useRef<HTMLDivElement>(null)

  // 扁平化所有工具，保留分类信息
  const flatItems = useMemo(() => {
    const items: Array<{ type: 'category' | 'tool'; data: ToolCategory | Tool; categoryId?: string }> = []

    categories.forEach((category) => {
      items.push({ type: 'category', data: category })
      category.tools.forEach((tool) => {
        items.push({ type: 'tool', data: tool, categoryId: category.id })
      })
    })

    return items
  }, [categories])

  const totalTools = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.tools.length, 0)
  }, [categories])

  // 决定是否使用虚拟滚动
  const useVirtual = totalTools > threshold

  // 虚拟滚动器
  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const item = flatItems[index]
      if (item.type === 'category') {
        return 80 // 分类标题高度
      }
      return 120 // 工具卡片高度（包含间距）
    },
    overscan: 5, // 预渲染额外的项目
  })

  // 预取可见区域的工具
  useEffect(() => {
    if (!useVirtual) return

    const visibleRange = virtualizer.getVirtualItems()
    const visibleTools = visibleRange
      .map((virtualItem) => flatItems[virtualItem.index])
      .filter((item) => item.type === 'tool')
      .map((item) => item.data as Tool)
      .map((tool) => tool.slug)

    if (visibleTools.length > 0) {
      const { prefetchVisible } = useRoutePrefetch()
      prefetchVisible(visibleTools)
    }
  }, [virtualizer.getVirtualItems(), useVirtual, flatItems, virtualizer])

  // 渲染分类标题
  const renderCategoryHeader = (category: ToolCategory, index: number) => {
    return (
      <motion.div
        key={`category-${category.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="mb-3 sm:mb-4 px-1 sm:px-0"
      >
        <h2 className="text-xl sm:text-2xl font-semibold text-foreground">{t(`tools.${category.id}`)}</h2>
      </motion.div>
    )
  }

  // 渲染工具网格
  const renderToolGrid = (tools: Tool[]) => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
        {tools.map((tool, toolIndex) => (
          <motion.div
            key={tool.slug + toolIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: toolIndex * 0.05 }}
            onMouseEnter={() => prefetchOnHover(tool.slug)}
          >
            <ToolCard tool={tool} showFavoriteButton={showFavoriteButton} onClick={() => onToolClick(tool)} />
          </motion.div>
        ))}
      </div>
    )
  }

  // 不使用虚拟滚动的情况（工具数量较少）
  if (!useVirtual) {
    return (
      <div className={`space-y-6 sm:space-y-8 ${className}`}>
        {categories.map((category, categoryIndex) => (
          <div key={category.id}>
            {renderCategoryHeader(category, categoryIndex)}
            {renderToolGrid(category.tools)}
          </div>
        ))}
      </div>
    )
  }

  // 使用虚拟滚动的情况
  const virtualItems = virtualizer.getVirtualItems()

  return (
    <div ref={parentRef} className={`h-full overflow-auto ${className}`}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = flatItems[virtualItem.index]
          const isCategory = item.type === 'category'
          const category = isCategory ? (item.data as ToolCategory) : null

          // 收集同一分类下的所有工具
          let categoryTools: Tool[] = []
          if (isCategory && category) {
            const categoryIndex = categories.findIndex((c) => c.id === category.id)
            if (categoryIndex !== -1) {
              categoryTools = categories[categoryIndex].tools
            }
          }

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {isCategory && category ? (
                <>
                  {renderCategoryHeader(
                    category,
                    categories.findIndex((c) => c.id === category.id)
                  )}
                  {renderToolGrid(categoryTools)}
                </>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default VirtualToolGrid
