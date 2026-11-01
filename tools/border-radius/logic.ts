export type RadiusUnit = "px" | "rem" | "%"

export interface RadiusCorners {
  topLeft: number
  topRight: number
  bottomRight: number
  bottomLeft: number
}

export function generateBorderRadius(corners: RadiusCorners, unit: RadiusUnit): string {
  const values = [corners.topLeft, corners.topRight, corners.bottomRight, corners.bottomLeft]
  if (!values.every((value) => Number.isFinite(value) && value >= 0)) {
    throw new Error("Corner values must be non-negative finite numbers.")
  }
  const [topLeft, topRight, bottomRight, bottomLeft] = values
  const format = (value: number) => `${Number(value.toFixed(4))}${unit}`

  let shorthand: number[]
  if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) shorthand = [topLeft]
  else if (topLeft === bottomRight && topRight === bottomLeft) shorthand = [topLeft, topRight]
  else if (topRight === bottomLeft) shorthand = [topLeft, topRight, bottomRight]
  else shorthand = values

  return `border-radius: ${shorthand.map(format).join(" ")};`
}
