// Quadratic Solver 相关类型声明
export interface EquationSolution {
  id: string
  equation: Equation
  solutions: Solution[]
  metadata: SolutionMetadata
  analysis: EquationAnalysis
  timestamp: Date
}

export interface Equation {
  type: EquationType
  coefficients: number[]
  variables: string[]
  expression: string
  standardForm: string
}

export interface Solution {
  type: SolutionType
  value: number | ComplexNumber
  multiplicity: number
  isReal: boolean
  isRational: boolean
  approximation?: string
}

export interface ComplexNumber {
  real: number
  imaginary: number
  magnitude: number
  argument: number
}

export interface SolutionMetadata {
  solutionTime: number
  discriminant?: number
  numberOfSolutions: number
  solutionTypes: SolutionType[]
  complexity: number
  numericalStability: number
}

export interface EquationAnalysis {
  vertex?: Point2D
  axisOfSymmetry?: number
  yIntercept?: number
  xIntercepts?: number[]
  domain: Interval
  range: Interval
  concavity: 'up' | 'down' | 'none'
  extrema: Extremum[]
  inflectionPoints: Point2D[]
  asymptotes: Asymptote[]
}

export interface Point2D {
  x: number
  y: number
}

export interface Interval {
  min: number | '-∞'
  max: number | '∞'
  minInclusive: boolean
  maxInclusive: boolean
}

export interface Extremum {
  type: 'minimum' | 'maximum'
  point: Point2D
  isGlobal: boolean
}

export interface Asymptote {
  type: 'vertical' | 'horizontal' | 'oblique'
  equation: string
  value?: number
}

export interface EquationTemplate {
  id: string
  name: string
  description: string
  type: EquationType
  category: string
  coefficients: number[]
  expectedSolutions: number
  useCase: string[]
  difficulty: 'simple' | 'medium' | 'complex'
}

export interface EquationValidation {
  isValid: boolean
  errors: EquationError[]
  warnings: string[]
  suggestions: string[]
  qualityScore: number
}

export interface EquationError {
  message: string
  type: 'coefficient' | 'structure' | 'numerical' | 'mathematical'
  severity: 'error' | 'warning' | 'info'
  coefficient?: string
}

export interface GraphSettings {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  gridSize: number
  showGrid: boolean
  showAxes: boolean
  showLabels: boolean
  resolution: number
}

// Enums
export type EquationType =
  | 'quadratic'
  | 'linear'
  | 'cubic'
  | 'quartic'
  | 'polynomial'
  | 'rational'
  | 'exponential'
  | 'logarithmic'
  | 'trigonometric'
export type SolutionType = 'real' | 'complex' | 'rational' | 'irrational' | 'repeated'
export type ExportFormat = 'json' | 'csv' | 'txt' | 'xml' | 'yaml' | 'latex' | 'mathml'
