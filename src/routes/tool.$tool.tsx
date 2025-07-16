import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { ErrorBoundary } from '@/components/error-boundary'

const Tool = () => {
  const { tool } = Route.useParams()
  const DynamicTool = lazy(() => import(`@/components/tools/${tool}.tsx`))

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <div className="px-4">
          <DynamicTool />
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}

export const Route = createFileRoute('/tool/$tool')({
  component: Tool,
})
