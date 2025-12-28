import { useCallback, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  Shield,
  Clock,
  Info,
  Key,
  Layers,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { nanoid } from "nanoid"
import type {
  JWTToken,
  JWTHeader,
  JWTPayload,
  JWTAnalysis,
  JWTStructure,
  JWTClaims,
  JWTTiming,
  JWTCompliance,
  JWTSecurity,
  JWTVulnerability,
  JWTMetadata,
  JWTBatch,
  BatchSettings,
  BatchStatistics,
  JWTTemplate,
  JWTValidation,
  ExportFormat,
} from "@/components/tools/jwt-decode/schema"
import { formatFileSize } from "@/lib/utils"
// Enhanced Types

// Utility functions

// JWT parsing and analysis functions
const parseJWT = (token: string): JWTToken => {
  const id = nanoid()
  const createdAt = new Date()

  try {
    const parts = token.split(".")

    if (parts.length !== 3) {
      throw new Error("Invalid JWT structure: must have exactly 3 parts")
    }

    const [headerPart, payloadPart, signaturePart] = parts

    // Parse header
    let header: JWTHeader
    try {
      const headerDecoded = base64UrlDecode(headerPart)
      header = JSON.parse(headerDecoded)
    } catch (error) {
      throw new Error("Invalid JWT header: cannot decode or parse")
    }

    // Parse payload
    let payload: JWTPayload
    try {
      const payloadDecoded = base64UrlDecode(payloadPart)
      payload = JSON.parse(payloadDecoded)
    } catch (error) {
      throw new Error("Invalid JWT payload: cannot decode or parse")
    }

    // Basic validation
    const isValid = validateJWTStructure(header, payload)
    const isExpired = checkExpiration(payload)
    const timeToExpiry = calculateTimeToExpiry(payload)
    const algorithm = header.alg || "unknown"
    const keyId = header.kid

    // Perform analysis
    const analysis = analyzeJWT(header, payload, parts)
    const security = analyzeJWTSecurity(header, payload, signaturePart)
    const metadata = calculateJWTMetadata(token, header, payload)

    return {
      id,
      raw: token,
      header,
      payload,
      signature: signaturePart,
      isValid,
      isExpired,
      timeToExpiry,
      algorithm,
      keyId,
      analysis,
      security,
      metadata,
      createdAt,
    }
  } catch (error) {
    // Return invalid token with error information
    return {
      id,
      raw: token,
      header: {} as JWTHeader,
      payload: {} as JWTPayload,
      signature: "",
      isValid: false,
      isExpired: false,
      timeToExpiry: undefined,
      algorithm: "unknown",
      analysis: {
        structure: {
          hasHeader: false,
          hasPayload: false,
          hasSignature: false,
          headerValid: false,
          payloadValid: false,
          signaturePresent: false,
          partsCount: token.split(".").length,
          encoding: "invalid",
        },
        claims: {
          standardClaims: [],
          customClaims: [],
          missingRecommendedClaims: [],
          claimTypes: {},
          claimSizes: {},
        },
        timing: {
          isExpired: false,
          isNotYetValid: false,
        },
        compliance: {
          rfc7519Compliant: false,
          hasRequiredClaims: false,
          hasRecommendedClaims: false,
          algorithmSupported: false,
          structureValid: false,
          complianceScore: 0,
        },
        recommendations: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : "Unknown error parsing JWT"],
      },
      security: {
        algorithm: "unknown",
        algorithmType: "unknown",
        securityLevel: "critical",
        vulnerabilities: [
          {
            type: "structure",
            severity: "critical",
            description: "JWT structure is invalid",
            recommendation: "Provide a valid JWT token",
          },
        ],
        recommendations: ["Provide a valid JWT token"],
        riskScore: 100,
        signatureVerifiable: false,
      },
      metadata: {
        size: token.length,
        headerSize: 0,
        payloadSize: 0,
        signatureSize: 0,
        compressionRatio: 0,
        entropy: 0,
        uniqueClaims: 0,
        nestedLevels: 0,
      },
      createdAt,
    }
  }
}

const base64UrlDecode = (str: string): string => {
  // Add padding if needed
  let padded = str
  while (padded.length % 4) {
    padded += "="
  }

  // Replace URL-safe characters
  const base64 = padded.replace(/-/g, "+").replace(/_/g, "/")

  try {
    return atob(base64)
  } catch (error) {
    throw new Error("Invalid base64url encoding")
  }
}

const validateJWTStructure = (header: JWTHeader, payload: JWTPayload): boolean => {
  // Check required header fields
  if (!header.alg || !header.typ) {
    return false
  }

  // Check if typ is JWT
  if (header.typ !== "JWT") {
    return false
  }

  // Basic payload validation (should be an object)
  if (typeof payload !== "object" || payload === null) {
    return false
  }

  return true
}

const checkExpiration = (payload: JWTPayload): boolean => {
  if (!payload.exp) return false

  const now = Math.floor(Date.now() / 1000)
  return payload.exp < now
}

const calculateTimeToExpiry = (payload: JWTPayload): number | undefined => {
  if (!payload.exp) return undefined

  const now = Math.floor(Date.now() / 1000)
  const timeToExpiry = payload.exp - now
  return timeToExpiry > 0 ? timeToExpiry : 0
}

