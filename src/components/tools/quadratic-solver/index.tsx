import { useCallback, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  Download,
  Trash2,
  Copy,
  Check,
  Shuffle,
  RotateCcw,
  Settings,
  BookOpen,
  Eye,
  Clock,
  BarChart3,
  LineChart,
  Calculator,
  Equal,
  Variable,
  SquareFunction,
} from 'lucide-react'
import { nanoid } from 'nanoid'
import type {
  EquationSolution,
  Solution,
  ComplexNumber,
  EquationAnalysis,
  Interval,
  EquationTemplate,
  EquationValidation,
  GraphSettings,
  EquationType,
  ExportFormat,
} from '@/types/quadratic-solver'

// Utility functions

const formatNumber = (num: number, precision: number = 6): string => {
  if (Math.abs(num) < 1e-10) return '0'
  if (Math.abs(num) > 1e6 || Math.abs(num) < 1e-3) {
    return num.toExponential(precision)
  }
  return parseFloat(num.toFixed(precision)).toString()
}

const formatComplexNumber = (complex: ComplexNumber): string => {
  const real = formatNumber(complex.real)
  const imag = formatNumber(Math.abs(complex.imaginary))

  if (Math.abs(complex.imaginary) < 1e-10) {
    return real
  }

  if (Math.abs(complex.real) < 1e-10) {
    return complex.imaginary > 0 ? `${imag}i` : `-${imag}i`
  }

  const sign = complex.imaginary > 0 ? '+' : '-'
  return `${real} ${sign} ${imag}i`
}

// Mathematical equation solving functions
const solveQuadratic = (a: number, b: number, c: number): Solution[] => {
  const solutions: Solution[] = []

  // Handle degenerate cases
  if (Math.abs(a) < 1e-10) {
    // Linear equation: bx + c = 0
    if (Math.abs(b) < 1e-10) {
      // Constant equation: c = 0
      return Math.abs(c) < 1e-10 ? [] : [] // No solution or infinite solutions
    }

    solutions.push({
      type: 'real',
      value: -c / b,
      multiplicity: 1,
      isReal: true,
      isRational: isRational(-c / b),
      approximation: formatNumber(-c / b),
    })

    return solutions
  }

  const discriminant = b * b - 4 * a * c

  if (Math.abs(discriminant) < 1e-10) {
    // One repeated real root
    const root = -b / (2 * a)
    solutions.push({
      type: 'repeated',
      value: root,
      multiplicity: 2,
      isReal: true,
      isRational: isRational(root),
      approximation: formatNumber(root),
    })
  } else if (discriminant > 0) {
    // Two distinct real roots
    const sqrtDiscriminant = Math.sqrt(discriminant)
    const root1 = (-b + sqrtDiscriminant) / (2 * a)
    const root2 = (-b - sqrtDiscriminant) / (2 * a)

    solutions.push({
      type: isRational(root1) ? 'rational' : 'irrational',
      value: root1,
      multiplicity: 1,
      isReal: true,
      isRational: isRational(root1),
      approximation: formatNumber(root1),
    })

    solutions.push({
      type: isRational(root2) ? 'rational' : 'irrational',
      value: root2,
      multiplicity: 1,
      isReal: true,
      isRational: isRational(root2),
      approximation: formatNumber(root2),
    })
  } else {
    // Two complex conjugate roots
    const realPart = -b / (2 * a)
    const imaginaryPart = Math.sqrt(-discriminant) / (2 * a)

    const complex1: ComplexNumber = {
      real: realPart,
      imaginary: imaginaryPart,
      magnitude: Math.sqrt(realPart * realPart + imaginaryPart * imaginaryPart),
      argument: Math.atan2(imaginaryPart, realPart),
    }

    const complex2: ComplexNumber = {
      real: realPart,
      imaginary: -imaginaryPart,
      magnitude: Math.sqrt(realPart * realPart + imaginaryPart * imaginaryPart),
      argument: Math.atan2(-imaginaryPart, realPart),
    }

    solutions.push({
      type: 'complex',
      value: complex1,
      multiplicity: 1,
      isReal: false,
      isRational: false,
      approximation: formatComplexNumber(complex1),
    })

    solutions.push({
      type: 'complex',
      value: complex2,
      multiplicity: 1,
      isReal: false,
      isRational: false,
      approximation: formatComplexNumber(complex2),
    })
  }

  return solutions
}

const solveLinear = (a: number, b: number): Solution[] => {
  if (Math.abs(a) < 1e-10) {
    return [] // No solution or infinite solutions
  }

  const root = -b / a
  return [
    {
      type: 'real',
      value: root,
      multiplicity: 1,
      isReal: true,
      isRational: isRational(root),
      approximation: formatNumber(root),
    },
  ]
}

