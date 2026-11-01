export interface RGB {
  r: number
  g: number
  b: number
}

export interface ColorAnalysis {
  hex: string
  rgb: RGB
  hsl: { h: number; s: number; l: number }
  hsv: { h: number; s: number; v: number }
  cmyk: { c: number; m: number; y: number; k: number }
  contrastBlack: number
  contrastWhite: number
  recommendedText: "black" | "white"
}

export function parseColor(input: string): RGB {
  const value = input.trim()
  const hex = value.match(/^#?([\da-f]{3}|[\da-f]{6})$/i)?.[1]
  if (hex) {
    const expanded = hex.length === 3 ? [...hex].map((part) => part + part).join("") : hex
    return {
      r: Number.parseInt(expanded.slice(0, 2), 16),
      g: Number.parseInt(expanded.slice(2, 4), 16),
      b: Number.parseInt(expanded.slice(4, 6), 16),
    }
  }

  const rgb = value.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i)
  if (rgb) {
    const channels = rgb.slice(1).map(Number)
    if (channels.every((channel) => channel >= 0 && channel <= 255)) {
      return { r: channels[0]!, g: channels[1]!, b: channels[2]! }
    }
  }
  throw new Error("Enter a 3/6-digit HEX color or rgb(r, g, b) value.")
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

export function analyzeColor(rgb: RGB): ColorAnalysis {
  if (![rgb.r, rgb.g, rgb.b].every((channel) => Number.isInteger(channel) && channel >= 0 && channel <= 255)) {
    throw new Error("RGB channels must be whole numbers from 0 to 255.")
  }

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
    hsl: { h: Math.round(hue), s: Math.round(saturationHsl * 100), l: Math.round(lightness * 100) },
    hsv: { h: Math.round(hue), s: Math.round(saturationHsv * 100), v: Math.round(max * 100) },
    cmyk,
    contrastBlack: Number(contrastBlack.toFixed(2)),
    contrastWhite: Number(contrastWhite.toFixed(2)),
    recommendedText: contrastBlack >= contrastWhite ? "black" : "white",
  }
}

export function convertColor(input: string): ColorAnalysis {
  return analyzeColor(parseColor(input))
}
