// ==================== Code Formatter Types ====================

/**
 * Language type
 */
export type language = "javascript" | "typescript" | "css" | "html" | "json"

/**
 * Trailing Comma type
 */
export type trailingComma = "none" | "es5" | "all"

/**
 * Format Options type
 */
export interface formatOptions {
  parser: string,
  tabWidth: number,
  useTabs: boolean,
  semi: boolean,
  singleQuote: boolean,
  trailingComma: trailingComma,
  bracketSpacing: boolean,
  jsxBracketSameLine: boolean,
}

/**
 * Code Formatter State type
 */
export interface codeFormatterState {
  input: string,
  output: string,
  language: language,
  options: {
    tabWidth: number,
    useTabs: boolean,
    semicolons: boolean,
    singleQuote: boolean,
    trailingComma: trailingComma,
    bracketSpacing: boolean,
    jsxBracketSameLine: boolean,
  }
  isFormatting: boolean
  error?: string
}
/**
 * Language Config type
 */
export interface languageConfig {
  name: string,
  parser: string,
  example: string,
}

// ==================== Type Exports ====================

export type Language = language
export type TrailingComma = trailingComma
export type FormatOptions = formatOptions
export type CodeFormatterState = codeFormatterState
export type LanguageConfig = languageConfig

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
  display: "flex"
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
  "value": 123,
}`,
  }
}