const solveCubic = (a: number, b: number, c: number, d: number): Solution[] => {
  // Simplified cubic solver using Cardano's method
  if (Math.abs(a) < 1e-10) {
    return solveQuadratic(b, c, d)
  }

  // Normalize coefficients
  const p = c / a - (b * b) / (3 * a * a)
  const q = (2 * b * b * b) / (27 * a * a * a) - (b * c) / (3 * a * a) + d / a

  const discriminant = (q * q) / 4 + (p * p * p) / 27

  const solutions: Solution[] = []

  if (discriminant > 0) {
    // One real root
    const sqrtD = Math.sqrt(discriminant)
    const u = Math.cbrt(-q / 2 + sqrtD)
    const v = Math.cbrt(-q / 2 - sqrtD)
    const root = u + v - b / (3 * a)

    solutions.push({
      type: 'real',
      value: root,
      multiplicity: 1,
      isReal: true,
      isRational: isRational(root),
      approximation: formatNumber(root),
    })
  } else if (Math.abs(discriminant) < 1e-10) {
    // Multiple roots
    if (Math.abs(p) < 1e-10) {
      // Triple root
      const root = -b / (3 * a)
      solutions.push({
        type: 'repeated',
        value: root,
        multiplicity: 3,
        isReal: true,
        isRational: isRational(root),
        approximation: formatNumber(root),
      })
    } else {
      // One single and one double root
      const root1 = (3 * q) / p - b / (3 * a)
      const root2 = (-3 * q) / (2 * p) - b / (3 * a)

      solutions.push({
        type: 'real',
        value: root1,
        multiplicity: 1,
        isReal: true,
        isRational: isRational(root1),
        approximation: formatNumber(root1),
      })

      solutions.push({
        type: 'repeated',
        value: root2,
        multiplicity: 2,
        isReal: true,
        isRational: isRational(root2),
        approximation: formatNumber(root2),
      })
    }
  } else {
    // Three distinct real roots (trigonometric solution)
    const m = 2 * Math.sqrt(-p / 3)
    const theta = Math.acos((3 * q) / (p * m)) / 3

    for (let k = 0; k < 3; k++) {
      const root = m * Math.cos(theta - (2 * Math.PI * k) / 3) - b / (3 * a)
      solutions.push({
        type: 'real',
        value: root,
        multiplicity: 1,
        isReal: true,
        isRational: isRational(root),
        approximation: formatNumber(root),
      })
    }
  }

  return solutions
}

// Helper functions
const isRational = (num: number): boolean => {
  if (!isFinite(num)) return false

  // Check if the number can be expressed as a simple fraction
  const tolerance = 1e-10
  const maxDenominator = 10000

  for (let denominator = 1; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(num * denominator)
    if (Math.abs(num - numerator / denominator) < tolerance) {
      return true
    }
  }

  return false
}

// Equation analysis functions
const analyzeQuadratic = (a: number, b: number, c: number): EquationAnalysis => {
  const analysis: EquationAnalysis = {
    domain: { min: '-∞', max: '∞', minInclusive: false, maxInclusive: false },
    range: { min: '-∞', max: '∞', minInclusive: false, maxInclusive: false },
    concavity: 'none',
    extrema: [],
    inflectionPoints: [],
    asymptotes: [],
  }

  if (Math.abs(a) < 1e-10) {
    // Linear function
    analysis.concavity = 'none'
    return analysis
  }

  // Vertex
  const vertexX = -b / (2 * a)
  const vertexY = a * vertexX * vertexX + b * vertexX + c
  analysis.vertex = { x: vertexX, y: vertexY }

  // Axis of symmetry
  analysis.axisOfSymmetry = vertexX

  // Y-intercept
  analysis.yIntercept = c

  // X-intercepts (roots)
  const solutions = solveQuadratic(a, b, c)
  const realRoots = solutions.filter((sol) => sol.isReal).map((sol) => sol.value as number)
  if (realRoots.length > 0) {
    analysis.xIntercepts = realRoots
  }

  // Concavity
  analysis.concavity = a > 0 ? 'up' : 'down'

  // Extrema
  analysis.extrema = [
    {
      type: a > 0 ? 'minimum' : 'maximum',
      point: { x: vertexX, y: vertexY },
      isGlobal: true,
    },
  ]

  // Range
  if (a > 0) {
    analysis.range = { min: vertexY, max: '∞', minInclusive: true, maxInclusive: false }
  } else {
    analysis.range = { min: '-∞', max: vertexY, minInclusive: false, maxInclusive: true }
  }

  return analysis
}

const analyzeLinear = (a: number, b: number): EquationAnalysis => {
  return {
    domain: { min: '-∞', max: '∞', minInclusive: false, maxInclusive: false },
    range: { min: '-∞', max: '∞', minInclusive: false, maxInclusive: false },
    concavity: 'none',
    extrema: [],
    inflectionPoints: [],
    asymptotes: [],
    yIntercept: b,
    xIntercepts: Math.abs(a) > 1e-10 ? [-b / a] : [],
  }
}

// Comprehensive equation solving
const solveEquation = (type: EquationType, coefficients: number[]): EquationSolution => {
  const startTime = performance.now()

  let solutions: Solution[] = []
  let analysis: EquationAnalysis
  let expression = ''
  let standardForm = ''

  switch (type) {
    case 'quadratic':
      const [a, b, c] = coefficients
      solutions = solveQuadratic(a, b, c)
      analysis = analyzeQuadratic(a, b, c)
      expression = `${formatCoefficient(a, 'x²')} ${formatCoefficient(b, 'x', true)} ${formatConstant(c, true)} = 0`
      standardForm = `${a}x² + ${b}x + ${c} = 0`
      break

    case 'linear':
      const [a1, b1] = coefficients
      solutions = solveLinear(a1, b1)
      analysis = analyzeLinear(a1, b1)
      expression = `${formatCoefficient(a1, 'x')} ${formatConstant(b1, true)} = 0`
      standardForm = `${a1}x + ${b1} = 0`
      break

    case 'cubic':
      const [a2, b2, c2, d2] = coefficients
      solutions = solveCubic(a2, b2, c2, d2)
      analysis = {
        // Simplified analysis for cubic
        domain: { min: '-∞', max: '∞', minInclusive: false, maxInclusive: false },
        range: { min: '-∞', max: '∞', minInclusive: false, maxInclusive: false },
        concavity: 'none',
        extrema: [],
        inflectionPoints: [],
        asymptotes: [],
      }
      expression = `${formatCoefficient(a2, 'x³')} ${formatCoefficient(b2, 'x²', true)} ${formatCoefficient(c2, 'x', true)} ${formatConstant(d2, true)} = 0`
      standardForm = `${a2}x³ + ${b2}x² + ${c2}x + ${d2} = 0`
      break

    default:
      throw new Error(`Unsupported equation type: ${type}`)
  }

  const endTime = performance.now()
  const solutionTime = endTime - startTime

  // Calculate discriminant for quadratic
  let discriminant: number | undefined
  if (type === 'quadratic') {
    const [a, b, c] = coefficients
    discriminant = b * b - 4 * a * c
  }

  // Calculate complexity
  const complexity = calculateComplexity(type, coefficients)

  // Calculate numerical stability
  const numericalStability = calculateNumericalStability(solutions)

  return {
    id: nanoid(),
    equation: {
      type,
      coefficients,
      variables: ['x'],
      expression,
      standardForm,
    },
    solutions,
    metadata: {
      solutionTime,
      discriminant,
      numberOfSolutions: solutions.length,
      solutionTypes: [...new Set(solutions.map((s) => s.type))],
      complexity,
      numericalStability,
    },
    analysis,
    timestamp: new Date(),
  }
}

