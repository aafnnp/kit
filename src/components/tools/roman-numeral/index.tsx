import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Settings,
  BookOpen,
  Eye,
  Globe,
  Clock,
  BarChart3,
  Type,
  Calculator,
  Equal,
  ArrowUpDown,
  ArrowLeftRight,
  Scroll,
  History,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  RomanConversion,
  ConversionMetadata,
  RomanAnalysis,
  RomanBreakdown,
  HistoricalContext,
  MathematicalProperty,
  RomanSymbol,
  RomanTemplate,
  ConversionValidation,
  ExportFormat,
} from "@/schemas/roman-numeral.schema"
// Utility functions

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num)
}

// Roman numeral data and constants
const ROMAN_SYMBOLS: RomanSymbol[] = [
  {
    symbol: "I",
    value: 1,
    name: "Unus",
    origin: "One finger or tally mark",
    modernUsage: ["Clock faces", "Book chapters", "Movie sequels"],
  },
  {
    symbol: "V",
    value: 5,
    name: "Quinque",
    origin: "Open hand (5 fingers)",
    modernUsage: ["Clock faces", "Outline numbering", "Super Bowl"],
  },
  {
    symbol: "X",
    value: 10,
    name: "Decem",
    origin: "Two hands crossed",
    modernUsage: ["Clock faces", "Decades", "Roman numerals in names"],
  },
  {
    symbol: "L",
    value: 50,
    name: "Quinquaginta",
    origin: "Half of C (centum)",
    modernUsage: ["Formal documents", "Anniversary years"],
  },
  {
    symbol: "C",
    value: 100,
    name: "Centum",
    origin: "First letter of centum (hundred)",
    modernUsage: ["Century markers", "Copyright dates"],
  },
  {
    symbol: "D",
    value: 500,
    name: "Quingenti",
    origin: "Half of M or Φ symbol",
    modernUsage: ["Formal numbering", "Historical dates"],
  },
  {
    symbol: "M",
    value: 1000,
    name: "Mille",
    origin: "First letter of mille (thousand)",
    modernUsage: ["Year dates", "Millennium markers", "Formal documents"],
  },
]

const CONVERSION_MAP = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
] as const

const ROMAN_TO_ARABIC_MAP: Record<string, number> = {
  M: 1000,
  CM: 900,
  D: 500,
  CD: 400,
  C: 100,
  XC: 90,
  L: 50,
  XL: 40,
  X: 10,
  IX: 9,
  V: 5,
  IV: 4,
  I: 1,
}

// Enhanced conversion functions
const toRoman = (num: number): string => {
  if (num <= 0 || num >= 4000) {
    throw new Error("Number must be between 1 and 3999")
  }

  let result = ""
  let remaining = num

  for (const [value, symbol] of CONVERSION_MAP) {
    while (remaining >= value) {
      result += symbol
      remaining -= value
    }
  }

  return result
}

const fromRoman = (roman: string): number => {
  if (!roman || typeof roman !== "string") {
    throw new Error("Invalid Roman numeral input")
  }

  const cleanRoman = roman.toUpperCase().trim()
  if (!isValidRomanNumeral(cleanRoman)) {
    throw new Error("Invalid Roman numeral format")
  }

  let result = 0
  let i = 0

  while (i < cleanRoman.length) {
    // Check for two-character combinations first
    if (i + 1 < cleanRoman.length) {
      const twoChar = cleanRoman.slice(i, i + 2)
      if (ROMAN_TO_ARABIC_MAP[twoChar]) {
        result += ROMAN_TO_ARABIC_MAP[twoChar]
        i += 2
        continue
      }
    }

    // Single character
    const oneChar = cleanRoman[i]
    if (ROMAN_TO_ARABIC_MAP[oneChar]) {
      result += ROMAN_TO_ARABIC_MAP[oneChar]
      i += 1
    } else {
      throw new Error(`Invalid Roman numeral character: ${oneChar}`)
    }
  }

  return result
}

const isValidRomanNumeral = (roman: string): boolean => {
  if (!roman) return false

  // Check for valid characters only
  const validChars = /^[IVXLCDM]+$/
  if (!validChars.test(roman)) return false

  // Check for invalid patterns
  const invalidPatterns = [
    /IIII/,
    /VV/,
    /XXXX/,
    /LL/,
    /CCCC/,
    /DD/,
    /MMMM/, // Too many repetitions
    /VX/,
    /VL/,
    /VC/,
    /VD/,
    /VM/, // Invalid V combinations
    /LC/,
    /LD/,
    /LM/, // Invalid L combinations
    /DM/, // Invalid D combinations
    /IL/,
    /IC/,
    /ID/,
    /IM/, // Invalid I combinations (should use IV, IX)
    /XD/,
    /XM/, // Invalid X combinations (should use XL, XC)
  ]

  return !invalidPatterns.some((pattern) => pattern.test(roman))
}

