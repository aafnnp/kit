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
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isOpen = !!openMap[item.id]
            return (
              <SidebarGroup key={item.id}>
                <div
                  className="flex items-center gap-2 mb-2 justify-between cursor-pointer select-none"
                  onClick={() => toggleGroup(item.id)}
                >
                  <span className="text-sm font-medium">{item.type.zh}</span>
                  <IconChevronRight className={`!size-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
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
                          <SidebarMenuItem
                            key={tool.slug}
                            onClick={() => {
                              if (tool.href) {
                                window.open(tool.href, '_blank')
                                return
                              }
                              router.navigate({ to: `/tool/${tool.slug}` })
                            }}
                          >
                            <SidebarMenuButton
                              tooltip={tool.desc[locale]}
                              className={`${isSelected ? 'bg-accent text-accent-foreground' : ''} transition-colors hover:bg-primary/10 dark:hover:bg-primary/20`}
                            >
                              {tool.icon && typeof tool.icon === 'string' && Icons[tool.icon as keyof typeof Icons] ? 
                                React.createElement(Icons[tool.icon as keyof typeof Icons] as React.ComponentType<any>, { className: "size-4 mr-2 text-primary" }) : 
                                null
                              }
                              <span>{tool.name}</span>
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
