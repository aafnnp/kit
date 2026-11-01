export function parseLotteryItems(input: string): string[] {
  return [...new Set(input.split(/[,\n;，；]+/).map((item) => item.trim()).filter(Boolean))]
}

export function pickLottery(items: string[], count: number, random: () => number = Math.random): string[] {
  if (!Number.isInteger(count) || count < 1) throw new Error("Pick count must be a positive whole number.")
  if (count > items.length) throw new Error("Pick count cannot exceed the number of unique entries.")
  if (items.some((item) => !item.trim())) throw new Error("Entries cannot be empty.")

  const pool = [...items]
  for (let index = 0; index < count; index += 1) {
    const sample = random()
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
      throw new Error("Random source must return a value between 0 and 1.")
    }
    const selected = index + Math.floor(sample * (pool.length - index))
    ;[pool[index], pool[selected]] = [pool[selected]!, pool[index]!]
  }
  return pool.slice(0, count)
}
