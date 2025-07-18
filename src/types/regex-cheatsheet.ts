// Regex Cheatsheet 相关类型声明
export interface RegexPattern {
  id: string
  name: string
  description: string
  pattern: string
  flags?: string
  category: RegexCategory
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  examples: RegexExample[]
  explanation: string
  useCase: string[]
  tags: string[]
  alternatives?: string[]
  performance: 'fast' | 'medium' | 'slow'
  compatibility: string[]
  createdAt: Date
}

export interface RegexExample {
  input: string
  matches: boolean
  explanation: string
  groups?: string[]
}

export interface RegexTest {
  id: string
  pattern: string
  flags: string
  testString: string
  result: RegexTestResult
  timestamp: Date
}

export interface RegexTestResult {
  isValid: boolean
  matches: RegexMatch[]
  groups: string[]
  error?: string
  executionTime: number
  performance: RegexPerformance
}

export interface RegexMatch {
  match: string
  index: number
  groups: string[]
  namedGroups?: Record<string, string>
}

export interface RegexPerformance {
  steps: number
  backtracking: boolean
  complexity: 'linear' | 'polynomial' | 'exponential'
  recommendation?: string
}

export interface RegexCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  patterns: number
}

export interface RegexCheatsheet {
  id: string
  name: string
  description: string
  categories: RegexCategory[]
  patterns: RegexPattern[]
  createdAt: Date
  updatedAt: Date
}

// Enums
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml'
