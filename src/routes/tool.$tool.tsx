import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { perfBus, mark, measure } from '@/lib/perf'
import tools from '@/lib/data'
import { getToolLoaderBySlug, hasTool } from '@/lib/tools-map'
import ToolNotFound from '@/components/tools/404'
import { ToolLoading } from '@/components/ui/loading'
import { AdSenseAd } from '@/components/adsense-ad'
import { useRoutePrefetch } from '@/lib/route-prefetch'
import { useSmartPreload } from '@/lib/preloader'
import { QueryClient } from '@tanstack/react-query'
import type { Tool, ToolCategory } from '@/types/tool'

// 类型守卫：检查是否为工具
function isTool(obj: unknown): obj is Tool {
  return (
    typeof obj === 'object' && obj !== null && 'slug' in obj && 'name' in obj && typeof (obj as Tool).slug === 'string'
  )
}

// 类型守卫：检查是否为工具分类
function isToolCategory(obj: unknown): obj is ToolCategory {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'tools' in obj &&
    Array.isArray((obj as ToolCategory).tools)
  )
}

export const Route = createFileRoute('/tool/$tool')({
  loader: async ({ context, params }) => {
    const { queryClient } = context as { queryClient: QueryClient }
    const slug = params.tool
    // 示例：若某些工具需要公共元信息，可在此预取（占位，避免真实网络依赖）
    // 这里用一个稳定键做演示，真实项目可替换为需要的接口
    await queryClient.prefetchQuery({
      queryKey: ['tool-meta', slug],
      queryFn: async () => ({ slug, ts: Date.now() }),
      staleTime: 5 * 60 * 1000,
    })
    return null
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { tool: toolSlug } = Route.useParams()
  const { trackToolUsage } = useSmartPreload()
  const { prefetchRelated } = useRoutePrefetch()

  // 查找工具信息（使用类型守卫）
  const toolInfo = (tools as ToolCategory[])
    .flatMap((category) => (isToolCategory(category) ? category.tools : []))
    .find((t) => isTool(t) && t.slug === toolSlug)

  // 预取关联工具
  useEffect(() => {
    if (toolSlug) {
      prefetchRelated(toolSlug)
    }
  }, [toolSlug, prefetchRelated])

  // 动态导入工具组件
  const ToolComponent =
    toolInfo && hasTool(toolSlug)
      ? lazyRouteComponent(async () => {
          const loader = getToolLoaderBySlug(toolSlug)
          if (!loader) throw new Error(`Tool loader not found for ${toolSlug}`)
          const m = await loader()
          // 处理不同的导出格式
          if (m && typeof m === 'object' && 'default' in m) {
            return { default: m.default as React.ComponentType<{ onReady?: () => void }> }
          }
          return { default: m as React.ComponentType<{ onReady?: () => void }> }
        })
      : null

  if (!toolInfo) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  if (!ToolComponent) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  // 动态注入页面元信息
  useEffect(() => {
    if (!toolInfo) return

    const title = `${toolInfo.name} | Kit`
    const desc = `Use ${toolInfo.name} online in Kit.`

    document.title = title

    const ensureMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    ensureMeta('description', desc, 'name')
    ensureMeta('og:title', title, 'property')
    ensureMeta('og:description', desc, 'property')
    ensureMeta('og:type', 'website', 'property')
    ensureMeta('og:url', window.location.href, 'property')

    return () => {
      // 可保留 title，不强制回滚
    }
  }, [toolInfo])

  return (
    <>
      <Suspense fallback={<ToolLoading toolName={toolInfo.name} />}>
        {(() => {
          // 使用 React.ComponentType 类型而不是 any
          const Comp = ToolComponent as React.ComponentType<{ onReady?: () => void }>
          return (
            <Comp
              onReady={() => {
                // 工具组件在 mount 后通过可选的 onReady 回调上报可交互
                const startMark = `tool_${toolSlug}_start`
                mark(startMark)
                const ms = measure(`tool_${toolSlug}_interactive`, startMark)
                if (ms != null) {
                  perfBus.emit('tool_interactive', { slug: toolSlug, ms, ts: Date.now() })
                }
                // 记录工具使用，触发关联工具预热
                trackToolUsage(toolSlug)
              }}
            />
          )
        })()}
      </Suspense>

      {/* 广告位移到 Suspense 外部 */}
      <AdSenseAd />
    </>
  )
}
