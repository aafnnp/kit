// ==================== Password Strength Types ====================

/**
 * Password Level type
 */
export type passwordLevel = "very-weak" | "weak" | "fair" | "good" | "strong" | "very-strong"

/**
 * Check Category type
 */
export type checkCategory = "length" | "complexity" | "patterns" | "dictionary"

/**
 * Password Feedback type
 */
export interface passwordFeedback {
  warning?: string
  suggestions: string[],
  positives: string[],
}

/**
 * Crack Time Estimate type
 */
export interface crackTimeEstimate {
  onlineThrottling: string,
  onlineNoThrottling: string,
  offlineSlowHashing: string,
  offlineFastHashing: string,
}

/**
 * Password Check type
 */
export interface passwordCheck {
  id: string,
  name: string,
  description: string,
  passed: boolean,
  weight: number,
  category: checkCategory,
}

/**
 * Password Strength Result type
 */
export interface passwordStrengthResult {
  score: number,
  level: passwordLevel,
  feedback: passwordFeedback,
  entropy: number,
  crackTime: crackTimeEstimate,
  checks: passwordCheck[],
}

/**
 * Password Pattern type
 */
export interface passwordPattern {
  id: string,
  name: string,
  regex: RegExp,
  description: string,
  penalty: number,
}

/**
 * Password Rule type (validator function cannot be serialized)
 */
export interface passwordRule {
  id: string,
  name: string,
  description: string,
  validator: (password: string) => boolean,
  weight: number,
}

/**
 * Password Policy type
 */
export interface passwordPolicy {
  id: string,
  name: string,
  description: string,
  minLength: number
  maxLength?: number
  requireUppercase: boolean,
  requireLowercase: boolean,
  requireNumbers: boolean,
  requireSymbols: boolean,
  forbiddenPatterns: string[]
  customRules?: passwordRule[]
}

/**
 * Password Generation Options type
 */
export interface passwordGenerationOptions {
  length: number,
  includeUppercase: boolean,
  includeLowercase: boolean,
  includeNumbers: boolean,
  includeSymbols: boolean,
  excludeSimilar: boolean,
  excludeAmbiguous: boolean
  customCharset?: string
}

/**
 * Generated Password type
 */
export interface generatedPassword {
  id: string,
  password: string,
  strength: passwordStrengthResult,
  options: passwordGenerationOptions,
  createdAt: number,
}

/**
 * Password History Entry type
 */
export interface passwordHistoryEntry {
  id: string,
  password: string,
  strength: passwordStrengthResult,
  timestamp: number,
}

/**
 * Password Strength State type
 */
export interface passwordStrengthState {
  password: string
  result?: passwordStrengthResult
  selectedPolicy?: passwordPolicy
  showPassword: boolean,
  generatedPasswords: generatedPassword[],
  history: passwordHistoryEntry[],
}

// ==================== Type Exports ====================

export type PasswordLevel = passwordLevel
export type CheckCategory = checkCategory
export type PasswordFeedback = passwordFeedback
export type CrackTimeEstimate = crackTimeEstimate
export type PasswordCheck = passwordCheck
export type PasswordStrengthResult = passwordStrengthResult
export type PasswordPattern = passwordPattern
export type PasswordRule = passwordRule
export type PasswordPolicy = passwordPolicy
export type PasswordGenerationOptions = passwordGenerationOptions
export type GeneratedPassword = generatedPassword
export type PasswordHistoryEntry = passwordHistoryEntry
export type PasswordStrengthState = passwordStrengthState

// ==================== Constants and Utility Functions ====================

/**
 * Password check templates
 */
export const PASSWORD_CHECKS: Array<Omit<PasswordCheck, "passed">> = [
  {
    id: "min-length",
    name: "Minimum Length",
    description: "At least 8 characters",
    weight: 10,
    category: "length",
  },
  {
    id: "good-length",
    name: "Good Length",
    description: "At least 12 characters",
    weight: 15,
    category: "length",
  },
  {
    id: "excellent-length",
    name: "Excellent Length",
    description: "At least 16 characters",
    weight: 20,
    category: "length",
  },
  {
    id: "uppercase",
    name: "Uppercase Letters",
    description: "Contains uppercase letters",
    weight: 5,
    category: "complexity",
  },
  {
    id: "lowercase",
    name: "Lowercase Letters",
    description: "Contains lowercase letters",
    weight: 5,
    category: "complexity",
  },
  {
    id: "numbers",
    name: "Numbers",
    description: "Contains numbers",
    weight: 5,
    category: "complexity",
  },
  {
    id: "symbols",
    name: "Symbols",
    description: "Contains special characters",
    weight: 10,
    category: "complexity",
  },
  {
    id: "mixed-case",
    name: "Mixed Case",
    description: "Contains both uppercase and lowercase",
    weight: 5,
    category: "complexity",
  },
  {
    id: "no-common-patterns",
    name: "No Common Patterns",
    description: "Does not contain common patterns",
    weight: 10,
    category: "patterns",
  },
  {
    id: "no-dictionary-words",
    name: "No Dictionary Words",
    description: "Does not contain common words",
    weight: 10,
    category: "dictionary",
  },
  {
    id: "character-variety",
    name: "Character Variety",
    description: "Has good character variety",
    weight: 5,
    category: "complexity",
  },
  {
    id: "entropy",
    name: "High Entropy",
    description: "Has high entropy (>= 50 bits)",
    weight: 10,
    category: "complexity",
  },
]

