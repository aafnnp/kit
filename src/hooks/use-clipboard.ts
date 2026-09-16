// src/hooks/use-clipboard.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export const useCopyToClipboard = (resetDelay = 2000) => {
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 卸载时清掉定时器，避免在已卸载的组件上触发状态更新
  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  /**
   * 安排「已复制」状态的复位。
   * 每次调用前先清掉上一个定时器：否则连续复制时，前一次遗留的定时器
   * 会提前把新一次的 ✓ 提示清掉。
   */
  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current)
    }

    resetTimerRef.current = setTimeout(() => {
      resetTimerRef.current = null
      setCopiedText(null)
    }, resetDelay)
  }, [resetDelay])

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after delay
      scheduleReset()
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [scheduleReset])

  const copyImageToClipboard = useCallback(async (imageUrl: string, label?: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()

      if (blob.type.startsWith('image/')) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob
          })
        ])
        setCopiedText(label || 'image')
        toast.success(`${label || 'Image'} copied to clipboard`)

        scheduleReset()
      } else {
        throw new Error('Not a valid image')
      }
    } catch (error) {
      toast.error('Failed to copy image to clipboard')
    }
  }, [scheduleReset])

  const copyDataToClipboard = useCallback(async (data: any, format: 'json' | 'csv' | 'text' = 'json', label?: string) => {
    try {
      let textToCopy: string

      switch (format) {
        case 'json':
          textToCopy = JSON.stringify(data, null, 2)
          break
        case 'csv':
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]).join(',')
            const rows = data.map(item => Object.values(item).join(',')).join('\n')
            textToCopy = `${headers}\n${rows}`
          } else {
            textToCopy = JSON.stringify(data)
          }
          break
        case 'text':
        default:
          textToCopy = typeof data === 'string' ? data : JSON.stringify(data)
          break
      }

      await navigator.clipboard.writeText(textToCopy)
      setCopiedText(label || format)
      toast.success(`${label || format.toUpperCase()} data copied to clipboard`)

      scheduleReset()
    } catch (error) {
      toast.error('Failed to copy data to clipboard')
    }
  }, [scheduleReset])

  return {
    copyToClipboard,
    copyImageToClipboard,
    copyDataToClipboard,
    copiedText
  }
}