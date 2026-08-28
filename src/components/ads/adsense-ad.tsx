import { useEffect, useRef } from "react"
import { isDesktopApp } from "@/lib/utils"

export function AdSenseAd() {
  // 每个实例只 push 一次：React StrictMode 在开发环境会重复执行 effect，
  // 重复 push 会触发 Adsbygoogle TagError（"All 'ins' elements ... already have ads in them"）
  const pushedRef = useRef(false)

  useEffect(() => {
    if (isDesktopApp() || pushedRef.current) return
    pushedRef.current = true
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error("AdSense error:", e)
    }
  }, [])

  if (isDesktopApp()) return null

  return (
    <div className="my-8">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3854566314387093"
        data-ad-slot="9901453595"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
