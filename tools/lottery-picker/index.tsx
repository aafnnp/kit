import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, ErrorBanner, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { parseLotteryItems, pickLottery } from "./logic"

export default function LotteryPicker() {
  const input = signal("Ada, Grace, Linus, Margaret")
  const count = signal("1")
  const selected = signal<string[]>([])
  const error = signal("")

  const draw = () => {
    try {
      selected.set(pickLottery(parseLotteryItems(input()), Number(count())))
      error.set("")
    } catch (failure) {
      selected.set([])
      error.set(failure instanceof Error ? failure.message : String(failure))
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("随机抽选", "Random picker")}
          description={L("输入名单，进行不重复抽选；使用本地伪随机数。", "Draw unique entries from a list using local pseudorandomness.")}
        />
        <TextInput value={input()} onChange={(value) => input.set(value)} multiline height={160} testID="lottery-items" placeholder="Ada, Grace, Linus" />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="w-28 gap-1">
            <Text class="text-xs font-medium text-muted-foreground">{L("抽取数量", "Number to pick")}</Text>
            <TextInput value={count()} onChange={(value) => count.set(value)} mono testID="lottery-count" />
          </View>
          <Button tone="primary" onPress={draw} testID="lottery-draw">{L("开始抽选", "Pick")}</Button>
        </View>
        {error() ? <ErrorBanner message={error()} /> : null}
      </Card>
      {selected().length ? (
        <Card>
          <CardHeader title={L("抽选结果", "Selected")} right={<CopyButton value={() => selected().join("\n")} testID="lottery-copy" />} />
          {selected().map((item, index) => (
            <Text class="text-lg font-semibold text-primary" testID={index === 0 ? "lottery-result" : undefined}>{item}</Text>
          ))}
        </Card>
      ) : null}
    </View>
  )
}
