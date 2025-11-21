import { useEffect } from "react"
import { isDesktopApp } from "@/lib/utils"
import { useLocation } from "@tanstack/react-router"

export function AdSenseAd() {
  const location = useLocation()

  useEffect(() => {
    if (isDesktopApp()) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error("AdSense error:", e)
    }
  }, [location.pathname])

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
