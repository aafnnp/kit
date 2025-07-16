import { createFileRoute, Link } from '@tanstack/react-router'
import categorizedTools from '@/lib/data'
import * as Icons from 'lucide-react'
import type { Tool } from '@/types/tool'
import { useTranslation } from 'react-i18next'

// 预留 locale 变量，后续可接入 i18n 库
// const locale = 'zh' // 可切换为 'en'

export const Route = createFileRoute('/')({
  component: () => {
    const { t, i18n } = useTranslation()
    const locale = i18n.language.startsWith('en') ? 'en' : 'zh'
    return (
      <div className="px-4">
        <div className="flex justify-end mb-4">
          <button
            className="px-3 py-1 rounded border mr-2"
            onClick={() => i18n.changeLanguage('zh')}
            disabled={locale === 'zh'}
          >
            {t('中文')}
          </button>
          <button
            className="px-3 py-1 rounded border"
            onClick={() => i18n.changeLanguage('en')}
            disabled={locale === 'en'}
          >
            {t('英文')}
          </button>
        </div>
        <div className="space-y-8">
          {categorizedTools.map((group) => (
            <div key={group.type.zh}>
              <h2 className="text-xl font-semibold mb-2">{group.type[locale]}</h2>
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
                        <div className="text-sm text-muted-foreground">{tool.desc[locale]}</div>
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
