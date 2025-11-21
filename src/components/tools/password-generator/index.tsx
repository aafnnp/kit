import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Target,
  Copy,
  Check,
  Eye,
  EyeOff,
  Shuffle,
  Shield,
  Zap,
  Settings,
  CheckCircle2,
  Lock,
  Key,
  RefreshCw,
  History,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  PasswordItem,
  PasswordStrength,
  PasswordRequirement,
  PasswordSettings,
  PasswordTemplate,
  PasswordBatch,
  PasswordStatistics,
  PasswordHistory,
  PasswordType,
  ExportFormat,
} from '@/types/password-generator'
// Utility functions

const validatePasswordSettings = (settings: PasswordSettings): { isValid: boolean; error?: string } => {
  if (settings.length < 4 || settings.length > 128) {
    return { isValid: false, error: 'Password length must be between 4 and 128 characters' }
  }

  if (
    !settings.includeUppercase &&
    !settings.includeLowercase &&
    !settings.includeNumbers &&
    !settings.includeSymbols &&
    !settings.customCharacters
  ) {
    return { isValid: false, error: 'At least one character type must be selected' }
  }

  return { isValid: true }
}

const formatTimeToCrack = (seconds: number): string => {
  if (seconds < 1) return 'Instant'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`
  return 'Centuries'
}

const calculateEntropy = (password: string, characterSet: string): number => {
  const charsetSize = characterSet.length
  return Math.log2(Math.pow(charsetSize, password.length))
}

// Character sets for password generation
const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  similar: 'il1Lo0O',
  ambiguous: '{}[]()/\\\'"`~,;.<>',
  pronounceable: {
    consonants: 'bcdfghjklmnpqrstvwxyz',
    vowels: 'aeiou',
  },
}

const COMMON_WORDS = [
  'apple',
  'banana',
  'cherry',
  'dragon',
  'eagle',
  'forest',
  'garden',
  'happy',
  'island',
  'jungle',
  'kitten',
  'lemon',
  'mountain',
  'nature',
  'ocean',
  'purple',
  'quiet',
  'rainbow',
  'sunset',
  'tiger',
  'umbrella',
  'violet',
  'winter',
  'yellow',
  'zebra',
  'bridge',
  'castle',
  'dream',
  'energy',
  'freedom',
  'golden',
  'harmony',
]

// Build character set based on settings
const buildCharacterSet = (settings: PasswordSettings): string => {
  let charset = ''

  if (settings.includeUppercase) charset += CHARACTER_SETS.uppercase
  if (settings.includeLowercase) charset += CHARACTER_SETS.lowercase
  if (settings.includeNumbers) charset += CHARACTER_SETS.numbers
  if (settings.includeSymbols) charset += CHARACTER_SETS.symbols
  if (settings.customCharacters) charset += settings.customCharacters

  // Remove similar characters if requested
  if (settings.excludeSimilar) {
    charset = charset
      .split('')
      .filter((char) => !CHARACTER_SETS.similar.includes(char))
      .join('')
  }

  // Remove ambiguous characters if requested
  if (settings.excludeAmbiguous) {
    charset = charset
      .split('')
      .filter((char) => !CHARACTER_SETS.ambiguous.includes(char))
      .join('')
  }

  // Remove duplicates
  return [...new Set(charset)].join('')
}

// Generate random password
const generateRandomPassword = (settings: PasswordSettings): string => {
  const charset = buildCharacterSet(settings)

  if (charset.length === 0) {
    throw new Error('No characters available for password generation')
  }

  let password = ''
  const crypto = window.crypto || (window as any).msCrypto

  if (crypto && crypto.getRandomValues) {
    // Use cryptographically secure random number generator
    const array = new Uint32Array(settings.length)
    crypto.getRandomValues(array)

    for (let i = 0; i < settings.length; i++) {
      password += charset[array[i] % charset.length]
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < settings.length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }
  }

  return password
}

