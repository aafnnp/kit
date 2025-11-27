import fs from "node:fs"
import path from "node:path"

const toolsRoot = path.resolve(process.cwd(), "src/components/tools")

const issues = {
  missingMeta: [],
  missingComponent: [],
  slugMismatch: [],
  missingCategory: [],
}

const dirs = fs
  .readdirSync(toolsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

for (const slug of dirs) {
  const toolDir = path.join(toolsRoot, slug)
  const componentPath = path.join(toolDir, "index.tsx")
  if (!fs.existsSync(componentPath)) {
    issues.missingComponent.push(slug)
  }

  const metaPath = path.join(toolDir, "meta.ts")
  if (!fs.existsSync(metaPath)) {
    issues.missingMeta.push(slug)
    continue
  }

  const metaContent = fs.readFileSync(metaPath, "utf8")
  const slugMatch = metaContent.match(/slug:\s*["'`](.+?)["'`]/)
  if (!slugMatch) {
    issues.slugMismatch.push(`${slug} (missing slug field)`)
  } else if (slugMatch[1] !== slug) {
    issues.slugMismatch.push(`${slug} (found ${slugMatch[1]})`)
  }

  const categoryMatch = metaContent.match(/category:\s*["'`](.+?)["'`]/)
  if (!categoryMatch) {
    issues.missingCategory.push(slug)
  }
}

const hasIssues = Object.values(issues).some((list) => list.length > 0)

if (hasIssues) {
  console.error("[tools check] Validation failed:")
  if (issues.missingComponent.length) {
    console.error(" - Missing component index.tsx:", issues.missingComponent.join(", "))
  }
  if (issues.missingMeta.length) {
    console.error(" - Missing meta.ts:", issues.missingMeta.join(", "))
  }
  if (issues.slugMismatch.length) {
    console.error(" - Slug mismatch:", issues.slugMismatch.join(", "))
  }
  if (issues.missingCategory.length) {
    console.error(" - Missing category in meta.ts:", issues.missingCategory.join(", "))
  }
  process.exit(1)
}

console.log("[tools check] OK")
