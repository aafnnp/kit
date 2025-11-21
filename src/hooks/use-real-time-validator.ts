import { useState, useCallback, useRef, useEffect } from "react"

// 验证规则类型
export type ValidationType = "json" | "xml" | "yaml" | "csv" | "email" | "url" | "regex" | "custom"

// 验证结果
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  suggestions: ValidationSuggestion[]
  metadata?: Record<string, any>
}

// 验证错误
export interface ValidationError {
  id: string
  message: string
  line?: number
  column?: number
  severity: "error" | "critical"
  code?: string
  context?: string
}

// 验证警告
export interface ValidationWarning {
  id: string
  message: string
  line?: number
  column?: number
  code?: string
  context?: string
}

// 验证建议
export interface ValidationSuggestion {
  id: string
  message: string
  fix?: string
  line?: number
  column?: number
}

// 验证配置
export interface ValidationConfig {
  type: ValidationType
  debounceMs?: number
  enableSuggestions?: boolean
  enableWarnings?: boolean
  strictMode?: boolean
  customValidator?: (value: string) => ValidationResult
  options?: Record<string, any>
}

// 验证统计
export interface ValidationStats {
  totalValidations: number
  successfulValidations: number
  failedValidations: number
  averageValidationTime: number
  lastValidationTime?: number
}

