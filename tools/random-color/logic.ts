export function generateRandomColor(random: () => number = Math.random): string {
  const channels = Array.from({ length: 3 }, () => {
    const sample = random()
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new Error("Random source must return a value between 0 and 1.")
    }
    return Math.floor(sample * 256).toString(16).padStart(2, "0")
  })
  return `#${channels.join("")}`.toUpperCase()
}
