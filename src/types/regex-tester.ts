// Regex Tester 相关类型声明
export interface TextFile {
  id: string
  name: string
  content: string
  size: number
  type: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
  processedAt?: Date
  matches?: RegexMatch[]
  statistics?: RegexStatistics
}

export interface RegexMatch {
  match: string
  index: number
  groups: string[]
  namedGroups: Record<string, string>
  input: string
  length: number
}

export interface RegexStatistics {
  totalMatches: number
  uniqueMatches: number
  averageMatchLength: number
  matchPositions: number[]
  captureGroups: number
  namedGroups: string[]
  executionTime: number
  textLength: number
  coverage: number
}

export interface RegexSettings {
  flags: {
    global: boolean
    ignoreCase: boolean
    multiline: boolean
    dotAll: boolean
    unicode: boolean
    sticky: boolean
  }
  highlightMatches: boolean
  showCaptureGroups: boolean
  showMatchPositions: boolean
  maxMatches: number
  timeout: number
  enableReplacement: boolean
  replacementText: string
}

export interface RegexPattern {
  name: string
  pattern: string
  description: string
  category: string
  flags: string
  example: string
}

export interface RegexTestResult {
  isValid: boolean
  matches: RegexMatch[]
  statistics: RegexStatistics
  error?: string
  replacementResult?: string
}
