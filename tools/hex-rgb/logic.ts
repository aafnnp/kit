export interface RGB {
  r: number
  g: number
  b: number
}

export interface ColorAnalysis {
  hex: string
  rgb: RGB
  alpha: number
  hsl: { h: number; s: number; l: number }
  hsv: { h: number; s: number; v: number }
  cmyk: { c: number; m: number; y: number; k: number }
  contrastBlack: number
  contrastWhite: number
  recommendedText: "black" | "white"
}

const NAMED_COLORS: Record<string, string> = {
  black: "000000",
  white: "ffffff",
  red: "ff0000",
  green: "008000",
  lime: "00ff00",
  blue: "0000ff",
  yellow: "ffff00",
  cyan: "00ffff",
  aqua: "00ffff",
  magenta: "ff00ff",
  fuchsia: "ff00ff",
  gray: "808080",
  grey: "808080",
  silver: "c0c0c0",
  maroon: "800000",
  olive: "808000",
  purple: "800080",
  teal: "008080",
  navy: "000080",
  orange: "ffa500",
  pink: "ffc0cb",
  gold: "ffd700",
  rebeccapurple: "663399",
  tomato: "ff6347",
  skyblue: "87ceeb",
}

export interface ColorInput {
  rgb: RGB
  alpha: number
}

function channelFromToken(token: string): number {
  const text = token.trim()
  if (text.endsWith("%")) {
    const percent = Number(text.slice(0, -1))
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error("RGB percentages must be between 0 and 100.")
    return Math.round((percent / 100) * 255)
  }
  const value = Number(text)
  if (!Number.isFinite(value) || value < 0 || value > 255) throw new Error("RGB channels must be whole numbers from 0 to 255.")
  return Math.round(value)
}

function alphaFromToken(token?: string): number {
  if (token === undefined) return 1
  const text = token.trim()
  const value = text.endsWith("%") ? Number(text.slice(0, -1)) / 100 : Number(text)
  if (!Number.isFinite(value) || value < 0 || value > 1) throw new Error("Alpha must be between 0 and 1.")
  return value
}

function hslToRgb(hue: number, saturation: number, lightness: number): RGB {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const sector = hue / 60
  const second = chroma * (1 - Math.abs((sector % 2) - 1))
  let channels: [number, number, number]
  if (sector < 1) channels = [chroma, second, 0]
  else if (sector < 2) channels = [second, chroma, 0]
  else if (sector < 3) channels = [0, chroma, second]
  else if (sector < 4) channels = [0, second, chroma]
  else if (sector < 5) channels = [second, 0, chroma]
  else channels = [chroma, 0, second]
  const offset = lightness - chroma / 2
  return {
    r: Math.round((channels[0] + offset) * 255),
    g: Math.round((channels[1] + offset) * 255),
    b: Math.round((channels[2] + offset) * 255),
  }
}

