// src/components/common/tool-base.tsx
import { useState } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ToolErrorBoundary } from '@/components/error-boundary'

interface ToolBaseProps {
  toolName: string
  icon: React.ReactNode
  description: string
  children: React.ReactNode
  tabs?: Array<{
    id: string
    label: string
    icon: React.ReactNode
    content: React.ReactNode
  }>
}

export function ToolBase({ toolName, icon, description, children, tabs }: ToolBaseProps) {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || '')

  return (
    <ToolErrorBoundary toolName={toolName}>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        <div id="main-content" className="flex flex-col gap-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {icon}
                {toolName}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>

          {tabs ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full grid-cols-${tabs.length}`}>
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {tabs.map(tab => (
                <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            children
          )}
        </div>
      </div>
    </ToolErrorBoundary>
  )
}