import { useCallback, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
  Download,
  FileText,
  Loader2,
  RefreshCw,
  BookOpen,
  Target,
  Copy,
  Check,
  BarChart3,
  Settings,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  GeneratedText,
  GenerationSettings,
  GenerationStats,
  TextPreset,
  TextStyle,
  OutputFormat,
} from "@/types/lorem-ipsum"
// Types

// Utility functions

const validateGenerationSettings = (settings: GenerationSettings): { isValid: boolean; error?: string } => {
  if (settings.paragraphCount < 1 || settings.paragraphCount > 100) {
    return { isValid: false, error: "Paragraph count must be between 1 and 100" }
  }

  if (settings.sentencesPerParagraph < 1 || settings.sentencesPerParagraph > 20) {
    return { isValid: false, error: "Sentences per paragraph must be between 1 and 20" }
  }

  if (settings.wordsPerSentence < 3 || settings.wordsPerSentence > 50) {
    return { isValid: false, error: "Words per sentence must be between 3 and 50" }
  }

  return { isValid: true }
}

// Text content libraries
const textLibraries = {
  "classic-latin": {
    words: [
      "lorem",
      "ipsum",
      "dolor",
      "sit",
      "amet",
      "consectetur",
      "adipiscing",
      "elit",
      "sed",
      "do",
      "eiusmod",
      "tempor",
      "incididunt",
      "ut",
      "labore",
      "et",
      "dolore",
      "magna",
      "aliqua",
      "enim",
      "ad",
      "minim",
      "veniam",
      "quis",
      "nostrud",
      "exercitation",
      "ullamco",
      "laboris",
      "nisi",
      "aliquip",
      "ex",
      "ea",
      "commodo",
      "consequat",
      "duis",
      "aute",
      "irure",
      "in",
      "reprehenderit",
      "voluptate",
      "velit",
      "esse",
      "cillum",
      "fugiat",
      "nulla",
      "pariatur",
      "excepteur",
      "sint",
      "occaecat",
      "cupidatat",
      "non",
      "proident",
      "sunt",
      "culpa",
      "qui",
      "officia",
      "deserunt",
      "mollit",
      "anim",
      "id",
      "est",
      "laborum",
      "at",
      "vero",
      "eos",
      "accusamus",
      "accusantium",
      "doloremque",
      "laudantium",
      "totam",
      "rem",
      "aperiam",
      "eaque",
      "ipsa",
      "quae",
      "ab",
      "illo",
      "inventore",
      "veritatis",
      "et",
      "quasi",
      "architecto",
      "beatae",
      "vitae",
      "dicta",
      "sunt",
      "explicabo",
      "nemo",
      "ipsam",
      "voluptatem",
      "quia",
      "voluptas",
      "aspernatur",
      "aut",
      "odit",
      "fugit",
    ],
    starters: ["Lorem ipsum", "Sed ut perspiciatis", "At vero eos", "Ut enim ad minim"],
  },
  "modern-english": {
    words: [
      "the",
      "quick",
      "brown",
      "fox",
      "jumps",
      "over",
      "lazy",
      "dog",
      "pack",
      "my",
      "box",
      "with",
      "five",
      "dozen",
      "liquor",
      "jugs",
      "amazing",
      "few",
      "discotheques",
      "provide",
      "jukeboxes",
      "bright",
      "vixens",
      "jump",
      "dozy",
      "fowl",
      "quack",
      "waltz",
      "bad",
      "nymph",
      "for",
      "quick",
      "jigs",
      "vex",
      "sphinx",
      "of",
      "black",
      "quartz",
      "judge",
      "vow",
      "two",
      "driven",
      "jocks",
      "help",
      "fax",
      "big",
      "quiz",
      "crazy",
      "fredrick",
      "bought",
      "many",
      "very",
      "exquisite",
      "opal",
      "jewels",
      "jackdaws",
      "love",
      "my",
      "giant",
      "sphinx",
      "quartz",
      "how",
      "vexingly",
      "quick",
      "daft",
      "zebras",
      "jump",
    ],
    starters: ["The quick brown", "In modern times", "Today we see", "It is clear that"],
  },
  "tech-jargon": {
    words: [
      "algorithm",
      "framework",
      "scalable",
      "microservices",
      "containerization",
      "kubernetes",
      "docker",
      "devops",
      "continuous",
      "integration",
      "deployment",
      "agile",
      "scrum",
      "sprint",
      "backlog",
      "stakeholder",
      "synergy",
      "leverage",
      "optimize",
      "streamline",
      "innovative",
      "disruptive",
      "paradigm",
      "ecosystem",
      "platform",
      "infrastructure",
      "cloud",
      "native",
      "serverless",
      "api",
      "rest",
      "graphql",
      "database",
      "nosql",
      "mongodb",
      "postgresql",
      "redis",
      "elasticsearch",
      "machine",
      "learning",
      "artificial",
      "intelligence",
      "blockchain",
      "cryptocurrency",
      "fintech",
      "saas",
      "paas",
      "iaas",
    ],
    starters: [
      "Our scalable platform",
      "The innovative framework",
      "This disruptive technology",
      "Advanced algorithms",
    ],
  },
  "business-formal": {
    words: [
      "strategic",
      "initiative",
      "stakeholder",
      "engagement",
      "deliverable",
      "milestone",
      "objective",
      "key",
      "performance",
      "indicator",
      "return",
      "investment",
      "market",
      "penetration",
      "competitive",
      "advantage",
      "value",
      "proposition",
      "customer",
      "acquisition",
      "retention",
      "revenue",
      "growth",
      "profitability",
      "sustainability",
      "corporate",
      "governance",
      "compliance",
      "risk",
      "management",
      "due",
      "diligence",
      "merger",
      "acquisition",
      "partnership",
      "collaboration",
      "synergy",
      "optimization",
      "efficiency",
      "productivity",
      "innovation",
      "transformation",
      "digital",
      "disruption",
    ],
    starters: ["Our strategic initiative", "The business case", "Market analysis shows", "Key stakeholders"],
  },
  "creative-writing": {
    words: [
      "whispered",
      "shadows",
      "moonlight",
      "dancing",
      "mysterious",
      "enchanted",
      "forgotten",
      "ancient",
      "magical",
      "shimmering",
      "ethereal",
      "haunting",
      "beautiful",
      "serene",
      "turbulent",
      "passionate",
      "melancholy",
      "nostalgic",
      "whimsical",
      "dramatic",
      "poetic",
      "lyrical",
      "romantic",
      "adventurous",
      "thrilling",
      "suspenseful",
      "intriguing",
      "captivating",
      "mesmerizing",
      "breathtaking",
      "stunning",
      "magnificent",
      "extraordinary",
      "remarkable",
      "incredible",
      "fantastic",
      "wonderful",
      "marvelous",
      "spectacular",
      "brilliant",
      "radiant",
      "luminous",
      "glowing",
      "sparkling",
      "twinkling",
      "gleaming",
    ],
    starters: ["In the shadows", "Once upon a time", "The moonlight revealed", "Deep in the forest"],
  },
  "academic-paper": {
    words: [
      "furthermore",
      "however",
      "nevertheless",
      "consequently",
      "therefore",
      "moreover",
      "additionally",
      "specifically",
      "particularly",
      "significantly",
      "substantially",
      "considerably",
      "notably",
      "remarkably",
      "evidently",
      "apparently",
      "presumably",
      "hypothesis",
      "methodology",
      "analysis",
      "conclusion",
      "research",
      "study",
      "investigation",
      "examination",
      "evaluation",
      "assessment",
      "findings",
      "results",
      "data",
      "evidence",
      "statistics",
      "correlation",
      "causation",
      "variable",
      "parameter",
      "criterion",
      "factor",
      "element",
      "component",
      "aspect",
      "dimension",
    ],
    starters: [
      "This research demonstrates",
      "The study reveals",
      "According to the data",
      "Furthermore, analysis shows",
    ],
  },
  "casual-blog": {
    words: [
      "awesome",
      "amazing",
      "incredible",
      "fantastic",
      "wonderful",
      "great",
      "cool",
      "interesting",
      "fun",
      "exciting",
      "helpful",
      "useful",
      "practical",
      "simple",
      "easy",
      "quick",
      "fast",
      "efficient",
      "effective",
      "powerful",
      "smart",
      "clever",
      "creative",
      "innovative",
      "modern",
      "trendy",
      "popular",
      "viral",
      "trending",
      "hot",
      "fresh",
      "new",
      "latest",
      "updated",
      "improved",
      "better",
      "best",
      "top",
      "ultimate",
      "perfect",
      "ideal",
      "excellent",
      "outstanding",
      "remarkable",
      "impressive",
      "stunning",
      "beautiful",
      "gorgeous",
      "lovely",
    ],
    starters: ["Hey there!", "So here's the thing", "You know what's awesome?", "Let me tell you"],
  },
}

