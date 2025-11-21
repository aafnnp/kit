import { useState, useCallback, useMemo } from 'react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ToolErrorBoundary } from '@/components/common/tool-error-boundary'
import { useToolState } from '@/hooks/use-tool-state'
import { useTemplateManager, BaseTemplate } from '@/hooks/use-template-manager'
import { useSettingsManager, SettingGroup } from '@/hooks/use-settings-manager'
import { Settings, FileText, History, Info, Zap } from 'lucide-react'

// Grid columns mapping for Tailwind CSS
const GRID_COLS_MAP: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
}

const getGridColsClass = (count: number): string => {
  return GRID_COLS_MAP[count] || 'grid-cols-1'
}

// 工具标签页类型
export interface ToolTab {
  id: string
  label: string
  icon: React.ReactNode
  content: React.ReactNode
  disabled?: boolean
  badge?: string | number
}

// 工具操作按钮
export interface ToolAction {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  disabled?: boolean
  loading?: boolean
}

// 增强工具基础组件的 Props
export interface EnhancedToolBaseProps<
  TData = any,
  TTemplate extends BaseTemplate = BaseTemplate,
  TSettings extends Record<string, any> = Record<string, any>,
> {
  // 基础信息
  toolName: string
  icon: React.ReactNode
  description: string
  version?: string

  // 内容
  children: React.ReactNode
  tabs?: ToolTab[]
  actions?: ToolAction[]

  // 状态管理
  initialData?: TData
  onDataChange?: (data: TData) => void

  // 模板管理
  templates?: TTemplate[]
  onTemplateApply?: (template: TTemplate) => void
  templateStorageKey?: string

  // 设置管理
  settingGroups?: SettingGroup[]
  onSettingsChange?: (settings: TSettings) => void
  settingsStorageKey?: string

  // 功能开关
  enableTemplates?: boolean
  enableSettings?: boolean
  enableHistory?: boolean
  enableProgress?: boolean

  // 样式
  className?: string
  headerClassName?: string
  contentClassName?: string
}

// 增强的工具基础组件
export function EnhancedToolBase<
  TData = any,
  TTemplate extends BaseTemplate = BaseTemplate,
  TSettings extends Record<string, any> = Record<string, any>,
