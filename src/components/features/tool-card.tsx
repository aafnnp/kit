import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useRouter } from "@tanstack/react-router"
import { useFavorites, useRecentTools } from "@/hooks/use-favorites"
import { getDesktopApi } from "@/lib/utils"
import { logger } from "@/lib/data/logger"
import { preloader } from "@/lib/data"
import { loadIconComponent, getLoadedIconComponent } from "@/lib/data"
import { type ToolCardProps } from "@/components/features/schemas"

// Re-export type for backward compatibility
export type { ToolCardProps }

function ToolCardComponent({ tool, showFavoriteButton = true, onClick }: ToolCardProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { addToRecent } = useRecentTools()

  const [IconComponent, setIconComponent] = useState<React.ComponentType<any> | null>(null)
  const iconName = tool.icon

  useEffect(() => {
    if (!iconName) return
    const cached = getLoadedIconComponent(iconName)
    if (cached) {
      setIconComponent(cached)
      return
    }

    loadIconComponent(iconName)
      .then((component) => {
        if (component) {
          setIconComponent(() => component)
        }
      })
      .catch(() => {})
  }, [iconName])

  const handleClick = () => {
    addToRecent(tool)
    onClick?.()

    if (tool.href) {
      const desktopApi = getDesktopApi()
      if (desktopApi?.openExternal) {
        desktopApi.openExternal(tool.href).catch((err: unknown) => {
          logger.error("Failed to open external link", err)
        })
      } else {
        window.open(tool.href, "_blank")
      }
    } else {
      router.navigate({ to: `/tool/${tool.slug}` })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handleClick()
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(tool)
  }

  const handleFavoriteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      e.stopPropagation()
      toggleFavorite(tool)
    }
  }

  const firstLetter = useMemo(() => tool.name?.charAt(0).toUpperCase() || "", [tool.name])

  return (
    <Card
      className="group cursor-pointer gap-2! sm:gap-3! transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 dark:hover:border-primary/40 dark:hover:shadow-primary/20 border border-border/60 bg-linear-to-b from-card via-card/90 to-card/80 dark:from-muted/20 dark:via-muted/10 dark:to-background/40 backdrop-blur-xl touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 will-change-transform tool-card-xs tool-card-mobile tool-card-tablet tool-card-desktop rounded-2xl"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        preloader.preload(tool.slug, "high").catch(() => {})
      }}
      tabIndex={0}
      role="button"
    >
      <CardHeader className="pb-2.5 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-xl bg-linear-to-br from-blue-500 to-cyan-500 text-white ring-1 ring-white/20 shadow-sm shadow-blue-500/25 group-hover:from-blue-500 group-hover:to-cyan-400 group-hover:shadow-lg group-hover:shadow-blue-500/40 transition-all duration-500 group-hover:scale-110 shrink-0">
              {IconComponent ? (
                <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 drop-shadow-sm" />
              ) : (
                <div className="h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center font-semibold text-sm sm:text-base transition-all duration-500 group-hover:-rotate-6 group-hover:scale-110 drop-shadow-sm">
                  {firstLetter}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg font-semibold tracking-tight group-hover:text-primary dark:group-hover:text-primary/95 transition-all duration-500 flex items-center gap-2 min-w-0">
                <span className="min-w-0 truncate">{t(`tools.${tool.slug}`, tool.name)}</span>
                {tool.href && (
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-90 dark:opacity-70 dark:group-hover:opacity-100 transition-all duration-500 shrink-0 group-hover:scale-110" />
                )}
              </CardTitle>
            </div>
          </div>
          {showFavoriteButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteClick}
              onKeyDown={handleFavoriteKeyDown}
              className={`h-8 w-8 sm:h-9 sm:w-9 p-0 opacity-70 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-500 hover:scale-125 focus-visible:scale-125 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-red-50 dark:hover:bg-red-950/30 hover:shadow-lg hover:shadow-red-500/20 dark:hover:shadow-red-400/20 rounded-full ${
                isFavorite(tool.slug)
                  ? "text-red-500 dark:text-red-400 opacity-100 bg-red-50 dark:bg-red-950/20"
                  : "text-muted-foreground hover:text-red-500 dark:hover:text-red-400"
              }`}
              tabIndex={0}
            >
              <Heart
                className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-500 hover:scale-110 hover:rotate-12 ${
                  isFavorite(tool.slug) ? "fill-current animate-pulse" : ""
                }`}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:px-4 sm:pb-4">
        <CardDescription
          id={`tool-desc-${tool.slug}`}
          className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/90 leading-relaxed group-hover:text-foreground/90 dark:group-hover:text-foreground/85 transition-all duration-500 line-clamp-2"
        >
          {t(`tools.${tool.slug}-desc`)}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

// Memoized component to prevent unnecessary re-renders
export const ToolCard = React.memo(ToolCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.tool.slug === nextProps.tool.slug &&
    prevProps.tool.name === nextProps.tool.name &&
    prevProps.tool.icon === nextProps.tool.icon &&
    prevProps.showFavoriteButton === nextProps.showFavoriteButton
  )
})
