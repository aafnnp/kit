import { expect, test } from "nsh/test"
import { formatJson, minifyJson, isValidJson } from "../tools/json-pretty/logic"
import { jsonToTs } from "../tools/json-to-ts/logic"
import { csvToJson, parseCsv } from "../tools/csv-to-json/logic"
import { decodeBase64, encodeBase64 } from "../tools/base64-encode/logic"
import { decodeUrl, encodeUrl, parseQuery } from "../tools/url-encode/logic"
import { decodeJwt, timeClaims } from "../tools/jwt-decode/logic"
import { textStats, topWords } from "../tools/word-count/logic"
import { convertCase, splitWords } from "../tools/char-case/logic"
import { diffLines } from "../tools/diff-viewer/logic"
import { runRegex } from "../tools/regex-tester/logic"
import { generateLorem } from "../tools/lorem-ipsum/logic"
import { hashText, selfCheck } from "../tools/hash/logic"
import { generateUuids, isUuid } from "../tools/uuid-generator/logic"
import { generatePassword, passwordStrength } from "../tools/password-generator/logic"
import { fromTimestamp, parseDate, relativeTime } from "../tools/unix-timestamp/logic"
import { numberToRoman, romanToNumber } from "../tools/roman-numeral/logic"
import { analyzePrime, isPrime } from "../tools/prime-checker/logic"
import { formatRoot, solveQuadratic } from "../tools/quadratic-solver/logic"
import { generateMarkdownToc, parseHeadings } from "../tools/markdown-toc/logic"
import { compareJson } from "../tools/json-diff/logic"
import { analyzeColor, convertColor, parseColor } from "../tools/hex-rgb/logic"
import { inspectUrl } from "../tools/url-parser/logic"
import { calculateTimeDifference } from "../tools/time-diff/logic"
import { generateCssClamp } from "../tools/css-clamp/logic"
import { generateBorderRadius } from "../tools/border-radius/logic"
import { generateLinearGradient } from "../tools/gradient-maker/logic"
import { generateBoxShadow } from "../tools/shadow-generator/logic"
import { generateRandomColor } from "../tools/random-color/logic"
import { convertTimeZones } from "../tools/timezone-convert/logic"
import { mimeDatabase, searchMime } from "../tools/mime-search/logic"
import { httpStatuses, searchHttpStatuses } from "../tools/http-status/logic"
import { generateFakeUser } from "../tools/fake-user/logic"
import { parseLotteryItems, pickLottery } from "../tools/lottery-picker/logic"
import { calculateMatrix, formatMatrix, parseMatrix } from "../tools/matrix-math/logic"
import { regexTips, searchRegexTips } from "../tools/regex-cheatsheet/logic"
import { formatCronDate, nextCronRuns } from "../tools/cron-parser/logic"
import { formatCsvTable, sortCsvTable } from "../tools/table-sorter/logic"
import { gitCommands, searchGitCommands } from "../tools/git-helper/logic"
import { legacyToolSpecs } from "../tools/legacy-migration/specs"
import {
  createCode39Svg,
  createQrSvg,
  formatCode,
  inspectHtml,
  inspectIpv4,
  jsonBarChart,
  makeSvgSprite,
  minifySvg,
  runLegacyTool,
  signJwt,
  textToPdfBase64,
  yamlToJson,
} from "../tools/legacy-migration/logic"

test("JSON formats, minifies and reports errors", () => {
  expect(formatJson('{"b":1,"a":2}', 2)).toEqual({ ok: true, output: '{\n  "b": 1,\n  "a": 2\n}' })
  expect(formatJson('{"b":1,"a":2}', 2, true)).toEqual({ ok: true, output: '{\n  "a": 2,\n  "b": 1\n}' })
  expect(minifyJson('{ "a": 1 }')).toEqual({ ok: true, output: '{"a":1}' })
  expect(formatJson("{").ok).toBe(false)
  expect(isValidJson('{"a":1}')).toBe(true)
  expect(isValidJson("{")).toBe(false)
})

