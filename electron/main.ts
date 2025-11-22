import { app, BrowserWindow, ipcMain, shell } from "electron"
import updater from "electron-updater"
import * as path from "path"
import { fileURLToPath } from "url"
import { existsSync, readFileSync } from "fs"
import type { IpcMainInvokeEvent } from "electron"
import { z } from "zod"
import { updateInfoSchema, updateProgressEventSchema } from "./schemas"

const { autoUpdater } = updater

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged

// Zod schemas for IPC validation
const urlSchema = z.string().url()

// Dynamically read package.json to avoid import path issues
function getPackageJson() {
  const packageJsonPath = isDev ? path.join(process.cwd(), "package.json") : path.join(__dirname, "../package.json")

  try {
    const packageJsonContent = readFileSync(packageJsonPath, "utf-8")
    return JSON.parse(packageJsonContent)
  } catch (error) {
    console.error("Failed to read package.json:", error)
    return { version: app.getVersion() }
  }
}

let mainWindow: BrowserWindow | null = null

function createWindow() {
  // In dev, tsx runs from electron/ directory, compiled files are in electron/dist-electron/
  // In prod, compiled files are in dist-electron/ directory (same as main.js)
  let iconPath: string | undefined
  let preloadPath: string | undefined

  if (isDev) {
    // In development, use icon from project root
    const devIconPath = path.join(process.cwd(), "build/icon.png")
    if (existsSync(devIconPath)) {
      iconPath = devIconPath
    }
    // In development, preload is compiled to electron/dist-electron/preload.cjs
    // Use .cjs extension to ensure CommonJS format (required for Electron preload)
    const devPreloadPath = path.join(process.cwd(), "electron/dist-electron/preload.cjs")
    if (existsSync(devPreloadPath)) {
      preloadPath = devPreloadPath
    } else {
      // Fallback to .js if .cjs doesn't exist (for backward compatibility)
      const devPreloadPathJs = path.join(process.cwd(), "electron/dist-electron/preload.js")
      if (existsSync(devPreloadPathJs)) {
        preloadPath = devPreloadPathJs
      }
    }
  } else {
    // In production, icon is set by electron-builder, but we can also set it manually
    const prodIconPath = path.join(__dirname, "../build/icon.png")
    if (existsSync(prodIconPath)) {
      iconPath = prodIconPath
    }
    // In production, preload is in dist-electron/preload.cjs
    const prodPreloadPath = path.join(__dirname, "preload.cjs")
    if (existsSync(prodPreloadPath)) {
      preloadPath = prodPreloadPath
    } else {
      // Fallback to .js if .cjs doesn't exist
      const prodPreloadPathJs = path.join(__dirname, "preload.js")
      if (existsSync(prodPreloadPathJs)) {
        preloadPath = prodPreloadPathJs
      }
    }
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    title: "Kit",
    icon: iconPath,
    // Completely remove system frame on all platforms
    // This removes the system title bar including traffic lights on macOS
    frame: false,
    // macOS specific visual effects
    ...(process.platform === "darwin"
      ? {
          transparent: true,
          backgroundColor: "#00000000", // Transparent background
          vibrancy: "under-window",
          visualEffectState: "active",
        }
      : {}),
    // Hide menu bar on all platforms
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // Enable context isolation for security
      sandbox: false,
      preload: preloadPath, // Load preload script to expose desktopApi
    },
  })

  if (!mainWindow) return

  // Hide menu bar immediately
  mainWindow.setMenuBarVisibility(false)

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173")
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"))
  }

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Ensure menu bar stays hidden when window is ready
  mainWindow.once("ready-to-show", () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setMenuBarVisibility(false)
    }
  })
}

