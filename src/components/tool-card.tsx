import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Heart, ExternalLink, HelpCircle } from 'lucide-react'
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(tool)
  }

  const IconComponent = tool.icon && Icons[tool.icon as keyof typeof Icons] 
    ? Icons[tool.icon as keyof typeof Icons] 
    : Icons.HelpCircle

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-border/50 hover:border-border"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {IconComponent && (
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                {React.createElement(IconComponent, { className: "h-5 w-5" })}
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-base font-medium group-hover:text-primary transition-colors flex items-center gap-2">
                {tool.name}
                {tool.href && <ExternalLink className="h-3 w-3 opacity-60" />}
              </CardTitle>
            </div>
          </div>
          {showFavoriteButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavoriteClick}
              className={`h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                isFavorite(tool.slug) ? 'text-red-500 opacity-100' : 'text-muted-foreground hover:text-red-500'
              }`}
              aria-label={isFavorite(tool.slug) ? t('favorites.remove') : t('favorites.add')}
            >
              <Heart className={`h-4 w-4 ${isFavorite(tool.slug) ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm text-muted-foreground leading-relaxed">
          {tool.desc[locale]}
        </CardDescription>
      </CardContent>
    </Card>
  )
}