// Helper functions for formatting
const formatCoefficient = (coeff: number, variable: string, showSign: boolean = false): string => {
  if (Math.abs(coeff) < 1e-10) return showSign ? '' : '0'

  const sign = coeff >= 0 ? (showSign ? ' + ' : '') : ' - '
  const absCoeff = Math.abs(coeff)

  if (Math.abs(absCoeff - 1) < 1e-10) {
    return `${sign}${variable}`
  }

  return `${sign}${formatNumber(absCoeff)}${variable}`
}

const formatConstant = (constant: number, showSign: boolean = false): string => {
  if (Math.abs(constant) < 1e-10) return showSign ? '' : '0'

  const sign = constant >= 0 ? (showSign ? ' + ' : '') : ' - '
  return `${sign}${formatNumber(Math.abs(constant))}`
}

const calculateComplexity = (type: EquationType, coefficients: number[]): number => {
  let baseComplexity = 1

  switch (type) {
    case 'linear':
      baseComplexity = 1
      break
    case 'quadratic':
      baseComplexity = 2
      break
    case 'cubic':
      baseComplexity = 3
      break
    default:
      baseComplexity = coefficients.length
  }

  // Add complexity based on coefficient magnitudes
  const maxCoeff = Math.max(...coefficients.map(Math.abs))
  const complexityMultiplier = maxCoeff > 1000 ? 2 : maxCoeff > 100 ? 1.5 : 1

  return Math.round(baseComplexity * complexityMultiplier)
}

const calculateNumericalStability = (solutions: Solution[]): number => {
  if (solutions.length === 0) return 1

  let stability = 1

  for (const solution of solutions) {
    if (typeof solution.value === 'number') {
      const magnitude = Math.abs(solution.value)
      if (magnitude > 1e6 || magnitude < 1e-6) {
        stability *= 0.8
      }
    } else {
      // Complex number
      const complex = solution.value as ComplexNumber
      const magnitude = complex.magnitude
      if (magnitude > 1e6 || magnitude < 1e-6) {
        stability *= 0.8
      }
    }
  }

  return Math.max(0.1, stability)
}

// Validation functions
const validateEquationInput = (type: EquationType, coefficients: number[]): EquationValidation => {
  const validation: EquationValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: [],
    qualityScore: 100,
  }

  // Check coefficient count
  const expectedCount = getExpectedCoefficientCount(type)
  if (coefficients.length !== expectedCount) {
    validation.isValid = false
    validation.errors.push({
      message: `Expected ${expectedCount} coefficients for ${type} equation, got ${coefficients.length}`,
      type: 'structure',
      severity: 'error',
    })
    validation.qualityScore -= 50
    return validation
  }

  // Check for NaN or infinite coefficients
  for (let i = 0; i < coefficients.length; i++) {
    const coeff = coefficients[i]
    if (!isFinite(coeff)) {
      validation.isValid = false
      validation.errors.push({
        message: `Coefficient ${i + 1} is not a valid number`,
        type: 'coefficient',
        severity: 'error',
        coefficient: `coefficient_${i}`,
      })
      validation.qualityScore -= 30
    }
  }

  // Type-specific validations
  switch (type) {
    case 'quadratic':
      const [a, b, c] = coefficients
      if (Math.abs(a) < 1e-10) {
        validation.warnings.push('Leading coefficient is zero - this is actually a linear equation')
        validation.suggestions.push('Consider using linear equation solver instead')
        validation.qualityScore -= 15
      }

      if (Math.abs(a) > 1e6 || Math.abs(b) > 1e6 || Math.abs(c) > 1e6) {
        validation.warnings.push('Very large coefficients may cause numerical instability')
        validation.suggestions.push('Consider scaling down the coefficients')
        validation.qualityScore -= 10
      }

      const discriminant = b * b - 4 * a * c
      if (discriminant < 0) {
        validation.suggestions.push('Negative discriminant - solutions will be complex numbers')
      } else if (Math.abs(discriminant) < 1e-10) {
        validation.suggestions.push('Zero discriminant - equation has one repeated root')
      }
      break

    case 'linear':
      const [a1, b1] = coefficients
      if (Math.abs(a1) < 1e-10) {
        if (Math.abs(b1) < 1e-10) {
          validation.warnings.push('Both coefficients are zero - equation is always true')
          validation.suggestions.push('This represents an identity (0 = 0)')
        } else {
          validation.isValid = false
          validation.errors.push({
            message: 'Leading coefficient is zero but constant is not - no solution exists',
            type: 'mathematical',
            severity: 'error',
          })
          validation.qualityScore -= 40
        }
      }
      break

    case 'cubic':
      const [a2] = coefficients
      if (Math.abs(a2) < 1e-10) {
        validation.warnings.push('Leading coefficient is zero - this is actually a quadratic equation')
        validation.suggestions.push('Consider using quadratic equation solver instead')
        validation.qualityScore -= 15
      }
      break
  }

  // General suggestions
  if (validation.qualityScore >= 90) {
    validation.suggestions.push('Excellent equation setup for solving')
  } else if (validation.qualityScore >= 70) {
    validation.suggestions.push('Good equation with minor considerations')
  } else if (validation.qualityScore >= 50) {
    validation.suggestions.push('Equation needs improvement for optimal solving')
  } else {
    validation.suggestions.push('Equation has significant issues')
  }

  return validation
}