app.whenReady().then(() => {
  // Get icon path based on environment
  const iconPath = isDev ? path.join(process.cwd(), "build/icon.png") : path.join(__dirname, "../build/icon.png")

  // Set app icon for macOS dock in development mode
  if (isDev && process.platform === "darwin") {
    if (existsSync(iconPath)) {
      app.dock.setIcon(iconPath)
    }
  }

  createWindow()

  const packageJson = getPackageJson()
  app.setAboutPanelOptions({
    applicationName: "Kit",
    applicationVersion: packageJson.version,
    version: app.getVersion(),
    iconPath: existsSync(iconPath) ? iconPath : undefined,
    copyright: "Copyright © 2025 Manon. All rights reserved.",
  })

  app.setName("Kit")

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle("desktop:openExternal", async (_event: IpcMainInvokeEvent, url: string) => {
  try {
    const validatedUrl = urlSchema.parse(url)
    await shell.openExternal(validatedUrl)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid URL provided:", error.issues)
      throw new Error(`Invalid URL: ${error.issues.map((issue) => issue.message).join(", ")}`)
    }
    throw error
  }
})

ipcMain.handle("desktop:relaunch", async () => {
  app.relaunch()
  app.exit(0)
})

// Window control handlers
ipcMain.handle("window:minimize", () => {
  if (mainWindow) {
    mainWindow.minimize()
  }
})

ipcMain.handle("window:maximize", () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle("window:close", () => {
  if (mainWindow) {
    mainWindow.close()
  }
})

ipcMain.handle("window:isMaximized", () => {
  return mainWindow?.isMaximized() ?? false
})

// Updater handlers
ipcMain.handle("updater:check", async () => {
  if (isDev) {
    return null
  }
  try {
    const result = await autoUpdater.checkForUpdates()
    if (result && result.updateInfo) {
      const updateInfo = {
        version: result.updateInfo.version,
        date: result.updateInfo.releaseDate,
        body: result.updateInfo.releaseNotes,
      }
      // Validate before sending
      return updateInfoSchema.parse(updateInfo)
    }
    return null
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Invalid update info format:", error.issues)
      return null
    }
    console.error("Update check failed:", error)
    return null
  }
})

ipcMain.handle("updater:downloadAndInstall", async (event: IpcMainInvokeEvent) => {
  if (isDev) {
    return
  }

  return new Promise<void>((resolve, reject) => {
    const sendProgressEvent = (eventData: z.infer<typeof updateProgressEventSchema>) => {
      try {
        const validated = updateProgressEventSchema.parse(eventData)
        event.sender.send("updater:progress", validated)
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error("Invalid progress event format:", error.issues)
        } else {
          throw error
        }
      }
    }

    const progressHandler = (progress: any) => {
      sendProgressEvent({
        event: "Progress",
        data: {
          downloaded: progress.transferred || 0,
          chunkLength: progress.delta || 0,
          contentLength: progress.total || 0,
        },
      })
    }

    const downloadedHandler = () => {
      sendProgressEvent({
        event: "Finished",
        data: {},
      })
      autoUpdater.removeListener("download-progress", progressHandler)
      autoUpdater.removeListener("update-downloaded", downloadedHandler)
      autoUpdater.removeListener("error", errorHandler)
      resolve()
    }

    const errorHandler = (error: Error) => {
      autoUpdater.removeListener("download-progress", progressHandler)
      autoUpdater.removeListener("update-downloaded", downloadedHandler)
      autoUpdater.removeListener("error", errorHandler)
      reject(error)
    }

    autoUpdater.on("download-progress", progressHandler)
    autoUpdater.on("update-downloaded", downloadedHandler)
    autoUpdater.on("error", errorHandler)

    // Send Started event
    sendProgressEvent({
      event: "Started",
      data: {
        contentLength: 0,
      },
    })

    autoUpdater.downloadUpdate().catch((error: Error) => {
      errorHandler(error)
    })
  })
})

ipcMain.handle("updater:install", async () => {
  if (isDev) {
    return
  }
  autoUpdater.quitAndInstall(false, true)
})

// Configure autoUpdater
if (!isDev) {
  autoUpdater.setFeedURL({
    provider: "github",
    owner: "aafnnp",
    repo: "kit",
  })

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
}
