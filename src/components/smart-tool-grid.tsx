import React, { useCallback } from 'react'
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

interface SmartToolGridProps {
  categories: Category[]
  showFavoriteButton?: boolean
  onToolClick: (tool: Tool) => void
  t: TFunction
  className?: string
}

export const SmartToolGrid: React.FC<SmartToolGridProps> = ({
  categories,
  showFavoriteButton = true,
  onToolClick,
  t,
  className = '',
}) => {
  // 渲染传统网格（用于少量工具）
  const renderTraditionalGrid = useCallback(() => {
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
  }, [categories, t, showFavoriteButton, onToolClick, className])

  return renderTraditionalGrid()
}

export default SmartToolGrid