/** Parses HEX (3/4/6/8 digits), rgb()/rgba(), hsl()/hsla() and common CSS names. */
export function parseColorInput(input: string): ColorInput {
  const value = input.trim()
  if (!value) throw new Error("Enter a HEX, rgb(), hsl() or named CSS color.")
  const lower = value.toLowerCase()
  if (lower === "transparent") return { rgb: { r: 0, g: 0, b: 0 }, alpha: 0 }

  const hex = (NAMED_COLORS[lower] ?? value).match(/^#?([\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i)?.[1]
  if (hex) {
    const expanded = hex.length <= 4 ? [...hex].map((part) => part + part).join("") : hex
    const alpha = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1
    return {
      rgb: {
        r: Number.parseInt(expanded.slice(0, 2), 16),
        g: Number.parseInt(expanded.slice(2, 4), 16),
        b: Number.parseInt(expanded.slice(4, 6), 16),
      },
      alpha,
    }
  }

  const functional = /^(rgba?|hsla?)\(([^)]*)\)$/i.exec(value)
  if (functional) {
    const name = functional[1]!.toLowerCase()
    const parts = functional[2]!.split(/[\s,/]+/).filter(Boolean)
    if (name.startsWith("rgb")) {
      if (parts.length < 3 || parts.length > 4) throw new Error("Use rgb(r, g, b) or rgba(r, g, b, a).")
      return {
        rgb: {
          r: channelFromToken(parts[0]!),
          g: channelFromToken(parts[1]!),
          b: channelFromToken(parts[2]!),
        },
        alpha: alphaFromToken(parts[3]),
      }
    }
    if (parts.length < 3 || parts.length > 4) throw new Error("Use hsl(h, s%, l%) or hsla(h, s%, l%, a).")
    const hue = Number(parts[0]!.replace(/deg$/i, ""))
    const saturation = Number(parts[1]!.replace(/%$/, "")) / 100
    const lightness = Number(parts[2]!.replace(/%$/, "")) / 100
    if (
      ![hue, saturation, lightness].every(Number.isFinite) ||
      saturation < 0 ||
      saturation > 1 ||
      lightness < 0 ||
      lightness > 1
    ) {
      throw new Error("Hue must be an angle and saturation/lightness must be percentages.")
    }
    return {
      rgb: hslToRgb(((hue % 360) + 360) % 360, saturation, lightness),
      alpha: alphaFromToken(parts[3]),
    }
  }

  throw new Error("Enter a HEX, rgb(), hsl() or named CSS color.")
}

export function parseColor(input: string): RGB {
  return parseColorInput(input).rgb
}

function linearize(channel: number): number {
  const normalized = channel / 255
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

function contrastRatio(first: number, second: number): number {
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

export function analyzeColor(rgb: RGB, alpha = 1): ColorAnalysis {
  if (![rgb.r, rgb.g, rgb.b].every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
    throw new Error("RGB channels must be whole numbers from 0 to 255.")
  }
  if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new Error("Alpha must be between 0 and 1.")

  const channels = [rgb.r / 255, rgb.g / 255, rgb.b / 255]
  const max = Math.max(...channels)
  const min = Math.min(...channels)
  const delta = max - min
  const lightness = (max + min) / 2
  let hue = 0
  let saturationHsl = 0
  let saturationHsv = max === 0 ? 0 : delta / max

  if (delta !== 0) {
    if (max === channels[0]) hue = ((channels[1]! - channels[2]!) / delta) % 6
    else if (max === channels[1]) hue = (channels[2]! - channels[0]!) / delta + 2
    else hue = (channels[0]! - channels[1]!) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
    saturationHsl = delta / (1 - Math.abs(2 * lightness - 1))
  }

  const k = 1 - max
  const cmyk = k === 1
    ? { c: 0, m: 0, y: 0, k: 100 }
    : {
        c: Math.round(((1 - channels[0]! - k) / (1 - k)) * 100),
        m: Math.round(((1 - channels[1]! - k) / (1 - k)) * 100),
        y: Math.round(((1 - channels[2]! - k) / (1 - k)) * 100),
        k: Math.round(k * 100),
      }
  const luminance = 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b)
  const contrastBlack = contrastRatio(luminance, 0)
  const contrastWhite = contrastRatio(1, luminance)
  const toHex = (channel: number) => channel.toString(16).padStart(2, "0")

  return {
    hex: `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase(),
    rgb,
    alpha,
    hsl: { h: Math.round(hue), s: Math.round(saturationHsl * 100), l: Math.round(lightness * 100) },
    hsv: { h: Math.round(hue), s: Math.round(saturationHsv * 100), v: Math.round(max * 100) },
    cmyk,
    contrastBlack: Number(contrastBlack.toFixed(2)),
    contrastWhite: Number(contrastWhite.toFixed(2)),
    recommendedText: contrastBlack >= contrastWhite ? "black" : "white",
  }
}

export function convertColor(input: string): ColorAnalysis {
  const parsed = parseColorInput(input)
  return analyzeColor(parsed.rgb, parsed.alpha)
}
