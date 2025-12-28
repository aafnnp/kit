import { useCallback, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Download,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Settings,
  BookOpen,
  Eye,
  Clock,
  Hash,
  Calculator,
  Sigma,
  SquareFunction,
} from "lucide-react"
import { nanoid } from "nanoid"
import { formatNumber } from "@/lib/utils"
import type {
  PrimeAnalysis,
  PrimeFactor,
  MathematicalProperty,
  RelatedPrime,
  PrimeValidation,
  PrimeTemplate,
  PrimeAlgorithm,
  GenerationAlgorithm,
  NumberType,
  ExportFormat,
} from "@/components/tools/prime-checker/schema"

// Utility functions

// Prime checking algorithms
const primeAlgorithms = {
  trial_division: (n: number): boolean => {
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false

    for (let i = 3; i <= Math.sqrt(n); i += 2) {
      if (n % i === 0) return false
    }
    return true
  },

  sieve_of_eratosthenes: (n: number): boolean => {
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false

    // For single number check, use trial division for efficiency
    return primeAlgorithms.trial_division(n)
  },

  miller_rabin: (n: number, k: number = 5): boolean => {
    if (n < 2) return false
    if (n === 2 || n === 3) return true
    if (n % 2 === 0) return false

    // Write n-1 as d * 2^r
    let d = n - 1
    let r = 0
    while (d % 2 === 0) {
      d /= 2
      r++
    }

    // Witness loop
    for (let i = 0; i < k; i++) {
      const a = 2 + Math.floor(Math.random() * (n - 4))
      let x = modularExponentiation(a, d, n)

      if (x === 1 || x === n - 1) continue

      let composite = true
      for (let j = 0; j < r - 1; j++) {
        x = (x * x) % n
        if (x === n - 1) {
          composite = false
          break
        }
      }

      if (composite) return false
    }

    return true
  },

  fermat: (n: number, k: number = 5): boolean => {
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false

    for (let i = 0; i < k; i++) {
      const a = 2 + Math.floor(Math.random() * (n - 3))
      if (modularExponentiation(a, n - 1, n) !== 1) {
        return false
      }
    }

    return true
  },

  solovay_strassen: (n: number, k: number = 5): boolean => {
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false

    for (let i = 0; i < k; i++) {
      const a = 2 + Math.floor(Math.random() * (n - 3))
      const jacobian = jacobiSymbol(a, n)
      const mod = modularExponentiation(a, (n - 1) / 2, n)

      if (jacobian === 0 || mod !== (jacobian + n) % n) {
        return false
      }
    }

    return true
  },

  aks: (n: number): boolean => {
    // Simplified AKS implementation for demonstration
    // Full AKS is extremely complex and not practical for large numbers
    if (n < 2) return false
    if (n === 2) return true
    if (n % 2 === 0) return false

    // For practical purposes, fall back to Miller-Rabin for large numbers
    if (n > 1000000) {
      return primeAlgorithms.miller_rabin(n, 10)
    }

    return primeAlgorithms.trial_division(n)
  },
}

// Mathematical helper functions
const modularExponentiation = (base: number, exponent: number, modulus: number): number => {
  let result = 1
  base = base % modulus

  while (exponent > 0) {
    if (exponent % 2 === 1) {
      result = (result * base) % modulus
    }
    exponent = Math.floor(exponent / 2)
    base = (base * base) % modulus
  }

  return result
}

const jacobiSymbol = (a: number, n: number): number => {
  if (n <= 0 || n % 2 === 0) return 0

  let result = 1
  a = a % n

  while (a !== 0) {
    while (a % 2 === 0) {
      a /= 2
      if (n % 8 === 3 || n % 8 === 5) {
        result = -result
      }
    }

    ;[a, n] = [n, a]

    if (a % 4 === 3 && n % 4 === 3) {
      result = -result
    }

    a = a % n
  }

  return n === 1 ? result : 0
}

// Prime generation algorithms
const generatePrimes = (limit: number, algorithm: GenerationAlgorithm = "sieve"): number[] => {
  switch (algorithm) {
    case "sieve":
      return sieveOfEratosthenes(limit)
    case "incremental":
      return incrementalGeneration(limit)
    case "wheel":
      return wheelFactorization(limit)
    case "segmented_sieve":
      return segmentedSieve(limit)
    default:
      return sieveOfEratosthenes(limit)
  }
}

const sieveOfEratosthenes = (limit: number): number[] => {
  if (limit < 2) return []

  const sieve = new Array(limit + 1).fill(true)
  sieve[0] = sieve[1] = false

  for (let i = 2; i * i <= limit; i++) {
    if (sieve[i]) {
      for (let j = i * i; j <= limit; j += i) {
        sieve[j] = false
      }
    }
  }

  return sieve.map((isPrime, index) => (isPrime ? index : -1)).filter((num) => num !== -1)
}

const incrementalGeneration = (limit: number): number[] => {
  const primes: number[] = []

  for (let i = 2; i <= limit; i++) {
    if (primeAlgorithms.trial_division(i)) {
      primes.push(i)
    }
  }

  return primes
}