const analyzeJWT = (header: JWTHeader, payload: JWTPayload, parts: string[]): JWTAnalysis => {
  const structure = analyzeStructure(header, payload, parts)
  const claims = analyzeClaims(payload)
  const timing = analyzeTiming(payload)
  const compliance = analyzeCompliance(header, payload)

  const recommendations: string[] = []
  const warnings: string[] = []
  const errors: string[] = []

  // Generate recommendations
  if (!payload.exp) {
    recommendations.push("Add expiration time (exp) claim for security")
  }

  if (!payload.iat) {
    recommendations.push("Add issued at (iat) claim for tracking")
  }

  if (!payload.iss) {
    recommendations.push("Add issuer (iss) claim for identification")
  }

  if (header.alg === "none") {
    warnings.push('Algorithm "none" provides no security')
  }

  if (timing.isExpired) {
    warnings.push("Token has expired")
  }

  if (!structure.signaturePresent) {
    errors.push("No signature present")
  }

  return {
    structure,
    claims,
    timing,
    compliance,
    recommendations,
    warnings,
    errors,
  }
}

const analyzeStructure = (header: JWTHeader, payload: JWTPayload, parts: string[]): JWTStructure => {
  return {
    hasHeader: parts.length > 0 && parts[0].length > 0,
    hasPayload: parts.length > 1 && parts[1].length > 0,
    hasSignature: parts.length > 2 && parts[2].length > 0,
    headerValid: typeof header === "object" && !!header.alg && !!header.typ,
    payloadValid: typeof payload === "object" && payload !== null,
    signaturePresent: parts.length > 2 && parts[2].length > 0,
    partsCount: parts.length,
    encoding: "base64url", // 假设能到这里就是有效的
  }
}

const analyzeClaims = (payload: JWTPayload): JWTClaims => {
  const standardClaims = ["iss", "sub", "aud", "exp", "nbf", "iat", "jti"]
  const recommendedClaims = ["iss", "exp", "iat"]

  const presentStandardClaims = standardClaims.filter((claim) => payload[claim] !== undefined)
  const customClaims = Object.keys(payload).filter((claim) => !standardClaims.includes(claim))
  const missingRecommendedClaims = recommendedClaims.filter((claim) => payload[claim] === undefined)

  const claimTypes: Record<string, string> = {}
  const claimSizes: Record<string, number> = {}

  Object.entries(payload).forEach(([key, value]) => {
    claimTypes[key] = typeof value
    claimSizes[key] = JSON.stringify(value).length
  })

  return {
    standardClaims: presentStandardClaims,
    customClaims,
    missingRecommendedClaims,
    claimTypes,
    claimSizes,
  }
}

const analyzeTiming = (payload: JWTPayload): JWTTiming => {
  const now = Math.floor(Date.now() / 1000)

  const issuedAt = payload.iat ? new Date(payload.iat * 1000) : undefined
  const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined
  const notBefore = payload.nbf ? new Date(payload.nbf * 1000) : undefined

  const timeToExpiry = payload.exp ? payload.exp - now : undefined
  const isExpired = payload.exp ? payload.exp < now : false
  const isNotYetValid = payload.nbf ? payload.nbf > now : false

  const lifetime = payload.exp && payload.iat ? payload.exp - payload.iat : undefined
  const age = payload.iat ? now - payload.iat : undefined

  return {
    issuedAt,
    expiresAt,
    notBefore,
    timeToExpiry,
    isExpired,
    isNotYetValid,
    lifetime,
    age,
  }
}

const analyzeCompliance = (header: JWTHeader, payload: JWTPayload): JWTCompliance => {
  const hasRequiredClaims = header.alg && header.typ
  const hasRecommendedClaims = !!(payload.iss && payload.exp && payload.iat)
  const algorithmSupported = isAlgorithmSupported(header.alg)
  const structureValid = validateJWTStructure(header, payload)

  let complianceScore = 0
  if (hasRequiredClaims) complianceScore += 25
  if (hasRecommendedClaims) complianceScore += 25
  if (algorithmSupported) complianceScore += 25
  if (structureValid) complianceScore += 25

  const rfc7519Compliant = complianceScore >= 75

  return {
    rfc7519Compliant,
    hasRequiredClaims: !!hasRequiredClaims,
    hasRecommendedClaims,
    algorithmSupported,
    structureValid,
    complianceScore,
  }
}

const isAlgorithmSupported = (algorithm: string): boolean => {
  const supportedAlgorithms = [
    "HS256",
    "HS384",
    "HS512",
    "RS256",
    "RS384",
    "RS512",
    "ES256",
    "ES384",
    "ES512",
    "PS256",
    "PS384",
    "PS512",
  ]
  return supportedAlgorithms.includes(algorithm)
}