test("JSON to TypeScript merges array objects", () => {
  const result = jsonToTs('{"items":[{"id":1,"name":"a"},{"id":2,"extra":true}]}', "Sample")
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.output).toContain("export interface Sample")
    expect(result.output).toContain("items: Item[]")
    expect(result.output).toContain("extra?: boolean")
  }
})

test("CSV handles quotes and newlines", () => {
  const rows = parseCsv('a,b\n"x, y","line1\nline2"')
  expect(rows.length).toBe(2)
  expect(rows[1]).toEqual(["x, y", "line1\nline2"])
  const json = csvToJson("name,age\nAda,36", { delimiter: ",", hasHeader: true, inferTypes: true })
  expect(json.ok).toBe(true)
  if (json.ok) {
    expect(json.output).toBe('[\n  {\n    "name": "Ada",\n    "age": 36\n  }\n]')
  }
})

test("Base64 round-trips UTF-8 and URL-safe text", () => {
  const text = "Kit · 工具箱 🧰"
  expect(decodeBase64(encodeBase64(text))).toBe(text)
  const safe = encodeBase64("a+b/c?", true)
  expect(safe.includes("+")).toBe(false)
  expect(decodeBase64(safe, true)).toBe("a+b/c?")
  expect(() => decodeBase64("!!!!")).toThrow()
})

test("URL encoding and query parsing", () => {
  expect(encodeUrl("a b", "component")).toBe("a%20b")
  expect(decodeUrl("a%20b", "component")).toBe("a b")
  expect(parseQuery("https://x.dev/?a=1&b=hello%20world")).toEqual([
    { key: "a", value: "1" },
    { key: "b", value: "hello world" },
  ])
})

test("JWT decodes header and payload", () => {
  const header = encodeBase64('{"alg":"HS256","typ":"JWT"}', true)
  const payload = encodeBase64('{"sub":"42","name":"Ada","exp":2000000000}', true)
  const token = `${header}.${payload}.signature`
  const result = decodeJwt(token)
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.jwt.header.alg).toBe("HS256")
    expect(result.jwt.payload.name).toBe("Ada")
    expect(timeClaims(result.jwt.payload, 1000000000000).length).toBe(1)
  }
  expect(decodeJwt("not-a-jwt").ok).toBe(false)
})

test("word count handles Latin and CJK", () => {
  const stats = textStats("Hello world.\n你好世界。", 200)
  expect(stats.characters).toBe(18)
  expect(stats.words).toBe(7)
  expect(stats.sentences).toBe(2)
  expect(stats.paragraphs).toBe(1)
  expect(stats.lines).toBe(2)
  expect(topWords("apple banana apple cherry apple").slice(0, 1)[0]).toEqual({ word: "apple", count: 3 })
})

test("case conversion covers camel, snake and kebab", () => {
  expect(splitWords("HTTPServer-response_code")).toEqual(["HTTP", "Server", "response", "code"])
  expect(convertCase("kit local toolbox", "camel")).toBe("kitLocalToolbox")
  expect(convertCase("kit local toolbox", "snake")).toBe("kit_local_toolbox")
  expect(convertCase("kit local toolbox", "kebab")).toBe("kit-local-toolbox")
  expect(convertCase("kit local toolbox", "constant")).toBe("KIT_LOCAL_TOOLBOX")
  expect(convertCase("Kit", "reverse")).toBe("tiK")
})

test("diff reports additions and removals", () => {
  const diff = diffLines("a\nb\nc", "a\nc\nd")
  expect(diff.added).toBe(1)
  expect(diff.removed).toBe(1)
  expect(diff.unchanged).toBe(2)
  expect(diff.lines.map((line) => line.kind)).toEqual(["same", "remove", "same", "add"])
})

test("regex returns matches, groups and segments", () => {
  const result = runRegex("(\\w+)@(\\w+)\\.com", "g", "ada@example.com and grace@navy.com")
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.result.matches.length).toBe(2)
    expect(result.result.matches[0]!.groups[0]).toBe("ada")
    expect(result.result.segments.filter((segment) => segment.match).length).toBe(2)
  }
  expect(runRegex("(", "", "x").ok).toBe(false)
})

