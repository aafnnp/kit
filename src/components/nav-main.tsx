import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import tools from '@/lib/data'
import { IconChevronRight } from '@tabler/icons-react'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useRouter, useLocation } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import * as Icons from 'lucide-react'

export function NavMain({ items }: { items: typeof tools }) {
  const router = useRouter()
  const { i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'zh'

  // 获取当前 url 的 slug
  const pathname = useLocation({ select: (l) => l.pathname })
  const match = pathname.match(/^\/tool\/([^\/]+)/)
  const currentSlug = match ? match[1] : null
  // 用对象存储每个 group 的展开状态
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({})

  // 自动展开包含当前 slug 的 group
  useEffect(() => {
    if (!currentSlug) return
    const group = items.find((item) => item.tools.some((tool) => tool.slug === currentSlug))
    if (group && !openMap[group.id]) {
      setOpenMap((prev) => ({ ...prev, [group.id]: true }))
    }
  }, [currentSlug, items, openMap])

  const toggleGroup = (id: string) => {
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }
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
                  <span className="text-xs sm:text-sm font-medium truncate">{item.type.zh}</span>
                  <IconChevronRight
                    className={`!size-3.5 sm:!size-4 transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                  />
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="tools-list"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      {item.tools.map((tool: any) => {
                        const isSelected = tool.slug === currentSlug
                        return (
                          <SidebarMenuItem key={tool.slug}>
                            <SidebarMenuButton
                              isActive={isSelected}
                              tooltip={tool.desc[locale]}
                              onClick={() => {
                                if (tool.href) {
                                  window.open(tool.href, '_blank')
                                  return
                                }
                                router.navigate({ to: `/tool/${tool.slug}` })
                              }}
                            >
                              {tool.icon && typeof tool.icon === 'string' && Icons[tool.icon as keyof typeof Icons]
                                ? React.createElement(
                                    Icons[tool.icon as keyof typeof Icons] as React.ComponentType<any>,
                                    { className: 'size-3.5 sm:size-4 mr-1.5 sm:mr-2 text-primary shrink-0' }
                                  )
                                : null}
                              <span className="truncate">{tool.name}</span>
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
