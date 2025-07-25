import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRouter } from '@tanstack/react-router'
import { useFavorites, useRecentTools } from '@/lib/favorites'
import * as Icons from 'lucide-react'

interface Tool {
  slug: string
  name: string
  desc: { zh: string; en: string }
  icon?: string
  href?: string
}

interface ToolCardProps {
  tool: Tool
  showFavoriteButton?: boolean
  onClick?: () => void
}

export function ToolCard({ tool, showFavoriteButton = true, onClick }: ToolCardProps) {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { addToRecent } = useRecentTools()
  const locale = i18n.language.startsWith('en') ? 'en' : 'zh'

  const handleClick = () => {
    addToRecent(tool)
    onClick?.()

    if (tool.href) {
      window.open(tool.href, '_blank')
    } else {
      router.navigate({ to: `/tool/${tool.slug}` })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(tool)
  }

  const handleFavoriteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      toggleFavorite(tool)
    }
  }

  const IconComponent = tool.icon && Icons[tool.icon as keyof typeof Icons] ? Icons[tool.icon as keyof typeof Icons] : null
  const firstLetter = tool.name.charAt(0).toUpperCase()

  return (
    <Card
      className="group cursor-pointer transition-all duration-500 ease-out hover:shadow-xl hover:shadow-primary/15 hover:scale-[1.02] border-border/50 hover:border-primary/40 dark:hover:border-primary/50 dark:hover:shadow-primary/25 backdrop-blur-sm touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:-translate-y-1 active:scale-[0.98] active:translate-y-0 will-change-transform tool-card-xs sm:tool-card-mobile md:tool-card-tablet lg:tool-card-desktop"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${tool.name} - ${tool.desc[locale]}`}
      aria-describedby={`tool-desc-${tool.slug}`}
    >
      <CardHeader className="pb-3 p-3 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-all duration-500 group-hover:scale-110 dark:text-primary-foreground/90 shrink-0 group-hover:shadow-lg group-hover:shadow-primary/20 dark:group-hover:shadow-primary/30">
              {IconComponent ? (
                React.createElement(IconComponent as React.ComponentType<any>, { 
                  className: 'h-4 w-4 sm:h-5 sm:w-5 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 dark:drop-shadow-md' 
                })
              ) : (
                <div className="h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-semibold text-xs sm:text-sm transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 dark:drop-shadow-md">
                  {firstLetter}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-medium group-hover:text-primary dark:group-hover:text-primary/95 transition-all duration-500 flex items-center gap-2 line-clamp-1 group-hover:font-semibold">
                {tool.name}
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
              className={`h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-60 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-500 hover:scale-125 focus-visible:scale-125 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-red-50 dark:hover:bg-red-950/30 hover:shadow-lg hover:shadow-red-500/20 dark:hover:shadow-red-400/20 ${
                isFavorite(tool.slug) 
                  ? 'text-red-500 dark:text-red-400 opacity-100 bg-red-50 dark:bg-red-950/20' 
                  : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400'
              }`}
              aria-label={isFavorite(tool.slug) ? t('favorites.remove') : t('favorites.add')}
              tabIndex={0}
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-500 hover:scale-110 hover:rotate-12 ${
                isFavorite(tool.slug) ? 'fill-current animate-pulse' : ''
              }`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:px-6 sm:pb-6">
        <CardDescription 
          id={`tool-desc-${tool.slug}`}
          className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/90 leading-relaxed group-hover:text-foreground/90 dark:group-hover:text-foreground/85 transition-all duration-500 line-clamp-2 group-hover:font-medium"
        >
          {tool.desc[locale]}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
