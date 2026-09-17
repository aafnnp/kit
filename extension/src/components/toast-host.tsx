import { useEffect, useState } from "react"
import { cn } from "@/lib/cn"
import { subscribeToasts, type ToastPayload } from "@/lib/notify"

/**
 * 内联提示宿主。
 * 由插件通过 `ctx.notify()` 触发，不需要插件自己管理计时器。
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastPayload[]>([])

  useEffect(() => {
    const timers = new Map<string, ReturnType<typeof setTimeout>>()

    const unsubscribe = subscribeToasts((toast) => {
      setToasts((previous) => [...previous.filter((item) => item.id !== toast.id), toast])

      const existing = timers.get(toast.id)
      if (existing) clearTimeout(existing)

      timers.set(
        toast.id,
        setTimeout(() => {
          timers.delete(toast.id)
          setToasts((previous) => previous.filter((item) => item.id !== toast.id))
        }, toast.timeout),
      )
    })

    return () => {
      unsubscribe()
      for (const timer of timers.values()) clearTimeout(timer)
      timers.clear()
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="kit-toasts" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={cn("kit-toast", `kit-toast--${toast.type}`)}>
          {toast.message}
        </div>
      ))}
    </div>
  )
}
