import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return window.innerWidth < MOBILE_BREAKPOINT
  })

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }

    // 使用 matches 属性而不是 window.innerWidth，更准确
    setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)

    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
