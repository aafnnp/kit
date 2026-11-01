import { cleanup, Clipboard, Scroll, signal, Text, View } from "nsh"
import { Input } from "nsh/base"
import type { JSX } from "nsh"
import { L } from "../lib/locale"
import { cardClass, inputClass, labelClass, monoClass } from "../lib/styles"

export function Card(props: { children?: JSX.Element; class?: string; testID?: string }) {
  return (
    <View class={`${cardClass} p-4 gap-3 ${props.class ?? ""}`} testID={props.testID}>
      {props.children}
    </View>
  )
}

export function CardHeader(props: { title: string; description?: string; right?: JSX.Element }) {
  return (
    <View class="flex-row items-start justify-between gap-3">
      <View class="flex-1 gap-1">
        <Text class="text-sm font-semibold text-card-foreground">{props.title}</Text>
        {props.description ? <Text class="text-xs text-muted-foreground">{props.description}</Text> : null}
      </View>
      {props.right}
    </View>
  )
}

type Tone = "primary" | "secondary" | "ghost" | "danger"

const toneClass: Record<Tone, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
  secondary: "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/70 active:bg-secondary/60",
  ghost: "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent/70",
  danger: "border border-destructive/40 text-destructive hover:bg-destructive/10 active:bg-destructive/20",
}

export function Button(props: {
  children: JSX.Element | string
  onPress?: () => void
  tone?: Tone
  disabled?: boolean
  testID?: string
  class?: string
  accessibilityLabel?: string
}) {
  const tone = () => props.tone ?? "secondary"
  return (
    <View
      role="button"
      disabled={props.disabled}
      accessibilityLabel={props.accessibilityLabel}
      onPress={props.onPress}
      testID={props.testID}
      class={`h-9 flex-row items-center justify-center gap-1.5 rounded-(--radius) px-3 transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-40 ${toneClass[tone()]} ${props.class ?? ""}`}
    >
      <Text class={`text-sm font-medium ${tone() === "primary" ? "text-primary-foreground" : tone() === "danger" ? "text-destructive" : tone() === "ghost" ? "text-muted-foreground" : "text-secondary-foreground"}`}>
        {props.children}
      </Text>
    </View>
  )
}

export function CopyButton(props: { value: string | (() => string); label?: string; testID?: string; class?: string }) {
  const copied = signal(false)
  let timer: number | undefined
  cleanup(() => {
    if (timer !== undefined) clearTimeout(timer)
  })

  const copy = () => {
    const value = typeof props.value === "function" ? props.value() : props.value
    if (!value) return
    void Clipboard.writeText(value)
      .then(() => {
        copied.set(true)
        if (timer !== undefined) clearTimeout(timer)
        timer = setTimeout(() => copied.set(false), 1400)
      })
      .catch(() => {})
  }

  return (
    <Button onPress={copy} testID={props.testID} class={props.class} tone={copied() ? "primary" : "secondary"}>
      {copied() ? L("已复制", "Copied") : (props.label ?? L("复制", "Copy"))}
    </Button>
  )
}

export function Field(props: {
  label: string
  hint?: string
  children: JSX.Element
  right?: JSX.Element
}) {
  return (
    <View class="gap-1.5">
      <View class="flex-row items-center justify-between gap-2">
        <Text class={labelClass}>{props.label}</Text>
        {props.right}
      </View>
      {props.children}
      {props.hint ? <Text class="text-[11px] text-muted-foreground">{props.hint}</Text> : null}
    </View>
  )
}

export function TextInput(props: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  testID?: string
  multiline?: boolean
  height?: number
  mono?: boolean
  onSubmit?: () => void
  autoFocus?: boolean
  class?: string
  accessibilityLabel?: string
}) {
  const height = () => props.height ?? (props.multiline ? 180 : 36)
  return (
    <Input
      value={props.value}
      placeholder={props.placeholder}
      testID={props.testID}
      accessibilityLabel={props.accessibilityLabel}
      autoFocus={props.autoFocus}
      multiline={props.multiline}
      onChange={(value) => props.onChange(value)}
      onSubmit={() => props.onSubmit?.()}
      style={{ height: height() }}
      class={`${inputClass} ${props.mono ? monoClass : "text-sm"} ${props.class ?? ""}`}
    />
  )
}

