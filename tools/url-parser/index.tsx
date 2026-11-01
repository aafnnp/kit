import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { inspectUrl, type ParsedUrl } from "./logic"

const SAMPLE = "https://example.com:8443/search?q=kit&lang=zh#tools"

export default function UrlParser() {
  const input = signal(SAMPLE)
  const result = signal<ParsedUrl | null>(null)
  const error = signal("")

  const inspect = () => {
    try {
      result.set(inspectUrl(input()))
      error.set("")
    } catch (failure) {
      result.set(null)
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }
  const output = () => {
    const parsed = result()
    return parsed ? [
      `protocol: ${parsed.protocol}`,
      `hostname: ${parsed.hostname}`,
      `port: ${parsed.port || "—"}`,
      `pathname: ${parsed.pathname}`,
      `origin: ${parsed.origin}`,
      `hash: ${parsed.hash || "—"}`,
    ].join("\n") : ""
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("URL 检查器", "URL inspector")}
          description={L("解析 URL 组成部分、路径片段和重复查询参数；不会访问该地址。", "Inspect URL components, path segments and repeated query parameters. The URL is never fetched.")}
        />
        <TextInput value={input()} onChange={(value) => input.set(value)} mono testID="url-parser-input" placeholder="https://example.com/path?key=value" />
        <View class="flex-row gap-2">
          <Button tone="primary" onPress={inspect} testID="url-parser-inspect">{L("解析", "Inspect")}</Button>
          <Button tone="ghost" onPress={() => { input.set(SAMPLE); result.set(null); error.set("") }}>{L("示例", "Sample")}</Button>
        </View>
        {error() ? <ErrorBanner message={error()} /> : null}
      </Card>
      {result() ? (
        <Card testID="url-parser-result">
          <CardHeader title={L("URL 组成", "URL components")} right={<CopyButton value={output} testID="url-parser-copy" />} />
          <Text class="select-text font-mono text-xs text-foreground">{output()}</Text>
          {result()!.hasCredentials ? (
            <Text class="text-xs text-destructive">{L("此 URL 含有凭据；密码不会显示。", "This URL contains credentials; the password is not displayed.")}</Text>
          ) : null}
          <Text class="text-[11px] uppercase tracking-wide text-muted-foreground">{L("路径片段", "Path segments")}</Text>
          <Text class="font-mono text-xs text-foreground">{result()!.pathSegments.join("  /  ") || "—"}</Text>
          <Text class="text-[11px] uppercase tracking-wide text-muted-foreground">{L("查询参数", "Query parameters")}</Text>
          {result()!.searchParams.length ? result()!.searchParams.map((parameter) => (
            <View class="flex-row gap-3 rounded-md bg-muted/30 px-3 py-2">
              <Text class="w-32 font-mono text-xs text-muted-foreground">{parameter.key}</Text>
              <Text class="flex-1 select-text font-mono text-xs text-foreground">{parameter.value}</Text>
            </View>
          )) : <Text class="text-xs text-muted-foreground">—</Text>}
        </Card>
      ) : null}
    </View>
  )
}
