import { useEffect, useRef } from 'react'
import { isTauri } from '@/lib/utils'

export function AdSenseAd() {
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isTauri()) return
    try {
      // @ts-ignore
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense error:', e)
    }
  }, [])

  if (isTauri()) return null

  return (
    <div ref={adRef} className="my-8">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-3854566314387093"
        data-ad-slot="9901453595"
        data-ad-format="auto"
        data-full-width-responsive="true"
        // data-adtest={process.env.NODE_ENV === "development" ? "on" : "off"}
      />
    </div>
  )
}
