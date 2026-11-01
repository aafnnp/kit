import { signal, Text, View } from "nsh"
import { Card, CardHeader, CopyButton, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { searchRegexTips } from "./logic"

export default function RegexCheatsheet() {
  const query = signal("")
  const tips = () => searchRegexTips(query())

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("正则表达式速查", "Regex cheat sheet")}
          description={L("搜索常用语法、示例与用途。语法遵循 JavaScript 正则表达式。", "Search common syntax, examples and use cases. Syntax follows JavaScript regular expressions.")}
        />
        <TextInput value={query()} onChange={(value) => query.set(value)} testID="regex-cheatsheet-query" placeholder={L("搜索语法或示例", "Search syntax or examples")} />
      </Card>
      <View class="gap-2">
        {tips().map((tip) => (
          <Card>
            <CardHeader
              title={tip.title}
              right={<CopyButton value={tip.pattern} label={L("复制", "Copy")} testID={`regex-tip-copy-${tip.title}`} />}
            />
            <Text class="font-mono text-sm text-primary">{tip.pattern}</Text>
            <Text class="text-xs text-muted-foreground">{tip.description}</Text>
            <Text class="font-mono text-[11px] text-foreground">{tip.example}</Text>
          </Card>
        ))}
        {!tips().length ? <Text class="py-4 text-center text-sm text-muted-foreground">{L("没有匹配的语法。", "No matching patterns.")}</Text> : null}
      </View>
    </View>
  )
}