const wheelFactorization = (limit: number): number[] => {
  if (limit < 2) return []
  if (limit < 3) return [2]
  if (limit < 5) return [2, 3]

  const primes = [2, 3, 5]
  const wheel = [4, 6, 10, 12, 16, 18, 22, 24]

  let candidate = 7
  let wheelIndex = 0

  while (candidate <= limit) {
    if (primeAlgorithms.trial_division(candidate)) {
      primes.push(candidate)
    }

    candidate += wheel[wheelIndex]
    wheelIndex = (wheelIndex + 1) % wheel.length
  }

  return primes
}

const segmentedSieve = (limit: number): number[] => {
  if (limit < 2) return []

  const segmentSize = Math.max(Math.floor(Math.sqrt(limit)), 32768)
  const primes: number[] = []

  // Generate primes up to sqrt(limit) using simple sieve
  const sqrtLimit = Math.floor(Math.sqrt(limit))
  const basePrimes = sieveOfEratosthenes(sqrtLimit)
  primes.push(...basePrimes)

  // Process segments
  for (let low = sqrtLimit + 1; low <= limit; low += segmentSize) {
    const high = Math.min(low + segmentSize - 1, limit)
    const segment = new Array(high - low + 1).fill(true)

    for (const prime of basePrimes) {
      const start = Math.max(prime * prime, Math.ceil(low / prime) * prime)

      for (let j = start; j <= high; j += prime) {
        segment[j - low] = false
      }
    }

    for (let i = 0; i < segment.length; i++) {
      if (segment[i]) {
        primes.push(low + i)
      }
    }
  }

  return primes
}

// Factorization functions
const factorize = (n: number): number[] => {
  const factors: number[] = []
  let num = n

  // Handle factor 2
  while (num % 2 === 0) {
    factors.push(2)
    num /= 2
  }

  // Handle odd factors
  for (let i = 3; i <= Math.sqrt(num); i += 2) {
    while (num % i === 0) {
      factors.push(i)
      num /= i
    }
  }

  // If num is still greater than 2, it's a prime factor
  if (num > 2) {
    factors.push(num)
  }

  return factors
}

const primeFactorization = (n: number): PrimeFactor[] => {
  const factors = factorize(n)
  const factorMap = new window.Map<number, number>()

  factors.forEach((factor: number) => {
    factorMap.set(factor, (factorMap.get(factor) || 0) + 1)
  })

  return Array.from(factorMap.entries()).map(([prime, exponent]: [number, number]) => ({
    prime,
    exponent,
  }))
}

// Mathematical property analysis
const analyzeMathematicalProperties = (n: number): MathematicalProperty[] => {
  const properties: MathematicalProperty[] = []

  // Basic properties
  properties.push({
    name: "Even/Odd",
    value: n % 2 === 0 ? "Even" : "Odd",
    description: "Whether the number is even or odd",
  })

  properties.push({
    name: "Perfect Square",
    value: Math.sqrt(n) % 1 === 0,
    description: "Whether the number is a perfect square",
  })

  properties.push({
    name: "Perfect Cube",
    value: Math.cbrt(n) % 1 === 0,
    description: "Whether the number is a perfect cube",
  })

  // Divisibility rules
  properties.push({
    name: "Divisible by 3",
    value: n % 3 === 0,
    description: "Sum of digits divisible by 3",
  })

  properties.push({
    name: "Divisible by 5",
    value: n % 5 === 0,
    description: "Ends in 0 or 5",
  })

  properties.push({
    name: "Divisible by 9",
    value: n % 9 === 0,
    description: "Sum of digits divisible by 9",
  })

  // Special number types
  if (n > 1) {
    const factors = factorize(n)
    const uniqueFactors = [...new Set(factors)]

    properties.push({
      name: "Square-free",
      value: factors.length === uniqueFactors.length,
      description: "No repeated prime factors",
    })

    properties.push({
      name: "Highly Composite",
      value: isHighlyComposite(n),
      description: "Has more divisors than any smaller positive integer",
    })
  }

  // Fibonacci check
  properties.push({
    name: "Fibonacci Number",
    value: isFibonacci(n),
    description: "Appears in the Fibonacci sequence",
  })

  // Triangular number check
  properties.push({
    name: "Triangular Number",
    value: isTriangular(n),
    description: "Can be represented as n(n+1)/2",
  })

  return properties
}

const isHighlyComposite = (n: number): boolean => {
  if (n <= 1) return false

  const divisorCount = (num: number): number => {
    let count = 0
    for (let i = 1; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        count += i * i === num ? 1 : 2
      }
    }
    return count
  }

  const nDivisors = divisorCount(n)

  for (let i = 1; i < n; i++) {
    if (divisorCount(i) >= nDivisors) {
      return false
    }
  }

  return true
}

const isFibonacci = (n: number): boolean => {
  if (n < 0) return false

  const isPerfectSquare = (num: number): boolean => {
    const sqrt = Math.sqrt(num)
    return sqrt === Math.floor(sqrt)
  }

  // A number is Fibonacci if one of (5*n^2 + 4) or (5*n^2 - 4) is a perfect square
  return isPerfectSquare(5 * n * n + 4) || isPerfectSquare(5 * n * n - 4)
}

const isTriangular = (n: number): boolean => {
  if (n < 0) return false

  // A number is triangular if 8n + 1 is a perfect square
  const test = 8 * n + 1
  const sqrt = Math.sqrt(test)
  return sqrt === Math.floor(sqrt)
}

