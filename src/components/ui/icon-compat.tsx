/**
 * 图标兼容性组件 - 统一图标接口，支持从@tabler/icons-react迁移到lucide-react
 */

import React from 'react'
import { resourceOptimizer } from '@/lib/resource-optimizer'

interface IconProps {
  name: string
  size?: number | string
  className?: string
  style?: React.CSSProperties
  [key: string]: any
}

/**
 * 统一图标组件
 * 自动处理@tabler/icons-react到lucide-react的映射
 */
export function Icon({ name, size = 16, className = '', style, ...props }: IconProps) {
  const IconComponent = resourceOptimizer.getIcon(name)

  return <IconComponent size={size} className={className} style={style} {...props} />
}

/**
 * 图标预加载Hook
 */
export function useIconPreload(iconNames: string[]) {
  React.useEffect(() => {
    resourceOptimizer.preloadIcons(iconNames)
  }, [iconNames])
}

/**
 * 批量图标组件
 */
export function IconBatch({ icons, ...commonProps }: { icons: string[]; size?: number | string; className?: string }) {
  // 预加载所有图标
  useIconPreload(icons)

  return (
    <>
      {icons.map((iconName, index) => (
        <Icon key={`${iconName}-${index}`} name={iconName} {...commonProps} />
      ))}
    </>
  )
}

/**
 * 图标映射显示组件（用于开发调试）
 */
export function IconMappingDebug() {
  const stats = resourceOptimizer.getStats()
  const suggestions = resourceOptimizer.getOptimizationSuggestions()

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">图标优化统计</h3>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p>缓存图标数: {stats.cachedIcons}</p>
          <p>缓存资源数: {stats.cachedResources}</p>
        </div>
        <div>
          <p>重量级依赖: {stats.dependencyAnalysis.heavy}</p>
          <p>可优化依赖: {stats.dependencyAnalysis.optimizable}</p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">优化建议:</h4>
          <ul className="text-xs space-y-1">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-muted-foreground">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// 导出常用图标的类型安全版本
export const CommonIcons = {
  Home: (props: Omit<IconProps, 'name'>) => <Icon name="Home" {...props} />,
  Settings: (props: Omit<IconProps, 'name'>) => <Icon name="Settings" {...props} />,
  Search: (props: Omit<IconProps, 'name'>) => <Icon name="Search" {...props} />,
  Heart: (props: Omit<IconProps, 'name'>) => <Icon name="Heart" {...props} />,
  Star: (props: Omit<IconProps, 'name'>) => <Icon name="Star" {...props} />,
  User: (props: Omit<IconProps, 'name'>) => <Icon name="User" {...props} />,
  Menu: (props: Omit<IconProps, 'name'>) => <Icon name="Menu" {...props} />,
  ChevronDown: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronDown" {...props} />,
  ChevronUp: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronUp" {...props} />,
  ChevronLeft: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronLeft" {...props} />,
  ChevronRight: (props: Omit<IconProps, 'name'>) => <Icon name="ChevronRight" {...props} />,
  Plus: (props: Omit<IconProps, 'name'>) => <Icon name="Plus" {...props} />,
  Minus: (props: Omit<IconProps, 'name'>) => <Icon name="Minus" {...props} />,
  X: (props: Omit<IconProps, 'name'>) => <Icon name="X" {...props} />,
  Check: (props: Omit<IconProps, 'name'>) => <Icon name="Check" {...props} />,
  AlertCircle: (props: Omit<IconProps, 'name'>) => <Icon name="AlertCircle" {...props} />,
  Info: (props: Omit<IconProps, 'name'>) => <Icon name="Info" {...props} />,
  Download: (props: Omit<IconProps, 'name'>) => <Icon name="Download" {...props} />,
  Upload: (props: Omit<IconProps, 'name'>) => <Icon name="Upload" {...props} />,
  Copy: (props: Omit<IconProps, 'name'>) => <Icon name="Copy" {...props} />,
  Edit: (props: Omit<IconProps, 'name'>) => <Icon name="Edit" {...props} />,
  Trash2: (props: Omit<IconProps, 'name'>) => <Icon name="Trash2" {...props} />,
  Eye: (props: Omit<IconProps, 'name'>) => <Icon name="Eye" {...props} />,
  EyeOff: (props: Omit<IconProps, 'name'>) => <Icon name="EyeOff" {...props} />,
  Lock: (props: Omit<IconProps, 'name'>) => <Icon name="Lock" {...props} />,
  Unlock: (props: Omit<IconProps, 'name'>) => <Icon name="Unlock" {...props} />,
  Mail: (props: Omit<IconProps, 'name'>) => <Icon name="Mail" {...props} />,
  Phone: (props: Omit<IconProps, 'name'>) => <Icon name="Phone" {...props} />,
  Calendar: (props: Omit<IconProps, 'name'>) => <Icon name="Calendar" {...props} />,
  // Tabler兼容图标
  IconMoon: (props: Omit<IconProps, 'name'>) => <Icon name="IconMoon" {...props} />,
  IconSun: (props: Omit<IconProps, 'name'>) => <Icon name="IconSun" {...props} />,
  IconDeviceDesktop: (props: Omit<IconProps, 'name'>) => <Icon name="IconDeviceDesktop" {...props} />,
  IconChevronRight: (props: Omit<IconProps, 'name'>) => <Icon name="IconChevronRight" {...props} />,
  IconDots: (props: Omit<IconProps, 'name'>) => <Icon name="IconDots" {...props} />,
  IconFolder: (props: Omit<IconProps, 'name'>) => <Icon name="IconFolder" {...props} />,
  IconShare3: (props: Omit<IconProps, 'name'>) => <Icon name="IconShare3" {...props} />,
  IconTrash: (props: Omit<IconProps, 'name'>) => <Icon name="IconTrash" {...props} />,
  IconTrendingDown: (props: Omit<IconProps, 'name'>) => <Icon name="IconTrendingDown" {...props} />,
  IconTrendingUp: (props: Omit<IconProps, 'name'>) => <Icon name="IconTrendingUp" {...props} />,
} as const
