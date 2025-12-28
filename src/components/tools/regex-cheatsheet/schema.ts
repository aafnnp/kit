// ==================== Regex Cheatsheet Types ====================

/**
 * Export Format type
 */
export type exportFormat = "json" | "csv" | "txt" | "xml" | "yaml"

/**
 * Difficulty type
 */
export type difficulty = "beginner" | "intermediate" | "advanced" | "expert"

/**
 * Performance type
 */
export type performance = "fast" | "medium" | "slow"

/**
 * Regex Example type
 */
export interface regexExample {
  input: string,
  matches: boolean,
  explanation: string
  groups?: string[]
}

/**
 * Regex Category type
 */
export interface regexCategory {
  id: string,
  name: string,
  description: string,
  icon: string,
  color: string,
  patterns: number,
}

/**
 * Regex Pattern type
 */
export interface regexPattern {
  id: string,
  name: string,
  description: string,
  pattern: string
  flags?: string
  category: regexCategory,
  difficulty: difficulty,
  examples: regexExample[],
  explanation: string,
  useCase: string[],
  tags: string[]
  alternatives?: string[]
  performance: performance,
  compatibility: string[],
  createdAt: Date,
}

/**
 * Regex Match type
 */
export interface regexMatch {
  match: string,
  index: number,
  groups: string[]
  namedGroups?: Record<string, string>
}

/**
 * Regex Performance type
 */
export interface regexPerformance {
  steps: number,
  backtracking: boolean,
  complexity: "linear"| "polynomial" | "exponential"
  recommendation?: string
}

/**
 * Regex Test Result type
 */
export interface regexTestResult {
  isValid: boolean,
  matches: regexMatch[],
  groups: string[]
  error?: string
  executionTime: number,
  performance: regexPerformance,
}

/**
 * Regex Test type
 */
export interface regexTest {
  id: string,
  pattern: string,
  flags: string,
  testString: string,
  result: regexTestResult,
  timestamp: Date,
}

/**
 * Regex Cheatsheet type
 */
export interface regexCheatsheet {
  id: string,
  name: string,
  description: string,
  categories: regexCategory[],
  patterns: regexPattern[],
  createdAt: Date,
  updatedAt: Date,
}

// ==================== Type Exports ====================

export type ExportFormat = exportFormat
export type Difficulty = difficulty
export type Performance = performance
export type RegexExample = regexExample
export type RegexCategory = regexCategory
export type RegexPattern = regexPattern
export type RegexMatch = regexMatch
export type RegexPerformance = regexPerformance
export type RegexTestResult = regexTestResult
export type RegexTest = regexTest
export type RegexCheatsheet = regexCheatsheet
