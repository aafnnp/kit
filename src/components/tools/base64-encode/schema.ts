// ==================== Base64 Encode Types ====================

/**
 * Encoding Operation type
 */
export type encodingOperation = "encode" | "decode"

/**
 * Encoding Format type
 */
export type encodingFormat = "text" | "base64" | "url" | "hex" | "binary"

/**
 * Export Format type
 */
export type exportFormat = "txt" | "json" | "csv"

/**
 * Encoding Metadata type
 */
export interface encodingMetadata {
  inputSize: number,
  outputSize: number,
  compressionRatio: number,
  processingTime: number,
  isValid: boolean,
  encoding: string,
}

/**
 * Encoding Result type
 */
export interface encodingResult {
  id: string,
  operation: encodingOperation,
  input: string,
  output: string,
  inputFormat: encodingFormat,
  outputFormat: encodingFormat,
  metadata: encodingMetadata,
}

/**
 * Encoding Statistics type
 */
export interface encodingStatistics {
  totalEncodings: number,
  operationDistribution: Record<string, number>,
  averageCompressionRatio: number,
  averageProcessingTime: number,
  successRate: number,
  processingTime: number,
}

/**
 * Encoding Settings type
 */
export interface encodingSettings {
  defaultOperation: encodingOperation,
  defaultFormat: encodingFormat,
  includeMetadata: boolean,
  optimizeOutput: boolean,
  exportFormat: exportFormat,
  chunkSize: number,
}

/**
 * Base64 File type
 */
export interface base64File {
  id: string,
  name: string,
  content: string,
  size: number,
  type: string,
  status: "pending" | "processing" | "completed" | "error"
  error?: string
  processedAt?: Date
  encodingData?: encodingMetadata,
  encodings?: encodingResult[],
  statistics?: encodingStatistics,
  settings?: encodingSettings,
}

/**
 * Encoding Template type
 */
export interface encodingTemplate {
  id: string,
  name: string,
  description: string,
  category: string,
  operation: encodingOperation,
  inputFormat: encodingFormat,
  outputFormat: encodingFormat,
  example: string,
}

// ==================== Type Exports ====================

/**
 * Type definitions
 */
export type EncodingOperation = encodingOperation
export type EncodingFormat = encodingFormat
export type ExportFormat = exportFormat
export type EncodingMetadata = encodingMetadata
export type EncodingResult = encodingResult
export type EncodingStatistics = encodingStatistics
export type EncodingSettings = encodingSettings
export type Base64File = base64File
export type EncodingData = encodingMetadata
export type EncodingTemplate = encodingTemplate