const analyzeJWTSecurity = (header: JWTHeader, payload: JWTPayload, signature: string): JWTSecurity => {
  const algorithm = header.alg || "unknown"
  const algorithmType = getAlgorithmType(algorithm)
  const vulnerabilities: JWTVulnerability[] = []
  const recommendations: string[] = []

  // Check for security issues
  if (algorithm === "none") {
    vulnerabilities.push({
      type: "algorithm",
      severity: "critical",
      description: "No signature algorithm specified",
      recommendation: "Use a secure signing algorithm like RS256 or HS256",
    })
  }

  if (algorithm.startsWith("HS") && algorithmType === "symmetric") {
    vulnerabilities.push({
      type: "algorithm",
      severity: "medium",
      description: "Symmetric algorithm requires shared secret",
      recommendation: "Consider using asymmetric algorithms (RS256, ES256) for better security",
    })
  }

  if (!payload.exp) {
    vulnerabilities.push({
      type: "timing",
      severity: "high",
      description: "No expiration time specified",
      recommendation: "Add expiration time (exp) claim to limit token lifetime",
    })
  }

  if (payload.exp && payload.iat) {
    const lifetime = payload.exp - payload.iat
    if (lifetime > 86400) {
      // More than 24 hours
      vulnerabilities.push({
        type: "timing",
        severity: "medium",
        description: "Token lifetime is very long",
        recommendation: "Consider shorter token lifetimes for better security",
      })
    }
  }

  if (!signature || signature.length === 0) {
    vulnerabilities.push({
      type: "signature",
      severity: "critical",
      description: "No signature present",
      recommendation: "Ensure token is properly signed",
    })
  }

  // Calculate security level
  const criticalVulns = vulnerabilities.filter((v) => v.severity === "critical").length
  const highVulns = vulnerabilities.filter((v) => v.severity === "high").length
  const mediumVulns = vulnerabilities.filter((v) => v.severity === "medium").length

  let securityLevel: "high" | "medium" | "low" | "critical"
  let riskScore = 0

  if (criticalVulns > 0) {
    securityLevel = "critical"
    riskScore = 90 + criticalVulns * 5
  } else if (highVulns > 0) {
    securityLevel = "low"
    riskScore = 60 + highVulns * 10
  } else if (mediumVulns > 0) {
    securityLevel = "medium"
    riskScore = 30 + mediumVulns * 10
  } else {
    securityLevel = "high"
    riskScore = 10
  }

  riskScore = Math.min(100, riskScore)

  // Generate recommendations
  if (algorithm === "none") {
    recommendations.push("Use a secure signing algorithm")
  }
  if (!payload.exp) {
    recommendations.push("Add expiration time for security")
  }
  if (!payload.iss) {
    recommendations.push("Add issuer claim for verification")
  }
  if (algorithmType === "symmetric") {
    recommendations.push("Consider asymmetric algorithms for better key management")
  }

  return {
    algorithm,
    algorithmType,
    securityLevel,
    vulnerabilities,
    recommendations,
    riskScore,
    signatureVerifiable: signature.length > 0 && algorithm !== "none",
  }
}

const getAlgorithmType = (algorithm: string): "symmetric" | "asymmetric" | "none" | "unknown" => {
  if (algorithm === "none") return "none"
  if (algorithm.startsWith("HS")) return "symmetric"
  if (algorithm.startsWith("RS") || algorithm.startsWith("ES") || algorithm.startsWith("PS")) return "asymmetric"
  return "unknown"
}

