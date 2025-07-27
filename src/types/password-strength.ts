export interface PasswordStrengthResult {
  score: number // 0-100
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong' | 'very-strong'
  feedback: PasswordFeedback
  entropy: number
  crackTime: CrackTimeEstimate
  checks: PasswordCheck[]
}

export interface PasswordFeedback {
  warning?: string
  suggestions: string[]
  positives: string[]
}

export interface CrackTimeEstimate {
  onlineThrottling: string // 100 attempts per hour
  onlineNoThrottling: string // 10 attempts per second
  offlineSlowHashing: string // 10,000 attempts per second
  offlineFastHashing: string // 10 billion attempts per second
}

export interface PasswordCheck {
  id: string
  name: string
  description: string
  passed: boolean
  weight: number // 影响权重 1-10
  category: 'length' | 'complexity' | 'patterns' | 'dictionary'
}

export interface PasswordPattern {
  id: string
  name: string
  regex: RegExp
  description: string
  penalty: number // 扣分
}

export interface PasswordPolicy {
  id: string
  name: string
  description: string
  minLength: number
  maxLength?: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
  forbiddenPatterns: string[]
  customRules?: PasswordRule[]
}

export interface PasswordRule {
  id: string
  name: string
  description: string
  validator: (password: string) => boolean
  weight: number
}

export interface PasswordStrengthState {
  password: string
  result?: PasswordStrengthResult
  selectedPolicy?: PasswordPolicy
  showPassword: boolean
  generatedPasswords: GeneratedPassword[]
  history: PasswordHistoryEntry[]
}

export interface GeneratedPassword {
  id: string
  password: string
  strength: PasswordStrengthResult
  options: PasswordGenerationOptions
  createdAt: number
}

export interface PasswordGenerationOptions {
  length: number
  includeUppercase: boolean
  includeLowercase: boolean
  includeNumbers: boolean
  includeSymbols: boolean
  excludeSimilar: boolean
  excludeAmbiguous: boolean
  customCharset?: string
}

export interface PasswordHistoryEntry {
  id: string
  password: string
  strength: PasswordStrengthResult
  timestamp: number
}

