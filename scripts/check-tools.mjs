import fs from 'fs'
import path from 'path'

const root = path.resolve(process.cwd(), 'src/components/tools')
const dataFile = path.resolve(process.cwd(), 'src/lib/data.ts')

const content = fs.readFileSync(dataFile, 'utf-8')
const slugRegex = /slug:\s*'([^']+)'/g
const slugs = new Set()
let m
while ((m = slugRegex.exec(content))) {
  slugs.add(m[1])
}

const missing = []
const extra = []

// 检查 data.ts 是否存在对应目录
for (const slug of slugs) {
  const dir = path.join(root, slug)
  const f = path.join(dir, 'index.tsx')
  if (!fs.existsSync(f)) missing.push(slug)
}

// 检查目录中多余的工具未在 data.ts 声明
const dirs = fs
  .readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

for (const d of dirs) {
  if (!slugs.has(d)) extra.push(d)
}

if (missing.length || extra.length) {
  console.error('[tools check] Mismatch found:')
  if (missing.length) console.error(' - Missing in filesystem:', missing.join(', '))
  if (extra.length) console.error(' - Extra in filesystem:', extra.join(', '))
  process.exit(1)
} else {
  console.log('[tools check] OK')
}