const getExpectedCoefficientCount = (type: EquationType): number => {
  switch (type) {
    case 'linear':
      return 2
    case 'quadratic':
      return 3
    case 'cubic':
      return 4
    case 'quartic':
      return 5
    default:
      return 3
  }
}

// Equation templates
const equationTemplates: EquationTemplate[] = [
  {
    id: 'simple-quadratic',
    name: 'Simple Quadratic',
    description: 'Basic quadratic equation with integer solutions',
    type: 'quadratic',
    category: 'Basic',
    coefficients: [1, -5, 6], // x² - 5x + 6 = 0, solutions: x = 2, 3
    expectedSolutions: 2,
    useCase: ['Learning', 'Basic algebra', 'Factoring practice'],
    difficulty: 'simple',
  },
  {
    id: 'perfect-square',
    name: 'Perfect Square',
    description: 'Quadratic with repeated root',
    type: 'quadratic',
    category: 'Special',
    coefficients: [1, -4, 4], // x² - 4x + 4 = 0, solution: x = 2 (repeated)
    expectedSolutions: 1,
    useCase: ['Perfect squares', 'Repeated roots', 'Discriminant study'],
    difficulty: 'simple',
  },
  {
    id: 'complex-roots',
    name: 'Complex Roots',
    description: 'Quadratic with complex solutions',
    type: 'quadratic',
    category: 'Complex',
    coefficients: [1, 0, 1], // x² + 1 = 0, solutions: x = ±i
    expectedSolutions: 2,
    useCase: ['Complex numbers', 'Imaginary solutions', 'Advanced algebra'],
    difficulty: 'medium',
  },
  {
    id: 'irrational-roots',
    name: 'Irrational Roots',
    description: 'Quadratic with irrational solutions',
    type: 'quadratic',
    category: 'Irrational',
    coefficients: [1, 0, -2], // x² - 2 = 0, solutions: x = ±√2
    expectedSolutions: 2,
    useCase: ['Irrational numbers', 'Square roots', 'Decimal approximations'],
    difficulty: 'medium',
  },
  {
    id: 'linear-equation',
    name: 'Linear Equation',
    description: 'Simple linear equation',
    type: 'linear',
    category: 'Basic',
    coefficients: [2, -6], // 2x - 6 = 0, solution: x = 3
    expectedSolutions: 1,
    useCase: ['Linear algebra', 'Basic solving', 'Introduction'],
    difficulty: 'simple',
  },
  {
    id: 'cubic-equation',
    name: 'Cubic Equation',
    description: 'Simple cubic equation',
    type: 'cubic',
    category: 'Advanced',
    coefficients: [1, -6, 11, -6], // x³ - 6x² + 11x - 6 = 0, solutions: x = 1, 2, 3
    expectedSolutions: 3,
    useCase: ['Cubic equations', 'Advanced algebra', 'Multiple roots'],
    difficulty: 'complex',
  },
  {
    id: 'large-coefficients',
    name: 'Large Coefficients',
    description: 'Quadratic with large coefficients',
    type: 'quadratic',
    category: 'Numerical',
    coefficients: [100, -500, 600], // 100x² - 500x + 600 = 0
    expectedSolutions: 2,
    useCase: ['Numerical stability', 'Large numbers', 'Scaling'],
    difficulty: 'medium',
  },
  {
    id: 'small-coefficients',
    name: 'Small Coefficients',
    description: 'Quadratic with very small coefficients',
    type: 'quadratic',
    category: 'Numerical',
    coefficients: [0.001, -0.005, 0.006], // 0.001x² - 0.005x + 0.006 = 0
    expectedSolutions: 2,
    useCase: ['Precision', 'Small numbers', 'Numerical analysis'],
    difficulty: 'medium',
  },
]

