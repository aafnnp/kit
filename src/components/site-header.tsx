import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

export function SiteHeader() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState<any>(null)
  const [step, setStep] = useState<'idle' | 'confirm' | 'downloading' | 'finished'>('idle')
  const [contentLength, setContentLength] = useState(0)
  const [downloaded, setDownloaded] = useState(0)

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
      alert('没有检测到新版本')
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

  return (
    <>
      <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
          <Button variant="ghost" size="sm" onClick={checkForUpdates}>
            检查更新
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
              <a
                href="https://github.com/aafnnp/kit"
                rel="noopener noreferrer"
                target="_blank"
                className="dark:text-foreground"
              >
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={step !== 'downloading'}>
          <DialogHeader>
            <DialogTitle>
              {step === 'confirm' && '发现新版本'}
              {step === 'downloading' && '正在下载更新'}
              {step === 'finished' && '下载完成'}
            </DialogTitle>
            <DialogDescription>
              {step === 'confirm' &&
                `检测到新版本 ${updateInfo?.version}，发布日期：${updateInfo?.date}。\n更新内容：${updateInfo?.body}`}
              {step === 'downloading' && `正在下载更新包，请稍候...`}
              {step === 'finished' && `更新包已下载完成，点击下方按钮重启应用。`}
            </DialogDescription>
          </DialogHeader>
          {step === 'confirm' && (
            <DialogFooter>
              <Button onClick={() => setDialogOpen(false)} variant="secondary">
                取消
              </Button>
              <Button onClick={handleUpdate}>更新</Button>
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
              <Button onClick={handleRelaunch}>重启应用</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