// Generate memorable password
const generateMemorablePassword = (settings: PasswordSettings): string => {
  const words = []
  const wordCount = Math.max(2, Math.min(settings.wordCount || 4, 8))

  for (let i = 0; i < wordCount; i++) {
    let word = COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)]

    // Randomly capitalize
    if (settings.includeUppercase && Math.random() > 0.5) {
      word = word.charAt(0).toUpperCase() + word.slice(1)
    }

    words.push(word)
  }

  let password = words.join(settings.separator || '-')

  // Add numbers if requested
  if (settings.includeNumbers) {
    const numbers = Math.floor(Math.random() * 999) + 1
    password += numbers.toString()
  }

  // Add symbols if requested
  if (settings.includeSymbols) {
    const symbols = '!@#$%'
    password += symbols[Math.floor(Math.random() * symbols.length)]
  }

  return password
}

// Generate PIN
const generatePIN = (settings: PasswordSettings): string => {
  let pin = ''
  const length = Math.max(4, Math.min(settings.length, 12))

  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10).toString()
  }

  return pin
}

// Generate passphrase
const generatePassphrase = (settings: PasswordSettings): string => {
  const wordCount = Math.max(4, Math.min(settings.wordCount || 6, 12))
  const words = []

  for (let i = 0; i < wordCount; i++) {
    words.push(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)])
  }

  return words.join(' ')
}

// Generate pronounceable password
const generatePronounceablePassword = (settings: PasswordSettings): string => {
  const { consonants, vowels } = CHARACTER_SETS.pronounceable
  let password = ''
  const length = settings.length

  for (let i = 0; i < length; i++) {
    if (i % 2 === 0) {
      // Add consonant
      password += consonants[Math.floor(Math.random() * consonants.length)]
    } else {
      // Add vowel
      password += vowels[Math.floor(Math.random() * vowels.length)]
    }
  }

  // Capitalize first letter if uppercase is enabled
  if (settings.includeUppercase && password.length > 0) {
    password = password.charAt(0).toUpperCase() + password.slice(1)
  }

  // Add numbers if requested
  if (settings.includeNumbers) {
    const numCount = Math.max(1, Math.floor(length * 0.2))
    for (let i = 0; i < numCount; i++) {
      const pos = Math.floor(Math.random() * password.length)
      const num = Math.floor(Math.random() * 10)
      password = password.slice(0, pos) + num + password.slice(pos + 1)
    }
  }

  return password
}

// Generate password based on type
const generatePassword = (type: PasswordType, settings: PasswordSettings): string => {
  switch (type) {
    case 'random':
      return generateRandomPassword(settings)
    case 'memorable':
      return generateMemorablePassword(settings)
    case 'pin':
      return generatePIN(settings)
    case 'passphrase':
      return generatePassphrase(settings)
    case 'pronounceable':
      return generatePronounceablePassword(settings)
    case 'custom':
      return generateRandomPassword(settings) // Use custom charset
    default:
      return generateRandomPassword(settings)
  }
}

// Analyze password strength
const analyzePasswordStrength = (password: string): PasswordStrength => {
  const requirements: PasswordRequirement[] = [
    {
      name: 'Length',
      met: password.length >= 12,
      description: 'At least 12 characters',
      weight: 25,
    },
    {
      name: 'Uppercase',
      met: /[A-Z]/.test(password),
      description: 'Contains uppercase letters',
      weight: 15,
    },
    {
      name: 'Lowercase',
      met: /[a-z]/.test(password),
      description: 'Contains lowercase letters',
      weight: 15,
    },
    {
      name: 'Numbers',
      met: /\d/.test(password),
      description: 'Contains numbers',
      weight: 15,
    },
    {
      name: 'Symbols',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      description: 'Contains special characters',
      weight: 20,
    },
    {
      name: 'No Common Patterns',
      met: !/(123|abc|password|qwerty|admin)/i.test(password),
      description: 'Avoids common patterns',
      weight: 10,
    },
  ]

  const metRequirements = requirements.filter((req) => req.met)
  const score = metRequirements.reduce((sum, req) => sum + req.weight, 0)

  let level: PasswordStrength['level'] = 'very-weak'
  if (score >= 90) level = 'very-strong'
  else if (score >= 75) level = 'strong'
  else if (score >= 60) level = 'good'
  else if (score >= 40) level = 'fair'
  else if (score >= 20) level = 'weak'

  const feedback: string[] = []
  requirements.forEach((req) => {
    if (!req.met) {
      feedback.push(req.description)
    }
  })

  // Calculate entropy
  const charset = buildCharacterSet({
    length: password.length,
    includeUppercase: /[A-Z]/.test(password),
    includeLowercase: /[a-z]/.test(password),
    includeNumbers: /\d/.test(password),
    includeSymbols: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    excludeSimilar: false,
    excludeAmbiguous: false,
    customCharacters: '',
    pattern: '',
    wordCount: 4,
    separator: '-',
    minLength: 8,
    maxLength: 128,
  })

  const entropy = calculateEntropy(password, charset)

  // Estimate time to crack (simplified calculation)
  const attemptsPerSecond = 1000000000 // 1 billion attempts per second
  const possibleCombinations = Math.pow(charset.length, password.length)
  const secondsToCrack = possibleCombinations / (2 * attemptsPerSecond)
  const timeToCrack = formatTimeToCrack(secondsToCrack)

  return {
    score,
    level,
    feedback,
    requirements,
    entropy,
    timeToCrack,
  }
}

