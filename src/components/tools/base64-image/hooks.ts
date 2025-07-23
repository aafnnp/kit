import { useCallback, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { nanoid } from 'nanoid'
import {
  ImageProcessingResult,
  ImageMetadata,
  QualityMetrics,
  ImageAnalysis,
  ProcessingBatch,
  BatchStatistics,
  ProcessingSettings,
  ImageTemplate,
  ImageValidation,
  ConversionDirection,
  ExportFormat,
} from '@/types/base64-image'
import { formatFileSize } from '@/lib/utils'

// Utility functions
export const detectImageFormat = (base64: string): string => {
  if (base64.startsWith('data:image/')) {
    const match = base64.match(/data:image\/([^;]+)/)
    return match ? match[1] : 'unknown'
  }

  // Try to detect from base64 header
  const header = base64.substring(0, 10)
  if (header.startsWith('/9j/')) return 'jpeg'
  if (header.startsWith('iVBORw0KGgo')) return 'png'
  if (header.startsWith('R0lGODlh')) return 'gif'
  if (header.startsWith('UklGR')) return 'webp'
  if (header.startsWith('Qk')) return 'bmp'

  return 'unknown'
}

export const isValidBase64Image = (base64: string): boolean => {
  try {
    // Check if it's a data URL
    if (base64.startsWith('data:image/')) {
      const base64Data = base64.split(',')[1]
      if (!base64Data) return false

      // Validate base64 encoding
      const decoded = atob(base64Data)
      return decoded.length > 0
    }

    // Check if it's raw base64
    if (base64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      const decoded = atob(base64)
      return decoded.length > 0
    }

    return false
  } catch {
    return false
  }
}

// Image processing functions
export const processImageToBase64 = async (file: File, settings: ProcessingSettings): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string

        if (settings.autoOptimize || settings.maxWidth || settings.maxHeight) {
          const optimized = await optimizeImage(result, settings)
          resolve(optimized)
        } else {
          resolve(result)
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export const optimizeImage = async (dataUrl: string, settings: ProcessingSettings): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }

        // Calculate new dimensions
        let { width, height } = img

        if (settings.maxWidth && width > settings.maxWidth) {
          height = (height * settings.maxWidth) / width
          width = settings.maxWidth
        }

        if (settings.maxHeight && height > settings.maxHeight) {
          width = (width * settings.maxHeight) / height
          height = settings.maxHeight
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)

        const quality = settings.quality / 100
        const format = `image/${settings.outputFormat}`

        const optimizedDataUrl = canvas.toDataURL(format, quality)
        resolve(optimizedDataUrl)
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

export const extractImageMetadata = (dataUrl: string): Promise<ImageMetadata> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()

    img.onload = () => {
      const format = detectImageFormat(dataUrl)
      const mimeType = dataUrl.startsWith('data:') ? dataUrl.split(';')[0].replace('data:', '') : `image/${format}`

      const metadata: ImageMetadata = {
        width: img.width,
        height: img.height,
        format,
        mimeType,
        aspectRatio: img.width / img.height,
        pixelCount: img.width * img.height,
        estimatedColors: estimateColorCount(img),
        hasTransparency: format === 'png' || format === 'gif' || format === 'webp',
      }

      resolve(metadata)
    }

    img.onerror = () => reject(new Error('Failed to load image for metadata extraction'))
    img.src = dataUrl
  })
}

export const estimateColorCount = (img: HTMLImageElement): number => {
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) return 0

    // Use a smaller sample for performance
    const sampleSize = Math.min(100, img.width, img.height)
    canvas.width = sampleSize
    canvas.height = sampleSize

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize)
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
    const data = imageData.data

    const colors = new Set<string>()
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      colors.add(`${r},${g},${b}`)
    }

    // Estimate total colors based on sample
    const sampleRatio = (sampleSize * sampleSize) / (img.width * img.height)
    return Math.round(colors.size / sampleRatio)
  } catch {
    return 0
  }
}

