import { contextBridge, ipcRenderer } from "electron"

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

export interface UpdateInfo {
  version: string
  date?: string
  body?: string
}

export interface UpdateProgressEvent {
  event: "Started" | "Progress" | "Finished"
  data: {
    downloaded?: number
    chunkLength?: number
    contentLength?: number
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
    check: () => ipcRenderer.invoke("updater:check"),
    downloadAndInstall: (onProgress: (event: UpdateProgressEvent) => void) => {
      return new Promise<void>((resolve, reject) => {
        const progressHandler = (_event: Electron.IpcRendererEvent, data: UpdateProgressEvent) => {
          onProgress(data)
          if (data.event === "Finished") {
            ipcRenderer.removeListener("updater:progress", progressHandler)
            resolve()
          }
        }

        ipcRenderer.on("updater:progress", progressHandler)

        ipcRenderer
          .invoke("updater:downloadAndInstall")
          .then(() => {
            // Progress handler will resolve
          })
          .catch((error) => {
            ipcRenderer.removeListener("updater:progress", progressHandler)
            reject(error)
          })
      })
    },
    install: () => ipcRenderer.invoke("updater:install"),
  },
}

contextBridge.exposeInMainWorld("desktopApi", desktopApi)