// Custom hooks
const useEquationSolver = () => {
  const [solutions, setSolutions] = useState<EquationSolution[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const solveEquationWithType = useCallback(
    async (type: EquationType, coefficients: number[]): Promise<EquationSolution> => {
      setIsProcessing(true)
      try {
        const solution = solveEquation(type, coefficients)
        setSolutions((prev) => [solution, ...prev.slice(0, 99)]) // Keep last 100 solutions
        return solution
      } finally {
        setIsProcessing(false)
      }
    },
    []
  )

  const clearSolutions = useCallback(() => {
    setSolutions([])
  }, [])

  const removeSolution = useCallback((id: string) => {
    setSolutions((prev) => prev.filter((solution) => solution.id !== id))
  }, [])

  return {
    solutions,
    isProcessing,
    solveEquationWithType,
    clearSolutions,
    removeSolution,
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
const useEquationExport = () => {
  const exportSolution = useCallback((solution: EquationSolution, format: ExportFormat, filename?: string) => {
    let content = ''
    let mimeType = 'text/plain'
    let extension = '.txt'

    switch (format) {
      case 'json':
        content = JSON.stringify(solution, null, 2)
        mimeType = 'application/json'
        extension = '.json'
        break
      case 'csv':
        content = generateCSVFromSolution(solution)
        mimeType = 'text/csv'
        extension = '.csv'
        break
      case 'txt':
        content = generateTextFromSolution(solution)
        mimeType = 'text/plain'
        extension = '.txt'
        break
      case 'latex':
        content = generateLatexFromSolution(solution)
        mimeType = 'text/plain'
        extension = '.tex'
        break
      case 'mathml':
        content = generateMathMLFromSolution(solution)
        mimeType = 'application/mathml+xml'
        extension = '.mml'
        break
      default:
        content = generateTextFromSolution(solution)
        break
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename || `equation-solution-${solution.id}${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  return { exportSolution }
}

// Helper functions for export formats
const generateCSVFromSolution = (solution: EquationSolution): string => {
  const headers = ['Property', 'Value']
  const rows = [
    ['Equation Type', solution.equation.type],
    ['Expression', solution.equation.expression],
    ['Standard Form', solution.equation.standardForm],
    ['Number of Solutions', solution.metadata.numberOfSolutions.toString()],
    ['Solution Time (ms)', solution.metadata.solutionTime.toFixed(2)],
    ['Complexity', solution.metadata.complexity.toString()],
    ['Numerical Stability', solution.metadata.numericalStability.toFixed(3)],
  ]

  if (solution.metadata.discriminant !== undefined) {
    rows.push(['Discriminant', solution.metadata.discriminant.toString()])
  }

  // Add solutions
  solution.solutions.forEach((sol, index) => {
    rows.push([`Solution ${index + 1}`, sol.approximation || sol.value.toString()])
    rows.push([`Solution ${index + 1} Type`, sol.type])
    rows.push([`Solution ${index + 1} Multiplicity`, sol.multiplicity.toString()])
  })

  return [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n')
}

const generateTextFromSolution = (solution: EquationSolution): string => {
  return `Equation Solution Report - ${solution.timestamp.toLocaleString()}

=== EQUATION ===
Type: ${solution.equation.type.toUpperCase()}
Expression: ${solution.equation.expression}
Standard Form: ${solution.equation.standardForm}

=== SOLUTIONS ===
Number of Solutions: ${solution.metadata.numberOfSolutions}
${solution.solutions
  .map(
    (sol, index) =>
      `Solution ${index + 1}: ${sol.approximation || sol.value.toString()} (${sol.type}${sol.multiplicity > 1 ? `, multiplicity ${sol.multiplicity}` : ''})`
  )
  .join('\n')}

=== ANALYSIS ===
${solution.analysis.vertex ? `Vertex: (${formatNumber(solution.analysis.vertex.x)}, ${formatNumber(solution.analysis.vertex.y)})` : ''}
${solution.analysis.axisOfSymmetry !== undefined ? `Axis of Symmetry: x = ${formatNumber(solution.analysis.axisOfSymmetry)}` : ''}
${solution.analysis.yIntercept !== undefined ? `Y-Intercept: ${formatNumber(solution.analysis.yIntercept)}` : ''}
${solution.analysis.xIntercepts ? `X-Intercepts: ${solution.analysis.xIntercepts.map(formatNumber).join(', ')}` : ''}
Concavity: ${solution.analysis.concavity}
Domain: ${formatInterval(solution.analysis.domain)}
Range: ${formatInterval(solution.analysis.range)}

=== METADATA ===
Solution Time: ${solution.metadata.solutionTime.toFixed(2)} ms
Complexity: ${solution.metadata.complexity}
Numerical Stability: ${solution.metadata.numericalStability.toFixed(3)}
${solution.metadata.discriminant !== undefined ? `Discriminant: ${solution.metadata.discriminant}` : ''}
Solution Types: ${solution.metadata.solutionTypes.join(', ')}`
}

const generateLatexFromSolution = (solution: EquationSolution): string => {
  const equation = solution.equation
  let latexEquation = ''

  switch (equation.type) {
    case 'quadratic':
      const [a, b, c] = equation.coefficients
      latexEquation = `${a}x^2 ${b >= 0 ? '+' : ''}${b}x ${c >= 0 ? '+' : ''}${c} = 0`
      break
    case 'linear':
      const [a1, b1] = equation.coefficients
      latexEquation = `${a1}x ${b1 >= 0 ? '+' : ''}${b1} = 0`
      break
    case 'cubic':
      const [a2, b2, c2, d2] = equation.coefficients
      latexEquation = `${a2}x^3 ${b2 >= 0 ? '+' : ''}${b2}x^2 ${c2 >= 0 ? '+' : ''}${c2}x ${d2 >= 0 ? '+' : ''}${d2} = 0`
      break
  }

  return `\\documentclass{article}
\\usepackage{amsmath}
\\begin{document}

\\section{Equation Solution}

\\subsection{Equation}
\\[${latexEquation}\\]

\\subsection{Solutions}
\\begin{align}
${solution.solutions
  .map(
    (sol, index) =>
      `x_{${index + 1}} &= ${typeof sol.value === 'number' ? formatNumber(sol.value) : formatComplexNumber(sol.value as ComplexNumber)} \\\\`
  )
  .join('\n')}
\\end{align}

${
  solution.metadata.discriminant !== undefined
    ? `\\subsection{Discriminant}
\\[\\Delta = ${solution.metadata.discriminant}\\]`
    : ''
}

\\end{document}`
}

const generateMathMLFromSolution = (solution: EquationSolution): string => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<math xmlns="http://www.w3.org/1998/Math/MathML">
  <mrow>
    <mi>Equation:</mi>
    <mspace width="1em"/>
    <mtext>${solution.equation.expression}</mtext>
  </mrow>
</math>`
}

const formatInterval = (interval: Interval): string => {
  const leftBracket = interval.minInclusive ? '[' : '('
  const rightBracket = interval.maxInclusive ? ']' : ')'
  return `${leftBracket}${interval.min}, ${interval.max}${rightBracket}`
}

/**
 * Enhanced Quadratic Solver & Mathematical Equation Tool
 * Features: Advanced equation solving, multiple equation types, graphical analysis, and comprehensive mathematical analysis
 */
const QuadraticSolverCore = () => {
  const [activeTab, setActiveTab] = useState<'solver' | 'graph' | 'history' | 'templates' | 'settings'>('solver')
  const [equationType, setEquationType] = useState<EquationType>('quadratic')
  const [coefficients, setCoefficients] = useState<number[]>([1, 0, 0])
  const [currentSolution, setCurrentSolution] = useState<EquationSolution | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [graphSettings, setGraphSettings] = useState<GraphSettings>({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
    gridSize: 1,
    showGrid: true,
    showAxes: true,
    showLabels: true,
    resolution: 100,
  })

  const { solutions, isProcessing, solveEquationWithType, clearSolutions, removeSolution } = useEquationSolver()
  const { exportSolution } = useEquationExport()
  const { copyToClipboard, copiedText } = useCopyToClipboard()

  // Update coefficients when equation type changes
  useEffect(() => {
    const expectedCount = getExpectedCoefficientCount(equationType)
    if (coefficients.length !== expectedCount) {
      const newCoefficients = new Array(expectedCount).fill(0)
      newCoefficients[0] = 1 // Set leading coefficient to 1
      setCoefficients(newCoefficients)
    }
  }, [equationType])

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = equationTemplates.find((t) => t.id === templateId)
    if (template) {
      setEquationType(template.type)
      setCoefficients([...template.coefficients])
      setSelectedTemplate(templateId)
      toast.success(`Applied template: ${template.name}`)
    }
  }, [])

  // Solve equation
  const handleSolve = useCallback(async () => {
    const validation = validateEquationInput(equationType, coefficients)
    if (!validation.isValid) {
      toast.error(`Input error: ${validation.errors[0]?.message}`)
      return
    }

    try {
      const solution = await solveEquationWithType(equationType, coefficients)
      setCurrentSolution(solution)
      toast.success(`Equation solved successfully`)
    } catch (error) {
      toast.error('Failed to solve equation')
      console.error(error)
    }
  }, [equationType, coefficients, solveEquationWithType])

  // Auto-solve when coefficients change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSolve()
    }, 500)

    return () => clearTimeout(timer)
  }, [coefficients, equationType, handleSolve])

  // Update coefficient
  const updateCoefficient = useCallback((index: number, value: number) => {
    setCoefficients((prev) => {
      const newCoefficients = [...prev]
      newCoefficients[index] = value
      return newCoefficients
    })
  }, [])

  // Generate random equation
  const generateRandomEquation = useCallback(() => {
    const newCoefficients = coefficients.map(
      () => Math.floor(Math.random() * 21) - 10 // Random integer from -10 to 10
    )
    // Ensure leading coefficient is not zero
    if (newCoefficients[0] === 0) {
      newCoefficients[0] = 1
    }
    setCoefficients(newCoefficients)
    toast.success('Generated random equation')
  }, [coefficients.length])

  return (
    <div className="w-full mx-auto space-y-6">
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
              <SquareFunction className="h-5 w-5" aria-hidden="true" />
              Quadratic Solver & Mathematical Equation Tool
            </CardTitle>
            <CardDescription>
              Advanced mathematical equation solver with support for linear, quadratic, and cubic equations. Analyze
              mathematical properties, visualize graphs, and explore comprehensive solutions with detailed analysis. Use
              keyboard navigation: Tab to move between controls, Enter or Space to activate buttons.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="solver" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Solver
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Graph
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Equation Solver Tab */}
          <TabsContent value="solver" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Equation Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Variable className="h-5 w-5" />
                    Equation Setup
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="equation-type" className="text-sm font-medium">
                      Equation Type
                    </Label>
                    <Select value={equationType} onValueChange={(value) => setEquationType(value as EquationType)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear (ax + b = 0)</SelectItem>
                        <SelectItem value="quadratic">Quadratic (ax² + bx + c = 0)</SelectItem>
                        <SelectItem value="cubic">Cubic (ax³ + bx² + cx + d = 0)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Coefficients</Label>
                    {coefficients.map((coeff, index) => {
                      const labels = {
                        linear: ['a (coefficient of x)', 'b (constant)'],
                        quadratic: ['a (coefficient of x²)', 'b (coefficient of x)', 'c (constant)'],
                        cubic: [
                          'a (coefficient of x³)',
                          'b (coefficient of x²)',
                          'c (coefficient of x)',
                          'd (constant)',
                        ],
                      }

                      return (
                        <div key={index}>
                          <Label htmlFor={`coeff-${index}`} className="text-xs text-muted-foreground">
                            {labels[equationType as keyof typeof labels]?.[index] || `Coefficient ${index + 1}`}
                          </Label>
                          <Input
                            id={`coeff-${index}`}
                            type="number"
                            value={coeff}
                            onChange={(e) => updateCoefficient(index, parseFloat(e.target.value) || 0)}
                            className="mt-1"
                            step="any"
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSolve} disabled={isProcessing} className="flex-1">
                      {isProcessing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      ) : (
                        <Calculator className="mr-2 h-4 w-4" />
                      )}
                      {isProcessing ? 'Solving...' : 'Solve Equation'}
                    </Button>
                    <Button onClick={generateRandomEquation} variant="outline">
                      <Shuffle className="mr-2 h-4 w-4" />
                      Random
                    </Button>
                    <Button
                      onClick={() => {
                        const newCoefficients = new Array(coefficients.length).fill(0)
                        newCoefficients[0] = 1
                        setCoefficients(newCoefficients)
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
                      {equationTemplates
                        .filter((t) => t.type === equationType)
                        .slice(0, 4)
                        .map((template) => (
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

              {/* Solution Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Equal className="h-5 w-5" />
                    Solution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {currentSolution ? (
                    <div className="space-y-4">
                      {/* Equation Display */}
                      <div className="text-center p-4 rounded-lg border">
                        <div className="text-lg font-mono mb-2">{currentSolution.equation.expression}</div>
                        <div className="text-sm text-muted-foreground">
                          {currentSolution.equation.type.charAt(0).toUpperCase() +
                            currentSolution.equation.type.slice(1)}{' '}
                          Equation
                        </div>
                      </div>

                      {/* Solutions */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Solutions ({currentSolution.metadata.numberOfSolutions})
                        </Label>
                        {currentSolution.solutions.map((solution, index) => (
                          <div key={index} className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between items-center">
                              <div className="font-mono text-lg">
                                x{currentSolution.solutions.length > 1 ? `₍${index + 1}₎` : ''} ={' '}
                                {solution.approximation}
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    solution.type === 'real'
                                      ? 'bg-green-100 text-green-800'
                                      : solution.type === 'complex'
                                        ? 'bg-purple-100 text-purple-800'
                                        : solution.type === 'repeated'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  {solution.type}
                                </span>
                                {solution.multiplicity > 1 && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded">
                                    ×{solution.multiplicity}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {solution.isReal ? 'Real' : 'Complex'} • {solution.isRational ? 'Rational' : 'Irrational'}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Performance Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600">
                            {currentSolution.metadata.solutionTime.toFixed(2)}ms
                          </div>
                          <div className="text-xs text-muted-foreground">Solution Time</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{currentSolution.metadata.complexity}</div>
                          <div className="text-xs text-muted-foreground">Complexity</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600">
                            {currentSolution.metadata.numericalStability.toFixed(2)}
                          </div>
                          <div className="text-xs text-muted-foreground">Stability</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-purple-600">
                            {currentSolution.metadata.discriminant !== undefined
                              ? formatNumber(currentSolution.metadata.discriminant)
                              : 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground">Discriminant</div>
                        </div>
                      </div>

                      {/* Export Options */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button onClick={() => exportSolution(currentSolution, 'json')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          JSON
                        </Button>
                        <Button onClick={() => exportSolution(currentSolution, 'latex')} variant="outline" size="sm">
                          <Download className="mr-2 h-4 w-4" />
                          LaTeX
                        </Button>
                        <Button
                          onClick={() =>
                            copyToClipboard(
                              currentSolution.solutions.map((s) => s.approximation).join(', '),
                              'Solutions'
                            )
                          }
                          variant="outline"
                          size="sm"
                        >
                          {copiedText === 'Solutions' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <SquareFunction className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Solution</h3>
                      <p className="text-muted-foreground">Enter equation coefficients to see the solution</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analysis */}
            {currentSolution && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Mathematical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentSolution.analysis.vertex && (
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-sm mb-1">Vertex</div>
                        <div className="text-lg font-bold text-blue-600">
                          ({formatNumber(currentSolution.analysis.vertex.x)},{' '}
                          {formatNumber(currentSolution.analysis.vertex.y)})
                        </div>
                        <div className="text-xs text-muted-foreground">Turning point of parabola</div>
                      </div>
                    )}

                    {currentSolution.analysis.axisOfSymmetry !== undefined && (
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-sm mb-1">Axis of Symmetry</div>
                        <div className="text-lg font-bold text-green-600">
                          x = {formatNumber(currentSolution.analysis.axisOfSymmetry)}
                        </div>
                        <div className="text-xs text-muted-foreground">Line of symmetry</div>
                      </div>
                    )}

                    {currentSolution.analysis.yIntercept !== undefined && (
                      <div className="p-3 border rounded-lg">
                        <div className="font-medium text-sm mb-1">Y-Intercept</div>
                        <div className="text-lg font-bold text-orange-600">
                          {formatNumber(currentSolution.analysis.yIntercept)}
                        </div>
                        <div className="text-xs text-muted-foreground">Where graph crosses y-axis</div>
                      </div>
                    )}

                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Concavity</div>
                      <div className="text-lg font-bold text-purple-600 capitalize">
                        {currentSolution.analysis.concavity}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {currentSolution.analysis.concavity === 'up'
                          ? 'Opens upward'
                          : currentSolution.analysis.concavity === 'down'
                            ? 'Opens downward'
                            : 'Linear function'}
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Domain</div>
                      <div className="text-lg font-bold text-red-600">
                        {formatInterval(currentSolution.analysis.domain)}
                      </div>
                      <div className="text-xs text-muted-foreground">Valid x-values</div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Range</div>
                      <div className="text-lg font-bold text-indigo-600">
                        {formatInterval(currentSolution.analysis.range)}
                      </div>
                      <div className="text-xs text-muted-foreground">Possible y-values</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Graph Tab */}
          <TabsContent value="graph" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Function Graph
                </CardTitle>
                <CardDescription>Visual representation of the equation (simplified text-based graph)</CardDescription>
              </CardHeader>
              <CardContent>
                {currentSolution ? (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-lg font-mono mb-2">
                        y = {currentSolution.equation.expression.replace(' = 0', '')}
                      </div>
                      <div className="text-sm text-muted-foreground">Function representation</div>
                    </div>

                    {/* Graph Settings */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="x-min" className="text-sm">
                          X Min
                        </Label>
                        <Input
                          id="x-min"
                          type="number"
                          value={graphSettings.xMin}
                          onChange={(e) =>
                            setGraphSettings((prev) => ({ ...prev, xMin: parseFloat(e.target.value) || -10 }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="x-max" className="text-sm">
                          X Max
                        </Label>
                        <Input
                          id="x-max"
                          type="number"
                          value={graphSettings.xMax}
                          onChange={(e) =>
                            setGraphSettings((prev) => ({ ...prev, xMax: parseFloat(e.target.value) || 10 }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="y-min" className="text-sm">
                          Y Min
                        </Label>
                        <Input
                          id="y-min"
                          type="number"
                          value={graphSettings.yMin}
                          onChange={(e) =>
                            setGraphSettings((prev) => ({ ...prev, yMin: parseFloat(e.target.value) || -10 }))
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="y-max" className="text-sm">
                          Y Max
                        </Label>
                        <Input
                          id="y-max"
                          type="number"
                          value={graphSettings.yMax}
                          onChange={(e) =>
                            setGraphSettings((prev) => ({ ...prev, yMax: parseFloat(e.target.value) || 10 }))
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Key Points */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Key Points</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {currentSolution.analysis.vertex && (
                          <div className="p-2 bg-blue-50 rounded">
                            <strong>Vertex:</strong> ({formatNumber(currentSolution.analysis.vertex.x)},{' '}
                            {formatNumber(currentSolution.analysis.vertex.y)})
                          </div>
                        )}
                        {currentSolution.analysis.yIntercept !== undefined && (
                          <div className="p-2 bg-green-50 rounded">
                            <strong>Y-Intercept:</strong> (0, {formatNumber(currentSolution.analysis.yIntercept)})
                          </div>
                        )}
                        {currentSolution.analysis.xIntercepts && currentSolution.analysis.xIntercepts.length > 0 && (
                          <div className="p-2 bg-orange-50 rounded">
                            <strong>X-Intercepts:</strong>{' '}
                            {currentSolution.analysis.xIntercepts.map((x) => `(${formatNumber(x)}, 0)`).join(', ')}
                          </div>
                        )}
                        {currentSolution.analysis.axisOfSymmetry !== undefined && (
                          <div className="p-2 bg-purple-50 rounded">
                            <strong>Axis of Symmetry:</strong> x ={' '}
                            {formatNumber(currentSolution.analysis.axisOfSymmetry)}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center text-sm text-muted-foreground p-4 border rounded-lg">
                      📊 Interactive graphing visualization would be displayed here in a full implementation
                      <br />
                      Consider integrating with libraries like D3.js, Chart.js, or Plotly for interactive graphs
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <LineChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Function to Graph</h3>
                    <p className="text-muted-foreground">Solve an equation first to see its graph</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Solution History</CardTitle>
                <CardDescription>View and manage your equation solving history</CardDescription>
              </CardHeader>
              <CardContent>
                {solutions.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {solutions.length} solution{solutions.length !== 1 ? 's' : ''} in history
                      </span>
                      <Button onClick={clearSolutions} variant="outline" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Clear History
                      </Button>
                    </div>

                    {solutions.map((solution) => (
                      <div key={solution.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-sm">
                            {solution.equation.expression} - {solution.timestamp.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-muted rounded">{solution.equation.type}</span>
                            <Button size="sm" variant="ghost" onClick={() => removeSolution(solution.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm">
                            <strong>Solutions:</strong> {solution.solutions.map((s) => s.approximation).join(', ')}
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-xs text-center">
                            <div>
                              <div className="font-medium">{solution.metadata.solutionTime.toFixed(2)}ms</div>
                              <div className="text-muted-foreground">Time</div>
                            </div>
                            <div>
                              <div className="font-medium">{solution.metadata.numberOfSolutions}</div>
                              <div className="text-muted-foreground">Solutions</div>
                            </div>
                            <div>
                              <div className="font-medium">{solution.metadata.complexity}</div>
                              <div className="text-muted-foreground">Complexity</div>
                            </div>
                            <div>
                              <div className="font-medium">{solution.metadata.numericalStability.toFixed(2)}</div>
                              <div className="text-muted-foreground">Stability</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEquationType(solution.equation.type)
                              setCoefficients([...solution.equation.coefficients])
                              setCurrentSolution(solution)
                              setActiveTab('solver')
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => exportSolution(solution, 'json')}>
                            <Download className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              copyToClipboard(solution.solutions.map((s) => s.approximation).join(', '), 'Solutions')
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
                    <p className="text-muted-foreground">Solve some equations to see them here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Equation Templates</CardTitle>
                <CardDescription>Pre-built equation examples for learning and testing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {equationTemplates.map((template) => (
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
                                template.difficulty === 'simple'
                                  ? 'bg-green-100 text-green-800'
                                  : template.difficulty === 'medium'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {template.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <div>
                          <div className="text-xs font-medium mb-1">Type:</div>
                          <div className="text-xs text-muted-foreground capitalize">{template.type}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Expected Solutions:</div>
                          <div className="text-xs text-muted-foreground">{template.expectedSolutions}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium mb-1">Use Cases:</div>
                          <div className="text-xs text-muted-foreground">{template.useCase.join(', ')}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Solver Settings</CardTitle>
                <CardDescription>Configure equation solving preferences and display options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Precision Settings */}
                <div className="space-y-4">
                  <h4 className="font-medium">Precision & Display</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Solutions are displayed with up to 6 decimal places for clarity</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Very small numbers (&lt; 1e-10) are treated as zero</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Complex numbers are displayed in standard a + bi format</div>
                    </div>
                  </div>
                </div>

                {/* Algorithm Information */}
                <div className="space-y-4">
                  <h4 className="font-medium">Solving Methods</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Quadratic Formula</h5>
                      <p className="text-xs text-muted-foreground">
                        Uses the standard quadratic formula: x = (-b ± √(b² - 4ac)) / 2a
                        <br />
                        Handles all cases including complex solutions when discriminant is negative.
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Cubic Equations</h5>
                      <p className="text-xs text-muted-foreground">
                        Uses Cardano's method for cubic equations with trigonometric solutions for three real roots.
                        <br />
                        Automatically handles degenerate cases (when leading coefficient is zero).
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-medium text-sm mb-2">Numerical Stability</h5>
                      <p className="text-xs text-muted-foreground">
                        Monitors solution stability and warns about potential numerical issues.
                        <br />
                        Provides quality scores based on coefficient magnitudes and solution accuracy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mathematical Properties */}
                <div className="space-y-4">
                  <h4 className="font-medium">Analysis Features</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Automatic detection of rational vs. irrational solutions</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Complete analysis of quadratic functions (vertex, axis of symmetry, etc.)</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Domain and range calculation for all equation types</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-pink-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div>Performance metrics including solution time and complexity</div>
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
const QuadraticSolver = () => {
  return <QuadraticSolverCore />
}

export default QuadraticSolver