>({
  toolName,
  icon,
  description,
  version,
  children,
  tabs,
  actions,
  initialData,
  templates = [],
  onTemplateApply,
  templateStorageKey,
  settingGroups = [],
  onSettingsChange,
  settingsStorageKey,
  enableTemplates = false,
  enableSettings = false,
  enableHistory = false,
  enableProgress = false,
  className = '',
  headerClassName = '',
  contentClassName = '',
}: EnhancedToolBaseProps<TData, TTemplate, TSettings>) {
  // 状态管理
  const toolState = useToolState(initialData)

  // 模板管理
  const templateManager = useTemplateManager(templates, {
    storageKey: templateStorageKey || `${toolName.toLowerCase().replace(/\s+/g, '-')}-templates`,
    enableLocalStorage: enableTemplates,
  })

  // 设置管理
  const settingsManager = useSettingsManager<TSettings>(settingGroups, {
    storageKey: settingsStorageKey || `${toolName.toLowerCase().replace(/\s+/g, '-')}-settings`,
    enableLocalStorage: enableSettings,
  })

  // 活动标签页
  const [activeTab, setActiveTab] = useState(() => {
    if (tabs && tabs.length > 0) {
      return tabs.find((tab) => !tab.disabled)?.id || tabs[0].id
    }
    return 'main'
  })

  // 系统标签页
  const systemTabs = useMemo(() => {
    const sysTabs: ToolTab[] = []

    if (enableTemplates && templates.length > 0) {
      sysTabs.push({
        id: 'templates',
        label: 'Templates',
        icon: <FileText className="h-4 w-4" />,
        content: <TemplatePanel templateManager={templateManager} onTemplateApply={onTemplateApply} />,
        badge: templateManager.stats.custom > 0 ? templateManager.stats.custom : undefined,
      })
    }

    if (enableSettings && settingGroups.length > 0) {
      sysTabs.push({
        id: 'settings',
        label: 'Settings',
        icon: <Settings className="h-4 w-4" />,
        content: <SettingsPanel settingsManager={settingsManager} onSettingsChange={onSettingsChange} />,
        badge: settingsManager.isDirty ? '•' : undefined,
      })
    }

    if (enableHistory) {
      sysTabs.push({
        id: 'history',
        label: 'History',
        icon: <History className="h-4 w-4" />,
        content: <HistoryPanel toolName={toolName} />,
      })
    }

    return sysTabs
  }, [
    enableTemplates,
    enableSettings,
    enableHistory,
    templates.length,
    settingGroups.length,
    templateManager,
    settingsManager,
    onTemplateApply,
    onSettingsChange,
    toolName,
  ])

  // 所有标签页
  const allTabs = useMemo(() => {
    const mainTabs: ToolTab[] = tabs || [
      {
        id: 'main',
        label: 'Main',
        icon: <Zap className="h-4 w-4" />,
        content: children,
      },
    ]

    return [...mainTabs, ...systemTabs]
  }, [tabs, children, systemTabs])

  return (
    <ToolErrorBoundary toolName={toolName}>
      <div className={`w-full max-w-7xl mx-auto space-y-6 ${className}`}>
        {/* Skip link for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>

        <div id="main-content" className="flex flex-col gap-6">
          {/* Header */}
          <Card className={headerClassName}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {icon}
                    <CardTitle className="text-xl">{toolName}</CardTitle>
                    {version && (
                      <Badge variant="outline" className="text-xs">
                        v{version}
                      </Badge>
                    )}
                  </div>

                  {/* 状态指示器 */}
                  <div className="flex items-center gap-2">
                    {toolState.isLoading && (
                      <Badge variant="secondary" className="animate-pulse">
                        Loading...
                      </Badge>
                    )}
                    {toolState.isProcessing && (
                      <Badge variant="default" className="animate-pulse">
                        Processing...
                      </Badge>
                    )}
                    {toolState.error && <Badge variant="destructive">Error</Badge>}
                  </div>
                </div>

                {/* 操作按钮 */}
                {actions && actions.length > 0 && (
                  <div className="flex items-center gap-2">
                    {actions.map((action) => (
                      <Button
                        key={action.id}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={action.onClick}
                        disabled={action.disabled || toolState.isLoading || toolState.isProcessing}
                        className="flex items-center gap-2"
                      >
                        {action.loading ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          action.icon
                        )}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <CardDescription>{description}</CardDescription>

              {/* 进度条 */}
              {enableProgress && toolState.isProcessing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{Math.round(toolState.progress)}%</span>
                  </div>
                  <Progress value={toolState.progress} className="h-2" />
                </div>
              )}

              {/* 错误信息 */}
              {toolState.error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{toolState.error}</p>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* 内容区域 */}
          <div className={contentClassName}>
            {allTabs.length > 1 ? (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className={`grid w-full ${getGridColsClass(Math.min(allTabs.length, 6))}`}>
                  {allTabs.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      disabled={tab.disabled}
                      className="flex items-center gap-2"
                    >
                      {tab.icon}
                      {tab.label}
                      {tab.badge && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {tab.badge}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {allTabs.map((tab) => (
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
      </div>
    </ToolErrorBoundary>
  )
}

// 模板面板组件
interface TemplatePanelProps<T extends BaseTemplate> {
  templateManager: ReturnType<typeof useTemplateManager<T>>
  onTemplateApply?: (template: T) => void
}

function TemplatePanel<T extends BaseTemplate>({ templateManager, onTemplateApply }: TemplatePanelProps<T>) {
  const handleTemplateSelect = useCallback(
    (template: T) => {
      templateManager.applyTemplate(template.id, onTemplateApply)
    },
    [templateManager, onTemplateApply]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Templates</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{templateManager.stats.total} total</Badge>
          {templateManager.stats.custom > 0 && <Badge variant="secondary">{templateManager.stats.custom} custom</Badge>}
        </div>
      </div>

      {Object.entries(templateManager.groupedTemplates).map(([category, templates]) => (
        <div key={category} className="space-y-2">
          <h4 className="font-medium text-muted-foreground">{category}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  templateManager.selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleTemplateSelect(template)}
              >
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{template.name}</CardTitle>
                    {template.isBuiltIn && (
                      <Badge variant="outline" className="text-xs">
                        Built-in
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">{template.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 设置面板组件
interface SettingsPanelProps<T extends Record<string, any>> {
  settingsManager: ReturnType<typeof useSettingsManager<T>>
  onSettingsChange?: (settings: T) => void
}

function SettingsPanel<T extends Record<string, any>>({ settingsManager }: SettingsPanelProps<T>) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Settings</h3>
        <div className="flex items-center gap-2">
          {settingsManager.isDirty && <Badge variant="secondary">Unsaved changes</Badge>}
          {!settingsManager.isValid && <Badge variant="destructive">Validation errors</Badge>}
          <Button variant="outline" size="sm" onClick={settingsManager.resetSettings}>
            Reset
          </Button>
        </div>
      </div>

      {settingsManager.settingGroups.map((group) => (
        <Card key={group.key}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {group.icon}
              {group.label}
            </CardTitle>
            {group.description && <CardDescription>{group.description}</CardDescription>}
          </CardHeader>
          <div className="p-6 pt-0 space-y-4">
            {settingsManager.getVisibleFields(group).map((field) => (
              <div key={field.key} className="space-y-2">
                <label className="text-sm font-medium">
                  {field.label}
                  {field.description && <span className="text-muted-foreground ml-1">({field.description})</span>}
                </label>
                {/* 这里需要根据 field.type 渲染不同的输入组件 */}
                <div className="text-xs text-muted-foreground">
                  Current: {JSON.stringify(settingsManager.settings[field.key])}
                </div>
                {settingsManager.hasFieldError(field.key) && (
                  <p className="text-xs text-destructive">{settingsManager.getFieldError(field.key)}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

// 历史面板组件
interface HistoryPanelProps {
  toolName: string
}

function HistoryPanel({ toolName }: HistoryPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">History</h3>
        <Badge variant="outline">Coming soon</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            History Feature
          </CardTitle>
          <CardDescription>History tracking for {toolName} will be available in a future update.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
