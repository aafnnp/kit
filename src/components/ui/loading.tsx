import { Skeleton } from './skeleton'
import { Card, CardContent, CardHeader } from './card'

interface ToolLoadingProps {
  toolName?: string
}

/**
 * 工具加载骨架屏组件
 * 提供更好的加载体验，显示工具布局的骨架结构
 */
export function ToolLoading({ toolName }: ToolLoadingProps) {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-6">
        {/* Header Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
        </Card>

        {/* Content Skeleton */}
        <Card>
          <CardContent className="space-y-4 p-6">
            {/* Input area skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>

            {/* Button group skeleton */}
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>

            {/* Output area skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>

            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading indicator */}
        <div className="flex items-center justify-center py-4">
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            {toolName && <p className="text-sm text-muted-foreground">正在加载 {toolName}...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ToolLoading
