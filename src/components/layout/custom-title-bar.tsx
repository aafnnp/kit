import { useEffect, useState } from "react"
import { isDesktopApp, getDesktopApi } from "@/lib/utils"
import { IconMinus, IconSquare, IconX, IconChevronUp } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export function CustomTitleBar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const desktopApi = getDesktopApi()
  const isDesktop = isDesktopApp()

  useEffect(() => {
    if (!isDesktop || !desktopApi) return

    // Check initial maximized state
    desktopApi.window.isMaximized().then(setIsMaximized)

    // Listen for window state changes
    const checkMaximized = () => {
      desktopApi.window.isMaximized().then(setIsMaximized)
    }

    // Check periodically (Electron doesn't have a built-in event for this)
    const interval = setInterval(checkMaximized, 100)

    return () => clearInterval(interval)
  }, [desktopApi, isDesktop])

  if (!isDesktop || !desktopApi) {
    return null
  }

  const handleMinimize = () => {
    desktopApi?.window.minimize()
  }

  const handleMaximize = () => {
    desktopApi?.window.maximize()
    setTimeout(() => {
      desktopApi?.window.isMaximized().then(setIsMaximized)
    }, 100)
  }

  const handleClose = () => {
    desktopApi?.window.close()
  }

  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0

  // Style objects for drag regions
  const dragStyle: React.CSSProperties & { WebkitAppRegion?: string; appRegion?: string } = {
    WebkitAppRegion: "drag",
    appRegion: "drag",
    WebkitUserSelect: "none",
    userSelect: "none",
    pointerEvents: "auto",
    cursor: "default",
  }

  const noDragStyle: React.CSSProperties & { WebkitAppRegion?: string; appRegion?: string } = {
    WebkitAppRegion: "no-drag",
    appRegion: "no-drag",
  }

  return (
    <div
      className="electron-title-bar"
      style={{
        ...dragStyle,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "32px",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "var(--background)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        paddingLeft: isMac ? "80px" : "16px",
        paddingRight: "16px",
      }}
    >
      {/* Left side - Window controls and app title */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", height: "100%", flex: 1 }}>
        {/* macOS traffic lights */}
        {isMac && (
          <div
            style={{
              ...noDragStyle,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              paddingRight: "12px",
            }}
          >
            <button
              type="button"
              style={{
                ...noDragStyle,
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#ff5f57",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={handleClose}
              aria-label="Close"
            />
            <button
              type="button"
              style={{
                ...noDragStyle,
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#ffbd2e",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={handleMinimize}
              aria-label="Minimize"
            />
            <button
              type="button"
              style={{
                ...noDragStyle,
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                backgroundColor: "#28c840",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
              onClick={handleMaximize}
              aria-label={isMaximized ? "Restore" : "Maximize"}
            />
          </div>
        )}
        {/* App title */}
        <div style={{ ...dragStyle, display: "flex", alignItems: "center", flex: 1, height: "100%" }}>
          <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--foreground)", opacity: 0.7 }}>Kit</span>
        </div>
      </div>

      {/* Right side - Window controls (Windows/Linux) */}
      {!isMac && (
        <div style={{ ...noDragStyle, display: "flex", alignItems: "center", height: "100%" }}>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-10 rounded-none hover:bg-muted/50"
            onClick={handleMinimize}
            aria-label="Minimize"
          >
            <IconMinus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-10 rounded-none hover:bg-muted/50"
            onClick={handleMaximize}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? <IconChevronUp className="h-4 w-4 rotate-180" /> : <IconSquare className="h-3 w-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-10 rounded-none hover:bg-destructive/90 hover:text-destructive-foreground"
            onClick={handleClose}
            aria-label="Close"
          >
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
