import React from 'react'

interface ToolLoadingProps {
  toolName?: string
}

export function ToolLoading({ toolName }: ToolLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        {toolName && (
          <p className="text-sm text-muted-foreground">
            正在加载 {toolName}...
          </p>
        )}
      </div>
    </div>
  )
}

export default ToolLoading