/**
 * Weak password patterns
 */
export const WEAK_PATTERNS: PasswordPattern[] = [
  {
    id: "sequential",
    name: "Sequential Characters",
    description: "Contains sequential characters (e.g., '123', 'abc')",
    regex:
      /(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
    penalty: 5,
  },
  {
    id: "repeating",
    name: "Repeating Characters",
    description: "Contains repeating characters (e.g., 'aaa', '111')",
    regex: /(.)\1{2,}/,
    penalty: 5,
  },
  {
    id: "common-base",
    name: "Common Base Words",
    description: "Contains common base words (password, admin, etc.)",
    regex: /(password|admin|user|login|welcome|secret|master|root|system|default)/i,
    penalty: 10,
  },
]

/**
 * Calculate password entropy
 */
export function calculateEntropy(password: string): number {
  if (!password) return 0

  const charSets: Record<string, number> = {}
  let poolSize = 0

  if (/[a-z]/.test(password)) {
    charSets.lowercase = 26
    poolSize += 26
  }
  if (/[A-Z]/.test(password)) {
    charSets.uppercase = 26
    poolSize += 26
  }
  if (/[0-9]/.test(password)) {
    charSets.numbers = 10
    poolSize += 10
  }
  if (/[^a-zA-Z0-9]/.test(password)) {
    charSets.symbols = 32 // Common symbols
    poolSize += 32
  }

  if (poolSize === 0) return 0

  return password.length * Math.log2(poolSize)
}

/**
 * Estimate crack time based on entropy
 */
export function estimateCrackTime(entropy: number): CrackTimeEstimate {
  if (entropy === 0) {
    return {
      onlineThrottling: "0 seconds",
      onlineNoThrottling: "0 seconds",
      offlineSlowHashing: "0 seconds",
      offlineFastHashing: "0 seconds",
    }
  }

  const seconds = Math.pow(2, entropy) / 1000000000 // Assuming 1 billion attempts per second

  const formatTime = (s: number): string => {
    if (s < 1) return "less than a second"
    if (s < 60) return `${Math.round(s)} seconds`
    if (s < 3600) return `${Math.round(s / 60)} minutes`
    if (s < 86400) return `${Math.round(s / 3600)} hours`
    if (s < 2592000) return `${Math.round(s / 86400)} days`
    if (s < 31536000) return `${Math.round(s / 2592000)} months`
    return `${Math.round(s / 31536000)} years`
  }

  return {
    onlineThrottling: formatTime(seconds * 1000), // Assume 1000x slower with throttling,
    onlineNoThrottling: formatTime(seconds),
    offlineSlowHashing: formatTime(seconds / 100), // Assume 100x faster offline,
    offlineFastHashing: formatTime(seconds / 10000), // Assume 10000x faster with fast hashing,
  }
}

/**
 * Get password strength level from score
 */
export function getPasswordStrengthLevel(score: number): PasswordLevel {
  if (score < 20) return "very-weak"
  if (score < 40) return "weak"
  if (score < 60) return "fair"
  if (score < 80) return "good"
  if (score < 95) return "strong"
  return "very-strong"
}

/**
 * Get strength color class
 */
export function getStrengthColor(level: PasswordLevel): string {
  switch (level) {
    case "very-weak":
      return "bg-red-500 text-white"
    case "weak":
      return "bg-orange-500 text-white"
    case "fair":
      return "bg-yellow-500 text-white"
    case "good":
      return "bg-blue-500 text-white"
    case "strong":
      return "bg-green-500 text-white"
    case "very-strong":
      return "bg-emerald-600 text-white"
    default:
      return "bg-gray-500 text-white"
  }
}

/**
 * Generate a random password
 */
export function generatePassword(options: PasswordGenerationOptions): string | null {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar,
    excludeAmbiguous,
  } = options

  let charset = ""
  if (includeLowercase) charset += "abcdefghijklmnopqrstuvwxyz"
  if (includeUppercase) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  if (includeNumbers) charset += "0123456789"
  if (includeSymbols) charset += "!@#$%^&*()_+-=[]{}|;:,.<>?"

  if (excludeSimilar) {
    charset = charset.replace(/[il1Lo0O]/g, "")
  }

  if (excludeAmbiguous) {
    charset = charset.replace(/[{}[\]()/\\'"~,;.<>]/g, "")
  }

  if (charset.length === 0) return null

  let password = ""
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length]
  }

  return password
}