// Related primes analysis
const findRelatedPrimes = (n: number): RelatedPrime[] => {
  const related: RelatedPrime[] = []

  if (!primeAlgorithms.trial_division(n)) return related

  // Twin primes (differ by 2)
  if (primeAlgorithms.trial_division(n - 2)) {
    related.push({
      type: "twin",
      prime: n - 2,
      relationship: `${n - 2} and ${n} are twin primes (differ by 2)`,
    })
  }
  if (primeAlgorithms.trial_division(n + 2)) {
    related.push({
      type: "twin",
      prime: n + 2,
      relationship: `${n} and ${n + 2} are twin primes (differ by 2)`,
    })
  }

  // Cousin primes (differ by 4)
  if (primeAlgorithms.trial_division(n - 4)) {
    related.push({
      type: "cousin",
      prime: n - 4,
      relationship: `${n - 4} and ${n} are cousin primes (differ by 4)`,
    })
  }
  if (primeAlgorithms.trial_division(n + 4)) {
    related.push({
      type: "cousin",
      prime: n + 4,
      relationship: `${n} and ${n + 4} are cousin primes (differ by 4)`,
    })
  }

  // Sexy primes (differ by 6)
  if (primeAlgorithms.trial_division(n - 6)) {
    related.push({
      type: "sexy",
      prime: n - 6,
      relationship: `${n - 6} and ${n} are sexy primes (differ by 6)`,
    })
  }
  if (primeAlgorithms.trial_division(n + 6)) {
    related.push({
      type: "sexy",
      prime: n + 6,
      relationship: `${n} and ${n + 6} are sexy primes (differ by 6)`,
    })
  }

  // Safe prime (n = 2p + 1 where p is prime)
  if ((n - 1) % 2 === 0 && primeAlgorithms.trial_division((n - 1) / 2)) {
    related.push({
      type: "safe",
      prime: (n - 1) / 2,
      relationship: `${n} is a safe prime (2 × ${(n - 1) / 2} + 1)`,
    })
  }

  // Sophie Germain prime (2n + 1 is also prime)
  if (primeAlgorithms.trial_division(2 * n + 1)) {
    related.push({
      type: "sophie_germain",
      prime: 2 * n + 1,
      relationship: `${n} is a Sophie Germain prime (2 × ${n} + 1 = ${2 * n + 1} is also prime)`,
    })
  }

  // Check if it's a Mersenne prime (2^p - 1)
  const mersenne = Math.log2(n + 1)
  if (mersenne === Math.floor(mersenne) && primeAlgorithms.trial_division(mersenne)) {
    related.push({
      type: "mersenne",
      prime: mersenne,
      relationship: `${n} is a Mersenne prime (2^${mersenne} - 1)`,
    })
  }

  // Check if it's a Fermat prime (2^(2^k) + 1)
  const fermatTest = Math.log2(n - 1)
  if (fermatTest === Math.floor(fermatTest)) {
    const k = Math.log2(fermatTest)
    if (k === Math.floor(k) && k >= 0) {
      related.push({
        type: "fermat",
        prime: k,
        relationship: `${n} is a Fermat prime (2^(2^${k}) + 1)`,
      })
    }
  }

  return related
}

// Comprehensive prime analysis
const analyzePrime = (number: number, algorithm: PrimeAlgorithm = "trial_division"): PrimeAnalysis => {
  const startTime = performance.now()

  const isPrime = primeAlgorithms[algorithm](number)
  const factors = isPrime ? [1, number] : [1, ...factorize(number)]
  const primeFactors = primeFactorization(number)

  const endTime = performance.now()
  const testTime = endTime - startTime

  // Calculate complexity based on number size and algorithm
  const complexity = calculateComplexity(number, algorithm)

  // Determine number type
  const numberType = getNumberType(number)

  // Analyze mathematical properties
  const mathematicalProperties = analyzeMathematicalProperties(number)

  // Find related primes
  const relatedPrimes = findRelatedPrimes(number)

  // Calculate prime gaps (for primes)
  const primeGaps = isPrime ? calculatePrimeGaps(number) : []

  return {
    id: nanoid(),
    number,
    isPrime,
    algorithm,
    factors,
    primeFactorization: primeFactors,
    metadata: {
      testTime,
      complexity,
      digitCount: number.toString().length,
      numberType,
      mathematicalProperties,
      relatedPrimes,
      primeGaps,
    },
    timestamp: new Date(),
  }
}

const calculateComplexity = (number: number, algorithm: PrimeAlgorithm): number => {
  const digitCount = number.toString().length

  switch (algorithm) {
    case "trial_division":
      return Math.floor(Math.sqrt(number))
    case "miller_rabin":
      return digitCount * Math.log2(digitCount)
    case "fermat":
      return digitCount * 2
    case "solovay_strassen":
      return digitCount * Math.log2(digitCount) * 1.5
    case "aks":
      return Math.pow(digitCount, 6) // Simplified complexity
    default:
      return digitCount
  }
}

const getNumberType = (number: number): NumberType => {
  if (number < 1000) return "small"
  if (number < 1000000) return "medium"
  if (number < 1000000000) return "large"
  return "very_large"
}