// Presets for quick generation
const textPresets: TextPreset[] = [
  {
    name: "Quick Paragraph",
    description: "Generate 1-3 paragraphs of classic Lorem Ipsum",
    settings: {
      textStyle: "classic-latin",
      paragraphCount: 2,
      sentencesPerParagraph: 4,
      wordsPerSentence: 12,
      outputFormat: "plain",
    },
  },
  {
    name: "Blog Post",
    description: "Casual blog-style content with title",
    settings: {
      textStyle: "casual-blog",
      paragraphCount: 5,
      sentencesPerParagraph: 3,
      wordsPerSentence: 15,
      includeTitle: true,
      titleStyle: "h1",
      outputFormat: "markdown",
    },
  },
  {
    name: "Business Document",
    description: "Formal business language for professional documents",
    settings: {
      textStyle: "business-formal",
      paragraphCount: 4,
      sentencesPerParagraph: 5,
      wordsPerSentence: 18,
      includeTitle: true,
      titleStyle: "h2",
      outputFormat: "html",
    },
  },
  {
    name: "Tech Article",
    description: "Technical jargon for technology content",
    settings: {
      textStyle: "tech-jargon",
      paragraphCount: 6,
      sentencesPerParagraph: 4,
      wordsPerSentence: 14,
      includeTitle: true,
      titleStyle: "h1",
      outputFormat: "markdown",
    },
  },
  {
    name: "Academic Paper",
    description: "Formal academic writing style",
    settings: {
      textStyle: "academic-paper",
      paragraphCount: 8,
      sentencesPerParagraph: 6,
      wordsPerSentence: 20,
      includeTitle: true,
      titleStyle: "h1",
      outputFormat: "plain",
    },
  },
  {
    name: "Creative Story",
    description: "Creative writing with descriptive language",
    settings: {
      textStyle: "creative-writing",
      paragraphCount: 7,
      sentencesPerParagraph: 4,
      wordsPerSentence: 16,
      includeTitle: true,
      titleStyle: "h1",
      outputFormat: "markdown",
    },
  },
]

