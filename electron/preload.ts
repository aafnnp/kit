import { contextBridge, ipcRenderer } from "electron"
import type { UpdateInfo, UpdateProgressEvent } from "./schemas"

// Re-export types for external use
export type { UpdateInfo, UpdateProgressEvent }

export interface DesktopApi {
  openExternal: (url: string) => Promise<void>
  relaunch: () => Promise<void>
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
  }
  updater: {
    check: () => Promise<UpdateInfo | null>
    downloadAndInstall: (onProgress: (event: UpdateProgressEvent) => void) => Promise<void>
    install: () => Promise<void>
  }
}

const desktopApi: DesktopApi = {
  openExternal: (url: string) => ipcRenderer.invoke("desktop:openExternal", url),
  relaunch: () => ipcRenderer.invoke("desktop:relaunch"),
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:maximize"),
    close: () => ipcRenderer.invoke("window:close"),
    isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  },
  updater: {
    check: async (): Promise<UpdateInfo | null> => {
      const result = await ipcRenderer.invoke("updater:check")
      if (result === null) {
        return null
      }
      return result as UpdateInfo
    },
    downloadAndInstall: (onProgress: (event: UpdateProgressEvent) => void) => {
      return new Promise<void>((resolve, reject) => {
        let isResolved = false
        const progressHandler = (_event: Electron.IpcRendererEvent, data: unknown) => {
          try {
            const validatedData = data as UpdateProgressEvent
            onProgress(validatedData)
            if (validatedData.event === "Finished") {
              if (!isResolved) {
                isResolved = true
                ipcRenderer.removeListener("updater:progress", progressHandler)
                resolve()
              }
            }
          } catch (error) {
            if (!isResolved) {
              isResolved = true
              ipcRenderer.removeListener("updater:progress", progressHandler)
              reject(error)
            }
          }
        }

        ipcRenderer.on("updater:progress", progressHandler)

        ipcRenderer
          .invoke("updater:downloadAndInstall")
          .then(() => {
            // Progress handler will resolve when "Finished" event is received
            // Set a timeout to prevent indefinite hanging if no progress events are received
            setTimeout(() => {
              if (!isResolved) {
                isResolved = true
                ipcRenderer.removeListener("updater:progress", progressHandler)
                reject(new Error("Download timeout: No progress events received"))
              }
            }, 300000) // 5 minutes timeout
          })
          .catch((error) => {
            if (!isResolved) {
              isResolved = true
              ipcRenderer.removeListener("updater:progress", progressHandler)
              reject(error)
            }
          })
      })
    },
    install: () => ipcRenderer.invoke("updater:install"),
  },
}

contextBridge.exposeInMainWorld("desktopApi", desktopApi)
