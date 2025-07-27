import { createFileRoute, lazyRouteComponent } from '@tanstack/react-router'
import { Suspense } from 'react'
import tools from '@/lib/data'
import ToolNotFound from '@/components/tools/404'
import { ToolLoading } from '@/components/ui/loading'

export const Route = createFileRoute('/tool/$tool')({
  component: RouteComponent,
})

function RouteComponent() {
  const { tool: toolSlug } = Route.useParams()

  // 查找工具信息
  const toolInfo = tools.flatMap((category: any) => category.tools).find((t: any) => t.slug === toolSlug)

  // 动态导入工具组件
  const ToolComponent = toolInfo
    ? lazyRouteComponent(() =>
        import(`@/components/tools/${toolSlug}/index.tsx`).then((m) => ({ default: m.default || m }))
      )
    : null

  if (!toolInfo) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  if (!ToolComponent) {
    return <ToolNotFound toolSlug={toolSlug} />
  }

  return (
    <Suspense fallback={<ToolLoading toolName={toolInfo.name} />}>
      <ToolComponent />
    </Suspense>
  )
}
