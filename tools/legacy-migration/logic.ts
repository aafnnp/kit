import { createHash, createHmac, randomUUID } from "crypto"
import { csvToJson } from "../csv-to-json/logic"
import { hashText } from "../hash/logic"
import { passwordStrength } from "../password-generator/logic"

export interface LegacyToolResult {
  output: string
  warning?: string
}

function decodeBase64(value: string): Uint8Array {
  const normalized = value.replace(/\s+/g, "").replace(/^data:[^,]*;base64,/i, "")
  if (normalized.length > 16 * 1024 * 1024) throw new Error("Base64 input exceeds the 12 MiB decoded-data limit.")
  const binary = atob(normalized)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

export function encodeBase64Bytes(bytes: Uint8Array): string {
  let binary = ""
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)))
  }
  return btoa(binary)
}

function latin1(bytes: Uint8Array): string {
  let value = ""
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    value += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)))
  }
  return value
}

function stripYamlComment(line: string): string {
  let quote = ""
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!
    if (quote) {
      if (char === quote && (quote !== '"' || line[i - 1] !== "\\")) quote = ""
    } else if (char === "'" || char === '"') quote = char
    else if (char === "#" && (i === 0 || /\s/.test(line[i - 1]!))) return line.slice(0, i).trimEnd()
  }
  return line.trimEnd()
}

function yamlScalar(source: string): unknown {
  const value = source.trim()
  if (!value) return null
  if (/^[&*!]|<<\s*:/.test(value)) throw new Error("YAML tags, anchors, aliases and merge keys are not supported.")
  if (value.startsWith('"')) {
    try {
      const parsed: unknown = JSON.parse(value)
      if (typeof parsed !== "string") throw new Error("Expected a quoted string.")
      return parsed
    } catch (error) {
      throw new Error(`Invalid quoted YAML string: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  if (value.startsWith("'")) {
    if (!value.endsWith("'") || value.length < 2) throw new Error("Unterminated single-quoted YAML string.")
    return value.slice(1, -1).replace(/''/g, "'")
  }
  if ((value.startsWith("[") && value.endsWith("]")) || (value.startsWith("{") && value.endsWith("}"))) {
    try {
      return JSON.parse(value)
    } catch {
      throw new Error("Inline YAML arrays and objects must use valid JSON syntax.")
    }
  }
  if (/^(null|~)$/i.test(value)) return null
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === "true"
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:e[+-]?\d+)?$/i.test(value)) return Number(value)
  return value
}

function mappingPair(source: string): [string, string] {
  let quote = ""
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i]!
    if (quote) {
      if (char === quote && (quote !== '"' || source[i - 1] !== "\\")) quote = ""
    } else if (char === "'" || char === '"') quote = char
    else if (char === ":" && (i + 1 === source.length || /\s/.test(source[i + 1]!))) {
      const key = source.slice(0, i).trim()
      if (!key || /[\[\]{}&,*!|>@`]/.test(key)) throw new Error(`Unsupported YAML mapping key: ${key}`)
      return [String(yamlScalar(key)), source.slice(i + 1).trim()]
    }
  }
  throw new Error(`Expected a "key: value" mapping entry: ${source}`)
}

export function yamlToJson(source: string): string {
  const lines = source.split(/\r?\n/).map((raw, index) => {
    if (/^\s*\t/.test(raw)) throw new Error(`Tabs are not allowed for YAML indentation (line ${index + 1}).`)
    const cleaned = stripYamlComment(raw)
    const content = cleaned.trim()
    return { indent: cleaned.length - cleaned.trimStart().length, content, line: index + 1 }
  }).filter((line) => line.content.length > 0)
  if (!lines.length) throw new Error("Input is empty.")

  let cursor = 0
  const parseNode = (indent: number): unknown => {
    const first = lines[cursor]
    if (!first || first.indent !== indent) throw new Error("Invalid indentation.")
    const isSequence = first.content === "-" || first.content.startsWith("- ")
    const result: unknown[] | Record<string, unknown> = isSequence ? [] : {}

    while (cursor < lines.length) {
      const line = lines[cursor]!
      if (line.indent < indent) break
      if (line.indent > indent) throw new Error(`Unexpected indentation on line ${line.line}.`)
      const isItem = line.content === "-" || line.content.startsWith("- ")
      if (isItem !== isSequence) throw new Error(`Do not mix lists and mappings at line ${line.line}.`)
      cursor += 1
      if (isSequence) {
        const item = line.content === "-" ? "" : line.content.slice(2).trim()
        if (item) (result as unknown[]).push(yamlScalar(item))
        else if (cursor < lines.length && lines[cursor]!.indent > indent) {
          (result as unknown[]).push(parseNode(lines[cursor]!.indent))
        } else (result as unknown[]).push(null)
        continue
      }

      const [key, inline] = mappingPair(line.content)
      if (Object.hasOwn(result, key)) throw new Error(`Duplicate YAML key "${key}" on line ${line.line}.`)
      if (inline) (result as Record<string, unknown>)[key] = yamlScalar(inline)
      else if (cursor < lines.length && lines[cursor]!.indent > indent) {
        (result as Record<string, unknown>)[key] = parseNode(lines[cursor]!.indent)
      } else (result as Record<string, unknown>)[key] = null
    }
    return result
  }

  const value = parseNode(lines[0]!.indent)
  if (cursor !== lines.length) throw new Error(`Unexpected YAML content on line ${lines[cursor]!.line}.`)
  return JSON.stringify(value, null, 2)
}

