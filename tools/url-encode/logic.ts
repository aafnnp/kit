export type UrlMode = "component" | "full"

export function encodeUrl(text: string, mode: UrlMode): string {
  return mode === "component" ? encodeURIComponent(text) : encodeURI(text)
}

export function decodeUrl(text: string, mode: UrlMode): string {
  try {
    return mode === "component" ? decodeURIComponent(text) : decodeURI(text)
  } catch (error) {
    throw new Error(`Invalid URL encoding: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export interface QueryPair {
  key: string
  value: string
}

export function parseQuery(text: string): QueryPair[] {
  const query = text.includes("?") ? text.slice(text.indexOf("?") + 1).split("#")[0]! : text
  if (!query) return []
  return query
    .split("&")
    .filter(Boolean)
    .map((part) => {
      const index = part.indexOf("=")
      const rawKey = index === -1 ? part : part.slice(0, index)
      const rawValue = index === -1 ? "" : part.slice(index + 1)
      return { key: safeDecode(rawKey), value: safeDecode(rawValue) }
    })
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "))
  } catch {
    return value
  }
}