test("lorem is deterministic for a seed and starts with Lorem ipsum", () => {
  const a = generateLorem({ paragraphs: 2, sentencesPerParagraph: 3, startWithLorem: true, seed: 42 })
  const b = generateLorem({ paragraphs: 2, sentencesPerParagraph: 3, startWithLorem: true, seed: 42 })
  expect(a).toBe(b)
  expect(a.startsWith("Lorem ipsum dolor sit amet")).toBe(true)
  expect(a.split(/\n\s*\n/).length).toBe(2)
})

test("hash matches known vectors", () => {
  expect(hashText("abc", "md5")).toBe("900150983cd24fb0d6963f7d28e17f72")
  expect(hashText("abc", "sha256")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad")
  expect(selfCheck("sha512")).toBe(true)
})

test("UUID values are v4", () => {
  const values = generateUuids({ count: 3, uppercase: true, braces: true })
  expect(values.length).toBe(3)
  expect(values[0]!.startsWith("{")).toBe(true)
  expect(isUuid(values[0]!)).toBe(true)
  expect(isUuid("not-a-uuid")).toBe(false)
})

test("password generation respects options", () => {
  const password = generatePassword({ length: 32, lowercase: true, uppercase: true, digits: true, symbols: true, avoidAmbiguous: true })
  expect(password.length).toBe(32)
  expect(/[a-z]/.test(password)).toBe(true)
  expect(/[A-Z]/.test(password)).toBe(true)
  expect(/[0-9]/.test(password)).toBe(true)
  expect(/[^A-Za-z0-9]/.test(password)).toBe(true)
  expect(passwordStrength(password).label === "strong" || passwordStrength(password).label === "excellent").toBe(true)
})

test("timestamps convert in both directions", () => {
  const parts = fromTimestamp(0)
  expect(parts?.iso).toBe("1970-01-01T00:00:00.000Z")
  expect(parts?.timestamp).toBe(0)
  expect(parseDate("1970-01-01T00:00:00Z")?.timestamp).toBe(0)
  expect(relativeTime(new Date(0), 60000)).toBe("1 minute ago")
  expect(fromTimestamp(Number.NaN)).toBe(null)
})

test("Roman numeral conversion is canonical and range checked", () => {
  expect(numberToRoman(2025)).toBe("MMXXV")
  expect(romanToNumber("mmxxv")).toBe(2025)
  expect(numberToRoman(3999)).toBe("MMMCMXCIX")
  expect(() => romanToNumber("IIII")).toThrow()
  expect(() => numberToRoman(4000)).toThrow()
})

test("prime checker handles small values, composites and uint64 edge cases", () => {
  expect(isPrime(2n)).toBe(true)
  expect(isPrime(97n)).toBe(true)
  expect(isPrime(1n)).toBe(false)
  expect(isPrime(221n)).toBe(false)
  expect(isPrime(18_446_744_073_709_551_557n)).toBe(true)
  expect(analyzePrime("12.5").ok).toBe(false)
  expect(analyzePrime("18446744073709551616").ok).toBe(false)
})

test("quadratic solver covers real, complex and degenerate equations", () => {
  const realRoots = solveQuadratic(1, -3, 2)
  expect(realRoots.kind).toBe("quadratic")
  if (realRoots.kind === "quadratic") expect(realRoots.roots.map(formatRoot)).toEqual(["1", "2"])
  const complexRoots = solveQuadratic(1, 0, 1)
  expect(complexRoots.kind).toBe("quadratic")
  if (complexRoots.kind === "quadratic") expect(complexRoots.roots.map(formatRoot)).toEqual(["1i", "-1i"])
  expect(solveQuadratic(0, 2, -4)).toEqual({ kind: "linear", roots: [{ real: 2, imaginary: 0 }] })
  expect(solveQuadratic(0, 0, 0).kind).toBe("identity")
  expect(solveQuadratic(0, 0, 3).kind).toBe("inconsistent")
})

test("Markdown TOC skips fences and disambiguates duplicate anchors", () => {
  const markdown = "# Guide\n\n## Intro\n\n## Intro\n\n```md\n# not a heading\n```\n"
  expect(parseHeadings(markdown).map((heading) => heading.slug)).toEqual(["guide", "intro", "intro-1"])
  expect(generateMarkdownToc(markdown)).toBe("- [Guide](#guide)\n  - [Intro](#intro)\n  - [Intro](#intro-1)")
})

test("JSON diff reports nested edits, additions, removals and invalid JSON", () => {
  const result = compareJson('{"a":{"x":1},"list":[1,2],"gone":true}', '{"a":{"x":2},"list":[1,3,4],"new":false}')
  expect(result.added).toBe(2)
  expect(result.removed).toBe(1)
  expect(result.changed).toBe(2)
  expect(result.differences.map((difference) => difference.path)).toEqual([
    '$["a"]["x"]',
    '$["gone"]',
    '$["list"][1]',
    '$["list"][2]',
    '$["new"]',
  ])
  expect(() => compareJson("{", "{}")).toThrow()
  let deepLeft: unknown = 1
  let deepRight: unknown = 2
  for (let depth = 0; depth < 110; depth += 1) {
    deepLeft = { nested: deepLeft }
    deepRight = { nested: deepRight }
  }
  expect(compareJson(JSON.stringify(deepLeft), JSON.stringify(deepRight)).changed).toBe(1)
})

test("color conversion accepts HEX and RGB and reports contrast", () => {
  expect(parseColor("#f0c")).toEqual({ r: 255, g: 0, b: 204 })
  expect(convertColor("rgb(255, 0, 0)").hex).toBe("#FF0000")
  const black = analyzeColor({ r: 0, g: 0, b: 0 })
  expect(black.cmyk).toEqual({ c: 0, m: 0, y: 0, k: 100 })
  expect(black.contrastWhite).toBe(21)
  expect(black.recommendedText).toBe("white")
  expect(() => parseColor("rgb(300,0,0)")).toThrow()
})

test("URL inspector extracts repeated query parameters without exposing passwords", () => {
  const parsed = inspectUrl("https://user:secret@example.com:8443/a/b?q=one&q=two#part")
  expect(parsed.protocol).toBe("https:")
  expect(parsed.hostname).toBe("example.com")
  expect(parsed.port).toBe("8443")
  expect(parsed.pathSegments).toEqual(["a", "b"])
  expect(parsed.searchParams).toEqual([{ key: "q", value: "one" }, { key: "q", value: "two" }])
  expect(parsed.hasCredentials).toBe(true)
  expect("password" in parsed).toBe(false)
  expect(() => inspectUrl("/relative/path")).toThrow()
})

test("time difference preserves direction and splits elapsed units", () => {
  const result = calculateTimeDifference("2025-01-01T00:00:00Z", "2025-01-02T03:04:05.006Z")
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.difference.direction).toBe("forward")
    expect(result.difference.totalMilliseconds).toBe(97_445_006)
    expect([result.difference.days, result.difference.hours, result.difference.minutes, result.difference.seconds, result.difference.milliseconds])
      .toEqual([1, 3, 4, 5, 6])
  }
  const reversed = calculateTimeDifference("2025-01-02T00:00:00Z", "2025-01-01T00:00:00Z")
  expect(reversed.ok && reversed.difference.direction).toBe("backward")
  expect(calculateTimeDifference("invalid", "2025-01-01").ok).toBe(false)
})