export function formatCode(source: string, language: string): string {
  const mode = language.trim().toLowerCase()
  if (mode === "json" || mode === "application/json") {
    return JSON.stringify(JSON.parse(source), null, 2)
  }
  if (mode === "css") {
    return source
      .replace(/\s*{\s*/g, " {\n  ")
      .replace(/\s*;\s*/g, ";\n  ")
      .replace(/\s*}\s*/g, "\n}\n")
      .replace(/,\s*/g, ", ")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .join("\n")
  }
  if (mode === "html" || mode === "xml") {
    const tokens = source.replace(/>\s*</g, ">\n<").split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
    let depth = 0
    return tokens.map((token) => {
      if (/^<\//.test(token)) depth = Math.max(0, depth - 1)
      const line = `${"  ".repeat(depth)}${token}`
      if (/^<[^!?/][^>]*[^/]?>$/.test(token) && !/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(token)) depth += 1
      return line
    }).join("\n")
  }
  throw new Error("Choose JSON, CSS, HTML or XML. JavaScript formatting is not included.")
}

export function inspectHtml(source: string): { html: string; removed: number } {
  let removed = 0
  const html = source
    .replace(/<\s*(script|iframe|object|embed|applet)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, () => { removed += 1; return "" })
    .replace(/<\s*(script|iframe|object|embed|applet)\b[^>]*\/?\s*>/gi, () => { removed += 1; return "" })
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, () => { removed += 1; return "" })
    .replace(/\s+(href|src|xlink:href)\s*=\s*(["'])\s*(?:javascript:|data:text\/html)[\s\S]*?\2/gi, () => { removed += 1; return "" })
    .replace(/<\s*meta\b[^>]*http-equiv\s*=\s*(["'])?refresh\1?[^>]*>/gi, () => { removed += 1; return "" })
  return { html, removed }
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

function base64Url(value: string): string {
  const bytes = new TextEncoder().encode(value)
  return encodeBase64Bytes(bytes).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
}

export function signJwt(payloadSource: string, secret: string): string {
  if (!secret) throw new Error("Enter a signing secret.")
  const payload: unknown = JSON.parse(payloadSource)
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("JWT payload must be a JSON object.")
  const body = `${base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${base64Url(JSON.stringify(payload))}`
  const signature = encodeBase64Bytes(new Uint8Array(createHmac("sha256", secret).update(body).digest()))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
  return `${body}.${signature}`
}

export function jsonBarChart(source: string, labelKey = "label", valueKey = "value"): string {
  const parsed: unknown = JSON.parse(source)
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Provide a non-empty JSON array.")
  const points = parsed.map((item, index) => {
    if (typeof item === "number") return { label: String(index + 1), value: item }
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error(`Item ${index + 1} must be a number or object.`)
    const record = item as Record<string, unknown>
    const value = record[valueKey]
    if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`Item ${index + 1} needs a numeric "${valueKey}" property.`)
    return { label: String(record[labelKey] ?? index + 1), value }
  })
  const max = Math.max(0, ...points.map((point) => point.value))
  const min = Math.min(0, ...points.map((point) => point.value))
  const span = max - min || 1
  return points.map(({ label, value }) => {
    const width = Math.max(1, Math.round((Math.abs(value) / span) * 32))
    return `${label.slice(0, 24).padEnd(24)} ${value >= 0 ? "█".repeat(width) : "◀".repeat(width)} ${value}`
  }).join("\n")
}

const CODE39: Record<string, string> = {
  "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw",
  "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn",
  A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn",
  F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn",
  K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn",
  P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn",
  U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnwn", Y: "wwnnwnnnn",
  Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", "$": "nwnwnwnnn",
  "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn",
}

export function createCode39Svg(source: string): string {
  const value = source.trim().toUpperCase()
  if (!value || value.length > 40 || [...value].some((char) => !CODE39[char] || char === "*")) {
    throw new Error("Code 39 supports 1–40 characters: A–Z, 0–9, space and -.$/+%.")
  }
  const encoded = `*${value}*`
  const modules = encoded.split("").map((char) => CODE39[char]!)
  const width = modules.reduce((sum, pattern) => sum + [...pattern].reduce((n, size) => n + (size === "w" ? 5 : 2), 0) + 2, 0) + 20
  let x = 10
  let bars = ""
  for (const pattern of modules) {
    for (let i = 0; i < pattern.length; i += 1) {
      const barWidth = pattern[i] === "w" ? 5 : 2
      if (i % 2 === 0) bars += `<rect x="${x}" y="0" width="${barWidth}" height="60"/>`
      x += barWidth
    }
    x += 2
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="82" viewBox="0 0 ${width} 82"><rect width="100%" height="100%" fill="white"/><g fill="black">${bars}</g><text x="50%" y="76" text-anchor="middle" font-family="monospace" font-size="12">${escapeXml(value)}</text></svg>`
}

function bchRemainder(value: number, polynomial: number): number {
  let remainder = value
  const degree = 31 - Math.clz32(polynomial)
  while (remainder !== 0 && 31 - Math.clz32(remainder) >= degree) {
    remainder ^= polynomial << (31 - Math.clz32(remainder) - degree)
  }
  return remainder
}

function qrFormat(mask: number): number {
  const data = (1 << 3) | mask
  return ((data << 10) | bchRemainder(data << 10, 0x537)) ^ 0x5412
}

function qrEcc(data: number[]): number[] {
  const multiply = (left: number, right: number) => {
    let result = 0
    for (let i = 7; i >= 0; i -= 1) {
      result = ((result << 1) ^ ((result >>> 7) * 0x11d)) & 0xff
      if ((right >>> i) & 1) result ^= left
    }
    return result
  }
  let generator = [1]
  let root = 1
  for (let i = 0; i < 7; i += 1) {
    const next = new Array<number>(generator.length + 1).fill(0)
    generator.forEach((value, index) => {
      next[index] ^= value
      next[index + 1] ^= multiply(value, root)
    })
    generator = next
    root = multiply(root, 2)
  }
  const remainder = new Array<number>(7).fill(0)
  for (const byte of data) {
    const factor = byte ^ remainder.shift()!
    remainder.push(0)
    for (let i = 0; i < remainder.length; i += 1) remainder[i] ^= multiply(generator[i + 1]!, factor)
  }
  return remainder
}

function qrPenalty(matrix: boolean[][]): number {
  const size = matrix.length
  let score = 0
  const lines = [...matrix, ...Array.from({ length: size }, (_, col) => matrix.map((row) => row[col]!))]
  for (const line of lines) {
    let runColor = line[0]!
    let runLength = 1
    for (let i = 1; i < size; i += 1) {
      if (line[i] === runColor) runLength += 1
      else {
        if (runLength >= 5) score += runLength - 2
        runColor = line[i]!
        runLength = 1
      }
    }
    if (runLength >= 5) score += runLength - 2
    const text = line.map((cell) => cell ? "1" : "0").join("")
    for (let i = 0; i <= size - 11; i += 1) {
      const pattern = text.slice(i, i + 11)
      if (pattern === "00001011101" || pattern === "10111010000") score += 40
    }
  }
  for (let row = 0; row < size - 1; row += 1) {
    for (let col = 0; col < size - 1; col += 1) {
      const color = matrix[row]![col]!
      if (matrix[row]![col + 1] === color && matrix[row + 1]![col] === color && matrix[row + 1]![col + 1] === color) score += 3
    }
  }
  const dark = matrix.flat().filter(Boolean).length
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10
  return score
}

export function createQrSvg(source: string): string {
  const bytes = [...new TextEncoder().encode(source)]
  if (!bytes.length || bytes.length > 17) throw new Error("Version 1-L QR supports 1–17 UTF-8 bytes.")
  const dataBits = [0, 1, 0, 0, ...Array.from({ length: 8 }, (_, bit) => (bytes.length >>> (7 - bit)) & 1)]
  for (const byte of bytes) dataBits.push(...Array.from({ length: 8 }, (_, bit) => (byte >>> (7 - bit)) & 1))
  for (let count = 0; count < Math.min(4, 152 - dataBits.length); count += 1) dataBits.push(0)
  while (dataBits.length % 8) dataBits.push(0)
  const data = Array.from({ length: dataBits.length / 8 }, (_, index) =>
    dataBits.slice(index * 8, index * 8 + 8).reduce((value, bit) => (value << 1) | bit, 0))
  let pad = 0xec
  while (data.length < 19) {
    data.push(pad)
    pad = pad === 0xec ? 0x11 : 0xec
  }
  const codewords = [...data, ...qrEcc(data)]
  const bits = codewords.flatMap((byte) => Array.from({ length: 8 }, (_, bit) => (byte >>> (7 - bit)) & 1))
  const size = 21
  const base = Array.from({ length: size }, () => new Array<boolean | null>(size).fill(null))
  const put = (row: number, col: number, value: boolean) => { if (row >= 0 && row < size && col >= 0 && col < size) base[row]![col] = value }

  for (const [top, left] of [[0, 0], [0, 14], [14, 0]]) {
    for (let row = -1; row <= 7; row += 1) {
      for (let col = -1; col <= 7; col += 1) {
        const distance = Math.max(Math.abs(row - 3), Math.abs(col - 3))
        put(top + row, left + col, distance !== 2 && distance !== 4)
      }
    }
  }
  for (let i = 8; i < 13; i += 1) {
    put(6, i, i % 2 === 0)
    put(i, 6, i % 2 === 0)
  }
  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) { put(8, i, false); put(i, 8, false) }
  }
  for (let i = 0; i < 8; i += 1) {
    put(8, size - 1 - i, false)
    put(size - 1 - i, 8, false)
  }
  put(8, 13, true)

  const reserved = base.map((row) => row.map((cell) => cell !== null))
  const bitMatrices = Array.from({ length: 8 }, () => Array.from({ length: size }, () => new Array<boolean>(size).fill(false)))
  for (let mask = 0; mask < 8; mask += 1) {
    const matrix = bitMatrices[mask]!
    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) matrix[row]![col] = base[row]![col] ?? false
    }
    let bitIndex = 0
    let upward = true
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right -= 1
      for (let vert = 0; vert < size; vert += 1) {
        const row = upward ? size - 1 - vert : vert
        for (let offset = 0; offset < 2; offset += 1) {
          const col = right - offset
          if (reserved[row]![col]) continue
          const maskBit = mask === 0 ? (row + col) % 2 === 0
            : mask === 1 ? row % 2 === 0
            : mask === 2 ? col % 3 === 0
            : mask === 3 ? (row + col) % 3 === 0
            : mask === 4 ? (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0
            : mask === 5 ? (row * col) % 2 + (row * col) % 3 === 0
            : mask === 6 ? ((row * col) % 2 + (row * col) % 3) % 2 === 0
            : ((row + col) % 2 + (row * col) % 3) % 2 === 0
          matrix[row]![col] = Boolean(bits[bitIndex++] ?? 0) !== maskBit
        }
      }
      upward = !upward
    }
    const format = qrFormat(mask)
    const bit = (index: number) => ((format >>> index) & 1) === 1
    for (let i = 0; i <= 5; i += 1) matrix[i]![8] = bit(i)
    matrix[7]![8] = bit(6)
    matrix[8]![8] = bit(7)
    matrix[8]![7] = bit(8)
    for (let i = 9; i < 15; i += 1) matrix[8]![14 - i] = bit(i)
    for (let i = 0; i < 8; i += 1) matrix[8]![size - 1 - i] = bit(i)
    for (let i = 8; i < 15; i += 1) matrix[size - 15 + i]![8] = bit(i)
    matrix[13]![8] = true
  }
  const best = bitMatrices.reduce((bestIndex, matrix, index) =>
    qrPenalty(matrix) < qrPenalty(bitMatrices[bestIndex]!) ? index : bestIndex, 0)
  const matrix = bitMatrices[best]!
  const squares = matrix.flatMap((row, y) => row.flatMap((dark, x) => dark ? [`<rect x="${x}" y="${y}" width="1" height="1"/>`] : []))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 29 29" shape-rendering="crispEdges"><rect x="-4" y="-4" width="29" height="29" fill="white"/><g fill="black">${squares.join("")}</g></svg>`
}

function makePdf(objects: string[]): string {
  let pdf = "%PDF-1.4\n"
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(pdf.length)
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return encodeBase64Bytes(Uint8Array.from(pdf, (char) => char.charCodeAt(0)))
}

export function textToPdfBase64(source: string): string {
  if (!source.trim()) throw new Error("Enter text to place in the PDF.")
  if ([...source].some((char) => char.charCodeAt(0) > 255)) {
    throw new Error("This portable PDF writer supports Latin-1 text only; non-Latin text needs an embedded font.")
  }
  if ([...source].some((char) => char.charCodeAt(0) < 32 && char !== "\r" && char !== "\n" && char !== "\t")) {
    throw new Error("Control characters are not supported in PDF text.")
  }
  const lines = source.replace(/\r/g, "").replace(/\t/g, "    ").split("\n").flatMap((line) => line.match(/.{1,95}/g) ?? [""])
  if (lines.length > 50) throw new Error("The single-page PDF is limited to 50 rendered lines.")
  const commands = ["BT", "/F1 11 Tf", "50 790 Td", "14 TL"]
  for (const line of lines) {
    commands.push(`(${line.replace(/([\\()])/g, "\\$1")}) Tj`, "T*")
  }
  commands.push("ET")
  const stream = commands.join("\n")
  return makePdf([
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ])
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number; components: number } | null {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue }
    const marker = bytes[offset + 1]!
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!
    if (length < 2 || offset + 2 + length > bytes.length) return null
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: (bytes[offset + 5]! << 8) | bytes[offset + 6]!,
        width: (bytes[offset + 7]! << 8) | bytes[offset + 8]!,
        components: bytes[offset + 9]!,
      }
    }
    offset += 2 + length
  }
  return null
}

export function jpegToPdfBase64(dataUrl: string): string {
  const match = dataUrl.match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=\s]+)$/i)
  if (!match) throw new Error("Provide a JPEG image as a Base64 data URL.")
  const bytes = decodeBase64(match[1]!)
  const dimensions = jpegDimensions(bytes)
  if (!dimensions) throw new Error("The JPEG dimensions could not be read.")
  if (dimensions.components !== 3) throw new Error("Only three-component RGB JPEG images can be embedded in this PDF.")
  const image = latin1(bytes)
  const stream = `q\n${dimensions.width} 0 0 ${dimensions.height} 0 0 cm\n/Im0 Do\nQ`
  let pdf = "%PDF-1.4\n"
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${dimensions.width} ${dimensions.height}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    `<< /Type /XObject /Subtype /Image /Width ${dimensions.width} /Height ${dimensions.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n${image}\nendstream`,
  ]
  const offsets = [0]
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n` })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return encodeBase64Bytes(Uint8Array.from(pdf, (char) => char.charCodeAt(0)))
}

function ipv4Number(address: string): number | null {
  const parts = address.split(".")
  if (parts.length !== 4) return null
  let value = 0
  for (const part of parts) {
    if (!/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255) return null
    value = ((value << 8) | Number(part)) >>> 0
  }
  return value
}

function formatIpv4(value: number): string {
  return [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join(".")
}

export function inspectIpv4(source: string): string {
  const [address, prefixText, extra] = source.trim().split("/")
  if (extra !== undefined) throw new Error("Use one IPv4 address and an optional CIDR prefix.")
  const ip = ipv4Number(address!)
  if (ip === null) throw new Error("Enter a valid dotted-decimal IPv4 address.")
  const prefix = prefixText === undefined ? 32 : Number(prefixText)
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error("CIDR prefix must be between 0 and 32.")
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const network = (ip & mask) >>> 0
  const broadcast = (network | (~mask >>> 0)) >>> 0
  const privateAddress = (ip >>> 24) === 10 || (ip >>> 20) === 0xac1 || (ip >>> 16) === 0xc0a8
  const loopback = (ip >>> 24) === 127
  const linkLocal = (ip >>> 16) === 0xa9fe
  return [
    `Address: ${address}`,
    `Class: ${privateAddress ? "Private (RFC 1918)" : loopback ? "Loopback" : linkLocal ? "Link-local" : "Other / public range"}`,
    `CIDR: ${formatIpv4(network)}/${prefix}`,
    `Netmask: ${formatIpv4(mask)}`,
    `Network: ${formatIpv4(network)}`,
    `Broadcast: ${formatIpv4(broadcast)}`,
    `Address count: ${2 ** (32 - prefix)}`,
    "Geolocation and external lookups are intentionally not performed.",
  ].join("\n")
}

export function analyzeUserAgent(source: string): string {
  if (!source.trim()) throw new Error("Enter a User-Agent string.")
  const browser = /Edg\/([\d.]+)/i.exec(source) ? `Edge ${/Edg\/([\d.]+)/i.exec(source)![1]}`
    : /OPR\/([\d.]+)/i.exec(source) ? `Opera ${/OPR\/([\d.]+)/i.exec(source)![1]}`
    : /Firefox\/([\d.]+)/i.exec(source) ? `Firefox ${/Firefox\/([\d.]+)/i.exec(source)![1]}`
    : /Chrome\/([\d.]+)/i.exec(source) ? `Chrome ${/Chrome\/([\d.]+)/i.exec(source)![1]}`
    : /Version\/([\d.]+).*Safari/i.exec(source) ? `Safari ${/Version\/([\d.]+).*Safari/i.exec(source)![1]}`
    : "Unknown browser"
  const os = /Windows NT ([\d.]+)/i.exec(source) ? `Windows NT ${/Windows NT ([\d.]+)/i.exec(source)![1]}`
    : /Android ([\d.]+)/i.exec(source) ? `Android ${/Android ([\d.]+)/i.exec(source)![1]}`
    : /iPhone|iPad|iPod/i.test(source) ? "iOS"
    : /Mac OS X ([\d_]+)/i.exec(source) ? `macOS ${/Mac OS X ([\d_]+)/i.exec(source)![1].replace(/_/g, ".")}`
    : /Linux/i.test(source) ? "Linux" : "Unknown OS"
  return `Browser: ${browser}\nOperating system: ${os}\nDevice: ${/iPad/i.test(source) ? "Tablet" : /Mobile|iPhone|Android/i.test(source) ? "Mobile" : "Desktop or unknown"}\n\nUser-Agent strings are user-controlled and can be spoofed.`
}

const SAMPLE_USD_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.5, CAD: 1.36, AUD: 1.52, CNY: 7.2, INR: 83.1,
}

export function convertSampleCurrency(source: string): string {
  const match = source.trim().toUpperCase().match(/^([+-]?\d+(?:\.\d+)?)\s+([A-Z]{3})\s+([A-Z]{3})$/)
  if (!match) throw new Error("Use: amount FROM TO (example: 25 USD EUR).")
  const amount = Number(match[1])
  const from = match[2]!
  const to = match[3]!
  if (!SAMPLE_USD_RATES[from] || !SAMPLE_USD_RATES[to]) throw new Error("Supported codes: USD, EUR, GBP, JPY, CAD, AUD, CNY, INR.")
  const converted = amount / SAMPLE_USD_RATES[from] * SAMPLE_USD_RATES[to]
  return `${amount} ${from} ≈ ${converted.toFixed(2)} ${to}\n\nIllustrative offline reference rates only. Not current market data or financial advice.`
}

function xmlEscape(value: string): string {
  return escapeXml(value)
}

export function createFaviconSvg(source: string): string {
  const [label = "K", background = "#6b705c", foreground = "#ffffff"] = source.split(",").map((part) => part.trim())
  if (!/^#[\da-f]{6}$/i.test(background) || !/^#[\da-f]{6}$/i.test(foreground)) throw new Error("Use: one letter, #background, #foreground.")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${background}"/><text x="32" y="44" text-anchor="middle" font-family="sans-serif" font-size="38" font-weight="700" fill="${foreground}">${xmlEscape([...label][0] ?? "K")}</text></svg>`
}

