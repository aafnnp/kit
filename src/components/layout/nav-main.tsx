import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import tools from "@/lib/data"
import { IconChevronRight } from "@tabler/icons-react"
import React, { useState, useEffect, useCallback, memo } from "react"
import { motion, AnimatePresence } from "motion/react"
import { useRouter, useLocation } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"
import { loadIconComponent, getLoadedIconComponent, preloadIcons } from "@/lib/data"
import { preloader } from "@/lib/data"
import { getToolLoaderBySlug } from "@/lib/data"
import { useRoutePrefetch } from "@/lib/routing"

function NavMainInner({ items }: { items: typeof tools }) {
  const router = useRouter()
  const { t } = useTranslation()
  const { prefetchOnHover } = useRoutePrefetch()

  const pathname = useLocation({ select: (l) => l.pathname })
  const match = pathname.match(/^\/tool\/([^\/]+)/)
  const currentSlug = match ? match[1] : null
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})
  const [iconComponents, setIconComponents] = useState<Record<string, React.ComponentType<any> | null>>({})

  useEffect(() => {
    const uniqueIconNames = new Set<string>()
    items.forEach((group) => {
      group.tools.forEach((tool: any) => {
        if (tool.icon) {
          uniqueIconNames.add(tool.icon)
        }
      })
    })

    preloadIcons(Array.from(uniqueIconNames))

    uniqueIconNames.forEach((iconName) => {
      // Only load if not already loaded or loading
      if (iconComponents[iconName] !== undefined) return

      loadIconComponent(iconName)
        .then((component) => {
          setIconComponents((prev) => {
            // Avoid unnecessary updates if component is already set
            if (prev[iconName] === component) return prev
            return {
              ...prev,
              [iconName]: component,
            }
          })
        })
        .catch(() => {
          // Set to null on error to prevent retrying
          setIconComponents((prev) => ({
            ...prev,
            [iconName]: null,
          }))
        })
    })
  }, [items]) // Remove iconComponents from dependencies to avoid infinite loop

  useEffect(() => {
    if (!currentSlug) return
    const group = items.find((item) => item.tools.some((tool) => tool.slug === currentSlug))
    if (group && !openMap[group.id]) {
      setOpenMap((prev) => ({ ...prev, [group.id]: true }))
    }
  }, [currentSlug, items, openMap])

  const toggleGroup = useCallback((id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1 sm:gap-2">
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const isOpen = !!openMap[item.id]
            return (
              <SidebarGroup key={item.id}>
                <div
                  className="flex items-center gap-2 mb-1 sm:mb-2 justify-between cursor-pointer select-none px-2 py-1.5 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors touch-manipulation"
                  onClick={() => toggleGroup(item.id)}
                >
                  <span className="text-xs sm:text-sm font-medium truncate">{t(`tools.${item.id}`)}</span>
                  <IconChevronRight
                    className={`size-3.5! sm:size-4! transition-transform shrink-0 ${isOpen ? "rotate-90" : ""}`}
                  />
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="tools-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      {item.tools.map((tool: any) => {
                        const isSelected = tool.slug === currentSlug
                        const iconName = tool.icon
                        const IconComponent = iconName
                          ? iconComponents[iconName] || getLoadedIconComponent(iconName)
                          : null
                        return (
                          <SidebarMenuItem key={tool.slug}>
                            <SidebarMenuButton
                              isActive={isSelected}
                              tooltip={t(`tools.${tool.slug}-desc`)}
                              ref={(el) => {
                                if (!el) return
                                // 可视即预加载
                                const modulePath = `/src/components/tools/${tool.slug}/index.tsx`
                                preloader.preloadOnVisible(el, modulePath)
                              }}
                              onClick={() => {
                                if (tool.href) {
                                  window.open(tool.href, "_blank")
                                  return
                                }
                                router.navigate({ to: `/tool/${tool.slug}` })
                              }}
                              onMouseEnter={() => {
                                // 悬停预加载（使用增强的预取功能）
                                prefetchOnHover(tool.slug)
                              }}
                              onFocus={() => {
                                // 键盘可达性预加载
                                const loader = getToolLoaderBySlug(tool.slug)
                                if (loader) {
                                  loader()
                                }
                              }}
                            >
                              {IconComponent ? (
                                <IconComponent className="size-3.5 sm:size-4 mr-1.5 sm:mr-2 text-primary shrink-0" />
                              ) : (
                                <div className="size-3.5 sm:size-4 mr-1.5 sm:mr-2 text-primary shrink-0">
                                  {tool.name?.charAt(0).toUpperCase() || ""}
                                </div>
                              )}
                              <span className="truncate">{t(`tools.${tool.slug}`)}</span>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </SidebarGroup>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export const NavMain = memo(NavMainInner)
