import { computed, Scroll, Text, View } from "nsh"
import { Input } from "nsh/base"
import type { JSX } from "nsh"
import {
  activeSlug,
  appearance,
  clearSearch,
  focusSearch,
  isCollapsed,
  isFavorite,
  language,
  openSettings,
  openTool,
  recent,
  registerSearchInput,
  route,
  search,
  toggleCategory,
  toggleFavorite,
  favorites,
  goHome,
  search as searchSignal,
} from "../lib/state"
import { L, pick } from "../lib/locale"
import { categories, findTool, searchTools, toolsInCategory, visibleTools } from "../tools/registry"
import type { ToolDefinition } from "../tools/registry"
import { modKey, platformLabel } from "../lib/platform"
import { APP_VERSION } from "../lib/version"
import { BrandMark } from "./brand"

function NavRow(props: {
  icon: string
  label: string
  active?: boolean
  onPress: () => void
  right?: JSX.Element
  testID?: string
}) {
  return (
    <View
      role="button"
      onPress={props.onPress}
      testID={props.testID}
      class="h-8 flex-row items-center gap-2 rounded-md px-2 active:opacity-70"
      classList={{
        "bg-sidebar-accent": props.active === true,
        "hover:bg-sidebar-accent/60": props.active !== true,
      }}
    >
      <Text class="w-5 text-center text-sm">{props.icon}</Text>
      <Text
        class="flex-1 truncate text-xs"
        classList={{
          "font-medium text-sidebar-accent-foreground": props.active === true,
          "text-sidebar-foreground": props.active !== true,
        }}
      >
        {props.label}
      </Text>
      {props.right}
    </View>
  )
}

function ToolRow(props: { tool: ToolDefinition; active: boolean; testID: string }) {
  return (
    <NavRow
      icon={props.tool.icon}
      label={pick(props.tool.name)}
      active={props.active}
      onPress={() => openTool(props.tool.slug)}
      testID={props.testID}
      right={
        <View
          role="button"
          accessibilityLabel={L("收藏", "Favorite")}
          onPress={() => toggleFavorite(props.tool.slug)}
          class="h-6 w-6 items-center justify-center rounded-md active:bg-black/10"
        >
          <Text class="text-xs" classList={{ "text-brand-orange": isFavorite(props.tool.slug), "text-muted-foreground": !isFavorite(props.tool.slug) }}>
            {isFavorite(props.tool.slug) ? "★" : "☆"}
          </Text>
        </View>
      }
    />
  )
}

