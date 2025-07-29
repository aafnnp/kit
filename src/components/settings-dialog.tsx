import { useTranslation } from 'react-i18next'
import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { usePersistence } from '@/lib/persistence'
import { Download, Upload, Trash2, History, Settings2, Database, Zap } from 'lucide-react'
import { ResourceOptimization } from '@/components/resource-optimization'
import { CacheStrategyManager } from '@/components/cache-strategy-manager'
import type { SettingsStep, UpdateInfo } from '@/types/settings'
import { version } from '../../package.json'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const locale = i18n.language.startsWith('en') ? 'en' : 'zh'
  
  // 判断是否为桌面版（Tauri应用）
  const isDesktop = typeof window !== 'undefined' && (window as any).__TAURI__

  // 数据持久化相关
  const { history, configs, preferences, exportImport } = usePersistence()
  const [clearDataDialog, setClearDataDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [importData, setImportData] = useState('')
  const [importError, setImportError] = useState('')

  // 检查更新相关状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [step, setStep] = useState<SettingsStep>('idle')
  const [contentLength, setContentLength] = useState(0)
  const [downloaded, setDownloaded] = useState(0)
  const [noUpdateDialog, setNoUpdateDialog] = useState(false)

  const progress = useMemo(() => {
    return contentLength ? Math.round((downloaded / contentLength) * 100) : 0
  }, [contentLength, downloaded])

  const checkForUpdates = async () => {
    const update = await check()
    if (update) {
      setUpdateInfo(update)
      setStep('confirm')
      setDialogOpen(true)
    } else {
      setNoUpdateDialog(true)
    }
  }

  const handleUpdate = async () => {
    if (!updateInfo) return
    setStep('downloading')
    setDownloaded(0)
    setContentLength(0)
    await updateInfo.downloadAndInstall((event: any) => {
      switch (event.event) {
        case 'Started':
          setContentLength(event.data.contentLength || 0)
          setDownloaded(0)
          break
        case 'Progress':
          if (typeof event.data.downloaded === 'number') {
            setDownloaded(event.data.downloaded)
          } else if (typeof event.data.chunkLength === 'number') {
            setDownloaded((prev) => prev + event.data.chunkLength)
          }
          break
        case 'Finished':
          setStep('finished')
          break
      }
    })
  }

  const handleRelaunch = async () => {
    await relaunch()
  }

  // 数据管理相关函数
  const handleExportData = async () => {
    try {
      await exportImport.downloadData()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleImportData = async () => {
    try {
      setImportError('')
      await exportImport.importData(importData)
      setImportDialog(false)
      setImportData('')
    } catch (error) {
      setImportError((error as Error).message)
    }
  }

  const handleClearAllData = async () => {
    try {
      exportImport.clearAllData()
      setClearDataDialog(false)
    } catch (error) {
      console.error('Clear data failed:', error)
    }
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        setImportData(content)
        setImportDialog(true)
      }
      reader.readAsText(file)
    }
  }

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    if (theme === 'system') {
      // 跟随系统
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      if (mq.matches) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.add('light')
      }
    } else {
      document.documentElement.classList.add(theme)
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl sm:max-w-3xl md:max-w-3xl lg:max-w-3xl xl:max-w-3xl max-h-[90vh] overflow-hidden overflow-y-scroll scroll-smooth">
          <DialogHeader>
            <DialogTitle>{t('设置')}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="general" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-6 mb-4">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  {t('通用设置')}
                </TabsTrigger>
                <TabsTrigger value="optimization" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  资源优化
                </TabsTrigger>
                <TabsTrigger value="cache-strategy" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  缓存策略
                </TabsTrigger>
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  {t('数据管理')}
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  {t('使用历史')}
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  {t('偏好设置')}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                {/* 通用设置 */}
                <TabsContent value="general">
                  <Card className="p-6">
                    <div className="space-y-6">
                      <div>
                        <div className="font-medium mb-2">{t('主题')}</div>
                        <Select value={theme} onValueChange={setTheme}>
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="light">{t('明亮')}</SelectItem>
                              <SelectItem value="dark">{t('暗黑')}</SelectItem>
                              <SelectItem value="system">{t('跟随系统')}</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div>
                        <div className="font-medium mb-2">{t('语言')}</div>
                        <div className="flex gap-2">
                          <Button
                            variant={locale === 'zh' ? 'default' : 'outline'}
                            onClick={() => i18n.changeLanguage('zh')}
                            disabled={locale === 'zh'}
                          >
                            {t('中文')}
                          </Button>
                          <Button
                            variant={locale === 'en' ? 'default' : 'outline'}
                            onClick={() => i18n.changeLanguage('en')}
                            disabled={locale === 'en'}
                          >
                            {t('英文')}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="font-medium mb-2">{t('当前版本')}</div>
                        <div className="flex items-center gap-4">
                          <span className="text-base font-mono">v{version}</span>
                          {isDesktop && (
                            <Button variant="outline" onClick={checkForUpdates}>
                              {t('检查更新')}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* 资源优化 */}
                <TabsContent value="optimization">
                  <ResourceOptimization />
                </TabsContent>

                {/* 缓存策略 */}
                <TabsContent value="cache-strategy">
                  <CacheStrategyManager />
                </TabsContent>

                {/* 数据管理 */}
                <TabsContent value="data">
                  <Card className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">{t('数据导出与导入')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Button onClick={handleExportData} className="w-full" variant="outline">
                              <Download className="w-4 h-4 mr-2" />
                              {t('导出数据')}
                            </Button>
                            <p className="text-sm text-muted-foreground">{t('导出所有设置、历史记录和偏好配置')}</p>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <Input
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                className="hidden"
                                id="import-file"
                              />
                              <Button asChild className="w-full" variant="outline">
                                <Label htmlFor="import-file" className="cursor-pointer">
                                  <Upload className="w-4 h-4 mr-2" />
                                  {t('导入数据')}
                                </Label>
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{t('从文件导入之前导出的数据')}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-4">{t('数据统计')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{history.history.length}</div>
                            <div className="text-sm text-muted-foreground">{t('历史记录')}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{configs.configs.length}</div>
                            <div className="text-sm text-muted-foreground">{t('工具配置')}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{history.getRecentTools().length}</div>
                            <div className="text-sm text-muted-foreground">{t('最近使用')}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">
                              {Math.round(((localStorage.getItem('kit-favorites')?.length || 2) / 1024) * 100) / 100}KB
                            </div>
                            <div className="text-sm text-muted-foreground">{t('存储大小')}</div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-4 text-destructive">{t('危险操作')}</h3>
                        <Button
                          onClick={() => setClearDataDialog(true)}
                          variant="destructive"
                          className="w-full md:w-auto"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('清空所有数据')}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('此操作将删除所有历史记录、配置和偏好设置，且无法恢复')}
                        </p>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                {/* 使用历史 */}
                <TabsContent value="history">
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{t('使用历史记录')}</h3>
                        <Button
                          onClick={history.clearHistory}
                          variant="outline"
                          size="sm"
                          disabled={history.history.length === 0}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t('清空历史')}
                        </Button>
                      </div>

                      <ScrollArea className="h-96">
                        {history.history.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">{t('暂无使用历史')}</div>
                        ) : (
                          <div className="space-y-2">
                            {history.history.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                  <div className="font-medium">{item.toolName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(item.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={item.success ? 'default' : 'destructive'}>
                                    {item.success ? t('成功') : t('失败')}
                                  </Badge>
                                  {item.duration && (
                                    <span className="text-sm text-muted-foreground">{item.duration}ms</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </Card>
                </TabsContent>

                {/* 偏好设置 */}
                <TabsContent value="preferences">
                  <Card className="p-6">
                    <div className="space-y-6">
                      <h3 className="text-lg font-medium">{t('应用偏好设置')}</h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto-save">{t('自动保存')}</Label>
                            <p className="text-sm text-muted-foreground">{t('自动保存工具配置和输入数据')}</p>
                          </div>
                          <Switch
                            id="auto-save"
                            checked={preferences.preferences.autoSave}
                            onCheckedChange={(checked) => preferences.updatePreference('autoSave', checked)}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="show-tips">{t('显示提示')}</Label>
                            <p className="text-sm text-muted-foreground">{t('在工具页面显示使用提示和帮助信息')}</p>
                          </div>
                          <Switch
                            id="show-tips"
                            checked={preferences.preferences.showTips}
                            onCheckedChange={(checked) => preferences.updatePreference('showTips', checked)}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="compact-mode">{t('紧凑模式')}</Label>
                            <p className="text-sm text-muted-foreground">{t('使用更紧凑的界面布局')}</p>
                          </div>
                          <Switch
                            id="compact-mode"
                            checked={preferences.preferences.compactMode}
                            onCheckedChange={(checked) => preferences.updatePreference('compactMode', checked)}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notifications">{t('通知')}</Label>
                            <p className="text-sm text-muted-foreground">{t('显示操作完成和错误通知')}</p>
                          </div>
                          <Switch
                            id="notifications"
                            checked={preferences.preferences.notifications}
                            onCheckedChange={(checked) => preferences.updatePreference('notifications', checked)}
                          />
                        </div>

                        <Separator />

                        <div>
                          <Label htmlFor="history-limit">{t('历史记录限制')}</Label>
                          <p className="text-sm text-muted-foreground mb-2">{t('最多保存的历史记录条数')}</p>
                          <Select
                            value={preferences.preferences.historyLimit.toString()}
                            onValueChange={(value) => preferences.updatePreference('historyLimit', parseInt(value))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="50">50</SelectItem>
                              <SelectItem value="100">100</SelectItem>
                              <SelectItem value="200">200</SelectItem>
                              <SelectItem value="500">500</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator />

                        <div className="pt-4">
                          <Button onClick={preferences.resetPreferences} variant="outline">
                            {t('重置为默认设置')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* 更新对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={step !== 'downloading'}>
          <DialogHeader>
            <DialogTitle>
              {step === 'confirm' && t('发现新版本')}
              {step === 'downloading' && t('正在下载更新')}
              {step === 'finished' && t('下载完成')}
            </DialogTitle>
            <DialogDescription>
              {step === 'confirm' &&
                `${t('检测到新版本')} ${updateInfo?.version}，${t('发布日期')}：${updateInfo?.date}。\n${t('更新内容')}：${updateInfo?.body}`}
              {step === 'downloading' && t('正在下载更新包，请稍候...')}
              {step === 'finished' && t('更新包已下载完成，点击下方按钮重启应用。')}
            </DialogDescription>
          </DialogHeader>
          {step === 'confirm' && (
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)} variant="secondary">
                {t('取消')}
              </Button>
              <Button onClick={handleUpdate}>{t('更新')}</Button>
            </DialogFooter>
          )}
          {step === 'downloading' && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-full bg-muted rounded h-3 overflow-hidden">
                <div className="bg-primary h-3 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-sm text-muted-foreground">{progress}%</div>
            </div>
          )}
          {step === 'finished' && (
            <DialogFooter>
              <Button onClick={handleRelaunch}>{t('重启应用')}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* 无更新对话框 */}
      <Dialog open={noUpdateDialog} onOpenChange={setNoUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('检查更新')}</DialogTitle>
            <DialogDescription>{t('没有检测到新版本')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setNoUpdateDialog(false)}>{t('取消')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 数据导入对话框 */}
      <Dialog open={importDialog} onOpenChange={setImportDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('导入数据')}</DialogTitle>
            <DialogDescription>{t('请确认要导入的数据内容，此操作将覆盖当前所有数据')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-32 w-full border rounded p-2">
              <pre className="text-xs">{importData.slice(0, 500)}...</pre>
            </ScrollArea>
            {importError && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{importError}</div>}
          </div>
          <DialogFooter>
            <Button onClick={() => setImportDialog(false)} variant="outline">
              {t('取消')}
            </Button>
            <Button onClick={handleImportData} disabled={!importData}>
              {t('确认导入')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空数据确认对话框 */}
      <AlertDialog open={clearDataDialog} onOpenChange={setClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('确认清空所有数据')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('此操作将永久删除所有历史记录、工具配置、偏好设置等数据，且无法恢复。确定要继续吗？')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('取消')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('确认清空')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
