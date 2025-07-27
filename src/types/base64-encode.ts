// Types
export interface Base64File {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  encodingData?: EncodingData
}

export interface EncodingData {
  encodings: EncodingResult[]
  statistics: EncodingStatistics
  settings: EncodingSettings
}

export interface EncodingResult {
  id: string
  operation: EncodingOperation
  input: string
  output: string
  inputFormat: EncodingFormat
  outputFormat: EncodingFormat
  metadata: EncodingMetadata
}

export interface EncodingMetadata {
  inputSize: number
  outputSize: number
  compressionRatio: number
  processingTime: number
  isValid: boolean
  encoding: string
}

export interface EncodingStatistics {
  totalEncodings: number
  operationDistribution: Record<EncodingOperation, number>
  averageCompressionRatio: number
  averageProcessingTime: number
  successRate: number
  processingTime: number
}

export interface EncodingSettings {
  defaultOperation: EncodingOperation
  defaultFormat: EncodingFormat
  includeMetadata: boolean
  optimizeOutput: boolean
  exportFormat: ExportFormat
  chunkSize: number
}

export interface EncodingTemplate {
  id: string
  name: string
  description: string
  category: string
  operation: EncodingOperation
  inputFormat: EncodingFormat
  outputFormat: EncodingFormat
  example: string
}

// Enums
export type EncodingOperation = 'encode' | 'decode'
export type EncodingFormat = 'text' | 'base64' | 'url' | 'hex' | 'binary'
export type ExportFormat = 'txt' | 'json' | 'csv'
