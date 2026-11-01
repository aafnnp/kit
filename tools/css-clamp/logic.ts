function cleanNumber(value: number): string {
  return Number(value.toFixed(4)).toString()
}

export function generateCssClamp(
  property: string,
  minValue: number,
  maxValue: number,
  minViewport: number,
  maxViewport: number,
): string {
  if (!/^[a-z][a-z-]*$/i.test(property.trim())) throw new Error("Enter a valid CSS property name.")
  if (![minValue, maxValue, minViewport, maxViewport].every(Number.isFinite)) {
    throw new Error("All values must be finite numbers.")
  }
  if (minValue < 0 || maxValue <= minValue) throw new Error("Maximum value must be greater than a non-negative minimum.")
  if (minViewport < 1 || maxViewport <= minViewport) {
    throw new Error("Maximum viewport must be greater than the minimum viewport.")
  }

  const vwCoefficient = ((maxValue - minValue) / (maxViewport - minViewport)) * 100
  const pixelOffset = (vwCoefficient * minViewport) / 100
  return `${property.trim()}: clamp(${cleanNumber(minValue)}px, calc(${cleanNumber(minValue)}px + ${cleanNumber(vwCoefficient)}vw - ${cleanNumber(pixelOffset)}px), ${cleanNumber(maxValue)}px);`
}