export function createPlaceholderSvg(source: string): string {
  const [widthText = "640", heightText = "360", label = "Placeholder", background = "#e8e4d8", foreground = "#45473d"] = source.split(",").map((part) => part.trim())
  const width = Number(widthText)
  const height = Number(heightText)
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 || width > 4096 || height > 4096) {
    throw new Error("Width and height must be integers from 1 to 4096.")
  }
  if (!/^#[\da-f]{6}$/i.test(background) || !/^#[\da-f]{6}$/i.test(foreground)) throw new Error("Use six-digit HEX colors.")
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${background}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(32, Math.max(12, Math.floor(width / 20)))}" fill="${foreground}">${xmlEscape(label.slice(0, 80))} · ${width} × ${height}</text></svg>`
}

export function minifySvg(source: string): string {
  if (!/<svg\b/i.test(source)) throw new Error("Input does not contain an SVG root element.")
  if (/<\s*(script|foreignObject)\b/i.test(source) || /\bon[a-z]+\s*=/i.test(source) || /(?:href|src)\s*=\s*["']\s*(?:https?:|javascript:|data:text\/html)/i.test(source)) {
    throw new Error("SVG contains script, event handlers or an external/active resource.")
  }
  return source.replace(/<!--[\s\S]*?-->/g, "").replace(/>\s+</g, "><").replace(/\s{2,}/g, " ").replace(/\s*([=,:;{}])\s*/g, "$1").trim()
}

export function makeSvgSprite(source: string): string {
  const fragments = source.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
  if (!fragments.length) throw new Error("Paste one or more SVG documents separated by a blank line.")
  if (fragments.length > 32) throw new Error("Limit the sprite to 32 SVG documents.")
  const symbols = fragments.map((svg, index) => {
    const sanitized = minifySvg(svg)
    const opening = sanitized.match(/<svg\b([^>]*)>/i)?.[1] ?? ""
    const viewBox = /\bviewBox\s*=\s*["']([^"']+)["']/i.exec(opening)?.[1] ?? "0 0 24 24"
    const inner = sanitized.replace(/^<svg\b[^>]*>/i, "").replace(/<\/svg>\s*$/i, "")
    return `<symbol id="icon-${index + 1}" viewBox="${escapeXml(viewBox)}">${inner}</symbol>`
  })
  return `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join("")}</svg>`
}

function readExifValue(bytes: Uint8Array, tiff: number, little: boolean, type: number, count: number, valueOffset: number, segmentEnd: number): string {
  const width: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }
  const unit = width[type]
  if (!unit || count > 256) return "(unsupported value)"
  const start = tiff + valueOffset
  if (start < tiff || start + count * unit > segmentEnd) return "(outside EXIF segment)"
  if (type === 2) {
    let end = start
    while (end < start + count && bytes[end] !== 0) end += 1
    return latin1(bytes.subarray(start, end))
  }
  const values: number[] = []
  for (let index = 0; index < count; index += 1) {
    const at = start + index * unit
    if (type === 1 || type === 7) values.push(bytes[at]!)
    else if (type === 3) values.push(little ? bytes[at]! | (bytes[at + 1]! << 8) : (bytes[at]! << 8) | bytes[at + 1]!)
    else if (type === 4) {
      values.push(little
        ? (bytes[at]! | (bytes[at + 1]! << 8) | (bytes[at + 2]! << 16) | (bytes[at + 3]! << 24)) >>> 0
        : ((bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!) >>> 0)
    } else return `(type ${type}, ${count} value${count === 1 ? "" : "s"})`
  }
  return values.length ? values.join(", ") : "(empty)"
}

export function inspectExif(dataUrl: string): string {
  const bytes = decodeBase64(dataUrl)
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error("Provide a JPEG image as a Base64 data URL.")
  const results: string[] = []
  let offset = 2
  while (offset + 4 < bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1]!
    const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!
    if (length < 2 || offset + length + 2 > bytes.length) throw new Error("Malformed JPEG segment.")
    if (marker === 0xe1 && String.fromCharCode(...bytes.subarray(offset + 4, offset + 10)) === "Exif\0\0") {
      const tiff = offset + 10
    const segmentEnd = offset + length + 2
    if (tiff + 8 > segmentEnd) throw new Error("Truncated EXIF TIFF header.")
    const little = bytes[tiff] === 0x49 && bytes[tiff + 1] === 0x49
    if (!little && !(bytes[tiff] === 0x4d && bytes[tiff + 1] === 0x4d)) throw new Error("Invalid EXIF byte order.")
    const u16 = (at: number) => {
      if (at < tiff || at + 2 > segmentEnd) throw new Error("EXIF value is outside its JPEG segment.")
      return little ? bytes[at]! | (bytes[at + 1]! << 8) : (bytes[at]! << 8) | bytes[at + 1]!
    }
    const u32 = (at: number) => {
      if (at < tiff || at + 4 > segmentEnd) throw new Error("EXIF value is outside its JPEG segment.")
      return little
        ? (bytes[at]! | (bytes[at + 1]! << 8) | (bytes[at + 2]! << 16) | (bytes[at + 3]! << 24)) >>> 0
        : ((bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!) >>> 0
    }
    const ifd = tiff + u32(tiff + 4)
    if (ifd + 2 > segmentEnd) throw new Error("EXIF directory is outside its JPEG segment.")
    const count = Math.min(u16(ifd), 256)
    const tagNames: Record<number, string> = {
      0x010f: "Make", 0x0110: "Model", 0x0112: "Orientation", 0x0131: "Software",
      0x0132: "DateTime", 0x8298: "Copyright", 0x8825: "GPS metadata",
    }
    for (let i = 0; i < count; i += 1) {
      const entry = ifd + 2 + i * 12
      if (entry + 12 > segmentEnd) break
      const tag = u16(entry)
      if (tag === 0x8825) results.push("GPS metadata: present (coordinates not displayed)")
      else if (tagNames[tag]) {
        const type = u16(entry + 2)
        const items = u32(entry + 4)
        const unit = ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 } as Record<number, number>)[type]
        if (!unit) continue
        const value = items * unit <= 4 ? entry + 8 - tiff : u32(entry + 8)
        results.push(`${tagNames[tag]}: ${readExifValue(bytes, tiff, little, type, items, value, segmentEnd)}`)
        }
      }
      return results.length ? results.join("\n") : "EXIF exists, but no supported descriptive tags were found."
    }
    if (marker === 0xda || marker === 0xd9) break
    offset += length + 2
  }
  return "No EXIF APP1 segment found."
}

