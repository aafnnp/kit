import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, Field, OutputBox, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateUuids } from "./logic"

export default function UuidGenerator() {
  const count = signal(5)
  const uppercase = signal(false)
  const braces = signal(false)
  const values = signal<string[]>(generateUuids({ count: 5, uppercase: false, braces: false }))

  const generate = () => values.set(generateUuids({ count: count(), uppercase: uppercase(), braces: braces() }))
  const quick = (size: number) => {
    count.set(size)
    values.set(generateUuids({ count: size, uppercase: uppercase(), braces: braces() }))
  }
  const output = () => values().join("\n")

  const setCount = (value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ""))
    if (Number.isFinite(parsed)) count.set(Math.max(1, Math.min(100, parsed)))
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("UUID v4", "UUID v4")} description={L("使用系统安全随机数生成，批量最多 100 个。", "Generated with system randomness, up to 100 at a time.")} />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="w-28">
            <Field label={L("数量", "Count")}>
              <TextInput value={String(count())} onChange={setCount} testID="uuid-count" />
            </Field>
          </View>
          <Button onPress={() => quick(1)} testID="uuid-quick-1">1</Button>
          <Button onPress={() => quick(3)} testID="uuid-quick-3">3</Button>
          <Button onPress={() => quick(5)} testID="uuid-quick-5">5</Button>
          <Button onPress={() => quick(10)} testID="uuid-quick-10">10</Button>
          <Toggle label={L("大写", "Uppercase")} checked={uppercase()} onChange={(value) => { uppercase.set(value); generate() }} />
          <Toggle label={L("花括号", "Braces")} checked={braces()} onChange={(value) => { braces.set(value); generate() }} />
          <Button tone="primary" onPress={generate} testID="uuid-generate">
            {L("生成", "Generate")}
          </Button>
        </View>
      </Card>

      <Card>
        <CardHeader
          title={L("结果", "Result")}
          description={L(`${values().length} 个 UUID`, `${values().length} UUIDs`)}
          right={<CopyButton value={output} testID="uuid-copy" />}
        />
        <OutputBox value={output()} height={300} testID="uuid-output" />
      </Card>
    </View>
  )
}
