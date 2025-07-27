// Types
export interface TextFile {
  id: string
  file: File
  originalContent: string
  convertedContent: string
  name: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  conversions?: ConversionResult[]
}

export interface ConversionResult {
  type: CaseType
  content: string
  preview: string // First 100 characters for preview
}

export interface ConversionSettings {
  preserveFormatting: boolean
  handleSpecialChars: boolean
  customDelimiter: string
  batchMode: boolean
  previewLength: number
}

export interface ConversionStats {
  totalFiles: number
  totalCharacters: number
  totalWords: number
  totalConversions: number
  averageFileSize: number
  processingTime: number
}

// Case conversion types
export type CaseType =
  | 'uppercase'
  | 'lowercase'
  | 'titlecase'
  | 'sentencecase'
  | 'camelcase'
  | 'pascalcase'
  | 'snakecase'
  | 'kebabcase'
  | 'constantcase'
  | 'dotcase'
  | 'pathcase'
  | 'togglecase'

export interface CaseOption {
  value: CaseType
  name: string
  description: string
  example: string
  icon: React.ReactNode
}
