import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const { t } = useTranslation()

  const handleClearKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onChange('')
    }
  }

  return (
    <div className="relative w-full max-w-md" role="search">
      <Search 
        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" 
        aria-hidden="true"
      />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('search.placeholder', '搜索工具...')}
        className="pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={t('search.label', '搜索工具')}
        aria-describedby={value ? 'search-clear-button' : undefined}
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange('')}
          onKeyDown={handleClearKeyDown}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={t('search.clear', '清除搜索')}
          id="search-clear-button"
          tabIndex={0}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </Button>
      )}
    </div>
  )
}