// Analysis functions
const analyzeRomanNumeral = (arabic: number, roman: string): RomanAnalysis => {
  const breakdown = generateRomanBreakdown(roman)
  const historicalContext = getHistoricalContext(arabic)
  const mathematicalProperties = getMathematicalProperties(arabic)
  const educationalNotes = getEducationalNotes(arabic, roman)
  const commonUsages = getCommonUsages(arabic)

  return {
    breakdown,
    historicalContext,
    mathematicalProperties,
    educationalNotes,
    commonUsages,
  }
}

const generateRomanBreakdown = (roman: string): RomanBreakdown[] => {
  const breakdown: RomanBreakdown[] = []
  let position = 0

  for (let i = 0; i < roman.length; i++) {
    // Check for two-character combinations
    if (i + 1 < roman.length) {
      const twoChar = roman.slice(i, i + 2)
      if (ROMAN_TO_ARABIC_MAP[twoChar]) {
        breakdown.push({
          symbol: twoChar,
          value: ROMAN_TO_ARABIC_MAP[twoChar],
          count: 1,
          position: position++,
          type: "subtractive",
          explanation: `${twoChar} represents ${ROMAN_TO_ARABIC_MAP[twoChar]} using subtractive notation`,
        })
        i++ // Skip next character
        continue
      }
    }

    // Single character
    const oneChar = roman[i]
    if (ROMAN_TO_ARABIC_MAP[oneChar]) {
      const existingIndex = breakdown.findIndex((b) => b.symbol === oneChar && b.type === "additive")
      if (existingIndex >= 0) {
        breakdown[existingIndex].count++
      } else {
        breakdown.push({
          symbol: oneChar,
          value: ROMAN_TO_ARABIC_MAP[oneChar],
          count: 1,
          position: position++,
          type: "additive",
          explanation: `${oneChar} represents ${ROMAN_TO_ARABIC_MAP[oneChar]} in standard notation`,
        })
      }
    }
  }

  return breakdown
}

const getHistoricalContext = (number: number): HistoricalContext => {
  if (number <= 10) {
    return {
      period: "Ancient Rome (753 BC - 476 AD)",
      usage: "Basic counting and daily commerce",
      significance: "Fundamental numbers used in everyday Roman life",
      modernApplications: ["Clock faces", "Basic enumeration", "Simple lists"],
    }
  } else if (number <= 100) {
    return {
      period: "Roman Republic (509 BC - 27 BC)",
      usage: "Trade, military organization, and civic records",
      significance: "Numbers used for organizing legions and commercial transactions",
      modernApplications: ["Chapter numbering", "Outline systems", "Anniversary years"],
    }
  } else if (number <= 1000) {
    return {
      period: "Roman Empire (27 BC - 476 AD)",
      usage: "Imperial records, large-scale construction, and administration",
      significance: "Numbers representing significant imperial projects and populations",
      modernApplications: ["Year dates", "Formal documents", "Monument inscriptions"],
    }
  } else {
    return {
      period: "Late Roman Empire (284 AD - 476 AD)",
      usage: "Complex administrative records and large-scale imperial projects",
      significance: "Numbers representing the vast scale of the Roman Empire",
      modernApplications: ["Millennium markers", "Historical dates", "Formal ceremonies"],
    }
  }
}

const getMathematicalProperties = (number: number): MathematicalProperty[] => {
  const properties: MathematicalProperty[] = []

  // Basic properties
  properties.push({
    name: "Even/Odd",
    value: number % 2 === 0 ? "Even" : "Odd",
    description: `${number} is ${number % 2 === 0 ? "an even" : "an odd"} number`,
    category: "number-theory",
  })

  // Prime check
  const isPrime =
    number > 1 && Array.from({ length: Math.sqrt(number) }, (_, i) => i + 2).every((divisor) => number % divisor !== 0)
  properties.push({
    name: "Prime",
    value: isPrime,
    description: `${number} is ${isPrime ? "a prime" : "not a prime"} number`,
    category: "number-theory",
  })

  // Perfect square
  const sqrt = Math.sqrt(number)
  const isPerfectSquare = sqrt === Math.floor(sqrt)
  properties.push({
    name: "Perfect Square",
    value: isPerfectSquare,
    description: `${number} is ${isPerfectSquare ? "a perfect square" : "not a perfect square"}${isPerfectSquare ? ` (${sqrt}²)` : ""}`,
    category: "arithmetic",
  })

  // Fibonacci check
  const isFibonacci = checkFibonacci(number)
  properties.push({
    name: "Fibonacci",
    value: isFibonacci,
    description: `${number} is ${isFibonacci ? "a Fibonacci" : "not a Fibonacci"} number`,
    category: "number-theory",
  })

  // Roman representation complexity
  const roman = toRoman(number)
  properties.push({
    name: "Roman Length",
    value: roman.length,
    description: `Requires ${roman.length} character${roman.length !== 1 ? "s" : ""} in Roman notation`,
    category: "representation",
  })

  return properties
}

const checkFibonacci = (n: number): boolean => {
  if (n <= 0) return false
  let a = 0,
    b = 1
  while (b < n) {
    ;[a, b] = [b, a + b]
  }
  return b === n || n === 1
}

