import { useMemo, useCallback, forwardRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { motion } from 'motion/react'
import { ToolCard } from '@/components/tool-card'
import { TFunction } from 'i18next'

interface Tool {
  slug: string
  name: string
  icon: string
  href?: string
  desc: string
}

interface Category {
  id: string
  tools: Tool[]
}

interface VirtualToolGridProps {
  categories: Category[]
  showFavoriteButton?: boolean
  onToolClick: (tool: Tool) => void
  t: TFunction
  className?: string
  // 虚拟列表配置
  itemHeight?: number
  overscan?: number
  // 移动端优化
  isMobile?: boolean
  // 性能优化
  enableVirtualization?: boolean
  minItemsForVirtualization?: number
}

interface VirtualItem {
  type: 'category' | 'tool'
  category?: Category
  tool?: Tool
  categoryIndex?: number
  toolIndex?: number
}

export const VirtualToolGrid = forwardRef<HTMLDivElement, VirtualToolGridProps>(
  (
    {
      categories,
      showFavoriteButton = true,
      onToolClick,
      t,
      className = '',
      itemHeight = 200,
      overscan = 5,
      isMobile = false,
      enableVirtualization = true,
      minItemsForVirtualization = 20,
    },
    ref
  ) => {
    // 将分类和工具扁平化为虚拟列表项
    const virtualItems = useMemo((): VirtualItem[] => {
      const items: VirtualItem[] = []

      categories.forEach((category, categoryIndex) => {
        // 添加分类标题项
        items.push({
          type: 'category',
          category,
          categoryIndex,
        })

        // 添加该分类下的所有工具
        category.tools.forEach((tool, toolIndex) => {
          items.push({
            type: 'tool',
            tool,
            categoryIndex,
            toolIndex,
          })
        })
      })

      return items
    }, [categories])

    // 计算总项目数
    const totalItems = virtualItems.length

    // 决定是否启用虚拟化
    const shouldVirtualize = enableVirtualization && totalItems >= minItemsForVirtualization

    // 虚拟化器配置
    const virtualizer = useVirtualizer({
      count: totalItems,
      getScrollElement: () => (typeof ref === 'function' ? null : ref?.current) || null,
      estimateSize: useCallback(
        (index: number) => {
          const item = virtualItems[index]
          if (item.type === 'category') {
            return isMobile ? 60 : 80 // 分类标题高度
          }
          return itemHeight // 工具卡片高度
        },
        [virtualItems, itemHeight, isMobile]
      ),
      overscan,
    })

    // 渲染单个虚拟项
    const renderVirtualItem = useCallback(
      (virtualItem: VirtualItem, index: number) => {
        if (virtualItem.type === 'category') {
          return (
            <motion.h2
              key={`category-${virtualItem.categoryIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground px-1 sm:px-0 sticky top-0 bg-background/95 backdrop-blur-sm z-10 py-2"
            >
              {t(`tools.${virtualItem.category!.id}`)}
            </motion.h2>
          )
        }

        if (virtualItem.type === 'tool') {
          return (
            <motion.div
              key={`tool-${virtualItem.tool!.slug}-${virtualItem.toolIndex}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: virtualItem.categoryIndex! * 0.1 + virtualItem.toolIndex! * 0.05,
              }}
              className="h-full"
            >
              <ToolCard
                tool={virtualItem.tool!}
                showFavoriteButton={showFavoriteButton}
                onClick={() => onToolClick(virtualItem.tool!)}
              />
            </motion.div>
          )
        }

        return null
      },
      [t, showFavoriteButton, onToolClick]
    )

    // 如果不启用虚拟化，使用传统网格布局
    if (!shouldVirtualize) {
      return (
        <div className={`space-y-6 sm:space-y-8 ${className}`}>
          {categories.map((category, categoryIndex) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: categoryIndex * 0.1 }}
            >
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-foreground px-1 sm:px-0">
                {t(`tools.${category.id}`)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 grid-mobile-1 sm:grid-mobile-2 md:grid-tablet-3 lg:grid-desktop-4 xl:grid-desktop-5 2xl:grid-ultrawide-6">
                {category.tools.map((tool, toolIndex) => (
                  <motion.div
                    key={tool.slug + toolIndex}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: 0.3,
                      delay: categoryIndex * 0.1 + toolIndex * 0.05,
                    }}
                  >
                    <ToolCard tool={tool} showFavoriteButton={showFavoriteButton} onClick={() => onToolClick(tool)} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )
    }

    // 虚拟化渲染
    return (
      <div
        ref={ref}
        className={`h-full overflow-auto ${className}`}
        style={{
          height: '600px', // 设置固定高度以启用滚动
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const item = virtualItems[virtualItem.index]
            const isCategory = item.type === 'category'

            return (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className={isCategory ? 'px-1 sm:px-0' : 'p-1'}
              >
                {isCategory ? (
                  renderVirtualItem(item, virtualItem.index)
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 h-full">
                    {renderVirtualItem(item, virtualItem.index)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)

VirtualToolGrid.displayName = 'VirtualToolGrid'
