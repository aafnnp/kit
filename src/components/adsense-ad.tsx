import { useEffect, useRef } from 'react'

interface AdSenseAdProps {
  className?: string
  style?: React.CSSProperties
  adSlot: string
  adClient: string
  adFormat?: string
  fullWidthResponsive?: boolean
}

export function AdSenseAd({
  className = '',
  style = {},
  adSlot,
  adClient,
  adFormat = 'auto',
  fullWidthResponsive = true,
}: AdSenseAdProps) {
  const adRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && adRef.current) {
      // 确保 adsbygoogle 对象存在
      ;(window as any).adsbygoogle = (window as any).adsbygoogle || []

      // 延迟初始化，确保 DOM 已准备好
      const timer = setTimeout(() => {
        try {
          ;(window as any).adsbygoogle.push({})
        } catch (error) {
          console.warn('AdSense initialization error:', error)
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [])

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
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  )
}