const calculatePrimeGaps = (prime: number): number[] => {
  const gaps: number[] = []

  // Find previous prime
  let prev = prime - 1
  while (prev > 1 && !primeAlgorithms.trial_division(prev)) {
    prev--
  }
  if (prev > 1) {
    gaps.push(prime - prev)
  }

  // Find next prime
  let next = prime + 1
  while (!primeAlgorithms.trial_division(next) && next < prime + 1000) {
    next++
  }
  if (next < prime + 1000) {
    gaps.push(next - prime)
  }

  return gaps
}

// Validation functions
const validatePrimeInput = (input: string): PrimeValidation => {
  const validation: PrimeValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  if (!input || input.trim().length === 0) {
    validation.isValid = false
    validation.errors.push({
      message: "Number input cannot be empty",
      type: "input",
      severity: "error",
    })
    validation.qualityScore = 0
    return validation
  }

  const number = parseInt(input.trim())

  if (isNaN(number)) {
    validation.isValid = false
    validation.errors.push({
      message: "Input must be a valid integer",
      type: "input",
      severity: "error",
    })
    validation.qualityScore -= 50
  }

  if (number < 0) {
    validation.isValid = false
    validation.errors.push({
      message: "Number must be non-negative",
      type: "input",
      severity: "error",
    })
    validation.qualityScore -= 30
  }

  if (number > Number.MAX_SAFE_INTEGER) {
    validation.warnings.push("Number exceeds JavaScript safe integer limit")
    validation.suggestions.push("Consider using a specialized big integer library for very large numbers")
    validation.qualityScore -= 20
  }

  if (number > 1000000000) {
    validation.warnings.push("Very large number may impact performance")
    validation.suggestions.push("Consider using probabilistic algorithms for large numbers")
    validation.qualityScore -= 10
  }

  if (number === 0 || number === 1) {
    validation.suggestions.push("0 and 1 are neither prime nor composite by definition")
  }

  // Quality suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push("Excellent input for prime analysis")
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push("Good input with minor considerations")
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push("Input needs improvement")
  } else {
    validation.suggestions.push("Input has significant issues")
  }

  return validation
}

// Prime templates
const primeTemplates: PrimeTemplate[] = [
  {
    id: "small-primes",
    name: "Small Primes",
    description: "First 10 prime numbers",
    category: "Basic",
    numbers: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29],
    expectedResults: [true, true, true, true, true, true, true, true, true, true],
    useCase: ["Learning", "Basic testing", "Algorithm verification"],
    difficulty: "simple",
  },
  {
    id: "twin-primes",
    name: "Twin Primes",
    description: "Pairs of primes that differ by 2",
    category: "Special",
    numbers: [3, 5, 11, 13, 17, 19, 29, 31, 41, 43],
    expectedResults: [true, true, true, true, true, true, true, true, true, true],
    useCase: ["Number theory", "Prime relationships", "Mathematical research"],
    difficulty: "medium",
  },
  {
    id: "mersenne-primes",
    name: "Mersenne Primes",
    description: "Primes of the form 2^p - 1",
    category: "Special",
    numbers: [3, 7, 31, 127, 8191],
    expectedResults: [true, true, true, true, true],
    useCase: ["Cryptography", "Perfect numbers", "Mathematical research"],
    difficulty: "complex",
  },
  {
    id: "fermat-numbers",
    name: "Fermat Numbers",
    description: "Numbers of the form 2^(2^n) + 1",
    category: "Special",
    numbers: [3, 5, 17, 257, 65537],
    expectedResults: [true, true, true, true, true],
    useCase: ["Number theory", "Constructible polygons", "Mathematical history"],
    difficulty: "complex",
  },
  {
    id: "sophie-germain",
    name: "Sophie Germain Primes",
    description: "Primes p where 2p + 1 is also prime",
    category: "Special",
    numbers: [2, 3, 5, 11, 23, 29, 41, 53, 83, 89],
    expectedResults: [true, true, true, true, true, true, true, true, true, true],
    useCase: ["Cryptography", "Number theory", "Mathematical research"],
    difficulty: "medium",
  },
  {
    id: "composite-numbers",
    name: "Composite Numbers",
    description: "Non-prime numbers greater than 1",
    category: "Basic",
    numbers: [4, 6, 8, 9, 10, 12, 14, 15, 16, 18],
    expectedResults: [false, false, false, false, false, false, false, false, false, false],
    useCase: ["Learning", "Algorithm testing", "Factorization practice"],
    difficulty: "simple",
  },
  {
    id: "large-primes",
    name: "Large Primes",
    description: "Primes with many digits",
    category: "Performance",
    numbers: [982451653, 982451677, 982451707, 982451717, 982451747],
    expectedResults: [true, true, true, true, true],
    useCase: ["Performance testing", "Algorithm comparison", "Cryptography"],
    difficulty: "complex",
  },
  {
    id: "carmichael-numbers",
    name: "Carmichael Numbers",
    description: "Composite numbers that satisfy Fermat's little theorem",
    category: "Special",
    numbers: [561, 1105, 1729, 2465, 2821],
    expectedResults: [false, false, false, false, false],
    useCase: ["Algorithm testing", "Pseudoprime research", "Number theory"],
    difficulty: "complex",
  },
]

