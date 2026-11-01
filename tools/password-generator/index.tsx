import { computed, signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, Field, OutputBox, TextInput, Toggle } from "../../components/ui"
import { L } from "../../lib/locale"
import { generatePassword, passwordStrength, type PasswordOptions } from "./logic"

const initialOptions: PasswordOptions = {
  length: 20,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
  avoidAmbiguous: false,
}

export default function PasswordGenerator() {
  const length = signal(initialOptions.length)
  const lowercase = signal(true)
  const uppercase = signal(true)
  const digits = signal(true)
  const symbols = signal(true)
  const avoidAmbiguous = signal(false)
  const password = signal(generatePassword({ ...initialOptions }))

  const options = (): PasswordOptions => ({
    length: length(),
    lowercase: lowercase(),
    uppercase: uppercase(),
    digits: digits(),
    symbols: symbols(),
    avoidAmbiguous: avoidAmbiguous(),
  })

  const strength = computed(() => passwordStrength(password()))
  const regenerate = () => password.set(generatePassword(options()))

  const setLength = (value: string) => {
    const parsed = Number(value.replace(/[^0-9]/g, ""))
    if (Number.isFinite(parsed)) length.set(Math.max(4, Math.min(128, parsed)))
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={L("选项", "Options")} description={L("长度至少 4 位，建议 16 位以上。", "At least 4 characters; 16 or more is recommended.")} />
        <View class="flex-row flex-wrap items-end gap-3">
          <View class="w-28">
            <Field label={L("长度", "Length")}>
              <TextInput value={String(length())} onChange={setLength} testID="password-length" />
            </Field>
          </View>
          <Button onPress={() => length.set(12)}>{L("12 位", "12")}</Button>
          <Button onPress={() => length.set(20)}>{L("20 位", "20")}</Button>
          <Button onPress={() => length.set(32)}>{L("32 位", "32")}</Button>
        </View>
        <View class="flex-row flex-wrap gap-2">
          <Toggle label={L("小写字母", "Lowercase")} checked={lowercase()} onChange={(value) => { lowercase.set(value); regenerate() }} />
          <Toggle label={L("大写字母", "Uppercase")} checked={uppercase()} onChange={(value) => { uppercase.set(value); regenerate() }} />
          <Toggle label={L("数字", "Digits")} checked={digits()} onChange={(value) => { digits.set(value); regenerate() }} />
          <Toggle label={L("符号", "Symbols")} checked={symbols()} onChange={(value) => { symbols.set(value); regenerate() }} />
          <Toggle label={L("排除易混淆字符", "Avoid ambiguous")} checked={avoidAmbiguous()} onChange={(value) => { avoidAmbiguous.set(value); regenerate() }} />
        </View>
      </Card>

      <Card>
        <CardHeader
          title={L("密码", "Password")}
          description={L(`约 ${strength().bits} 位熵 · ${strengthLabel(strength().label)}`, `~${strength().bits} bits · ${strengthLabel(strength().label)}`)}
          right={<CopyButton value={() => password()} testID="password-copy" />}
        />
        <OutputBox value={password()} height={90} testID="password-output" />
        <View class="h-2 overflow-hidden rounded-full bg-muted">
          <View
            class="h-2 rounded-full"
            classList={{
              "bg-destructive": strength().label === "weak",
              "bg-brand-orange": strength().label === "fair",
              "bg-up": strength().label === "strong" || strength().label === "excellent",
            }}
            style={{ width: `${strength().percent}%` }}
          />
        </View>
        <Button tone="primary" onPress={regenerate} testID="password-generate">
          {L("重新生成", "Regenerate")}
        </Button>
      </Card>
    </View>
  )
}

function strengthLabel(label: string): string {
  switch (label) {
    case "weak":
      return L("弱", "weak")
    case "fair":
      return L("一般", "fair")
    case "strong":
      return L("强", "strong")
    default:
      return L("很强", "excellent")
  }
}