// 实时验证器 Hook
export function useRealTimeValidator(config: ValidationConfig) {
  const {
    type,
    debounceMs = 300,
    enableSuggestions = true,
    enableWarnings = true,
    strictMode = false,
    customValidator,
    options = {},
  } = config

  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
  })
  const [isValidating, setIsValidating] = useState(false)
  const [validationStats, setValidationStats] = useState<ValidationStats>({
    totalValidations: 0,
    successfulValidations: 0,
    failedValidations: 0,
    averageValidationTime: 0,
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const validationTimesRef = useRef<number[]>([])

  // 空值检查的公共逻辑
  const isEmptyValue = useCallback((value: string): boolean => {
    return !value.trim()
  }, [])

  // JSON 验证
  const validateJSON = useCallback(
    (value: string): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      const suggestions: ValidationSuggestion[] = []
      let metadata: Record<string, any> = {}

      if (isEmptyValue(value)) {
        return { isValid: true, errors, warnings, suggestions }
      }

      try {
        const parsed = JSON.parse(value)
        metadata = {
          type: Array.isArray(parsed) ? "array" : typeof parsed,
          size: JSON.stringify(parsed).length,
          keys: typeof parsed === "object" && parsed !== null ? Object.keys(parsed).length : 0,
        }

        // 检查常见问题
        if (strictMode) {
          // 检查尾随逗号
          if (value.match(/,\s*[}\]]/)) {
            warnings.push({
              id: "trailing-comma",
              message: "Trailing comma detected (not allowed in strict JSON)",
              code: "JSON_TRAILING_COMMA",
            })
          }

          // 检查单引号
          if (value.includes("'")) {
            warnings.push({
              id: "single-quotes",
              message: "Single quotes detected (use double quotes in JSON)",
              code: "JSON_SINGLE_QUOTES",
            })
          }
        }

        // 性能建议
        if (metadata.size > 1024 * 1024) {
          // 1MB
          suggestions.push({
            id: "large-json",
            message: "Large JSON detected. Consider pagination or compression.",
            fix: "Split into smaller chunks or use compression",
          })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Invalid JSON"
        const match = errorMessage.match(/position (\d+)/)
        const position = match ? parseInt(match[1]) : undefined

        let line: number | undefined
        let column: number | undefined

        if (position !== undefined) {
          const beforeError = value.substring(0, position)
          line = beforeError.split("\n").length
          column = beforeError.split("\n").pop()?.length || 0
        }

        errors.push({
          id: "json-parse-error",
          message: errorMessage,
          line,
          column,
          severity: "error",
          code: "JSON_PARSE_ERROR",
          context: position !== undefined ? value.substring(Math.max(0, position - 20), position + 20) : undefined,
        })

        // 提供修复建议
        if (errorMessage.includes("Unexpected token")) {
          suggestions.push({
            id: "syntax-fix",
            message: "Check for missing quotes, commas, or brackets",
            line,
            column,
          })
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: enableWarnings ? warnings : [],
        suggestions: enableSuggestions ? suggestions : [],
        metadata,
      }
    },
    [strictMode, enableWarnings, enableSuggestions, isEmptyValue]
  )

  // XML 验证
  const validateXML = useCallback(
    (value: string): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      const suggestions: ValidationSuggestion[] = []

      if (isEmptyValue(value)) {
        return { isValid: true, errors, warnings, suggestions }
      }

      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(value, "application/xml")
        const parseError = doc.querySelector("parsererror")

        if (parseError) {
          errors.push({
            id: "xml-parse-error",
            message: parseError.textContent || "XML parsing error",
            severity: "error",
            code: "XML_PARSE_ERROR",
          })
        } else {
          // 检查 XML 声明
          if (!value.trim().startsWith("<?xml")) {
            warnings.push({
              id: "missing-xml-declaration",
              message: "Missing XML declaration",
              code: "XML_NO_DECLARATION",
            })
          }

          // 检查根元素
          if (doc.documentElement.children.length === 0 && !doc.documentElement.textContent?.trim()) {
            warnings.push({
              id: "empty-root",
              message: "Root element is empty",
              code: "XML_EMPTY_ROOT",
            })
          }
        }
      } catch (error) {
        errors.push({
          id: "xml-error",
          message: error instanceof Error ? error.message : "XML validation error",
          severity: "error",
          code: "XML_ERROR",
        })
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: enableWarnings ? warnings : [],
        suggestions: enableSuggestions ? suggestions : [],
      }
    },
    [enableWarnings, enableSuggestions, isEmptyValue]
  )

  // YAML 验证（简化版）
  const validateYAML = useCallback(
    (value: string): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      const suggestions: ValidationSuggestion[] = []

      if (isEmptyValue(value)) {
        return { isValid: true, errors, warnings, suggestions }
      }

      // 基本 YAML 语法检查
      const lines = value.split("\n")

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineNumber = i + 1

        // 检查缩进
        const indent = line.match(/^\s*/)?.[0].length || 0
        if (line.trim() && indent % 2 !== 0) {
          warnings.push({
            id: `odd-indent-${lineNumber}`,
            message: "Odd number of spaces for indentation (use 2 or 4 spaces)",
            line: lineNumber,
            code: "YAML_ODD_INDENT",
          })
        }

        // 检查制表符
        if (line.includes("\t")) {
          errors.push({
            id: `tab-character-${lineNumber}`,
            message: "Tab characters are not allowed in YAML (use spaces)",
            line: lineNumber,
            severity: "error",
            code: "YAML_TAB_CHARACTER",
          })
        }

        // 检查键值对格式
        if (line.includes(":") && !line.trim().startsWith("#")) {
          const colonIndex = line.indexOf(":")
          const afterColon = line.substring(colonIndex + 1)
          if (afterColon && !afterColon.startsWith(" ")) {
            warnings.push({
              id: `no-space-after-colon-${lineNumber}`,
              message: "Add space after colon in key-value pairs",
              line: lineNumber,
              column: colonIndex + 1,
              code: "YAML_NO_SPACE_AFTER_COLON",
            })
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: enableWarnings ? warnings : [],
        suggestions: enableSuggestions ? suggestions : [],
      }
    },
    [enableWarnings, enableSuggestions, isEmptyValue]
  )

  // CSV 验证
  const validateCSV = useCallback(
    (value: string): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      const suggestions: ValidationSuggestion[] = []

      if (isEmptyValue(value)) {
        return { isValid: true, errors, warnings, suggestions }
      }

      const lines = value.split("\n").filter((line) => line.trim())
      if (lines.length === 0) {
        return { isValid: true, errors, warnings, suggestions }
      }

      const delimiter = options.delimiter || ","
      const firstRowColumns = lines[0].split(delimiter).length

      // 检查列数一致性
      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(delimiter).length
        if (columns !== firstRowColumns) {
          errors.push({
            id: `inconsistent-columns-${i + 1}`,
            message: `Row ${i + 1} has ${columns} columns, expected ${firstRowColumns}`,
            line: i + 1,
            severity: "error",
            code: "CSV_INCONSISTENT_COLUMNS",
          })
        }
      }

      // 检查空行
      const emptyLines = value
        .split("\n")
        .map((line, index) => ({ line, index: index + 1 }))
        .filter(({ line }) => !line.trim())

      if (emptyLines.length > 0) {
        warnings.push({
          id: "empty-lines",
          message: `Found ${emptyLines.length} empty lines`,
          code: "CSV_EMPTY_LINES",
        })
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: enableWarnings ? warnings : [],
        suggestions: enableSuggestions ? suggestions : [],
        metadata: {
          rows: lines.length,
          columns: firstRowColumns,
          delimiter,
        },
      }
    },
    [enableWarnings, enableSuggestions, options.delimiter, isEmptyValue]
  )

  // Email 验证
  const validateEmail = useCallback(
    (value: string): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      const suggestions: ValidationSuggestion[] = []

      if (isEmptyValue(value)) {
        return { isValid: true, errors, warnings, suggestions }
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      if (!emailRegex.test(value)) {
        errors.push({
          id: "invalid-email",
          message: "Invalid email format",
          severity: "error",
          code: "EMAIL_INVALID_FORMAT",
        })
      } else {
        // 检查常见问题
        if (value.includes("..")) {
          warnings.push({
            id: "consecutive-dots",
            message: "Consecutive dots in email address",
            code: "EMAIL_CONSECUTIVE_DOTS",
          })
        }

        if (value.startsWith(".") || value.endsWith(".")) {
          warnings.push({
            id: "leading-trailing-dot",
            message: "Email starts or ends with a dot",
            code: "EMAIL_LEADING_TRAILING_DOT",
          })
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: enableWarnings ? warnings : [],
        suggestions: enableSuggestions ? suggestions : [],
      }
    },
    [enableWarnings, enableSuggestions, isEmptyValue]
  )

  // URL 验证
  const validateURL = useCallback(
    (value: string): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      const suggestions: ValidationSuggestion[] = []

      if (isEmptyValue(value)) {
        return { isValid: true, errors, warnings, suggestions }
      }

      try {
        const url = new URL(value)

        // 检查协议
        if (!["http:", "https:", "ftp:", "ftps:"].includes(url.protocol)) {
          warnings.push({
            id: "unusual-protocol",
            message: `Unusual protocol: ${url.protocol}`,
            code: "URL_UNUSUAL_PROTOCOL",
          })
        }

        // 检查 localhost
        if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
          warnings.push({
            id: "localhost-url",
            message: "URL points to localhost",
            code: "URL_LOCALHOST",
          })
        }
      } catch (error) {
        errors.push({
          id: "invalid-url",
          message: "Invalid URL format",
          severity: "error",
          code: "URL_INVALID_FORMAT",
        })
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: enableWarnings ? warnings : [],
        suggestions: enableSuggestions ? suggestions : [],
      }
    },
    [enableWarnings, enableSuggestions, isEmptyValue]
  )

  // 正则表达式验证
  const validateRegex = useCallback(
    (value: string): ValidationResult => {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []
      const suggestions: ValidationSuggestion[] = []

      if (isEmptyValue(value)) {
        return { isValid: true, errors, warnings, suggestions }
      }

      const pattern = options.pattern as string
      const flags = (options.flags as string) || ""

      if (!pattern) {
        errors.push({
          id: "no-pattern",
          message: "No regex pattern provided",
          severity: "error",
          code: "REGEX_NO_PATTERN",
        })
        return { isValid: false, errors, warnings, suggestions }
      }

      try {
        const regex = new RegExp(pattern, flags)

        if (!regex.test(value)) {
          errors.push({
            id: "pattern-mismatch",
            message: "Value does not match the required pattern",
            severity: "error",
            code: "REGEX_PATTERN_MISMATCH",
          })
        }
      } catch (error) {
        errors.push({
          id: "invalid-regex",
          message: "Invalid regular expression pattern",
          severity: "error",
          code: "REGEX_INVALID_PATTERN",
        })
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings: enableWarnings ? warnings : [],
        suggestions: enableSuggestions ? suggestions : [],
      }
    },
    [enableWarnings, enableSuggestions, options.pattern, options.flags]
  )

  // 主验证函数
  const validate = useCallback(
    (value: string): ValidationResult => {
      const startTime = Date.now()

      let result: ValidationResult

      switch (type) {
        case "json":
          result = validateJSON(value)
          break
        case "xml":
          result = validateXML(value)
          break
        case "yaml":
          result = validateYAML(value)
          break
        case "csv":
          result = validateCSV(value)
          break
        case "email":
          result = validateEmail(value)
          break
        case "url":
          result = validateURL(value)
          break
        case "regex":
          result = validateRegex(value)
          break
        case "custom":
          result = customValidator
            ? customValidator(value)
            : { isValid: true, errors: [], warnings: [], suggestions: [] }
          break
        default:
          result = { isValid: true, errors: [], warnings: [], suggestions: [] }
      }

      const validationTime = Date.now() - startTime

      // 更新统计
      setValidationStats((prev) => {
        const newTimes = [...validationTimesRef.current, validationTime].slice(-100) // 保留最近 100 次
        validationTimesRef.current = newTimes

        return {
          totalValidations: prev.totalValidations + 1,
          successfulValidations: prev.successfulValidations + (result.isValid ? 1 : 0),
          failedValidations: prev.failedValidations + (result.isValid ? 0 : 1),
          averageValidationTime: newTimes.reduce((sum, time) => sum + time, 0) / newTimes.length,
          lastValidationTime: validationTime,
        }
      })

      return result
    },
    [
      type,
      validateJSON,
      validateXML,
      validateYAML,
      validateCSV,
      validateEmail,
      validateURL,
      validateRegex,
      customValidator,
    ]
  )

  // 防抖验证
  const debouncedValidate = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      setIsValidating(true)

      debounceRef.current = setTimeout(() => {
        const result = validate(value)
        setValidationResult(result)
        setIsValidating(false)
      }, debounceMs)
    },
    [validate, debounceMs]
  )

  // 立即验证
  const validateNow = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      setIsValidating(true)
      const result = validate(value)
      setValidationResult(result)
      setIsValidating(false)

      return result
    },
    [validate]
  )

  // 清除验证结果
  const clearValidation = useCallback(() => {
    setValidationResult({
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    })
    setIsValidating(false)
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return {
    // 状态
    validationResult,
    isValidating,
    validationStats,

    // 操作
    validate: debouncedValidate,
    validateNow,
    clearValidation,

    // 配置
    config: {
      type,
      debounceMs,
      enableSuggestions,
      enableWarnings,
      strictMode,
    },
  }
}

// 专用的 JSON 验证器 Hook
export function useJSONValidator(options?: {
  debounceMs?: number
  strictMode?: boolean
  enableSuggestions?: boolean
  enableWarnings?: boolean
}) {
  return useRealTimeValidator({
    type: "json",
    ...options,
  })
}

// 专用的 XML 验证器 Hook
export function useXMLValidator(options?: {
  debounceMs?: number
  enableSuggestions?: boolean
  enableWarnings?: boolean
}) {
  return useRealTimeValidator({
    type: "xml",
    ...options,
  })
}

// 专用的 Email 验证器 Hook
export function useEmailValidator(options?: {
  debounceMs?: number
  enableSuggestions?: boolean
  enableWarnings?: boolean
}) {
  return useRealTimeValidator({
    type: "email",
    ...options,
  })
}