test("CSS clamp generator validates range and produces responsive declarations", () => {
  expect(generateCssClamp("font-size", 16, 32, 360, 1440))
    .toBe("font-size: clamp(16px, calc(16px + 1.4815vw - 5.3333px), 32px);")
  expect(() => generateCssClamp("font-size", 32, 16, 360, 1440)).toThrow()
})

test("border radius generator minimizes CSS shorthand", () => {
  expect(generateBorderRadius({ topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 }, "px"))
    .toBe("border-radius: 8px;")
  expect(generateBorderRadius({ topLeft: 8, topRight: 4, bottomRight: 8, bottomLeft: 4 }, "rem"))
    .toBe("border-radius: 8rem 4rem;")
  expect(generateBorderRadius({ topLeft: 8, topRight: 4, bottomRight: 2, bottomLeft: 4 }, "%"))
    .toBe("border-radius: 8% 4% 2%;")
})

test("gradient and shadow generators validate and normalize colors", () => {
  expect(generateLinearGradient("#f00", "rgb(0, 0, 255)", 90))
    .toBe("background: linear-gradient(90deg, #FF0000 0%, #0000FF 100%);")
  expect(() => generateLinearGradient("#fff", "#000", 361)).toThrow()
  expect(generateBoxShadow({ x: 0, y: 8, blur: 24, spread: 0, color: "#000", opacity: 18, inset: false }))
    .toBe("box-shadow: 0px 8px 24px 0px rgba(0, 0, 0, 0.18);")
  expect(() => generateBoxShadow({ x: 0, y: 0, blur: -1, spread: 0, color: "#000", opacity: 20, inset: true })).toThrow()
})

