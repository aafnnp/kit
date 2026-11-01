import { computed, ErrorBoundary, Scroll, Text, View } from "nsh"
import { Badge, Button, EmptyState } from "./ui"
import { L, pick } from "../lib/locale"
import { activeSlug, goHome, isFavorite, toggleFavorite } from "../lib/state"
import { categoryOf, findTool } from "../tools/registry"
import { ToolHost } from "./tool-host"

export function ToolPage() {
  const tool = computed(() => {
    const slug = activeSlug()
    return slug ? findTool(slug) : undefined
  })

  return (
    <Scroll class="flex-1" contentClass="p-4 md:p-6" testID="tool-page">
      <View class="mx-auto w-full max-w-5xl gap-4">
        {tool() ? (
          <>
            <View class="flex-row items-start justify-between gap-3">
              <View class="min-w-0 flex-1 gap-1">
                <View class="flex-row items-center gap-1.5">
                  <Text class="text-[11px] text-muted-foreground">{pick(categoryOf(tool()!).name)}</Text>
                  <Text class="text-[11px] text-muted-foreground">/</Text>
                  <Text class="text-[11px] text-brand-violet">{pick(tool()!.name)}</Text>
                </View>
                <View class="flex-row items-center gap-2">
                  <Text class="text-2xl">{tool()!.icon}</Text>
                  <Text class="text-2xl font-semibold text-foreground">{pick(tool()!.name)}</Text>
                  <Badge tone="up">{L("本地", "Local")}</Badge>
                </View>
                <Text class="max-w-2xl text-sm text-muted-foreground">{pick(tool()!.description)}</Text>
              </View>
              <View class="flex-row items-center gap-2">
                <View
                  role="button"
                  accessibilityLabel={L("收藏", "Favorite")}
                  onPress={() => toggleFavorite(tool()!.slug)}
                  testID="tool-favorite"
                  class="h-9 w-9 items-center justify-center rounded-(--radius) border border-border bg-card active:opacity-70"
                >
                  <Text class="text-base" classList={{ "text-brand-orange": isFavorite(tool()!.slug), "text-muted-foreground": !isFavorite(tool()!.slug) }}>
                    {isFavorite(tool()!.slug) ? "★" : "☆"}
                  </Text>
                </View>
                <Button onPress={goHome} tone="ghost" testID="tool-home">
                  {L("返回全部", "All tools")}
                </Button>
              </View>
            </View>

            <ErrorBoundary
              fallback={(error, reset) => (
                <View class="gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <Text class="text-sm font-semibold text-destructive">{L("这个工具出错了", "This tool failed")}</Text>
                  <Text class="select-text text-xs text-muted-foreground">{error instanceof Error ? error.message : String(error)}</Text>
                  <Button onPress={reset} tone="secondary">
                    {L("重试", "Try again")}
                  </Button>
                </View>
              )}
            >
              <ToolHost />
            </ErrorBoundary>
          </>
        ) : (
          <EmptyState
            icon="🧭"
            title={L("找不到这个工具", "Tool not found")}
            description={L("它可能已被移动或尚未迁移。", "It may have moved or is not migrated yet.")}
            action={
              <Button onPress={goHome} tone="primary">
                {L("返回全部工具", "Back to all tools")}
              </Button>
            }
          />
        )}
      </View>
    </Scroll>
  )
}
