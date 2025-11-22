import { useCallback, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Search,
  Clock,
  Play,
  Filter,
  GraduationCap,
  CheckCircle,
  XCircle,
  TestTube,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  RegexPattern,
  RegexTest,
  RegexTestResult,
  RegexMatch,
  RegexPerformance,
  RegexCategory,
  RegexCheatsheet,
  ExportFormat,
} from "@/schemas/regex-cheatsheet.schema"
// Utility functions

// Regex Categories
const regexCategories: RegexCategory[] = [
  {
    id: "basic",
    name: "Basic Patterns",
    description: "Fundamental regex patterns and character classes",
    icon: "Type",
    color: "blue",
    patterns: 0,
  },
  {
    id: "validation",
    name: "Validation",
    description: "Common validation patterns for forms and data",
    icon: "CheckCircle",
    color: "green",
    patterns: 0,
  },
  {
    id: "extraction",
    name: "Data Extraction",
    description: "Patterns for extracting specific data from text",
    icon: "Search",
    color: "purple",
    patterns: 0,
  },
  {
    id: "formatting",
    name: "Text Formatting",
    description: "Patterns for text formatting and manipulation",
    icon: "Type",
    color: "orange",
    patterns: 0,
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Complex patterns with lookaheads and advanced features",
    icon: "Zap",
    color: "red",
    patterns: 0,
  },
  {
    id: "programming",
    name: "Programming",
    description: "Patterns for code analysis and programming languages",
    icon: "Code",
    color: "indigo",
    patterns: 0,
  },
]