const getEducationalNotes = (arabic: number, roman: string): string[] => {
  const notes: string[] = []

  // Basic conversion note
  notes.push(`${arabic} converts to ${roman} in Roman numerals`)

  // Subtractive notation
  if (
    roman.includes("IV") ||
    roman.includes("IX") ||
    roman.includes("XL") ||
    roman.includes("XC") ||
    roman.includes("CD") ||
    roman.includes("CM")
  ) {
    notes.push("This number uses subtractive notation, where a smaller numeral before a larger one means subtraction")
  }

  // Length efficiency
  if (roman.length > 5) {
    notes.push("This Roman numeral is relatively long, showing why Arabic numerals became preferred for calculations")
  }

  // Historical significance
  if (arabic === 1) notes.push("I is the simplest Roman numeral, representing unity")
  if (arabic === 5) notes.push("V represents an open hand with five fingers")
  if (arabic === 10) notes.push("X represents two hands crossed, symbolizing ten fingers")
  if (arabic === 50) notes.push("L originally came from a symbol representing half of C (100)")
  if (arabic === 100) notes.push('C comes from the Latin word "centum" meaning hundred')
  if (arabic === 500) notes.push("D represents half of the original symbol for 1000")
  if (arabic === 1000) notes.push('M comes from the Latin word "mille" meaning thousand')

  return notes
}

const getCommonUsages = (number: number): string[] => {
  const usages: string[] = []

  if (number <= 12) {
    usages.push("Clock faces and time notation")
  }

  if (number <= 50) {
    usages.push("Chapter and section numbering")
    usages.push("Outline and list enumeration")
  }

  if (number >= 1900 && number <= 2100) {
    usages.push("Year dates in formal documents")
    usages.push("Copyright notices")
    usages.push("Movie and book publication dates")
  }

  if (number % 25 === 0 || number % 50 === 0) {
    usages.push("Anniversary and milestone years")
  }

  if ([1, 2, 3, 4, 5].includes(number)) {
    usages.push("Movie sequels and series numbering")
    usages.push("Royal and papal names")
  }

  usages.push("Formal and ceremonial contexts")
  usages.push("Historical and classical references")

  return usages
}

// Validation functions
const validateConversion = (input: string | number, type: "arabic" | "roman"): ConversionValidation => {
  const validation: ConversionValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  if (type === "arabic") {
    const num = typeof input === "number" ? input : parseInt(input as string)

    if (isNaN(num)) {
      validation.isValid = false
      validation.errors.push({
        message: "Input must be a valid number",
        type: "format",
        severity: "error",
      })
      validation.qualityScore -= 50
    } else {
      if (num <= 0) {
        validation.isValid = false
        validation.errors.push({
          message: "Number must be positive (greater than 0)",
          type: "range",
          severity: "error",
        })
        validation.qualityScore -= 40
      }

      if (num >= 4000) {
        validation.isValid = false
        validation.errors.push({
          message: "Number must be less than 4000 (Roman numeral limitation)",
          type: "range",
          severity: "error",
        })
        validation.qualityScore -= 40
      }

      if (num > 3000) {
        validation.warnings.push("Very large numbers in Roman numerals become quite long")
        validation.qualityScore -= 10
      }
    }
  } else {
    const roman = (input as string).toUpperCase().trim()

    if (!roman) {
      validation.isValid = false
      validation.errors.push({
        message: "Roman numeral cannot be empty",
        type: "format",
        severity: "error",
      })
      validation.qualityScore -= 50
    } else {
      if (!isValidRomanNumeral(roman)) {
        validation.isValid = false
        validation.errors.push({
          message: "Invalid Roman numeral format",
          type: "syntax",
          severity: "error",
        })
        validation.qualityScore -= 40
      }

      if (roman.length > 15) {
        validation.warnings.push("Very long Roman numeral - consider if this is correct")
        validation.qualityScore -= 15
      }
    }
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push("Perfect input for Roman numeral conversion")
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push("Good input with minor considerations")
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push("Input needs improvement")
  } else {
    validation.suggestions.push("Input has significant issues")
  }

  return validation
}

