import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { analyzePrime } from "./logic"

export default function PrimeChecker() {
  const input = signal("97")
  const result = () => {
    const analysis = analyzePrime(input())
    return analysis.ok
      ? { error: "", value: analysis.value.toString(), prime: analysis.prime }
      : { error: analysis.error, value: "", prime: false }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("质数检查", "Prime checker")}
          description={L("使用确定性 Miller–Rabin 检查有符号 64 位整数。", "Deterministic Miller–Rabin check for signed 64-bit integers.")}
        />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="min-w-48 flex-1">
            <TextInput value={input()} onChange={(value) => input.set(value)} mono testID="prime-input" placeholder="97" />
          </View>
          {!result().error ? <CopyButton value={() => result().value} testID="prime-copy" /> : null}
        </View>
        {!result().error ? (
          <View class="gap-1" testID="prime-result">
            <Text class="text-lg font-semibold text-foreground">
              {result().prime ? L("是质数", "Prime") : L("不是质数", "Not prime")}
            </Text>
            <Text class="font-mono text-xs text-muted-foreground">{result().value}</Text>
          </View>
        ) : <ErrorBanner message={result().error} />}
        <Button tone="ghost" onPress={() => input.set("18446744073709551557")} testID="prime-large-sample">
          {L("加载大数示例", "Load large-number example")}
        </Button>
      </Card>
    </View>
  )
}
