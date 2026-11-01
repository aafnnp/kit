export interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

function decodePart(part: string): string {
  let value = part.replace(/-/g, "+").replace(/_/g, "/")
  while (value.length % 4 !== 0) value += "="
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
}

export function decodeJwt(token: string): { ok: true; jwt: DecodedJwt } | { ok: false; error: string } {
  const parts = token.trim().split(".")
  if (parts.length !== 3) return { ok: false, error: "A JWT has three parts separated by dots" }

  try {
    const header: unknown = JSON.parse(decodePart(parts[0]!))
    const payload: unknown = JSON.parse(decodePart(parts[1]!))
    if (!header || typeof header !== "object" || Array.isArray(header)) return { ok: false, error: "Header is not a JSON object" }
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return { ok: false, error: "Payload is not a JSON object" }
    return {
      ok: true,
      jwt: {
        header: header as Record<string, unknown>,
        payload: payload as Record<string, unknown>,
        signature: parts[2]!,
      },
    }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export interface ClaimTime {
  name: string
  seconds: number
  iso: string
  relative: string
}

export function timeClaims(payload: Record<string, unknown>, now = Date.now()): ClaimTime[] {
  const claims: ClaimTime[] = []
  for (const name of ["iat", "nbf", "exp"]) {
    const value = payload[name]
    if (typeof value !== "number" || !Number.isFinite(value)) continue
    const date = new Date(value * 1000)
    const delta = Math.round((date.getTime() - now) / 1000)
    const relative =
      name === "exp"
        ? delta < 0
          ? `expired ${formatDuration(-delta)} ago`
          : `expires in ${formatDuration(delta)}`
        : delta < 0
          ? `${formatDuration(-delta)} ago`
          : `in ${formatDuration(delta)}`
    claims.push({ name, seconds: value, iso: date.toISOString(), relative })
  }
  return claims
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h`
  return `${Math.round(seconds / 86400)}d`
}
