import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import tools from '@/lib/data'
import { getToolLoaderBySlug, hasTool } from '@/lib/tools-map'
import ToolNotFound from '@/components/tools/404'
import { ToolLoading } from '@/components/ui/loading'
import { AdSenseAd } from '@/components/adsense-ad'

export const Route = createFileRoute('/tool/$tool')({
  component: RouteComponent,
})

function RouteComponent() {
  const { tool: toolSlug } = Route.useParams()

  // 查找工具信息
  const toolInfo = tools.flatMap((category: any) => category.tools).find((t: any) => t.slug === toolSlug)

  // 动态导入工具组件
  const ToolComponent =
    toolInfo && hasTool(toolSlug)
      ? lazyRouteComponent(() => getToolLoaderBySlug(toolSlug)!().then((m: any) => ({ default: m.default || m })))
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
        <ToolComponent />
      </Suspense>

      {/* 广告位移到 Suspense 外部 */}
      <AdSenseAd />
    </>
  )
}