// Password templates with different security levels
const passwordTemplates: PasswordTemplate[] = [
  {
    id: 'strong-random',
    name: 'Strong Random',
    description: 'Cryptographically secure random password',
    category: 'Security',
    settings: {
      length: 16,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
      excludeAmbiguous: false,
    },
    type: 'random',
    securityLevel: 'very-high',
  },
  {
    id: 'memorable-secure',
    name: 'Memorable & Secure',
    description: 'Easy to remember but still secure',
    category: 'Memorable',
    settings: {
      wordCount: 4,
      separator: '-',
      includeNumbers: true,
      includeSymbols: false,
      includeUppercase: true,
      includeLowercase: true,
    },
    type: 'memorable',
    securityLevel: 'high',
  },
  {
    id: 'maximum-security',
    name: 'Maximum Security',
    description: 'Highest security for sensitive accounts',
    category: 'Maximum',
    settings: {
      length: 32,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
      excludeSimilar: true,
      excludeAmbiguous: true,
    },
    type: 'random',
    securityLevel: 'maximum',
  },
  {
    id: 'pronounceable',
    name: 'Pronounceable',
    description: 'Easy to pronounce and type',
    category: 'Usability',
    settings: {
      length: 12,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false,
    },
    type: 'pronounceable',
    securityLevel: 'medium',
  },
  {
    id: 'passphrase',
    name: 'Passphrase',
    description: 'Multiple words for high security',
    category: 'Passphrase',
    settings: {
      wordCount: 6,
      separator: ' ',
      includeNumbers: false,
      includeSymbols: false,
      includeUppercase: false,
      includeLowercase: true,
    },
    type: 'passphrase',
    securityLevel: 'high',
  },
  {
    id: 'pin-secure',
    name: 'Secure PIN',
    description: 'Numeric PIN for devices',
    category: 'PIN',
    settings: {
      length: 6,
      includeNumbers: true,
      includeUppercase: false,
      includeLowercase: false,
      includeSymbols: false,
    },
    type: 'pin',
    securityLevel: 'low',
  },
]

