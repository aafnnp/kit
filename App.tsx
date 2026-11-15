import { effect, keymap, mount, platform, setColorScheme, Text, View } from "nsh"
import { Window } from "nsh/desktop"
import { Sidebar } from "./components/sidebar"
import { Welcome } from "./components/welcome"
import { SettingsPage } from "./components/settings"
import { ToolPage } from "./components/tool-page"
import { L } from "./lib/locale"
import { platformLabel } from "./lib/platform"
import { NSH_VERSION } from "./lib/version"
import { startUpdateCheck, updater } from "./lib/updater"
import {
  appearance,
  clearSearch,
  focusSearch,
  goHome,
  hydrate,
  openSettings,
  route,
  search,
} from "./lib/state"

function StatusBar() {
  return (
    <View class="h-7 flex-row items-center justify-between border-t border-border bg-card px-3">
      <View class="flex-row items-center gap-1.5">
        <View class="h-1.5 w-1.5 rounded-full bg-up" />
        <Text class="text-[10px] text-muted-foreground">{L("本地处理 · 数据不会离开设备", "Local processing · data never leaves the device")}</Text>
      </View>
      <View class="flex-row items-center gap-3">
        <If when={updater.phase() === "available"}>
          <View
            role="button"
            onPress={openSettings}
            accessibilityLabel={L("查看可用更新", "View available update")}
            testID="status-update"
            class="h-5 flex-row items-center gap-1 rounded-full bg-brand-orange/15 px-2 active:opacity-70"
          >
            <Text class="text-[10px] font-medium text-brand-orange">
              {L("有更新", "Update")} v{updater.update()?.version}
            </Text>
          </View>
        </If>
        <Text class="text-[10px] text-muted-foreground">{platformLabel()} · NSH {NSH_VERSION}</Text>
      </View>
    </View>
  )
}

function App() {
  void hydrate()
  startUpdateCheck()

  effect(() => setColorScheme(appearance()))

  effect(() => {
    if (platform.os === "web") return
    Window.get("main")?.setBounds({ size: { width: 1280, height: 840 } })
  })

  keymap.bind("mod+k", () => focusSearch())
  keymap.bind("mod+,", () => openSettings())
  keymap.bind("mod+shift+h", () => goHome())
  keymap.bind("escape", () => {
    if (search()) clearSearch()
    else if (route().name !== "home") goHome()
  })

  return (
    <View class="flex-1 flex-row bg-background text-foreground" testID="app-root">
      <Sidebar />
      <View class="flex-1">
        <If
          when={route().name === "home"}
          else={
            <If when={route().name === "settings"} else={<ToolPage />}>
              <SettingsPage />
            </If>
          }
        >
          <Welcome />
        </If>
        <StatusBar />
      </View>
    </View>
  )
}

mount(App)
