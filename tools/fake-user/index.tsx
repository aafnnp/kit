import { signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton } from "../../components/ui"
import { L } from "../../lib/locale"
import { generateFakeUser } from "./logic"

export default function FakeUserGenerator() {
  const user = signal(generateFakeUser())
  const json = () => JSON.stringify(user(), null, 2)

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("虚拟用户生成器", "Fake user generator")}
          description={L("生成仅用于本地测试的合成资料；邮箱使用保留的 example.test 域名。", "Generate synthetic test data; email addresses use the reserved example.test domain.")}
          right={<CopyButton value={json} testID="fake-user-copy" />}
        />
        <View class="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Info label={L("姓名", "Name")} value={`${user().firstName} ${user().lastName}`} />
          <Info label={L("用户名", "Username")} value={user().username} />
          <Info label={L("邮箱", "Email")} value={user().email} />
          <Info label={L("电话", "Phone")} value={user().phone} />
          <Info label={L("城市", "City")} value={user().city} />
          <Info label={L("国家代码", "Country code")} value={user().country} />
        </View>
        <Button tone="primary" onPress={() => user.set(generateFakeUser())} testID="fake-user-generate">
          {L("生成新用户", "Generate user")}
        </Button>
      </Card>
      <Card>
        <CardHeader title={L("JSON", "JSON")} right={<CopyButton value={json} label={L("复制 JSON", "Copy JSON")} />} />
        <Text class="select-text font-mono text-xs text-foreground" testID="fake-user-json">{json()}</Text>
      </Card>
    </View>
  )
}

function Info(props: { label: string; value: string }) {
  return (
    <View class="gap-0.5 rounded-md bg-muted/30 px-3 py-2">
      <Text class="text-[11px] text-muted-foreground">{props.label}</Text>
      <Text class="select-text text-xs text-foreground">{props.value}</Text>
    </View>
  )
}
