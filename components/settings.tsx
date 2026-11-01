import { openUrl, Scroll, Text, View } from "nsh"
import { Button, Card, CardHeader, KeyHint, Segmented } from "./ui"
import { L } from "../lib/locale"
import { appearance, clearHistory, favorites, language, recent, type Appearance } from "../lib/state"
import { modKey, modShiftKey, platformLabel } from "../lib/platform"

export function SettingsPage() {
  return (
    <Scroll class="flex-1" contentClass="p-4 md:p-6" testID="settings">
      <View class="mx-auto w-full max-w-3xl gap-4">
        <View class="gap-1">
          <Text class="text-2xl font-semibold text-foreground">{L("设置", "Settings")}</Text>
          <Text class="text-sm text-muted-foreground">{L("外观、语言与本地数据。", "Appearance, language and local data.")}</Text>
        </View>

        <Card>
          <CardHeader title={L("外观", "Appearance")} description={L("跟随系统，或固定为浅色 / 深色。", "Follow the system, or pin light or dark.")} />
          <Segmented
            value={appearance()}
            onChange={(value: Appearance) => appearance.set(value)}
            testID="settings-appearance"
            options={[
              { value: "system", label: L("跟随系统", "System") },
              { value: "light", label: L("浅色", "Light") },
              { value: "dark", label: L("深色", "Dark") },
            ]}
          />
        </Card>

        <Card>
          <CardHeader title={L("语言", "Language")} description={L("界面语言即时生效。", "The interface language changes immediately.")} />
          <Segmented
            value={language()}
            onChange={(value) => language.set(value)}
            testID="settings-language"
            options={[
              { value: "zh", label: "简体中文" },
              { value: "en", label: "English" },
            ]}
          />
        </Card>

        <Card>
          <CardHeader title={L("本地数据", "Local data")} description={L("收藏与最近记录保存在设备上，可随时清除。", "Favorites and recent tools are stored on this device.")} />
          <View class="flex-row flex-wrap items-center gap-2">
            <Text class="text-xs text-muted-foreground">{L(`收藏 ${favorites().length} 个 · 最近 ${recent().length} 个`, `${favorites().length} favorites · ${recent().length} recent`)}</Text>
            <Button tone="danger" onPress={clearHistory} testID="settings-clear">
              {L("清除收藏与历史", "Clear favorites and history")}
            </Button>
          </View>
        </Card>

        <Card>
          <CardHeader title={L("键盘快捷键", "Keyboard shortcuts")} />
          <View class="gap-2">
            <Shortcut keys={modKey("K")} label={L("聚焦搜索", "Focus search")} />
            <Shortcut keys="Esc" label={L("清除搜索 / 返回首页", "Clear search / go home")} />
            <Shortcut keys={modKey(",")} label={L("打开设置", "Open settings")} />
            <Shortcut keys={modShiftKey("H")} label={L("返回所有工具", "Go to all tools")} />
          </View>
        </Card>

        <Card>
          <CardHeader title={L("关于 Kit", "About Kit")} />
          <View class="gap-1.5">
            <Info label={L("版本", "Version")} value="0.6.0" />
            <Info label={L("框架", "Framework")} value="Native Shell (NSH) 0.3.0" />
            <Info label={L("平台", "Platform")} value={platformLabel()} />
            <Info label={L("界面", "UI")} value="TSX + Rust standard modules" />
            <Info label={L("许可", "License")} value="MIT" />
          </View>
          <View class="flex-row flex-wrap gap-2">
            <Button tone="primary" onPress={() => void openUrl("https://github.com/aafnnp/kit").catch(() => {})}>
              {L("GitHub", "GitHub")}
            </Button>
            <Button onPress={() => void openUrl("https://nsh.dev").catch(() => {})}>
              {L("NSH 官网", "nsh.dev")}
            </Button>
          </View>
        </Card>
      </View>
    </Scroll>
  )
}

function Shortcut(props: { keys: string; label: string }) {
  return (
    <View class="flex-row items-center justify-between gap-3">
      <Text class="text-xs text-muted-foreground">{props.label}</Text>
      <KeyHint keys={props.keys} />
    </View>
  )
}

function Info(props: { label: string; value: string }) {
  return (
    <View class="flex-row items-center justify-between gap-3">
      <Text class="text-xs text-muted-foreground">{props.label}</Text>
      <Text class="select-text text-xs text-foreground">{props.value}</Text>
    </View>
  )
}
