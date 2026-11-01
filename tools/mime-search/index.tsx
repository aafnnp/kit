import { signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { searchMime } from "./logic"

export default function MimeSearch() {
  const query = signal("")
  const results = () => searchMime(query())

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("MIME 类型查询", "MIME type lookup")}
          description={L("按扩展名、MIME 类型或描述搜索常见文件格式。", "Search common file formats by extension, MIME type or description.")}
        />
        <TextInput value={query()} onChange={(value) => query.set(value)} testID="mime-query" placeholder={L("例如：.png、image 或 pdf", "e.g. .png, image or pdf")} />
      </Card>
      <Card testID="mime-results">
        <CardHeader
          title={L("匹配结果", "Matches")}
          description={`${results().length} ${L("种格式", "formats")}`}
        />
        <View class="gap-1">
          {results().map((entry) => (
            <View class="flex-row flex-wrap items-center gap-2 rounded-md bg-muted/30 px-3 py-2">
              <View class="min-w-40 flex-1 gap-0.5">
                <Text class="font-mono text-xs font-medium text-foreground">{entry.mimeType}</Text>
                <Text class="text-[11px] text-muted-foreground">{entry.description}</Text>
              </View>
              <Text class="text-[11px] text-muted-foreground">{entry.extensions.map((extension) => `.${extension}`).join(", ")}</Text>
              <CopyButton value={entry.mimeType} label="" testID={`mime-copy-${entry.extensions[0]}`} />
            </View>
          ))}
          {!results().length ? <Text class="py-4 text-center text-sm text-muted-foreground">{L("没有找到匹配格式。", "No matching formats.")}</Text> : null}
        </View>
      </Card>
    </View>
  )
}
