import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * Tool loading skeleton component
 * Provides a consistent loading state for tools
 */
export function ToolSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header skeleton */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-muted rounded-lg" />
              <div className="space-y-2">
                <div className="h-6 bg-muted rounded w-48" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
            </div>
            <div className="h-9 w-20 bg-muted rounded" />
          </div>
        </CardHeader>
      </Card>

      {/* Content skeleton */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-1/4" />
            <div className="h-24 bg-muted rounded" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 bg-muted rounded flex-1" />
            <div className="h-10 bg-muted rounded flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
