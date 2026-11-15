import { signal, Text, View } from "nsh"
import { Badge, Button, Card, CardHeader, CopyButton, ErrorBanner, OutputBox, TextInput } from "../../components/ui"
import { L } from "../../lib/locale"
import { createLiveRun } from "../../lib/tool-run"
import { decodeJwt, timeClaims } from "./logic"

const SAMPLE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkYSBMb3ZlbGFjZSIsImFkbWluIjp0cnVlLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"

interface DecodedJwtView {
  header: string
  payload: string
  expired: boolean | null
}

export default function JwtDecode() {
  const token = signal(SAMPLE)
  const compute = (): DecodedJwtView => {
    const result = decodeJwt(token())
    if (!result.ok) throw new Error(result.error)
    const exp = result.jwt.payload.exp
    return {
      header: JSON.stringify(result.jwt.header, null, 2),
      payload: JSON.stringify(result.jwt.payload, null, 2),
      expired: typeof exp === "number" ? exp * 1000 < Date.now() : null,
    }
  }
  const outcome = createLiveRun<DecodedJwtView | null>({ initial: null, compute, inputs: [token], delay: 300 })
  const decoded = outcome.output

  return (
    <View class="gap-4">
      <Card>
        <CardHeader
          title={L("JWT 令牌", "JWT token")}
          description={L("仅解码查看，不校验签名；请勿粘贴生产环境令牌。", "Decodes for inspection only, without verifying. Avoid pasting production tokens.")}
          right={
            decoded()?.expired == null ? null : (
              <Badge tone={decoded()!.expired ? "down" : "up"}>{decoded()!.expired ? L("已过期", "Expired") : L("未过期", "Not expired")}</Badge>
            )
          }
        />
        <TextInput
          value={token()}
          onChange={(value) => token.set(value)}
          multiline
          height={100}
          mono
          testID="jwt-input"
          placeholder={L("粘贴 JWT…", "Paste a JWT…")}
        />
        <View class="flex-row flex-wrap gap-2">
          <Button tone="primary" onPress={() => outcome.run(compute)} testID="jwt-decode">
            {L("解码", "Decode")}
          </Button>
          <Button tone="ghost" onPress={() => token.set(SAMPLE)}>
            {L("示例", "Sample")}
          </Button>
        </View>
        {outcome.error() ? <ErrorBanner message={outcome.error()} /> : null}
      </Card>

      {decoded() ? (
        <View class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title={L("头部", "Header")} right={<CopyButton value={() => decoded()?.header ?? ""} />} />
            <OutputBox value={decoded()!.header} height={220} testID="jwt-header" />
          </Card>
          <Card>
            <CardHeader title={L("载荷", "Payload")} right={<CopyButton value={() => decoded()?.payload ?? ""} />} />
            <OutputBox value={decoded()!.payload} height={220} testID="jwt-payload" />
          </Card>
        </View>
      ) : null}

      {decoded() ? <Claims payload={decoded()!.payload} /> : null}
    </View>
  )
}

function Claims(props: { payload: string }) {
  let claims: { name: string; iso: string; relative: string }[] = []
  try {
    const parsed = JSON.parse(props.payload) as Record<string, unknown>
    claims = timeClaims(parsed)
  } catch {
    claims = []
  }

  if (!claims.length) return null

  return (
    <Card>
      <CardHeader title={L("时间声明", "Time claims")} description={L("iat / nbf / exp 的本地时间与相对时间。", "Local time and relative time for iat, nbf and exp.")} />
      <View class="gap-2">
        {claims.map((claim) => (
          <View class="flex-row flex-wrap items-center justify-between gap-2 rounded-(--radius) border border-border bg-muted/30 px-3 py-2">
            <Text class="font-mono text-xs text-foreground">{claim.name}</Text>
            <Text class="text-xs text-muted-foreground">{claim.iso}</Text>
            <Text class="text-xs text-foreground">{claim.relative}</Text>
          </View>
        ))}
      </View>
    </Card>
  )
}
