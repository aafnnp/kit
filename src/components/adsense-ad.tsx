import { useEffect, useRef } from 'react'
import { isTauri } from '@/lib/utils'

interface AdSenseAdProps {
  className?: string
  style?: React.CSSProperties
  adSlot: string
  adClient: string
  adFormat?: string
  fullWidthResponsive?: boolean
  layout?: string
}

export function AdSenseAd({
  className = '',
  style = {},
  adSlot,
  adClient,
  layout = 'in-article',
  adFormat = 'fluid',
  fullWidthResponsive = true,
}: AdSenseAdProps) {
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isTauri()) return
    try {
      // @ts-ignore
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch (e) {
      console.error('AdSense error:', e)
    }
  }, [adSlot, adClient, layout, adFormat, fullWidthResponsive])

  if (isTauri()) return null

  return (
    <div
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{
        display: 'block',
        textAlign: 'center',
        margin: '20px 0',
        ...style,
      }}
      data-ad-layout={layout}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  )
}