// Comprehensive Regex Patterns
const regexPatterns: RegexPattern[] = [
  // Basic Patterns
  {
    id: "email",
    name: "Email Address",
    description: "Validates email addresses with proper format",
    pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
    flags: "i",
    category: regexCategories[1],
    difficulty: "beginner",
    examples: [
      { input: "user@example.com", matches: true, explanation: "Valid email format" },
      { input: "test.email+tag@domain.co.uk", matches: true, explanation: "Valid with subdomain and plus sign" },
      { input: "invalid.email", matches: false, explanation: "Missing @ symbol and domain" },
      { input: "@domain.com", matches: false, explanation: "Missing username part" },
    ],
    explanation: "Matches standard email format: username@domain.extension",
    useCase: ["Form validation", "Email extraction", "Contact information"],
    tags: ["email", "validation", "contact"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "phone",
    name: "Phone Number",
    description: "Validates various phone number formats",
    pattern: "^(\\+?1[-\\s]?)?\\(?([0-9]{3})\\)?[-\\s]?([0-9]{3})[-\\s]?([0-9]{4})$",
    category: regexCategories[1],
    difficulty: "intermediate",
    examples: [
      { input: "(555) 123-4567", matches: true, explanation: "Standard US format with parentheses" },
      { input: "+1-555-123-4567", matches: true, explanation: "International format with country code" },
      { input: "5551234567", matches: true, explanation: "Plain number format" },
      { input: "555-123-456", matches: false, explanation: "Incomplete number" },
    ],
    explanation: "Matches US phone numbers in various formats including international",
    useCase: ["Contact forms", "Phone validation", "Data extraction"],
    tags: ["phone", "validation", "contact", "US"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "url",
    name: "URL/Website",
    description: "Validates HTTP and HTTPS URLs",
    pattern:
      "^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$",
    category: regexCategories[1],
    difficulty: "intermediate",
    examples: [
      { input: "https://www.example.com", matches: true, explanation: "Standard HTTPS URL" },
      {
        input: "http://subdomain.example.org/path?query=value",
        matches: true,
        explanation: "HTTP with subdomain and query",
      },
      { input: "ftp://example.com", matches: false, explanation: "FTP protocol not supported" },
      { input: "not-a-url", matches: false, explanation: "Invalid URL format" },
    ],
    explanation: "Matches HTTP and HTTPS URLs with optional www and various path/query combinations",
    useCase: ["Link validation", "URL extraction", "Web scraping"],
    tags: ["url", "validation", "web", "http", "https"],
    performance: "medium",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "password-strong",
    name: "Strong Password",
    description: "Validates strong passwords with multiple requirements",
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
    category: regexCategories[1],
    difficulty: "advanced",
    examples: [
      { input: "MyPass123!", matches: true, explanation: "Contains all required character types" },
      { input: "StrongP@ssw0rd", matches: true, explanation: "Strong password with special characters" },
      { input: "weakpass", matches: false, explanation: "Missing uppercase, numbers, and special chars" },
      { input: "SHORT1!", matches: false, explanation: "Too short (less than 8 characters)" },
    ],
    explanation: "Requires at least 8 characters with lowercase, uppercase, number, and special character",
    useCase: ["Password validation", "Security requirements", "User registration"],
    tags: ["password", "security", "validation", "strong"],
    performance: "medium",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "ipv4",
    name: "IPv4 Address",
    description: "Validates IPv4 IP addresses",
    pattern: "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    category: regexCategories[1],
    difficulty: "intermediate",
    examples: [
      { input: "192.168.1.1", matches: true, explanation: "Valid private IP address" },
      { input: "255.255.255.255", matches: true, explanation: "Valid broadcast address" },
      { input: "256.1.1.1", matches: false, explanation: "Invalid octet (256 > 255)" },
      { input: "192.168.1", matches: false, explanation: "Incomplete IP address" },
    ],
    explanation: "Matches valid IPv4 addresses with proper octet ranges (0-255)",
    useCase: ["Network validation", "IP filtering", "Configuration files"],
    tags: ["ip", "ipv4", "network", "validation"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "credit-card",
    name: "Credit Card Number",
    description: "Validates credit card numbers (basic format)",
    pattern: "^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$",
    category: regexCategories[1],
    difficulty: "advanced",
    examples: [
      { input: "4111111111111111", matches: true, explanation: "Valid Visa format (16 digits)" },
      { input: "5555555555554444", matches: true, explanation: "Valid Mastercard format" },
      { input: "378282246310005", matches: true, explanation: "Valid American Express format (15 digits)" },
      { input: "1234567890123456", matches: false, explanation: "Invalid card number format" },
    ],
    explanation: "Matches major credit card formats: Visa, Mastercard, American Express, Discover",
    useCase: ["Payment validation", "E-commerce", "Financial applications"],
    tags: ["credit-card", "payment", "validation", "financial"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "date-iso",
    name: "ISO Date Format",
    description: "Validates ISO 8601 date format (YYYY-MM-DD)",
    pattern: "^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$",
    category: regexCategories[1],
    difficulty: "intermediate",
    examples: [
      { input: "2023-12-25", matches: true, explanation: "Valid ISO date format" },
      { input: "2023-02-29", matches: true, explanation: "Valid format (leap year check not included)" },
      { input: "23-12-25", matches: false, explanation: "Invalid year format (2-digit)" },
      { input: "2023/12/25", matches: false, explanation: "Wrong separator (slash instead of dash)" },
    ],
    explanation: "Matches ISO 8601 date format with basic month/day validation",
    useCase: ["Date validation", "API data", "Database entries"],
    tags: ["date", "iso", "validation", "time"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "hex-color",
    name: "Hex Color Code",
    description: "Validates hexadecimal color codes",
    pattern: "^#(?:[0-9a-fA-F]{3}){1,2}$",
    category: regexCategories[2],
    difficulty: "beginner",
    examples: [
      { input: "#FF0000", matches: true, explanation: "Valid 6-digit hex color (red)" },
      { input: "#f00", matches: true, explanation: "Valid 3-digit hex color (red)" },
      { input: "#GGGGGG", matches: false, explanation: "Invalid characters (G not hex)" },
      { input: "FF0000", matches: false, explanation: "Missing # prefix" },
    ],
    explanation: "Matches hex color codes in both 3-digit and 6-digit formats",
    useCase: ["CSS validation", "Color picker", "Design tools"],
    tags: ["color", "hex", "css", "design"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  // Programming Patterns
  {
    id: "html-tag",
    name: "HTML Tag",
    description: "Matches HTML tags with attributes",
    pattern: "<\\/?[a-zA-Z][a-zA-Z0-9]*(?:\\s+[a-zA-Z][a-zA-Z0-9]*(?:=(?:\"[^\"]*\"|'[^']*'|[^\\s>]+))?)*\\s*\\/??>",
    category: regexCategories[5],
    difficulty: "advanced",
    examples: [
      { input: '<div class="container">', matches: true, explanation: "Opening div tag with class attribute" },
      {
        input: '<img src="image.jpg" alt="Image" />',
        matches: true,
        explanation: "Self-closing img tag with attributes",
      },
      { input: "</div>", matches: true, explanation: "Closing div tag" },
      { input: "<invalid tag>", matches: false, explanation: "Invalid tag with space in name" },
    ],
    explanation: "Matches HTML tags including opening, closing, and self-closing tags with attributes",
    useCase: ["HTML parsing", "Web scraping", "Template processing"],
    tags: ["html", "xml", "parsing", "web"],
    performance: "medium",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "css-property",
    name: "CSS Property",
    description: "Matches CSS property declarations",
    pattern: "([a-zA-Z-]+)\\s*:\\s*([^;]+);?",
    category: regexCategories[5],
    difficulty: "intermediate",
    examples: [
      { input: "color: red;", matches: true, explanation: "Simple CSS property", groups: ["color", "red"] },
      {
        input: "margin-top: 10px",
        matches: true,
        explanation: "CSS property without semicolon",
        groups: ["margin-top", "10px"],
      },
      {
        input: 'background: url("image.jpg") no-repeat;',
        matches: true,
        explanation: "Complex CSS value",
        groups: ["background", 'url("image.jpg") no-repeat'],
      },
      { input: "invalid css", matches: false, explanation: "Not a valid CSS property format" },
    ],
    explanation: "Captures CSS property name and value pairs",
    useCase: ["CSS parsing", "Style extraction", "CSS validation"],
    tags: ["css", "style", "parsing", "web"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "javascript-variable",
    name: "JavaScript Variable",
    description: "Matches JavaScript variable declarations",
    pattern: "(var|let|const)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=\\s*(.+);?",
    category: regexCategories[5],
    difficulty: "intermediate",
    examples: [
      {
        input: 'let userName = "John";',
        matches: true,
        explanation: "Let declaration with string",
        groups: ["let", "userName", '"John"'],
      },
      {
        input: "const PI = 3.14159",
        matches: true,
        explanation: "Const declaration with number",
        groups: ["const", "PI", "3.14159"],
      },
      {
        input: "var isActive = true;",
        matches: true,
        explanation: "Var declaration with boolean",
        groups: ["var", "isActive", "true"],
      },
      { input: "function test() {}", matches: false, explanation: "Function declaration, not variable" },
    ],
    explanation: "Captures JavaScript variable declarations with var, let, or const",
    useCase: ["Code analysis", "Variable extraction", "Syntax highlighting"],
    tags: ["javascript", "variable", "parsing", "code"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  // Advanced Patterns
  {
    id: "balanced-parentheses",
    name: "Balanced Parentheses",
    description: "Matches balanced parentheses (simple version)",
    pattern: "\\(([^()]*)\\)",
    category: regexCategories[4],
    difficulty: "expert",
    examples: [
      { input: "(hello)", matches: true, explanation: "Simple balanced parentheses" },
      { input: "(hello world)", matches: true, explanation: "Balanced with spaces" },
      { input: "((nested))", matches: false, explanation: "Nested parentheses not supported by this pattern" },
      { input: "(unbalanced", matches: false, explanation: "Missing closing parenthesis" },
    ],
    explanation: "Matches simple balanced parentheses without nesting",
    useCase: ["Expression parsing", "Code analysis", "Mathematical expressions"],
    tags: ["parentheses", "balanced", "parsing", "advanced"],
    performance: "fast",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
  {
    id: "positive-lookahead",
    name: "Positive Lookahead",
    description: "Password with lookahead assertions",
    pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$",
    category: regexCategories[4],
    difficulty: "expert",
    examples: [
      { input: "Password123", matches: true, explanation: "Contains lowercase, uppercase, and digit" },
      { input: "password123", matches: false, explanation: "Missing uppercase letter" },
      { input: "PASSWORD123", matches: false, explanation: "Missing lowercase letter" },
      { input: "Password", matches: false, explanation: "Missing digit" },
    ],
    explanation: "Uses positive lookahead to ensure multiple conditions are met",
    useCase: ["Password validation", "Complex validation rules", "Security requirements"],
    tags: ["lookahead", "password", "validation", "advanced"],
    performance: "medium",
    compatibility: ["JavaScript", "Python", "Java", "C#", "PHP"],
    createdAt: new Date(),
  },
]

// Regex testing functions
const testRegex = (pattern: string, flags: string, testString: string): RegexTestResult => {
  const startTime = window.performance.now()

  try {
    const regex = new RegExp(pattern, flags)
    const matches: RegexMatch[] = []

    if (flags.includes("g")) {
      // Global search
      let match
      while ((match = regex.exec(testString)) !== null) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups,
        })

        // Prevent infinite loop
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }
    } else {
      // Single match
      const match = regex.exec(testString)
      if (match) {
        matches.push({
          match: match[0],
          index: match.index,
          groups: match.slice(1),
          namedGroups: match.groups,
        })
      }
    }

    const endTime = window.performance.now()
    const executionTime = endTime - startTime

    // Simple performance analysis
    const performance: RegexPerformance = {
      steps: pattern.length * testString.length, // Simplified estimation
      backtracking: pattern.includes("*") || pattern.includes("+") || pattern.includes("?"),
      complexity: pattern.includes(".*") || pattern.includes(".+") ? "polynomial" : "linear",
      recommendation: executionTime > 10 ? "Consider optimizing this pattern for better performance" : undefined,
    }

    return {
      isValid: true,
      matches,
      groups: matches.length > 0 ? matches[0].groups : [],
      executionTime,
      performance,
    }
  } catch (error) {
    const endTime = window.performance.now()
    return {
      isValid: false,
      matches: [],
      groups: [],
      error: error instanceof Error ? error.message : "Unknown error",
      executionTime: endTime - startTime,
      performance: {
        steps: 0,
        backtracking: false,
        complexity: "linear",
      },
    }
  }
}

// Custom hooks
const useRegexTester = () => {
  const [tests, setTests] = useState<RegexTest[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const runTest = useCallback((pattern: string, flags: string, testString: string): RegexTest => {
    setIsProcessing(true)
    try {
      const result = testRegex(pattern, flags, testString)
      const test: RegexTest = {
        id: nanoid(),
        pattern,
        flags,
        testString,
        result,
        timestamp: new Date(),
      }

      setTests((prev) => [test, ...prev.slice(0, 99)]) // Keep last 100 tests
      return test
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const clearTests = useCallback(() => {
    setTests([])
  }, [])

  const removeTest = useCallback((id: string) => {
    setTests((prev) => prev.filter((test) => test.id !== id))
  }, [])

  return {
    tests,
    isProcessing,
    runTest,
    clearTests,
    removeTest,
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
const useRegexExport = () => {
  const exportPatterns = useCallback((patterns: RegexPattern[], format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        content = JSON.stringify(patterns, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = generateCSVFromPatterns(patterns)
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "txt":
        content = generateTextFromPatterns(patterns)
        mimeType = "text/plain"
        extension = ".txt"
        break
      case "xml":
        content = generateXMLFromPatterns(patterns)
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "yaml":
        content = generateYAMLFromPatterns(patterns)
        mimeType = "text/yaml"
        extension = ".yaml"
        break
      default:
        content = patterns.map((p) => `${p.name}: ${p.pattern}`).join("\n")
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `regex-patterns${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportPatterns }
}

// Helper functions for export formats
const generateCSVFromPatterns = (patterns: RegexPattern[]): string => {
  const headers = ["Name", "Pattern", "Category", "Difficulty", "Description", "Use Cases"]
  const rows = patterns.map((pattern) => [
    pattern.name,
    pattern.pattern,
    pattern.category.name,
    pattern.difficulty,
    pattern.description,
    pattern.useCase.join("; "),
  ])

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
}

const generateTextFromPatterns = (patterns: RegexPattern[]): string => {
  return patterns
    .map(
      (pattern) => `
${pattern.name}
Pattern: ${pattern.pattern}
Category: ${pattern.category.name}
Difficulty: ${pattern.difficulty}
Description: ${pattern.description}
Use Cases: ${pattern.useCase.join(", ")}
Examples:
${pattern.examples.map((ex) => `  - "${ex.input}" → ${ex.matches ? "Match" : "No Match"} (${ex.explanation})`).join("\n")}
`
    )
    .join("\n---\n")
}

const generateXMLFromPatterns = (patterns: RegexPattern[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<regexPatterns>
${patterns
  .map(
    (pattern) => `  <pattern id="${pattern.id}">
    <name>${pattern.name}</name>
    <pattern><![CDATA[${pattern.pattern}]]></pattern>
    <category>${pattern.category.name}</category>
    <difficulty>${pattern.difficulty}</difficulty>
    <description>${pattern.description}</description>
    <useCases>
${pattern.useCase.map((uc) => `      <useCase>${uc}</useCase>`).join("\n")}
    </useCases>
  </pattern>`
  )
  .join("\n")}
</regexPatterns>`
}

const generateYAMLFromPatterns = (patterns: RegexPattern[]): string => {
  return `patterns:
${patterns
  .map(
    (pattern) => `  - id: ${pattern.id}
    name: ${pattern.name}
    pattern: ${JSON.stringify(pattern.pattern)}
    category: ${pattern.category.name}
    difficulty: ${pattern.difficulty}
    description: ${pattern.description}
    useCases:
${pattern.useCase.map((uc) => `      - ${uc}`).join("\n")}`
  )
  .join("\n")}`
}

/**
 * Enhanced Regex Cheatsheet & Testing Tool
 * Features: Comprehensive regex reference, interactive testing, pattern categories, and educational content
 */
const RegexCheatsheetCore = () => {
  const [activeTab, setActiveTab] = useState<"cheatsheet" | "tester" | "history" | "tutorials">("cheatsheet")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPattern, setSelectedPattern] = useState<RegexPattern | null>(null)
  const [testPattern, setTestPattern] = useState("")
  const [testFlags, setTestFlags] = useState("g")
  const [testString, setTestString] = useState("")

  const { tests, isProcessing, runTest, clearTests, removeTest } = useRegexTester()
  const { exportPatterns } = useRegexExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Filter patterns based on category and search
  const filteredPatterns = useMemo(() => {
    let filtered = regexPatterns

    if (selectedCategory !== "all") {
      filtered = filtered.filter((pattern) => pattern.category.id === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (pattern) =>
          pattern.name.toLowerCase().includes(query) ||
          pattern.description.toLowerCase().includes(query) ||
          pattern.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          pattern.useCase.some((uc) => uc.toLowerCase().includes(query))
      )
    }

    return filtered
  }, [selectedCategory, searchQuery])

  // Run regex test
  const handleTest = useCallback(() => {
    if (!testPattern.trim()) {
      toast.error("Please enter a regex pattern")
      return
    }

    if (!testString.trim()) {
      toast.error("Please enter a test string")
      return
    }

    try {
      const test = runTest(testPattern, testFlags, testString)
      if (test.result.isValid) {
        toast.success(`Test completed: ${test.result.matches.length} matches found`)
      } else {
        toast.error(`Test failed: ${test.result.error}`)
      }
    } catch (error) {
      toast.error("Failed to run regex test")
      console.error(error)
    }
  }, [testPattern, testFlags, testString, runTest])

  // Apply pattern to tester
  const applyPatternToTester = useCallback((pattern: RegexPattern) => {
    setTestPattern(pattern.pattern)
    setTestFlags(pattern.flags || "g")
    if (pattern.examples.length > 0) {
      setTestString(pattern.examples[0].input)
    }
    setActiveTab("tester")
    toast.success(`Applied pattern: ${pattern.name}`)
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
              <BookOpen className="h-5 w-5" />
              Regex Cheatsheet & Testing Tool
            </CardTitle>
            <CardDescription>
              Comprehensive regular expression reference with interactive testing, pattern categories, and educational
              content. Learn, test, and master regex patterns with detailed explanations and real-time validation. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "cheatsheet" | "tester" | "history" | "tutorials")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="cheatsheet"
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Cheatsheet
            </TabsTrigger>
            <TabsTrigger
              value="tester"
              className="flex items-center gap-2"
            >
              <TestTube className="h-4 w-4" />
              Tester
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger
              value="tutorials"
              className="flex items-center gap-2"
            >
              <GraduationCap className="h-4 w-4" />
              Tutorials
            </TabsTrigger>
          </TabsList>

          {/* Regex Cheatsheet Tab */}
          <TabsContent
            value="cheatsheet"
            className="space-y-4"
          >
            {/* Filters and Search */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Pattern Library
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label
                      htmlFor="search"
                      className="text-sm font-medium"
                    >
                      Search Patterns
                    </Label>
                    <div className="relative mt-2">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name, description, or tags..."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="sm:w-48">
                    <Label
                      htmlFor="category"
                      className="text-sm font-medium"
                    >
                      Category
                    </Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {regexCategories.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category.id}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => exportPatterns(filteredPatterns, "json")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export JSON
                  </Button>
                  <Button
                    onClick={() => exportPatterns(filteredPatterns, "csv")}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pattern Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatterns.map((pattern) => (
                <Card
                  key={pattern.id}
                  className={`cursor-pointer transition-colors hover:border-primary/50 ${
                    selectedPattern?.id === pattern.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedPattern(pattern)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{pattern.name}</CardTitle>
                      <div className="flex items-center gap-1">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            pattern.difficulty === "beginner"
                              ? "bg-green-100 text-green-800"
                              : pattern.difficulty === "intermediate"
                                ? "bg-yellow-100 text-yellow-800"
                                : pattern.difficulty === "advanced"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {pattern.difficulty}
                        </span>
                        <span className="text-xs px-2 py-1 bg-muted rounded">{pattern.category.name}</span>
                      </div>
                    </div>
                    <CardDescription className="text-xs">{pattern.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Pattern</Label>
                      <div className="mt-1 p-2 bg-muted rounded font-mono text-xs break-all">{pattern.pattern}</div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Use Cases</Label>
                      <div className="text-xs text-muted-foreground mt-1">
                        {pattern.useCase.slice(0, 2).join(", ")}
                        {pattern.useCase.length > 2 && "..."}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(pattern.pattern, "Pattern")
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        {copiedText === "Pattern" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          applyPatternToTester(pattern)
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <TestTube className="mr-1 h-3 w-3" />
                        Test
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredPatterns.length === 0 && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Patterns Found</h3>
                    <p className="text-muted-foreground">Try adjusting your search query or category filter</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Pattern Detail Modal */}
          {selectedPattern && (
            <Card className="mt-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedPattern.name}</CardTitle>
                  <Button
                    onClick={() => setSelectedPattern(null)}
                    variant="ghost"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription>{selectedPattern.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Regular Expression</Label>
                  <div className="mt-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {selectedPattern.pattern}
                    {selectedPattern.flags && (
                      <span className="text-muted-foreground ml-2">/{selectedPattern.flags}</span>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Explanation</Label>
                  <p className="mt-2 text-sm text-muted-foreground">{selectedPattern.explanation}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Category</div>
                    <div className="text-muted-foreground">{selectedPattern.category.name}</div>
                  </div>
                  <div>
                    <div className="font-medium">Difficulty</div>
                    <div className="text-muted-foreground capitalize">{selectedPattern.difficulty}</div>
                  </div>
                  <div>
                    <div className="font-medium">Performance</div>
                    <div className="text-muted-foreground capitalize">{selectedPattern.performance}</div>
                  </div>
                  <div>
                    <div className="font-medium">Compatibility</div>
                    <div className="text-muted-foreground">{selectedPattern.compatibility.length} engines</div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Examples</Label>
                  <div className="mt-2 space-y-2">
                    {selectedPattern.examples.map((example, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{example.input}</code>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              example.matches ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}
                          >
                            {example.matches ? "Match" : "No Match"}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{example.explanation}</p>
                        {example.groups && example.groups.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium">Groups: </span>
                            <span className="text-xs text-muted-foreground">{example.groups.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Use Cases</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedPattern.useCase.map((useCase, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-muted rounded"
                      >
                        {useCase}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Tags</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedPattern.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => copyToClipboard(selectedPattern.pattern, "Pattern")}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Pattern
                  </Button>
                  <Button
                    onClick={() => applyPatternToTester(selectedPattern)}
                    variant="outline"
                    size="sm"
                  >
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Pattern
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regex Tester Tab */}
          <TabsContent
            value="tester"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tester Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    Regex Tester
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="test-pattern"
                      className="text-sm font-medium"
                    >
                      Regular Expression
                    </Label>
                    <Input
                      id="test-pattern"
                      value={testPattern}
                      onChange={(e) => setTestPattern(e.target.value)}
                      placeholder="Enter your regex pattern..."
                      className="mt-2 font-mono"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="test-flags"
                      className="text-sm font-medium"
                    >
                      Flags
                    </Label>
                    <div className="mt-2 flex gap-2">
                      <Input
                        id="test-flags"
                        value={testFlags}
                        onChange={(e) => setTestFlags(e.target.value)}
                        placeholder="g, i, m, s, u, y"
                        className="font-mono"
                        style={{ width: "120px" }}
                      />
                      <div className="text-xs text-muted-foreground flex items-center">
                        g=global, i=ignoreCase, m=multiline, s=dotAll, u=unicode, y=sticky
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor="test-string"
                      className="text-sm font-medium"
                    >
                      Test String
                    </Label>
                    <Textarea
                      id="test-string"
                      value={testString}
                      onChange={(e) => setTestString(e.target.value)}
                      placeholder="Enter text to test against your regex..."
                      className="mt-2"
                      rows={6}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleTest}
                      disabled={isProcessing || !testPattern.trim() || !testString.trim()}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Play className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Testing..." : "Test Regex"}
                    </Button>
                    <Button
                      onClick={() => {
                        setTestPattern("")
                        setTestFlags("g")
                        setTestString("")
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Test Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {tests.length > 0 ? (
                    <div className="space-y-4">
                      {tests.slice(0, 1).map((test) => (
                        <div
                          key={test.id}
                          className="space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Latest Test</span>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                test.result.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {test.result.isValid ? "Valid" : "Invalid"}
                            </span>
                          </div>

                          {test.result.error ? (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="text-sm font-medium text-red-800">Error</div>
                              <div className="text-sm text-red-600 mt-1">{test.result.error}</div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div>
                                <div className="text-sm font-medium mb-2">
                                  Matches Found: {test.result.matches.length}
                                </div>
                                {test.result.matches.length > 0 ? (
                                  <div className="space-y-2">
                                    {test.result.matches.map((match, index) => (
                                      <div
                                        key={index}
                                        className="p-2 bg-green-50 border border-green-200 rounded"
                                      >
                                        <div className="font-mono text-sm">{match.match}</div>
                                        <div className="text-xs text-muted-foreground">
                                          Position: {match.index}
                                          {match.groups.length > 0 && (
                                            <span className="ml-4">Groups: {match.groups.join(", ")}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground">No matches found</div>
                                )}
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-medium">Execution Time</div>
                                  <div className="text-muted-foreground">{test.result.executionTime.toFixed(2)}ms</div>
                                </div>
                                <div>
                                  <div className="font-medium">Complexity</div>
                                  <div className="text-muted-foreground capitalize">
                                    {test.result.performance.complexity}
                                  </div>
                                </div>
                              </div>

                              {test.result.performance.recommendation && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                  <div className="text-sm font-medium text-yellow-800">Performance Tip</div>
                                  <div className="text-sm text-yellow-600 mt-1">
                                    {test.result.performance.recommendation}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TestTube className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Tests Run</h3>
                      <p className="text-muted-foreground">Enter a regex pattern and test string to get started</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent
            value="history"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Test History</CardTitle>
                <CardDescription>View and manage your regex test history</CardDescription>
              </CardHeader>
              <CardContent>
                {tests.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {tests.length} test{tests.length !== 1 ? "s" : ""} in history
                      </span>
                      <Button
                        onClick={clearTests}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {tests.map((test) => (
                      <div
                        key={test.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">{test.timestamp.toLocaleString()}</div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                test.result.isValid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {test.result.isValid ? "Valid" : "Invalid"}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeTest(test.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Pattern:</strong>
                            <code className="ml-2 font-mono bg-muted px-1 rounded">{test.pattern}</code>
                            {test.flags && <span className="ml-1 text-muted-foreground">/{test.flags}</span>}
                          </div>
                          <div className="text-sm">
                            <strong>Test String:</strong>
                            <span className="ml-2 font-mono bg-muted px-1 rounded text-xs">
                              {test.testString.length > 50 ? test.testString.substring(0, 50) + "..." : test.testString}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>Matches: {test.result.matches.length}</div>
                            <div>Time: {test.result.executionTime.toFixed(2)}ms</div>
                            <div>Complexity: {test.result.performance.complexity}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTestPattern(test.pattern)
                              setTestFlags(test.flags)
                              setTestString(test.testString)
                              setActiveTab("tester")
                            }}
                          >
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(test.pattern, "Pattern")}
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
                    <h3 className="text-lg font-semibold mb-2">No Test History</h3>
                    <p className="text-muted-foreground">Run some regex tests to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent
            value="tutorials"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Regex Tutorials</CardTitle>
                <CardDescription>Learn regular expressions step by step</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Basic Tutorial */}
                  <Card className="cursor-pointer hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Regex Basics</CardTitle>
                      <CardDescription className="text-xs">
                        Learn the fundamentals of regular expressions
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Level:</span>
                          <span className="text-green-600">Beginner</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>15 minutes</span>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Topics:</div>
                          <div className="text-xs text-muted-foreground">Character classes, quantifiers, anchors</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Intermediate Tutorial */}
                  <Card className="cursor-pointer hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Advanced Patterns</CardTitle>
                      <CardDescription className="text-xs">
                        Master complex regex patterns and techniques
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Level:</span>
                          <span className="text-orange-600">Intermediate</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>25 minutes</span>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Topics:</div>
                          <div className="text-xs text-muted-foreground">Groups, lookaheads, backreferences</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Expert Tutorial */}
                  <Card className="cursor-pointer hover:border-primary/50">
                    <CardHeader>
                      <CardTitle className="text-sm">Performance & Optimization</CardTitle>
                      <CardDescription className="text-xs">
                        Optimize regex performance and avoid pitfalls
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Level:</span>
                          <span className="text-red-600">Advanced</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span>30 minutes</span>
                        </div>
                        <div className="mt-3">
                          <div className="text-xs font-medium mb-1">Topics:</div>
                          <div className="text-xs text-muted-foreground">
                            Backtracking, optimization, best practices
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Reference */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Reference</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium text-sm mb-2">Character Classes</h4>
                        <div className="space-y-1 text-xs">
                          <div>
                            <code className="bg-muted px-1 rounded">.</code> - Any character
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">\d</code> - Digit (0-9)
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">\w</code> - Word character
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">\s</code> - Whitespace
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">[abc]</code> - Character set
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">[^abc]</code> - Negated set
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Quantifiers</h4>
                        <div className="space-y-1 text-xs">
                          <div>
                            <code className="bg-muted px-1 rounded">*</code> - Zero or more
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">+</code> - One or more
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">?</code> - Zero or one
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">{`{n}`}</code> - Exactly n
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">{`{n,}`}</code> - n or more
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">{`{n,m}`}</code> - Between n and m
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-2">Anchors & Groups</h4>
                        <div className="space-y-1 text-xs">
                          <div>
                            <code className="bg-muted px-1 rounded">^</code> - Start of string
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">$</code> - End of string
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">\b</code> - Word boundary
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">()</code> - Capturing group
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">(?:)</code> - Non-capturing
                          </div>
                          <div>
                            <code className="bg-muted px-1 rounded">(?=)</code> - Positive lookahead
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const RegexCheatsheet = () => {
  return <RegexCheatsheetCore />
}

export default RegexCheatsheet
