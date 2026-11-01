import { parseColor } from "../hex-rgb/logic"

export interface ShadowOptions {
  x: number
  y: number
  blur: number
  spread: number
  color: string
  opacity: number
  inset: boolean
}

export function generateBoxShadow(options: ShadowOptions): string {
  const { x, y, blur, spread, opacity, inset } = options
  if (![x, y, blur, spread, opacity].every(Number.isFinite) || blur < 0 || opacity < 0 || opacity > 100) {
    throw new Error("Offsets must be finite, blur must be non-negative, and opacity must be 0–100.")
  }
  const { r, g, b } = parseColor(options.color)
  const alpha = Number((opacity / 100).toFixed(2))
  const prefix = inset ? "inset " : ""
  return `box-shadow: ${prefix}${x}px ${y}px ${blur}px ${spread}px rgba(${r}, ${g}, ${b}, ${alpha});`
}