export function OutputBox(props: {
  value: string
  height?: number
  empty?: string
  testID?: string
  mono?: boolean
}) {
  const height = () => props.height ?? 200
  return (
    <View class="overflow-hidden rounded-(--radius) border border-border bg-muted/30" style={{ height: height() }} testID={props.testID}>
      <Scroll class="flex-1" contentClass="p-3">
        <Text class={`select-text ${props.mono === false ? "text-sm" : monoClass} ${props.value ? "text-foreground" : "text-muted-foreground"}`}>
          {props.value || (props.empty ?? L("结果会显示在这里", "The result appears here"))}
        </Text>
      </Scroll>
    </View>
  )
}

export function Segmented<T extends string>(props: {
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
  testID?: string
  class?: string
}) {
  return (
    <View class={`flex-row flex-wrap gap-1 rounded-(--radius) border border-border bg-muted/50 p-1 ${props.class ?? ""}`} testID={props.testID}>
      {props.options.map((option) => (
        <View
          role="button"
          testID={`${props.testID ?? "segment"}-${option.value}`}
          onPress={() => props.onChange(option.value)}
          class="h-7 flex-row items-center justify-center rounded-md px-2.5 active:opacity-70"
          classList={{
            "bg-card text-foreground shadow-sm": props.value === option.value,
            "text-muted-foreground hover:text-foreground": props.value !== option.value,
          }}
        >
          <Text class="text-xs font-medium" classList={{ "text-foreground": props.value === option.value, "text-muted-foreground": props.value !== option.value }}>
            {option.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

export function Toggle(props: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  testID?: string
}) {
  return (
    <View
      role="switch"
      accessibilityLabel={props.label}
      accessibilityState={{ checked: props.checked }}
      onPress={() => props.onChange(!props.checked)}
      testID={props.testID}
      class="h-8 flex-row items-center gap-2 rounded-full border border-border bg-background px-2.5 active:opacity-70"
    >
      <View
        class="h-4 w-4 items-center justify-center rounded-full border"
        classList={{
          "border-primary bg-primary": props.checked,
          "border-input bg-transparent": !props.checked,
        }}
      >
        <Text class="text-[10px] font-bold text-primary-foreground">{props.checked ? "✓" : ""}</Text>
      </View>
      <Text class="text-xs" classList={{ "text-foreground": props.checked, "text-muted-foreground": !props.checked }}>
        {props.label}
      </Text>
    </View>
  )
}

export function Stat(props: { label: string; value: string; testID?: string }) {
  return (
    <View class="min-w-24 flex-1 gap-1 rounded-(--radius) border border-border bg-muted/30 p-3" testID={props.testID}>
      <Text class="text-[11px] uppercase tracking-wide text-muted-foreground">{props.label}</Text>
      <Text class="text-lg font-semibold text-foreground">{props.value}</Text>
    </View>
  )
}

export function Badge(props: { children: JSX.Element | string; tone?: "default" | "up" | "warn" | "down" }) {
  const tone = () => props.tone ?? "default"
  return (
    <View
      class="self-start rounded-full border px-2 py-0.5"
      classList={{
        "border-border bg-muted text-muted-foreground": tone() === "default",
        "border-up/30 bg-up/10": tone() === "up",
        "border-brand-orange/30 bg-brand-orange/10": tone() === "warn",
        "border-destructive/30 bg-destructive/10": tone() === "down",
      }}
    >
      <Text
        class="text-[11px] font-medium"
        classList={{
          "text-muted-foreground": tone() === "default",
          "text-up": tone() === "up",
          "text-brand-orange": tone() === "warn",
          "text-destructive": tone() === "down",
        }}
      >
        {props.children}
      </Text>
    </View>
  )
}

export function ErrorBanner(props: { message: string }) {
  return (
    <View class="rounded-(--radius) border border-destructive/30 bg-destructive/10 p-3">
      <Text class="select-text text-xs text-destructive">{props.message}</Text>
    </View>
  )
}

export function EmptyState(props: { icon: string; title: string; description: string; action?: JSX.Element }) {
  return (
    <View class="flex-1 items-center justify-center gap-2 px-6 py-12">
      <Text class="text-3xl">{props.icon}</Text>
      <Text class="text-sm font-semibold text-foreground">{props.title}</Text>
      <Text class="max-w-sm text-center text-xs text-muted-foreground">{props.description}</Text>
      {props.action}
    </View>
  )
}

export function KeyHint(props: { keys: string }) {
  return (
    <View class="rounded border border-border bg-muted px-1.5 py-0.5">
      <Text class="font-mono text-[10px] text-muted-foreground">{props.keys}</Text>
    </View>
  )
}
