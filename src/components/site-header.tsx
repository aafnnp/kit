import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { ask } from '@tauri-apps/plugin-dialog'

export function SiteHeader() {
  const checkForUpdates = async () => {
    const update = await check()
    let downloaded = 0
    let contentLength = 0
    if (update) {
      const result = await ask(`Update found ${update.version} from ${update.date} with notes ${update.body}`, {
        title: 'Update found',
        kind: 'info',
        okLabel: 'Update',
        cancelLabel: 'Cancel',
      })
      if (result) {
        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case 'Started':
              contentLength = event.data.contentLength || 0
              console.log(`started downloading ${event.data.contentLength} bytes`)
              break
            case 'Progress':
              downloaded += event.data.chunkLength
              console.log(`downloaded ${downloaded} from ${contentLength}`)
              break
            case 'Finished':
              console.log('download finished')
              break
          }
        })
        await relaunch()
      }
    } else {
      alert('No update found')
    }
  }
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <Button variant="ghost" size="sm" onClick={checkForUpdates}>
          Check for updates
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
  )
}