// Custom hooks
const usePasswordGeneration = () => {
  const generateSinglePassword = useCallback((type: PasswordType, settings: PasswordSettings): PasswordItem => {
    try {
      const validation = validatePasswordSettings(settings)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      const password = generatePassword(type, settings)
      const strength = analyzePasswordStrength(password)
      const charset = buildCharacterSet(settings)
      const entropy = calculateEntropy(password, charset)

      return {
        id: nanoid(),
        password,
        type,
        strength,
        entropy,
        createdAt: new Date(),
        settings,
      }
    } catch (error) {
      console.error('Password generation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Password generation failed')
    }
  }, [])

  const generateBatch = useCallback(
    (type: PasswordType, settings: PasswordSettings, count: number): PasswordBatch => {
      try {
        const passwords: PasswordItem[] = []

        for (let i = 0; i < count; i++) {
          const passwordItem = generateSinglePassword(type, settings)
          passwords.push(passwordItem)
        }

        const statistics: PasswordStatistics = {
          totalGenerated: passwords.length,
          averageStrength: passwords.reduce((sum, p) => sum + p.strength.score, 0) / passwords.length,
          averageEntropy: passwords.reduce((sum, p) => sum + p.entropy, 0) / passwords.length,
          strengthDistribution: passwords.reduce(
            (acc, p) => {
              acc[p.strength.level] = (acc[p.strength.level] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          typeDistribution: passwords.reduce(
            (acc, p) => {
              acc[p.type] = (acc[p.type] || 0) + 1
              return acc
            },
            {} as Record<string, number>
          ),
          characterDistribution: {},
          patternAnalysis: {
            commonPatterns: [],
            uniqueCharacters: 0,
            repetitionScore: 0,
            sequenceScore: 0,
            dictionaryScore: 0,
          },
        }

        return {
          id: nanoid(),
          passwords,
          count,
          type,
          settings,
          createdAt: new Date(),
          statistics,
        }
      } catch (error) {
        console.error('Batch generation error:', error)
        throw new Error(error instanceof Error ? error.message : 'Batch generation failed')
      }
    },
    [generateSinglePassword]
  )

  return { generateSinglePassword, generateBatch }
}

// Password history management
const usePasswordHistory = () => {
  const [history, setHistory] = useState<PasswordHistory[]>([])

  const addToHistory = useCallback((password: PasswordItem) => {
    const historyItem: PasswordHistory = {
      id: nanoid(),
      password: password.password,
      type: password.type,
      strength: password.strength,
      createdAt: password.createdAt,
      used: false,
    }

    setHistory((prev) => [historyItem, ...prev.slice(0, 49)]) // Keep last 50
  }, [])

  const markAsUsed = useCallback((id: string) => {
    setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, used: true } : item)))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  return { history, addToHistory, markAsUsed, clearHistory }
}

// Export functionality
const usePasswordExport = () => {
  const exportPasswords = useCallback((passwords: PasswordItem[], format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(passwords, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromPasswords(passwords)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'xml':
        content = generateXMLFromPasswords(passwords)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'txt':
      default:
        content = generateTextFromPasswords(passwords)
        mimeType = 'text/plain'
        extension = '.txt'
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `passwords${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback(
    (batch: PasswordBatch) => {
      exportPasswords(batch.passwords, 'json', `password-batch-${batch.id}.json`)
      toast.success(`Exported ${batch.passwords.length} passwords`)
    },
    [exportPasswords]
  )

  const exportStatistics = useCallback((batches: PasswordBatch[]) => {
    const stats = batches.map((batch) => ({
      batchId: batch.id,
      passwordCount: batch.count,
      type: batch.type,
      averageStrength: batch.statistics.averageStrength.toFixed(2),
      averageEntropy: batch.statistics.averageEntropy.toFixed(2),
      createdAt: batch.createdAt.toISOString(),
    }))

    const csvContent = [
      ['Batch ID', 'Password Count', 'Type', 'Average Strength', 'Average Entropy', 'Created At'],
      ...stats.map((stat) => [
        stat.batchId,
        stat.passwordCount.toString(),
        stat.type,
        stat.averageStrength,
        stat.averageEntropy,
        stat.createdAt,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'password-statistics.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Statistics exported')
  }, [])

  return { exportPasswords, exportBatch, exportStatistics }
}

// Generate export formats
const generateTextFromPasswords = (passwords: PasswordItem[]): string => {
  return `Password Generation Report
==========================

Generated: ${new Date().toLocaleString()}
Total Passwords: ${passwords.length}

Passwords:
${passwords.map((p, i) => `${i + 1}. ${p.password} (${p.type}, ${p.strength.level}, ${p.entropy.toFixed(1)} bits)`).join('\n')}

Statistics:
- Average Strength: ${(passwords.reduce((sum, p) => sum + p.strength.score, 0) / passwords.length).toFixed(1)}/100
- Average Entropy: ${(passwords.reduce((sum, p) => sum + p.entropy, 0) / passwords.length).toFixed(1)} bits
`
}

const generateCSVFromPasswords = (passwords: PasswordItem[]): string => {
  const rows = [
    ['Password', 'Type', 'Strength Level', 'Strength Score', 'Entropy', 'Created At'],
    ...passwords.map((p) => [
      p.password,
      p.type,
      p.strength.level,
      p.strength.score.toString(),
      p.entropy.toFixed(2),
      p.createdAt.toISOString(),
    ]),
  ]

  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
}

const generateXMLFromPasswords = (passwords: PasswordItem[]): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<passwords>
  <metadata>
    <generated>${new Date().toISOString()}</generated>
    <count>${passwords.length}</count>
  </metadata>
  <items>
    ${passwords
      .map(
        (p) => `
    <password>
      <value>${p.password}</value>
      <type>${p.type}</type>
      <strength>
        <level>${p.strength.level}</level>
        <score>${p.strength.score}</score>
        <entropy>${p.entropy}</entropy>
      </strength>
      <createdAt>${p.createdAt.toISOString()}</createdAt>
    </password>`
      )
      .join('')}
  </items>
</passwords>`
}

// Copy to clipboard functionality
const useCopyToClipboard = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(label || 'text')
      toast.success(`${label || 'Text'} copied to clipboard`)

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedText(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }, [])

  return { copyToClipboard, copiedText }
}

/**
 * Enhanced Password Generator Tool
 * Features: Multiple password types, strength analysis, batch generation, comprehensive security
 */
const PasswordGeneratorCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'batch' | 'history'>('generator')
  const [currentPassword, setCurrentPassword] = useState<PasswordItem | null>(null)
  const [passwordType, setPasswordType] = useState<PasswordType>('random')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('strong-random')
  const [showPassword, setShowPassword] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [batches, setBatches] = useState<PasswordBatch[]>([])
  const [batchCount, setBatchCount] = useState(10)
  const [settings, setSettings] = useState<PasswordSettings>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: true,
    excludeAmbiguous: false,
    customCharacters: '',
    pattern: '',
    wordCount: 4,
    separator: '-',
    minLength: 8,
    maxLength: 128,
  })

  const { generateSinglePassword, generateBatch } = usePasswordGeneration()
  const { exportPasswords, exportBatch } = usePasswordExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()
  const { history, addToHistory, markAsUsed, clearHistory } = usePasswordHistory()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = passwordTemplates.find((t) => t.id === templateId)
    if (template && template.settings) {
      setSettings((prev) => ({ ...prev, ...template.settings }))
      setPasswordType(template.type)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate single password
  const handleGeneratePassword = useCallback(async () => {
    setIsGenerating(true)
    try {
      const passwordItem = generateSinglePassword(passwordType, settings)
      setCurrentPassword(passwordItem)
      addToHistory(passwordItem)
      toast.success('Password generated successfully')
    } catch (error) {
      toast.error('Failed to generate password')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }, [passwordType, settings, generateSinglePassword, addToHistory])

  // Generate batch of passwords
  const handleGenerateBatch = useCallback(async () => {
    setIsGenerating(true)
    try {
      const batch = generateBatch(passwordType, settings, batchCount)
      setBatches((prev) => [batch, ...prev])
      toast.success(`Generated ${batchCount} passwords successfully`)
    } catch (error) {
      toast.error('Failed to generate password batch')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }, [passwordType, settings, batchCount, generateBatch])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Skip link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <div id="main-content" className="flex flex-col gap-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Generator & Security Analysis
            </CardTitle>
            <CardDescription>
              Advanced password generation tool with multiple types, strength analysis, and security recommendations.
              Generate secure passwords for all your accounts with comprehensive security analysis. Use keyboard
              navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'generator' | 'batch' | 'history')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Password Generator
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Shuffle className="h-4 w-4" />
              Batch Generation
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Password History
            </TabsTrigger>
          </TabsList>

          {/* Password Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            {/* Password Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Password Templates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {passwordTemplates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate === template.id ? 'default' : 'outline'}
                      onClick={() => applyTemplate(template.id)}
                      className="h-auto p-3 text-left"
                    >
                      <div className="w-full">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        <div className="text-xs font-mono mt-2 p-1 bg-muted/30 rounded flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          {template.type} • {template.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Password Generation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Password Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="password-type" className="text-sm font-medium">
                      Password Type
                    </Label>
                    <Select value={passwordType} onValueChange={(value: PasswordType) => setPasswordType(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="random">Random</SelectItem>
                        <SelectItem value="memorable">Memorable</SelectItem>
                        <SelectItem value="pronounceable">Pronounceable</SelectItem>
                        <SelectItem value="passphrase">Passphrase</SelectItem>
                        <SelectItem value="pin">PIN</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(passwordType === 'random' || passwordType === 'pronounceable' || passwordType === 'custom') && (
                    <div>
                      <Label htmlFor="password-length" className="text-sm font-medium">
                        Length: {settings.length}
                      </Label>
                      <Slider
                        id="password-length"
                        min={4}
                        max={128}
                        step={1}
                        value={[settings.length]}
                        onValueChange={(value) => setSettings((prev) => ({ ...prev, length: value[0] }))}
                        className="mt-2"
                      />
                    </div>
                  )}

                  {(passwordType === 'memorable' || passwordType === 'passphrase') && (
                    <>
                      <div>
                        <Label htmlFor="word-count" className="text-sm font-medium">
                          Word Count: {settings.wordCount}
                        </Label>
                        <Slider
                          id="word-count"
                          min={2}
                          max={12}
                          step={1}
                          value={[settings.wordCount]}
                          onValueChange={(value) => setSettings((prev) => ({ ...prev, wordCount: value[0] }))}
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="separator" className="text-sm font-medium">
                          Separator
                        </Label>
                        <Input
                          id="separator"
                          value={settings.separator}
                          onChange={(e) => setSettings((prev) => ({ ...prev, separator: e.target.value }))}
                          className="mt-2"
                          placeholder="e.g., -, _, space"
                        />
                      </div>
                    </>
                  )}

                  {passwordType !== 'pin' && passwordType !== 'passphrase' && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Character Types</Label>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-uppercase"
                          type="checkbox"
                          checked={settings.includeUppercase}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeUppercase: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-uppercase" className="text-sm">
                          Uppercase letters (A-Z)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-lowercase"
                          type="checkbox"
                          checked={settings.includeLowercase}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeLowercase: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-lowercase" className="text-sm">
                          Lowercase letters (a-z)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-numbers"
                          type="checkbox"
                          checked={settings.includeNumbers}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeNumbers: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-numbers" className="text-sm">
                          Numbers (0-9)
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-symbols"
                          type="checkbox"
                          checked={settings.includeSymbols}
                          onChange={(e) => setSettings((prev) => ({ ...prev, includeSymbols: e.target.checked }))}
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-symbols" className="text-sm">
                          Symbols (!@#$%^&*)
                        </Label>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Advanced Options</Label>

                    <div className="flex items-center space-x-2">
                      <input
                        id="exclude-similar"
                        type="checkbox"
                        checked={settings.excludeSimilar}
                        onChange={(e) => setSettings((prev) => ({ ...prev, excludeSimilar: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="exclude-similar" className="text-sm">
                        Exclude similar characters (il1Lo0O)
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        id="exclude-ambiguous"
                        type="checkbox"
                        checked={settings.excludeAmbiguous}
                        onChange={(e) => setSettings((prev) => ({ ...prev, excludeAmbiguous: e.target.checked }))}
                        className="rounded border-input"
                      />
                      <Label htmlFor="exclude-ambiguous" className="text-sm">
                        Exclude ambiguous characters
                      </Label>
                    </div>
                  </div>

                  {passwordType === 'custom' && (
                    <div>
                      <Label htmlFor="custom-characters" className="text-sm font-medium">
                        Custom Characters
                      </Label>
                      <Input
                        id="custom-characters"
                        value={settings.customCharacters}
                        onChange={(e) => setSettings((prev) => ({ ...prev, customCharacters: e.target.value }))}
                        className="mt-2"
                        placeholder="Enter custom character set"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Generated Password */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Generated Password
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Password</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="relative">
                      <Input
                        value={currentPassword?.password || ''}
                        readOnly
                        type={showPassword ? 'text' : 'password'}
                        className="font-mono text-lg pr-10"
                        placeholder="Click generate to create a password"
                      />
                      {currentPassword && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => copyToClipboard(currentPassword.password, 'Password')}
                        >
                          {copiedText === 'Password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Password Strength */}
                  {currentPassword && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span>Password Strength:</span>
                          <span
                            className={`font-medium ${
                              currentPassword.strength.level === 'very-strong'
                                ? 'text-green-600'
                                : currentPassword.strength.level === 'strong'
                                  ? 'text-blue-600'
                                  : currentPassword.strength.level === 'good'
                                    ? 'text-yellow-600'
                                    : currentPassword.strength.level === 'fair'
                                      ? 'text-orange-600'
                                      : 'text-red-600'
                            }`}
                          >
                            {currentPassword.strength.level.toUpperCase()} ({currentPassword.strength.score}/100)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              currentPassword.strength.level === 'very-strong'
                                ? 'bg-green-600'
                                : currentPassword.strength.level === 'strong'
                                  ? 'bg-blue-600'
                                  : currentPassword.strength.level === 'good'
                                    ? 'bg-yellow-600'
                                    : currentPassword.strength.level === 'fair'
                                      ? 'bg-orange-600'
                                      : 'bg-red-600'
                            }`}
                            style={{ width: `${currentPassword.strength.score}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Entropy:</span> {currentPassword.entropy.toFixed(1)} bits
                        </div>
                        <div>
                          <span className="font-medium">Time to crack:</span> {currentPassword.strength.timeToCrack}
                        </div>
                      </div>

                      {currentPassword.strength.feedback.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Suggestions:</span>{' '}
                          {currentPassword.strength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleGeneratePassword} disabled={isGenerating} className="flex-1">
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      Generate Password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Batch Generation Tab */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shuffle className="h-5 w-5" />
                  Batch Password Generation
                </CardTitle>
                <CardDescription>Generate multiple passwords at once for different accounts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="batch-count" className="text-sm font-medium">
                      Number of Passwords: {batchCount}
                    </Label>
                    <Slider
                      id="batch-count"
                      min={1}
                      max={100}
                      step={1}
                      value={[batchCount]}
                      onValueChange={(value) => setBatchCount(value[0])}
                      className="mt-2"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleGenerateBatch} disabled={isGenerating}>
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Zap className="mr-2 h-4 w-4" />
                      )}
                      Generate {batchCount} Passwords
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Batch Results */}
            {batches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Generated Batches ({batches.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {batches.map((batch) => (
                      <div key={batch.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium">
                              {batch.count} {batch.type} passwords
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              Generated: {batch.createdAt.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => exportBatch(batch)}>
                              <Download className="mr-2 h-4 w-4" />
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setBatches((prev) => prev.filter((b) => b.id !== batch.id))}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                          {batch.passwords.map((password) => (
                            <div key={password.id} className="text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-mono truncate flex-1 mr-2">
                                  {showPassword ? password.password : '••••••••••••'}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(password.password, 'Password')}
                                  className="h-6 w-6 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                              <div
                                className={`text-xs ${
                                  password.strength.level === 'very-strong'
                                    ? 'text-green-600'
                                    : password.strength.level === 'strong'
                                      ? 'text-blue-600'
                                      : password.strength.level === 'good'
                                        ? 'text-yellow-600'
                                        : password.strength.level === 'fair'
                                          ? 'text-orange-600'
                                          : 'text-red-600'
                                }`}
                              >
                                {password.strength.level} ({password.strength.score}/100)
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 pt-3 border-t text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="font-medium">Average Strength:</span>{' '}
                              {batch.statistics.averageStrength.toFixed(1)}/100
                            </div>
                            <div>
                              <span className="font-medium">Average Entropy:</span>{' '}
                              {batch.statistics.averageEntropy.toFixed(1)} bits
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Password History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Password History ({history.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    {history.length > 0 && (
                      <>
                        <Button
                          onClick={() =>
                            exportPasswords(
                              history.map((h) => ({
                                id: h.id,
                                password: h.password,
                                type: h.type,
                                strength: h.strength,
                                entropy: h.strength.entropy,
                                createdAt: h.createdAt,
                                settings,
                              })),
                              'json'
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                        <Button onClick={clearHistory} variant="outline" size="sm">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Password History</h3>
                    <p className="text-muted-foreground mb-4">Generated passwords will appear here for easy access</p>
                    <Button onClick={() => setActiveTab('generator')} variant="outline">
                      Generate Your First Password
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {history.map((item) => (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm truncate">
                                {showPassword ? item.password : '••••••••••••'}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded ${
                                  item.strength.level === 'very-strong'
                                    ? 'bg-green-100 text-green-800'
                                    : item.strength.level === 'strong'
                                      ? 'bg-blue-100 text-blue-800'
                                      : item.strength.level === 'good'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : item.strength.level === 'fair'
                                          ? 'bg-orange-100 text-orange-800'
                                          : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.strength.level}
                              </span>
                              {item.used && (
                                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">Used</span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.type} • {item.createdAt.toLocaleString()}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(item.password, 'Password')}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {!item.used && (
                              <Button size="sm" variant="ghost" onClick={() => markAsUsed(item.id)}>
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Main component with error boundary
const PasswordGenerator = () => {
  return <PasswordGeneratorCore />
}

export default PasswordGenerator
