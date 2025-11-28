import { z } from "zod"

// ==================== Word Count Schemas ====================

/**
 * Text Analysis schema
 */
export const textAnalysisSchema = z.object({
  characters: z.number(),
  charactersNoSpaces: z.number(),
  words: z.number(),
  sentences: z.number(),
  paragraphs: z.number(),
  lines: z.number(),
  readingTime: z.number(),
  averageWordsPerSentence: z.number(),
  averageCharactersPerWord: z.number(),
  readabilityScore: z.number(),
  keywordFrequency: z.record(z.string(), z.number()),
  mostCommonWords: z.array(
    z.object({
      word: z.string(),
      count: z.number(),
    })
  ),
  longestWord: z.string(),
  shortestWord: z.string(),
})

/**
 * Text File schema
 */
export const textFileSchema = z.object({
  id: z.string(),
  file: z.instanceof(File),
  content: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
  status: z.enum(["pending", "processing", "completed", "error"]),
  error: z.string().optional(),
  analysis: textAnalysisSchema.optional(),
})

/**
 * Analysis Settings schema
 */
export const analysisSettingsSchema = z.object({
  includeSpaces: z.boolean(),
  countPunctuation: z.boolean(),
  wordsPerMinute: z.number(),
  minWordLength: z.number(),
  excludeCommonWords: z.boolean(),
  language: z.enum(["en", "zh", "auto"]),
})

/**
 * Analysis Stats schema
 */
export const analysisStatsSchema = z.object({
  totalFiles: z.number(),
  totalCharacters: z.number(),
  totalWords: z.number(),
  totalSentences: z.number(),
  totalParagraphs: z.number(),
  averageReadingTime: z.number(),
  averageReadabilityScore: z.number(),
})

// ==================== Type Exports ====================

export type TextAnalysis = z.infer<typeof textAnalysisSchema>
export type TextFile = z.infer<typeof textFileSchema>
export type AnalysisSettings = z.infer<typeof analysisSettingsSchema>
export type AnalysisStats = z.infer<typeof analysisStatsSchema>
