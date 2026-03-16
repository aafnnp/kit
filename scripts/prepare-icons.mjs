#!/usr/bin/env node

import { rm, mkdir, mkdtemp, readFile, stat, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { spawn } from "node:child_process"
import pngToIco from "png-to-ico"

const pngPath = join("build", "icon.png")
const icoPath = join("build", "icon.ico")
const icnsPath = join("build", "icon.icns")

function run(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: "inherit", ...options })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${cmd} exited with code ${code}`))
    })
  })
}

async function ensurePngExists() {
  try {
    const st = await stat(pngPath)
    if (!st.isFile()) throw new Error("not a file")
  } catch {
    throw new Error(`Missing ${pngPath}`)
  }
}

async function ensureIco() {
  await mkdir("build", { recursive: true })
  const pngBuffer = await readFile(pngPath)
  const icoBuffer = await pngToIco(pngBuffer)
  await writeFile(icoPath, icoBuffer)
  process.stdout.write("✓ Generated build/icon.ico\n")
}

async function ensureIcns() {
  if (process.platform !== "darwin") {
    const header = Buffer.alloc(8)
    header.write("icns", 0, 4, "ascii")
    header.writeUInt32BE(8, 4)
    await writeFile(icnsPath, header)
    process.stdout.write("✓ Generated build/icon.icns (placeholder)\n")
    return
  }

  const iconsetDir = await mkdtemp(join(tmpdir(), "kit-icon-"))
  const iconsetPath = join(iconsetDir, "Kit.iconset")
  await mkdir(iconsetPath, { recursive: true })

  const sizes = [16, 32, 128, 256, 512]
  for (const size of sizes) {
    await run("sips", [
      "-z",
      String(size),
      String(size),
      pngPath,
      "--out",
      join(iconsetPath, `icon_${size}x${size}.png`),
    ])
    const size2x = size * 2
    await run("sips", [
      "-z",
      String(size2x),
      String(size2x),
      pngPath,
      "--out",
      join(iconsetPath, `icon_${size}x${size}@2x.png`),
    ])
  }

  await run("iconutil", ["-c", "icns", iconsetPath, "-o", icnsPath])
  await rm(iconsetDir, { recursive: true, force: true })
  process.stdout.write("✓ Generated build/icon.icns\n")
}

async function main() {
  await ensurePngExists()
  await ensureIco()
  await ensureIcns()
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