// Analysis functions
export const analyzeImage = async (input: string, direction: ConversionDirection): Promise<ImageAnalysis> => {
  const analysis: ImageAnalysis = {
    isValidImage: false,
    hasDataUrlPrefix: false,
    isOptimized: false,
    suggestedImprovements: [],
    imageIssues: [],
    qualityScore: 100,
    formatRecommendations: [],
  }

  if (direction === 'base64-to-image') {
    analysis.isValidImage = isValidBase64Image(input)
    analysis.hasDataUrlPrefix = input.startsWith('data:image/')

    if (!analysis.isValidImage) {
      analysis.imageIssues.push('Invalid Base64 image data')
      analysis.qualityScore -= 50
    }

    if (!analysis.hasDataUrlPrefix && analysis.isValidImage) {
      analysis.suggestedImprovements.push('Add data URL prefix for better browser compatibility')
      analysis.qualityScore -= 10
    }

    // Check size efficiency
    const base64Size = input.length
    if (base64Size > 1000000) {
      // 1MB
      analysis.suggestedImprovements.push('Consider compressing large images for better performance')
      analysis.qualityScore -= 20
    }

    // Format recommendations
    const format = detectImageFormat(input)
    if (format === 'bmp') {
      analysis.formatRecommendations.push('Consider converting BMP to PNG or JPEG for better compression')
    } else if (format === 'png' && base64Size > 500000) {
      analysis.formatRecommendations.push('Consider JPEG format for large photos without transparency')
    }
  }

  return analysis
}

// Templates
export const imageTemplates: ImageTemplate[] = [
  {
    id: 'small-icon',
    name: 'Small Icon',
    description: 'Small icon or favicon (16x16 to 64x64)',
    category: 'Icons',
    base64Example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    imageInfo: '1x1 pixel transparent PNG',
    useCase: ['Favicons', 'UI icons', 'Small graphics'],
  },
  {
    id: 'profile-photo',
    name: 'Profile Photo',
    description: 'User profile photo or avatar',
    category: 'Photos',
    base64Example:
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
    imageInfo: 'Sample JPEG profile image',
    useCase: ['User avatars', 'Profile pictures', 'Contact photos'],
  },
  {
    id: 'logo',
    name: 'Company Logo',
    description: 'Company or brand logo with transparency',
    category: 'Branding',
    base64Example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    imageInfo: 'PNG with transparency support',
    useCase: ['Company logos', 'Brand assets', 'Website headers'],
  },
  {
    id: 'product-image',
    name: 'Product Image',
    description: 'E-commerce product photo',
    category: 'Commerce',
    base64Example:
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
    imageInfo: 'High-quality product photo',
    useCase: ['Product catalogs', 'E-commerce', 'Marketing materials'],
  },
  {
    id: 'chart-graph',
    name: 'Chart/Graph',
    description: 'Data visualization or chart image',
    category: 'Data',
    base64Example:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    imageInfo: 'Chart or graph visualization',
    useCase: ['Reports', 'Dashboards', 'Data presentations'],
  },
]

// Validation functions
export const validateImageInput = (input: string, direction: ConversionDirection): ImageValidation => {
  const validation: ImageValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  }

  if (!input.trim()) {
    validation.isValid = false
    validation.errors.push({
      message: 'Input cannot be empty',
      type: 'format',
    })
    return validation
  }

  if (direction === 'base64-to-image') {
    if (!isValidBase64Image(input)) {
      validation.isValid = false
      validation.errors.push({
        message: 'Invalid Base64 image data',
        type: 'encoding',
        details: 'The input does not appear to be valid Base64 encoded image data',
      })
    }

    if (!input.startsWith('data:image/')) {
      validation.warnings.push('Missing data URL prefix - add "data:image/[format];base64," for better compatibility')
    }

    // Check size
    if (input.length > 5000000) {
      // 5MB
      validation.warnings.push('Large Base64 string detected - may cause performance issues')
    }

    // Format detection
    const format = detectImageFormat(input)
    if (format === 'unknown') {
      validation.warnings.push('Could not detect image format')
    }
  }

  return validation
}

