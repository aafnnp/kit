export interface ParsedUrl {
  href: string
  protocol: string
  hostname: string
  port: string
  pathname: string
  origin: string
  hash: string
  username: string
  hasCredentials: boolean
  searchParams: Array<{ key: string; value: string }>
  pathSegments: string[]
}

export function inspectUrl(input: string): ParsedUrl {
  let url: URL
  try {
    url = new URL(input.trim())
  } catch {
    throw new Error("Enter a valid absolute URL, including its scheme.")
  }

  return {
    href: url.href,
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port,
    pathname: url.pathname,
    origin: url.origin,
    hash: url.hash,
    username: url.username,
    hasCredentials: Boolean(url.username || url.password),
    searchParams: [...url.searchParams.entries()].map(([key, value]) => ({ key, value })),
    pathSegments: url.pathname.split("/").filter(Boolean),
  }
}