// Custom hooks
const usePrimeAnalysis = () => {
  const [analyses, setAnalyses] = useState<PrimeAnalysis[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const analyzeNumber = useCallback(
    async (number: number, algorithm: PrimeAlgorithm = "trial_division"): Promise<PrimeAnalysis> => {
      setIsProcessing(true)
      try {
        const analysis = analyzePrime(number, algorithm)
        setAnalyses((prev) => [analysis, ...prev.slice(0, 99)]) // Keep last 100 analyses
        return analysis
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearAnalyses = useCallback(() => {
    setAnalyses([])
  }, [])

  const removeAnalysis = useCallback((id: string) => {
    setAnalyses((prev) => prev.filter((analysis) => analysis.id !== id))
  }, [])

  return {
    analyses,
    isProcessing,
    analyzeNumber,
    clearAnalyses,
    removeAnalysis,
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
const usePrimeExport = () => {
  const exportAnalysis = useCallback((analysis: PrimeAnalysis, format: ExportFormat, filename?: string) => {
    let content = ""
    let mimeType = "text/plain"
    let extension = ".txt"

    switch (format) {
      case "json":
        content = JSON.stringify(analysis, null, 2)
        mimeType = "application/json"
        extension = ".json"
        break
      case "csv":
        content = generateCSVFromAnalysis(analysis)
        mimeType = "text/csv"
        extension = ".csv"
        break
      case "txt":
        content = generateTextFromAnalysis(analysis)
        mimeType = "text/plain"
        extension = ".txt"
        break
      case "xml":
        content = generateXMLFromAnalysis(analysis)
        mimeType = "application/xml"
        extension = ".xml"
        break
      case "yaml":
        content = generateYAMLFromAnalysis(analysis)
        mimeType = "text/yaml"
        extension = ".yaml"
        break
      default:
        content = generateTextFromAnalysis(analysis)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename || `prime-analysis-${analysis.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportAnalysis }
}

// Helper functions for export formats
const generateCSVFromAnalysis = (analysis: PrimeAnalysis): string => {
  const headers = ["Property", "Value"]
  const rows = [
    ["Number", analysis.number.toString()],
    ["Is Prime", analysis.isPrime.toString()],
    ["Algorithm", analysis.algorithm],
    ["Test Time (ms)", analysis.metadata.testTime.toFixed(2)],
    ["Complexity", analysis.metadata.complexity.toString()],
    ["Digit Count", analysis.metadata.digitCount.toString()],
    ["Number Type", analysis.metadata.numberType],
    ["Factors", analysis.factors.join(", ")],
    ["Prime Factorization", analysis.primeFactorization.map((f) => `${f.prime}^${f.exponent}`).join(" × ")],
    ["Related Primes", analysis.metadata.relatedPrimes.length.toString()],
    ["Prime Gaps", analysis.metadata.primeGaps.join(", ")],
  ]

  return [headers.join(","), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n")
}

const generateTextFromAnalysis = (analysis: PrimeAnalysis): string => {
  return `Prime Analysis Report - ${analysis.timestamp.toLocaleString()}

=== BASIC INFORMATION ===
Number: ${formatNumber(analysis.number)}
Is Prime: ${analysis.isPrime ? "Yes" : "No"}
Algorithm: ${analysis.algorithm.replace(/_/g, " ").toUpperCase()}

=== PERFORMANCE METRICS ===
Test Time: ${analysis.metadata.testTime.toFixed(2)} ms
Complexity: ${formatNumber(analysis.metadata.complexity)}
Digit Count: ${analysis.metadata.digitCount}
Number Type: ${analysis.metadata.numberType.replace(/_/g, " ").toUpperCase()}

=== FACTORIZATION ===
All Factors: ${analysis.factors.map((factor) => formatNumber(factor)).join(", ")}
Prime Factorization: ${
    analysis.primeFactorization
      .map((f) => (f.exponent === 1 ? f.prime.toString() : `${f.prime}^${f.exponent}`))
      .join(" × ") || "N/A"
  }

=== MATHEMATICAL PROPERTIES ===
${analysis.metadata.mathematicalProperties
  .map((prop) => `${prop.name}: ${prop.value} (${prop.description})`)
  .join("\n")}

=== RELATED PRIMES ===
${
  analysis.metadata.relatedPrimes.length > 0
    ? analysis.metadata.relatedPrimes.map((rp) => `${rp.type.toUpperCase()}: ${rp.relationship}`).join("\n")
    : "No related primes found"
}

=== PRIME GAPS ===
${
  analysis.metadata.primeGaps.length > 0
    ? `Gaps: ${analysis.metadata.primeGaps.join(", ")}`
    : "N/A (not a prime or no nearby primes found)"
}`
}

const generateXMLFromAnalysis = (analysis: PrimeAnalysis): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<primeAnalysis id="${analysis.id}" timestamp="${analysis.timestamp.toISOString()}">
  <number>${analysis.number}</number>
  <isPrime>${analysis.isPrime}</isPrime>
  <algorithm>${analysis.algorithm}</algorithm>
  <metadata>
    <testTime>${analysis.metadata.testTime}</testTime>
    <complexity>${analysis.metadata.complexity}</complexity>
    <digitCount>${analysis.metadata.digitCount}</digitCount>
    <numberType>${analysis.metadata.numberType}</numberType>
  </metadata>
  <factors>
${analysis.factors.map((factor) => `    <factor>${factor}</factor>`).join("\n")}
  </factors>
  <primeFactorization>
${analysis.primeFactorization.map((pf) => `    <factor prime="${pf.prime}" exponent="${pf.exponent}"/>`).join("\n")}
  </primeFactorization>
  <mathematicalProperties>
${analysis.metadata.mathematicalProperties
  .map((prop) => `    <property name="${prop.name}" value="${prop.value}" description="${prop.description}"/>`)
  .join("\n")}
  </mathematicalProperties>
  <relatedPrimes>
${analysis.metadata.relatedPrimes
  .map((rp) => `    <relatedPrime type="${rp.type}" prime="${rp.prime}" relationship="${rp.relationship}"/>`)
  .join("\n")}
  </relatedPrimes>
</primeAnalysis>`
}

const generateYAMLFromAnalysis = (analysis: PrimeAnalysis): string => {
  return `id: ${analysis.id}
timestamp: ${analysis.timestamp.toISOString()}
number: ${analysis.number}
isPrime: ${analysis.isPrime}
algorithm: ${analysis.algorithm}
metadata:
  testTime: ${analysis.metadata.testTime}
  complexity: ${analysis.metadata.complexity}
  digitCount: ${analysis.metadata.digitCount}
  numberType: ${analysis.metadata.numberType}
factors:
${analysis.factors.map((factor) => `  - ${factor}`).join("\n")}
primeFactorization:
${analysis.primeFactorization.map((pf) => `  - prime: ${pf.prime}\n    exponent: ${pf.exponent}`).join("\n")}
mathematicalProperties:
${analysis.metadata.mathematicalProperties
  .map((prop) => `  - name: ${prop.name}\n    value: ${prop.value}\n    description: ${prop.description}`)
  .join("\n")}
relatedPrimes:
${analysis.metadata.relatedPrimes
  .map((rp) => `  - type: ${rp.type}\n    prime: ${rp.prime}\n    relationship: ${rp.relationship}`)
  .join("\n")}`
}

/**
 * Enhanced Prime Checker & Mathematical Analysis Tool
 * Features: Advanced prime checking algorithms, mathematical analysis, factorization, and comprehensive number theory
 */
const PrimeCheckerCore = () => {
  const [activeTab, setActiveTab] = useState<"checker" | "generator" | "history" | "templates" | "settings">("checker")
  const [numberInput, setNumberInput] = useState("2")
  const [currentAnalysis, setCurrentAnalysis] = useState<PrimeAnalysis | null>(null)
  const [algorithm, setAlgorithm] = useState<PrimeAlgorithm>("trial_division")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")

  // Prime generation settings
  const [generationLimit, setGenerationLimit] = useState(100)
  const [generationAlgorithm, setGenerationAlgorithm] = useState<GenerationAlgorithm>("sieve")
  const [generatedPrimes, setGeneratedPrimes] = useState<number[]>([])

  const { analyses, isProcessing, analyzeNumber, clearAnalyses, removeAnalysis } = usePrimeAnalysis()
  const { exportAnalysis } = usePrimeExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = primeTemplates.find((t) => t.id === templateId)
    if (template) {
      setNumberInput(template.numbers[0].toString())
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Analyze prime
  const handleAnalyze = useCallback(async () => {
    const validation = validatePrimeInput(numberInput)
    if (!validation.isValid) {
      toast.error(`Input error: ${validation.errors[0]?.message}`)
      return
    }

    const number = parseInt(numberInput)

    try {
      const analysis = await analyzeNumber(number, algorithm)
      setCurrentAnalysis(analysis)
      toast.success(`Analysis completed for ${formatNumber(number)}`)
    } catch (error) {
      toast.error("Failed to analyze number")
      console.error(error)
    }
  }, [numberInput, algorithm, analyzeNumber])

  // Generate primes
  const handleGeneratePrimes = useCallback(() => {
    if (generationLimit < 2) {
      toast.error("Limit must be at least 2")
      return
    }

    if (generationLimit > 1000000) {
      toast.error("Limit too large, please use a smaller number")
      return
    }

    try {
      const primes = generatePrimes(generationLimit, generationAlgorithm)
      setGeneratedPrimes(primes)
      toast.success(`Generated ${primes.length} primes up to ${formatNumber(generationLimit)}`)
    } catch (error) {
      toast.error("Failed to generate primes")
      console.error(error)
    }
  }, [generationLimit, generationAlgorithm])

  // Auto-analyze when input changes (debounced)
  useEffect(() => {
    if (numberInput.trim() && !isNaN(parseInt(numberInput))) {
      const timer = setTimeout(() => {
        handleAnalyze()
      }, 1000)

      return () => clearTimeout(timer)
    } else {
      setCurrentAnalysis(null)
    }
  }, [numberInput, algorithm, handleAnalyze])

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
              <Calculator className="h-5 w-5" />
              Prime Checker & Mathematical Analysis Tool
            </CardTitle>
            <CardDescription>
              Advanced prime number analysis tool with multiple algorithms, mathematical properties analysis,
              factorization, and comprehensive number theory features. Check primality, analyze mathematical properties,
              generate prime sequences, and explore number relationships. Use keyboard navigation: Tab to move between
              controls, Enter or Space to activate buttons.
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
              value="checker"
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Checker
            </TabsTrigger>
            <TabsTrigger
              value="generator"
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Generator
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

          {/* Prime Checker Tab */}
          <TabsContent
            value="checker"
            className="space-y-4"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Number Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Number Input
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label
                      htmlFor="number-input"
                      className="text-sm font-medium"
                    >
                      Number to Analyze
                    </Label>
                    <Input
                      id="number-input"
                      type="number"
                      value={numberInput}
                      onChange={(e) => setNumberInput(e.target.value)}
                      placeholder="Enter a number..."
                      className="mt-2"
                      min="0"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="algorithm"
                      className="text-sm font-medium"
                    >
                      Algorithm
                    </Label>
                    <Select
                      value={algorithm}
                      onValueChange={(value) => setAlgorithm(value as PrimeAlgorithm)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial_division">Trial Division</SelectItem>
                        <SelectItem value="miller_rabin">Miller-Rabin</SelectItem>
                        <SelectItem value="fermat">Fermat Test</SelectItem>
                        <SelectItem value="solovay_strassen">Solovay-Strassen</SelectItem>
                        <SelectItem value="aks">AKS (Simplified)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isProcessing || !numberInput.trim()}
                      className="flex-1"
                    >
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Calculator className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? "Analyzing..." : "Analyze Number"}
                    </Button>
                    <Button
                      onClick={() => {
                        setNumberInput("")
                        setCurrentAnalysis(null)
                      }}
                      variant="outline"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-medium">Quick Examples</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {primeTemplates.slice(0, 4).map((template) => (
                        <Button
                          key={template.id}
                          onClick={() => applyTemplate(template.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {template.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Analysis Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sigma className="h-5 w-5" />
                    Analysis Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentAnalysis ? (
                    <div className="space-y-4">
                      {/* Prime Status */}
                      <div className="text-center p-4 rounded-lg border">
                        <div
                          className={`text-3xl font-bold mb-2 ${
                            currentAnalysis.isPrime ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {formatNumber(currentAnalysis.number)}
                        </div>
                        <div
                          className={`text-lg font-medium ${
                            currentAnalysis.isPrime ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {currentAnalysis.isPrime ? "IS PRIME" : "NOT PRIME"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Algorithm: {currentAnalysis.algorithm.replace(/_/g, " ").toUpperCase()}
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {currentAnalysis.metadata.testTime.toFixed(2)}ms
                          </div>
                          <div className="text-xs text-muted-foreground">Test Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">
                            {formatNumber(currentAnalysis.metadata.complexity)}
                          </div>
                          <div className="text-xs text-muted-foreground">Complexity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">{currentAnalysis.metadata.digitCount}</div>
                          <div className="text-xs text-muted-foreground">Digits</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {currentAnalysis.metadata.numberType.replace(/_/g, " ").toUpperCase()}
                          </div>
                          <div className="text-xs text-muted-foreground">Type</div>
                        </div>
                      </div>

                      {/* Factorization */}
                      {!currentAnalysis.isPrime && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Factorization</Label>
                          <div className="p-3 bg-muted rounded text-sm">
                            <div className="mb-2">
                              <strong>All Factors:</strong>{" "}
                              {currentAnalysis.factors.map((factor) => formatNumber(factor)).join(", ")}
                            </div>
                            <div>
                              <strong>Prime Factorization:</strong>{" "}
                              {currentAnalysis.primeFactorization
                                .map((f) => (f.exponent === 1 ? f.prime.toString() : `${f.prime}^${f.exponent}`))
                                .join(" × ")}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Related Primes */}
                      {currentAnalysis.metadata.relatedPrimes.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Related Primes</Label>
                          <div className="space-y-1">
                            {currentAnalysis.metadata.relatedPrimes.slice(0, 3).map((rp, index) => (
                              <div
                                key={index}
                                className="text-xs p-2 bg-muted rounded"
                              >
                                <span className="font-medium capitalize">{rp.type.replace(/_/g, " ")}:</span>{" "}
                                {rp.relationship}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          onClick={() => exportAnalysis(currentAnalysis, "json")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button
                          onClick={() => exportAnalysis(currentAnalysis, "txt")}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Report
                        </Button>
                        <Button
                          onClick={() => copyToClipboard(currentAnalysis.number.toString(), "Number")}
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === "Number" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Analysis</h3>
                      <p className="text-muted-foreground">Enter a number to see the prime analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Properties */}
            {currentAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SquareFunction className="h-5 w-5" />
                    Mathematical Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentAnalysis.metadata.mathematicalProperties.map((prop, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-lg"
                      >
                        <div className="font-medium text-sm mb-1">{prop.name}</div>
                        <div
                          className={`text-lg font-bold mb-1 ${
                            typeof prop.value === "boolean"
                              ? prop.value
                                ? "text-green-600"
                                : "text-red-600"
                              : "text-blue-600"
                          }`}
                        >
                          {prop.value.toString()}
                        </div>
                        <div className="text-xs text-muted-foreground">{prop.description}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Prime Generator Tab */}
          <TabsContent
            value="generator"
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Prime Generator
                </CardTitle>
                <CardDescription>Generate sequences of prime numbers using different algorithms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="generation-limit"
                      className="text-sm font-medium"
                    >
                      Upper Limit
                    </Label>
                    <Input
                      id="generation-limit"
                      type="number"
                      value={generationLimit}
                      onChange={(e) => setGenerationLimit(parseInt(e.target.value) || 100)}
                      placeholder="Enter upper limit..."
                      className="mt-2"
                      min="2"
                      max="1000000"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="generation-algorithm"
                      className="text-sm font-medium"
                    >
                      Algorithm
                    </Label>
                    <Select
                      value={generationAlgorithm}
                      onValueChange={(value) => setGenerationAlgorithm(value as GenerationAlgorithm)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sieve">Sieve of Eratosthenes</SelectItem>
                        <SelectItem value="incremental">Incremental</SelectItem>
                        <SelectItem value="wheel">Wheel Factorization</SelectItem>
                        <SelectItem value="segmented_sieve">Segmented Sieve</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={handleGeneratePrimes}
                  disabled={generationLimit < 2 || generationLimit > 1000000}
                  className="w-full"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Primes
                </Button>

                {generatedPrimes.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Generated {generatedPrimes.length} primes up to {formatNumber(generationLimit)}
                      </span>
                      <Button
                        onClick={() => copyToClipboard(generatedPrimes.join(", "), "Prime List")}
                        variant="outline"
                        size="sm"
                      >
                        {copiedText === "Prime List" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-4 bg-muted rounded text-sm font-mono">
                      {generatedPrimes.map((prime, index) => (
                        <span
                          key={index}
                          className="inline-block mr-2 mb-1"
                        >
                          {formatNumber(prime)}
                          {index < generatedPrimes.length - 1 ? "," : ""}
                        </span>
                      ))}
                    </div>
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
                <CardTitle className="text-lg">Analysis History</CardTitle>
                <CardDescription>View and manage your prime analysis history</CardDescription>
              </CardHeader>
              <CardContent>
                {analyses.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {analyses.length} analysis{analyses.length !== 1 ? "es" : ""} in history
                      </span>
                      <Button
                        onClick={clearAnalyses}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {analyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {formatNumber(analysis.number)} - {analysis.timestamp.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                analysis.isPrime ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                              }`}
                            >
                              {analysis.isPrime ? "Prime" : "Composite"}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAnalysis(analysis.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{analysis.metadata.testTime.toFixed(2)}ms</div>
                              <div className="text-muted-foreground">Test Time</div>
                            </div>
                            <div>
                              <div className="font-medium">{analysis.algorithm.replace(/_/g, " ")}</div>
                              <div className="text-muted-foreground">Algorithm</div>
                            </div>
                            <div>
                              <div className="font-medium">{analysis.metadata.digitCount}</div>
                              <div className="text-muted-foreground">Digits</div>
                            </div>
                            <div>
                              <div className="font-medium">{analysis.metadata.relatedPrimes.length}</div>
                              <div className="text-muted-foreground">Related</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setNumberInput(analysis.number.toString())
                              setCurrentAnalysis(analysis)
                              setActiveTab("checker")
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportAnalysis(analysis, "json")}
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(analysis.number.toString(), "Number")}
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
                    <p className="text-muted-foreground">Analyze some numbers to see them here</p>
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
                <CardTitle className="text-lg">Number Templates</CardTitle>
                <CardDescription>Pre-built number sets for testing and learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {primeTemplates.map((template) => (
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
                            {template.numbers
                              .slice(0, 5)
                              .map((num) => formatNumber(num))
                              .join(", ")}
                            {template.numbers.length > 5 ? "..." : ""}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Use Cases:</div>
                          <div className="text-xs text-muted-foreground">{template.useCase.join(", ")}</div>
                        </div>
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
                <CardTitle className="text-lg">Algorithm Settings</CardTitle>
                <CardDescription>Configure prime checking algorithms and performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Algorithm Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Algorithm Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Trial Division</h5>
                      <p className="text-xs text-muted-foreground">
                        Deterministic algorithm that tests divisibility by all numbers up to √n. Best for small to
                        medium numbers. Time complexity: O(√n).
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Miller-Rabin</h5>
                      <p className="text-xs text-muted-foreground">
                        Probabilistic algorithm with high accuracy. Excellent for large numbers. Time complexity: O(k
                        log³ n) where k is the number of rounds.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Fermat Test</h5>
                      <p className="text-xs text-muted-foreground">
                        Simple probabilistic test based on Fermat's Little Theorem. Fast but can be fooled by Carmichael
                        numbers.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Tips */}
                <div className="space-y-4">
                  <h4 className="font-medium">Performance Tips</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0"></div>
                      <div>Use Trial Division for numbers under 1,000,000</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 shrink-0"></div>
                      <div>Use Miller-Rabin for large numbers and cryptographic applications</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                      <div>Sieve of Eratosthenes is most efficient for generating many primes</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 shrink-0"></div>
                      <div>Segmented Sieve handles very large ranges efficiently</div>
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
const PrimeChecker = () => {
  return <PrimeCheckerCore />
}

export default PrimeChecker
