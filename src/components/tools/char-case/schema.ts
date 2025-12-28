import type React from "react"

// ==================== Char Case Types ====================

/**
 * Case Type type
 */
export type caseType = "uppercase" | "lowercase" | "titlecase" | "sentencecase" | "camelcase" | "pascalcase" | "snakecase" | "kebabcase" | "constantcase" | "dotcase" | "pathcase" | "togglecase"

/**
 * Conversion Result type
 */
export interface conversionResult {
  type: caseType,
  content: string,
  preview: string,
}

/**
 * Text File type
 */
export interface textFile {
  id: string,
  file: File,
  originalContent: string,
  convertedContent: string,
  name: string,
  size: number,
  type: string,
  status: "pending"| "processing" | "completed" | "error"
  error?: string
  conversions?: conversionResult[]
}

/**
 * Conversion Settings type
 */
export interface conversionSettings {
  preserveFormatting: boolean,
  handleSpecialChars: boolean,
  customDelimiter: string,
  batchMode: boolean,
  previewLength: number,
}

/**
 * Conversion Stats type
 */
export interface conversionStats {
  totalFiles: number,
  totalCharacters: number,
  totalWords: number,
  totalConversions: number,
  averageFileSize: number,
  processingTime: number,
}

/**
 * Case Option type
 */
export interface caseOption {
  value: caseType,
  name: string,
  description: string,
  example: string,
  icon: React.ReactNode,
}

// ==================== Type Exports ====================

export type CaseType = caseType
export type ConversionResult = conversionResult
export type TextFile = textFile
export type ConversionSettings = conversionSettings
export type ConversionStats = conversionStats
export type CaseOption = caseOption
