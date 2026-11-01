import { signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { searchHttpStatuses } from "./logic"

export default function HttpStatus() {
  const query = signal("")
  const results = () => searchHttpStatuses(query())

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("HTTP 状态码", "HTTP status codes")}
          description={L("按代码或名称查询常见 HTTP 状态码。", "Search common HTTP status codes by number or name.")}
        />
        <TextInput value={query()} onChange={(value) => query.set(value)} mono testID="http-status-query" placeholder="200, 404, gateway…" />
      </Card>
      <Card>
        <CardHeader title={L("状态码参考", "Status reference")} description={`${results().length} ${L("个结果", "results")}`} />
        <View class="gap-1">
          {results().map((status) => (
            <View class="flex-row items-center gap-3 rounded-md bg-muted/30 px-3 py-2">
              <Text class="w-12 font-mono text-sm font-semibold text-primary">{status.code}</Text>
              <View class="min-w-0 flex-1 gap-0.5">
                <Text class="text-xs font-medium text-foreground">{status.phrase}</Text>
                <Text class="text-[11px] text-muted-foreground">{L(status.zh, status.category.replace("-", " "))}</Text>
              </View>
              <CopyButton value={() => `${status.code} ${status.phrase}`} label="" testID={`http-status-copy-${status.code}`} />
            </View>
          ))}
          {!results().length ? <Text class="py-4 text-center text-sm text-muted-foreground">{L("没有匹配的状态码。", "No matching status codes.")}</Text> : null}
        </View>
      </Card>
    </View>
  )
}