// Utility functions for quality metrics
export const getSizeCategory = (pixelCount: number): string => {
  if (pixelCount < 10000) return 'Small'
  if (pixelCount < 100000) return 'Medium'
  if (pixelCount < 1000000) return 'Large'
  return 'Very Large'
}

export const calculateCompressionEfficiency = (inputSize: number, outputSize: number): number => {
  if (inputSize === 0) return 0
  return ((inputSize - outputSize) / inputSize) * 100
}

export const calculateDataUrlOverhead = (dataUrl: string): number => {
  if (!dataUrl.startsWith('data:')) return 0
  const prefixEnd = dataUrl.indexOf(',')
  if (prefixEnd === -1) return 0
  return ((prefixEnd + 1) / dataUrl.length) * 100
}

export const calculateBase64Efficiency = (dataUrl: string): number => {
  const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
  const decodedSize = base64Data.length * 0.75 // Base64 is ~33% larger than binary
  return (decodedSize / dataUrl.length) * 100
}

// Generate text report from results
export const generateTextFromResults = (results: ImageProcessingResult[]): string => {
  return `Base64 Image Processing Report
==============================

Generated: ${new Date().toLocaleString()}
Total Results: ${results.length}
Valid Results: ${results.filter((result) => result.isValid).length}
Invalid Results: ${results.filter((result) => !result.isValid).length}

Results:
${results
  .map((result, i) => {
    return `${i + 1}. Direction: ${result.direction}
   Status: ${result.isValid ? 'Valid' : 'Invalid'}
   ${result.error ? `Error: ${result.error}` : ''}
   Input Size: ${formatFileSize(result.statistics.inputSize)}
   Output Size: ${formatFileSize(result.statistics.outputSize)}
   Processing Time: ${result.statistics.processingTime.toFixed(2)}ms
   ${result.isValid ? `Resolution: ${result.statistics.imageMetadata.width}x${result.statistics.imageMetadata.height}` : ''}
   ${result.isValid ? `Format: ${result.statistics.imageMetadata.format}` : ''}
   Quality Score: ${result.analysis?.qualityScore || 'N/A'}
`
  })
  .join('\n')}

Statistics:
- Success Rate: ${((results.filter((result) => result.isValid).length / results.length) * 100).toFixed(1)}%
- Average Quality: ${(results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length).toFixed(1)}
`
}