test("random color generator can be deterministic and checks its random source", () => {
  const values = [0, 0.5, 0.999]
  expect(generateRandomColor(() => values.shift() ?? 0)).toBe("#0080FF")
  expect(() => generateRandomColor(() => 1)).toThrow()
})

test("timezone converter applies date-specific offsets", () => {
  const winter = convertTimeZones("2025-01-01T12:00:00Z", ["UTC", "America/New_York", "Asia/Shanghai"])
  expect(winter.map((zone) => zone.offsetLabel)).toEqual(["UTC+00:00", "UTC−05:00", "UTC+08:00"])
  expect(winter.map((zone) => zone.formatted)).toEqual(["2025-01-01 12:00", "2025-01-01 07:00", "2025-01-01 20:00"])
  const summer = convertTimeZones("2025-07-01T12:00:00Z", ["America/New_York"])
  expect(summer[0]!.offsetLabel).toBe("UTC−04:00")
  const australianSummer = convertTimeZones("2025-01-01T12:00:00Z", ["Australia/Sydney"])
  expect(australianSummer[0]!.offsetLabel).toBe("UTC+11:00")
  expect(convertTimeZones("2025-07-01T12:00:00Z", ["Australia/Sydney"])[0]!.offsetLabel).toBe("UTC+10:00")
  expect(() => convertTimeZones("invalid", ["UTC"])).toThrow()
  expect(() => convertTimeZones("2007-01-01T12:00:00Z", ["UTC"])).toThrow()
  expect(() => convertTimeZones("2025-01-01T12:00:00Z", ["Asia/Kolkata"])).toThrow()
})

test("MIME search matches extensions, names and case-insensitive queries", () => {
  expect(searchMime(".PNG").map((entry) => entry.mimeType)).toEqual(["image/png"])
  expect(searchMime("pdf").map((entry) => entry.mimeType)).toEqual(["application/pdf"])
  expect(searchMime("image").length).toBeGreaterThan(1)
  expect(searchMime("no-such-format")).toEqual([])
  expect(mimeDatabase.length).toBeGreaterThan(30)
})

test("HTTP status lookup covers common codes and unknown searches", () => {
  expect(searchHttpStatuses("404").map((status) => status.phrase)).toEqual(["Not Found"])
  expect(searchHttpStatuses("gateway").map((status) => status.code)).toEqual([502, 504])
  expect(searchHttpStatuses("unknown")).toEqual([])
  expect(httpStatuses.length).toBeGreaterThan(20)
})

test("fake user generator produces deterministic synthetic contact data", () => {
  const user = generateFakeUser(() => 0)
  expect(user.firstName).toBe("Alex")
  expect(user.lastName).toBe("Sample")
  expect(user.email).toBe("alex.sample00@example.test")
  expect(user.phone).toBe("+1-202-555-0100")
  expect(() => generateFakeUser(() => 1)).toThrow()
})

test("lottery picker parses unique entries and samples without replacement", () => {
  expect(parseLotteryItems("Ada, Grace，Ada\nLinus")).toEqual(["Ada", "Grace", "Linus"])
  expect(pickLottery(["a", "b", "c"], 2, () => 0)).toEqual(["a", "b"])
  expect(() => pickLottery(["a"], 2)).toThrow()
  expect(() => pickLottery([], 1)).toThrow()
})