// Text generation functions
const getRandomWord = (words: string[]): string => {
  return words[Math.floor(Math.random() * words.length)]
}

const getRandomStarter = (starters: string[]): string => {
  return starters[Math.floor(Math.random() * starters.length)]
}

const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const generateSentence = (
  words: string[],
  targetWordCount: number,
  includeNumbers: boolean = false,
  includePunctuation: boolean = true
): string => {
  const sentence: string[] = []

  for (let i = 0; i < targetWordCount; i++) {
    let word = getRandomWord(words)

    // Occasionally add numbers if enabled
    if (includeNumbers && Math.random() < 0.1) {
      word = Math.floor(Math.random() * 1000).toString()
    }

    // Add punctuation occasionally if enabled
    if (includePunctuation && i > 2 && i < targetWordCount - 1 && Math.random() < 0.15) {
      word += ","
    }

    sentence.push(word)
  }

  let result = sentence.join(" ")
  result = capitalizeFirst(result)

  // End with appropriate punctuation
  if (includePunctuation) {
    const endings = [".", ".", ".", "!", "?"] // Weighted toward periods
    result += endings[Math.floor(Math.random() * endings.length)]
  } else {
    result += "."
  }

  return result
}

const generateParagraph = (
  words: string[],
  starters: string[],
  sentenceCount: number,
  wordsPerSentence: number,
  startWithLorem: boolean = false,
  includeNumbers: boolean = false,
  includePunctuation: boolean = true
): string => {
  const sentences: string[] = []

  for (let i = 0; i < sentenceCount; i++) {
    if (i === 0 && startWithLorem && words === textLibraries["classic-latin"].words) {
      // Start with classic Lorem Ipsum
      sentences.push("Lorem ipsum dolor sit amet, consectetur adipiscing elit.")
    } else if (i === 0 && Math.random() < 0.3) {
      // Sometimes start with a preset starter
      const starter = getRandomStarter(starters)
      const remainingWords = Math.max(1, wordsPerSentence - starter.split(" ").length)
      const additionalWords = Array.from({ length: remainingWords }, () => getRandomWord(words)).join(" ")
      sentences.push(capitalizeFirst(`${starter} ${additionalWords}.`))
    } else {
      sentences.push(generateSentence(words, wordsPerSentence, includeNumbers, includePunctuation))
    }
  }

  return sentences.join(" ")
}

