import { useEffect } from "react"
import { ShortcutMap } from "@/schemas/common.schema"

export const useKeyboardShortcuts = (shortcuts: ShortcutMap, enabled = true) => {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的按键
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") {
        return
      }

      // 创建快捷键标识符
      const modifiers = []
      if (e.ctrlKey || e.metaKey) modifiers.push("ctrl")
      if (e.altKey) modifiers.push("alt")
      if (e.shiftKey) modifiers.push("shift")

      const key = e.key.toLowerCase()
      const shortcutKey = modifiers.length > 0 ? `${modifiers.join("+")}+${key}` : key

      if (shortcuts[shortcutKey]) {
        e.preventDefault()
        shortcuts[shortcutKey](e)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [shortcuts, enabled])
}

// 预定义的常用快捷键
export const createCommonShortcuts = (handlers: {
  onOpen?: () => void
  onSave?: () => void
  onExport?: () => void
  onClear?: () => void
  onProcess?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSelectAll?: () => void
  onCopy?: () => void
  onPaste?: () => void
}): ShortcutMap => {
  const shortcuts: ShortcutMap = {}

  if (handlers.onOpen) shortcuts["ctrl+o"] = handlers.onOpen
  if (handlers.onSave) shortcuts["ctrl+s"] = handlers.onSave
  if (handlers.onExport) shortcuts["ctrl+e"] = handlers.onExport
  if (handlers.onClear) shortcuts["ctrl+delete"] = handlers.onClear
  if (handlers.onProcess) shortcuts["ctrl+enter"] = handlers.onProcess
  if (handlers.onUndo) shortcuts["ctrl+z"] = handlers.onUndo
  if (handlers.onRedo) shortcuts["ctrl+y"] = handlers.onRedo
  if (handlers.onSelectAll) shortcuts["ctrl+a"] = handlers.onSelectAll
  if (handlers.onCopy) shortcuts["ctrl+c"] = handlers.onCopy
  if (handlers.onPaste) shortcuts["ctrl+v"] = handlers.onPaste

  return shortcuts
}