test("matrix calculator validates shapes and performs common operations", () => {
  const a = parseMatrix("1, 2\n3, 4")
  const b = parseMatrix("5, 6\n7, 8")
  expect(formatMatrix(calculateMatrix(a, b, "add"))).toBe("6\t8\n10\t12")
  expect(formatMatrix(calculateMatrix(a, b, "multiply"))).toBe("19\t22\n43\t50")
  expect(formatMatrix(calculateMatrix(a, null, "transpose"))).toBe("1\t3\n2\t4")
  expect(() => parseMatrix("1, 2\n3")).toThrow()
  expect(() => calculateMatrix(a, [[1], [2], [3]], "multiply")).toThrow()
})

test("regex cheat sheet can search syntax and examples", () => {
  expect(searchRegexTips("lookahead").map((tip) => tip.title)).toEqual(["Positive lookahead"])
  expect(searchRegexTips("\\d").length).toBeGreaterThan(0)
  expect(regexTips.length).toBeGreaterThan(10)
})

test("cron parser expands fields and computes upcoming local occurrences", () => {
  const runs = nextCronRuns("*/15 * * * *", new Date(2025, 0, 1, 0, 7), 3)
  expect(runs.map(formatCronDate)).toEqual([
    "2025-01-01 00:15",
    "2025-01-01 00:30",
    "2025-01-01 00:45",
  ])
  expect(() => nextCronRuns("60 * * * *", new Date(), 1)).toThrow()
  expect(() => nextCronRuns("* * *", new Date(), 1)).toThrow()
  expect(() => nextCronRuns("* * * * *", new Date(), 11)).toThrow()
})

test("table sorter preserves CSV fields and sorts numeric columns stably", () => {
  const rows = sortCsvTable('name,score,note\nAda,9,"a, b"\nGrace,10,c\nLinus,9,d', 1, "descending")
  expect(rows.map((row) => row[0])).toEqual(["name", "Grace", "Ada", "Linus"])
  expect(formatCsvTable(rows)).toBe('name,score,note\nGrace,10,c\nAda,9,"a, b"\nLinus,9,d')
  expect(() => sortCsvTable("a,b\n1", 0, "ascending")).toThrow()
})

test("Git helper searches localized command details and filters categories", () => {
  expect(gitCommands.length).toBeGreaterThan(10)
  expect(searchGitCommands("快进式").map((command) => command.id)).toEqual(["pull"])
  expect(searchGitCommands("switch", "branch").map((command) => command.id)).toEqual(["branch-create", "branch-switch"])
  expect(searchGitCommands("no-such-command")).toEqual([])
})

test("legacy data converters reject unsafe YAML features and format supported code", () => {
  expect(JSON.parse(yamlToJson("name: Kit\nitems:\n  - clipboard\n  - formatter\nactive: true"))).toEqual({
    name: "Kit",
    items: ["clipboard", "formatter"],
    active: true,
  })
  expect(() => yamlToJson("x: !!js/function alert(1)")).toThrow()
  expect(runLegacyTool("code-formatter", '{"a":1}', "json").output).toContain('"a": 1')
  expect(runLegacyTool("excel-to-json", "name\tage\nAda\t36").output).toContain('"age": 36')
})

test("remaining tools produce validated QR, barcode, SVG and safe HTML output", () => {
  expect(createQrSvg("Kit").startsWith("<svg")).toBe(true)
  expect(() => createQrSvg("abcdefghijklmnopqr")).toThrow()
  expect(createCode39Svg("KIT-39")).toContain("<rect")
  expect(() => createCode39Svg("invalid!")).toThrow()
  expect(inspectHtml('<script>alert(1)</script><img src="x" onerror="x">').removed).toBe(2)
  expect(() => minifySvg('<svg onload="alert(1)"></svg>')).toThrow()
})

