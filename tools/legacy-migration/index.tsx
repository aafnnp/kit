import { Image, Picker, signal, Text, View } from "nsh"
import { Button, Card, CardHeader, CopyButton, Field, OutputBox, TextInput } from "../../components/ui"
import { L, language, pick } from "../../lib/locale"
import { activeSlug } from "../../lib/state"
import { legacyToolSpecBySlug } from "./specs"
import { encodeBase64Bytes } from "./helpers"
import { runLegacyTool } from "./run"

export default function LegacyMigrationTool() {
  const slug = activeSlug() ?? ""
  const spec = legacyToolSpecBySlug.get(slug)
  if (!spec) {
    return <Card><Text>{L("此工具尚未配置。", "This tool is not configured.")}</Text></Card>
  }
  const input = signal(spec.defaultInput ?? "")
  const secondary = signal(spec.secondary?.default ?? "")
  const output = signal("")
  const error = signal("")
  const pickedImage = signal("")
  const secondaryField = spec.secondary
  const usesImagePicker = spec.imagePicker === true

  const run = () => {
    error.set("")
    try {
      const source = pickedImage() && usesImagePicker ? pickedImage() : input()
      const result = runLegacyTool(slug, source, secondary())
      output.set(result.output)
      if (result.warning) error.set(result.warning)
    } catch (cause) {
      error.set(cause instanceof Error ? cause.message : String(cause))
      output.set("")
    }
  }

  const chooseImage = async () => {
    error.set("")
    try {
      if (!spec.pickOptions) return
      const images = await Picker.pickImages(spec.pickOptions(input()))
      const image = images[0]
      if (!image) return
      if (image.file.size > 8 * 1024 * 1024) throw new Error(L("图片超过 8 MiB；请先缩小后再处理。", "Image exceeds 8 MiB; resize it before processing."))
      const bytes = new Uint8Array(await image.file.arrayBuffer())
      const dataUrl = `data:${image.file.type || "image/jpeg"};base64,${encodeBase64Bytes(bytes)}`
      pickedImage.set(dataUrl)
      output.set("")
      error.set(`${image.file.name || L("已选择图片", "Image selected")} · ${image.file.type || "image/unknown"} · ${image.size.width}×${image.size.height} · ${image.file.size} B`)
    } catch (cause) {
      error.set(cause instanceof Error ? cause.message : String(cause))
    }
  }

  return (
    <View class="gap-4">
      <Card>
        <CardHeader title={pick(spec.meta.name)} description={pick(spec.meta.description)} />
        <Field label={spec.primaryLabel ? pick(spec.primaryLabel) : L("输入内容", "Input")}>
          <TextInput
            value={input()}
            onChange={(value) => input.set(value)}
            multiline
            height={220}
            mono
            testID="migration-tool-input"
            placeholder={spec.primaryPlaceholder ? pick(spec.primaryPlaceholder) : undefined}
          />
        </Field>
        {secondaryField ? (
          <Field label={pick(secondaryField.label)}>
            <TextInput
              value={secondary()}
              onChange={(value) => secondary.set(value)}
              testID="migration-tool-secondary"
              placeholder={secondaryField.placeholder ? pick(secondaryField.placeholder) : undefined}
            />
          </Field>
        ) : null}
        <View class="flex-row flex-wrap gap-2">
          {usesImagePicker ? (
            <Button onPress={() => { void chooseImage() }} testID="migration-tool-pick-image">
              {L("选择图片…", "Choose image…")}
            </Button>
          ) : null}
          <Button tone="primary" onPress={run} testID="migration-tool-run">
            {L("处理", "Process")}
          </Button>
        </View>
        {error() ? <Text class="text-xs text-muted-foreground" testID="migration-tool-message">{error()}</Text> : null}
      </Card>
      {pickedImage() && (slug === "image-compress" || slug === "image-convert" || slug === "image-resize" || slug === "base64-image") ? (
        <Card>
          <CardHeader title={L("已选择图片", "Selected image")} description={L("预览在本机显示；图片数据不会上传。", "Preview is shown locally; image data is not uploaded.")} />
          <Image src={pickedImage()} resizeMode="contain" style={{ width: 240, height: 180 }} />
        </Card>
      ) : null}
      {output() ? (
        <Card>
          <CardHeader
            title={L("结果", "Result")}
            right={<CopyButton value={() => output()} testID="migration-tool-copy" />}
          />
          <OutputBox value={output()} height={300} testID="migration-tool-output" />
        </Card>
      ) : null}
      <Text class="text-[11px] text-muted-foreground">
        {language() === "zh" ? "离线处理 · 不会自动访问网络或执行本机命令" : "Offline processing · no automatic network requests or local commands"}
      </Text>
    </View>
  )
}
