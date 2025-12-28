// ==================== Regex Tester Types ====================

/**
 * Regex Match type
 */
export interface regexMatch {
  match: string,
  index: number,
  groups: string[],
  namedGroups: Record<string, string>,
  input: string,
  length: number,
}

/**
 * Regex Statistics type
 */
export interface regexStatistics {
  totalMatches: number,
  uniqueMatches: number,
  averageMatchLength: number,
  matchPositions: number[],
  captureGroups: number,
  namedGroups: string[],
  executionTime: number,
  textLength: number,
  coverage: number,
}

/**
 * Text File type
 */
export interface textFile {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  matches?: regexMatch[]
  statistics?: regexStatistics
}

/**
 * Regex Flags type
 */
export interface regexFlags {
  global: boolean,
  ignoreCase: boolean,
  multiline: boolean,
  dotAll: boolean,
  unicode: boolean,
  sticky: boolean,
}

/**
 * Regex Settings type
 */
export interface regexSettings {
  flags: regexFlags,
  highlightMatches: boolean,
  showCaptureGroups: boolean,
  showMatchPositions: boolean,
  maxMatches: number,
  timeout: number,
  enableReplacement: boolean,
  replacementText: string,
}

/**
 * Regex Pattern type
 */
export interface regexPattern {
  name: string,
  pattern: string,
  description: string,
  category: string,
  flags: string,
  example: string,
}

/**
 * Regex Test Result type
 */
export interface regexTestResult {
  isValid: boolean,
  matches: regexMatch[],
  statistics: regexStatistics
  error?: string
  replacementResult?: string
}

// ==================== Type Exports ====================

export type RegexMatch = regexMatch
export type RegexStatistics = regexStatistics
export type TextFile = textFile
export type RegexFlags = regexFlags
export type RegexSettings = regexSettings
export type RegexPattern = regexPattern
export type RegexTestResult = regexTestResult
