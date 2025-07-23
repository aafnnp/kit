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

  const IconComponent =
    tool.icon && Icons[tool.icon as keyof typeof Icons] ? Icons[tool.icon as keyof typeof Icons] : Icons.HelpCircle

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 ease-out hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.03] border-border/50 hover:border-primary/30 dark:hover:border-primary/40 dark:hover:shadow-primary/20 backdrop-blur-sm touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            {IconComponent && (
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 dark:group-hover:bg-primary/25 transition-all duration-300 group-hover:scale-110 dark:text-primary-foreground/90 shrink-0">
                {React.createElement(IconComponent as React.ComponentType<any>, { 
                  className: 'h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:rotate-3 dark:drop-shadow-sm' 
                })}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm sm:text-base font-medium group-hover:text-primary dark:group-hover:text-primary/90 transition-colors duration-300 flex items-center gap-2 line-clamp-1">
                {tool.name}
                {tool.href && (
                  <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-80 dark:opacity-70 dark:group-hover:opacity-90 transition-opacity duration-300 shrink-0" />
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
              className={`h-7 w-7 sm:h-8 sm:w-8 p-0 opacity-60 sm:opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all duration-300 hover:scale-110 focus-visible:scale-110 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                isFavorite(tool.slug) 
                  ? 'text-red-500 dark:text-red-400 opacity-100' 
                  : 'text-muted-foreground hover:text-red-500 dark:hover:text-red-400'
              }`}
              aria-label={isFavorite(tool.slug) ? t('favorites.remove') : t('favorites.add')}
              tabIndex={0}
            >
              <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 hover:scale-110 ${
                isFavorite(tool.slug) ? 'fill-current' : ''
              }`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 p-3 sm:px-6 sm:pb-6">
        <CardDescription 
          id={`tool-desc-${tool.slug}`}
          className="text-xs sm:text-sm text-muted-foreground dark:text-muted-foreground/90 leading-relaxed group-hover:text-foreground/80 dark:group-hover:text-foreground/70 transition-colors duration-300 line-clamp-2"
        >
          {tool.desc[locale]}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
