import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const Tool = () => {
  const { tool } = Route.useParams()
  const DynamicTool = lazy(() => import(`@/components/tools/${tool}.tsx`))

  return (
    <Suspense fallback={null}>
      <div className="px-4">
        <DynamicTool />
      </div>
    </Suspense>
  )
}

export const Route = createFileRoute('/tool/$tool')({
  component: Tool,
})
