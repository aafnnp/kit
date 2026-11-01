import { Scroll, Text, View } from "nsh"
import type { JSX } from "nsh"
import { L, pick } from "../lib/locale"
import { favorites, isFavorite, openTool, toggleFavorite } from "../lib/state"
import { categories, tools, toolsInCategory } from "../tools/registry"
import type { ToolDefinition } from "../tools/registry"
import { modKey } from "../lib/platform"
import { accentBar } from "../lib/types"
import { BrandMark } from "./brand"

function ToolCard(props: { tool: ToolDefinition }) {
  const active = () => isFavorite(props.tool.slug)
  return (
    <View
      role="button"
      onPress={() => openTool(props.tool.slug)}
      testID={`tool-card-${props.tool.slug}`}
      class="flex-row items-start gap-3 rounded-xl border border-border bg-card p-3 hover:border-primary/40 hover:bg-card/80 active:opacity-80"
    >
      <View class="h-11 w-11 items-center justify-center rounded-(--radius) bg-accent">
        <Text class="text-xl">{props.tool.icon}</Text>
      </View>
      <View class="flex-1 gap-1">
        <Text class="text-sm font-semibold text-card-foreground">{pick(props.tool.name)}</Text>
        <Text class="line-clamp-2 text-xs text-muted-foreground">
          {pick(props.tool.description)}
        </Text>
      </View>
      <View
        role="button"
        accessibilityLabel={L("收藏", "Favorite")}
        onPress={() => toggleFavorite(props.tool.slug)}
        testID={`favorite-${props.tool.slug}`}
        class="h-7 w-7 items-center justify-center rounded-md active:bg-muted"
      >
        <Text class="text-sm" classList={{ "text-brand-orange": active(), "text-muted-foreground": !active() }}>
          {active() ? "★" : "☆"}
        </Text>
      </View>
    </View>
  )
}

function Section(props: { title: string; count: number; accent: string; children: JSX.Element }) {
  return (
    <View class="gap-2">
      <View class="flex-row items-center justify-between">
        <View class="flex-row items-center gap-2">
          <View class={`h-3 w-[3px] rounded-full ${props.accent}`} />
          <Text class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{props.title}</Text>
        </View>
        <Text class="text-[10px] text-muted-foreground">{props.count}</Text>
      </View>
      {props.children}
    </View>
  )
}

export function Welcome() {
  return (
    <Scroll class="flex-1" contentClass="p-4 md:p-6 gap-6" testID="welcome">
      <View class="overflow-hidden rounded-2xl border border-white/10 bg-ink-surface">
        <View class="h-1 flex-row">
          <View class="flex-1 bg-ink-cyan" />
          <View class="flex-1 bg-ink-violet" />
          <View class="flex-1 bg-ink-orange" />
        </View>
        <View class="gap-4 p-6">
          <View class="flex-row items-center gap-4">
            <BrandMark size={56} />
            <View class="min-w-0 flex-1 gap-1.5">
              <View class="flex-row items-center gap-2">
                <Text class="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white">
                  {L("本地优先 · 无需账户", "Local-first · no account")}
                </Text>
                <Text class="text-[10px] text-white/60">v0.6.0</Text>
              </View>
              <Text class="text-3xl font-semibold tracking-tight text-white">{L("欢迎使用 Kit", "Welcome to Kit")}</Text>
            </View>
          </View>
          <Text class="max-w-2xl text-sm text-white/75">
            {L(
              "一套运行在 macOS、Windows、Linux 与 Web 上的原生工具箱。所有处理都在本机完成。",
              "A native toolbox for macOS, Windows, Linux and the web. Everything runs on your device.",
            )}
          </Text>
          <View class="flex-row flex-wrap items-center gap-4 border-t border-white/10 pt-3">
            <View class="flex-row items-center gap-1.5">
              <Text class="text-lg font-semibold text-ink-cyan">{tools.length}</Text>
              <Text class="text-[11px] text-white/60">{L("个工具", "tools")}</Text>
            </View>
            <View class="flex-row items-center gap-1.5">
              <Text class="text-lg font-semibold text-ink-violet">{categories.length}</Text>
              <Text class="text-[11px] text-white/60">{L("个分类", "categories")}</Text>
            </View>
            <View class="flex-row items-center gap-1.5">
              <Text class="text-lg font-semibold text-ink-orange">0</Text>
              <Text class="text-[11px] text-white/60">{L("次上传", "uploads")}</Text>
            </View>
            <View class="flex-row items-center gap-1.5">
              <Text class="text-[10px] text-white/50">{L("按", "Press")}</Text>
              <View class="rounded border border-white/15 bg-white/10 px-1.5 py-0.5">
                <Text class="font-mono text-[10px] text-white">{modKey("K")}</Text>
              </View>
              <Text class="text-[10px] text-white/50">{L("搜索", "to search")}</Text>
            </View>
          </View>
        </View>
      </View>

      <If when={favorites().length > 0}>
        <Section title={L("收藏", "Favorites")} count={favorites().length} accent={accentBar.orange}>
          <View class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            <Each of={favorites().map((slug) => tools.find((tool) => tool.slug === slug)).filter((tool): tool is ToolDefinition => Boolean(tool))}>
              {(tool) => <ToolCard tool={tool()} />}
            </Each>
          </View>
        </Section>
      </If>

      <Each of={categories}>
        {(category) => (
          <Section title={pick(category().name)} count={toolsInCategory(category().id).length} accent={accentBar[category().accent]}>
            <View class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              <Each of={toolsInCategory(category().id)}>
                {(tool) => <ToolCard tool={tool()} />}
              </Each>
            </View>
          </Section>
        )}
      </Each>

      <View class="items-center gap-1 pb-2">
        <Text class="text-[10px] text-muted-foreground">
          {L("所有工具均在本地运行，不会上传你的数据。", "Every tool runs locally and never uploads your data.")}
        </Text>
      </View>
    </Scroll>
  )
}
