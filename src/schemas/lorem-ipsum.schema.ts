import { z } from "zod"

// ==================== Lorem Ipsum Schemas ====================

/**
 * Text Style schema
 */
export const textStyleSchema = z.enum([
  "classic-latin",
  "modern-english",
  "tech-jargon",
  "business-formal",
  "creative-writing",
  "academic-paper",
  "casual-blog",
  "custom",
])

/**
 * Output Format schema
 */
export const outputFormatSchema = z.enum(["plain", "html", "markdown", "json"])

/**
 * Generated Text schema
 */
export const generatedTextSchema = z.object({
  id: z.string(),
  content: z.string(),
  format: outputFormatSchema,
  style: textStyleSchema,
  wordCount: z.number(),
  paragraphCount: z.number(),
  sentenceCount: z.number(),
  characterCount: z.number(),
  generatedAt: z.date(),
})

/**
 * Generation Settings schema
 */
export const generationSettingsSchema = z.object({
  textStyle: textStyleSchema,
  outputFormat: outputFormatSchema,
  paragraphCount: z.number(),
  sentencesPerParagraph: z.number(),
  wordsPerSentence: z.number(),
  includeTitle: z.boolean(),
  titleStyle: z.enum(["h1", "h2", "h3", "none"]),
  customWordList: z.array(z.string()),
  useCustomWords: z.boolean(),
  startWithLorem: z.boolean(),
  includeNumbers: z.boolean(),
  includePunctuation: z.boolean(),
})

/**
 * Generation Stats schema
 */
export const generationStatsSchema = z.object({
  totalGenerated: z.number(),
  totalWords: z.number(),
  totalCharacters: z.number(),
  averageWordsPerParagraph: z.number(),
  averageSentencesPerParagraph: z.number(),
  mostUsedStyle: textStyleSchema,
  generationTime: z.number(),
})

/**
 * Text Preset schema
 */
export const textPresetSchema = z.object({
  name: z.string(),
  description: z.string(),
  settings: generationSettingsSchema.partial(),
})

// ==================== Type Exports ====================

export type TextStyle = z.infer<typeof textStyleSchema>
export type OutputFormat = z.infer<typeof outputFormatSchema>
export type GeneratedText = z.infer<typeof generatedTextSchema>
export type GenerationSettings = z.infer<typeof generationSettingsSchema>
export type GenerationStats = z.infer<typeof generationStatsSchema>
export type TextPreset = z.infer<typeof textPresetSchema>
