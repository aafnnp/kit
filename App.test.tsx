import { expect, open, test } from "nsh/test"

test("shows the welcome screen and opens settings", async () => {
  const app = await open("./App.tsx", { platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")
  expect(app.count("id:sidebar-tool-json-pretty")).toBe(1)

  await app.press("id:nav-settings")
  await app.waitFor("id:settings")
  await app.press("id:nav-home")
  await app.waitFor("id:welcome")
})

test("searches, opens a tool and generates UUIDs", async () => {
  const app = await open("./App.tsx", { locale: "zh-CN", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")

  await app.type("id:global-search", "uuid")
  await app.waitFor("id:sidebar-tool-uuid-generator")
  await app.press("id:sidebar-tool-uuid-generator")
  await app.waitFor("id:uuid-output")

  await app.press("id:uuid-quick-3")
  await app.waitUntil(() => app.texts().some((text) => text.split("\n").length === 3))
  expect(app.texts().some((text) => text.includes("-"))).toBe(true)
})

test("JSON formatter reports invalid input and formats valid input", async () => {
  const app = await open("./App.tsx", { locale: "en-US", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")
  await app.type("id:global-search", "formatter")
  await app.press("id:sidebar-tool-json-pretty")
  await app.waitFor("id:json-input")

  await app.clear("id:json-input")
  await app.type("id:json-input", "{")
  await app.press("id:json-format")
  await app.waitUntil(() => app.texts().some((text) => text.includes("JSON at position")))

  await app.clear("id:json-input")
  await app.type("id:json-input", '{"a":1}')
  await app.press("id:json-format")
  await app.waitUntil(() => app.texts().some((text) => text.includes('"a": 1')))

  await app.press("id:json-copy")
  await app.waitUntil(() => (app.clipboard() ?? "").includes('"a": 1'), { timeout: 2000 })
})

test("language and favorites persist through storage", async () => {
  const app = await open("./App.tsx", { locale: "zh-CN", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")

  await app.press("id:favorite-json-pretty")
  await app.waitUntil(() => (app.storage()["kit.favorites"] ?? "").includes("json-pretty"))

  await app.press("id:language-toggle")
  await app.waitFor("text:Welcome to Kit")
  await app.waitUntil(() => app.storage()["kit.language"] === "en")
})

const TOOLS: [string, string][] = [
  ["json-pretty", "json-input"],
  ["json-to-ts", "json-ts-input"],
  ["csv-to-json", "csv-input"],
  ["jwt-decode", "jwt-input"],
  ["base64-encode", "base64-input"],
  ["url-encode", "url-input"],
  ["word-count", "word-input"],
  ["char-case", "case-input"],
  ["diff-viewer", "diff-before"],
  ["regex-tester", "regex-pattern"],
  ["lorem-ipsum", "lorem-paragraphs"],
  ["hash", "hash-input"],
  ["uuid-generator", "uuid-output"],
  ["password-generator", "password-output"],
  ["unix-timestamp", "timestamp-input"],
  ["roman-numeral", "roman-input"],
  ["prime-checker", "prime-input"],
  ["quadratic-solver", "quadratic-a"],
  ["markdown-toc", "toc-input"],
  ["json-diff", "json-diff-left"],
  ["hex-rgb", "color-input"],
  ["url-parser", "url-parser-input"],
  ["time-diff", "time-diff-start"],
  ["css-clamp", "clamp-property"],
  ["border-radius", "radius-top-left"],
  ["gradient-maker", "gradient-first"],
  ["shadow-generator", "shadow-x"],
  ["random-color", "random-color-value"],
  ["timezone-convert", "timezone-input"],
  ["mime-search", "mime-query"],
  ["http-status", "http-status-query"],
  ["fake-user", "fake-user-json"],
  ["lottery-picker", "lottery-items"],
  ["matrix-math", "matrix-left"],
  ["regex-cheatsheet", "regex-cheatsheet-query"],
  ["cron-parser", "cron-expression"],
  ["table-sorter", "table-input"],
  ["git-helper", "git-helper-query"],
]

const LEGACY_TOOLS = [
  "api-tester", "audio-convert", "barcode-generator", "base64-image", "bcrypt-hash",
  "code-formatter", "currency-convert", "dns-lookup", "exif-viewer",
  "favicon-generator", "gif-split", "html-preview", "icon-spriter", "image-compress",
  "image-convert", "image-crop", "image-resize", "image-to-pdf", "ip-info", "json-plot", "jwt-generator",
  "lorem-image", "markdown-mermaid", "markdown-preview", "merge-pdf",
  "performance-analyzer", "performance-tester", "qr-generator", "svg-minify", "text-to-pdf",
  "user-agent", "video-trim", "yaml-to-json",
]

test("every migrated tool opens without an error", async () => {
  const app = await open("./App.tsx", { locale: "en-US", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")

  for (const [slug, marker] of TOOLS) {
    await app.press("id:nav-home")
    await app.clear("id:global-search")
    await app.type("id:global-search", slug)
    await app.waitFor(`id:sidebar-tool-${slug}`)
    await app.press(`id:sidebar-tool-${slug}`)
    await app.waitFor(`id:${marker}`)
    expect(app.texts()).not.toContain("This tool failed")
    expect(app.texts()).not.toContain("not a live signal")
  }
}, 120_000)

test("every remaining legacy tool opens in the shared migration workspace", async () => {
  const app = await open("./App.tsx", { locale: "en-US", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")

  for (const slug of LEGACY_TOOLS) {
    await app.press("id:nav-home")
    await app.clear("id:global-search")
    await app.type("id:global-search", slug)
    await app.waitFor(`id:sidebar-tool-${slug}`)
    await app.press(`id:sidebar-tool-${slug}`)
    await app.waitFor("id:migration-tool-input")
    await app.press("id:migration-tool-run")
    await app.waitUntil(() => app.shows("id:migration-tool-output") || app.shows("id:migration-tool-message"), { timeout: 2000 })
    expect(app.texts()).not.toContain("This tool failed")
    expect(app.texts()).not.toContain("not a live signal")
  }
}, 120_000)

test("CSS clamp responds to edited values", async () => {
  const app = await open("./App.tsx", { locale: "en-US", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")
  await app.type("id:global-search", "css-clamp")
  await app.press("id:sidebar-tool-css-clamp")
  await app.waitFor("id:clamp-max")

  await app.clear("id:clamp-max")
  await app.type("id:clamp-max", "48")
  await app.press("id:clamp-generate")
  await app.waitUntil(() => app.texts().some((text) => text.includes("clamp(16px") && text.includes("48px")))
})

test("Git helper filters commands and copies without executing them", async () => {
  const app = await open("./App.tsx", { locale: "en-US", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")
  await app.type("id:global-search", "git-helper")
  await app.press("id:sidebar-tool-git-helper")
  await app.waitFor("id:git-helper-query")

  await app.type("id:git-helper-query", "status")
  await app.waitFor("id:git-copy-status")
  await app.press("id:git-copy-status")
  await app.waitUntil(() => app.clipboard() === "git status", { timeout: 2000 })
  expect(app.texts()).toContain("Check status")
})

test("image picker is granted and prepares selected images", async () => {
  const app = await open("./App.tsx", { locale: "en-US", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")
  const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z0GQAAAAASUVORK5CYII="), (char) => char.charCodeAt(0))
  app.onPick(() => [{ name: "tiny.png", type: "image/png", data: png }])

  await app.type("id:global-search", "image-compress")
  await app.press("id:sidebar-tool-image-compress")
  await app.waitFor("id:migration-tool-pick-image")
  await app.press("id:migration-tool-pick-image")
  await app.waitUntil(() => app.texts().some((text) => text.includes("tiny.png")), { timeout: 3000 })
  expect(app.picks().length).toBe(1)
  expect(app.picks()[0]!.format).toBe("compatible")
  expect(app.picks()[0]!.maxDimension).toBe(2400)
})

test("clearing favorites and history requires a second press", async () => {
  const app = await open("./App.tsx", { locale: "en-US", platform: "web", width: 1280, height: 900 })
  await app.waitFor("id:welcome")
  await app.press("id:favorite-json-pretty")
  await app.waitUntil(() => (app.storage()["kit.favorites"] ?? "").includes("json-pretty"))
  await app.press("id:nav-settings")
  await app.waitFor("id:settings-clear")
  await app.press("id:settings-clear")
  await app.waitUntil(() => app.texts().some((text) => text.includes("Click again to confirm")))
  expect((app.storage()["kit.favorites"] ?? "").includes("json-pretty")).toBe(true)
  await app.press("id:settings-clear")
  await app.waitUntil(() => app.storage()["kit.favorites"] === "[]")
})

test("hidden legacy aliases remain reachable from favorites", async () => {
  const app = await open("./App.tsx", {
    locale: "en-US",
    platform: "web",
    width: 1280,
    height: 900,
    storage: { "kit.favorites": '["benchmark-tester"]' },
  })
  await app.waitFor("id:welcome")
  expect(app.shows("id:sidebar-favorite-benchmark-tester")).toBe(true)
  await app.press("id:sidebar-favorite-benchmark-tester")
  await app.waitFor("id:migration-tool-input")
  await app.press("id:migration-tool-run")
  await app.waitUntil(() => app.shows("id:migration-tool-output"), { timeout: 2000 })
  expect(app.texts().some((text) => text.includes("Iterations: 10000"))).toBe(true)
})