// Roman numeral templates
const romanTemplates: RomanTemplate[] = [
  {
    id: "basic-numbers",
    name: "Basic Numbers (1-10)",
    description: "Fundamental Roman numerals for learning",
    category: "Educational",
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    useCase: ["Learning", "Basic education", "Clock reading"],
    difficulty: "simple",
  },
  {
    id: "clock-numbers",
    name: "Clock Numbers (1-12)",
    description: "Roman numerals commonly found on clock faces",
    category: "Practical",
    numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    useCase: ["Clock faces", "Time notation", "Watch design"],
    difficulty: "simple",
  },
  {
    id: "significant-years",
    name: "Significant Years",
    description: "Important historical years in Roman numerals",
    category: "Historical",
    numbers: [1776, 1969, 2000, 2024],
    useCase: ["Historical dates", "Monuments", "Formal documents"],
    difficulty: "medium",
    historicalSignificance: "Years marking important historical events",
  },
  {
    id: "round-numbers",
    name: "Round Numbers",
    description: "Common round numbers and milestones",
    category: "Practical",
    numbers: [10, 25, 50, 100, 250, 500, 1000],
    useCase: ["Anniversaries", "Milestones", "Formal numbering"],
    difficulty: "medium",
  },
  {
    id: "subtractive-examples",
    name: "Subtractive Notation",
    description: "Examples demonstrating subtractive Roman numeral rules",
    category: "Educational",
    numbers: [4, 9, 14, 19, 40, 90, 400, 900],
    useCase: ["Learning subtractive rules", "Advanced education"],
    difficulty: "medium",
  },
  {
    id: "movie-sequels",
    name: "Movie Sequels",
    description: "Roman numerals commonly used in movie titles",
    category: "Popular Culture",
    numbers: [2, 3, 4, 5, 6],
    useCase: ["Movie titles", "Series numbering", "Entertainment"],
    difficulty: "simple",
  },
  {
    id: "super-bowl",
    name: "Super Bowl Numbers",
    description: "Recent Super Bowl Roman numerals",
    category: "Sports",
    numbers: [50, 51, 52, 53, 54, 55, 56, 57, 58],
    useCase: ["Sports events", "Annual numbering", "Broadcasting"],
    difficulty: "medium",
  },
  {
    id: "complex-numbers",
    name: "Complex Numbers",
    description: "Large numbers demonstrating Roman numeral complexity",
    category: "Advanced",
    numbers: [1984, 2023, 3999, 3888, 2749],
    useCase: ["Advanced learning", "Historical analysis", "Academic study"],
    difficulty: "complex",
  },
]

