const MAX_UINT64 = 18_446_744_073_709_551_615n
const WITNESSES = [2n, 325n, 9_375n, 28_178n, 450_775n, 9_780_504n, 1_795_265_022n]

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n
  let factor = base % modulus
  let power = exponent

  while (power > 0n) {
    if (power & 1n) result = (result * factor) % modulus
    factor = (factor * factor) % modulus
    power >>= 1n
  }
  return result
}

export function isPrime(value: bigint): boolean {
  if (value < 2n) return false
  for (const prime of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (value === prime) return true
    if (value % prime === 0n) return false
  }

  let oddPart = value - 1n
  let powersOfTwo = 0
  while ((oddPart & 1n) === 0n) {
    oddPart >>= 1n
    powersOfTwo += 1
  }

  // These witnesses make Miller-Rabin deterministic for unsigned 64-bit integers.
  for (const witness of WITNESSES) {
    const base = witness % value
    if (base === 0n) continue
    let result = modPow(base, oddPart, value)
    if (result === 1n || result === value - 1n) continue

    let probablyComposite = true
    for (let round = 1; round < powersOfTwo; round += 1) {
      result = (result * result) % value
      if (result === value - 1n) {
        probablyComposite = false
        break
      }
    }
    if (probablyComposite) return false
  }
  return true
}

export function analyzePrime(input: string):
  | { ok: true; value: bigint; prime: boolean }
  | { ok: false; error: string } {
  const normalized = input.trim()
  if (!/^[+-]?\d+$/.test(normalized)) {
    return { ok: false, error: "Enter a whole number." }
  }

  const value = BigInt(normalized)
  if (value > MAX_UINT64 || value < -MAX_UINT64) {
    return { ok: false, error: "The supported range is −(2^64−1) to 2^64−1." }
  }
  return { ok: true, value, prime: isPrime(value) }
}