const generateTitle = (style: TextStyle, titleStyle: "h1" | "h2" | "h3" | "none"): string => {
  if (titleStyle === "none") return ""

  const titleWords = {
    "classic-latin": ["Lorem Ipsum Dolor", "Consectetur Adipiscing", "Sed Do Eiusmod"],
    "modern-english": ["The Quick Brown Fox", "Amazing Content Here", "Bright New Ideas"],
    "tech-jargon": ["Scalable Platform Solutions", "Innovative Framework Design", "Advanced Algorithm Implementation"],
    "business-formal": ["Strategic Business Initiative", "Corporate Growth Strategy", "Market Analysis Report"],
    "creative-writing": ["Whispers in the Moonlight", "The Enchanted Forest", "Dancing Shadows"],
    "academic-paper": ["Research Methodology Analysis", "Comprehensive Study Results", "Data-Driven Conclusions"],
    "casual-blog": ["Awesome Tips and Tricks", "Cool Things You Should Know", "Amazing Life Hacks"],
    custom: ["Custom Generated Title", "Your Content Here", "Generated Text Sample"],
  }

  const titles = titleWords[style] || titleWords["classic-latin"]
  const title = titles[Math.floor(Math.random() * titles.length)]

  return title
}

// Main text generation function
const generateText = (settings: GenerationSettings): GeneratedText => {
  const library =
    // 修复类型错误，确保 textLibraries 的索引类型安全
    (() => {
      if (settings.useCustomWords && settings.customWordList.length > 0) {
        return { words: settings.customWordList, starters: ["Custom text begins"] }
      }
      // 限定 textStyle 只取 textLibraries 已有的 key，否则回退 classic-latin
      if (Object.prototype.hasOwnProperty.call(textLibraries, settings.textStyle)) {
        return textLibraries[settings.textStyle as keyof typeof textLibraries]
      }
      return textLibraries["classic-latin"]
    })()

  const paragraphs: string[] = []

  // Generate title if requested
  let title = ""
  if (settings.includeTitle) {
    title = generateTitle(settings.textStyle, settings.titleStyle)
  }

  // Generate paragraphs
  for (let i = 0; i < settings.paragraphCount; i++) {
    const paragraph = generateParagraph(
      library.words,
      library.starters,
      settings.sentencesPerParagraph,
      settings.wordsPerSentence,
      settings.startWithLorem && i === 0,
      settings.includeNumbers,
      settings.includePunctuation
    )
    paragraphs.push(paragraph)
  }

  // Format output based on format type
  let content = ""
  const allText = paragraphs.join("\n\n")

  switch (settings.outputFormat) {
    case "html":
      if (title) {
        const titleTag = settings.titleStyle === "none" ? "h1" : settings.titleStyle
        content += `<${titleTag}>${title}</${titleTag}>\n\n`
      }
      content += paragraphs.map((p) => `<p>${p}</p>`).join("\n\n")
      break

    case "markdown":
      if (title) {
        const titlePrefix =
          settings.titleStyle === "h1"
            ? "# "
            : settings.titleStyle === "h2"
              ? "## "
              : settings.titleStyle === "h3"
                ? "### "
                : "# "
        content += `${titlePrefix}${title}\n\n`
      }
      content += allText
      break

    case "json":
      content = JSON.stringify(
        {
          title: title || null,
          paragraphs: paragraphs,
          metadata: {
            style: settings.textStyle,
            format: settings.outputFormat,
            paragraphCount: settings.paragraphCount,
            sentencesPerParagraph: settings.sentencesPerParagraph,
            wordsPerSentence: settings.wordsPerSentence,
            generatedAt: new Date().toISOString(),
          },
        },
        null,
        2
      )
      break

    default: // plain
      if (title) {
        content += `${title}\n\n`
      }
      content += allText
      break
  }

  // Calculate statistics
  const wordCount = allText.split(/\s+/).length
  const sentenceCount = allText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
  const characterCount = allText.length

  return {
    id: nanoid(),
    content,
    format: settings.outputFormat,
    style: settings.textStyle,
    wordCount,
    paragraphCount: settings.paragraphCount,
    sentenceCount,
    characterCount,
    generatedAt: new Date(),
  }
}