// Custom hooks
export const useImageProcessing = () => {
  const processSingle = useCallback(
    async (
      input: string | File,
      direction: ConversionDirection,
      settings: ProcessingSettings
    ): Promise<ImageProcessingResult> => {
      const startTime = performance.now()

      try {
        let output: string
        let inputString: string
        let metadata: ImageMetadata

        if (direction === 'image-to-base64') {
          if (!(input instanceof File)) {
            throw new Error('File input required for image-to-base64 conversion')
          }

          output = await processImageToBase64(input, settings)
          inputString = input.name
          metadata = await extractImageMetadata(output)
        } else {
          if (typeof input !== 'string') {
            throw new Error('String input required for base64-to-image conversion')
          }

          inputString = input
          output = input.startsWith('data:image/') ? input : `data:image/png;base64,${input}`
          metadata = await extractImageMetadata(output)
        }

        const analysis = await analyzeImage(inputString, direction)
        const endTime = performance.now()
        const processingTime = endTime - startTime

        const inputSize = direction === 'image-to-base64' ? (input as File).size : new Blob([inputString]).size
        const outputSize = new Blob([output]).size

        const qualityMetrics: QualityMetrics = {
          resolution: `${metadata.width}x${metadata.height}`,
          sizeCategory: getSizeCategory(metadata.pixelCount),
          compressionEfficiency: calculateCompressionEfficiency(inputSize, outputSize),
          dataUrlOverhead: calculateDataUrlOverhead(output),
          base64Efficiency: calculateBase64Efficiency(output),
        }

        return {
          id: nanoid(),
          input: inputString,
          output,
          direction,
          isValid: true,
          statistics: {
            inputSize,
            outputSize,
            compressionRatio: outputSize / inputSize,
            processingTime,
            imageMetadata: metadata,
            qualityMetrics,
          },
          analysis,
          createdAt: new Date(),
        }
      } catch (error) {
        const endTime = performance.now()
        const processingTime = endTime - startTime

        return {
          id: nanoid(),
          input: typeof input === 'string' ? input : input.name,
          output: '',
          direction,
          isValid: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          statistics: {
            inputSize: typeof input === 'string' ? new Blob([input]).size : input.size,
            outputSize: 0,
            compressionRatio: 0,
            processingTime,
            imageMetadata: {
              width: 0,
              height: 0,
              format: 'unknown',
              mimeType: 'unknown',
              aspectRatio: 0,
              pixelCount: 0,
              estimatedColors: 0,
              hasTransparency: false,
            },
            qualityMetrics: {
              resolution: '0x0',
              sizeCategory: 'unknown',
              compressionEfficiency: 0,
              dataUrlOverhead: 0,
              base64Efficiency: 0,
            },
          },
          createdAt: new Date(),
        }
      }
    },
    []
  )

  const processBatch = useCallback(
    async (
      inputs: Array<{ content: string | File; direction: ConversionDirection }>,
      settings: ProcessingSettings
    ): Promise<ProcessingBatch> => {
      try {
        const results = await Promise.all(
          inputs.map((input) => processSingle(input.content, input.direction, settings))
        )

        const validCount = results.filter((result) => result.isValid).length
        const invalidCount = results.length - validCount

        const totalInputSize = results.reduce((sum, result) => sum + result.statistics.inputSize, 0)
        const totalOutputSize = results.reduce((sum, result) => sum + result.statistics.outputSize, 0)
        const averageQuality =
          results.length > 0
            ? results.reduce((sum, result) => sum + (result.analysis?.qualityScore || 0), 0) / results.length
            : 0

        const statistics: BatchStatistics = {
          totalProcessed: results.length,
          validCount,
          invalidCount,
          averageQuality,
          totalInputSize,
          totalOutputSize,
          successRate: (validCount / results.length) * 100,
        }

        return {
          id: nanoid(),
          results,
          count: results.length,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch processing error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch processing failed')
      }
    },
    [processSingle]
  )

  return { processSingle, processBatch }
}

// Real-time validation hook
export const useRealTimeValidation = (input: string, direction: ConversionDirection) => {
  return useMemo(() => {
    if (!input.trim()) {
      return {
        isValid: false,
        error: null,
        isEmpty: true,
      }
    }

    const validation = validateImageInput(input, direction)
    return {
      isValid: validation.isValid,
      error: validation.errors.length > 0 ? validation.errors[0].message : null,
      isEmpty: false,
      warnings: validation.warnings,
      suggestions: validation.suggestions,
      errors: validation.errors,
    }
  }, [input, direction])
}

// Copy to clipboard functionality
export const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
export const useImageExport = () => {
  const exportResults = useCallback((results: ImageProcessingResult[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'base64':
        content = results.map((result) => result.output).join('\n\n')
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'dataurl':
        content = results
          .map((result) =>
            result.output.startsWith('data:') ? result.output : `data:image/png;base64,${result.output}`
          )
          .join('\n\n')
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'json':
        const jsonData = results.map((result) => ({
          id: result.id,
          direction: result.direction,
          input: result.input,
          output: result.output,
          isValid: result.isValid,
          error: result.error,
          statistics: result.statistics,
          analysis: result.analysis,
          createdAt: result.createdAt,
        }))
        content = JSON.stringify(jsonData, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'txt':
      default:
        content = generateTextFromResults(results)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `base64-images${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportResults }
}