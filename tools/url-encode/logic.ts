import { guardInput } from "../../lib/validation"

export type UrlMode = "component" | "query" | "full"

export function encodeUrl(text: string, mode: UrlMode): string {
  guardInput(text)
  if (mode === "full") return encodeURI(text)
  const encoded = encodeURIComponent(text)
  return mode === "query" ? encoded.replace(/%20/g, "+") : encoded
}

export function decodeUrl(text: string, mode: UrlMode): string {
  guardInput(text)
  try {
    if (mode === "full") return decodeURI(text)
    return decodeURIComponent(mode === "query" ? text.replace(/\+/g, " ") : text)
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
