import { convertColor } from "../hex-rgb/logic"

export function generateLinearGradient(firstColor: string, secondColor: string, angle: number): string {
  if (!Number.isFinite(angle) || angle < 0 || angle > 360) {
    throw new Error("Angle must be between 0 and 360 degrees.")
  }
  const first = convertColor(firstColor).hex
  const second = convertColor(secondColor).hex
  return `background: linear-gradient(${Number(angle.toFixed(2))}deg, ${first} 0%, ${second} 100%);`
}
