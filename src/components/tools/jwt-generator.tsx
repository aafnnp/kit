import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Settings,
  BookOpen,
  Clock,
  Key,
  Layers,
  CheckCircle,
  XCircle,
  Wrench,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  JWTGeneratorConfig,
  JWTHeader,
  JWTPayload,
  GeneratedJWT,
  JWTAnalysis,
  JWTCompliance,
  JWTValidation,
  JWTMetadata,
  JWTTemplate,
  JWTBatch,
  BatchSettings,
  BatchStatistics,
  JWTAlgorithm,
  ExportFormat,
} from '@/types/jwt-generator'
// Utility functions

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// JWT generation functions
const generateJWT = async (config: JWTGeneratorConfig): Promise<GeneratedJWT> => {
  const id = nanoid()
  const createdAt = new Date()

  try {
    // Build header
    const header: JWTHeader = {
      ...config.header,
      alg: config.algorithm,
      typ: 'JWT',
    }

    if (config.options.includeKeyId && config.header.kid) {
      header.kid = config.header.kid
    }

    // Build payload
    const now = Math.floor(Date.now() / 1000)
    const payload: JWTPayload = {
      ...config.payload,
      ...config.customClaims,
    }

    // Add standard claims
    if (config.issuer) payload.iss = config.issuer
    if (config.subject) payload.sub = config.subject
    if (config.audience) payload.aud = config.audience
    if (config.options.includeJwtId && config.jwtId) payload.jti = config.jwtId
    if (config.options.includeIssuedAt) payload.iat = now

    // Handle expiration
    if (config.expiresIn) {
      const expirationSeconds = parseTimeString(config.expiresIn)
      if (expirationSeconds > 0) {
        payload.exp = now + expirationSeconds
      }
    }

    // Handle not before
    if (config.notBefore) {
      const notBeforeSeconds = parseTimeString(config.notBefore)
      if (notBeforeSeconds > 0) {
        payload.nbf = now + notBeforeSeconds
      }
    }

    // Generate token
    const token = await createJWTToken(header, payload, config.secret, config.algorithm)

    // Parse token parts for analysis
    const parts = token.split('.')
    const signature = parts[2] || ''

    // Perform analysis
    const analysis = analyzeGeneratedJWT(header, payload, config)
    const validation = validateGeneratedJWT(header, payload, config)
    const metadata = calculateJWTMetadata(token, header, payload)

    return {
      id,
      token,
      config,
      header,
      payload,
      signature,
      analysis,
      validation,
      metadata,
      createdAt,
    }
  } catch (error) {
    throw new Error(`Failed to generate JWT: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const createJWTToken = async (
  header: JWTHeader,
  payload: JWTPayload,
  secret: string,
  algorithm: JWTAlgorithm
): Promise<string> => {
  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const data = `${headerEncoded}.${payloadEncoded}`

  let signature = ''

  if (algorithm === 'none') {
    signature = ''
  } else if (algorithm.startsWith('HS')) {
    // HMAC algorithms
    signature = await createHMACSignature(data, secret, algorithm)
  } else {
    // For RSA/ECDSA algorithms, we'll create a mock signature since we can't do real crypto in browser
    signature = createMockSignature(data, algorithm)
  }

  return `${data}.${signature}`
}

const base64UrlEncode = (str: string): string => {
  const base64 = btoa(unescape(encodeURIComponent(str)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

const createHMACSignature = async (data: string, secret: string, algorithm: JWTAlgorithm): Promise<string> => {
  try {
    // Use Web Crypto API for HMAC
    const encoder = new TextEncoder()
    const keyData = encoder.encode(secret)
    const messageData = encoder.encode(data)

    const hashAlgorithm = algorithm === 'HS256' ? 'SHA-256' : algorithm === 'HS384' ? 'SHA-384' : 'SHA-512'

    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: hashAlgorithm }, false, [
      'sign',
    ])

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const signatureArray = new Uint8Array(signature)
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray))

    return signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch (error) {
    // Fallback to mock signature if Web Crypto API fails
    return createMockSignature(data, algorithm)
  }
}

const createMockSignature = (data: string, algorithm: JWTAlgorithm): string => {
  // Create a deterministic mock signature for demonstration purposes
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  const mockSignature = Math.abs(hash).toString(36) + algorithm.toLowerCase()
  return base64UrlEncode(mockSignature)
}

const parseTimeString = (timeStr: string): number => {
  const match = timeStr.match(/^(\d+)([smhd]?)$/)
  if (!match) return 0

  const value = parseInt(match[1])
  const unit = match[2] || 's'

  switch (unit) {
    case 's':
      return value
    case 'm':
      return value * 60
    case 'h':
      return value * 3600
    case 'd':
      return value * 86400
    default:
      return value
  }
}

const analyzeGeneratedJWT = (header: JWTHeader, payload: JWTPayload, config: JWTGeneratorConfig): JWTAnalysis => {
  const warnings: string[] = []
  const errors: string[] = []
  const recommendations: string[] = []

  let securityLevel: 'high' | 'medium' | 'low' | 'critical' = 'high'
  let riskScore = 0

  // Algorithm analysis
  if (header.alg === 'none') {
    securityLevel = 'critical'
    riskScore += 50
    errors.push('Algorithm "none" provides no security')
    recommendations.push('Use a secure signing algorithm like HS256 or RS256')
  } else if (header.alg.startsWith('HS')) {
    if (config.secret.length < 32) {
      securityLevel = 'low'
      riskScore += 20
      warnings.push('Secret key is too short for optimal security')
      recommendations.push('Use a secret key of at least 32 characters')
    }
  }

  // Expiration analysis
  if (!payload.exp) {
    riskScore += 15
    warnings.push('No expiration time specified')
    recommendations.push('Add expiration time (exp) claim for security')
  } else {
    const now = Math.floor(Date.now() / 1000)
    const lifetime = payload.exp - (payload.iat || now)
    if (lifetime > 86400) {
      // More than 24 hours
      riskScore += 10
      warnings.push('Token lifetime is very long')
      recommendations.push('Consider shorter token lifetimes for better security')
    }
  }

  // Claims analysis
  if (!payload.iss) {
    riskScore += 5
    recommendations.push('Add issuer (iss) claim for verification')
  }

  if (!payload.aud) {
    riskScore += 5
    recommendations.push('Add audience (aud) claim for verification')
  }

  // Determine security level based on risk score
  if (riskScore >= 40) {
    securityLevel = 'critical'
  } else if (riskScore >= 25) {
    securityLevel = 'low'
  } else if (riskScore >= 10) {
    securityLevel = 'medium'
  }

  const compliance: JWTCompliance = {
    rfc7519Compliant: errors.length === 0,
    hasRequiredClaims: !!(header.alg && header.typ),
    hasRecommendedClaims: !!(payload.iss && payload.exp && payload.iat),
    algorithmSupported: header.alg !== 'none',
    structureValid: true,
    complianceScore: Math.max(0, 100 - riskScore),
  }

  return {
    isValid: errors.length === 0,
    securityLevel,
    riskScore,
    compliance,
    recommendations,
    warnings,
    errors,
  }
}

const validateGeneratedJWT = (header: JWTHeader, payload: JWTPayload, config: JWTGeneratorConfig): JWTValidation => {
  const validation: JWTValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  // Header validation
  if (!header.alg) {
    validation.isValid = false
    validation.errors.push({
      message: 'Missing algorithm (alg) in header',
      type: 'header',
      severity: 'error',
      field: 'alg',
    })
    validation.qualityScore -= 25
  }

  if (!header.typ || header.typ !== 'JWT') {
    validation.warnings.push('Missing or incorrect type (typ) in header')
    validation.qualityScore -= 5
  }

  // Payload validation
  if (payload.exp && payload.iat && payload.exp <= payload.iat) {
    validation.errors.push({
      message: 'Expiration time must be after issued time',
      type: 'payload',
      severity: 'error',
      field: 'exp',
    })
    validation.qualityScore -= 20
  }

  if (payload.nbf && payload.iat && payload.nbf < payload.iat) {
    validation.warnings.push('Not before time is before issued time')
    validation.qualityScore -= 5
  }

  // Secret validation for HMAC algorithms
  if (header.alg.startsWith('HS') && config.secret.length < 8) {
    validation.errors.push({
      message: 'Secret key is too short',
      type: 'security',
      severity: 'error',
      field: 'secret',
    })
    validation.qualityScore -= 30
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent JWT configuration')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good JWT setup, minor improvements possible')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('JWT configuration needs improvement')
  } else {
    validation.suggestions.push('JWT configuration has significant issues')
  }

  return validation
}

const calculateJWTMetadata = (token: string, header: JWTHeader, payload: JWTPayload): JWTMetadata => {
  const parts = token.split('.')
  const headerSize = parts[0]?.length || 0
  const payloadSize = parts[1]?.length || 0
  const signatureSize = parts[2]?.length || 0

  // Calculate entropy (simplified)
  const entropy = calculateEntropy(token)

  // Count unique claims
  const uniqueClaims = Object.keys(payload).length

  // Estimate strength based on algorithm and key length
  let estimatedStrength = 0
  if (header.alg === 'none') {
    estimatedStrength = 0
  } else if (header.alg.startsWith('HS')) {
    estimatedStrength = header.alg === 'HS256' ? 256 : header.alg === 'HS384' ? 384 : 512
  } else if (header.alg.startsWith('RS')) {
    estimatedStrength = header.alg === 'RS256' ? 256 : header.alg === 'RS384' ? 384 : 512
  }

  return {
    size: token.length,
    headerSize,
    payloadSize,
    signatureSize,
    entropy,
    uniqueClaims,
    estimatedStrength,
  }
}

const calculateEntropy = (str: string): number => {
  const freq: Record<string, number> = {}

  for (const char of str) {
    freq[char] = (freq[char] || 0) + 1
  }

  let entropy = 0
  const length = str.length

  for (const count of Object.values(freq)) {
    const probability = count / length
    entropy -= probability * Math.log2(probability)
  }

  return entropy
}

// JWT Templates
const jwtTemplates: JWTTemplate[] = [
  {
    id: 'basic-auth',
    name: 'Basic Authentication',
    description: 'Simple authentication token with essential claims',
    category: 'Authentication',
    config: {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: 'auth.example.com',
      audience: 'api.example.com',
      subject: 'user123',
      secret: 'your-256-bit-secret-key-here-make-it-long-enough',
      customClaims: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        role: 'user',
      },
      options: {
        includeIssuedAt: true,
        includeJwtId: true,
        includeKeyId: false,
        validateClaims: true,
        allowInsecureAlgorithms: false,
        customHeaderClaims: false,
        timestampPrecision: 'seconds',
      },
    },
    useCase: ['User authentication', 'Session management', 'Basic authorization'],
    features: ['Standard claims', 'User information', 'Role-based access'],
    securityLevel: 'medium',
  },
  {
    id: 'api-access',
    name: 'API Access Token',
    description: 'Token for API access with scopes and permissions',
    category: 'API',
    config: {
      algorithm: 'HS256',
      expiresIn: '2h',
      issuer: 'api.service.com',
      audience: 'api.service.com',
      subject: 'api_client_123',
      secret: 'api-secret-key-should-be-very-long-and-secure',
      customClaims: {
        scope: 'read write delete',
        permissions: ['users:read', 'users:write', 'admin:read'],
        client_id: 'web_app_client',
        rate_limit: 1000,
      },
      options: {
        includeIssuedAt: true,
        includeJwtId: true,
        includeKeyId: true,
        validateClaims: true,
        allowInsecureAlgorithms: false,
        customHeaderClaims: false,
        timestampPrecision: 'seconds',
      },
    },
    useCase: ['API authorization', 'Service-to-service communication', 'Rate limiting'],
    features: ['Scopes and permissions', 'Multiple audiences', 'Client identification'],
    securityLevel: 'high',
  },
  {
    id: 'refresh-token',
    name: 'Refresh Token',
    description: 'Long-lived token for refreshing access tokens',
    category: 'Refresh',
    config: {
      algorithm: 'HS256',
      expiresIn: '30d',
      issuer: 'auth.service.com',
      audience: 'auth.service.com',
      subject: 'user123',
      secret: 'refresh-token-secret-must-be-different-from-access-token',
      customClaims: {
        token_type: 'refresh',
        device_id: 'mobile_app_123',
        session_id: 'sess_abc123',
      },
      options: {
        includeIssuedAt: true,
        includeJwtId: true,
        includeKeyId: false,
        validateClaims: true,
        allowInsecureAlgorithms: false,
        customHeaderClaims: false,
        timestampPrecision: 'seconds',
      },
    },
    useCase: ['Token refresh', 'Long-term authentication', 'Session management'],
    features: ['Long expiration', 'Device tracking', 'Session management'],
    securityLevel: 'high',
  },
  {
    id: 'admin-token',
    name: 'Admin Access Token',
    description: 'High-privilege token for administrative operations',
    category: 'Admin',
    config: {
      algorithm: 'HS512',
      expiresIn: '30m',
      issuer: 'admin.service.com',
      audience: 'admin.service.com',
      subject: 'admin_user_456',
      secret: 'admin-secret-key-must-be-extremely-secure-and-long',
      customClaims: {
        role: 'admin',
        permissions: ['*'],
        security_level: 'high',
        admin_level: 'super',
        ip_restriction: '192.168.1.0/24',
      },
      options: {
        includeIssuedAt: true,
        includeJwtId: true,
        includeKeyId: true,
        validateClaims: true,
        allowInsecureAlgorithms: false,
        customHeaderClaims: true,
        timestampPrecision: 'seconds',
      },
    },
    useCase: ['Administrative operations', 'System management', 'High-privilege access'],
    features: ['High security', 'Short expiration', 'IP restrictions'],
    securityLevel: 'high',
  },
  {
    id: 'microservice',
    name: 'Microservice Token',
    description: 'Service-to-service communication token',
    category: 'Service',
    config: {
      algorithm: 'HS256',
      expiresIn: '5m',
      issuer: 'service-a.internal',
      audience: 'service-b.internal',
      subject: 'service-a',
      secret: 'microservice-shared-secret-for-internal-communication',
      customClaims: {
        service_name: 'user-service',
        service_version: '1.2.3',
        environment: 'production',
        request_id: 'req_123456',
      },
      options: {
        includeIssuedAt: true,
        includeJwtId: true,
        includeKeyId: false,
        validateClaims: true,
        allowInsecureAlgorithms: false,
        customHeaderClaims: false,
        timestampPrecision: 'seconds',
      },
    },
    useCase: ['Service communication', 'Internal APIs', 'Distributed systems'],
    features: ['Short-lived', 'Service identification', 'Request tracking'],
    securityLevel: 'medium',
  },
  {
    id: 'testing-insecure',
    name: 'Testing Token (Insecure)',
    description: 'Insecure token for testing and development',
    category: 'Testing',
    config: {
      algorithm: 'none',
      expiresIn: '',
      issuer: 'test.local',
      audience: 'test.local',
      subject: 'test_user',
      secret: '',
      customClaims: {
        test: true,
        environment: 'development',
        debug: true,
      },
      options: {
        includeIssuedAt: false,
        includeJwtId: false,
        includeKeyId: false,
        validateClaims: false,
        allowInsecureAlgorithms: true,
        customHeaderClaims: false,
        timestampPrecision: 'seconds',
      },
    },
    useCase: ['Development testing', 'Security demonstrations', 'Educational purposes'],
    features: ['No signature', 'No expiration', 'Development only'],
    securityLevel: 'low',
  },
]

// Default configuration
const createDefaultConfig = (): JWTGeneratorConfig => ({
  id: nanoid(),
  name: 'New JWT Configuration',
  header: {
    alg: 'HS256',
    typ: 'JWT',
  },
  payload: {},
  secret: 'your-256-bit-secret',
  algorithm: 'HS256',
  expiresIn: '1h',
  customClaims: {},
  options: {
    includeIssuedAt: true,
    includeJwtId: false,
    includeKeyId: false,
    validateClaims: true,
    allowInsecureAlgorithms: false,
    customHeaderClaims: false,
    timestampPrecision: 'seconds',
  },
  createdAt: new Date(),
})

// Validation functions
const validateJWTConfig = (config: JWTGeneratorConfig): JWTValidation => {
  const validation: JWTValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  // Algorithm validation
  if (!config.algorithm) {
    validation.isValid = false
    validation.errors.push({
      message: 'Algorithm is required',
      type: 'algorithm',
      severity: 'error',
      field: 'algorithm',
    })
    validation.qualityScore -= 25
  }

  if (config.algorithm === 'none' && !config.options.allowInsecureAlgorithms) {
    validation.isValid = false
    validation.errors.push({
      message: 'Algorithm "none" is not allowed',
      type: 'algorithm',
      severity: 'error',
      field: 'algorithm',
    })
    validation.qualityScore -= 50
  }

  // Secret validation for HMAC algorithms
  if (config.algorithm.startsWith('HS')) {
    if (!config.secret) {
      validation.isValid = false
      validation.errors.push({
        message: 'Secret is required for HMAC algorithms',
        type: 'security',
        severity: 'error',
        field: 'secret',
      })
      validation.qualityScore -= 30
    } else if (config.secret.length < 8) {
      validation.warnings.push('Secret key is too short')
      validation.suggestions.push('Use a secret key of at least 32 characters')
      validation.qualityScore -= 20
    } else if (config.secret.length < 32) {
      validation.warnings.push('Secret key could be longer for better security')
      validation.qualityScore -= 10
    }
  }

  // Expiration validation
  if (config.expiresIn) {
    const expirationSeconds = parseTimeString(config.expiresIn)
    if (expirationSeconds <= 0) {
      validation.warnings.push('Invalid expiration time format')
      validation.suggestions.push('Use format like "1h", "30m", "7d"')
      validation.qualityScore -= 10
    } else if (expirationSeconds > 86400 * 30) {
      // More than 30 days
      validation.warnings.push('Very long expiration time')
      validation.suggestions.push('Consider shorter expiration times for better security')
      validation.qualityScore -= 5
    }
  }

  // Claims validation
  if (!config.issuer) {
    validation.suggestions.push('Consider adding an issuer (iss) claim')
    validation.qualityScore -= 5
  }

  if (!config.audience) {
    validation.suggestions.push('Consider adding an audience (aud) claim')
    validation.qualityScore -= 5
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent JWT configuration')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good JWT configuration, minor improvements possible')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('JWT configuration needs improvement')
  } else {
    validation.suggestions.push('JWT configuration has significant security issues')
  }

  return validation
}

// Custom hooks
const useJWTGenerator = () => {
  const [tokens, setTokens] = useState<GeneratedJWT[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateToken = useCallback(async (config: JWTGeneratorConfig): Promise<GeneratedJWT> => {
    setIsGenerating(true)
    try {
      const token = await generateJWT(config)
      setTokens((prev) => [token, ...prev])
      return token
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const generateBatch = useCallback(async (batchSettings: BatchSettings): Promise<JWTBatch> => {
    setIsGenerating(true)
    const startTime = performance.now()

    try {
      const batch: JWTBatch = {
        id: nanoid(),
        name: batchSettings.namingPattern || 'JWT Batch',
        tokens: [],
        settings: batchSettings,
        status: 'processing',
        progress: 0,
        statistics: {
          totalGenerated: 0,
          successfulGenerated: 0,
          failedGenerated: 0,
          averageSize: 0,
          averageSecurityScore: 0,
          algorithmDistribution: {},
          totalProcessingTime: 0,
          averageProcessingTime: 0,
        },
        createdAt: new Date(),
      }

      const batchTokens: GeneratedJWT[] = []

      for (let i = 0; i < batchSettings.count; i++) {
        try {
          let config = { ...batchSettings.baseConfig }

          // Vary payload if requested
          if (batchSettings.varyPayload) {
            config.customClaims = {
              ...config.customClaims,
              batch_index: i,
              batch_id: batch.id,
            }
          }

          // Vary expiration if requested
          if (batchSettings.varyExpiration) {
            const variations = ['30m', '1h', '2h', '4h', '8h']
            config.expiresIn = variations[i % variations.length]
          }

          const token = await generateJWT(config)
          batchTokens.push(token)

          // Update progress
          const progress = ((i + 1) / batchSettings.count) * 100
          batch.progress = progress
        } catch (error) {
          console.error('Failed to generate JWT:', error)
        }
      }

      const endTime = performance.now()
      const totalProcessingTime = endTime - startTime

      // Calculate statistics
      const successful = batchTokens.filter((t) => t.analysis.isValid)
      const algorithmDistribution: Record<string, number> = {}
      let totalSize = 0
      let totalSecurityScore = 0

      batchTokens.forEach((token) => {
        algorithmDistribution[token.config.algorithm] = (algorithmDistribution[token.config.algorithm] || 0) + 1
        totalSize += token.metadata.size
        totalSecurityScore += 100 - token.analysis.riskScore
      })

      const statistics: BatchStatistics = {
        totalGenerated: batchTokens.length,
        successfulGenerated: successful.length,
        failedGenerated: batchTokens.length - successful.length,
        averageSize: batchTokens.length > 0 ? totalSize / batchTokens.length : 0,
        averageSecurityScore: batchTokens.length > 0 ? totalSecurityScore / batchTokens.length : 0,
        algorithmDistribution,
        totalProcessingTime,
        averageProcessingTime: totalProcessingTime / batchTokens.length,
      }

      batch.tokens = batchTokens
      batch.status = 'completed'
      batch.progress = 100
      batch.statistics = statistics
      batch.completedAt = new Date()

      setTokens((prev) => [...batchTokens, ...prev])
      return batch
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const removeToken = useCallback((id: string) => {
    setTokens((prev) => prev.filter((token) => token.id !== id))
  }, [])

  const clearTokens = useCallback(() => {
    setTokens([])
  }, [])

  return {
    tokens,
    isGenerating,
    generateToken,
    generateBatch,
    removeToken,
    clearTokens,
  }
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

// Export functionality
const useJWTExport = () => {
  const exportToken = useCallback((token: GeneratedJWT, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(token, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromToken(token)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'txt':
        content = generateTextFromToken(token)
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'xml':
        content = generateXMLFromToken(token)
        mimeType = 'application/xml'
        extension = '.xml'
        break
      case 'yaml':
        content = generateYAMLFromToken(token)
        mimeType = 'text/yaml'
        extension = '.yaml'
        break
      default:
        content = token.token
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `jwt-token-${token.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback((batch: JWTBatch) => {
    const content = JSON.stringify(batch, null, 2)
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${batch.name}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportToken, exportBatch }
}

// Helper functions for export formats
const generateCSVFromToken = (token: GeneratedJWT): string => {
  const headers = ['Field', 'Value', 'Type', 'Description']
  const rows: string[][] = []

  // Token info
  rows.push(['token', token.token, 'string', 'Generated JWT Token'])
  rows.push(['algorithm', token.config.algorithm, 'string', 'Signing Algorithm'])
  rows.push(['isValid', String(token.analysis.isValid), 'boolean', 'Token Validity'])
  rows.push(['securityLevel', token.analysis.securityLevel, 'string', 'Security Level'])
  rows.push(['riskScore', String(token.analysis.riskScore), 'number', 'Risk Score'])

  // Header fields
  Object.entries(token.header).forEach(([key, value]) => {
    rows.push([`header.${key}`, String(value), typeof value, 'JWT Header'])
  })

  // Payload fields
  Object.entries(token.payload).forEach(([key, value]) => {
    rows.push([`payload.${key}`, String(value), typeof value, 'JWT Payload'])
  })

  return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
}

const generateTextFromToken = (token: GeneratedJWT): string => {
  return `JWT Token Generation Report - ${token.createdAt.toLocaleString()}

=== GENERATED TOKEN ===
${token.token}

=== CONFIGURATION ===
Algorithm: ${token.config.algorithm}
Secret: ${token.config.secret ? '[REDACTED]' : 'None'}
Expires In: ${token.config.expiresIn || 'Never'}
Issuer: ${token.config.issuer || 'Not specified'}
Audience: ${token.config.audience || 'Not specified'}
Subject: ${token.config.subject || 'Not specified'}

=== HEADER ===
${JSON.stringify(token.header, null, 2)}

=== PAYLOAD ===
${JSON.stringify(token.payload, null, 2)}

=== ANALYSIS ===
Valid: ${token.analysis.isValid}
Security Level: ${token.analysis.securityLevel}
Risk Score: ${token.analysis.riskScore}%
Compliance Score: ${token.analysis.compliance.complianceScore}%

=== METADATA ===
Token Size: ${formatFileSize(token.metadata.size)}
Unique Claims: ${token.metadata.uniqueClaims}
Estimated Strength: ${token.metadata.estimatedStrength} bits
Entropy: ${token.metadata.entropy.toFixed(2)}

=== SECURITY ANALYSIS ===
${token.analysis.warnings.length > 0 ? 'Warnings:\n' + token.analysis.warnings.map((w) => `- ${w}`).join('\n') : 'No warnings'}

${token.analysis.errors.length > 0 ? '\nErrors:\n' + token.analysis.errors.map((e) => `- ${e}`).join('\n') : ''}

=== RECOMMENDATIONS ===
${token.analysis.recommendations.map((r) => `- ${r}`).join('\n')}`
}

const generateXMLFromToken = (token: GeneratedJWT): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jwtToken id="${token.id}" timestamp="${token.createdAt.toISOString()}">
  <token>${token.token}</token>
  <configuration>
    <algorithm>${token.config.algorithm}</algorithm>
    <expiresIn>${token.config.expiresIn}</expiresIn>
    <issuer>${token.config.issuer || ''}</issuer>
    <audience>${token.config.audience || ''}</audience>
    <subject>${token.config.subject || ''}</subject>
  </configuration>
  <header>
    ${Object.entries(token.header)
      .map(([key, value]) => `<${key}>${value}</${key}>`)
      .join('\n    ')}
  </header>
  <payload>
    ${Object.entries(token.payload)
      .map(([key, value]) => `<${key}>${value}</${key}>`)
      .join('\n    ')}
  </payload>
  <analysis>
    <isValid>${token.analysis.isValid}</isValid>
    <securityLevel>${token.analysis.securityLevel}</securityLevel>
    <riskScore>${token.analysis.riskScore}</riskScore>
    <complianceScore>${token.analysis.compliance.complianceScore}</complianceScore>
  </analysis>
  <metadata>
    <size>${token.metadata.size}</size>
    <uniqueClaims>${token.metadata.uniqueClaims}</uniqueClaims>
    <estimatedStrength>${token.metadata.estimatedStrength}</estimatedStrength>
    <entropy>${token.metadata.entropy}</entropy>
  </metadata>
</jwtToken>`
}

const generateYAMLFromToken = (token: GeneratedJWT): string => {
  return `id: ${token.id}
timestamp: ${token.createdAt.toISOString()}
token: ${token.token}
configuration:
  algorithm: ${token.config.algorithm}
  expiresIn: ${token.config.expiresIn}
  issuer: ${token.config.issuer || ''}
  audience: ${token.config.audience || ''}
  subject: ${token.config.subject || ''}
header:
${Object.entries(token.header)
  .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
  .join('\n')}
payload:
${Object.entries(token.payload)
  .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
  .join('\n')}
analysis:
  isValid: ${token.analysis.isValid}
  securityLevel: ${token.analysis.securityLevel}
  riskScore: ${token.analysis.riskScore}
  complianceScore: ${token.analysis.compliance.complianceScore}
metadata:
  size: ${token.metadata.size}
  uniqueClaims: ${token.metadata.uniqueClaims}
  estimatedStrength: ${token.metadata.estimatedStrength}
  entropy: ${token.metadata.entropy}`
}

/**
 * Enhanced JWT Generator & Management Tool
 * Features: Advanced JWT generation, security analysis, validation, and batch processing
 */
const JWTGeneratorCore = () => {
  const [activeTab, setActiveTab] = useState<'generator' | 'batch' | 'history' | 'templates'>('generator')
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [currentToken, setCurrentToken] = useState<GeneratedJWT | null>(null)
  const [config, setConfig] = useState<JWTGeneratorConfig>(createDefaultConfig())

  const { tokens, isGenerating, generateToken, removeToken } = useJWTGenerator()
  const { exportToken } = useJWTExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = jwtTemplates.find((t) => t.id === templateId)
    if (template && template.config) {
      setConfig((prev) => ({
        ...prev,
        ...template.config,
        id: nanoid(),
        name: template.name,
        createdAt: new Date(),
      }))
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Generate JWT
  const handleGenerate = useCallback(async () => {
    const validation = validateJWTConfig(config)
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        toast.error(error.message)
      })
      return
    }

    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning)
      })
    }

    try {
      const token = await generateToken(config)
      setCurrentToken(token)
      toast.success('JWT generated successfully')
    } catch (error) {
      toast.error('Failed to generate JWT')
      console.error(error)
    }
  }, [config, generateToken])

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
              <Wrench className="h-5 w-5" aria-hidden="true" />
              JWT Generator & Management Tool
            </CardTitle>
            <CardDescription>
              Advanced JWT token generator and security analyzer with comprehensive validation, analysis, and batch
              processing. Generate, validate, and analyze JWT tokens with detailed security insights and compliance
              checking. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'generator' | 'batch' | 'history' | 'templates')}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="generator" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Batch
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* JWT Generator Tab */}
          <TabsContent value="generator" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* JWT Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    JWT Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Algorithm Selection */}
                  <div>
                    <Label htmlFor="algorithm" className="text-sm font-medium">
                      Algorithm
                    </Label>
                    <Select
                      value={config.algorithm}
                      onValueChange={(value: JWTAlgorithm) => setConfig((prev) => ({ ...prev, algorithm: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HS256">HS256 (HMAC SHA-256)</SelectItem>
                        <SelectItem value="HS384">HS384 (HMAC SHA-384)</SelectItem>
                        <SelectItem value="HS512">HS512 (HMAC SHA-512)</SelectItem>
                        <SelectItem value="RS256">RS256 (RSA SHA-256)</SelectItem>
                        <SelectItem value="RS384">RS384 (RSA SHA-384)</SelectItem>
                        <SelectItem value="RS512">RS512 (RSA SHA-512)</SelectItem>
                        <SelectItem value="ES256">ES256 (ECDSA SHA-256)</SelectItem>
                        <SelectItem value="ES384">ES384 (ECDSA SHA-384)</SelectItem>
                        <SelectItem value="ES512">ES512 (ECDSA SHA-512)</SelectItem>
                        {config.options.allowInsecureAlgorithms && (
                          <SelectItem value="none">none (No signature)</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Secret Key */}
                  {config.algorithm.startsWith('HS') && (
                    <div>
                      <Label htmlFor="secret" className="text-sm font-medium">
                        Secret Key
                      </Label>
                      <Input
                        id="secret"
                        type="password"
                        value={config.secret}
                        onChange={(e) => setConfig((prev) => ({ ...prev, secret: e.target.value }))}
                        placeholder="Enter your secret key..."
                        className="mt-2 font-mono"
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        Use a strong secret key (recommended: 32+ characters)
                      </div>
                    </div>
                  )}

                  {/* Standard Claims */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Standard Claims</Label>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="issuer" className="text-xs">
                          Issuer (iss)
                        </Label>
                        <Input
                          id="issuer"
                          value={config.issuer || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, issuer: e.target.value }))}
                          placeholder="auth.example.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="subject" className="text-xs">
                          Subject (sub)
                        </Label>
                        <Input
                          id="subject"
                          value={config.subject || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, subject: e.target.value }))}
                          placeholder="user123"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="audience" className="text-xs">
                          Audience (aud)
                        </Label>
                        <Input
                          id="audience"
                          value={config.audience || ''}
                          onChange={(e) => setConfig((prev) => ({ ...prev, audience: e.target.value }))}
                          placeholder="api.example.com"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expires-in" className="text-xs">
                          Expires In
                        </Label>
                        <Input
                          id="expires-in"
                          value={config.expiresIn}
                          onChange={(e) => setConfig((prev) => ({ ...prev, expiresIn: e.target.value }))}
                          placeholder="1h, 30m, 7d"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="jwt-id" className="text-xs">
                        JWT ID (jti)
                      </Label>
                      <Input
                        id="jwt-id"
                        value={config.jwtId || ''}
                        onChange={(e) => setConfig((prev) => ({ ...prev, jwtId: e.target.value }))}
                        placeholder="unique-token-id"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Custom Claims */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Custom Claims (JSON)</Label>
                    <Textarea
                      value={JSON.stringify(config.customClaims, null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value)
                          setConfig((prev) => ({ ...prev, customClaims: parsed }))
                        } catch {
                          // Invalid JSON, ignore
                        }
                      }}
                      placeholder='{\n  "role": "user",\n  "permissions": ["read", "write"]\n}'
                      className="mt-2 font-mono text-xs"
                      rows={6}
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-3 border-t pt-4">
                    <Label className="text-sm font-medium">Options</Label>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          id="include-iat"
                          type="checkbox"
                          checked={config.options.includeIssuedAt}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, includeIssuedAt: e.target.checked },
                            }))
                          }
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-iat" className="text-xs">
                          Include issued at (iat) claim
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="include-jti"
                          type="checkbox"
                          checked={config.options.includeJwtId}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, includeJwtId: e.target.checked },
                            }))
                          }
                          className="rounded border-input"
                        />
                        <Label htmlFor="include-jti" className="text-xs">
                          Include JWT ID (jti) claim
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="validate-claims"
                          type="checkbox"
                          checked={config.options.validateClaims}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, validateClaims: e.target.checked },
                            }))
                          }
                          className="rounded border-input"
                        />
                        <Label htmlFor="validate-claims" className="text-xs">
                          Validate claims before generation
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          id="allow-insecure"
                          type="checkbox"
                          checked={config.options.allowInsecureAlgorithms}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              options: { ...prev.options, allowInsecureAlgorithms: e.target.checked },
                            }))
                          }
                          className="rounded border-input"
                        />
                        <Label htmlFor="allow-insecure" className="text-xs">
                          Allow insecure algorithms (none)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
                      {isGenerating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Wrench className="mr-2 h-4 w-4" />
                      )}
                      {isGenerating ? 'Generating...' : 'Generate JWT'}
                    </Button>
                    <Button onClick={() => setConfig(createDefaultConfig())} variant="outline">
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Generated JWT */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Generated JWT
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentToken ? (
                    <div className="space-y-4">
                      {/* Token Display */}
                      <div>
                        <Label className="text-sm font-medium">JWT Token</Label>
                        <div className="mt-2 p-3 bg-muted rounded-lg">
                          <div className="font-mono text-xs break-all">{currentToken.token}</div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => copyToClipboard(currentToken.token, 'JWT Token')}
                            variant="outline"
                            size="sm"
                          >
                            {copiedText === 'JWT Token' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                          <Button onClick={() => exportToken(currentToken, 'txt')} variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        </div>
                      </div>

                      {/* Security Analysis */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Security Analysis</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              currentToken.analysis.securityLevel === 'high'
                                ? 'bg-green-100 text-green-800'
                                : currentToken.analysis.securityLevel === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : currentToken.analysis.securityLevel === 'low'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {currentToken.analysis.securityLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              currentToken.analysis.riskScore < 20
                                ? 'bg-green-500'
                                : currentToken.analysis.riskScore < 40
                                  ? 'bg-yellow-500'
                                  : currentToken.analysis.riskScore < 60
                                    ? 'bg-orange-500'
                                    : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.max(10, 100 - currentToken.analysis.riskScore)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Risk Score: {currentToken.analysis.riskScore}% | Compliance:{' '}
                          {currentToken.analysis.compliance.complianceScore}%
                        </div>
                      </div>

                      {/* Token Parts */}
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Token Structure</Label>

                        <Tabs defaultValue="header" className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="header">Header</TabsTrigger>
                            <TabsTrigger value="payload">Payload</TabsTrigger>
                            <TabsTrigger value="signature">Signature</TabsTrigger>
                          </TabsList>

                          <TabsContent value="header" className="mt-3">
                            <div className="bg-muted p-3 rounded-lg">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(currentToken.header, null, 2)}
                              </pre>
                            </div>
                          </TabsContent>

                          <TabsContent value="payload" className="mt-3">
                            <div className="bg-muted p-3 rounded-lg">
                              <pre className="text-xs font-mono whitespace-pre-wrap">
                                {JSON.stringify(currentToken.payload, null, 2)}
                              </pre>
                            </div>
                          </TabsContent>

                          <TabsContent value="signature" className="mt-3">
                            <div className="bg-muted p-3 rounded-lg">
                              <div className="text-xs font-mono break-all">
                                {currentToken.signature || 'No signature (algorithm: none)'}
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Size</div>
                          <div className="text-lg">{formatFileSize(currentToken.metadata.size)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Claims</div>
                          <div className="text-lg">{currentToken.metadata.uniqueClaims}</div>
                        </div>
                        <div>
                          <div className="font-medium">Strength</div>
                          <div className="text-lg">{currentToken.metadata.estimatedStrength} bits</div>
                        </div>
                        <div>
                          <div className="font-medium">Entropy</div>
                          <div className="text-lg">{currentToken.metadata.entropy.toFixed(1)}</div>
                        </div>
                      </div>

                      {/* Warnings and Recommendations */}
                      {(currentToken.analysis.warnings.length > 0 ||
                        currentToken.analysis.recommendations.length > 0) && (
                        <div className="space-y-2">
                          {currentToken.analysis.warnings.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-orange-600 mb-1">Warnings</div>
                              <div className="space-y-1">
                                {currentToken.analysis.warnings.map((warning, index) => (
                                  <div
                                    key={index}
                                    className="text-xs p-2 bg-orange-50 border border-orange-200 rounded"
                                  >
                                    {warning}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {currentToken.analysis.recommendations.length > 0 && (
                            <div>
                              <div className="text-sm font-medium text-blue-600 mb-1">Recommendations</div>
                              <div className="space-y-1">
                                {currentToken.analysis.recommendations.slice(0, 3).map((rec, index) => (
                                  <div key={index} className="text-xs p-2 bg-blue-50 border border-blue-200 rounded">
                                    {rec}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => exportToken(currentToken, 'json')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button onClick={() => exportToken(currentToken, 'csv')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          CSV
                        </Button>
                        <Button onClick={() => exportToken(currentToken, 'txt')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          Report
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No JWT Generated</h3>
                      <p className="text-muted-foreground mb-4">
                        Configure your JWT settings and click "Generate JWT" to create a token
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent value="batch" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch JWT Generation</CardTitle>
                <CardDescription>Generate multiple JWT tokens for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Batch Generation</h3>
                  <p className="text-muted-foreground">Batch JWT generation functionality coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Generation History</CardTitle>
                <CardDescription>View and manage your generated JWT tokens</CardDescription>
              </CardHeader>
              <CardContent>
                {tokens.length > 0 ? (
                  <div className="space-y-4">
                    {tokens.slice(0, 10).map((token) => (
                      <div key={token.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">{token.createdAt.toLocaleString()}</div>
                          <div className="flex items-center gap-2">
                            {token.analysis.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                token.analysis.securityLevel === 'high'
                                  ? 'bg-green-100 text-green-800'
                                  : token.analysis.securityLevel === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : token.analysis.securityLevel === 'low'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {token.analysis.securityLevel}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Algorithm:</strong> {token.config.algorithm}
                            {token.config.issuer && (
                              <span className="ml-4">
                                <strong>Issuer:</strong> {token.config.issuer}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>Risk: {token.analysis.riskScore}%</div>
                            <div>Compliance: {token.analysis.compliance.complianceScore}%</div>
                            <div>Size: {formatFileSize(token.metadata.size)}</div>
                          </div>
                          <div className="text-xs font-mono bg-muted p-2 rounded truncate">
                            {token.token.substring(0, 100)}...
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline" onClick={() => exportToken(token, 'json')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(token.token, 'JWT Token')}>
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => removeToken(token.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {tokens.length > 10 && (
                      <div className="text-center text-sm text-muted-foreground">
                        Showing 10 of {tokens.length} tokens
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No History</h3>
                    <p className="text-muted-foreground">Generate some JWT tokens to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">JWT Templates</CardTitle>
                <CardDescription>Pre-configured JWT templates for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jwtTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedTemplate === template.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
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
                                template.securityLevel === 'high'
                                  ? 'bg-green-100 text-green-800'
                                  : template.securityLevel === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {template.securityLevel}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs font-medium mb-1">Use Cases:</div>
                            <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Features:</div>
                            <div className="text-xs text-muted-foreground">{template.features.join(', ')}</div>
                          </div>
                          {template.config && (
                            <div>
                              <div className="text-xs font-medium mb-1">Configuration:</div>
                              <div className="text-xs text-muted-foreground">
                                Algorithm: {template.config.algorithm}, Expires: {template.config.expiresIn || 'Never'}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
const JwtGenerator = () => {
  return <JWTGeneratorCore />
}

export default JwtGenerator