// 预定义的密码策略
export const PASSWORD_POLICIES: PasswordPolicy[] = [
  {
    id: 'basic',
    name: 'Basic Security',
    description: 'Minimum security requirements for general use',
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: false,
    forbiddenPatterns: ['password', '123456', 'qwerty']
  },
  {
    id: 'standard',
    name: 'Standard Security',
    description: 'Recommended security level for most applications',
    minLength: 12,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    forbiddenPatterns: ['password', '123456', 'qwerty', 'admin', 'user']
  },
  {
    id: 'high',
    name: 'High Security',
    description: 'Strong security requirements for sensitive data',
    minLength: 16,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    forbiddenPatterns: [
      'password', '123456', 'qwerty', 'admin', 'user', 'login',
      'welcome', 'secret', 'master', 'root'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise Security',
    description: 'Maximum security for enterprise environments',
    minLength: 20,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    forbiddenPatterns: [
      'password', '123456', 'qwerty', 'admin', 'user', 'login',
      'welcome', 'secret', 'master', 'root', 'system', 'default'
    ]
  }
]

// 常见的弱密码模式
export const WEAK_PATTERNS: PasswordPattern[] = [
  {
    id: 'sequential-numbers',
    name: 'Sequential Numbers',
    regex: /(012|123|234|345|456|567|678|789|890)/,
    description: 'Contains sequential numbers',
    penalty: 10
  },
  {
    id: 'sequential-letters',
    name: 'Sequential Letters',
    regex: /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
    description: 'Contains sequential letters',
    penalty: 10
  },
  {
    id: 'keyboard-patterns',
    name: 'Keyboard Patterns',
    regex: /(qwer|asdf|zxcv|1234|!@#$)/i,
    description: 'Contains keyboard patterns',
    penalty: 15
  },
  {
    id: 'repeated-chars',
    name: 'Repeated Characters',
    regex: /(.)\1{2,}/,
    description: 'Contains repeated characters',
    penalty: 8
  },
  {
    id: 'common-words',
    name: 'Common Words',
    regex: /(password|admin|user|login|welcome|secret|master|root|system|default)/i,
    description: 'Contains common words',
    penalty: 20
  },
  {
    id: 'dates',
    name: 'Date Patterns',
    regex: /(19|20)\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/,
    description: 'Contains date patterns',
    penalty: 12
  },
  {
    id: 'simple-substitution',
    name: 'Simple Substitution',
    regex: /p@ssw0rd|@dmin|us3r|l0gin/i,
    description: 'Uses simple character substitution',
    penalty: 15
  }
]

// 密码强度检查规则
export const PASSWORD_CHECKS: Omit<PasswordCheck, 'passed'>[] = [
  {
    id: 'min-length',
    name: 'Minimum Length',
    description: 'Password has at least 8 characters',
    weight: 8,
    category: 'length'
  },
  {
    id: 'good-length',
    name: 'Good Length',
    description: 'Password has at least 12 characters',
    weight: 6,
    category: 'length'
  },
  {
    id: 'excellent-length',
    name: 'Excellent Length',
    description: 'Password has at least 16 characters',
    weight: 4,
    category: 'length'
  },
  {
    id: 'uppercase',
    name: 'Uppercase Letters',
    description: 'Contains uppercase letters (A-Z)',
    weight: 5,
    category: 'complexity'
  },
  {
    id: 'lowercase',
    name: 'Lowercase Letters',
    description: 'Contains lowercase letters (a-z)',
    weight: 5,
    category: 'complexity'
  },
  {
    id: 'numbers',
    name: 'Numbers',
    description: 'Contains numbers (0-9)',
    weight: 5,
    category: 'complexity'
  },
  {
    id: 'symbols',
    name: 'Special Characters',
    description: 'Contains special characters (!@#$%^&*)',
    weight: 7,
    category: 'complexity'
  },
  {
    id: 'mixed-case',
    name: 'Mixed Case',
    description: 'Uses both uppercase and lowercase letters',
    weight: 6,
    category: 'complexity'
  },
  {
    id: 'no-common-patterns',
    name: 'No Common Patterns',
    description: 'Avoids common patterns and sequences',
    weight: 8,
    category: 'patterns'
  },
  {
    id: 'no-dictionary-words',
    name: 'No Dictionary Words',
    description: 'Avoids common dictionary words',
    weight: 7,
    category: 'dictionary'
  },
  {
    id: 'character-variety',
    name: 'Character Variety',
    description: 'Uses a good variety of different characters',
    weight: 5,
    category: 'complexity'
  },
  {
    id: 'entropy',
    name: 'High Entropy',
    description: 'Has high randomness and unpredictability',
    weight: 8,
    category: 'complexity'
  }
]

// 计算密码熵值
export const calculateEntropy = (password: string): number => {
  if (!password) return 0
  
  let charset = 0
  
  // 计算字符集大小
  if (/[a-z]/.test(password)) charset += 26 // 小写字母
  if (/[A-Z]/.test(password)) charset += 26 // 大写字母
  if (/[0-9]/.test(password)) charset += 10 // 数字
  if (/[^a-zA-Z0-9]/.test(password)) charset += 32 // 特殊字符（估算）
  
  // 熵值 = log2(字符集大小) * 密码长度
  return Math.log2(charset) * password.length
}

// 估算破解时间
export const estimateCrackTime = (entropy: number): CrackTimeEstimate => {
  const attempts = Math.pow(2, entropy - 1) // 平均需要尝试一半的组合
  
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(0)} seconds`
    if (seconds < 3600) return `${(seconds / 60).toFixed(0)} minutes`
    if (seconds < 86400) return `${(seconds / 3600).toFixed(0)} hours`
    if (seconds < 31536000) return `${(seconds / 86400).toFixed(0)} days`
    if (seconds < 31536000000) return `${(seconds / 31536000).toFixed(0)} years`
    return 'centuries'
  }
  
  return {
    onlineThrottling: formatTime(attempts / (100 / 3600)), // 100 attempts per hour
    onlineNoThrottling: formatTime(attempts / 10), // 10 attempts per second
    offlineSlowHashing: formatTime(attempts / 10000), // 10,000 attempts per second
    offlineFastHashing: formatTime(attempts / 10000000000) // 10 billion attempts per second
  }
}

// 获取密码强度等级
export const getPasswordStrengthLevel = (score: number): PasswordStrengthResult['level'] => {
  if (score >= 90) return 'very-strong'
  if (score >= 75) return 'strong'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  if (score >= 20) return 'weak'
  return 'very-weak'
}

// 获取强度等级颜色
export const getStrengthColor = (level: PasswordStrengthResult['level']): string => {
  switch (level) {
    case 'very-strong': return 'text-green-600 bg-green-100'
    case 'strong': return 'text-green-500 bg-green-50'
    case 'good': return 'text-blue-600 bg-blue-100'
    case 'fair': return 'text-yellow-600 bg-yellow-100'
    case 'weak': return 'text-orange-600 bg-orange-100'
    case 'very-weak': return 'text-red-600 bg-red-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

// 获取强度等级进度条颜色
export const getStrengthProgressColor = (level: PasswordStrengthResult['level']): string => {
  switch (level) {
    case 'very-strong': return 'bg-green-500'
    case 'strong': return 'bg-green-400'
    case 'good': return 'bg-blue-500'
    case 'fair': return 'bg-yellow-500'
    case 'weak': return 'bg-orange-500'
    case 'very-weak': return 'bg-red-500'
    default: return 'bg-gray-400'
  }
}

// 生成随机密码
export const generatePassword = (options: PasswordGenerationOptions): string => {
  let charset = ''
  
  if (options.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
  if (options.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (options.includeNumbers) charset += '0123456789'
  if (options.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  if (options.customCharset) {
    charset = options.customCharset
  }
  
  if (options.excludeSimilar) {
    charset = charset.replace(/[il1Lo0O]/g, '')
  }
  
  if (options.excludeAmbiguous) {
    charset = charset.replace(/[{}\[\]()\/<>\\|`~]/g, '')
  }
  
  if (!charset) return ''
  
  let password = ''
  for (let i = 0; i < options.length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}
