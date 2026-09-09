import { motion } from "motion/react"
import { ArrowUpRight, Search, Sparkles } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"

interface DashboardHeroProps {
  title: string
  description: string
  toolCount: number
  categoryCount: number
  searchQuery: string
  onSearchChange: (value: string) => void
}

export function DashboardHero({
  title,
  description,
  toolCount,
  categoryCount,
  searchQuery,
  onSearchChange,
}: DashboardHeroProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative mb-8 overflow-hidden border-b border-border/70 pb-8 pt-3 sm:mb-10 sm:pb-10 sm:pt-5"
    >
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-end lg:gap-12">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Sparkles className="size-3.5" />
            <span>{t("dashboard.workspace")}</span>
          </div>
          <h1 className="max-w-2xl text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>
              <strong className="mr-1 text-foreground">{toolCount}</strong>
              {t("dashboard.tools-count")}
            </span>
            <span>
              <strong className="mr-1 text-foreground">{categoryCount}</strong>
              {t("dashboard.categories-count")}
            </span>
            <span className="inline-flex items-center gap-1 text-primary">
              {t("dashboard.local-first")} <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </div>

        <label className="relative block" htmlFor="dashboard-search">
          <span className="sr-only">{t("search.placeholder")}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="dashboard-search"
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("search.placeholder")}
            className="h-12 rounded-xl border-border/80 bg-background/80 pl-11 pr-4 text-sm shadow-[0_12px_30px_-20px_hsl(var(--primary))] transition-shadow focus-visible:shadow-[0_14px_36px_-18px_hsl(var(--primary))]"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>
    </motion.div>
  )
}
