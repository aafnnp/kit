import { createFileRoute, Link } from '@tanstack/react-router'
import categorizedTools from '@/lib/data'
import * as Icons from 'lucide-react'

// 定义工具类型，包含 icon 字段
interface Tool {
  slug: string
  name: string
  desc: string
  icon?: string
}

export const Route = createFileRoute('/')({
  component: () => {
    return (
      <div className="px-4">
        <div className="space-y-8">
          {categorizedTools.map((group) => (
            <div key={group.type}>
              <h2 className="text-xl font-semibold mb-2">{group.type}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(group.tools as Tool[]).map((tool) => {
                  // kebab-case 转 PascalCase
                  const iconName = tool.icon || 'Circle'
                  const LucideIcon = (Icons as unknown as Record<string, React.FC<any>>)[iconName]
                  return (
                    <Link
                      key={tool.slug}
                      className="p-4 border rounded-lg bg-white/80 shadow-sm hover:shadow transition flex items-center gap-3"
                      to={'/tool/$tool'}
                      params={{ tool: tool.slug }}
                    >
                      {LucideIcon && <LucideIcon className="w-6 h-6 text-primary" />}
                      <div>
                        <div className="font-medium text-base">{tool.name}</div>
                        <div className="text-sm text-muted-foreground">{tool.desc}</div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
})
