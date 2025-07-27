// src/hooks/use-clipboard.ts
import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export const useCopyToClipboard = (resetDelay = 2000) => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after delay
      setTimeout(() => setCopiedText(null), resetDelay)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [resetDelay])

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

        setTimeout(() => setCopiedText(null), resetDelay)
      } else {
        throw new Error('Not a valid image')
      }
    } catch (error) {
      toast.error('Failed to copy image to clipboard')
    }
  }, [resetDelay])

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

      setTimeout(() => setCopiedText(null), resetDelay)
    } catch (error) {
      toast.error('Failed to copy data to clipboard')
    }
  }, [resetDelay])

  return {
    copyToClipboard,
    copyImageToClipboard,
    copyDataToClipboard,
    copiedText
  }
}