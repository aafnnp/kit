import { useTranslation } from "react-i18next"
import { useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { usePersistence } from "@/lib/storage"
import { Download, Upload, Trash2, History, Settings2, Database, Zap, X } from "lucide-react"
import { ResourceOptimization } from "@/components/monitoring"
import { CacheStrategyManager } from "@/components/monitoring"
import type { SettingsStep, UpdateInfo } from "@/types/settings"
import { version } from "../../../package.json"
import { isDesktopApp, getDesktopApi } from "@/lib/utils"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system")
  const locale = i18n.language.startsWith("en") ? "en" : "zh"

  // 判断是否为桌面版（Electron 应用）
  const isDesktop = isDesktopApp()

  // 数据持久化相关
  const { history, configs, preferences, exportImport } = usePersistence()
  const [clearDataDialog, setClearDataDialog] = useState(false)
  const [importDialog, setImportDialog] = useState(false)
  const [importData, setImportData] = useState("")
  const [importError, setImportError] = useState("")

  // 检查更新相关状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [step, setStep] = useState<SettingsStep>("idle")
  const [contentLength, setContentLength] = useState(0)
  const [downloaded, setDownloaded] = useState(0)
  const [noUpdateDialog, setNoUpdateDialog] = useState(false)

  const progress = useMemo(() => {
    return contentLength ? Math.round((downloaded / contentLength) * 100) : 0
  }, [contentLength, downloaded])

  const checkForUpdates = async () => {
    const desktopApi = getDesktopApi()

    if (desktopApi?.updater) {
      try {
        const update = await desktopApi.updater.check()
        if (update) {
          setUpdateInfo({
            version: update.version,
            date: update.date,
            body: update.body,
            downloadAndInstall: async (cb: (event: any) => void) => {
              await desktopApi.updater.downloadAndInstall(cb)
            },
          })
          setStep("confirm")
          setDialogOpen(true)
        } else {
          setNoUpdateDialog(true)
        }
      } catch (error) {
        console.error("Update check failed:", error)
        setNoUpdateDialog(true)
      }
    } else {
      setNoUpdateDialog(true)
    }
  }

  const handleUpdate = async () => {
    if (!updateInfo) return
    setStep("downloading")
    setDownloaded(0)
    setContentLength(0)
    await updateInfo.downloadAndInstall((event: any) => {
      switch (event.event) {
        case "Started":
          setContentLength(event.data.contentLength || 0)
          setDownloaded(0)
          break
        case "Progress":
          if (typeof event.data.downloaded === "number") {
            setDownloaded(event.data.downloaded)
          } else if (typeof event.data.chunkLength === "number") {
            setDownloaded((prev) => prev + event.data.chunkLength)
          }
          break
        case "Finished":
          setStep("finished")
          break
      }
    })
  }

  const handleRelaunch = async () => {
    const desktopApi = getDesktopApi()
    if (desktopApi) {
      await desktopApi.relaunch()
    }
  }

  // 数据管理相关函数
  const handleExportData = async () => {
    try {
      await exportImport.downloadData()
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const handleImportData = async () => {
    try {
      setImportError("")
      await exportImport.importData(importData)
      setImportDialog(false)
      setImportData("")
    } catch (error) {
      setImportError((error as Error).message)
    }
  }

  const handleClearAllData = async () => {
    try {
      exportImport.clearAllData()
      setClearDataDialog(false)
    } catch (error) {
      console.error("Clear data failed:", error)
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
    document.documentElement.classList.remove("light", "dark")
    if (theme === "system") {
      // 跟随系统
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      if (mq.matches) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.add("light")
      }
    } else {
      document.documentElement.classList.add(theme)
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => onOpenChange(false)}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background border rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <Settings2 className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">{t("settings.title")}</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 内容 */}
          <div className="p-6">
            <Tabs
              defaultValue="general"
              className="h-full flex flex-col"
            >
              <TabsList className="grid w-full grid-cols-6 mb-4">
                <TabsTrigger
                  value="general"
                  className="flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  {t("settings.general")}
                </TabsTrigger>
                <TabsTrigger
                  value="optimization"
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  {t("settings.resourceOptimization.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="cache-strategy"
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  {t("settings.cacheStrategy.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="data"
                  className="flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  {t("settings.dataManagement.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="flex items-center gap-2"
                >
                  <History className="w-4 h-4" />
                  {t("settings.useHistory.title")}
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="flex items-center gap-2"
                >
                  <Settings2 className="w-4 h-4" />
                  {t("settings.preferences.title")}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                {/* 通用设置 */}
                <TabsContent value="general">
                  <Card className="p-6">
                    <div className="space-y-6">
                      <div>
                        <div className="font-medium mb-2">{t("settings.theme")}</div>
                        <Select
                          value={theme}
                          onValueChange={setTheme}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="light">{t("settings.light")}</SelectItem>
                              <SelectItem value="dark">{t("settings.dark")}</SelectItem>
                              <SelectItem value="system">{t("settings.system")}</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      <div>
                        <div className="font-medium mb-2">{t("settings.language")}</div>
                        <div className="flex gap-2">
                          <Button
                            variant={locale === "zh" ? "default" : "outline"}
                            onClick={() => i18n.changeLanguage("zh")}
                            disabled={locale === "zh"}
                          >
                            {t("settings.chinese")}
                          </Button>
                          <Button
                            variant={locale === "en" ? "default" : "outline"}
                            onClick={() => i18n.changeLanguage("en")}
                            disabled={locale === "en"}
                          >
                            {t("settings.english")}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="font-medium mb-2">{t("settings.currentVersion")}</div>
                        <div className="flex items-center gap-4">
                          <span className="text-base font-mono">v{version}</span>
                          {isDesktop && (
                            <Button
                              variant="outline"
                              onClick={checkForUpdates}
                            >
                              {t("settings.checkForUpdates")}
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
                        <h3 className="text-lg font-medium mb-4">{t("settings.dataManagement.subTitle")}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Button
                              onClick={handleExportData}
                              className="w-full"
                              variant="outline"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              {t("settings.dataManagement.export")}
                            </Button>
                            <p className="text-sm text-muted-foreground">{t("settings.dataManagement.exportDesc")}</p>
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
                              <Button
                                asChild
                                className="w-full"
                                variant="outline"
                              >
                                <Label
                                  htmlFor="import-file"
                                  className="cursor-pointer"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {t("settings.dataManagement.import")}
                                </Label>
                              </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{t("settings.dataManagement.importDesc")}</p>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-4">{t("settings.dataManagement.dataStatistics")}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{history.history.length}</div>
                            <div className="text-sm text-muted-foreground">{t("settings.dataManagement.history")}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{configs.configs.length}</div>
                            <div className="text-sm text-muted-foreground">{t("settings.dataManagement.config")}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">{history.getRecentTools().length}</div>
                            <div className="text-sm text-muted-foreground">{t("settings.dataManagement.recent")}</div>
                          </div>
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold">
                              {Math.round(((localStorage.getItem("kit-favorites")?.length || 2) / 1024) * 100) / 100}KB
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {t("settings.dataManagement.storageSize")}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-lg font-medium mb-4 text-destructive">
                          {t("settings.dataManagement.dangerOperation")}
                        </h3>
                        <Button
                          onClick={() => setClearDataDialog(true)}
                          variant="destructive"
                          className="w-full md:w-auto"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("settings.dataManagement.dangerOperationDesc")}
                        </Button>
                        <p className="text-sm text-muted-foreground mt-2">
                          {t("settings.dataManagement.dangerOperationBrief")}
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
                        <h3 className="text-lg font-medium">{t("settings.useHistory.title")}</h3>
                        <Button
                          onClick={history.clearHistory}
                          variant="outline"
                          size="sm"
                          disabled={history.history.length === 0}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {t("settings.useHistory.clear")}
                        </Button>
                      </div>

                      <ScrollArea className="h-96">
                        {history.history.length === 0 ? (
                          <div className="text-center py-8 text-muted-foreground">{t("settings.useHistory.empty")}</div>
                        ) : (
                          <div className="space-y-2">
                            {history.history.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="font-medium">{item.toolName}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {new Date(item.timestamp).toLocaleString()}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={item.success ? "default" : "destructive"}>
                                    {item.success ? t("settings.useHistory.success") : t("settings.useHistory.failed")}
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
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="auto-save">{t("settings.preferences.autoSave")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.preferences.autoSaveDesc")}</p>
                          </div>
                          <Switch
                            id="auto-save"
                            checked={preferences.preferences.autoSave}
                            onCheckedChange={(checked) => preferences.updatePreference("autoSave", checked)}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="show-tips">{t("settings.preferences.displayPrompt")}</Label>
                            <p className="text-sm text-muted-foreground">
                              {t("settings.preferences.displayPromptDesc")}
                            </p>
                          </div>
                          <Switch
                            id="show-tips"
                            checked={preferences.preferences.showTips}
                            onCheckedChange={(checked) => preferences.updatePreference("showTips", checked)}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="compact-mode">{t("settings.preferences.compactMode")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.preferences.compactModeDesc")}</p>
                          </div>
                          <Switch
                            id="compact-mode"
                            checked={preferences.preferences.compactMode}
                            onCheckedChange={(checked) => preferences.updatePreference("compactMode", checked)}
                          />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          <div>
                            <Label htmlFor="notifications">{t("settings.preferences.notice")}</Label>
                            <p className="text-sm text-muted-foreground">{t("settings.preferences.noticeDesc")}</p>
                          </div>
                          <Switch
                            id="notifications"
                            checked={preferences.preferences.notifications}
                            onCheckedChange={(checked) => preferences.updatePreference("notifications", checked)}
                          />
                        </div>

                        <Separator />

                        <div>
                          <Label htmlFor="history-limit">{t("settings.preferences.historyLimit")}</Label>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t("settings.preferences.historyLimitDesc")}
                          </p>
                          <Select
                            value={preferences.preferences.historyLimit.toString()}
                            onValueChange={(value) => preferences.updatePreference("historyLimit", parseInt(value))}
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
                          <Button
                            onClick={preferences.resetPreferences}
                            variant="outline"
                          >
                            {t("settings.preferences.resetToDefault")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>
        </motion.div>
      </motion.div>

      {/* 更新对话框 */}
      <AlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {step === "confirm" && t("发现新版本")}
              {step === "downloading" && t("正在下载更新")}
              {step === "finished" && t("下载完成")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {step === "confirm" &&
                `${t("检测到新版本")} ${updateInfo?.version}，${t("发布日期")}：${updateInfo?.date}。\n${t("更新内容")}：${updateInfo?.body}`}
              {step === "downloading" && t("正在下载更新包，请稍候...")}
              {step === "finished" && t("更新包已下载完成，点击下方按钮重启应用。")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {step === "confirm" && (
            <AlertDialogFooter>
              <Button
                onClick={() => setDialogOpen(false)}
                variant="secondary"
              >
                {t("取消")}
              </Button>
              <Button onClick={handleUpdate}>{t("更新")}</Button>
            </AlertDialogFooter>
          )}
          {step === "downloading" && (
            <div className="w-full flex flex-col items-center gap-4">
              <div className="w-full bg-muted rounded h-3 overflow-hidden">
                <div
                  className="bg-primary h-3 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-sm text-muted-foreground">{progress}%</div>
            </div>
          )}
          {step === "finished" && (
            <AlertDialogFooter>
              <Button onClick={handleRelaunch}>{t("重启应用")}</Button>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>

      {/* 无更新对话框 */}
      <AlertDialog
        open={noUpdateDialog}
        onOpenChange={setNoUpdateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("检查更新")}</AlertDialogTitle>
            <AlertDialogDescription>{t("没有检测到新版本")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setNoUpdateDialog(false)}>{t("取消")}</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 数据导入对话框 */}
      <AlertDialog
        open={importDialog}
        onOpenChange={setImportDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("导入数据")}</AlertDialogTitle>
            <AlertDialogDescription>{t("请确认要导入的数据内容，此操作将覆盖当前所有数据")}</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <ScrollArea className="h-32 w-full border rounded p-2">
              <pre className="text-xs">{importData.slice(0, 500)}...</pre>
            </ScrollArea>
            {importError && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">{importError}</div>}
          </div>
          <AlertDialogFooter>
            <Button
              onClick={() => setImportDialog(false)}
              variant="outline"
            >
              {t("取消")}
            </Button>
            <Button
              onClick={handleImportData}
              disabled={!importData}
            >
              {t("确认导入")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 清空数据确认对话框 */}
      <AlertDialog
        open={clearDataDialog}
        onOpenChange={setClearDataDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("确认清空所有数据")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("此操作将永久删除所有历史记录、工具配置、偏好设置等数据，且无法恢复。确定要继续吗？")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("取消")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllData}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("确认清空")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  )
}