export function Sidebar() {
  const results = computed(() => searchTools(searchSignal()))
  const favouriteTools = computed(() => favorites().map(findTool).filter((tool): tool is ToolDefinition => Boolean(tool)))
  const recentTools = computed(() => recent().map(findTool).filter((tool): tool is ToolDefinition => Boolean(tool)))

  const submitSearch = () => {
    const first = results()[0]
    if (first) openTool(first.slug)
  }

  const cycleAppearance = () => {
    const current = appearance()
    appearance.set(current === "system" ? "light" : current === "light" ? "dark" : "system")
  }

  return (
    <View class="w-[268px] shrink-0 border-r border-sidebar-border bg-sidebar" testID="sidebar">
      <View class="gap-3 border-b border-sidebar-border p-3">
        <View class="flex-row items-center gap-2.5">
          <BrandMark size={36} testID="brand-mark" />
          <View class="flex-1 gap-0.5">
            <Text class="text-sm font-semibold text-sidebar-foreground">Kit</Text>
            <Text class="text-[10px] text-muted-foreground">{L("本地优先的工具箱", "Local-first toolbox")}</Text>
          </View>
          <Text class="text-[10px] text-muted-foreground">v{APP_VERSION}</Text>
        </View>

        <View class="h-8 flex-row items-center gap-2 rounded-(--radius) border border-sidebar-border bg-background px-2">
          <Text class="text-xs text-muted-foreground">🔍</Text>
          <Input
            ref={(node) => registerSearchInput(node)}
            value={search()}
            onChange={(value) => search.set(value)}
            onSubmit={submitSearch}
            placeholder={L(`搜索工具… ${modKey("K")}`, `Search tools… ${modKey("K")}`)}
            testID="global-search"
            class="h-8 flex-1 bg-transparent px-0 text-xs text-foreground placeholder:text-muted-foreground"
          />
          {search() ? (
            <View role="button" accessibilityLabel={L("清除搜索", "Clear search")} onPress={clearSearch} class="h-5 w-5 items-center justify-center rounded active:bg-muted">
              <Text class="text-[10px] text-muted-foreground">✕</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Scroll class="flex-1" contentClass="p-2 gap-1">
        <NavRow
          icon="🏠"
          label={L("所有工具", "All tools")}
          active={route().name === "home"}
          onPress={goHome}
          testID="nav-home"
          right={<Text class="text-[10px] text-muted-foreground">{visibleTools.length}</Text>}
        />

        <If when={search().trim().length > 0}>
          <View class="mt-2 gap-1">
            <Text class="px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {L(`搜索结果 · ${results().length}`, `Results · ${results().length}`)}
            </Text>
            <Each of={results()}>
              {(tool) => <ToolRow tool={tool()} active={activeSlug() === tool().slug} testID={`sidebar-tool-${tool().slug}`} />}
            </Each>
            <If when={results().length === 0}>
              <Text class="px-2 py-3 text-xs text-muted-foreground">{L("没有匹配的工具。", "No tools match.")}</Text>
            </If>
          </View>
        </If>

        <If when={search().trim().length === 0}>
          <If when={favouriteTools().length > 0}>
            <View class="mt-2 gap-1">
              <Text class="px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{L("收藏", "Favorites")}</Text>
              <Each of={favouriteTools()}>
                {(tool) => <ToolRow tool={tool()} active={activeSlug() === tool().slug} testID={`sidebar-favorite-${tool().slug}`} />}
              </Each>
            </View>
          </If>

          <If when={recentTools().length > 0}>
            <View class="mt-2 gap-1">
              <Text class="px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{L("最近使用", "Recent")}</Text>
              <Each of={recentTools()}>
                {(tool) => <ToolRow tool={tool()} active={activeSlug() === tool().slug} testID={`sidebar-recent-${tool().slug}`} />}
              </Each>
            </View>
          </If>

          <View class="mt-2 gap-1">
            {categories.map((category) => {
              const items = toolsInCategory(category.id)
              return (
                <View class="gap-0.5">
                  <View
                    role="button"
                    onPress={() => toggleCategory(category.id)}
                    testID={`category-${category.id}`}
                    class="h-8 flex-row items-center gap-1 rounded-md px-2 hover:bg-sidebar-accent/60 active:opacity-70"
                  >
                    <Text class="w-3 text-[10px] text-muted-foreground">{isCollapsed(category.id) ? "▸" : "▾"}</Text>
                    <Text class="w-5 text-center text-sm">{category.icon}</Text>
                    <Text class="flex-1 truncate text-xs text-sidebar-foreground">{pick(category.name)}</Text>
                    <Text class="text-[10px] text-muted-foreground">{items.length}</Text>
                  </View>
                  <If when={!isCollapsed(category.id)}>
                    <View class="gap-0.5 pl-3">
                      <Each of={items}>
                        {(tool) => <ToolRow tool={tool()} active={activeSlug() === tool().slug} testID={`sidebar-tool-${tool().slug}`} />}
                      </Each>
                    </View>
                  </If>
                </View>
              )
            })}
          </View>
        </If>
      </Scroll>

      <View class="gap-1 border-t border-sidebar-border p-2">
        <NavRow
          icon="⚙️"
          label={L("设置", "Settings")}
          active={route().name === "settings"}
          onPress={openSettings}
          testID="nav-settings"
        />
        <View class="flex-row gap-1 px-1">
          <View
            role="button"
            onPress={cycleAppearance}
            accessibilityLabel={L("切换外观", "Cycle appearance")}
            testID="appearance-cycle"
            class="h-7 flex-1 flex-row items-center justify-center gap-1 rounded-md border border-sidebar-border bg-background active:opacity-70"
          >
            <Text class="text-[11px]">{appearance() === "dark" ? "🌙" : appearance() === "light" ? "☀️" : "🖥️"}</Text>
            <Text class="text-[10px] text-muted-foreground">
              {appearance() === "dark" ? L("深色", "Dark") : appearance() === "light" ? L("浅色", "Light") : L("系统", "System")}
            </Text>
          </View>
          <View
            role="button"
            onPress={() => language.set(language() === "zh" ? "en" : "zh")}
            accessibilityLabel={L("切换语言", "Toggle language")}
            testID="language-toggle"
            class="h-7 flex-1 flex-row items-center justify-center rounded-md border border-sidebar-border bg-background active:opacity-70"
          >
            <Text class="text-[10px] text-muted-foreground">{language() === "zh" ? "EN" : "中文"}</Text>
          </View>
        </View>
        <View class="flex-row items-center justify-between px-1">
          <Text class="text-[10px] text-muted-foreground">{L("本地处理 · 无上传", "Local only · no uploads")}</Text>
          <Text class="text-[10px] text-muted-foreground">{platformLabel()}</Text>
        </View>
      </View>
    </View>
  )
}