function markdownOutline(source: string): string {
  const lines = source.split(/\r?\n/)
  const out: string[] = []
  let inFence = false
  let fence = ""
  let fenceLines = 0
  for (const line of lines) {
    if (/^\s*(```+|~~~+)/.test(line)) {
      const mark = /^\s*(```+|~~~+)/.exec(line)![1]!
      if (!inFence) { inFence = true; fence = mark; fenceLines = 0 }
      else if (mark[0] === fence[0]) { out.push(`Code block · ${fenceLines} lines`); inFence = false }
      continue
    }
    if (inFence) { fenceLines += 1; continue }
    const heading = /^(#{1,6})\s+(.+)$/.exec(line)
    const list = /^\s*(?:[-*+]|\d+[.)])\s+(.+)$/.exec(line)
    if (heading) out.push(`${"  ".repeat(heading[1]!.length - 1)}${heading[1]} ${heading[2]}`)
    else if (list) out.push(`  • ${list[1]}`)
    else if (line.trim()) out.push(line.replace(/[`*_~]/g, ""))
  }
  if (inFence) out.push(`Code block · ${fenceLines} lines (unclosed fence)`)
  return out.length ? out.join("\n") : "(No previewable content)"
}

function parseMermaid(source: string): string {
  const nodes = new Map<string, string>()
  const edges: Array<[string, string]> = []
  const direction = /^\s*(?:flowchart|graph)\s+(TB|TD|BT|RL|LR)\b/im.exec(source)?.[1] ?? "TD"
  for (const line of source.split(/\r?\n/)) {
    const matches = [...line.matchAll(/([A-Za-z][\w-]*)(?:\[([^\]]*)\]|\(([^)]*)\)|\{([^}]*)\})?/g)]
    for (const match of matches) nodes.set(match[1]!, match[2] ?? match[3] ?? match[4] ?? match[1]!)
    const edge = /([A-Za-z][\w-]*)\s*(?:-->|==>|---|-.->)\s*(?:\|[^|]*\|\s*)?([A-Za-z][\w-]*)/.exec(line)
    if (edge) edges.push([edge[1]!, edge[2]!])
  }
  if (!nodes.size) throw new Error("No flowchart nodes found. Example: graph TD\\nA[Start] --> B[End]")
  return [
    `Direction: ${direction}`,
    `Nodes (${nodes.size}):`,
    ...[...nodes].map(([id, label]) => `  ${id}: ${label}`),
    `Connections (${edges.length}):`,
    ...edges.map(([from, to]) => `  ${from} → ${to}`),
  ].join("\n")
}

function inspectPdfBase64(source: string): string {
  const values = source.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  if (!values.length) throw new Error("Paste one or more PDF files as Base64, one per line.")
  return values.map((value, index) => {
    const bytes = decodeBase64(value)
    const prefix = String.fromCharCode(...bytes.subarray(0, Math.min(bytes.length, 8)))
    if (!prefix.startsWith("%PDF-")) throw new Error(`Input ${index + 1} is not a PDF file.`)
    const sample = latin1(bytes.subarray(0, Math.min(bytes.length, 2_000_000)))
    const pages = [...sample.matchAll(/\/Type\s*\/Page\b/g)].length
    return `PDF ${index + 1}: ${bytes.length} bytes; ${pages || "unknown"} page markers; ${prefix}`
  }).join("\n")
}

function createRequestPreview(source: string): string {
  const input: unknown = JSON.parse(source)
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Request must be a JSON object.")
  const request = input as Record<string, unknown>
  const method = String(request.method ?? "GET").toUpperCase()
  if (!/^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$/.test(method)) throw new Error("Unsupported HTTP method.")
  const url = String(request.url ?? "")
  let parsed: URL
  try { parsed = new URL(url) } catch { throw new Error("Enter an absolute HTTP or HTTPS URL.") }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("Only HTTP and HTTPS URLs are accepted.")
  const headers = request.headers ?? {}
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) throw new Error("Headers must be a JSON object.")
  const lines = [`${method} ${parsed.pathname}${parsed.search}`, `Host: ${parsed.host}`]
  for (const [name, value] of Object.entries(headers as Record<string, unknown>)) {
    if (!/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name) || /[\r\n]/.test(String(value))) throw new Error(`Invalid header: ${name}`)
    lines.push(`${name}: ${String(value)}`)
  }
  if (request.body !== undefined && request.body !== "") lines.push("", typeof request.body === "string" ? request.body : JSON.stringify(request.body, null, 2))
  lines.push("", "Offline preview only: no request was sent.")
  return lines.join("\n")
}

function sourceMetrics(source: string): string {
  const lines = source.split(/\r?\n/)
  const nonEmpty = lines.filter((line) => line.trim())
  const branchTokens = (source.match(/\b(if|else|switch|case|for|while|catch)\b/g) ?? []).length
  const longLines = lines.filter((line) => line.length > 120).length
  return [
    `Bytes: ${new TextEncoder().encode(source).length}`,
    `Lines: ${lines.length} (${nonEmpty.length} non-empty)`,
    `Branch-like keywords: ${branchTokens}`,
    `Lines over 120 characters: ${longLines}`,
    "Static estimates only; code was not executed or profiled.",
  ].join("\n")
}

function runStringBenchmark(iterationsText: string): string {
  const iterations = Math.max(1, Math.min(100_000, Math.floor(Number(iterationsText) || 10_000)))
  const sample = "Kit local toolbox 0123456789"
  let checksum = 0
  const start = Date.now()
  for (let i = 0; i < iterations; i += 1) {
    checksum += sample.toLowerCase().split(" ").join("-").length
  }
  const elapsed = Math.max(0, Date.now() - start)
  return `Operation: lowercase + split + join\nIterations: ${iterations}\nElapsed: ${elapsed} ms\nChecksum: ${checksum}\n\nThis microbenchmark measures the current device only.`
}

function seconds(value: string): number {
  const parts = value.trim().split(":")
  if (parts.length < 1 || parts.length > 3 || parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part))) throw new Error("Use seconds, MM:SS or HH:MM:SS.")
  const result = parts.map(Number).reduce((total, part) => total * 60 + part, 0)
  if (!Number.isFinite(result) || result < 0) throw new Error("Time must be a finite non-negative value.")
  return result
}

function quoteArgument(value: string): string {
  if (!value.trim() || /["\r\n]/.test(value)) throw new Error("Use a non-empty filename without quotes or newlines.")
  return `"${value.trim()}"`
}

export function runLegacyTool(slug: string, input: string, secondary = "", option = ""): LegacyToolResult {
  if (input.length > 8 * 1024 * 1024 || secondary.length > 8 * 1024 * 1024 || option.length > 8 * 1024 * 1024) {
    throw new Error("Input exceeds the 8 MiB processing limit.")
  }
  switch (slug) {
    case "api-tester":
      return { output: createRequestPreview(input) }
    case "audio-convert": {
      const [file = "input.wav", format = "mp3"] = input.split(",").map((part) => part.trim())
      if (!/^(mp3|wav|flac|ogg|aac|m4a|opus)$/i.test(format)) throw new Error("Choose mp3, wav, flac, ogg, aac, m4a or opus.")
      return { output: `ffmpeg -i ${quoteArgument(file)} -vn ${format.toLowerCase() === "mp3" ? "-c:a libmp3lame -q:a 2" : `-f ${format.toLowerCase()}`} ${quoteArgument(`output.${format.toLowerCase()}`)}\n\nThis is a command template only; Kit does not run FFmpeg.` }
    }
    case "barcode-generator":
      return { output: createCode39Svg(input) }
    case "base64-image": {
      if (input.startsWith("data:image/")) {
        const bytes = decodeBase64(input)
        return { output: `Bytes: ${bytes.length}\n\n${input}` }
      }
      const match = input.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i)
      if (!match) throw new Error("Enter a data:image/...;base64,... URL.")
      const bytes = decodeBase64(match[2]!)
      return { output: `Media type: ${match[1]}\nBytes: ${bytes.length}\nBase64 characters: ${match[2]!.replace(/\s+/g, "").length}\n\n${match[0]}` }
    }
    case "bcrypt-hash": {
      const match = input.trim().match(/^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/)
      if (!match) throw new Error("Enter a complete bcrypt hash (60 characters) to inspect its format.")
      return { output: `Valid bcrypt-shaped string\nVariant: ${input.trim().slice(1, 3)}\nCost factor: ${Number(match[1])}\n\nNSH 0.3.0 has no bcrypt primitive; no hash was generated or verified.` }
    }
    case "benchmark-tester":
    case "performance-tester":
      return { output: runStringBenchmark(input) }
    case "code-formatter":
      return { output: formatCode(input, secondary || "json") }
    case "color-picker": {
      const hex = input.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i)
      if (!hex) throw new Error("Enter a 3- or 6-digit HEX color.")
      const raw = hex[1]!.length === 3 ? [...hex[1]!].map((part) => part + part).join("") : hex[1]!
      const [r, g, b] = [0, 2, 4].map((index) => parseInt(raw.slice(index, index + 2), 16))
      const rgb = `rgb(${r}, ${g}, ${b})`
      return { output: `HEX: #${raw.toUpperCase()}\nRGB: ${rgb}\nHSL: ${rgbToHsl(r!, g!, b!)}` }
    }
    case "currency-convert":
      return { output: convertSampleCurrency(input) }
    case "dns-lookup": {
      const host = input.trim().replace(/\.$/, "").toLowerCase()
      if (host.length > 253 || !host.includes(".") || host.split(".").some((label) => !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))) throw new Error("Enter a valid fully qualified domain name.")
      return { output: `Domain: ${host}\nQuery types: A, AAAA, CNAME, MX, NS, TXT\n\nOffline mode: Kit does not contact a DNS resolver or disclose this domain.` }
    }
    case "excel-to-json": {
      const rows = input.replace(/^\uFEFF/, "").trim().split(/\r?\n/).map((row) => row.split("\t"))
      if (rows.length < 2) throw new Error("Paste a tab-separated table with a header row and at least one data row.")
      const csv = rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")
      const result = csvToJson(csv, { delimiter: ",", hasHeader: true, inferTypes: true })
      if (!result.ok) throw new Error(result.error)
      return { output: result.output }
    }
    case "exif-viewer":
      return { output: inspectExif(input) }
    case "favicon-generator":
      return { output: createFaviconSvg(input || "K, #6b705c, #ffffff") }
    case "file-hash": {
      const algorithm = (secondary || "sha256").trim().toLowerCase()
      if (!["md5", "sha1", "sha256", "sha384", "sha512"].includes(algorithm)) throw new Error("Choose md5, sha1, sha256, sha384 or sha512.")
      const base64Input = option.toLowerCase() === "base64" || /^base64:/i.test(input)
      const content = base64Input ? decodeBase64(input.replace(/^base64:/i, "")) : input
      return { output: createHash(algorithm).update(content).digest("hex") }
    }
    case "gif-split": {
      const file = input.trim() || "input.gif"
      return { output: `ffmpeg -i ${quoteArgument(file)} -vsync 0 frame-%04d.png\n\nThis command template requires FFmpeg and is not executed by Kit.` }
    }
    case "html-preview": {
      const result = inspectHtml(input)
      return { output: `Removed unsafe elements/attributes: ${result.removed}\n\nSanitized source (not rendered or executed):\n${result.html}` }
    }
    case "icon-spriter":
      return { output: makeSvgSprite(input) }
    case "image-compress":
    case "image-convert":
    case "image-resize":
      if (!input.startsWith("data:image/")) throw new Error("Pick an image first using the system image picker.")
      return { output: input, warning: "The image was prepared by the system picker. Copy the output as a data URL to transfer it." }
    case "image-crop": {
      const values = input.split(",").map(Number)
      if (values.length !== 4 || values.some((value) => !Number.isFinite(value) || value < 0)) throw new Error("Enter crop values as x,y,width,height using non-negative numbers.")
      if (values[2] === 0 || values[3] === 0) throw new Error("Crop width and height must be greater than zero.")
      throw new Error("The current NSH cross-platform image API does not expose pixel cropping. The crop rectangle was valid, but no image was changed.")
    }
    case "image-to-pdf":
      return { output: jpegToPdfBase64(input) }
    case "ip-info":
      return { output: inspectIpv4(input) }
    case "json-plot":
      return {
        output: jsonBarChart(input, (secondary || "label").split(",")[0]!.trim(), (secondary || "label,value").split(",")[1]?.trim() || option || "value"),
      }
    case "jwt-generator":
      return { output: signJwt(input, secondary) }
    case "lorem-image":
      return { output: createPlaceholderSvg(input || "640,360,Placeholder,#e8e4d8,#45473d") }
    case "markdown-mermaid":
      return { output: parseMermaid(input) }
    case "markdown-preview":
      return { output: markdownOutline(input) }
    case "md5-hash":
      return { output: hashText(input, "md5") }
    case "merge-pdf":
      return {
        output: `${inspectPdfBase64(input)}\n\nInspection only: merging arbitrary PDFs requires a PDF object parser and file export API, neither of which is available in this portable NSH build.`,
        warning: "PDF files were inspected, not merged.",
      }
    case "password-strength": {
      const result = passwordStrength(input)
      return { output: `Estimated entropy: ${result.bits} bits\nStrength: ${result.label}\nScore: ${result.percent}/100\n\nThis estimate is approximate and does not model dictionary attacks.` }
    }
    case "performance-analyzer":
      return { output: sourceMetrics(input) }
    case "qr-generator":
      return { output: createQrSvg(input) }
    case "sha256-hash":
      return { output: hashText(input, "sha256") }
    case "svg-minify":
      return { output: minifySvg(input) }
    case "text-to-pdf":
      return { output: `data:application/pdf;base64,${textToPdfBase64(input)}` }
    case "user-agent":
      return { output: analyzeUserAgent(input) }
    case "uuid-batch": {
      const count = Math.max(1, Math.min(100, Math.floor(Number(input) || 1)))
      return { output: Array.from({ length: count }, () => randomUUID()).join("\n") }
    }
    case "video-trim": {
      const [file = "input.mp4", startText = "0", endText = "10"] = input.split(",").map((part) => part.trim())
      const start = seconds(startText)
      const end = seconds(endText)
      if (end <= start) throw new Error("End time must be later than start time.")
      return { output: `ffmpeg -ss ${start} -to ${end} -i ${quoteArgument(file)} -c copy ${quoteArgument("trimmed.mp4")}\n\nThis command template requires FFmpeg and is not executed by Kit.` }
    }
    case "yaml-to-json":
      return { output: yamlToJson(input) }
    default:
      throw new Error(`No implementation is registered for legacy tool "${slug}".`)
  }
}

function rgbToHsl(red: number, green: number, blue: number): string {
  const r = red / 255
  const g = green / 255
  const b = blue / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let hue = 0
  if (delta) {
    if (max === r) hue = ((g - b) / delta) % 6
    else if (max === g) hue = (b - r) / delta + 2
    else hue = (r - g) / delta + 4
  }
  hue = (hue * 60 + 360) % 360
  const light = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * light - 1))
  return `hsl(${Math.round(hue)}, ${Math.round(saturation * 100)}%, ${Math.round(light * 100)}%)`
}
