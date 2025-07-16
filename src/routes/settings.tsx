import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectGroup, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

const VERSION = import.meta.env.VITE_APP_VERSION || '0.0.1'

export const Route = createFileRoute('/settings')({
  component: RouteComponent,
})

function RouteComponent() {
  const { t, i18n } = useTranslation()
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system')
  const locale = i18n.language.startsWith('en') ? 'en' : 'zh'

  // 检查更新相关状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [step, setStep] = useState<'idle' | 'confirm' | 'downloading' | 'finished'>('idle')
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
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('设置')}</h1>
      <Card className="mb-6 p-8 flex flex-col gap-8">
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
        <div>
          <div className="font-medium mb-2">{t('当前版本')}</div>
          <div className="flex items-center gap-4">
            <span className="text-base font-mono">v{VERSION}</span>
            <Button variant="outline" onClick={checkForUpdates}>
              {t('检查更新')}
            </Button>
          </div>
        </div>
      </Card>
      <div className="text-muted-foreground text-xs text-center">Kit © {new Date().getFullYear()}</div>

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
    </div>
  )
}