// Custom hooks
const useRomanConversion = () => {
  const [conversions, setConversions] = useState<RomanConversion[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const performConversion = useCallback(
    async (input: string | number, type: "arabic-to-roman" | "roman-to-arabic"): Promise<RomanConversion> => {
      setIsProcessing(true)
      const startTime = performance.now()

      try {
        let arabicNumber: number
        let romanNumeral: string

        if (type === "arabic-to-roman") {
          arabicNumber = typeof input === "number" ? input : parseInt(input as string)
          romanNumeral = toRoman(arabicNumber)
        } else {
          romanNumeral = (input as string).toUpperCase().trim()
          arabicNumber = fromRoman(romanNumeral)
        }

        const endTime = performance.now()
        const conversionTime = endTime - startTime

        // Generate metadata
        const hasSubtractiveCases =
          romanNumeral.includes("IV") ||
          romanNumeral.includes("IX") ||
          romanNumeral.includes("XL") ||
          romanNumeral.includes("XC") ||
          romanNumeral.includes("CD") ||
          romanNumeral.includes("CM")

        const romanSymbols = ROMAN_SYMBOLS.filter((symbol) => romanNumeral.includes(symbol.symbol))

        const metadata: ConversionMetadata = {
          conversionTime,
          complexity: romanNumeral.length + (hasSubtractiveCases ? 2 : 0),
          romanLength: romanNumeral.length,
          digitCount: arabicNumber.toString().length,
          isValid: true,
          hasSubtractiveCases,
          romanSymbols,
        }

        // Generate analysis
        const analysis = analyzeRomanNumeral(arabicNumber, romanNumeral)

        const conversion: RomanConversion = {
          id: nanoid(),
          arabicNumber,
          romanNumeral,
          conversionType: type,
          metadata,
          analysis,
          timestamp: new Date(),
        }

        setConversions((prev) => [conversion, ...prev.slice(0, 99)]) // Keep last 100 conversions
        return conversion
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearConversions = useCallback(() => {
    setConversions([])
  }, [])

  const removeConversion = useCallback((id: string) => {
    setConversions((prev) => prev.filter((conversion) => conversion.id !== id))
  }, [])

  return {
    conversions,
    isProcessing,
    performConversion,
    clearConversions,
    removeConversion,
  }
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || "text")
      toast.success(`${label || "Text"} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }, [])

  return { copyToClipboard, copiedText }
}

// Export functionality
const useRomanExport = () => {
  const exportConversion = useCallback((conversion: RomanConversion, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        content = JSON.stringify(conversion, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = generateCSVFromConversion(conversion)
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "txt":
        content = generateTextFromConversion(conversion)
        mimeType = "text/plain"
        extension = ".txt"
        break
      case "xml":
        content = generateXMLFromConversion(conversion)
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "html":
        content = generateHTMLFromConversion(conversion)
        mimeType = "text/html"
        extension = ".html"
        break
      default:
        content = generateTextFromConversion(conversion)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `roman-conversion-${conversion.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportConversion }
}

// Helper functions for export formats
const generateCSVFromConversion = (conversion: RomanConversion): string => {
  const headers = ["Property", "Value"]
  const rows = [
    ["Arabic Number", conversion.arabicNumber.toString()],
    ["Roman Numeral", conversion.romanNumeral],
    ["Conversion Type", conversion.conversionType],
    ["Conversion Time (ms)", conversion.metadata.conversionTime.toFixed(2)],
    ["Roman Length", conversion.metadata.romanLength.toString()],
    ["Complexity", conversion.metadata.complexity.toString()],
    ["Has Subtractive Cases", conversion.metadata.hasSubtractiveCases.toString()],
    ["Historical Period", conversion.analysis.historicalContext.period],
    ["Common Usage", conversion.analysis.historicalContext.usage],
    ["Timestamp", conversion.timestamp.toISOString()],
  ]

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
}

const generateTextFromConversion = (conversion: RomanConversion): string => {
  return `Roman Numeral Conversion Report - ${conversion.timestamp.toLocaleString()}

=== CONVERSION ===
Arabic Number: ${formatNumber(conversion.arabicNumber)}
Roman Numeral: ${conversion.romanNumeral}
Conversion Type: ${conversion.conversionType.replace("-", " to ").toUpperCase()}

=== ANALYSIS ===
Roman Length: ${conversion.metadata.romanLength} characters
Complexity Score: ${conversion.metadata.complexity}
Has Subtractive Notation: ${conversion.metadata.hasSubtractiveCases ? "Yes" : "No"}
Conversion Time: ${conversion.metadata.conversionTime.toFixed(2)} ms

=== BREAKDOWN ===
${conversion.analysis.breakdown.map((b) => `${b.symbol} = ${b.value} (${b.type}, count: ${b.count})`).join("\n")}

=== HISTORICAL CONTEXT ===
Period: ${conversion.analysis.historicalContext.period}
Usage: ${conversion.analysis.historicalContext.usage}
Significance: ${conversion.analysis.historicalContext.significance}

=== MATHEMATICAL PROPERTIES ===
${conversion.analysis.mathematicalProperties.map((p) => `${p.name}: ${p.value} - ${p.description}`).join("\n")}

=== EDUCATIONAL NOTES ===
${conversion.analysis.educationalNotes.join("\n")}

=== COMMON USAGES ===
${conversion.analysis.commonUsages.join("\n")}`
}

const generateXMLFromConversion = (conversion: RomanConversion): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<romanConversion id="${conversion.id}" timestamp="${conversion.timestamp.toISOString()}">
  <conversion>
    <arabicNumber>${conversion.arabicNumber}</arabicNumber>
    <romanNumeral>${conversion.romanNumeral}</romanNumeral>
    <type>${conversion.conversionType}</type>
  </conversion>
  <metadata>
    <conversionTime>${conversion.metadata.conversionTime}</conversionTime>
    <complexity>${conversion.metadata.complexity}</complexity>
    <romanLength>${conversion.metadata.romanLength}</romanLength>
    <hasSubtractiveCases>${conversion.metadata.hasSubtractiveCases}</hasSubtractiveCases>
  </metadata>
  <analysis>
    <historicalContext>
      <period>${conversion.analysis.historicalContext.period}</period>
      <usage>${conversion.analysis.historicalContext.usage}</usage>
      <significance>${conversion.analysis.historicalContext.significance}</significance>
    </historicalContext>
    <breakdown>
      ${conversion.analysis.breakdown
        .map((b) => `<symbol value="${b.value}" type="${b.type}" count="${b.count}">${b.symbol}</symbol>`)
        .join("\n      ")}
    </breakdown>
  </analysis>
</romanConversion>`
}

const generateHTMLFromConversion = (conversion: RomanConversion): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roman Numeral Conversion: ${conversion.arabicNumber} = ${conversion.romanNumeral}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .conversion { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .breakdown { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .symbol { background: white; padding: 10px; border-radius: 4px; text-align: center; }
    .properties { list-style: none; padding: 0; }
    .properties li { background: #f9f9f9; margin: 5px 0; padding: 10px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Roman Numeral Conversion Report</h1>
  <p><em>Generated on ${conversion.timestamp.toLocaleString()}</em></p>

  <div class="conversion">
    <h2>${formatNumber(conversion.arabicNumber)} = ${conversion.romanNumeral}</h2>
    <p><strong>Conversion Type:</strong> ${conversion.conversionType.replace("-", " to ").toUpperCase()}</p>
    <p><strong>Roman Length:</strong> ${conversion.metadata.romanLength} characters</p>
    <p><strong>Complexity:</strong> ${conversion.metadata.complexity}</p>
  </div>

  <h3>Symbol Breakdown</h3>
  <div class="breakdown">
    ${conversion.analysis.breakdown
      .map(
        (b) =>
          `<div class="symbol">
        <strong>${b.symbol}</strong><br>
        Value: ${b.value}<br>
        Type: ${b.type}<br>
        Count: ${b.count}
      </div>`
      )
      .join("")}
  </div>

  <h3>Historical Context</h3>
  <p><strong>Period:</strong> ${conversion.analysis.historicalContext.period}</p>
  <p><strong>Usage:</strong> ${conversion.analysis.historicalContext.usage}</p>
  <p><strong>Significance:</strong> ${conversion.analysis.historicalContext.significance}</p>

  <h3>Mathematical Properties</h3>
  <ul class="properties">
    ${conversion.analysis.mathematicalProperties
      .map((p) => `<li><strong>${p.name}:</strong> ${p.value} - ${p.description}</li>`)
      .join("")}
  </ul>

  <h3>Educational Notes</h3>
  <ul>
    ${conversion.analysis.educationalNotes.map((note) => `<li>${note}</li>`).join("")}
  </ul>
</body>
</html>`
}

/**
 * Enhanced Roman Numeral & Classical Number System Tool
 * Features: Advanced conversion, historical context, educational content, and comprehensive analysis
 */
const RomanNumeralCore = () => {
  const [activeTab, setActiveTab] = useState<"converter" | "analysis" | "history" | "templates" | "settings">(
    "converter"
  )
  const [arabicInput, setArabicInput] = useState<string>("1")
  const [romanInput, setRomanInput] = useState<string>("I")
  const [currentConversion, setCurrentConversion] = useState<RomanConversion | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [conversionMode, setConversionMode] = useState<"arabic-to-roman" | "roman-to-arabic">("arabic-to-roman")

  const { conversions, isProcessing, performConversion, clearConversions, removeConversion } = useRomanConversion()
  const { exportConversion } = useRomanExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = romanTemplates.find((t) => t.id === templateId)
    if (template && template.numbers.length > 0) {
      const randomNumber = template.numbers[Math.floor(Math.random() * template.numbers.length)]
      setArabicInput(randomNumber.toString())
      setRomanInput(toRoman(randomNumber))
      setConversionMode("arabic-to-roman")
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Perform conversion
  const handleConvert = useCallback(
    async (type?: "arabic-to-roman" | "roman-to-arabic") => {
      const conversionType = type || conversionMode
      const input = conversionType === "arabic-to-roman" ? arabicInput : romanInput

      const validation = validateConversion(input, conversionType === "arabic-to-roman" ? "arabic" : "roman")
      if (!validation.isValid) {
        toast.error(`Conversion error: ${validation.errors[0]?.message}`)
        return
      }

      try {
        const conversion = await performConversion(input, conversionType)
        setCurrentConversion(conversion)

        // Update the other input field
        if (conversionType === "arabic-to-roman") {
          setRomanInput(conversion.romanNumeral)
        } else {
          setArabicInput(conversion.arabicNumber.toString())
        }

        toast.success(`Converted successfully: ${conversion.arabicNumber} = ${conversion.romanNumeral}`)
      } catch (error: any) {
        toast.error(`Conversion failed: ${error?.message}`)
        console.error(error)
      }
    },
    [arabicInput, romanInput, conversionMode, performConversion]
  )

  // Handle input changes with auto-conversion
  const handleArabicChange = useCallback(
    (value: string) => {
      setArabicInput(value)
      setConversionMode("arabic-to-roman")

      if (value && !isNaN(parseInt(value))) {
        const timer = setTimeout(() => {
          handleConvert("arabic-to-roman")
        }, 500)

        return () => clearTimeout(timer)
      }
    },
    [handleConvert]
  )

  const handleRomanChange = useCallback(
    (value: string) => {
      setRomanInput(value.toUpperCase())
      setConversionMode("roman-to-arabic")

      if (value.trim()) {
        const timer = setTimeout(() => {
          handleConvert("roman-to-arabic")
        }, 500)

        return () => clearTimeout(timer)
      }
    },
    [handleConvert]
  )

  // Swap conversion direction
  const handleSwapMode = useCallback(() => {
    setConversionMode((prev) => (prev === "arabic-to-roman" ? "roman-to-arabic" : "arabic-to-roman"))
    toast.success("Conversion direction swapped")
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div
        id="main-content"
        className="flex flex-col gap-4"
      >
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scroll className="h-5 w-5" />
              Roman Numeral & Classical Number System Tool
            </CardTitle>
            <CardDescription>
              Advanced Roman numeral converter with historical context, educational content, and comprehensive analysis.
              Convert between Arabic numbers and Roman numerals with detailed explanations and mathematical insights.
              Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="converter"
              className="flex items-center gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Converter
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="templates"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Roman Numeral Converter Tab */}
          <TabsContent
            value="converter"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Conversion Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Number Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label
                        htmlFor="arabic-input"
                        className="text-sm font-medium"
                      >
                        Arabic Number (1-3999)
                      </Label>
                      <Input
                        id="arabic-input"
                        type="number"
                        value={arabicInput}
                        onChange={(e) => handleArabicChange(e.target.value)}
                        className="mt-2"
                        min="1"
                        max="3999"
                        placeholder="Enter a number..."
                      />
                    </div>

                    <div className="flex items-center justify-center">
                      <Button
                        onClick={handleSwapMode}
                        variant="outline"
                        size="sm"
                      >
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </div>

                    <div>
                      <Label
                        htmlFor="roman-input"
                        className="text-sm font-medium"
                      >
                        Roman Numeral
                      </Label>
                      <Input
                        id="roman-input"
                        type="text"
                        value={romanInput}
                        onChange={(e) => handleRomanChange(e.target.value)}
                        className="mt-2"
                        placeholder="Enter Roman numeral..."
                        style={{ textTransform: "uppercase" }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleConvert()}
                      disabled={isProcessing}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <ArrowLeftRight className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Converting..." : "Convert"}
                    </Button>
                    <Button
                      onClick={() => {
                        setArabicInput("1")
                        setRomanInput("I")
                        setCurrentConversion(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick Examples */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-medium">Quick Examples</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { arabic: 4, roman: "IV" },
                        { arabic: 9, roman: "IX" },
                        { arabic: 2024, roman: "MMXXIV" },
                        { arabic: 1776, roman: "MDCCLXXVI" },
                      ].map((example) => (
                        <Button
                          key={example.arabic}
                          onClick={() => {
                            setArabicInput(example.arabic.toString())
                            setRomanInput(example.roman)
                            handleConvert("arabic-to-roman")
                          }}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {example.arabic} = {example.roman}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Result */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Equal className="h-5 w-5" />
                    Conversion Result
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentConversion ? (
                    <div className="space-y-4">
                      {/* Main Result */}
                      <div className="text-center p-6 rounded-lg border">
                        <div className="space-y-2">
                          <div className="text-lg text-muted-foreground">
                            {formatNumber(currentConversion.arabicNumber)}
                          </div>
                          <div className="text-3xl font-bold text-primary font-mono">
                            {currentConversion.romanNumeral}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {currentConversion.conversionType.replace("-", " to ").toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Symbol Breakdown */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Symbol Breakdown</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {currentConversion.analysis.breakdown.map((symbol, index) => (
                            <div
                              key={index}
                              className="p-3 border rounded-lg text-center"
                            >
                              <div className="text-lg font-bold font-mono">{symbol.symbol}</div>
                              <div className="text-sm text-muted-foreground">{symbol.value}</div>
                              <div className="text-xs text-muted-foreground">{symbol.type}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Conversion Metadata */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Conversion Details</Label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {currentConversion.metadata.romanLength}
                            </div>
                            <div className="text-xs text-muted-foreground">Characters</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {currentConversion.metadata.complexity}
                            </div>
                            <div className="text-xs text-muted-foreground">Complexity</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">
                              {currentConversion.metadata.hasSubtractiveCases ? "Yes" : "No"}
                            </div>
                            <div className="text-xs text-muted-foreground">Subtractive</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {currentConversion.metadata.conversionTime.toFixed(2)}ms
                            </div>
                            <div className="text-xs text-muted-foreground">Time</div>
                          </div>
                        </div>
                      </div>

                      {/* Educational Notes */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Educational Notes</Label>
                        <div className="space-y-1">
                          {currentConversion.analysis.educationalNotes.slice(0, 3).map((note, index) => (
                            <div
                              key={index}
                              className="text-sm p-2 bg-muted rounded text-muted-foreground"
                            >
                              {note}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => exportConversion(currentConversion, "json")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button
                          onClick={() => exportConversion(currentConversion, "html")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          HTML
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              `${currentConversion.arabicNumber} = ${currentConversion.romanNumeral}`,
                              "Conversion Result"
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === "Conversion Result" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Scroll className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Conversion</h3>
                      <p className="text-muted-foreground">Enter a number or Roman numeral to see the conversion</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent
            value="analysis"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Detailed Analysis
                </CardTitle>
                <CardDescription>
                  Comprehensive analysis of Roman numeral conversion and historical context
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentConversion ? (
                  <div className="space-y-6">
                    {/* Historical Context */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Historical Context
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <div className="font-medium text-sm mb-2">Period</div>
                          <div className="text-sm text-muted-foreground">
                            {currentConversion.analysis.historicalContext.period}
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <div className="font-medium text-sm mb-2">Usage</div>
                          <div className="text-sm text-muted-foreground">
                            {currentConversion.analysis.historicalContext.usage}
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="font-medium text-sm mb-2">Historical Significance</div>
                        <div className="text-sm text-muted-foreground">
                          {currentConversion.analysis.historicalContext.significance}
                        </div>
                      </div>
                    </div>

                    {/* Mathematical Properties */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Mathematical Properties
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentConversion.analysis.mathematicalProperties.map((prop, index) => (
                          <div
                            key={index}
                            className="p-4 border rounded-lg"
                          >
                            <div className="font-medium text-sm mb-1">{prop.name}</div>
                            <div className="text-lg font-bold mb-1">{prop.value.toString()}</div>
                            <div className="text-xs text-muted-foreground">{prop.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Symbol Analysis */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Type className="h-4 w-4" />
                        Symbol Analysis
                      </h4>
                      <div className="space-y-3">
                        {currentConversion.analysis.breakdown.map((symbol, index) => (
                          <div
                            key={index}
                            className="p-4 border rounded-lg"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-2xl font-bold font-mono">{symbol.symbol}</div>
                              <div className="text-right">
                                <div className="font-medium">{symbol.value}</div>
                                <div className="text-xs text-muted-foreground capitalize">{symbol.type}</div>
                              </div>
                            </div>
                            <div className="text-sm text-muted-foreground">{symbol.explanation}</div>
                            <div className="text-xs text-muted-foreground mt-1">Count: {symbol.count}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Common Usages */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Modern Applications
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {currentConversion.analysis.commonUsages.map((usage, index) => (
                          <div
                            key={index}
                            className="p-3 bg-muted rounded text-sm"
                          >
                            {usage}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-muted-foreground">Perform a conversion to see detailed analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent
            value="history"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversion History</CardTitle>
                <CardDescription>View and manage your Roman numeral conversion history</CardDescription>
              </CardHeader>
              <CardContent>
                {conversions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {conversions.length} conversion{conversions.length !== 1 ? "s" : ""} in history
                      </span>
                      <Button
                        onClick={clearConversions}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {conversions.map((conversion) => (
                      <div
                        key={conversion.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {formatNumber(conversion.arabicNumber)} = {conversion.romanNumeral}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">
                              {conversion.timestamp.toLocaleString()}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeConversion(conversion.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Type:</strong> {conversion.conversionType.replace("-", " to ").toUpperCase()}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{conversion.metadata.romanLength}</div>
                              <div className="text-muted-foreground">Length</div>
                            </div>
                            <div>
                              <div className="font-medium">{conversion.metadata.complexity}</div>
                              <div className="text-muted-foreground">Complexity</div>
                            </div>
                            <div>
                              <div className="font-medium">
                                {conversion.metadata.hasSubtractiveCases ? "Yes" : "No"}
                              </div>
                              <div className="text-muted-foreground">Subtractive</div>
                            </div>
                            <div>
                              <div className="font-medium">{conversion.metadata.conversionTime.toFixed(1)}ms</div>
                              <div className="text-muted-foreground">Time</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setArabicInput(conversion.arabicNumber.toString())
                              setRomanInput(conversion.romanNumeral)
                              setCurrentConversion(conversion)
                              setActiveTab("converter")
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportConversion(conversion, "json")}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(`${conversion.arabicNumber} = ${conversion.romanNumeral}`, "Conversion")
                            }
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Perform some Roman numeral conversions to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent
            value="templates"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Roman Numeral Templates</CardTitle>
                <CardDescription>Pre-built examples for learning and practicing Roman numerals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {romanTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                      onClick={() => applyTemplate(template.id)}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">{template.category}</span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                template.difficulty === "simple"
                                  ? "bg-green-100 text-green-800"
                                  : template.difficulty === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {template.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div>
                          <div className="text-xs font-medium mb-1">Numbers ({template.numbers.length}):</div>
                          <div className="text-xs text-muted-foreground">
                            {template.numbers.slice(0, 5).join(", ")}
                            {template.numbers.length > 5 ? "..." : ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Use Cases:</div>
                          <div className="text-xs text-muted-foreground">{template.useCase.join(", ")}</div>
                        </div>
                        {template.historicalSignificance && (
                          <div>
                            <div className="text-xs font-medium mb-1">Historical Significance:</div>
                            <div className="text-xs text-muted-foreground">{template.historicalSignificance}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent
            value="settings"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Roman Numeral Settings</CardTitle>
                <CardDescription>Information about Roman numeral system and conversion rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Roman Symbols */}
                <div className="space-y-4">
                  <h4 className="font-medium">Roman Numeral Symbols</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ROMAN_SYMBOLS.map((symbol) => (
                      <div
                        key={symbol.symbol}
                        className="flex items-center gap-3 p-3 border rounded-lg"
                      >
                        <div className="text-3xl font-bold font-mono w-12 text-center">{symbol.symbol}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {symbol.name} ({symbol.value})
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">{symbol.origin}</div>
                          <div className="text-xs text-muted-foreground">
                            Modern usage: {symbol.modernUsage.join(", ")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Conversion Rules */}
                <div className="space-y-4">
                  <h4 className="font-medium">Conversion Rules</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                      <div>Roman numerals are written from largest to smallest, left to right</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0"></div>
                      <div>When a smaller numeral appears before a larger one, it is subtracted</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                      <div>Only I, X, and C can be used as subtractive numerals</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></div>
                      <div>A numeral can only be repeated up to three times consecutively</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 shrink-0"></div>
                      <div>V, L, and D are never repeated or used subtractively</div>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4">
                  <h4 className="font-medium">Tool Features</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 shrink-0"></div>
                      <div>Bidirectional conversion between Arabic numbers and Roman numerals</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 shrink-0"></div>
                      <div>Detailed analysis with historical context and mathematical properties</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 shrink-0"></div>
                      <div>Educational templates for learning and practice</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full mt-2 shrink-0"></div>
                      <div>Export capabilities in multiple formats (JSON, HTML, CSV, XML)</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 shrink-0"></div>
                      <div>Conversion history with detailed metadata and analysis</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const RomanNumeral = () => {
  return <RomanNumeralCore />
}

export default RomanNumeral
