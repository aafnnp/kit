import { useState, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  GitBranch,
  Terminal,
  Copy,
  Star,
  StarOff,
  History,
  BookOpen,
  Search,
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
} from 'lucide-react'
import { useCopyToClipboard } from '@/hooks/use-clipboard'
import {
  GitHelperState,
  GitCommand,
  GitCommandExecution,
  GIT_COMMAND_TEMPLATES,
  GIT_COMMAND_CATEGORIES,
  GIT_WORKFLOW_TEMPLATES,
  formatGitCommand,
  validateGitParameters,
} from '@/types/git-helper'
import { ToolBase } from '@/components/common/tool-base'
import { nanoid } from 'nanoid'

export default function GitHelper() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  const [state, setState] = useState<GitHelperState>({
    repositories: [],
    commands: GIT_COMMAND_TEMPLATES,
    commandHistory: [],
    favorites: [],
    isExecuting: false,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCommand, setSelectedCommand] = useState<GitCommand | null>(null)
  const [commandParameters, setCommandParameters] = useState<Record<string, any>>({})
  const [customCommand, setCustomCommand] = useState('')

  // 过滤命令
  const filteredCommands = useMemo(() => {
    return state.commands.filter((command) => {
      const matchesSearch =
        command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        command.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        command.command.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        selectedCategory === 'all' ||
        (selectedCategory === 'favorites' && state.favorites.includes(command.id)) ||
        command.category === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [state.commands, state.favorites, searchTerm, selectedCategory])

  // 选择命令
  const selectCommand = useCallback((command: GitCommand) => {
    setSelectedCommand(command)

    // 初始化参数默认值
    const defaultParams: Record<string, any> = {}
    if (command.parameters) {
      command.parameters.forEach((param) => {
        if (param.defaultValue !== undefined) {
          defaultParams[param.name] = param.defaultValue
        }
      })
    }
    setCommandParameters(defaultParams)
  }, [])

  // 更新参数
  const updateParameter = useCallback((paramName: string, value: any) => {
    setCommandParameters((prev) => ({
      ...prev,
      [paramName]: value,
    }))
  }, [])

  // 执行命令
  const executeCommand = useCallback(
    (command: string) => {
      const execution: GitCommandExecution = {
        id: nanoid(),
        command,
        parameters: commandParameters,
        output: `$ ${command}\n\n# This is a simulation. In a real environment, this would execute the Git command.\n# Output would appear here...`,
        exitCode: 0,
        timestamp: Date.now(),
        duration: Math.random() * 1000 + 500, // 模拟执行时间
      }

      setState((prev) => ({
        ...prev,
        commandHistory: [execution, ...prev.commandHistory.slice(0, 49)], // 保留最近50条记录
      }))

      copyToClipboard(command, 'Git command')
    },
    [commandParameters, copyToClipboard]
  )

  // 生成命令
  const generateCommand = useCallback(() => {
    if (!selectedCommand) return ''

    const errors = validateGitParameters(selectedCommand, commandParameters)
    if (errors.length > 0) {
      return ''
    }

    return formatGitCommand(selectedCommand, commandParameters)
  }, [selectedCommand, commandParameters])

  // 验证参数并设置错误状态
  const validateAndSetError = useCallback(() => {
    if (!selectedCommand) {
      setState((prev) => ({ ...prev, error: undefined }))
      return
    }

    const errors = validateGitParameters(selectedCommand, commandParameters)
    setState((prev) => ({ 
      ...prev, 
      error: errors.length > 0 ? errors.join('; ') : undefined 
    }))
  }, [selectedCommand, commandParameters])

  // 当选中的命令或参数改变时验证
  useEffect(() => {
    validateAndSetError()
  }, [validateAndSetError])

  // 切换收藏
  const toggleFavorite = useCallback((commandId: string) => {
    setState((prev) => ({
      ...prev,
      favorites: prev.favorites.includes(commandId)
        ? prev.favorites.filter((id) => id !== commandId)
        : [...prev.favorites, commandId],
    }))
  }, [])

  // 加载工作流模板
  const loadWorkflow = useCallback((workflow: (typeof GIT_WORKFLOW_TEMPLATES)[0]) => {
    const workflowText = workflow.commands.join('\n')
    setCustomCommand(workflowText)
  }, [])

  // 清空历史
  const clearHistory = useCallback(() => {
    setState((prev) => ({ ...prev, commandHistory: [] }))
  }, [])

  // 导出历史
  const exportHistory = useCallback(() => {
    const data = {
      history: state.commandHistory,
      favorites: state.favorites,
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `git-history-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [state.commandHistory, state.favorites])

  const currentCommand = generateCommand()

  return (
    <ToolBase
      toolName={t('tools.git-helper.title', 'Git Helper')}
      icon={<GitBranch className="w-5 h-5" />}
      description={t('tools.git-helper.description', 'Interactive Git command builder and reference guide')}
    >
      <div className="space-y-6">
        <Tabs defaultValue="commands" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="commands">
              <Terminal className="w-4 h-4 mr-2" />
              {t('tools.git-helper.commands', 'Commands')}
            </TabsTrigger>
            <TabsTrigger value="workflows">
              <BookOpen className="w-4 h-4 mr-2" />
              {t('tools.git-helper.workflows', 'Workflows')}
            </TabsTrigger>
            <TabsTrigger value="custom">
              <Plus className="w-4 h-4 mr-2" />
              {t('tools.git-helper.custom', 'Custom')}
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              {t('tools.git-helper.history', 'History')}
            </TabsTrigger>
          </TabsList>

          {/* 命令浏览器 */}
          <TabsContent value="commands" className="space-y-4">
            {/* 搜索和过滤 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-4 mb-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder={t('tools.git-helper.search-placeholder', 'Search commands...')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="w-48">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    >
                      <option value="all">{t('tools.git-helper.all-categories', 'All Categories')}</option>
                      <option value="favorites">{t('tools.git-helper.favorites', 'Favorites')}</option>
                      {Object.entries(GIT_COMMAND_CATEGORIES).map(([key, category]) => (
                        <option key={key} value={key}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 命令列表 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredCommands.map((command) => (
                    <div
                      key={command.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted ${
                        selectedCommand?.id === command.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => selectCommand(command)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{command.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {GIT_COMMAND_CATEGORIES[command.category]?.icon} {command.category}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{command.description}</p>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{command.command}</code>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(command.id)
                          }}
                        >
                          {state.favorites.includes(command.id) ? (
                            <Star className="w-4 h-4 fill-current" />
                          ) : (
                            <StarOff className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 命令构建器 */}
            {selectedCommand && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Terminal className="w-5 h-5" />
                    {selectedCommand.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{selectedCommand.description}</p>

                  {/* 参数输入 */}
                  {selectedCommand.parameters && selectedCommand.parameters.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-medium">{t('tools.git-helper.parameters', 'Parameters')}</h5>
                      {selectedCommand.parameters.map((param) => (
                        <div key={param.name} className="space-y-2">
                          <Label className="flex items-center gap-2">
                            {param.name}
                            {param.required && <span className="text-red-500">*</span>}
                            <span className="text-xs text-muted-foreground">({param.type})</span>
                          </Label>

                          {param.type === 'select' ? (
                            <select
                              value={commandParameters[param.name] || param.defaultValue || ''}
                              onChange={(e) => updateParameter(param.name, e.target.value)}
                              className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                            >
                              {!param.required && <option value="">-- Optional --</option>}
                              {param.options?.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : param.type === 'boolean' ? (
                            <input
                              type="checkbox"
                              checked={commandParameters[param.name] || param.defaultValue || false}
                              onChange={(e) => updateParameter(param.name, e.target.checked)}
                              className="w-4 h-4"
                            />
                          ) : (
                            <Input
                              type={param.type === 'number' ? 'number' : 'text'}
                              value={commandParameters[param.name] || ''}
                              onChange={(e) => updateParameter(param.name, e.target.value)}
                              placeholder={param.placeholder}
                            />
                          )}

                          <p className="text-xs text-muted-foreground">{param.description}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 生成的命令 */}
                  <div className="space-y-2">
                    <Label>{t('tools.git-helper.generated-command', 'Generated Command')}</Label>
                    <div className="flex gap-2">
                      <Input value={currentCommand} readOnly className="font-mono text-sm" />
                      <Button onClick={() => executeCommand(currentCommand)} disabled={!currentCommand}>
                        <Copy className="w-4 h-4 mr-2" />
                        {t('common.copy', 'Copy')}
                      </Button>
                    </div>
                  </div>

                  {/* 错误信息 */}
                  {state.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      {state.error}
                    </div>
                  )}

                  {/* 示例 */}
                  {selectedCommand.examples && selectedCommand.examples.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t('tools.git-helper.examples', 'Examples')}</Label>
                      <div className="space-y-1">
                        {selectedCommand.examples.map((example, index) => (
                          <code key={index} className="block text-xs bg-muted p-2 rounded">
                            {example}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 工作流模板 */}
          <TabsContent value="workflows" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {t('tools.git-helper.workflow-templates', 'Workflow Templates')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {GIT_WORKFLOW_TEMPLATES.map((workflow, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">{workflow.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{workflow.description}</p>
                      <Button size="sm" onClick={() => loadWorkflow(workflow)} className="w-full">
                        <Download className="w-4 h-4 mr-2" />
                        {t('tools.git-helper.load-workflow', 'Load Workflow')}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 自定义命令 */}
          <TabsContent value="custom" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  {t('tools.git-helper.custom-commands', 'Custom Commands')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('tools.git-helper.command-sequence', 'Command Sequence')}</Label>
                  <Textarea
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    placeholder="Enter Git commands, one per line...\n\ngit checkout main\ngit pull origin main\ngit checkout -b feature/new-feature\n# Add your changes\ngit add .\ngit commit -m 'Add new feature'"
                    className="min-h-[200px] font-mono text-sm"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => copyToClipboard(customCommand, 'Custom commands')}
                    disabled={!customCommand.trim()}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    {t('common.copy', 'Copy')}
                  </Button>

                  <Button variant="outline" onClick={() => setCustomCommand('')}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {t('common.clear', 'Clear')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 命令历史 */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    {t('tools.git-helper.command-history', 'Command History')}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={exportHistory}>
                      <Download className="w-4 h-4 mr-2" />
                      {t('common.export', 'Export')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={clearHistory}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('common.clear', 'Clear')}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.commandHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('tools.git-helper.no-history', 'No command history yet')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {state.commandHistory.map((execution) => (
                      <div key={execution.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{execution.command}</code>
                          <div className="flex items-center gap-2">
                            <Badge variant={execution.exitCode === 0 ? 'default' : 'destructive'}>
                              {execution.exitCode === 0 ? (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              ) : (
                                <AlertCircle className="w-3 h-3 mr-1" />
                              )}
                              {execution.exitCode === 0 ? 'Success' : 'Error'}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(execution.command, 'Git command')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {new Date(execution.timestamp).toLocaleString()} •{execution.duration.toFixed(0)}ms
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ToolBase>
  )
}
