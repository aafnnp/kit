// 轻量事件总线与性能标记工具

type PerfEventMap = {
  tti: { ms: number; ts: number }
  tool_interactive: { slug: string; ms: number; ts: number }
  worker_task: { id: string; type: string; ms: number; ts: number }
  lcp: { value: number; ts: number }
  cls: { value: number; ts: number }
  inp: { value: number; ts: number }
  longtask: { duration: number; ts: number }
}

class PerfBus {
  private target = new EventTarget()

  emit<K extends keyof PerfEventMap>(type: K, detail: PerfEventMap[K]): void {
    this.target.dispatchEvent(new CustomEvent(String(type), { detail }))
  }

  on<K extends keyof PerfEventMap>(type: K, handler: (d: PerfEventMap[K]) => void): () => void {
    const listener = (e: Event) => handler((e as CustomEvent).detail)
    this.target.addEventListener(String(type), listener)
    return () => this.target.removeEventListener(String(type), listener)
  }
}

export const perfBus = new PerfBus()

// 性能标记：简单 mark/measure
export function mark(name: string): void {
  try {
    performance.mark(name)
  } catch {}
}

export function measure(name: string, startMark: string): number | null {
  try {
    performance.measure(name, startMark)
    const entries = performance.getEntriesByName(name)
    const last = entries[entries.length - 1]
    return last?.duration ?? null
  } catch {
    return null
  }
}

// TTI 近似：空闲时测量从 app_start 到首次空闲
export function scheduleTTIMeasure(): void {
  const ric: any = (window as any).requestIdleCallback
  const now = () => performance.now()
  const start = now()
  const run = () => {
    const ms = now() - start
    perfBus.emit('tti', { ms, ts: Date.now() })
  }
  if (typeof ric === 'function') {
    ric(() => run(), { timeout: 3000 })
  } else {
    setTimeout(run, 0)
  }
}

// Web Vitals 接入
let webVitalsInitialized = false
export async function initWebVitals(): Promise<void> {
  if (webVitalsInitialized) return
  try {
    // 动态导入，避免在类型解析阶段强依赖
    const mod: any = await import('web-vitals')
    const onLCP = mod.onLCP as (cb: (m: any) => void) => void
    const onCLS = mod.onCLS as (cb: (m: any) => void) => void
    const onINP = mod.onINP as (cb: (m: any) => void) => void
    onLCP((m: any) => perfBus.emit('lcp', { value: m.value, ts: Date.now() }))
    onCLS((m: any) => perfBus.emit('cls', { value: m.value, ts: Date.now() }))
    onINP((m: any) => perfBus.emit('inp', { value: m.value, ts: Date.now() }))
    webVitalsInitialized = true
  } catch (e) {
    // 可选依赖失败时忽略
  }
}

// 长任务监控统一上报
export function initLongTaskObserver(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const anyEntry: any = entry
        if (anyEntry.entryType === 'longtask') {
          perfBus.emit('longtask', { duration: anyEntry.duration, ts: Date.now() })
        }
      }
    })
    observer.observe({ entryTypes: ['longtask'] as any })
  } catch {}
}

export type { PerfEventMap }
