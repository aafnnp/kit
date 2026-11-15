import { cleanup, openUrl, Scroll, signal, Text, View } from "nsh"
import { Button, Card, CardHeader, KeyHint, Segmented, Toggle } from "./ui"
import { L } from "../lib/locale"
import { appearance, clearHistory, favorites, keepDrafts, language, recent, type Appearance } from "../lib/state"
import { modKey, modShiftKey, platformLabel } from "../lib/platform"
import { APP_VERSION, NSH_VERSION } from "../lib/version"
import { updater } from "../lib/updater"
import { clearDrafts } from "../lib/drafts"

export function SettingsPage() {
  const confirmingClear = signal(false)
  let resetTimer: number | undefined
  cleanup(() => {
    if (resetTimer !== undefined) clearTimeout(resetTimer)
  })
  const requestClear = () => {
    if (!confirmingClear()) {
      confirmingClear.set(true)
      resetTimer = setTimeout(() => confirmingClear.set(false), 4000)
      return
    }
    if (resetTimer !== undefined) clearTimeout(resetTimer)
    confirmingClear.set(false)
    clearHistory()
  }

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
            <Button tone="danger" onPress={requestClear} testID="settings-clear" accessibilityLabel={L("清除收藏与历史", "Clear favorites and history")}>
              {confirmingClear() ? L("再次点击确认清除", "Click again to confirm") : L("清除收藏与历史", "Clear favorites and history")}
            </Button>
          </View>
        </Card>

        <Card>
          <CardHeader
            title={L("工具草稿", "Tool drafts")}
            description={L("开启后在本机保存工具输入，便于下次继续；默认关闭。", "Save tool inputs on this device so you can continue later. Off by default.")}
          />
          <View class="flex-row flex-wrap items-center gap-2">
            <Toggle label={L("保存工具草稿", "Keep tool drafts")} checked={keepDrafts()} onChange={(value) => keepDrafts.set(value)} testID="settings-drafts" />
            <Button tone="secondary" onPress={() => void clearDrafts()} testID="settings-clear-drafts">
              {L("清除草稿", "Clear drafts")}
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

        <UpdateCard />

        <Card>
          <CardHeader title={L("关于 Kit", "About Kit")} />
          <View class="gap-1.5">
            <Info label={L("版本", "Version")} value={APP_VERSION} />
            <Info label={L("框架", "Framework")} value={`Native Shell (NSH) ${NSH_VERSION}`} />
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

function UpdateCard() {
  const found = () => updater.update()
  const percent = () => Math.round(updater.progress() * 100)
  const status = () => {
    switch (updater.phase()) {
      case "checking":
        return L("正在检查更新…", "Checking for updates…")
      case "current":
        return L("已是最新版本。", "You're up to date.")
      case "available":
        return L(`发现新版本 v${found()?.version ?? ""}`, `Version ${found()?.version ?? ""} is available`)
      case "downloading":
        return updater.progress() > 0 ? L(`正在下载，已完成 ${percent()}%`, `Downloading, ${percent()}% done`) : L("正在下载…", "Downloading…")
      case "installing":
        return L("正在安装，应用即将重启…", "Installing; the app will restart…")
      case "error":
        return L("检查或安装更新失败。", "Checking or installing the update failed.")
      default:
        return L(`当前版本 v${APP_VERSION}`, `Current version v${APP_VERSION}`)
    }
  }

  return (
    <Card testID="settings-update">
      <CardHeader
        title={L("应用更新", "App updates")}
        description={L("桌面版启动时向 GitHub Releases 检查新版本，可下载后就地替换并重启；Web 版随站点部署更新。", "Desktop builds check GitHub Releases at launch and can replace and restart in place; the web build updates with the site.")}
      />
      <View class="flex-row flex-wrap items-center justify-between gap-2">
        <View class="gap-0.5">
          <Text class="select-text text-xs text-foreground">v{APP_VERSION}</Text>
          <Text class="text-xs text-muted-foreground" testID="settings-update-status">{status()}</Text>
        </View>
        <Button
          onPress={() => void updater.check()}
          disabled={updater.busy()}
          testID="settings-update-check"
          accessibilityLabel={L("检查更新", "Check for updates")}
        >
          {updater.phase() === "checking" ? L("检查中…", "Checking…") : L("检查更新", "Check for updates")}
        </Button>
      </View>

      <If when={(updater.phase() === "available" || updater.phase() === "error") && found() !== null}>
        <View class="gap-2 rounded-(--radius) border border-border bg-muted/30 p-3">
          <Text class="text-xs font-medium text-foreground">
            {L(`新版本 v${found()?.version ?? ""}`, `Version ${found()?.version ?? ""}`)}
          </Text>
          <If when={Boolean(found()?.notes)}>
            <Text class="line-clamp-4 text-xs text-muted-foreground">{found()?.notes ?? ""}</Text>
          </If>
          <View class="flex-row flex-wrap gap-2">
            <Button tone="primary" onPress={() => void updater.install()} disabled={updater.busy()} testID="settings-update-install">
              {found()?.canInstall ? L("下载并安装", "Download and install") : L("前往下载", "Open download page")}
            </Button>
            <Button onPress={() => void updater.openDownload()} testID="settings-update-page">
              {L("打开发布页", "Open release page")}
            </Button>
          </View>
        </View>
      </If>

      <If when={updater.phase() === "downloading" || updater.phase() === "installing"}>
        <View class="gap-1.5">
          <View class="h-1.5 overflow-hidden rounded-full bg-muted">
            <View class="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.max(6, percent())}%` }} />
          </View>
          <Text class="text-[11px] text-muted-foreground">
            {updater.phase() === "installing"
              ? L("正在替换应用…", "Replacing the app…")
              : L("下载完成后将自动安装并重启。", "It installs and restarts when the download finishes.")}
          </Text>
        </View>
      </If>

      <If when={updater.phase() === "error" && updater.error() !== null}>
        <Text class="text-xs text-destructive" testID="settings-update-error">{updater.error() ?? ""}</Text>
      </If>
    </Card>
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