// Custom hooks
const useTextGeneration = () => {
  const generateTextContent = useCallback((settings: GenerationSettings): GeneratedText => {
    const validation = validateGenerationSettings(settings)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    return generateText(settings)
  }, [])

  const generateBatch = useCallback(
    (settingsArray: GenerationSettings[]): GeneratedText[] => {
      return settingsArray.map((settings) => generateTextContent(settings))
    },
    [generateTextContent]
  )

  return { generateTextContent, generateBatch }
}

// Real-time text generation hook
const useRealTimeGeneration = (settings: GenerationSettings) => {
  return useMemo(() => {
    try {
      return generateText(settings)
    } catch (error) {
      console.error("Real-time generation error:", error)
      return {
        id: nanoid(),
        content: "Error generating text",
        format: settings.outputFormat,
        style: settings.textStyle,
        wordCount: 0,
        paragraphCount: 0,
        sentenceCount: 0,
        characterCount: 0,
        generatedAt: new Date(),
      }
    }
  }, [settings])
}

// Export functionality
const useTextExport = () => {
  const exportText = useCallback((generatedText: GeneratedText, filename?: string) => {
    const extension =
      generatedText.format === "html"
        ? "html"
        : generatedText.format === "markdown"
          ? "md"
          : generatedText.format === "json"
            ? "json"
            : "txt"

    const mimeType =
      generatedText.format === "html"
        ? "text/html"
        : generatedText.format === "json"
          ? "application/json"
          : "text/plain"

    const blob = new Blob([generatedText.content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `lorem_ipsum_${generatedText.style}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback((generatedTexts: GeneratedText[]) => {
    const content = generatedTexts
      .map((text, index) => `=== Generated Text ${index + 1} (${text.style}) ===\n${text.content}\n`)
      .join("\n")

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "lorem_ipsum_batch.txt"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportCSV = useCallback((generatedTexts: GeneratedText[]) => {
    const headers = [
      "ID",
      "Style",
      "Format",
      "Word Count",
      "Paragraph Count",
      "Sentence Count",
      "Character Count",
      "Generated At",
    ]

    const rows = generatedTexts.map((text) => [
      text.id,
      text.style,
      text.format,
      text.wordCount,
      text.paragraphCount,
      text.sentenceCount,
      text.characterCount,
      text.generatedAt.toISOString(),
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "lorem_ipsum_stats.csv"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportText, exportBatch, exportCSV }
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

/**
 * Enhanced Lorem Ipsum Generator Tool
 * Features: Multiple text styles, batch generation, export capabilities, real-time generation
 */
const LoremIpsumCore = () => {
  const [generatedTexts, setGeneratedTexts] = useState<GeneratedText[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [settings, setSettings] = useState<GenerationSettings>({
    textStyle: "classic-latin",
    outputFormat: "plain",
    paragraphCount: 3,
    sentencesPerParagraph: 4,
    wordsPerSentence: 12,
    includeTitle: false,
    titleStyle: "h1",
    customWordList: [],
    useCustomWords: false,
    startWithLorem: true,
    includeNumbers: false,
    includePunctuation: true,
  })
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [customWords, setCustomWords] = useState("")

  const { generateTextContent, generateBatch } = useTextGeneration()
  const { exportText, exportBatch, exportCSV } = useTextExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Real-time preview generation
  const previewText = useRealTimeGeneration(settings)

  // Apply preset
  const applyPreset = useCallback((presetName: string) => {
    const preset = textPresets.find((p) => p.name === presetName)
    if (preset) {
      setSettings((prev) => ({ ...prev, ...preset.settings }))
      setSelectedPreset(presetName)
      toast.success(`Applied preset: ${presetName}`)
    }
  }, [])

  // Generate text
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)

    try {
      // Update custom word list if using custom words
      const currentSettings = {
        ...settings,
        customWordList: settings.useCustomWords
          ? customWords.split(/[\s,]+/).filter((word) => word.trim().length > 0)
          : [],
      }

      const generatedText = generateTextContent(currentSettings)
      setGeneratedTexts((prev) => [generatedText, ...prev])

      toast.success("Text generated successfully!")

      // Announce to screen readers
      const announcement = document.createElement("div")
      announcement.className = "sr-only"
      announcement.textContent = `Generated ${generatedText.wordCount} words in ${generatedText.paragraphCount} paragraphs`
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    } catch (error) {
      console.error("Generation failed:", error)
      toast.error(error instanceof Error ? error.message : "Failed to generate text")
    } finally {
      setIsGenerating(false)
    }
  }, [settings, customWords, generateTextContent])

  // Generate batch
  const handleBatchGenerate = useCallback(async () => {
    setIsGenerating(true)

    try {
      const batchSettings = textPresets.slice(0, 4).map((preset) => ({
        ...settings,
        ...preset.settings,
        customWordList: settings.useCustomWords
          ? customWords.split(/[\s,]+/).filter((word) => word.trim().length > 0)
          : [],
      }))

      const batchTexts = generateBatch(batchSettings)
      setGeneratedTexts((prev) => [...batchTexts, ...prev])

      toast.success(`Generated ${batchTexts.length} text variations!`)
    } catch (error) {
      console.error("Batch generation failed:", error)
      toast.error("Failed to generate batch texts")
    } finally {
      setIsGenerating(false)
    }
  }, [settings, customWords, generateBatch])

  // Clear all generated texts
  const clearAll = useCallback(() => {
    setGeneratedTexts([])
    toast.success("All generated texts cleared")
  }, [])

  // Remove specific text
  const removeText = useCallback((id: string) => {
    setGeneratedTexts((prev) => prev.filter((text) => text.id !== id))
  }, [])

  // 统计信息计算
  // @ts-ignore
  const stats: GenerationStats = useMemo(() => {
    return {
      totalGenerated: generatedTexts.length,
      totalWords: generatedTexts.reduce((sum, text) => sum + text.wordCount, 0),
      totalCharacters: generatedTexts.reduce((sum, text) => sum + text.characterCount, 0),
      averageWordsPerParagraph:
        generatedTexts.length > 0
          ? generatedTexts.reduce((sum, text) => sum + text.wordCount / text.paragraphCount, 0) / generatedTexts.length
          : 0,
      averageSentencesPerParagraph:
        generatedTexts.length > 0
          ? generatedTexts.reduce((sum, text) => sum + text.sentenceCount / text.paragraphCount, 0) /
            generatedTexts.length
          : 0,
      mostUsedStyle:
        generatedTexts.length > 0
          ? generatedTexts.reduce(
              (acc, text) => {
                acc[text.style] = (acc[text.style] || 0) + 1
                return acc
              },
              {} as Record<TextStyle, number>
            )
          : ({} as Record<TextStyle, number>),
      generationTime: 0, // This would be calculated during generation
    }
  }, [generatedTexts])

  const mostUsedStyleName =
    Object.entries(stats.mostUsedStyle).length > 0
      ? Object.entries(stats.mostUsedStyle).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
      : "none"

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
              <FileText className="h-5 w-5" />
              Lorem Ipsum Generator
            </CardTitle>
            <CardDescription>
              Generate placeholder text in multiple styles and formats. Supports real-time preview, batch generation,
              and export capabilities. Use keyboard navigation: Tab to move between controls, Enter or Space to activate
              buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Presets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 min-w-0">
              {textPresets.slice(0, 6).map((preset) => (
                <Button
                  key={preset.name}
                  variant={selectedPreset === preset.name ? "default" : "outline"}
                  onClick={() => applyPreset(preset.name)}
                  className="h-auto min-h-[64px] w-full p-3 text-left flex flex-col items-start justify-center"
                >
                  <span className="font-medium text-sm">{preset.name}</span>
                  <span className="text-xs text-muted-foreground mt-1 break-words whitespace-normal">
                    {preset.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Generation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="textStyle">Text Style</Label>
                <Select
                  value={settings.textStyle}
                  onValueChange={(value: TextStyle) => setSettings((prev) => ({ ...prev, textStyle: value }))}
                >
                  <SelectTrigger id="textStyle">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic-latin">Classic Latin</SelectItem>
                    <SelectItem value="modern-english">Modern English</SelectItem>
                    <SelectItem value="tech-jargon">Tech Jargon</SelectItem>
                    <SelectItem value="business-formal">Business Formal</SelectItem>
                    <SelectItem value="creative-writing">Creative Writing</SelectItem>
                    <SelectItem value="academic-paper">Academic Paper</SelectItem>
                    <SelectItem value="casual-blog">Casual Blog</SelectItem>
                    <SelectItem value="custom">Custom Words</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outputFormat">Output Format</Label>
                <Select
                  value={settings.outputFormat}
                  onValueChange={(value: OutputFormat) => setSettings((prev) => ({ ...prev, outputFormat: value }))}
                >
                  <SelectTrigger id="outputFormat">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plain">Plain Text</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="markdown">Markdown</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paragraphCount">Paragraphs</Label>
                <Input
                  id="paragraphCount"
                  type="number"
                  min="1"
                  max="100"
                  value={settings.paragraphCount}
                  onChange={(e) => setSettings((prev) => ({ ...prev, paragraphCount: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sentencesPerParagraph">Sentences per Paragraph</Label>
                <Input
                  id="sentencesPerParagraph"
                  type="number"
                  min="1"
                  max="20"
                  value={settings.sentencesPerParagraph}
                  onChange={(e) => setSettings((prev) => ({ ...prev, sentencesPerParagraph: Number(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wordsPerSentence">Words per Sentence</Label>
                <Input
                  id="wordsPerSentence"
                  type="number"
                  min="3"
                  max="50"
                  value={settings.wordsPerSentence}
                  onChange={(e) => setSettings((prev) => ({ ...prev, wordsPerSentence: Number(e.target.value) }))}
                />
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Advanced Options</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  {showAdvanced ? "Hide" : "Show"} Advanced
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        id="includeTitle"
                        type="checkbox"
                        checked={settings.includeTitle}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeTitle: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="includeTitle"
                        className="text-sm"
                      >
                        Include title
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="startWithLorem"
                        type="checkbox"
                        checked={settings.startWithLorem}
                        onChange={(e) => setSettings((prev) => ({ ...prev, startWithLorem: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="startWithLorem"
                        className="text-sm"
                      >
                        Start with "Lorem ipsum"
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="includeNumbers"
                        type="checkbox"
                        checked={settings.includeNumbers}
                        onChange={(e) => setSettings((prev) => ({ ...prev, includeNumbers: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="includeNumbers"
                        className="text-sm"
                      >
                        Include numbers
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="useCustomWords"
                        type="checkbox"
                        checked={settings.useCustomWords}
                        onChange={(e) => setSettings((prev) => ({ ...prev, useCustomWords: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label
                        htmlFor="useCustomWords"
                        className="text-sm"
                      >
                        Use custom word list
                      </Label>
                    </div>
                  </div>

                  {settings.includeTitle && (
                    <div className="space-y-2">
                      <Label htmlFor="titleStyle">Title Style</Label>
                      <Select
                        value={settings.titleStyle}
                        onValueChange={(value: "h1" | "h2" | "h3" | "none") =>
                          setSettings((prev) => ({ ...prev, titleStyle: value }))
                        }
                      >
                        <SelectTrigger id="titleStyle">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="h1">Heading 1</SelectItem>
                          <SelectItem value="h2">Heading 2</SelectItem>
                          <SelectItem value="h3">Heading 3</SelectItem>
                          <SelectItem value="none">No heading tag</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {settings.useCustomWords && (
                    <div className="space-y-2">
                      <Label htmlFor="customWords">Custom Words (comma or space separated)</Label>
                      <Textarea
                        id="customWords"
                        placeholder="Enter your custom words here..."
                        value={customWords}
                        onChange={(e) => setCustomWords(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Real-time Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-lg font-bold text-blue-600">{previewText.wordCount}</div>
                  <div className="text-xs text-muted-foreground">Words</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-lg font-bold text-green-600">{previewText.paragraphCount}</div>
                  <div className="text-xs text-muted-foreground">Paragraphs</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-lg font-bold text-purple-600">{previewText.sentenceCount}</div>
                  <div className="text-xs text-muted-foreground">Sentences</div>
                </div>
                <div className="text-center p-2 bg-muted/30 rounded">
                  <div className="text-lg font-bold text-orange-600">{previewText.characterCount}</div>
                  <div className="text-xs text-muted-foreground">Characters</div>
                </div>
              </div>

              <div className="relative">
                <div className="p-4 bg-background border rounded-lg max-h-60 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono">
                    {previewText.content.substring(0, 500)}
                    {previewText.content.length > 500 && "..."}
                  </pre>
                </div>
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(previewText.content, "preview")}
                  >
                    {copiedText === "preview" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="min-w-32"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Generate Text
                  </>
                )}
              </Button>

              <Button
                onClick={handleBatchGenerate}
                variant="outline"
                disabled={isGenerating}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Batch Generate
              </Button>

              {generatedTexts.length > 0 && (
                <>
                  <Button
                    onClick={() => exportBatch(generatedTexts)}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export All
                  </Button>

                  <Button
                    onClick={() => exportCSV(generatedTexts)}
                    variant="outline"
                  >
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Export Stats
                  </Button>

                  <Button
                    onClick={clearAll}
                    variant="destructive"
                    disabled={isGenerating}
                  >
                    Clear All
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {generatedTexts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalGenerated}</div>
                  <div className="text-sm text-muted-foreground">Generated Texts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalWords.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.totalCharacters.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Total Characters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.averageWordsPerParagraph.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Avg Words/Para</div>
                </div>
              </div>

              {mostUsedStyleName !== "none" && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <div className="text-center">
                    <span className="text-blue-700 dark:text-blue-400 font-semibold">
                      Most used style: {mostUsedStyleName.replace("-", " ")}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generated Texts */}
        {generatedTexts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Generated Texts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedTexts.map((text) => (
                  <div
                    key={text.id}
                    className="border rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{text.style.replace("-", " ")}</span>
                          <span className="text-xs px-2 py-1 bg-muted rounded">{text.format}</span>
                          <span className="text-xs text-muted-foreground">{text.generatedAt.toLocaleTimeString()}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {text.wordCount} words • {text.paragraphCount} paragraphs • {text.sentenceCount} sentences
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(text.content, text.id)}
                        >
                          {copiedText === text.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportText(text)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeText(text.id)}
                        >
                          ×
                        </Button>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded border max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">
                        {text.content.substring(0, 300)}
                        {text.content.length > 300 && "..."}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// Main component with error boundary
const LoremIpsum = () => {
  return <LoremIpsumCore />
}

export default LoremIpsum
