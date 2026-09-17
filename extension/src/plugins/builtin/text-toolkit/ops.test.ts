import { describe, expect, it } from "vitest"
import { TEXT_OPS, decodeBase64, encodeBase64 } from "./ops"

function run(id: string, input: string): string | Promise<string> {
  const op = TEXT_OPS.find((item) => item.id === id)
  if (!op) throw new Error(`未找到操作 ${id}`)
  return op.run(input)
}

/** 部分操作是同步的，同步抛错不会变成 rejected promise，这里统一包装 */
async function runThrowing(id: string, input: string): Promise<void> {
  await run(id, input)
}

describe("文本工具", () => {
  it("Base64 往返支持非 ASCII", () => {
    expect(decodeBase64(encodeBase64("你好 kit 🧰"))).toBe("你好 kit 🧰")
  })

  it("Base64 拒绝非法输入", async () => {
    expect(() => decodeBase64("!!!not-base64!!!")).toThrow()
  })

  it("JSON 格式化 / 压缩 / 键排序", async () => {
    expect(await run("json-format", '{"a":1}')).toBe('{\n  "a": 1\n}')
    expect(await run("json-minify", '{ "a" : 1 }')).toBe('{"a":1}')
    expect(await run("json-sort-keys", '{"b":1,"a":{"d":2,"c":3}}')).toBe(
      '{\n  "a": {\n    "c": 3,\n    "d": 2\n  },\n  "b": 1\n}',
    )
  })

  it("JSON 非法时抛出可读错误", async () => {
    await expect(runThrowing("json-format", "{oops")).rejects.toThrow(/JSON/)
  })

  it("URL 编解码往返", async () => {
    const encoded = await run("url-encode", "a b&c=中")
    expect(encoded).toBe("a%20b%26c%3D%E4%B8%AD")
    expect(await run("url-decode", encoded)).toBe("a b&c=中")
  })

  it("时间戳按位数区分秒与毫秒", async () => {
    const seconds = await run("ts-to-date", "1700000000")
    expect(seconds).toContain("2023-11-14T22:13:20.000Z")
    expect(seconds).toContain("1700000000 (s)")
    expect(await run("ts-to-date", "1700000000000")).toContain("2023-11-14T22:13:20.000Z")
  })

  it("时间转时间戳", async () => {
    expect(await run("date-to-ts-s", "2023-11-14T22:13:20Z")).toBe("1700000000")
    expect(await run("date-to-ts-ms", "2023-11-14T22:13:20Z")).toBe("1700000000000")
  })

  it("行处理", async () => {
    expect(await run("sort-lines", "b\na\nc")).toBe("a\nb\nc")
    expect(await run("dedupe-lines", "a\nb\na")).toBe("a\nb")
    expect(await run("trim-lines", " a \n b ")).toBe("a\nb")
    expect(await run("remove-blank-lines", "a\n\n   \nb")).toBe("a\nb")
  })

  it("大小写转换", async () => {
    expect(await run("upper", "kit 工具箱")).toBe("KIT 工具箱")
    expect(await run("lower", "KIT Toolbox")).toBe("kit toolbox")
    expect(await run("title", "hello WORLD")).toBe("Hello World")
  })

  it("SHA-256", async () => {
    expect(await run("sha256", "abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    )
  })

  it("统计输出包含字符、CJK 与字节数", async () => {
    const stats = await run("stats", "hello 世界")
    const lines = stats.split("\n")

    // 断言数值而不是文案：标签是双语的，断言文字会让测试依赖 locale
    expect(lines).toHaveLength(6)
    expect(lines[0]).toContain("8") // 字符数
    expect(lines[1]).toContain("7") // 不含空格
    expect(lines[3]).toContain("2") // CJK 字数
    expect(lines[4]).toContain("1") // 英文词数
    expect(lines[5]).toContain("12") // UTF-8 字节（中文 3 字节 × 2）
  })

  it("空输入给出提示而不是静默成功", async () => {
    await expect(runThrowing("base64-encode", "   ")).rejects.toThrow()
  })

  it("每个操作都有分组和标签", () => {
    for (const op of TEXT_OPS) {
      expect(op.group, op.id).toBeTruthy()
      expect(op.label, op.id).toBeTruthy()
    }
  })
})