const calculateJWTMetadata = (token: string, header: JWTHeader, payload: JWTPayload): JWTMetadata => {
  const parts = token.split(".")
  const headerSize = parts[0]?.length || 0
  const payloadSize = parts[1]?.length || 0
  const signatureSize = parts[2]?.length || 0

  const originalSize = JSON.stringify(header).length + JSON.stringify(payload).length
  const encodedSize = headerSize + payloadSize
  const compressionRatio = originalSize > 0 ? encodedSize / originalSize : 0

  // Calculate entropy (simplified)
  const entropy = calculateEntropy(token)

  // Count unique claims
  const uniqueClaims = Object.keys(payload).length

  // Calculate nesting levels
  const nestedLevels = calculateNestingLevels(payload)

  return {
    size: token.length,
    headerSize,
    payloadSize,
    signatureSize,
    compressionRatio,
    entropy,
    uniqueClaims,
    nestedLevels,
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

const calculateNestingLevels = (obj: any, level = 0): number => {
  if (typeof obj !== "object" || obj === null) {
    return level
  }

  let maxLevel = level
  for (const value of Object.values(obj)) {
    if (typeof value === "object" && value !== null) {
      maxLevel = Math.max(maxLevel, calculateNestingLevels(value, level + 1))
    }
  }

  return maxLevel
}

// JWT Templates
const jwtTemplates: JWTTemplate[] = [
  {
    id: "basic-jwt",
    name: "Basic JWT",
    description: "Simple JWT with essential claims",
    category: "Basic",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
    useCase: ["Authentication", "Simple authorization", "Basic user identification"],
    features: ["Standard claims", "HS256 algorithm", "User identification"],
    securityLevel: "medium",
  },
  {
    id: "auth-jwt",
    name: "Authentication JWT",
    description: "JWT with authentication and authorization claims",
    category: "Authentication",
    example:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1In0.eyJpc3MiOiJhdXRoLnNlcnZpY2UuY29tIiwic3ViIjoidXNlcjEyMyIsImF1ZCI6WyJhcGkuc2VydmljZS5jb20iXSwiZXhwIjoxNjg5NzY5NjAwLCJuYmYiOjE2ODk3NjYwMDAsImlhdCI6MTY4OTc2NjAwMCwianRpIjoiYWJjZGVmZ2giLCJzY29wZSI6InJlYWQgd3JpdGUiLCJyb2xlcyI6WyJ1c2VyIiwiYWRtaW4iXX0.example-signature",
    useCase: ["User authentication", "API authorization", "Role-based access control"],
    features: ["Complete standard claims", "RS256 algorithm", "Roles and scopes", "Key ID"],
    securityLevel: "high",
  },
  {
    id: "api-jwt",
    name: "API Access JWT",
    description: "JWT for API access with permissions",
    category: "API",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhcGkuZXhhbXBsZS5jb20iLCJzdWIiOiJhcGlfa2V5XzEyMyIsImF1ZCI6ImFwaS5leGFtcGxlLmNvbSIsImV4cCI6MTY4OTc2OTYwMCwiaWF0IjoxNjg5NzY2MDAwLCJzY29wZSI6InVzZXJzOnJlYWQgdXNlcnM6d3JpdGUiLCJwZXJtaXNzaW9ucyI6WyJyZWFkX3VzZXJzIiwid3JpdGVfdXNlcnMiLCJkZWxldGVfdXNlcnMiXX0.example-signature",
    useCase: ["API access control", "Service-to-service communication", "Permission management"],
    features: ["API-specific claims", "Detailed permissions", "Service identification"],
    securityLevel: "high",
  },
  {
    id: "refresh-jwt",
    name: "Refresh Token JWT",
    description: "Long-lived refresh token for token renewal",
    category: "Refresh",
    example:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhdXRoLnNlcnZpY2UuY29tIiwic3ViIjoidXNlcjEyMyIsImF1ZCI6ImF1dGguc2VydmljZS5jb20iLCJleHAiOjE2OTI0NDQ4MDAsImlhdCI6MTY4OTc2NjAwMCwidG9rZW5fdHlwZSI6InJlZnJlc2giLCJqdGkiOiJyZWZyZXNoXzEyMyJ9.example-signature",
    useCase: ["Token refresh", "Long-term authentication", "Session management"],
    features: ["Long expiration", "Refresh-specific claims", "Session tracking"],
    securityLevel: "medium",
  },
  {
    id: "id-token-jwt",
    name: "OpenID Connect ID Token",
    description: "OIDC ID token with user information",
    category: "Identity",
    example:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjEyMzQ1In0.eyJpc3MiOiJodHRwczovL2F1dGgucHJvdmlkZXIuY29tIiwic3ViIjoiMTIzNDU2Nzg5MCIsImF1ZCI6ImNsaWVudF9pZF8xMjMiLCJleHAiOjE2ODk3Njk2MDAsImlhdCI6MTY4OTc2NjAwMCwiYXV0aF90aW1lIjoxNjg5NzY2MDAwLCJub25jZSI6InJhbmRvbV9ub25jZSIsImVtYWlsIjoiam9obi5kb2VAZXhhbXBsZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwibmFtZSI6IkpvaG4gRG9lIiwicGljdHVyZSI6Imh0dHBzOi8vZXhhbXBsZS5jb20vYXZhdGFyLmpwZyJ9.example-signature",
    useCase: ["OpenID Connect", "User identity", "Single sign-on"],
    features: ["OIDC standard claims", "User profile information", "Email verification"],
    securityLevel: "high",
  },
  {
    id: "insecure-jwt",
    name: "Insecure JWT (Demo)",
    description: "JWT with security issues for testing",
    category: "Testing",
    example:
      "eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.",
    useCase: ["Security testing", "Vulnerability demonstration", "Educational purposes"],
    features: ["No signature", "No expiration", "Security vulnerabilities"],
    securityLevel: "low",
  },
]

// Validation functions
const validateJWT = (token: string): JWTValidation => {
  const validation: JWTValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  if (!token || token.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: "No JWT token provided",
      type: "structure",
      severity: "error",
    })
    validation.qualityScore = 0
    return validation
  }

  const parts = token.split(".")

  if (parts.length !== 3) {
    validation.isValid = false
    validation.errors.push({
      message: `Invalid JWT structure: expected 3 parts, got ${parts.length}`,
      type: "structure",
      severity: "error",
    })
    validation.qualityScore -= 50
  }

  // Validate header
  try {
    const headerDecoded = base64UrlDecode(parts[0])
    const header = JSON.parse(headerDecoded)

    if (!header.alg) {
      validation.errors.push({
        message: "Missing algorithm (alg) in header",
        type: "header",
        severity: "error",
      })
      validation.qualityScore -= 20
    }

    if (!header.typ || header.typ !== "JWT") {
      validation.warnings.push("Missing or incorrect type (typ) in header")
      validation.qualityScore -= 5
    }

    if (header.alg === "none") {
      validation.warnings.push('Algorithm "none" provides no security')
      validation.qualityScore -= 30
    }
  } catch (error) {
    validation.isValid = false
    validation.errors.push({
      message: "Invalid header: cannot decode or parse",
      type: "header",
      severity: "error",
    })
    validation.qualityScore -= 30
  }

  // Validate payload
  try {
    const payloadDecoded = base64UrlDecode(parts[1])
    const payload = JSON.parse(payloadDecoded)

    if (!payload.exp) {
      validation.warnings.push("Missing expiration time (exp) claim")
      validation.suggestions.push("Add expiration time for security")
      validation.qualityScore -= 15
    } else {
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp < now) {
        validation.warnings.push("Token has expired")
        validation.qualityScore -= 10
      }
    }

    if (!payload.iat) {
      validation.warnings.push("Missing issued at (iat) claim")
      validation.suggestions.push("Add issued at time for tracking")
      validation.qualityScore -= 5
    }

    if (!payload.iss) {
      validation.warnings.push("Missing issuer (iss) claim")
      validation.suggestions.push("Add issuer for verification")
      validation.qualityScore -= 5
    }
  } catch (error) {
    validation.isValid = false
    validation.errors.push({
      message: "Invalid payload: cannot decode or parse",
      type: "payload",
      severity: "error",
    })
    validation.qualityScore -= 30
  }

  // Validate signature
  if (parts[2].length === 0) {
    validation.warnings.push("No signature present")
    validation.suggestions.push("Ensure token is properly signed")
    validation.qualityScore -= 20
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push("Excellent JWT structure and security")
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push("Good JWT structure, minor improvements possible")
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push("JWT structure needs improvement")
  } else {
    validation.suggestions.push("JWT has significant security issues")
  }

  return validation
}

