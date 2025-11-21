#!/usr/bin/env node

import { existsSync, renameSync } from "node:fs"
import { join } from "node:path"

const preloadJsPath = join("electron", "dist-electron", "preload.js")
const preloadCjsPath = join("electron", "dist-electron", "preload.cjs")
const shouldWatch = process.argv.includes("--watch")
const intervalMs = 1000

function renameIfNeeded() {
  if (!existsSync(preloadJsPath)) {
    return
  }

  try {
    renameSync(preloadJsPath, preloadCjsPath)
    console.log("✓ Renamed preload.js to preload.cjs")
  } catch (error) {
    console.error("Failed to rename preload.js:", error)
  }
}

renameIfNeeded()

if (shouldWatch) {
  const timer = setInterval(renameIfNeeded, intervalMs)
  const cleanup = () => {
    clearInterval(timer)
    process.exit(0)
  }

  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
}
