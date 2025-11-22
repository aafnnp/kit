import { z } from "zod"

// ==================== Code Formatter Schemas ====================

/**
 * Language schema
 */
export const languageSchema = z.enum(["javascript", "typescript", "css", "html", "json"])

/**
 * Trailing Comma schema
 */
export const trailingCommaSchema = z.enum(["none", "es5", "all"])

/**
 * Format Options schema
 */
export const formatOptionsSchema = z.object({
  parser: z.string(),
  tabWidth: z.number(),
  useTabs: z.boolean(),
  semi: z.boolean(),
  singleQuote: z.boolean(),
  trailingComma: trailingCommaSchema,
  bracketSpacing: z.boolean(),
  jsxBracketSameLine: z.boolean(),
})

/**
 * Code Formatter State schema
 */
export const codeFormatterStateSchema = z.object({
  input: z.string(),
  output: z.string(),
  language: languageSchema,
  options: z.object({
    tabWidth: z.number(),
    useTabs: z.boolean(),
    semicolons: z.boolean(),
    singleQuote: z.boolean(),
    trailingComma: trailingCommaSchema,
    bracketSpacing: z.boolean(),
    jsxBracketSameLine: z.boolean(),
  }),
  isFormatting: z.boolean(),
  error: z.string().nullable(),
})

/**
 * Language Config schema
 */
export const languageConfigSchema = z.object({
  name: z.string(),
  parser: z.string(),
  example: z.string(),
})

// ==================== Type Exports ====================

export type Language = z.infer<typeof languageSchema>
export type TrailingComma = z.infer<typeof trailingCommaSchema>
export type FormatOptions = z.infer<typeof formatOptionsSchema>
export type CodeFormatterState = z.infer<typeof codeFormatterStateSchema>
export type LanguageConfig = z.infer<typeof languageConfigSchema>

// ==================== Constants ====================

/**
 * Language configurations
 */
export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  javascript: {
    name: "JavaScript",
    parser: "babel",
    example: `function hello() {
  console.log("Hello, World!");
}`,
  },
  typescript: {
    name: "TypeScript",
    parser: "typescript",
    example: `function hello(): void {
  console.log("Hello, World!");
}`,
  },
  css: {
    name: "CSS",
    parser: "css",
    example: `.container {
  display: flex;
  justify-content: center;
}`,
  },
  html: {
    name: "HTML",
    parser: "html",
    example: `<div class="container">
  <h1>Hello, World!</h1>
</div>`,
  },
  json: {
    name: "JSON",
    parser: "json",
    example: `{
  "name": "example",
  "value": 123
}`,
  },
}