test("legacy helpers calculate JWTs, checksums, PDFs, IP ranges and plots locally", () => {
  expect(JSON.parse(decodeBase64(signJwt('{"sub":"42"}', "local-test-key").split(".")[1]!, true)).sub).toBe("42")
  expect(runLegacyTool("md5-hash", "abc").output).toBe("900150983cd24fb0d6963f7d28e17f72")
  const pdf = decodeBase64(textToPdfBase64("Hello, Kit!"))
  expect(pdf.startsWith("%PDF-1.4")).toBe(true)
  const xref = Number(/startxref\n(\d+)/.exec(pdf)?.[1])
  expect(pdf.slice(xref, xref + 4)).toBe("xref")
  expect(inspectIpv4("192.168.1.42/24")).toContain("192.168.1.0/24")
  expect(jsonBarChart("[1,2]").split("\n")).toHaveLength(2)
})

test("legacy network, file and system helpers disclose their offline boundaries", () => {
  expect(runLegacyTool("api-tester", '{"url":"https://example.test","method":"GET"}').output).toContain("no request was sent")
  expect(runLegacyTool("dns-lookup", "example.test").output).toContain("does not contact a DNS resolver")
  expect(runLegacyTool("currency-convert", "25 USD EUR").output).toContain("Illustrative offline reference rates")
  expect(runLegacyTool("audio-convert", "input.wav,mp3").output).toContain("does not run FFmpeg")
  expect(runLegacyTool("bcrypt-hash", `$2b$12$${"a".repeat(53)}`).output).toContain("no hash was generated")
  expect(runLegacyTool("file-hash", "base64:YQ==", "sha256").output).toBe(hashText("a", "sha256"))
  expect(() => runLegacyTool("image-crop", "0,0,20,20")).toThrow()
})

test("Mermaid parser understands shapes, labels and chained edges", () => {
  const output = runLegacyTool("markdown-mermaid", "graph TD\nA[Start] --> B[Finish]\nB --> C{Decision}\nC -- yes --> D").output
  expect(output).toContain("Direction: TD")
  expect(output).toContain("A: Start")
  expect(output).toContain("B: Finish")
  expect(output).toContain("C: Decision")
  expect(output).toContain("A → B")
  expect(output).toContain("B → C")
  expect(output).toContain("C → D")
  expect(output).not.toContain("graph: graph")
})

test("command templates reject shell metacharacters", () => {
  expect(() => runLegacyTool("audio-convert", "$(touch /tmp/kit-pwn).wav,mp3")).toThrow()
  expect(() => runLegacyTool("audio-convert", "`touch /tmp/kit-pwn`.wav,mp3")).toThrow()
  expect(runLegacyTool("audio-convert", "input.wav,mp3").output).toContain('"input.wav"')
})

test("CSV de-duplicates headers and rejects ragged rows", () => {
  const duplicate = csvToJson("a,a\n1,2", { delimiter: ",", hasHeader: true, inferTypes: true })
  expect(duplicate.ok).toBe(true)
  if (duplicate.ok) {
    expect(JSON.parse(duplicate.output)).toEqual([{ a: 1, a_2: 2 }])
  }
  const collision = csvToJson("a,a,a_2\n1,2,3", { delimiter: ",", hasHeader: true, inferTypes: true })
  expect(collision.ok).toBe(true)
  if (collision.ok) {
    expect(JSON.parse(collision.output)).toEqual([{ a: 1, a_2: 2, a_2_2: 3 }])
  }
  const ragged = csvToJson("a,b\n1", { delimiter: ",", hasHeader: true, inferTypes: true })
  expect(ragged.ok).toBe(false)
})

test("HTML inspection removes entity-obfuscated and protocol-relative URLs", () => {
  const result = inspectHtml('<a href="&#106;avascript:alert(1)">x</a><img src="//evil.test/x.png"><div ok="1">y</div>')
  expect(result.removed).toBe(2)
  expect(result.html).toContain('<div ok="1">')
  expect(result.html).not.toContain("javascript")
  expect(result.html).not.toContain("//evil.test")
})

