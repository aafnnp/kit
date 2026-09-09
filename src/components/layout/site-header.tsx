import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconSettings } from "@tabler/icons-react"
import { useTranslation } from "react-i18next"
import { SettingsDialog } from "../features/settings-dialog"
import { isDesktopApp } from "@/lib/utils"
import { useLocation } from "@tanstack/react-router"
import tools, { findTool } from "@/lib/data"

export function SiteHeader() {
  const { t } = useTranslation()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const isDesktop = isDesktopApp()
  const location = useLocation()

  const contextLabel = useMemo(() => {
    const pathname = location.pathname
    if (pathname === "/") {
      return t("navigation.home")
    }

    const match = pathname.match(/^\/tool\/([^/]+)/)
    if (match) {
      const slug = match[1]
      const tool = findTool(tools, slug)
      const toolName = tool ? t(`tools.${tool.slug}`, tool.name) : slug
      return `${t("navigation.tools")} / ${toolName}`
    }

    return t("navigation.tools")
  }, [location.pathname, t])

  return (
    <>
      <header
        className={`flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) sticky z-20 bg-background/95 backdrop-blur-md ${isDesktop ? "top-8" : "top-0"}`}
      >
        <div className="flex w-full items-center justify-between gap-1 p-4 lg:gap-2 lg:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium tracking-tight text-muted-foreground">{contextLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <Input
                placeholder={t("navigation.search-tools")}
                className="h-8 w-48 lg:w-64 text-sm"
                aria-label={t("navigation.search-tools")}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center justify-center p-2"
            >
              <IconSettings className="size-4! sm:size-5! text-primary shrink-0" />
              <span className="sr-only">{t("navigation.settings")}</span>
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