// Custom hooks
const useJWTDecoder = () => {
  const [tokens, setTokens] = useState<JWTToken[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const decodeToken = useCallback(async (tokenString: string): Promise<JWTToken> => {
    setIsProcessing(true)
    try {
      const token = parseJWT(tokenString)
      setTokens((prev) => [token, ...prev.filter((t) => t.raw !== tokenString)])
      return token
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const processBatch = useCallback(async (tokenStrings: string[], batchSettings: BatchSettings): Promise<JWTBatch> => {
    setIsProcessing(true)
    const startTime = performance.now()

    try {
      const batch: JWTBatch = {
        id: nanoid(),
        name: batchSettings.namingPattern || "JWT Batch",
        tokens: [],
        count: tokenStrings.length,
        settings: batchSettings,
        status: "processing",
        progress: 0,
        statistics: {
          totalProcessed: 0,
          totalTokens: 0,
          validCount: 0,
          validTokens: 0,
          invalidCount: 0,
          invalidTokens: 0,
          expiredCount: 0,
          expiredTokens: 0,
          averageSecurityScore: 0,
          averageComplianceScore: 0,
          algorithmDistribution: {},
          issuerDistribution: {},
          processingTime: 0,
          averageProcessingTime: 0,
        },
        createdAt: new Date(),
      }

      const batchTokens: JWTToken[] = []

      for (let i = 0; i < tokenStrings.length; i++) {
        try {
          const token = parseJWT(tokenStrings[i])
          batchTokens.push(token)

          // Update progress
          const progress = ((i + 1) / tokenStrings.length) * 100
          batch.progress = progress
        } catch (error) {
          console.error("Failed to parse JWT:", error)
        }
      }

      const endTime = performance.now()
      const totalProcessingTime = endTime - startTime

      // Calculate statistics
      const validTokens = batchTokens.filter((t) => t.isValid)
      const expiredTokens = batchTokens.filter((t) => t.isExpired)
      const invalidTokens = batchTokens.filter((t) => !t.isValid)

      const algorithmDistribution: Record<string, number> = {}
      const issuerDistribution: Record<string, number> = {}
      let totalSecurityScore = 0
      let totalComplianceScore = 0

      batchTokens.forEach((token) => {
        algorithmDistribution[token.algorithm] = (algorithmDistribution[token.algorithm] || 0) + 1

        const issuer = token.payload.iss || "unknown"
        issuerDistribution[issuer] = (issuerDistribution[issuer] || 0) + 1

        totalSecurityScore += 100 - token.security.riskScore
        totalComplianceScore += token.analysis.compliance.complianceScore
      })

      const statistics: BatchStatistics = {
        totalProcessed: batchTokens.length,
        totalTokens: batchTokens.length,
        validCount: validTokens.length,
        validTokens: validTokens.length,
        invalidCount: invalidTokens.length,
        invalidTokens: invalidTokens.length,
        expiredCount: expiredTokens.length,
        expiredTokens: expiredTokens.length,
        averageSecurityScore: batchTokens.length > 0 ? totalSecurityScore / batchTokens.length : 0,
        averageComplianceScore: batchTokens.length > 0 ? totalComplianceScore / batchTokens.length : 0,
        algorithmDistribution,
        issuerDistribution,
        processingTime: totalProcessingTime,
        averageProcessingTime: totalProcessingTime / batchTokens.length,
      }

      batch.tokens = batchTokens
      batch.status = "completed"
      batch.progress = 100
      batch.statistics = statistics
      batch.completedAt = new Date()

      setTokens((prev) => [...batchTokens, ...prev])
      return batch
    } finally {
      setIsProcessing(false)
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
    isProcessing,
    decodeToken,
    processBatch,
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
const useJWTExport = () => {
  const exportToken = useCallback((token: JWTToken, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        content = JSON.stringify(token, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = generateCSVFromToken(token)
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "txt":
        content = generateTextFromToken(token)
        mimeType = "text/plain"
        extension = ".txt"
        break
      case "xml":
        content = generateXMLFromToken(token)
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "yaml":
        content = generateYAMLFromToken(token)
        mimeType = "text/yaml"
        extension = ".yaml"
        break
      default:
        content = JSON.stringify(token.payload, null, 2)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `jwt-token-${token.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const exportBatch = useCallback((batch: JWTBatch) => {
    const content = JSON.stringify(batch, null, 2)
    const blob = new Blob([content], { type: "application/json;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
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
const generateCSVFromToken = (token: JWTToken): string => {
  const headers = ["Field", "Value", "Type", "Description"]
  const rows: string[][] = []

  // Header fields
  Object.entries(token.header).forEach(([key, value]) => {
    rows.push([`header.${key}`, String(value), typeof value, "JWT Header"])
  })

  // Payload fields
  Object.entries(token.payload).forEach(([key, value]) => {
    rows.push([`payload.${key}`, String(value), typeof value, "JWT Payload"])
  })

  // Analysis data
  rows.push(["analysis.isValid", String(token.isValid), "boolean", "Token Validity"])
  rows.push(["analysis.isExpired", String(token.isExpired), "boolean", "Token Expiration"])
  rows.push(["security.riskScore", String(token.security.riskScore), "number", "Security Risk Score"])
  rows.push(["compliance.score", String(token.analysis.compliance.complianceScore), "number", "Compliance Score"])

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
}

const generateTextFromToken = (token: JWTToken): string => {
  return `JWT Token Analysis - ${token.createdAt.toLocaleString()}

=== HEADER ===
${JSON.stringify(token.header, null, 2)}

=== PAYLOAD ===
${JSON.stringify(token.payload, null, 2)}

=== ANALYSIS ===
Valid: ${token.isValid}
Expired: ${token.isExpired}
Algorithm: ${token.algorithm}
Security Level: ${token.security.securityLevel}
Risk Score: ${token.security.riskScore}%
Compliance Score: ${token.analysis.compliance.complianceScore}%

=== TIMING ===
${token.analysis.timing.issuedAt ? `Issued At: ${token.analysis.timing.issuedAt.toLocaleString()}` : "Issued At: Not specified"}
${token.analysis.timing.expiresAt ? `Expires At: ${token.analysis.timing.expiresAt.toLocaleString()}` : "Expires At: Not specified"}
${token.analysis.timing.timeToExpiry ? `Time to Expiry: ${token.analysis.timing.timeToExpiry} seconds` : "Time to Expiry: Not applicable"}

=== SECURITY ISSUES ===
${token.security.vulnerabilities.map((v) => `- ${v.severity.toUpperCase()}: ${v.description}`).join("\n")}

=== RECOMMENDATIONS ===
${token.security.recommendations.map((r) => `- ${r}`).join("\n")}`
}

const generateXMLFromToken = (token: JWTToken): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<jwtToken id="${token.id}" timestamp="${token.createdAt.toISOString()}">
  <header>
    ${Object.entries(token.header)
      .map(([key, value]) => `<${key}>${value}</${key}>`)
      .join("\n    ")}
  </header>
  <payload>
    ${Object.entries(token.payload)
      .map(([key, value]) => `<${key}>${value}</${key}>`)
      .join("\n    ")}
  </payload>
  <analysis>
    <isValid>${token.isValid}</isValid>
    <isExpired>${token.isExpired}</isExpired>
    <algorithm>${token.algorithm}</algorithm>
    <securityLevel>${token.security.securityLevel}</securityLevel>
    <riskScore>${token.security.riskScore}</riskScore>
    <complianceScore>${token.analysis.compliance.complianceScore}</complianceScore>
  </analysis>
  <vulnerabilities>
    ${token.security.vulnerabilities
      .map(
        (v) => `
    <vulnerability severity="${v.severity}" type="${v.type}">
      <description>${v.description}</description>
      <recommendation>${v.recommendation}</recommendation>
    </vulnerability>`
      )
      .join("")}
  </vulnerabilities>
</jwtToken>`
}

const generateYAMLFromToken = (token: JWTToken): string => {
  return `id: ${token.id}
timestamp: ${token.createdAt.toISOString()}
header:
${Object.entries(token.header)
  .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
  .join("\n")}
payload:
${Object.entries(token.payload)
  .map(([key, value]) => `  ${key}: ${JSON.stringify(value)}`)
  .join("\n")}
analysis:
  isValid: ${token.isValid}
  isExpired: ${token.isExpired}
  algorithm: ${token.algorithm}
  securityLevel: ${token.security.securityLevel}
  riskScore: ${token.security.riskScore}
  complianceScore: ${token.analysis.compliance.complianceScore}
vulnerabilities:
${token.security.vulnerabilities
  .map(
    (v) => `  - severity: ${v.severity}
    type: ${v.type}
    description: ${v.description}
    recommendation: ${v.recommendation}`
  )
  .join("\n")}`
}

/**
 * Enhanced JWT Decode & Analysis Tool
 * Features: Advanced JWT parsing, security analysis, validation, and batch processing
 */
const JWTDecodeCore = () => {
  const [activeTab, setActiveTab] = useState<"decoder" | "batch" | "history" | "templates">("decoder")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [currentToken, setCurrentToken] = useState<JWTToken | null>(null)
  const [inputToken, setInputToken] = useState("")

  const { tokens, isProcessing, decodeToken, removeToken } = useJWTDecoder()
  const { exportToken } = useJWTExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = jwtTemplates.find((t) => t.id === templateId)
    if (template) {
      setInputToken(template.example)
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Decode JWT
  const handleDecode = useCallback(async () => {
    if (!inputToken.trim()) {
      toast.error("Please enter a JWT token")
      return
    }

    const validation = validateJWT(inputToken)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast.warning(warning)
      })
    }

    try {
      const token = await decodeToken(inputToken)
      setCurrentToken(token)

      if (token.isValid) {
        toast.success("JWT decoded successfully")
      } else {
        toast.error("JWT is invalid but was parsed for analysis")
      }
    } catch (error) {
      toast.error("Failed to decode JWT")
      console.error(error)
    }
  }, [inputToken, decodeToken])

  // Auto-decode when input changes (debounced)
  useEffect(() => {
    if (inputToken.trim().length > 0) {
      const timer = setTimeout(() => {
        handleDecode()
      }, 500)

      return () => clearTimeout(timer)
    } else {
      setCurrentToken(null)
    }
  }, [inputToken, handleDecode])

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
              <Key className="h-5 w-5" />
              JWT Decode & Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced JWT token decoder and security analyzer with comprehensive validation, analysis, and batch
              processing. Decode, validate, and analyze JWT tokens with detailed security insights and compliance
              checking. Use keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "decoder" | "batch" | "history" | "templates")}
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="decoder"
              className="flex items-center gap-2"
            >
              <Key className="h-4 w-4" />
              Decoder
            </TabsTrigger>
            <TabsTrigger
              value="batch"
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Batch
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
          </TabsList>

          {/* JWT Decoder Tab */}
          <TabsContent
            value="decoder"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* JWT Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    JWT Token Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="jwt-input"
                      className="text-sm font-medium"
                    >
                      JWT Token
                    </Label>
                    <Textarea
                      id="jwt-input"
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      placeholder="Paste your JWT token here..."
                      className="mt-2 font-mono text-xs"
                      rows={8}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Token will be automatically decoded as you type
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleDecode}
                      disabled={isProcessing || !inputToken.trim()}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Key className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Decoding..." : "Decode JWT"}
                    </Button>
                    <Button
                      onClick={() => {
                        setInputToken("")
                        setCurrentToken(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* JWT Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    JWT Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentToken ? (
                    <div className="space-y-4">
                      {/* Status Overview */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          {currentToken.isValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">{currentToken.isValid ? "Valid" : "Invalid"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {currentToken.isExpired ? (
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                          ) : (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm font-medium">{currentToken.isExpired ? "Expired" : "Active"}</span>
                        </div>
                      </div>

                      {/* Security Level */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Security Level</span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              currentToken.security.securityLevel === "high"
                                ? "bg-green-100 text-green-800"
                                : currentToken.security.securityLevel === "medium"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : currentToken.security.securityLevel === "low"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-red-100 text-red-800"
                            }`}
                          >
                            {currentToken.security.securityLevel.toUpperCase()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              currentToken.security.riskScore < 30
                                ? "bg-green-500"
                                : currentToken.security.riskScore < 60
                                  ? "bg-yellow-500"
                                  : currentToken.security.riskScore < 80
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                            }`}
                            style={{ width: `${Math.max(10, 100 - currentToken.security.riskScore)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Risk Score: {currentToken.security.riskScore}% | Compliance:{" "}
                          {currentToken.analysis.compliance.complianceScore}%
                        </div>
                      </div>

                      {/* Algorithm Info */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Algorithm Information</div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground">Algorithm</div>
                            <div className="font-mono">{currentToken.algorithm}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Type</div>
                            <div className="capitalize">{currentToken.security.algorithmType}</div>
                          </div>
                        </div>
                      </div>

                      {/* Timing Information */}
                      {(currentToken.analysis.timing.issuedAt || currentToken.analysis.timing.expiresAt) && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Timing Information</div>
                          <div className="space-y-1 text-xs">
                            {currentToken.analysis.timing.issuedAt && (
                              <div>
                                <span className="text-muted-foreground">Issued:</span>{" "}
                                {currentToken.analysis.timing.issuedAt.toLocaleString()}
                              </div>
                            )}
                            {currentToken.analysis.timing.expiresAt && (
                              <div>
                                <span className="text-muted-foreground">Expires:</span>{" "}
                                {currentToken.analysis.timing.expiresAt.toLocaleString()}
                              </div>
                            )}
                            {currentToken.analysis.timing.timeToExpiry !== undefined && (
                              <div>
                                <span className="text-muted-foreground">Time to Expiry:</span>{" "}
                                {currentToken.analysis.timing.timeToExpiry > 0
                                  ? `${Math.floor(currentToken.analysis.timing.timeToExpiry / 3600)}h ${Math.floor((currentToken.analysis.timing.timeToExpiry % 3600) / 60)}m`
                                  : "Expired"}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Vulnerabilities */}
                      {currentToken.security.vulnerabilities.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-red-600">Security Issues</div>
                          <div className="space-y-1">
                            {currentToken.security.vulnerabilities.slice(0, 3).map((vuln, index) => (
                              <div
                                key={index}
                                className="text-xs p-2 bg-red-50 border border-red-200 rounded"
                              >
                                <div className="font-medium text-red-800">
                                  {vuln.severity.toUpperCase()}: {vuln.description}
                                </div>
                                <div className="text-red-600 mt-1">{vuln.recommendation}</div>
                              </div>
                            ))}
                            {currentToken.security.vulnerabilities.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{currentToken.security.vulnerabilities.length - 3} more issues
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => exportToken(currentToken, "json")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button
                          onClick={() => exportToken(currentToken, "txt")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Report
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(JSON.stringify(currentToken.payload, null, 2), "JWT Payload")}
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === "JWT Payload" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No JWT Token</h3>
                      <p className="text-muted-foreground mb-4">Paste a JWT token above to decode and analyze it</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            {currentToken && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Detailed Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs
                    defaultValue="payload"
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="payload">Payload</TabsTrigger>
                      <TabsTrigger value="header">Header</TabsTrigger>
                      <TabsTrigger value="security">Security</TabsTrigger>
                      <TabsTrigger value="metadata">Metadata</TabsTrigger>
                    </TabsList>

                    <TabsContent
                      value="payload"
                      className="mt-4"
                    >
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                            {JSON.stringify(currentToken.payload, null, 2)}
                          </pre>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium mb-2">Standard Claims</div>
                            <div className="space-y-1">
                              {currentToken.analysis.claims.standardClaims.map((claim) => (
                                <div
                                  key={claim}
                                  className="text-xs"
                                >
                                  <span className="font-mono bg-muted px-1 rounded">{claim}</span>:{" "}
                                  {String(currentToken.payload[claim])}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium mb-2">Custom Claims</div>
                            <div className="space-y-1">
                              {currentToken.analysis.claims.customClaims.map((claim) => (
                                <div
                                  key={claim}
                                  className="text-xs"
                                >
                                  <span className="font-mono bg-muted px-1 rounded">{claim}</span>:{" "}
                                  {String(currentToken.payload[claim])}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="header"
                      className="mt-4"
                    >
                      <div className="bg-muted p-4 rounded-lg">
                        <pre className="text-xs font-mono whitespace-pre-wrap overflow-auto">
                          {JSON.stringify(currentToken.header, null, 2)}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="security"
                      className="mt-4"
                    >
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{currentToken.security.riskScore}%</div>
                            <div className="text-xs text-muted-foreground">Risk Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {currentToken.analysis.compliance.complianceScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Compliance</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {currentToken.security.vulnerabilities.length}
                            </div>
                            <div className="text-xs text-muted-foreground">Issues Found</div>
                          </div>
                        </div>

                        {currentToken.security.vulnerabilities.length > 0 && (
                          <div>
                            <div className="font-medium mb-2">All Security Issues</div>
                            <div className="space-y-2">
                              {currentToken.security.vulnerabilities.map((vuln, index) => (
                                <div
                                  key={index}
                                  className="p-3 border rounded-lg"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{vuln.type}</span>
                                    <span
                                      className={`text-xs px-2 py-1 rounded ${
                                        vuln.severity === "critical"
                                          ? "bg-red-100 text-red-800"
                                          : vuln.severity === "high"
                                            ? "bg-orange-100 text-orange-800"
                                            : vuln.severity === "medium"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-blue-100 text-blue-800"
                                      }`}
                                    >
                                      {vuln.severity}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground mb-2">{vuln.description}</div>
                                  <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                                    <strong>Recommendation:</strong> {vuln.recommendation}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    <TabsContent
                      value="metadata"
                      className="mt-4"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Token Size</div>
                          <div className="text-lg">{formatFileSize(currentToken.metadata.size)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Claims</div>
                          <div className="text-lg">{currentToken.metadata.uniqueClaims}</div>
                        </div>
                        <div>
                          <div className="font-medium">Entropy</div>
                          <div className="text-lg">{currentToken.metadata.entropy.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="font-medium">Nesting</div>
                          <div className="text-lg">{currentToken.metadata.nestedLevels} levels</div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent
            value="batch"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Batch JWT Processing</CardTitle>
                <CardDescription>Process multiple JWT tokens for analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Batch Processing</h3>
                  <p className="text-muted-foreground">Batch JWT processing functionality coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="history"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">JWT History</CardTitle>
                <CardDescription>View and analyze your decoded JWT tokens</CardDescription>
              </CardHeader>
              <CardContent>
                {tokens.length > 0 ? (
                  <div className="space-y-4">
                    {tokens.slice(0, 10).map((token) => (
                      <div
                        key={token.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">{token.createdAt.toLocaleString()}</div>
                          <div className="flex items-center gap-2">
                            {token.isValid ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                token.security.securityLevel === "high"
                                  ? "bg-green-100 text-green-800"
                                  : token.security.securityLevel === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : token.security.securityLevel === "low"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                              }`}
                            >
                              {token.security.securityLevel}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Algorithm:</strong> {token.algorithm}
                            {token.payload.iss && (
                              <span className="ml-4">
                                <strong>Issuer:</strong> {token.payload.iss}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-xs text-muted-foreground">
                            <div>Risk: {token.security.riskScore}%</div>
                            <div>Compliance: {token.analysis.compliance.complianceScore}%</div>
                            <div>Claims: {token.metadata.uniqueClaims}</div>
                          </div>
                          <div className="text-xs font-mono bg-muted p-2 rounded truncate">
                            {token.raw.substring(0, 100)}...
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportToken(token, "json")}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(token.raw, "JWT Token")}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeToken(token.id)}
                          >
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
                    <p className="text-muted-foreground">Decode some JWT tokens to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="templates"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">JWT Templates</CardTitle>
                <CardDescription>Example JWT tokens for testing and learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {jwtTemplates.map((template) => (
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
                                template.securityLevel === "high"
                                  ? "bg-green-100 text-green-800"
                                  : template.securityLevel === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
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
                            <div className="text-xs text-muted-foreground">{template.useCase.join(", ")}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Features:</div>
                            <div className="text-xs text-muted-foreground">{template.features?.join(", ") || "N/A"}</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium mb-1">Example Token:</div>
                            <div className="text-xs font-mono bg-muted p-2 rounded truncate">
                              {template.example.substring(0, 80)}...
                            </div>
                          </div>
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
const JwtDecode = () => {
  return <JWTDecodeCore />
}

export default JwtDecode