test("SVG minification preserves text while rejecting active resources", () => {
  expect(minifySvg('<svg><text xml:space="preserve">Hello   world</text></svg>')).toContain("Hello   world")
  expect(() => minifySvg('<svg><style>@import url(https://evil.test/x.css);</style></svg>')).toThrow()
  expect(() => minifySvg('<svg><style>body{background:url(data:text/html;base64,abc)}</style></svg>')).toThrow()
  expect(() => minifySvg('<svg><style>rect{fill:red}</style><style>@import "https://evil.test/x.css";</style></svg>')).toThrow()
  expect(() => minifySvg('<svg><image href="//evil.test/x.png"/></svg>')).toThrow()
  expect(() => minifySvg('<svg><use xlink:href="https://evil.test/x.svg#a"/></svg>')).toThrow()
  expect(minifySvg('<svg><use xlink:href="#icon"/></svg>')).toContain('xlink:href="#icon"')
})

test("SVG sprites accept formatted documents with blank lines inside", () => {
  const sprite = makeSvgSprite('<svg viewBox="0 0 24 24">\n\n<rect width="24" height="24"/>\n</svg>\n\n<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/></svg>')
  expect(sprite).toContain('id="icon-1"')
  expect(sprite).toContain('id="icon-2"')
})

test("CSS and HTML formatting preserve strings, URLs and quoted angles", () => {
  const css = formatCode('body { background: url(data:image/svg+xml;base64,abc); content: "a;b"; }', "css")
  expect(css).toContain("url(data:image/svg+xml;base64,abc)")
  expect(css).toContain('content: "a;b"')
  const html = formatCode('<div title="a>b"><span>x</span></div>', "html")
  expect(html).toContain('<div title="a>b">')
  expect(html).toContain("<span>")
  expect(html).toContain("x")
  expect(html).toContain("</span>")
})

test("JSON to TypeScript keeps generated interface names valid", () => {
  const result = jsonToTs('{"123":{"x":1}}', "123")
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.output).toContain("export interface Type123")
    expect(result.output).not.toContain("export interface 123")
  }
})

test("YAML supports sequences of mappings", () => {
  const parsed = JSON.parse(yamlToJson("users:\n  - name: Ada\n    age: 36\n  - name: Grace\n    age: 85"))
  expect(parsed).toEqual({ users: [{ name: "Ada", age: 36 }, { name: "Grace", age: 85 }] })
})

const LEGACY_INPUT_OVERRIDES: Record<string, string> = {
  "base64-image": "data:image/png;base64,iVBORw0KGgo=",
  "image-compress": "data:image/png;base64,iVBORw0KGgo=",
  "image-convert": "data:image/png;base64,iVBORw0KGgo=",
  "image-resize": "data:image/png;base64,iVBORw0KGgo=",
  "merge-pdf": textToPdfBase64("Kit"),
}
const LEGACY_THROWING = new Set(["exif-viewer", "image-crop", "image-to-pdf"])

test("every legacy tool specification has a runnable example", () => {
  for (const spec of legacyToolSpecs) {
    if (LEGACY_THROWING.has(spec.meta.slug)) continue
    const input = LEGACY_INPUT_OVERRIDES[spec.meta.slug] ?? spec.defaultInput ?? ""
    const result = spec.run(input, spec.secondary?.default ?? "", "")
    expect(result.output.length).toBeGreaterThan(0)
  }
})

test("YAML rejects duplicate keys in a mapping sequence item", () => {
  expect(() => yamlToJson("users:\n  - name: Ada\n    name: Grace")).toThrow()
})

test("CSV keeps prototype-like header names", () => {
  const result = csvToJson("__proto__,constructor\n1,2", { delimiter: ",", hasHeader: true, inferTypes: true })
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(JSON.parse(result.output)).toEqual([JSON.parse('{"__proto__":1,"constructor":2}')])
  }
})

test("YAML rejects a sequence where a mapping continuation is expected", () => {
  expect(() => yamlToJson("users:\n  - name: Ada\n    - nested")).toThrow()
})

test("YAML keeps prototype-like mapping keys", () => {
  expect(JSON.parse(yamlToJson("__proto__: value\nconstructor: other"))).toEqual(JSON.parse('{"__proto__":"value","constructor":"other"}'))
})
