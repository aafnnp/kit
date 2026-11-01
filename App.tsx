import { effect, keymap, mount, platform, setColorScheme, Text, View } from "nsh"
import { Window } from "nsh/desktop"
import { Sidebar } from "./components/sidebar"
import { Welcome } from "./components/welcome"
import { SettingsPage } from "./components/settings"
import { ToolPage } from "./components/tool-page"
import { L } from "./lib/locale"
import { platformLabel } from "./lib/platform"
import { NSH_VERSION } from "./lib/version"
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
      <Text class="text-[10px] text-muted-foreground">{platformLabel()} · NSH {NSH_VERSION}</Text>
    </View>
  )
}

function App() {
  void hydrate()

  effect(() => setColorScheme(appearance()))

  effect(() => {
    if (platform.os === "web") return
    Window.setFrame({ size: { width: 1280, height: 840 } })
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
