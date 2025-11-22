import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { type SearchBarProps } from "@/components/features/schemas"

// Re-export type for backward compatibility
export type { SearchBarProps }

export function SearchBar({ value, onChange, placeholder }: SearchBarProps) {
  const { t } = useTranslation()

  const handleClearKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onChange("")
    }
  }

  return (
    <div
      className="relative w-full max-w-md"
      role="search"
    >
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t("search.placeholder", "搜索工具...")}
        className="pl-10 pr-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        autoComplete="off"
        spellCheck={false}
      />
      {value && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange("")}
          onKeyDown={handleClearKeyDown}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          id="search-clear-button"
          tabIndex={0}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
