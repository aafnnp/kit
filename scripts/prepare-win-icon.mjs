#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import pngToIco from "png-to-ico"

const pngPath = join("build", "icon.png")
const icoPath = join("build", "icon.ico")

async function ensureIco() {
  try {
    const pngBuffer = await readFile(pngPath)
    const icoBuffer = await pngToIco(pngBuffer)
    await writeFile(icoPath, icoBuffer)
    console.log("✓ Generated build/icon.ico")
  } catch (error) {
    console.error("Failed to generate build/icon.ico", error)
    process.exitCode = 1
  }
}

await ensureIco()
