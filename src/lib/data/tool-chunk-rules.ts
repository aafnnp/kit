export interface ToolChunkRule {
  name: string
  matcher: RegExp
}

export const toolChunkRules: ToolChunkRule[] = [
  { name: "tools-text", matcher: /(text|word|markdown|yaml|json|csv|table|regex|diff|toc|html|slug)/ },
  { name: "tools-media", matcher: /(image|video|audio|svg|gif|icon|sprite|pdf|ffmpeg)/ },
  { name: "tools-security", matcher: /(hash|jwt|password|encrypt|decrypt|token|checksum|bcrypt|sha|security)/ },
  { name: "tools-generator", matcher: /(uuid|qr|barcode|fake|lorem|random|color|shadow|gradient|placeholder|generator)/ },
  { name: "tools-network", matcher: /(api|dns|http|ip|timezone|unix|user|agent|mime)/ },
  { name: "tools-math", matcher: /(math|prime|matrix|solver|benchmark|performance)/ },
]

export const getToolChunkName = (slug: string): string => {
  const rule = toolChunkRules.find((entry) => entry.matcher.test(slug))
  return rule ? rule.name : "tools-misc"
}


