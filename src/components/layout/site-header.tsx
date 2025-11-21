import { useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { IconSettings } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { SettingsDialog } from "../features/settings-dialog"
import { isDesktopApp } from "@/lib/utils"

export function SiteHeader() {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isDesktop = isDesktopApp()

  return (
    <>
      <header
        className={`flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sticky z-20 bg-background/95 backdrop-blur-md ${isDesktop ? "top-8" : "top-0"}`}
      >
        <div className="flex w-full items-center justify-between gap-1 p-4 lg:gap-2 lg:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center p-2"
            >
              <IconSettings className="size-4! sm:size-5! text-primary shrink-0" />
              <span className="sr-only">{t("navigation.settings", "设置")}</span>
            </Button>
          </div>
        </div>
      </header>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  )
}
